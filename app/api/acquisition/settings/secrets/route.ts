import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { unsubscribeSecret } from "@/lib/acquisition/env";
import { clearSecret, getSecret, saveSecret, SECRETS } from "@/lib/acquisition/secrets";
import { ContactFinderHttpError, HunterProvider } from "@/lib/acquisition/providers/contacts";
import { BraveSearchProvider } from "@/lib/acquisition/providers/search";

export const dynamic = "force-dynamic";

const body = z.object({
  name: z.enum(["hunter", "brave"]),
  action: z.enum(["save", "test", "clear"]),
  apiKey: z.string().trim().max(500).optional(),
});

function explain(e: unknown, label: string): string {
  if (e instanceof ContactFinderHttpError) {
    if (e.status === 401 || e.status === 403) return `${label} rejected the key. Check it was copied correctly.`;
    if (e.status === 429) return `${label} says the quota or rate limit is used up right now.`;
    return `${label} returned an error (HTTP ${e.status}). ${e.detail}`.trim();
  }
  const m = e instanceof Error ? e.message : String(e);
  if (/Search API error 401|Search API error 403|422/.test(m)) return `${label} rejected the key. Check it was copied correctly.`;
  if (/Search API error 429/.test(m)) return `${label} says the quota or rate limit is used up right now.`;
  if (/timed out|timeout|aborted/i.test(m)) return `${label} did not respond in time.`;
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(m)) return `Could not reach ${label}.`;
  return m;
}

/** Save, test or remove a third-party API key. Keys are stored encrypted and never returned. A test uses the typed key, else the saved/env one. */
export const POST = adminRoute("secret settings", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const { name, action, apiKey } = parsed.data;
  const label = SECRETS[name].label;

  if (action === "clear") {
    await clearSecret(db, name);
    await logAudit(db, "secret.cleared", "settings", null, { name });
    return NextResponse.json({ ok: true });
  }

  if (action === "save") {
    if (!apiKey) return jsonError("Paste the API key first", 422);
    try {
      unsubscribeSecret(); // the encryption key is derived from it
      await saveSecret(db, name, apiKey);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Could not save", 422);
    }
    await logAudit(db, "secret.saved", "settings", null, { name });
    return NextResponse.json({ ok: true });
  }

  const key = apiKey || (await getSecret(db, name));
  if (!key) return jsonError(`Enter a ${label} API key to test`, 422);
  try {
    if (name === "hunter") {
      const a = await new HunterProvider(key).account();
      const quota = a.searchesAvailable !== null && a.searchesUsed !== null ? ` ${a.searchesUsed} of ${a.searchesAvailable} monthly searches used.` : "";
      return NextResponse.json({ ok: true, message: `Connected to Hunter (${a.plan} plan).${quota}` });
    }
    const r = await new BraveSearchProvider(key).search("property management", 1);
    return NextResponse.json({ ok: true, message: `Connected to Brave Search (${r.length} result returned).` });
  } catch (e) {
    return NextResponse.json({ ok: false, error: explain(e, label) });
  }
});
