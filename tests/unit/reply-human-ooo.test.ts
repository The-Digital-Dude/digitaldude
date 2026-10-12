import { describe, it, expect } from "vitest";
import { recordInboundReply } from "@/lib/acquisition/replies/process";
import { fakeDb } from "./helpers/fakedb";

const seed = () => ({
  acq_contacts: [{ id: "c1", email: "dan@plum.com.au", email_normalized: "dan@plum.com.au", name: "Dan", company_id: null }],
  acq_replies: [] as Record<string, unknown>[],
  acq_campaign_leads: [],
  acq_jobs: [],
  acq_audit_logs: [],
});
const body = "Interested, but I am out of office until March, will be back to look at this then.";

describe("a person's reply that mentions being away", () => {
  it("is held for a human when it came from real (non-automated) mail, so the follow-up and the alerts are not skipped", async () => {
    const { db, tables } = fakeDb(seed(), { unique: { acq_jobs: "idempotency_key" } });
    await recordInboundReply(db, { email: "dan@plum.com.au", body, providerEventId: "gmail:1", humanMail: true });
    expect(tables.acq_replies[0].classification).not.toBe("out_of_office");
  });

  it("is still treated as an out-of-office when the mail source cannot tell (webhook path)", async () => {
    const { db, tables } = fakeDb(seed(), { unique: { acq_jobs: "idempotency_key" } });
    await recordInboundReply(db, { email: "dan@plum.com.au", body, providerEventId: "evt:1" });
    expect(tables.acq_replies[0].classification).toBe("out_of_office");
  });
});
