import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabaseClient";

export type Db = SupabaseClient;

/** Service-role client. Server-only; the key never reaches the browser. */
export function getDb(): Db {
  const db = getSupabaseServerClient();
  if (!db) throw new Error("Database is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
  return db;
}

export const UNIQUE_VIOLATION = "23505";

/** Throws on a Supabase error so callers can't silently ignore a failed write. */
export function must<T>(res: { data: T; error: { message: string; code?: string } | null }, what: string): NonNullable<T> {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as NonNullable<T>;
}
