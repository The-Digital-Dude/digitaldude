import { describe, it, expect, vi } from "vitest";
import { builtinCheck, checkSyntax, getCachedCheck, reacherCheck, reacherConfigured, runCheck, suggestDomain, verifyEmail, type MxResolver } from "@/lib/acquisition/verify/email";
import { fakeDb } from "./helpers/fakedb";

const mx = (kind: "ok" | "nxdomain" | "no_mail" | "error"): MxResolver => async () => (kind === "ok" ? { kind: "mx", hosts: ["mx.plum.com.au"] } : kind === "error" ? { kind: "error" } : { kind: "none", reason: kind });
const now = new Date("2026-10-22T10:00:00Z");

describe("syntax", () => {
  it("accepts normal addresses and rejects broken ones", () => {
    for (const ok of ["dan@plum.com.au", "dan.lee+test@sub.plum.co.uk", "a_b-c@plum.io"]) expect(checkSyntax(ok).ok).toBe(true);
    for (const bad of ["dan", "dan@", "@plum.com", "dan@plum", "da n@plum.com", "dan@@plum.com", "dan..lee@plum.com", ".dan@plum.com", "dan@-plum.com", "dan@plum.c", "dan@plum.com.", `${"a".repeat(70)}@plum.com`]) expect(checkSyntax(bad).ok, bad).toBe(false);
  });
});

describe("builtin checks (free, no mail-server probe)", () => {
  it("a domain with mail servers is safe, with role and free-provider flags in the details", async () => {
    const r = await builtinCheck("Info@Plum.com.au", mx("ok"), now);
    expect(r).toMatchObject({ email: "info@plum.com.au", status: "safe", source: "builtin" });
    expect(r.details).toMatchObject({ role: true, freeProvider: false, mx: true });
    expect((await builtinCheck("dan@gmail.com", mx("ok"), now)).details.freeProvider).toBe(true);
  });

  it("a domain that does not exist, or accepts no mail, is invalid", async () => {
    expect(await builtinCheck("dan@nothere.example", mx("nxdomain"), now)).toMatchObject({ status: "invalid", reason: expect.stringMatching(/does not exist/) });
    expect(await builtinCheck("dan@nomail.example", mx("no_mail"), now)).toMatchObject({ status: "invalid", reason: expect.stringMatching(/no mail server/) });
  });

  it("a DNS hiccup is 'unknown', never 'invalid' (we must not block a real person on a timeout)", async () => {
    expect(await builtinCheck("dan@plum.com.au", mx("error"), now)).toMatchObject({ status: "unknown" });
  });

  it("disposable and no-reply addresses are invalid without any lookup", async () => {
    const resolver = vi.fn(mx("ok"));
    expect(await builtinCheck("x@mailinator.com", resolver, now)).toMatchObject({ status: "invalid", details: { disposable: true } });
    for (const local of ["noreply", "no-reply", "donotreply", "mailer-daemon", "no-reply+abc"]) expect((await builtinCheck(`${local}@plum.com.au`, resolver, now)).status).toBe("invalid");
    expect(resolver).not.toHaveBeenCalled();
  });

  it("a likely domain typo is risky (a warning) and names the fix", async () => {
    expect(suggestDomain("gmial.com")).toBe("gmail.com");
    expect(suggestDomain("gmail.com")).toBeNull();
    expect(suggestDomain("plum.com.au")).toBeNull();
    expect(await builtinCheck("dan@gmial.com", mx("ok"), now)).toMatchObject({ status: "risky", reason: expect.stringContaining("dan@gmail.com") });
  });

  it("bad syntax is invalid", async () => {
    expect(await builtinCheck("not-an-email", mx("ok"), now)).toMatchObject({ status: "invalid" });
  });
});

describe("optional Reacher probe", () => {
  const reply = (body: unknown, ok = true) => vi.fn(async () => new Response(JSON.stringify(body), { status: ok ? 200 : 500 })) as unknown as typeof fetch;
  const env = { REACHER_URL: "https://reacher.example.com/", REACHER_SECRET: "s3cret" } as unknown as NodeJS.ProcessEnv;

  it("is off unless REACHER_URL is set", async () => {
    expect(reacherConfigured({} as unknown as NodeJS.ProcessEnv)).toBe(false);
    expect(reacherConfigured(env)).toBe(true);
    expect(await reacherCheck("a@b.com", { env: {} as unknown as NodeJS.ProcessEnv })).toBeNull();
  });

  it("maps Reacher's answers, sends the secret header, and never follows redirects", async () => {
    const f = reply({ is_reachable: "invalid", smtp: { is_deliverable: false, is_disabled: false }, misc: { is_role_account: false } });
    const r = await reacherCheck("dan@plum.com.au", { env, fetcher: f, now });
    expect(r).toMatchObject({ status: "invalid", source: "reacher", reason: expect.stringMatching(/does not exist/) });
    const [url, init] = (f as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://reacher.example.com/v0/check_email");
    expect((init.headers as Record<string, string>)["x-reacher-secret"]).toBe("s3cret");
    expect(init.redirect).toBe("error");
    expect((await reacherCheck("a@b.com", { env, fetcher: reply({ is_reachable: "risky", smtp: { is_catch_all: true } }), now }))?.reason).toMatch(/any address/);
    expect((await reacherCheck("a@b.com", { env, fetcher: reply({ is_reachable: "safe" }), now }))?.status).toBe("safe");
  });

  it("returns null on any failure, so the free checks stand", async () => {
    expect(await reacherCheck("a@b.com", { env, fetcher: reply({}, false), now })).toBeNull();
    expect(await reacherCheck("a@b.com", { env, fetcher: (async () => { throw new Error("down"); }) as unknown as typeof fetch, now })).toBeNull();
  });

  it("runCheck: a free-check invalid is final; a real probe answer wins; an unreachable or inconclusive probe changes nothing", async () => {
    const probe = vi.fn(async () => ({ email: "dan@plum.com.au", status: "risky" as const, reason: "catch-all", source: "reacher" as const, details: { catchAll: true }, checkedAt: now.toISOString() }));
    expect((await runCheck("x@mailinator.com", { resolve: mx("ok"), reacher: probe, now })).status).toBe("invalid");
    expect(probe).not.toHaveBeenCalled();
    expect(await runCheck("dan@plum.com.au", { resolve: mx("ok"), reacher: probe, now })).toMatchObject({ status: "risky", source: "reacher", details: { mx: true, catchAll: true } });
    expect(await runCheck("dan@plum.com.au", { resolve: mx("ok"), reacher: async () => null, now })).toMatchObject({ status: "safe", source: "builtin" });
    expect(await runCheck("dan@plum.com.au", { resolve: mx("ok"), reacher: async () => ({ email: "d", status: "unknown", reason: "?", source: "reacher", details: {}, checkedAt: "" }), now })).toMatchObject({ source: "builtin" });
  });
});

describe("caching (30 days)", () => {
  it("uses a fresh saved result without looking anything up, and re-checks a stale one", async () => {
    const { db, tables } = fakeDb({ acq_email_checks: [{ email_normalized: "dan@plum.com.au", status: "safe", reason: "ok", source: "builtin", details: {}, checked_at: "2026-10-10T00:00:00Z" }] });
    const resolver = vi.fn(mx("nxdomain"));
    expect((await verifyEmail(db, "Dan@Plum.com.au", { deps: { resolve: resolver, reacher: async () => null }, now })).status).toBe("safe");
    expect(resolver).not.toHaveBeenCalled();

    tables.acq_email_checks[0].checked_at = "2026-08-01T00:00:00Z"; // over 30 days old
    const fresh = await verifyEmail(db, "dan@plum.com.au", { deps: { resolve: resolver, reacher: async () => null }, now });
    expect(fresh.status).toBe("invalid");
    expect(tables.acq_email_checks[0]).toMatchObject({ status: "invalid", checked_at: now.toISOString() });
  });

  it("saves a new result, retries an 'unknown' sooner than a real answer, and honours force", async () => {
    const { db, tables } = fakeDb({});
    const resolver = vi.fn(mx("error"));
    await verifyEmail(db, "dan@plum.com.au", { deps: { resolve: resolver, reacher: async () => null }, now });
    expect(tables.acq_email_checks).toHaveLength(1);
    const later = new Date(now.getTime() + 2 * 3_600_000); // two hours later: an unknown is re-checked
    await verifyEmail(db, "dan@plum.com.au", { deps: { resolve: resolver, reacher: async () => null }, now: later });
    expect(resolver).toHaveBeenCalledTimes(2);
    await verifyEmail(db, "dan@plum.com.au", { deps: { resolve: mx("ok"), reacher: async () => null }, now: later, force: true });
    expect((await getCachedCheck(db, "dan@plum.com.au"))?.status).toBe("safe");
  });
});

describe("send gates", () => {
  it("assertEmailDeliverable blocks invalid, blocks risky unless confirmed, and never blocks unknown or safe", async () => {
    const { assertEmailDeliverable, OutreachBlockedError } = await import("@/lib/outreachGate");
    const row = (status: string, reason = "why") => ({ acq_email_checks: [{ email_normalized: "dan@plum.com.au", status, reason, source: "builtin", details: {}, checked_at: new Date().toISOString() }] });
    await expect(assertEmailDeliverable(fakeDb(row("invalid", "no such domain")).db, "dan@plum.com.au")).rejects.toMatchObject({ reason: "email_invalid" });
    await expect(assertEmailDeliverable(fakeDb(row("invalid")).db, "dan@plum.com.au", { allowRisky: true })).rejects.toBeInstanceOf(OutreachBlockedError); // confirming never overrides "invalid"
    await expect(assertEmailDeliverable(fakeDb(row("risky", "typo")).db, "dan@plum.com.au")).rejects.toMatchObject({ reason: "email_risky" });
    await expect(assertEmailDeliverable(fakeDb(row("risky", "typo")).db, "dan@plum.com.au", { allowRisky: true })).resolves.toMatchObject({ status: "risky" });
    await expect(assertEmailDeliverable(fakeDb(row("unknown")).db, "dan@plum.com.au")).resolves.toBeTruthy();
    await expect(assertEmailDeliverable(fakeDb(row("safe")).db, "dan@plum.com.au")).resolves.toBeTruthy();
  });

  it("the automated admin send skips an invalid address before the gate or the provider", async () => {
    const { sendMessage } = await import("@/lib/acquisition/queue/send");
    const provider = { send: vi.fn(), verifyAndParseWebhook: vi.fn(), name: "t" } as never;
    const reserve = vi.fn(async () => ({ ok: true as const }));
    const message = { id: "m1", subject: "s", body: "b", kind: "initial", direction: "outbound", status: "approved", campaign_lead_id: "l1", acq_campaign_leads: { id: "l1", campaign_id: "c1", contact_id: "ct1", acq_campaigns: { sender_name: "N", sender_email: "n@x.com" }, acq_contacts: { email: "dan@plum.com.au" } } };
    const { db } = fakeDb({ acq_email_messages: [message], acq_audit_logs: [] });
    const out = await sendMessage(db, "m1", { allowlist: null, senderEmail: "hello@mail.x.com", provider, reserve, verify: async () => ({ status: "invalid", reason: "no such domain" }) });
    expect(out).toMatchObject({ status: "skipped", reason: "email_invalid" });
    expect(reserve).not.toHaveBeenCalled();
    expect((provider as unknown as { send: ReturnType<typeof vi.fn> }).send).not.toHaveBeenCalled();
  });
});
