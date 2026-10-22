export const card = "rounded-2xl border border-white/[0.08] bg-[#131B2E] p-4";
export const input = "w-full rounded-xl bg-[#0B1120] border border-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-purple focus:ring-2 focus:ring-purple/20";
export const btn = "rounded-xl bg-purple px-3.5 py-2 text-xs font-bold text-white hover:brightness-110 disabled:opacity-50 transition";
export const btnGhost = "rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50 transition";

export type CallResult = { ok: boolean; error?: string; issues?: { message: string }[]; [k: string]: unknown };

export async function call(url: string, method: string, body?: unknown): Promise<CallResult> {
  try {
    const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: method === "GET" ? undefined : JSON.stringify(body ?? {}) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok && data.ok !== false, ...data } as CallResult;
  } catch {
    return { ok: false, error: "Network error" };
  }
}

export function Msg({ error, note }: { error?: string | null; note?: string | null }) {
  if (error) return <p className="mt-2 rounded-lg bg-rose-500/10 p-2.5 text-[11px] text-rose-300" role="alert">{error}</p>;
  if (note) return <p className="mt-2 rounded-lg bg-emerald-500/10 p-2.5 text-[11px] text-emerald-300" role="status">{note}</p>;
  return null;
}

export interface EmailCheckInfo { status: "safe" | "risky" | "invalid" | "unknown"; reason: string; source: "builtin" | "reacher" }

/** Small chip showing whether an address can receive mail. "Domain OK" means the domain accepts mail but the mailbox is unconfirmed. */
export function EmailBadge({ check }: { check?: EmailCheckInfo | null }) {
  if (!check) return <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500" title="Not checked yet">unchecked</span>;
  const map = {
    safe: check.source === "reacher" ? ["verified", "bg-emerald-500/15 text-emerald-300"] : ["domain OK", "bg-emerald-500/10 text-emerald-300"],
    risky: ["risky", "bg-amber-500/15 text-amber-300"],
    invalid: ["invalid", "bg-rose-500/15 text-rose-300"],
    unknown: ["unknown", "bg-white/5 text-slate-400"],
  } as const;
  const [label, cls] = map[check.status];
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${cls}`} title={check.reason}>{label}</span>;
}

/** What the AI drafter returns for one contact (see /api/rep/pool/basis/draft). */
export interface BasisDraft {
  contactId: string;
  email: string;
  consentType: "express" | "inferred_publication" | "existing_relationship";
  legalBasis: string;
  evidenceUrl: string | null;
  evidenceNotes: string;
  verified: boolean;
  checkedPages: string[];
  warning: string | null;
}
