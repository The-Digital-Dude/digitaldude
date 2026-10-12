import { describe, it, expect, vi, afterEach } from "vitest";
import { assertCanEmail, OutreachBlockedError, repFooterHtml, repUnsubscribeApiUrl, repUnsubscribeUrl } from "@/lib/outreachGate";
import { verifyUnsubscribeToken } from "@/lib/acquisition/compliance/unsubscribe-token";
import { signRepToken, verifyRepToken } from "@/lib/repAuth";

afterEach(() => vi.unstubAllEnvs());

function fakeDb(opts: { suppressed?: boolean; rpcError?: boolean; legacy?: boolean; legacyError?: boolean }) {
  return {
    rpc: async () => (opts.rpcError ? { data: null, error: { message: "boom" } } : { data: opts.suppressed ?? false, error: null }),
    from: () => ({ select: () => ({ eq: () => ({ limit: async () => (opts.legacyError ? { data: null, error: { message: "boom" } } : { data: opts.legacy ? [{ id: "1" }] : [], error: null }) }) }) }),
  } as never;
}

describe("assertCanEmail (shared do-not-contact gate)", () => {
  it("passes a clean address", async () => {
    await expect(assertCanEmail(fakeDb({}), "ok@acme.com")).resolves.toBeUndefined();
  });
  it("blocks anything on the shared suppression list (email or domain)", async () => {
    await expect(assertCanEmail(fakeDb({ suppressed: true }), "x@acme.com")).rejects.toMatchObject({ reason: "suppressed" });
  });
  it("blocks legacy rep unsubscribes", async () => {
    await expect(assertCanEmail(fakeDb({ legacy: true }), "x@acme.com")).rejects.toBeInstanceOf(OutreachBlockedError);
  });
  it("fails closed when a lookup errors (never sends on uncertainty)", async () => {
    await expect(assertCanEmail(fakeDb({ rpcError: true }), "x@acme.com")).rejects.toThrow(/suppression lookup failed/);
    await expect(assertCanEmail(fakeDb({ legacyError: true }), "x@acme.com")).rejects.toThrow(/unsubscribe lookup failed/);
  });
});

describe("signed rep unsubscribe links", () => {
  const SECRET = "u".repeat(40);
  it("carries a verifiable token for the recipient", () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    const url = new URL(repUnsubscribeUrl("Lead@Acme.com"));
    expect(url.pathname).toBe("/outreach/unsubscribe");
    expect(verifyUnsubscribeToken(url.searchParams.get("t"), SECRET)).toBe("lead@acme.com");
    const api = new URL(repUnsubscribeApiUrl("Lead@Acme.com")!);
    expect(api.pathname).toBe("/api/outreach/unsubscribe");
    expect(verifyUnsubscribeToken(api.searchParams.get("t"), SECRET)).toBe("lead@acme.com");
  });
  it("cannot be forged for another address", () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    const t = new URL(repUnsubscribeUrl("a@acme.com")).searchParams.get("t")!;
    const forged = Buffer.from("b@acme.com").toString("base64url") + "." + t.split(".")[1];
    expect(verifyUnsubscribeToken(forged, SECRET)).toBeNull();
  });
  it("falls back to the legacy link only when no secret is configured, and has no one-click URL", () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "");
    expect(repUnsubscribeUrl("a@acme.com", "lead1")).toContain("email=a%40acme.com");
    expect(repUnsubscribeApiUrl("a@acme.com")).toBeNull();
  });
});

describe("rep email footer", () => {
  it("identifies the sender and links the unsubscribe URL, escaping content", () => {
    const html = repFooterHtml({ business: "Dude & Co <x>", postalAddress: "1 Main St, London" }, "https://x/u?t=1");
    expect(html).toContain("Dude &amp; Co &lt;x&gt;");
    expect(html).toContain("1 Main St, London");
    expect(html).toContain('href="https://x/u?t=1"');
  });
  it("omits the address separator when no address is set", () => {
    expect(repFooterHtml({ business: "The Digital Dude", postalAddress: "" }, "https://x")).not.toContain("&middot;");
  });
});

describe("rep session secret", () => {
  it("has no built-in fallback: signing fails closed without a secret", () => {
    vi.stubEnv("REP_AUTH_SECRET", "");
    vi.stubEnv("ADMIN_PASSWORD", "");
    expect(() => signRepToken("id", "a@b.com")).toThrow(/REP_AUTH_SECRET/);
  });
  it("round-trips with a secret and rejects tampering", () => {
    vi.stubEnv("REP_AUTH_SECRET", "r".repeat(32));
    const token = signRepToken("emp1", "a@b.com");
    expect(verifyRepToken(token)).toMatchObject({ employeeId: "emp1", email: "a@b.com" });
    expect(verifyRepToken(token.slice(0, -2) + "00")).toBeNull();
  });
});
