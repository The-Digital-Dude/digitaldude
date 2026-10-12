"use client";

import { CheckCircle2, TriangleAlert } from "lucide-react";
import { input, type BasisDraft } from "./poolShared";

export type Reason = "" | "published" | "relationship" | "asked";
export interface QuickState { reason: Reason; evidenceUrl: string; note: string }
export const emptyQuick = (): QuickState => ({ reason: "", evidenceUrl: "", note: "" });

export const REASONS: { value: Exclude<Reason, "">; label: string }[] = [
  { value: "published", label: "Their address is published on their website for business contact" },
  { value: "relationship", label: "We already know each other / have worked together" },
  { value: "asked", label: "They asked to hear from us" },
];

/** What a verified AI draft turns into: reason "published", the page it was found on, and the AI's sentence as the note. */
export function quickFromDraft(d: BasisDraft): QuickState {
  return { reason: "published", evidenceUrl: d.evidenceUrl ?? "", note: d.legalBasis };
}

/** Request body for the server: the rep's reason plus optional link and note. Returns null until a reason is chosen. */
export function quickBody(q: QuickState): { reason: string; evidenceUrl?: string; note?: string } | null {
  if (!q.reason) return null;
  return { reason: q.reason, ...(q.evidenceUrl.trim() ? { evidenceUrl: q.evidenceUrl.trim() } : {}), ...(q.note.trim() ? { note: q.note.trim() } : {}) };
}

/**
 * The one-click basis form: pick why you may contact them (or accept the AI's verified finding), optionally add a link
 * or note, and save. The server writes the formal record from this choice.
 */
export function QuickBasisFields({ value, onChange, draft, sourceUrl }: { value: QuickState; onChange: (v: QuickState) => void; draft?: BasisDraft; sourceUrl?: string | null }) {
  return (
    <div className="space-y-2 text-xs">
      {draft && (draft.verified ? (
        <p className="flex items-center gap-1.5 text-[11px] text-emerald-300"><CheckCircle2 size={12} /> AI found this address on <a className="underline" href={draft.evidenceUrl ?? "#"} target="_blank" rel="noopener noreferrer">their website</a>. Check it, then confirm.</p>
      ) : (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-300"><TriangleAlert size={12} className="mt-0.5 shrink-0" /> {draft.warning}</p>
      ))}
      <select className={input} value={value.reason} onChange={(e) => onChange({ ...value, reason: e.target.value as Reason })} aria-label="Why you may contact them">
        <option value="">Why may you contact them? Choose one…</option>
        {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
      </select>
      {value.reason === "published" && (
        <input className={input} value={value.evidenceUrl} onChange={(e) => onChange({ ...value, evidenceUrl: e.target.value })} placeholder={sourceUrl ? `Link to the page (default: ${sourceUrl})` : "Link to the page where you saw it (https://…)"} />
      )}
      <textarea className={input} rows={1} value={value.note} onChange={(e) => onChange({ ...value, note: e.target.value })} placeholder="Optional note" />
    </div>
  );
}
