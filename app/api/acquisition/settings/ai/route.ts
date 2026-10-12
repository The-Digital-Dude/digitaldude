import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute } from "@/lib/acquisition/route";
import { jsonError, parseBody } from "@/lib/acquisition/http";
import { logAudit } from "@/lib/acquisition/audit";
import { clearAiConfig, configForTest, saveAiConfig, testAiConnection, validateBaseUrl } from "@/lib/acquisition/ai-config";
import { unsubscribeSecret } from "@/lib/acquisition/env";

export const dynamic = "force-dynamic";

const field = (max: number) => z.string().trim().max(max);
const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), baseUrl: field(500).min(1), model: field(120).min(1), apiKey: field(500).optional() }),
  z.object({ action: z.literal("test"), baseUrl: field(500).optional(), model: field(120).optional(), apiKey: field(500).optional() }),
  z.object({ action: z.literal("clear") }),
]);

/**
 * Save, test or remove the AI provider config. The key is stored encrypted and never returned.
 * "test" makes one tiny request using the typed values (blanks fall back to the saved/env config).
 */
export const POST = adminRoute("ai settings", async (request, { db }) => {
  const parsed = await parseBody(request, body);
  if ("error" in parsed) return parsed.error;
  const b = parsed.data;

  if (b.action === "clear") {
    await clearAiConfig(db);
    await logAudit(db, "ai.config_cleared", "settings", null, {});
    return NextResponse.json({ ok: true });
  }

  if (b.action === "save") {
    try {
      unsubscribeSecret(); // the encryption key is derived from it
      validateBaseUrl(b.baseUrl);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Invalid settings", 422);
    }
    try {
      await saveAiConfig(db, b);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Could not save", 422);
    }
    await logAudit(db, "ai.config_saved", "settings", null, { model: b.model });
    return NextResponse.json({ ok: true });
  }

  const cfg = await configForTest(db, b);
  if ("error" in cfg) return jsonError(cfg.error, 422);
  const result = await testAiConnection(cfg);
  return NextResponse.json({ ok: result.ok, message: result.message, error: result.ok ? undefined : result.message });
});
