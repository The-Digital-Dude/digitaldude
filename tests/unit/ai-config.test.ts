import { describe, it, expect, vi, afterEach } from "vitest";
import { decryptSecret, encryptSecret, explainAiError, testAiConnection, validateBaseUrl, resolveAiProvider } from "@/lib/acquisition/ai-config";
import { AiHttpError, type AiProvider } from "@/lib/acquisition/providers/ai";
import type { Db } from "@/lib/acquisition/db";

const SECRET = "s".repeat(40);
afterEach(() => vi.unstubAllEnvs());

describe("encrypted key storage", () => {
  it("round-trips and does not contain the plaintext", () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    const enc = encryptSecret("AIzaSyExampleKey1234");
    expect(enc).not.toContain("AIza");
    expect(decryptSecret(enc)).toBe("AIzaSyExampleKey1234");
    expect(encryptSecret("AIzaSyExampleKey1234")).not.toBe(enc); // random IV
  });
  it("cannot be decrypted with a different secret or after tampering", () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    const enc = encryptSecret("k");
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "t".repeat(40));
    expect(() => decryptSecret(enc)).toThrow();
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    const parts = enc.split(".");
    parts[2] = Buffer.from("tampered").toString("base64url");
    expect(() => decryptSecret(parts.join("."))).toThrow();
  });
  it("refuses to encrypt without the signing secret", () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "");
    expect(() => encryptSecret("k")).toThrow(/ACQ_UNSUBSCRIBE_SECRET/);
  });
});

describe("base URL validation", () => {
  it("accepts public https endpoints", () => {
    expect(validateBaseUrl("https://generativelanguage.googleapis.com/v1beta/openai/")).toBe("https://generativelanguage.googleapis.com/v1beta/openai");
  });
  it("rejects http, credentials, and private addresses", () => {
    expect(() => validateBaseUrl("http://api.example.com/v1")).toThrow(/https/);
    expect(() => validateBaseUrl("https://user:pw@api.example.com")).toThrow();
    expect(() => validateBaseUrl("https://127.0.0.1/v1")).toThrow();
    expect(() => validateBaseUrl("https://169.254.169.254/latest")).toThrow();
    expect(() => validateBaseUrl("not a url")).toThrow();
  });
});

describe("connection test", () => {
  const cfg = { baseUrl: "https://x.example.com", model: "m", apiKey: "k" };
  const prov = (fn: AiProvider["completeJson"]): AiProvider => ({ name: "t", model: "m", completeJson: fn });

  it("reports success with timing", async () => {
    const r = await testAiConnection(cfg, prov(async () => '{"ok": true}'));
    expect(r.ok).toBe(true);
    expect(r.message).toMatch(/Connected/);
  });
  it("explains bad key, bad model, quota and unreachable cases", async () => {
    expect((await testAiConnection(cfg, prov(async () => { throw new AiHttpError(401, "bad"); }))).message).toMatch(/rejected/);
    expect((await testAiConnection(cfg, prov(async () => { throw new AiHttpError(400, "API key not valid. Please pass a valid API key."); }))).message).toMatch(/API key/);
    expect((await testAiConnection(cfg, prov(async () => { throw new AiHttpError(404, ""); }))).message).toMatch(/model/i);
    expect((await testAiConnection(cfg, prov(async () => { throw new AiHttpError(429, ""); }))).message).toMatch(/quota/);
    expect(explainAiError(new Error("fetch failed"))).toMatch(/reach/);
  });
  it("flags a reply that is not JSON", async () => {
    const r = await testAiConnection(cfg, prov(async () => "hello there"));
    expect(r.ok).toBe(false);
  });
  it("never includes the API key in a failure message", async () => {
    const r = await testAiConnection({ ...cfg, apiKey: "SUPERSECRETKEY" }, prov(async () => { throw new AiHttpError(403, "denied"); }));
    expect(r.message).not.toContain("SUPERSECRETKEY");
  });
});

describe("resolveAiProvider", () => {
  const dbWith = (value: unknown) =>
    ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: value ? { value } : null, error: null }) }) }) }) }) as unknown as Db;

  it("prefers saved settings over the environment", async () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    vi.stubEnv("AI_BASE_URL", "https://env.example.com");
    vi.stubEnv("AI_API_KEY", "envkey");
    vi.stubEnv("AI_MODEL", "env-model");
    const p = await resolveAiProvider(dbWith({ baseUrl: "https://saved.example.com", model: "saved-model", apiKeyEnc: encryptSecret("savedkey") }));
    expect(p?.model).toBe("saved-model");
  });
  it("falls back to the environment, and to null when nothing is set", async () => {
    vi.stubEnv("AI_BASE_URL", "https://env.example.com");
    vi.stubEnv("AI_API_KEY", "envkey");
    vi.stubEnv("AI_MODEL", "env-model");
    expect((await resolveAiProvider(dbWith(null)))?.model).toBe("env-model");
    vi.stubEnv("AI_BASE_URL", "");
    expect(await resolveAiProvider(dbWith(null))).toBeNull();
  });
  it("treats an undecryptable saved key as not configured instead of crashing", async () => {
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", SECRET);
    const enc = encryptSecret("k");
    vi.stubEnv("ACQ_UNSUBSCRIBE_SECRET", "z".repeat(40));
    expect(await resolveAiProvider(dbWith({ baseUrl: "https://a.example.com", model: "m", apiKeyEnc: enc }))).toBeNull();
  });
});
