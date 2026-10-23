import { NextResponse } from "next/server";
import { fail, repContext } from "@/lib/crm/api";
import { COLLEAGUE_MESSAGE } from "@/lib/crm/leads";
import { MAX_IMPORT_ROWS, parseCsvText, planImport, type PlannedRow } from "@/lib/crm/csv";
import { verifyMany, loadChecks } from "@/lib/acquisition/verify/bulk";
import { safely } from "@/lib/crm/activity";
import { computeScores, type ScoredLead } from "@/lib/crm/refresh";
import { recordRepAuditLog } from "@/lib/repAudit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 600_000;

type Outcome = "add" | "skip" | "invalid";
interface ResultRow { line: number; email?: string; outcome: Outcome; reason?: string; warning?: string }

/**
 * Bulk-adds leads from a CSV. With commit=false it only checks (nothing is saved) and reports what would happen to each row;
 * with commit=true it verifies the email addresses and saves the rest. A contact a colleague already has, a duplicate of the rep's own
 * lead, a person on the do-not-contact list and an address that cannot receive mail are all skipped with the reason.
 */
export async function POST(request: Request) {
  try {
    const ctx = await repContext(request);
    if ("response" in ctx) return ctx.response;
    const { rep, db } = ctx;

    const body = (await request.json().catch(() => null)) as {
      csv?: unknown;
      commit?: unknown;
      mapping?: Record<string, string>;
    } | null;
    if (!body || typeof body.csv !== "string" || !body.csv.trim()) return fail("Choose a CSV file first.");
    if (body.csv.length > MAX_BYTES) return fail("That file is too large. Import up to 300 leads at a time.");
    const commit = body.commit === true;
    const mapping = body.mapping && typeof body.mapping === "object" ? body.mapping : undefined;

    const plan = planImport(parseCsvText(body.csv), { currency: rep.currency || undefined }, mapping);
    if (plan.error) return fail(plan.error);

    const results: ResultRow[] = [];
    const candidates: PlannedRow[] = [];
    for (const r of plan.rows) {
      if (!r.ok) results.push({ line: r.line, email: r.email, outcome: "invalid", reason: r.reason });
      else candidates.push(r);
    }

    // Who already has these addresses (own leads vs colleagues' leads), and who must not be contacted.
    const emails = candidates.map((c) => c.email!);
    const owners = new Map<string, string>();
    const blocked = new Set<string>();
    for (let i = 0; i < emails.length; i += 150) {
      const part = emails.slice(i, i + 150);
      const { data: existing } = await db.from("rep_leads").select("email,employee_id").in("email", part).is("anonymized_at", null);
      for (const e of (existing ?? []) as { email: string; employee_id: string }[]) owners.set(e.email.toLowerCase(), e.employee_id);
      const { data: sup } = await db.from("acq_suppressions").select("normalized_email").in("normalized_email", part);
      for (const s of (sup ?? []) as { normalized_email: string }[]) blocked.add(s.normalized_email);
    }

    const toAdd: PlannedRow[] = [];
    for (const c of candidates) {
      const owner = owners.get(c.email!);
      if (owner === rep.id) results.push({ line: c.line, email: c.email, outcome: "skip", reason: "Already in your leads" });
      else if (owner) results.push({ line: c.line, email: c.email, outcome: "skip", reason: COLLEAGUE_MESSAGE });
      else if (blocked.has(c.email!)) results.push({ line: c.line, email: c.email, outcome: "skip", reason: "On the do-not-contact list" });
      else toAdd.push(c);
    }

    // Check the addresses (commit) or show what is already known about them (preview).
    if (commit) await verifyMany(db, toAdd.map((c) => c.email!));
    const checks = await loadChecks(db, toAdd.map((c) => c.email!)).catch(() => ({}) as Awaited<ReturnType<typeof loadChecks>>);

    const accepted: PlannedRow[] = [];
    for (const c of toAdd) {
      const check = checks[c.email!];
      if (check?.status === "invalid") results.push({ line: c.line, email: c.email, outcome: "invalid", reason: `Email cannot receive mail: ${check.reason}` });
      else {
        accepted.push(c);
        results.push({ line: c.line, email: c.email, outcome: "add", warning: check?.status === "risky" ? `Risky address: ${check.reason}` : undefined });
      }
    }
    results.sort((a, b) => a.line - b.line);

    let added = 0;
    if (commit && accepted.length > 0) {
      const now = new Date().toISOString();
      const payload = accepted.map((c) => {
        const lead = c.lead ?? {};
        const tags = Array.isArray(lead.tags) ? lead.tags : [];
        return {
          stage: "new",
          status: "new",
          estimated_deal_value: 0,
          ...lead,
          tags,
          employee_id: rep.id,
          email: c.email,
          created_at: now,
          updated_at: now,
        };
      });
      const { data: inserted, error } = await db.from("rep_leads").insert(payload).select("*");
      if (error) return fail(`Could not save the leads: ${error.message}`, 500);
      added = inserted?.length ?? 0;
      const rows = (inserted ?? []) as (ScoredLead & { id: string })[];
      await db.from("rep_lead_activities").insert(rows.map((l) => ({ lead_id: l.id, employee_id: rep.id, type: "created", summary: "Imported from a CSV file" })));
      await safely("score imported leads", () => computeScores(db, rows, new Date()));
      await recordRepAuditLog({ employeeId: rep.id, actionType: "lead_created", description: `Imported ${added} leads from a CSV file.`, metadata: { added, skipped: results.length - added } });
    }

    const count = (o: Outcome) => results.filter((r) => r.outcome === o).length;
    return NextResponse.json({ ok: true, committed: commit, summary: { total: results.length, willAdd: count("add"), skipped: count("skip"), invalid: count("invalid"), added, max: MAX_IMPORT_ROWS }, rows: results, unmappedColumns: plan.unmapped });
  } catch {
    return fail("The import failed. Nothing was half-saved: try again.", 500);
  }
}
