import { getDb, must } from "./db";
import { aiStatus } from "./ai-config";
import { loadSenderIdentity } from "@/lib/outreachGate";
import { acqEnv, brevoSenderEmail, sendAllowlist } from "./env";

/* Server-only read models for the dashboard pages. */

const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
  const r = await q;
  if (r.error) throw new Error(r.error.message);
  return r.count ?? 0;
};
const head = { count: "exact" as const, head: true };

export async function dashboardStats() {
  const db = getDb();
  const [companies, researched, contacts, eligible, pendingApprovalCampaigns, draftMessages, repliesToReview, positive, meetings, scheduled, sent, bounced, failedJobs, pendingJobs, goodFit, replies, settings] = await Promise.all([
    count(db.from("acq_companies").select("id", head)),
    count(db.from("acq_companies").select("id", head).eq("status", "researched")),
    count(db.from("acq_contacts").select("id", head)),
    count(db.from("acq_contacts").select("id", head).eq("status", "eligible")),
    count(db.from("acq_campaigns").select("id", head).eq("status", "pending_approval")),
    count(db.from("acq_email_messages").select("id", head).eq("status", "draft").eq("direction", "outbound")),
    count(db.from("acq_replies").select("id", head).eq("human_review_status", "pending")),
    count(db.from("acq_replies").select("id", head).eq("classification", "interested")),
    count(db.from("acq_meetings").select("id", head)),
    count(db.from("acq_meetings").select("id", head).in("status", ["scheduled", "attended"])),
    count(db.from("acq_email_messages").select("id", head).eq("direction", "outbound").in("status", ["sent", "delivered", "bounced"])),
    count(db.from("acq_email_messages").select("id", head).eq("status", "bounced")),
    count(db.from("acq_jobs").select("id", head).eq("status", "failed")),
    count(db.from("acq_jobs").select("id", head).in("status", ["pending", "running"])),
    count(db.from("acq_companies").select("id", head).eq("status", "researched").gte("fit_score", 50)),
    count(db.from("acq_replies").select("id", head)),
    db.from("acq_settings").select("value").eq("key", "sending_paused").maybeSingle(),
  ]);
  return {
    companies, researched, contacts, eligible, pendingApprovalCampaigns, draftMessages, repliesToReview, positive,
    meetings, scheduled, sent, bounced, failedJobs, pendingJobs, goodFit, replies,
    sendingPaused: settings.data?.value !== false,
  };
}

export async function listMarkets() {
  const db = getDb();
  return must(await db.from("acq_markets").select("*").order("created_at", { ascending: true }), "markets");
}

export async function listCountryRules() {
  const db = getDb();
  return must(await db.from("acq_country_rules").select("*").order("country"), "country rules");
}

export async function listCompanies() {
  const db = getDb();
  return must(await db.from("acq_companies").select("*, acq_contacts(count), acq_markets(name)").order("fit_score", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(500), "companies");
}

export async function getCompany(id: string) {
  const db = getDb();
  const { data: company } = await db.from("acq_companies").select("*").eq("id", id).maybeSingle();
  if (!company) return null;
  const [research, contacts, suggestions] = await Promise.all([
    db.from("acq_research_records").select("*").eq("company_id", id).order("research_date", { ascending: false }),
    db.from("acq_contacts").select("*, acq_consent_records(*)").eq("company_id", id).order("created_at"),
    db.from("acq_contact_suggestions").select("*").eq("company_id", id).eq("status", "pending").order("created_at"),
  ]);
  return { company, research: must(research, "research"), contacts: must(contacts, "contacts"), suggestions: must(suggestions, "suggestions") };
}

export async function listCampaigns() {
  const db = getDb();
  return must(await db.from("acq_campaigns").select("*, acq_campaign_leads(count)").order("created_at", { ascending: false }), "campaigns");
}

export interface AvailableContact {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  acq_companies: { name: string } | null;
}

export async function getCampaign(id: string) {
  const db = getDb();
  const { data: campaign } = await db.from("acq_campaigns").select("*").eq("id", id).maybeSingle();
  if (!campaign) return null;
  const [leads, hash, eligible] = await Promise.all([
    db.from("acq_campaign_leads").select("*, acq_contacts(id,name,email,role,source_url, acq_companies(id,name,fit_score)), acq_email_messages(id,kind,direction,subject,body,status)").eq("campaign_id", id).order("created_at"),
    db.rpc("acq_campaign_content_hash", { p_campaign_id: id }),
    db.from("acq_contacts").select("id,name,email,role, acq_companies(name)").eq("status", "eligible").order("email"),
  ]);
  const inCampaign = new Set((leads.data ?? []).map((l: { contact_id: string }) => l.contact_id));
  return {
    campaign,
    leads: must(leads, "campaign leads"),
    contentHash: must(hash, "campaign hash") as string,
    // PostgREST returns a to-one relation as an object; the untyped client infers an array.
    availableContacts: (must(eligible, "eligible contacts") as unknown as AvailableContact[]).filter((c) => !inCampaign.has(c.id)),
  };
}

export async function pendingApprovals() {
  const db = getDb();
  const campaigns = must(await db.from("acq_campaigns").select("*").eq("status", "pending_approval").order("created_at"), "pending campaigns");
  const out = [];
  for (const c of campaigns) {
    const detail = await getCampaign(c.id);
    if (!detail) continue;
    const companyIds = [...new Set(detail.leads.map((l: { acq_contacts: { acq_companies: { id: string } | null } }) => l.acq_contacts.acq_companies?.id).filter(Boolean))] as string[];
    const [research, consent] = await Promise.all([
      companyIds.length ? db.from("acq_research_records").select("company_id,observed_fact,evidence_excerpt,source_url,category").in("company_id", companyIds) : Promise.resolve({ data: [], error: null }),
      db.from("acq_consent_records").select("contact_id,consent_type,legal_basis,evidence_url,evidence_notes,reviewed_by,reviewed_at,created_at").in("contact_id", detail.leads.map((l: { contact_id: string }) => l.contact_id)).order("created_at", { ascending: false }),
    ]);
    out.push({ ...detail, research: must(research, "research"), consent: must(consent, "consent") });
  }
  return out;
}

export async function listReplies() {
  const db = getDb();
  return must(await db.from("acq_replies").select("*, acq_contacts(id,name,email,role, acq_companies(name))").order("received_at", { ascending: false }).limit(200), "replies");
}

export async function listMeetings() {
  const db = getDb();
  return must(await db.from("acq_meetings").select("*, acq_contacts(name,email, acq_companies(name))").order("created_at", { ascending: false }).limit(200), "meetings");
}

export async function settingsOverview() {
  const db = getDb();
  const [suppressions, jobs, audit, paused, autoFlag] = await Promise.all([
    db.from("acq_suppressions").select("*").order("created_at", { ascending: false }).limit(200),
    db.from("acq_jobs").select("id,type,status,attempts,last_error,run_at").in("status", ["pending", "running", "failed"]).order("run_at", { ascending: false }).limit(25),
    db.from("acq_audit_logs").select("*").order("created_at", { ascending: false }).limit(25),
    db.from("acq_settings").select("value").eq("key", "sending_paused").maybeSingle(),
    db.from("acq_settings").select("value").eq("key", "auto_research_enabled").maybeSingle(),
  ]);
  const env = acqEnv();
  return {
    suppressions: must(suppressions, "suppressions"),
    jobs: must(jobs, "jobs"),
    audit: must(audit, "audit log"),
    sendingPaused: must(paused, "settings")?.value !== false,
    autoResearchEnabled: must(autoFlag, "settings")?.value === true,
    ai: await aiStatus(db),
    identity: await loadSenderIdentity(db),
    config: {
      "Supabase (service role)": !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      "Unsubscribe signing secret": (process.env.ACQ_UNSUBSCRIBE_SECRET ?? "").length >= 32,
      "Webhook signing secret": (process.env.ACQ_WEBHOOK_SECRET ?? "").length >= 16,
      "Cron secret": !!process.env.CRON_SECRET,
      "Search API key (discovery)": !!process.env.BRAVE_SEARCH_API_KEY,
      "Brevo API key": !!(process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY),
      "Brevo sender (subdomain)": !!brevoSenderEmail(),
      "Recipient allowlist (pilot guard)": !!sendAllowlist(),
      "Telegram alerts": !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      "Booking link": !!env.bookingUrl,
    } as Record<string, boolean>,
    maxDailyLimit: env.maxDailyLimit,
    operator: env.operatorName,
  };
}
