import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { sendBrevoEmail } from "@/lib/emailBrevo";
import { SITE_URL } from "@/lib/utils";
import { logRepActivity } from "@/lib/repAudit";

export interface MergeTagsContext {
  firstName: string;
  lastName?: string;
  companyName: string;
  industry?: string;
  websiteUrl?: string;
  repName: string;
  repAliasEmail?: string;
  repBookingLink?: string;
  unsubscribeUrl?: string;
}

/**
 * Replaces all mustache merge tags in subject and body text
 */
export function renderMergeTags(template: string, ctx: MergeTagsContext): string {
  if (!template) return "";
  return template
    .replace(/\{\{\s*first_name\s*\}\}/gi, ctx.firstName || "there")
    .replace(/\{\{\s*last_name\s*\}\}/gi, ctx.lastName || "")
    .replace(/\{\{\s*company_name\s*\}\}/gi, ctx.companyName || "your company")
    .replace(/\{\{\s*industry\s*\}\}/gi, ctx.industry || "your industry")
    .replace(/\{\{\s*website_url\s*\}\}/gi, ctx.websiteUrl || "")
    .replace(/\{\{\s*rep_name\s*\}\}/gi, ctx.repName || "The Digital Dude Team")
    .replace(/\{\{\s*rep_booking_link\s*\}\}/gi, ctx.repBookingLink || `${SITE_URL}/book`)
    .replace(/\{\{\s*unsubscribe_url\s*\}\}/gi, ctx.unsubscribeUrl || `${SITE_URL}/outreach/unsubscribe`);
}

/**
 * Enrolls a lead into a drip campaign and schedules Step 1
 */
export async function enrollLeadInCampaign(params: {
  campaignId: string;
  repId: string;
  leadId: string;
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) throw new Error("Database client unavailable");

  // Check if lead is already in unsubscribe list
  const { data: leadData } = await supabase
    .from("rep_leads")
    .select("email, full_name, company_name")
    .eq("id", params.leadId)
    .single();

  if (!leadData) throw new Error("Lead not found");

  const { data: unsubscribed } = await supabase
    .from("rep_unsubscribes")
    .select("id")
    .eq("email", leadData.email.toLowerCase())
    .single();

  if (unsubscribed) {
    throw new Error(`Lead (${leadData.email}) is on the global Do-Not-Contact / Unsubscribed list.`);
  }

  // Cancel any prior active enrollments for this lead
  await cancelPendingQueueForLead(params.leadId, "Superseded by new campaign enrollment");

  // Create enrollment record
  const { data: enrollment, error: enrollError } = await supabase
    .from("rep_campaign_enrollments")
    .insert({
      campaign_id: params.campaignId,
      rep_id: params.repId,
      lead_id: params.leadId,
      current_step: 1,
      status: "active",
      enrolled_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (enrollError || !enrollment) {
    throw new Error(enrollError?.message || "Failed to create campaign enrollment");
  }

  // Fetch Step 1
  const { data: step1 } = await supabase
    .from("rep_campaign_steps")
    .select("*")
    .eq("campaign_id", params.campaignId)
    .eq("step_number", 1)
    .single();

  if (!step1) {
    throw new Error("Campaign has no Step 1 configured");
  }

  // Calculate scheduled time (delay_days from now)
  const scheduledTime = new Date();
  scheduledTime.setDate(scheduledTime.getDate() + (step1.delay_days || 0));

  // Insert Step 1 into rep_campaign_queue
  const { data: queueItem, error: queueError } = await supabase
    .from("rep_campaign_queue")
    .insert({
      enrollment_id: enrollment.id,
      campaign_id: params.campaignId,
      rep_id: params.repId,
      lead_id: params.leadId,
      step_id: step1.id,
      step_number: 1,
      scheduled_for: scheduledTime.toISOString(),
      status: "pending",
    })
    .select("*")
    .single();

  if (queueError) {
    throw new Error(queueError.message);
  }

  // Record in rep audit log
  await logRepActivity({
    employeeId: params.repId,
    actionType: "campaign_enrolled",
    description: `Enrolled prospect "${leadData.full_name || leadData.company_name || leadData.email}" into multi-touch drip campaign.`,
    targetIdentifier: leadData.email,
    metadata: {
      campaignId: params.campaignId,
      leadId: params.leadId,
      enrollmentId: enrollment.id,
    },
  });

  return { enrollment, queueItem };
}

/**
 * Cancels all pending queue jobs for a given lead
 */
export async function cancelPendingQueueForLead(leadId: string, reason: string = "Cancelled") {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase
    .from("rep_campaign_queue")
    .update({
      status: "cancelled",
      error_message: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("lead_id", leadId)
    .eq("status", "pending");

  await supabase
    .from("rep_campaign_enrollments")
    .update({
      status: "cancelled_manual",
      updated_at: new Date().toISOString(),
    })
    .eq("lead_id", leadId)
    .eq("status", "active");
}

/**
 * Worker function to process due jobs from rep_campaign_queue
 */
export async function processOutreachQueueBatch(batchSize: number = 25) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return { success: false, processed: 0, errors: ["Database unavailable"] };
  }

  const now = new Date().toISOString();

  // Fetch pending jobs whose scheduled_for <= NOW()
  const { data: dueJobs, error } = await supabase
    .from("rep_campaign_queue")
    .select(`
      id,
      enrollment_id,
      campaign_id,
      rep_id,
      lead_id,
      step_id,
      step_number,
      scheduled_for,
      rep_leads (
        id,
        full_name,
        email,
        company_name,
        industry,
        website,
        status
      ),
      sales_reps (
        id,
        full_name,
        email,
        alias_email,
        booking_link
      ),
      rep_campaign_steps (
        id,
        step_number,
        delay_days,
        subject,
        body
      )
    `)
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(batchSize);

  if (error || !dueJobs || dueJobs.length === 0) {
    return { success: true, processed: 0, message: "No due jobs in queue" };
  }

  let processedCount = 0;
  const errors: string[] = [];

  for (const job of dueJobs) {
    const lead = job.rep_leads as any;
    const rep = job.sales_reps as any;
    const step = job.rep_campaign_steps as any;

    if (!lead || !rep || !step) {
      await supabase
        .from("rep_campaign_queue")
        .update({ status: "failed", error_message: "Missing lead, rep, or step relation" })
        .eq("id", job.id);
      continue;
    }

    // If lead status changed to 'replied' or 'meeting_booked' or 'won', cancel this job
    if (["replied", "meeting_booked", "won"].includes(lead.status?.toLowerCase())) {
      await supabase
        .from("rep_campaign_queue")
        .update({ status: "cancelled", error_message: `Lead has status: ${lead.status}` })
        .eq("id", job.id);

      await supabase
        .from("rep_campaign_enrollments")
        .update({ status: "cancelled_replied", updated_at: new Date().toISOString() })
        .eq("id", job.enrollment_id);
      continue;
    }

    // Check if lead unsubscribed
    const { data: isUnsub } = await supabase
      .from("rep_unsubscribes")
      .select("id")
      .eq("email", lead.email.toLowerCase())
      .single();

    if (isUnsub) {
      await supabase
        .from("rep_campaign_queue")
        .update({ status: "cancelled", error_message: "Lead unsubscribed" })
        .eq("id", job.id);
      continue;
    }

    try {
      const firstName = (lead.full_name || "").trim().split(/\s+/)[0] || "there";
      const lastName = (lead.full_name || "").trim().split(/\s+/).slice(1).join(" ") || "";
      const unsubUrl = `${SITE_URL}/outreach/unsubscribe?email=${encodeURIComponent(lead.email)}&lead_id=${lead.id}`;

      const repDisplayName = (rep.outreach_display_name || "").trim() || "The Digital Dude Partnerships";
      const repSenderEmail = (rep.assigned_outreach_email || rep.alias_email || "").trim() || "outreach@digitaldude.co.uk";
      const senderName = repDisplayName.includes("Digital Dude") ? repDisplayName : `${repDisplayName} | The Digital Dude`;

      const mergeContext: MergeTagsContext = {
        firstName,
        lastName,
        companyName: lead.company_name || "your company",
        industry: lead.industry || "",
        websiteUrl: lead.website || "",
        repName: repDisplayName,
        repAliasEmail: repSenderEmail,
        repBookingLink: rep.booking_link || `${SITE_URL}/book`,
        unsubscribeUrl: unsubUrl,
      };

      const renderedSubject = renderMergeTags(step.subject, mergeContext);
      const renderedBody = renderMergeTags(step.body, mergeContext);

      // Wrap in clean responsive HTML with GDPR opt-out footer
      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6; font-size: 14px;">
          <div style="margin-bottom: 24px;">
            ${renderedBody.replace(/\n/g, "<br />")}
          </div>

          <div style="margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
            <p style="margin: 0 0 6px 0;">
              Best regards,<br />
              <strong>${repDisplayName}</strong> &bull; The Digital Dude Ltd<br />
              <a href="${SITE_URL}" style="color: #7c3aed; text-decoration: none;">digitaldude.co.uk</a>
            </p>
            <p style="margin: 0;">
              If you would prefer not to receive further commercial communications, you can <a href="${unsubUrl}" style="color: #94a3b8; text-decoration: underline;">unsubscribe instantly here</a>.
            </p>
          </div>
        </div>
      `;

      // Dispatch through Brevo
      const replyToEmail = "info@digitaldude.co.uk";
      await sendBrevoEmail({
        to: [{ email: lead.email, name: lead.full_name || lead.company_name || "Lead" }],
        subject: renderedSubject,
        htmlContent: htmlContent,
        sender: { email: repSenderEmail, name: senderName },
        replyTo: { email: replyToEmail, name: "The Digital Dude" },
      });

      // Mark queue job as sent
      await supabase
        .from("rep_campaign_queue")
        .update({
          status: "sent",
          dispatched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      // Update enrollment last_dispatched_at
      await supabase
        .from("rep_campaign_enrollments")
        .update({
          last_dispatched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.enrollment_id);

      // Record audit log entry
      await logRepActivity({
        employeeId: rep.id,
        actionType: "drip_dispatched",
        description: `Automated drip sequence Step ${job.step_number} dispatched to ${lead.email} ("${renderedSubject}").`,
        targetIdentifier: lead.email,
        metadata: {
          stepNumber: job.step_number,
          subject: renderedSubject,
          leadId: lead.id,
          campaignId: job.campaign_id,
        },
      });

      // Check if there is a next step (step_number + 1)
      const nextStepNumber = job.step_number + 1;
      const { data: nextStep } = await supabase
        .from("rep_campaign_steps")
        .select("*")
        .eq("campaign_id", job.campaign_id)
        .eq("step_number", nextStepNumber)
        .single();

      if (nextStep) {
        // Schedule next step: NOW + nextStep.delay_days
        const nextScheduledDate = new Date();
        nextScheduledDate.setDate(nextScheduledDate.getDate() + (nextStep.delay_days || 3));

        await supabase.from("rep_campaign_queue").insert({
          enrollment_id: job.enrollment_id,
          campaign_id: job.campaign_id,
          rep_id: job.rep_id,
          lead_id: job.lead_id,
          step_id: nextStep.id,
          step_number: nextStepNumber,
          scheduled_for: nextScheduledDate.toISOString(),
          status: "pending",
        });

        await supabase
          .from("rep_campaign_enrollments")
          .update({
            current_step: nextStepNumber,
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.enrollment_id);
      } else {
        // No more steps -> mark enrollment completed
        await supabase
          .from("rep_campaign_enrollments")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.enrollment_id);
      }

      processedCount++;
    } catch (err: unknown) {
      errors.push(`Job ${job.id}: ${(err as Error).message}`);
      await supabase
        .from("rep_campaign_queue")
        .update({
          status: "failed",
          error_message: (err as Error).message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
    }
  }

  return {
    success: true,
    processed: processedCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}
