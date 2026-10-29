import { describe, it, expect } from "vitest";
import { followUpReasons, type FollowUpFacts } from "@/lib/crm/followups";
import { applyFilters, type CrmLead } from "@/components/rep/crm/shared";

const now = new Date("2026-11-02T10:00:00");
const facts = (over: Partial<Omit<FollowUpFacts, "tasks">> & { tasks?: Partial<FollowUpFacts["tasks"]> } = {}): FollowUpFacts => {
  const { tasks, ...rest } = over;
  return { stale: false, needsNextStep: false, closed: false, ...rest, tasks: { open: 0, nextDue: null, nextTitle: null, hasRespondTask: false, ...tasks } };
};

describe("which leads need a follow-up", () => {
  it("is empty for a lead with a task scheduled for later", () => {
    expect(followUpReasons(facts({ tasks: { open: 1, nextDue: "2026-11-05T09:00:00", nextTitle: "Call" } }), now)).toEqual([]);
  });
  it("flags overdue, due today, no next step and gone quiet", () => {
    expect(followUpReasons(facts({ tasks: { open: 1, nextDue: "2026-11-01T09:00:00" } }), now)).toEqual(["overdue"]);
    expect(followUpReasons(facts({ tasks: { open: 1, nextDue: "2026-11-02T17:00:00" } }), now)).toEqual(["due_today"]);
    expect(followUpReasons(facts({ needsNextStep: true }), now)).toEqual(["no_next_step"]);
    expect(followUpReasons(facts({ stale: true }), now)).toEqual(["quiet"]);
  });
  it("keeps every reason, most urgent first, and a reply the team is answering is not the rep's to-do", () => {
    expect(followUpReasons(facts({ stale: true, needsNextStep: true, tasks: { open: 1, nextDue: "2026-11-01T09:00:00", hasRespondTask: true } }), now)).toEqual(["overdue", "no_next_step", "quiet"]);
    expect(followUpReasons(facts({ tasks: { open: 1, nextDue: null, hasRespondTask: true } }), now)).toEqual([]);
  });
  it("never flags a closed lead", () => {
    expect(followUpReasons(facts({ closed: true, stale: true, needsNextStep: true, tasks: { open: 1, nextDue: "2026-11-01T09:00:00", hasRespondTask: true } }), now)).toEqual([]);
  });
});

describe("the Leads CRM follow-up filter", () => {
  const lead = (id: string, follow_up_reasons: CrmLead["follow_up_reasons"]) => ({ id, full_name: id, email: `${id}@x.com`, follow_up_reasons }) as unknown as CrmLead;
  const leads = [lead("a", ["quiet", "overdue"]), lead("b", ["quiet"]), lead("c", [])];
  it("filters by reason, or by any reason", () => {
    expect(applyFilters(leads, { followUp: "any" }).map((l) => l.id)).toEqual(["a", "b"]);
    expect(applyFilters(leads, { followUp: "overdue" }).map((l) => l.id)).toEqual(["a"]);
    expect(applyFilters(leads, {}).map((l) => l.id)).toEqual(["a", "b", "c"]);
  });
});
