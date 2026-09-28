import { getSupabaseServerClient } from "@/lib/supabaseClient";

export type RepActionType =
  | "outreach_sent"
  | "campaign_enrolled"
  | "drip_dispatched"
  | "lead_created"
  | "lead_updated"
  | "lead_deleted"
  | "stage_updated"
  | "template_created"
  | "template_updated"
  | "template_deleted"
  | "payout_updated"
  | "onboarding_completed"
  | "login"
  | (string & {});

export interface LogRepActivityParams {
  employeeId: string;
  actionType: RepActionType;
  description: string;
  targetIdentifier?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Centrally records a sales rep activity in the rep_audit_logs table.
 */
export async function logRepActivity(params: LogRepActivityParams) {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) return;

    await supabase.from("rep_audit_logs").insert({
      employee_id: params.employeeId,
      action_type: params.actionType,
      description: params.description,
      target_identifier: params.targetIdentifier || null,
      metadata: params.metadata || {},
      ip_address: params.ipAddress || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking error logging
    console.error("[repAudit] Failed to log rep activity:", err);
  }
}

export const recordRepAuditLog = logRepActivity;
