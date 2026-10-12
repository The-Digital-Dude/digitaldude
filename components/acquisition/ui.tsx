import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold text-navy">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-navy/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  purple: "bg-lavender text-purple ring-tint",
};

export function Badge({ tone = "slate", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", TONES[tone])}>{children}</span>;
}

export function statusTone(status: string): keyof typeof TONES {
  if (["eligible", "approved", "active", "researched", "qualified", "delivered", "sent", "interested", "scheduled", "attended", "succeeded"].includes(status)) return "green";
  if (["needs_review", "pending_approval", "paused", "uncertain", "pending", "draft", "researching", "running", "link_sent"].includes(status)) return "amber";
  if (["blocked", "suppressed", "rejected", "opt_out", "bounced", "failed", "cancelled", "opted_out", "no_show"].includes(status)) return "red";
  return "slate";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.replace(/_/g, " ")}</Badge>;
}

export function Stat({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: string; href?: string }) {
  const body = (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-purple/40">
      <div className="text-xs font-semibold uppercase tracking-wide text-navy/50">{label}</div>
      <div className="mt-1 text-2xl font-extrabold text-navy">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-navy/50">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-navy placeholder:text-slate-400 focus:border-purple focus:outline-none focus:ring-2 focus:ring-purple/20";
export const labelCls = "mb-1 block text-xs font-semibold text-navy/70";
export const btnCls = "inline-flex items-center justify-center gap-2 rounded-lg bg-purple px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple/90 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhostCls = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";
export const btnDangerCls = "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-navy/50">{children}</p>;
}

export const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }) : "—";
