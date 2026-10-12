import { describe, it, expect, vi, afterEach } from "vitest";
import { scheduleFollowUps } from "@/lib/acquisition/queue/followups";
import { fakeDb } from "./helpers/fakedb";

afterEach(() => vi.unstubAllEnvs());

const campaign = {
  id: "camp1", sender_name: "Neil", sender_business: "The Digital Dude", sender_postal_address: "Dhanmondi, Dhaka, Bangladesh", sender_email: "neil@digitaldude.co.uk",
  subject_template: "Hello", followup_body_template: "Hi {{first_name}}, a quick follow-up for {{company_name}}.",
};
const contact = { id: "ct1", name: "Dan Lee", email: "dan@plum.com.au", acq_companies: { name: "Plum Property" } };

function setup(created = true) {
  return fakeDb(
    { acq_campaigns: [campaign], acq_contacts: [contact], acq_audit_logs: [] },
    { rpc: { acq_due_followups: () => [{ lead_id: "l1", campaign_id: "camp1", contact_id: "ct1", initial_subject: "Hello Plum" }], acq_create_followup: () => created } }
  );
}

describe("scheduleFollowUps", () => {
  it("renders the approved follow-up template with a signed unsubscribe link and the sender identity, then creates it", async () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "s".repeat(32));
    const { db, rpcCalls } = setup();
    expect(await scheduleFollowUps(db)).toBe(1);
    const create = rpcCalls.find((c) => c.name === "acq_create_followup")!;
    expect(create.args.p_lead_id).toBe("l1");
    expect(create.args.p_subject).toBe("Following up: Hello Plum");
    const body = String(create.args.p_body);
    expect(body).toContain("Hi Dan, a quick follow-up for Plum Property.");
    expect(body).toContain("Dhanmondi, Dhaka, Bangladesh");
    expect(body).toMatch(/unsubscribe here: https?:\/\/\S+t=/);
  });

  it("counts only follow-ups the database actually created", async () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "s".repeat(32));
    expect(await scheduleFollowUps(setup(false).db)).toBe(0);
  });

  it("does nothing, and fails closed, without the signing secret", async () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "");
    const { db, rpcCalls } = setup();
    await expect(scheduleFollowUps(db)).rejects.toThrow();
    expect(rpcCalls.some((c) => c.name === "acq_create_followup")).toBe(false);
  });
});
