import type { Db } from "../db";
import { normalizeEmail } from "../normalize";
import { verifyEmail, type CheckStatus, type EmailCheck } from "./email";

export interface CheckSummary {
  status: CheckStatus;
  reason: string;
  source: "builtin" | "reacher";
  checkedAt: string;
}

/** What is saved for these addresses (no new lookups). Unchecked addresses are simply absent from the result. */
export async function loadChecks(db: Db, emails: string[]): Promise<Record<string, CheckSummary>> {
  const list = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  if (list.length === 0) return {};
  const { data } = await db.from("acq_email_checks").select("email_normalized,status,reason,source,checked_at").in("email_normalized", list);
  const out: Record<string, CheckSummary> = {};
  for (const r of (data ?? []) as { email_normalized: string; status: CheckStatus; reason: string; source: "builtin" | "reacher"; checked_at: string }[]) {
    out[r.email_normalized] = { status: r.status, reason: r.reason, source: r.source, checkedAt: r.checked_at };
  }
  return out;
}

/** Verifies several addresses, a few at a time. A failure on one never stops the rest. */
export async function verifyMany(db: Db, emails: string[], opts: { force?: boolean; concurrency?: number } = {}): Promise<EmailCheck[]> {
  const queue = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  const out: EmailCheck[] = [];
  await Promise.all(
    Array.from({ length: Math.min(opts.concurrency ?? 4, queue.length) }, async () => {
      for (let e = queue.shift(); e; e = queue.shift()) {
        try {
          out.push(await verifyEmail(db, e, { force: opts.force }));
        } catch {
          /* skip: it stays unchecked */
        }
      }
    })
  );
  return out;
}
