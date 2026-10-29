/** Why a lead needs the rep's attention now. A lead can have several reasons; `primary` is the most urgent one. */
export const FOLLOW_UP_REASONS = ["overdue", "due_today", "no_next_step", "quiet"] as const;
export type FollowUpReason = (typeof FOLLOW_UP_REASONS)[number];

export const FOLLOW_UP_LABELS: Record<FollowUpReason, string> = {
  overdue: "Task overdue",
  due_today: "Due today",
  no_next_step: "No next step",
  quiet: "Gone quiet",
};

export interface FollowUpTaskInfo {
  open: number;
  /** Soonest open task. */
  nextDue: string | null;
  nextTitle: string | null;
  /** The lead replied and the team is answering: shown to the rep, but not their to-do. */
  hasRespondTask: boolean;
}

export interface FollowUpFacts {
  tasks: FollowUpTaskInfo;
  stale: boolean;
  needsNextStep: boolean;
  /** A closed lead (won, lost, unqualified) never needs a follow-up. */
  closed: boolean;
}

const endOfDay = (now: Date) => {
  const d = new Date(now);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

/** Every reason this lead needs attention, most urgent first. Empty when nothing is needed. */
export function followUpReasons(f: FollowUpFacts, now: Date): FollowUpReason[] {
  if (f.closed) return [];
  const out: FollowUpReason[] = [];
  const due = f.tasks.nextDue ? Date.parse(f.tasks.nextDue) : null;
  if (due !== null && due < now.getTime()) out.push("overdue");
  else if (due !== null && due <= endOfDay(now)) out.push("due_today");
  if (f.needsNextStep) out.push("no_next_step");
  if (f.stale) out.push("quiet");
  return out;
}
