import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import type { Db } from "./db";
import { unsubscribeSecret } from "./env";
import { AiHttpError, OpenAiCompatibleProvider, getAiProvider, type AiProvider } from "./providers/ai";
import { validateFetchUrl } from "./providers/research";
import { log } from "@/lib/logger";

/**
 * AI provider settings saved from the admin UI. The API key is encrypted at rest (AES-256-GCM,
 * key derived from ACQ_UNSUBSCRIBE_SECRET) and is never sent back to the browser. A saved
 * config takes precedence over the AI_* environment variables.
 */
const SETTING_KEY = "ai_config";

export interface AiConfigInput {
  baseUrl: string;
  model: string;
  apiKey: string;
}

interface Stored {
  baseUrl: string;
  model: string;
  apiKeyEnc: string;
}

function encKey(): Buffer {
  return Buffer.from(hkdfSync("sha256", unsubscribeSecret(), "acq-settings", "acq-ai-config-v1", 32));
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", encKey(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), ct].map((b) => b.toString("base64url")).join(".");
}

export function decryptSecret(enc: string): string {
  const [iv, tag, ct] = enc.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", encKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(ct), d.final()]).toString("utf8");
}

/** Throws a readable error if the base URL isn't an acceptable public https endpoint. */
export function validateBaseUrl(raw: string): string {
  const u = validateFetchUrl(raw.trim());
  if (u.protocol !== "https:") throw new Error("The base URL must use https");
  return u.toString().replace(/\/$/, "");
}

async function loadStored(db: Db): Promise<Stored | null> {
  const { data, error } = await db.from("acq_settings").select("value").eq("key", SETTING_KEY).maybeSingle();
  if (error) throw new Error(`load ai config: ${error.message}`);
  const v = data?.value as Partial<Stored> | undefined;
  return v?.baseUrl && v.model && v.apiKeyEnc ? (v as Stored) : null;
}

export async function saveAiConfig(db: Db, input: { baseUrl: string; model: string; apiKey?: string }): Promise<void> {
  const baseUrl = validateBaseUrl(input.baseUrl);
  const existing = await loadStored(db);
  const apiKeyEnc = input.apiKey?.trim() ? encryptSecret(input.apiKey.trim()) : existing?.apiKeyEnc;
  if (!apiKeyEnc) throw new Error("An API key is required");
  const { error } = await db.from("acq_settings").upsert({ key: SETTING_KEY, value: { baseUrl, model: input.model.trim(), apiKeyEnc } });
  if (error) throw new Error(`save ai config: ${error.message}`);
}

export async function clearAiConfig(db: Db): Promise<void> {
  const { error } = await db.from("acq_settings").delete().eq("key", SETTING_KEY);
  if (error) throw new Error(`clear ai config: ${error.message}`);
}

/** Saved config first, then the AI_* environment variables, otherwise null (manual workflow). */
export async function resolveAiProvider(db: Db, opts: { timeoutMs?: number } = {}): Promise<AiProvider | null> {
  const stored = await loadStored(db);
  if (stored) {
    try {
      return new OpenAiCompatibleProvider(stored.baseUrl, decryptSecret(stored.apiKeyEnc), stored.model, opts.timeoutMs);
    } catch (e) {
      // Unreadable saved key (e.g. ACQ_UNSUBSCRIBE_SECRET missing): behave as "AI not configured", never as a crash.
      log("warn", { message: "saved AI config could not be decrypted", error: e });
      return null;
    }
  }
  const env = getAiProvider();
  return env && opts.timeoutMs && env instanceof OpenAiCompatibleProvider ? new OpenAiCompatibleProvider(process.env.AI_BASE_URL!, process.env.AI_API_KEY!, env.model, opts.timeoutMs) : env;
}

export interface AiStatus {
  configured: boolean;
  source: "saved" | "environment" | "none";
  baseUrl: string | null;
  model: string | null;
  keyHint: string | null;
}

export async function aiStatus(db: Db): Promise<AiStatus> {
  const stored = await loadStored(db);
  if (stored) {
    let hint: string | null;
    try {
      hint = `••••${decryptSecret(stored.apiKeyEnc).slice(-4)}`;
    } catch {
      hint = "unreadable (re-enter the key)";
    }
    return { configured: true, source: "saved", baseUrl: stored.baseUrl, model: stored.model, keyHint: hint };
  }
  const key = process.env.AI_API_KEY;
  if (process.env.AI_BASE_URL && key && process.env.AI_MODEL) {
    return { configured: true, source: "environment", baseUrl: process.env.AI_BASE_URL, model: process.env.AI_MODEL, keyHint: `••••${key.slice(-4)}` };
  }
  return { configured: false, source: "none", baseUrl: null, model: null, keyHint: null };
}

export interface TestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export function explainAiError(e: unknown): string {
  if (e instanceof AiHttpError) {
    if (e.status === 400 && /api key/i.test(e.detail)) return "The provider rejected the API key. Check it was copied correctly.";
    if (e.status === 401 || e.status === 403) return `The API key was rejected or lacks access (HTTP ${e.status}). ${e.detail}`.trim();
    if (e.status === 404) return "Endpoint or model not found. Check the base URL and model name.";
    if (e.status === 429) return "The key works but the rate or daily quota is exhausted right now (HTTP 429). Try again later or lower the daily research limit.";
    return `The provider returned an error (HTTP ${e.status}). ${e.detail}`.trim();
  }
  const m = e instanceof Error ? e.message : String(e);
  if (/timed out|timeout|aborted/i.test(m)) return "The provider did not respond in time. Check the base URL.";
  if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(m)) return "Could not reach the provider. Check the base URL.";
  return m;
}

/** Makes one tiny request with the given config, so a bad key/URL/model is found before a research run. */
export async function testAiConnection(cfg: AiConfigInput, provider?: AiProvider): Promise<TestResult> {
  const started = Date.now();
  try {
    const p = provider ?? new OpenAiCompatibleProvider(validateBaseUrl(cfg.baseUrl), cfg.apiKey, cfg.model, 20_000);
    const text = await p.completeJson({ system: "You reply with a single JSON object only.", user: 'Reply with exactly {"ok": true}' });
    if (!/\{[\s\S]*\}/.test(text)) return { ok: false, message: "The provider replied but not with JSON, so it may not be suitable for research." };
    return { ok: true, message: `Connected. ${cfg.model} responded in ${Date.now() - started} ms.`, latencyMs: Date.now() - started };
  } catch (e) {
    return { ok: false, message: explainAiError(e) };
  }
}

/** Fills blanks in a test request from the saved config, then the environment. */
export async function configForTest(db: Db, input: Partial<AiConfigInput>): Promise<AiConfigInput | { error: string }> {
  const stored = await loadStored(db);
  const baseUrl = input.baseUrl?.trim() || stored?.baseUrl || process.env.AI_BASE_URL || "";
  const model = input.model?.trim() || stored?.model || process.env.AI_MODEL || "";
  let apiKey = input.apiKey?.trim() || "";
  if (!apiKey && stored && (!input.baseUrl || input.baseUrl.trim() === stored.baseUrl)) apiKey = decryptSecret(stored.apiKeyEnc);
  if (!apiKey && !stored) apiKey = process.env.AI_API_KEY ?? "";
  if (!baseUrl || !model) return { error: "Enter a base URL and model first" };
  if (!apiKey) return { error: "Enter an API key to test" };
  return { baseUrl, model, apiKey };
}
