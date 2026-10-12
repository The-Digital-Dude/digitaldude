import { UNIQUE_VIOLATION, type Db } from "../db";

export interface EnqueueArgs {
  type: string;
  payload: Record<string, unknown>;
  /** Same key => same job. Makes retries and double-clicks harmless. */
  idempotencyKey: string;
  runAt?: Date;
  campaignLeadId?: string;
  maxAttempts?: number;
}

export async function enqueueJob(db: Db, a: EnqueueArgs): Promise<{ id: string; created: boolean }> {
  const { data, error } = await db
    .from("acq_jobs")
    .insert({
      type: a.type,
      payload: a.payload,
      idempotency_key: a.idempotencyKey,
      run_at: (a.runAt ?? new Date()).toISOString(),
      campaign_lead_id: a.campaignLeadId ?? null,
      max_attempts: a.maxAttempts ?? 3,
    })
    .select("id")
    .single();
  if (!error) return { id: data.id, created: true };
  if (error.code !== UNIQUE_VIOLATION) throw new Error(`enqueue ${a.type}: ${error.message}`);
  const existing = await db.from("acq_jobs").select("id").eq("idempotency_key", a.idempotencyKey).single();
  if (existing.error) throw new Error(`enqueue ${a.type}: ${existing.error.message}`);
  return { id: existing.data.id, created: false };
}
