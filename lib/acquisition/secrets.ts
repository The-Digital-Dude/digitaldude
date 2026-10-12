import type { Db } from "./db";
import { decryptSecret, encryptSecret } from "./ai-config";
import { HunterProvider, type ContactFinder } from "./providers/contacts";
import { BraveSearchProvider, type SearchProvider } from "./providers/search";
import { log } from "@/lib/logger";

/**
 * Third-party API keys that can be saved from the admin UI instead of Vercel env vars.
 * Stored encrypted (AES-256-GCM, key derived from ACQ_UNSUBSCRIBE_SECRET), never returned to the browser,
 * and a saved key takes precedence over the environment variable.
 */
export const SECRETS = {
  hunter: { setting: "secret_hunter", env: "HUNTER_API_KEY", label: "Hunter.io" },
  brave: { setting: "secret_brave", env: "BRAVE_SEARCH_API_KEY", label: "Brave Search" },
} as const;
export type SecretName = keyof typeof SECRETS;

async function loadEnc(db: Db, name: SecretName): Promise<string | null> {
  const { data, error } = await db.from("acq_settings").select("value").eq("key", SECRETS[name].setting).maybeSingle();
  if (error) throw new Error(`load secret: ${error.message}`);
  const enc = (data?.value as { enc?: string } | undefined)?.enc;
  return enc ?? null;
}

export async function saveSecret(db: Db, name: SecretName, apiKey: string): Promise<void> {
  const value = apiKey.trim();
  if (value.length < 8 || value.length > 500 || /\s/.test(value)) throw new Error("That does not look like a valid API key");
  const { error } = await db.from("acq_settings").upsert({ key: SECRETS[name].setting, value: { enc: encryptSecret(value) } });
  if (error) throw new Error(`save secret: ${error.message}`);
}

export async function clearSecret(db: Db, name: SecretName): Promise<void> {
  const { error } = await db.from("acq_settings").delete().eq("key", SECRETS[name].setting);
  if (error) throw new Error(`clear secret: ${error.message}`);
}

/** Saved key first, then the environment variable, otherwise null. An unreadable saved key counts as not configured. */
export async function getSecret(db: Db, name: SecretName): Promise<string | null> {
  const enc = await loadEnc(db, name);
  if (enc) {
    try {
      return decryptSecret(enc);
    } catch (e) {
      log("warn", { message: `saved ${name} key could not be decrypted`, error: e });
      return null;
    }
  }
  return process.env[SECRETS[name].env]?.trim() || null;
}

export interface SecretStatus {
  configured: boolean;
  source: "saved" | "environment" | "none";
  keyHint: string | null;
}

export async function secretStatus(db: Db, name: SecretName): Promise<SecretStatus> {
  const enc = await loadEnc(db, name);
  if (enc) {
    try {
      return { configured: true, source: "saved", keyHint: `••••${decryptSecret(enc).slice(-4)}` };
    } catch {
      return { configured: false, source: "saved", keyHint: "unreadable (re-enter the key)" };
    }
  }
  const env = process.env[SECRETS[name].env]?.trim();
  return env ? { configured: true, source: "environment", keyHint: `••••${env.slice(-4)}` } : { configured: false, source: "none", keyHint: null };
}

export async function resolveContactFinder(db: Db): Promise<ContactFinder | null> {
  const key = await getSecret(db, "hunter");
  return key ? new HunterProvider(key) : null;
}

export async function resolveSearchProvider(db: Db): Promise<SearchProvider | null> {
  const key = await getSecret(db, "brave");
  return key ? new BraveSearchProvider(key) : null;
}
