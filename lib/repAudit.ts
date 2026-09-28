import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { log } from "@/lib/logger";

export interface CreateAuditLogParams {
  employeeId: string;
  actionType:
    | "outreach_sent"
    | "lead_created"
    | "lead_updated"
    | "lead_deleted"
    | "payout_updated"
    | "onboarding_completed"
    | "login"
    | "template_created"
    | "template_updated"
    | "template_deleted";
  description: string;
  targetIdentifier?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * Resilient audit logger for Sales Rep operations.
 * Captures all actions for admin oversight without failing if table is pending in Supabase.
 */
export async function recordRepAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return;

    await supabase.from("rep_audit_logs").insert([
      {
        employee_id: params.employeeId,
        action_type: params.actionType,
        description: params.description,
        target_identifier: params.targetIdentifier || null,
        metadata: params.metadata || {},
        ip_address: params.ipAddress || null,
      },
    ]);
  } catch (err) {
    log("warn", { message: "Failed to record rep audit log", error: err });
  }
}
