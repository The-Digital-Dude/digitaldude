import { acqEnv } from "./env";
import type { Db } from "./db";

/** Application-level audit entries (DB triggers already audit campaign status, consent and suppressions). */
export async function logAudit(db: Db, action: string, entityType: string, entityId: string | null, metadata: Record<string, unknown> = {}, actor?: string) {
  const { error } = await db.from("acq_audit_logs").insert({
    actor_id: actor ?? acqEnv().operatorName,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
  if (error) console.error(JSON.stringify({ level: "error", message: "audit log write failed", action, error: error.message }));
}
