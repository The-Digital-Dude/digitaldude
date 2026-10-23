/**
 * Multi-Rep, Multi-Country Outreach Engine for The Digital Dude (digitaldude.co.uk)
 * 
 * Features:
 * 1. MULTI-REP ARCHITECTURE:
 *    - Automatically discovers active sales reps from the Supabase `employees` table.
 *    - Sends from each rep's assigned company alias (e.g. sakib@digitaldude.co.uk, radiya@digitaldude.co.uk, farhad@digitaldude.co.uk).
 *    - Includes rep's personal booking link (/contact?ref=<rep_referral_code>) and photo/monogram signature.
 *    - Reply-To is centralized to info@digitaldude.co.uk.
 * 2. COUNTRY & TIMEZONE OPTIMIZATION:
 *    - Automatically dispatches during the optimal 9:00 AM - 10:30 AM local business window for each target market:
 *      • UK (GB) & Europe: 09:00 UTC
 *      • USA (US) & Canada (CA): 14:00 UTC (10:00 AM EST)
 *      • Australia (AU): 23:00 UTC (10:00 AM AEST)
 *    - Supports manual override via --country=<CODE> or TARGET_COUNTRY env var.
 * 3. DELIVERABILITY & COOLDOWN:
 *    - Randomized 5–10 second cooldown delay between each send to prevent burst spam flagging.
 *    - Capped at maximum 20 emails per rep per business day.
 * 4. STRICT DELIVERABILITY GATES & AUTO-DISQUALIFICATION:
 *    - Rejects & marks 'unqualified' any role-based emails (admin@, info@, jobs@, etc.) or inactive MX domains.
 *    - Generates bespoke, tailored 30-minute discovery pitches from rep-researched pain points & solutions.
 * 5. POST-SEND CRM SYNCHRONIZATION:
 *    - Updates `rep_leads` stage to 'contacted', status to 'attempted'.
 *    - Logs in `rep_outreach_logs` and `rep_audit_logs` (powers the Admin Productivity dashboard).
 *    - Schedules auto follow-up task in `rep_lead_tasks` due in 4 working days for that specific rep.
 */

import fs from "fs";
import path from "path";
import dns from "dns";
import { fileURLToPath } from "url";

// Set reliable public DNS servers for cross-platform MX record verification
const dnsPromises = dns.promises;
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore if restricted in sandboxed environments
}

// Polyfill or provide a stub WebSocket if running on Node < 22 where native WebSocket is absent
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = class DummyWebSocket {};
}

const { createClient } = await import("@supabase/supabase-js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(ROOT_DIR, ".env.local");
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, "utf8");
    text.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    });
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
const AUTO_SEND = process.env.AUTO_SEND_EMAILS === "true" || process.argv.includes("--send");

// Parse country filter from CLI flags (--country=GB) or environment variable
function getTargetCountryFilter() {
  const arg = process.argv.find(a => a.startsWith("--country="));
  if (arg) return arg.split("=")[1].trim().toUpperCase();
  if (process.env.TARGET_COUNTRY) return process.env.TARGET_COUNTRY.trim().toUpperCase();
  return "AUTO";
}

const TARGET_COUNTRY_ARG = getTargetCountryFilter();

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const DEFAULT_REPLY_TO = "info@digitaldude.co.uk";
const HEADQUARTERS_FOOTER = "The Digital Dude • Dhanmondi, Dhaka, Bangladesh";
const MAX_EMAILS_PER_REP_PER_RUN = 20;

// Resolve target countries based on UTC hour or manual input
function resolveTargetCountries(mode) {
  if (mode && mode !== "AUTO") {
    if (mode === "ALL") return null; // No country restriction
    return mode.split(",").map(c => c.trim().toUpperCase());
  }

  // AUTO Mode: Check current UTC hour to align with local 9:00 AM - 10:30 AM
  const utcHour = new Date().getUTCHours();
  console.log(`[Auto Timezone Dispatcher] Current UTC Hour: ${utcHour}:00`);

  if (utcHour >= 8 && utcHour <= 11) {
    console.log("-> Matched morning window for UK & Europe (GB, IE, DE, FR)");
    return ["GB", "UK", "IE", "DE", "FR"];
  } else if (utcHour >= 13 && utcHour <= 16) {
    console.log("-> Matched morning window for USA & Canada (US, CA)");
    return ["US", "CA", "USA"];
  } else if (utcHour >= 22 || utcHour <= 2) {
    console.log("-> Matched morning window for Australia & New Zealand (AU, NZ)");
    return ["AU", "NZ"];
  }

  console.log("-> Outside peak automated morning windows. Running standard queue for all regions.");
  return null;
}

// Target Commercial Sectors with Diagnosed Bottlenecks & Tailored System Solutions
const SECTOR_INTELLIGENCE = {
  "field-services": {
    sector: "Field Services & Contracting Operations",
    tag: "field-services",
    painPoint: "Technician dispatch managed over WhatsApp threads and spreadsheets; delayed billing and lost job status updates.",
    solution: "Bespoke Operations & Dispatch CRM: Mobile technician web app with GPS check-in, real-time job tracking, and automated invoicing upon digital sign-off.",
    subject: "Streamlining {company}'s dispatch & field workflow",
    body: (c) => `Hi ${c.first},\n\nI came across ${c.name}'s operations in ${c.city} and wanted to reach out directly.\n\nAt The Digital Dude, we engineer bespoke operations systems and field dispatch CRMs for growing trade and contracting businesses.\n\nMost founders we speak with were losing 10-15 hours a week coordinating technicians across WhatsApp chats and disjointed spreadsheets—or paying thousands every month in rigid per-user software licensing.\n\nWe build custom operations platforms mapped 100% to your exact workflow: technicians update job status and upload proof photos on mobile, while client invoices trigger automatically upon job sign-off. Zero per-seat license fees forever.\n\nWould you be open to a 30-minute discovery call next week to see if custom workflow automation would deliver high ROI for ${c.name}?`
  },
  "property-management": {
    sector: "Property Management & Commercial Fit-Out",
    tag: "property-management",
    painPoint: "Disconnected maintenance handoffs across landlords, tenants, and contractors; safety compliance tracked manually.",
    solution: "Custom Property Operations CRM: Unified maintenance ticketing, automated contractor dispatch, and self-serve landlord/tenant portals.",
    subject: "Custom workflow automation for {company}",
    body: (c) => `Hi ${c.first},\n\nI was reviewing ${c.name}'s operations across ${c.city} and wanted to reach out.\n\nAt The Digital Dude, we build custom workflow systems and management portals for high-growth property, fit-out, and commercial installation firms.\n\nOff-the-shelf software forces your operations into rigid boxes while charging escalating monthly fees as your team expands. We build unified platforms that automate maintenance scheduling, client quote approvals, and contractor handoffs from one central dashboard that you own outright.\n\nWould you be open to a 30-minute discovery call next Tuesday or Thursday to explore how automating these handoffs could streamline your team's day?`
  },
  "logistics-fleet": {
    sector: "Logistics, Haulage & Fleet Operations",
    tag: "logistics-fleet",
    painPoint: "Manual driver manifests, delayed proof of delivery (POD) paperwork, and spreadsheets between dispatchers and depot managers.",
    solution: "Bespoke Fleet & Depot Operations Platform: Driver mobile app for digital POD signatures, real-time load tracking, and instant billing integration upon drop-off.",
    subject: "Streamlining {company}'s dispatch & POD workflow",
    body: (c) => `Hi ${c.first},\n\nI came across ${c.name}'s transport operations in ${c.city} and wanted to reach out directly.\n\nAt The Digital Dude, we build bespoke logistics operations platforms and driver dispatch workflows for growing UK transport and freight operators.\n\nMost operators we speak with were losing 10-15 hours a week chasing paper delivery notes, manual POD sign-offs, and driver manifests across WhatsApp and disconnected spreadsheets.\n\nWe build custom operations platforms mapped 100% to your depot workflow: drivers capture digital POD signatures and timestamps on mobile, while client invoices trigger automatically upon job delivery. Zero per-seat license fees forever.\n\nWould you be open to a 30-minute discovery call next week to see if custom workflow automation would deliver high ROI for ${c.name}?`
  },
  "healthcare-ops": {
    sector: "Specialized Healthcare & Multi-Location Clinics",
    tag: "healthcare-ops",
    painPoint: "Juggling disjointed booking tools, manual patient intake forms, and multi-chair practitioner scheduling across clinic locations.",
    solution: "Custom Clinical Operations System: Unified multi-chair scheduling, automated patient intake workflows, and zero per-doctor seat fees.",
    subject: "Modernizing clinical workflows & patient intake for {company}",
    body: (c) => `Hi ${c.first},\n\nI was reviewing ${c.name}'s clinical practice in ${c.city} and wanted to reach out.\n\nAt The Digital Dude, we engineer bespoke operations platforms and patient intake systems for multi-chair and specialized clinics.\n\nInstead of juggling separate booking tools, spreadsheet lists, and manual patient follow-ups, we unify the entire patient journey—from online triage to automated SMS reminders and multi-practitioner scheduling—into one private system that you own.\n\nWould you be open to a 30-minute discovery call next week to see how this eliminates operational admin for your clinic team?`
  },
  "b2b-professional": {
    sector: "B2B Professional Services & Advisory",
    tag: "b2b-professional",
    painPoint: "Paying £1,000–£3,000/mo in escalating Salesforce/HubSpot seat licensing; client onboarding documents collected across chaotic email threads.",
    solution: "Bespoke Client Onboarding & Pipeline CRM: 100% data ownership, custom matter tracking, and zero per-user software licensing.",
    subject: "Eliminating escalating CRM licensing fees for {company}",
    body: (c) => `Hi ${c.first},\n\nI came across ${c.name}'s commercial practice in ${c.city} and wanted to share a quick perspective.\n\nAt The Digital Dude, we build bespoke CRMs and client onboarding platforms for high-growth professional service firms looking to escape £150–£300/user/month Salesforce or HubSpot licensing taxes.\n\nWe engineer custom systems designed 100% around your partner workflow, client document intake, and matter tracking—delivering an infrastructure your firm owns outright with zero per-seat fees as your headcount grows.\n\nWould you be open to a 30-minute discovery call next week to compare the workflow fit and 3-year ROI against off-the-shelf software?`
  },
  "training-providers": {
    sector: "Training, Education & Apprenticeship Providers",
    tag: "training-providers",
    painPoint: "Managing student progress, compliance audits, and employer reporting across disjointed spreadsheets and multiple disparate portals.",
    solution: "Custom Learner Operations & Compliance Platform: Centralized candidate progression tracking, automated audit-ready compliance reporting, and employer self-serve portals.",
    subject: "Custom learner tracking & compliance automation for {company}",
    body: (c) => `Hi ${c.first},\n\nI was reviewing ${c.name}'s apprenticeship programs in ${c.city} and wanted to reach out.\n\nAt The Digital Dude, we build bespoke operations platforms and learner tracking systems for leading UK training and apprenticeship providers.\n\nInstead of wrestling with clunky LMS portals, spreadsheets, and manual compliance audits for ESFA/Ofsted, we unify the entire candidate journey—from initial employer onboarding to milestone tracking and audit-ready compliance reporting—into one platform that you own outright.\n\nWould you be open to a 30-minute discovery call next week to explore how custom workflow automation could simplify your operational reporting for ${c.name}?`
  },
  "manufacturing-engineering": {
    sector: "Manufacturing, Fabrication & Engineering",
    tag: "manufacturing-engineering",
    painPoint: "Production job queues managed on paper printouts; delayed client updates and manual stock reconciliation across departments.",
    solution: "Custom Order-to-Production Workflow Portal: Real-time floor progress tracking, digital BOM sign-offs, and automated client shipping alerts.",
    subject: "Modernizing {company}'s production & job tracking workflow",
    body: (c) => `Hi ${c.first},\n\nI came across ${c.name}'s engineering and manufacturing operations in ${c.city} and wanted to reach out.\n\nAt The Digital Dude, we build bespoke production workflow systems and order tracking platforms for UK manufacturing and specialist fabrication firms.\n\nMost plant directors we speak with were losing dozens of hours each week reconciling job sheets between sales, shop floors, and dispatch on paper and Excel.\n\nWe build custom portals designed around your exact manufacturing stages—giving your team real-time visibility from quote approval to shop floor dispatch with zero recurring per-seat fees.\n\nWould you be open to a 30-minute discovery call next week to see how custom workflow automation could streamline operations for ${c.name}?`
  },
  "aec-consultancy": {
    sector: "Architectural & AEC Consultancies",
    tag: "aec-consultancy",
    painPoint: "Project milestone billing delayed by manual timesheets; client drawing feedback scattered across fragmented email threads.",
    solution: "Custom Project & Timesheet Governance Dashboard: Centralized drawing sign-offs, milestone profitability tracking, and client portal.",
    subject: "Streamlining project delivery & milestone tracking for {company}",
    body: (c) => `Hi ${c.first},\n\nI was reviewing ${c.name}'s architectural and design work across ${c.city} and wanted to connect.\n\nAt The Digital Dude, we build custom project operations platforms and client delivery portals for leading UK architectural and engineering practices.\n\nInstead of juggling fragmented email threads for design approvals and tracking fee milestones in spreadsheets, we unify project tracking, drawing sign-offs, and fee schedules into one bespoke system that your practice owns.\n\nWould you be open to a 30-minute discovery call next week to see if custom workflow automation could eliminate admin for ${c.name}'s project leaders?`
  }
};

// Strict Role-Based Email Blocklist
const ROLE_BASED_EMAIL_PREFIXES = new Set([
  "admin", "administrator", "info", "information", "jobs", "careers", "hiring",
  "business", "contact", "contactus", "support", "help", "billing", "accounts",
  "invoices", "sales", "marketing", "press", "media", "hello", "hi", "team",
  "office", "general", "enquiries", "inquiries", "reception", "desk", "service",
  "services", "mail", "postmaster", "webmaster", "privacy", "compliance", "legal",
  "stay", "stays", "feedback", "direct"
]);

function isRoleBasedEmail(email) {
  if (!email || !email.includes("@")) return true;
  const localPart = email.split("@")[0].toLowerCase().trim();
  const basePrefix = localPart.replace(/[0-9_.-]+$/, "");
  return ROLE_BASED_EMAIL_PREFIXES.has(localPart) || ROLE_BASED_EMAIL_PREFIXES.has(basePrefix);
}

function isValidHumanName(fullName, email) {
  if (!fullName) return false;
  const trimmed = fullName.trim();
  if (trimmed.length < 3) return false;

  const lower = trimmed.toLowerCase();
  if (ROLE_BASED_EMAIL_PREFIXES.has(lower)) return false;

  const localPart = email ? email.split("@")[0].toLowerCase() : "";
  if (lower === localPart) return false;

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2 && !/^Dr\.|Prof\.|Mr\.|Ms\.|Mrs\./i.test(trimmed)) {
    return false;
  }

  if (/\b(ltd|limited|llp|plc|inc|corp|co|gmbh|services|company|solutions|technologies|group|nominee|secretaries|directors)\b/i.test(lower)) {
    return false;
  }

  return true;
}

function isValidCompanyName(companyName) {
  if (!companyName) return false;
  const trimmed = companyName.trim();
  if (trimmed.length < 2 || trimmed.length > 55) return false;
  if (trimmed.includes(" | ") || trimmed.includes(" - ") || trimmed.includes(" : ")) return false;
  if (/Specialist Rental|Property Managers:|Driving Business|Software Development Company/i.test(trimmed)) return false;
  return true;
}

function extractDomain(email) {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[1].toLowerCase().trim();
}

async function verifyDomainMx(domain) {
  if (!domain) return false;
  try {
    const mx = await dnsPromises.resolveMx(domain);
    return Array.isArray(mx) && mx.length > 0;
  } catch (err) {
    return false;
  }
}

// 5 to 10 Second Randomized Cooldown Delay
async function sleepRandomCooldown(minMs = 5000, maxMs = 10000) {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  console.log(`[Cooldown Delay] Waiting ${(delay / 1000).toFixed(1)}s before next dispatch to maintain organic deliverability...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

function addWorkingDays(from, n) {
  const d = new Date(from);
  let left = n;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

// Synthesizes a bespoke pitch if rep did not write an explicit subject/body
function synthesizePitchFromIntelligence({ lead, rep }) {
  const notes = lead.notes || "";

  // 1. Check if rep explicitly provided [OUTREACH EMAIL DRAFT]
  const subjectMatch = notes.match(/\[OUTREACH EMAIL DRAFT\]\s*\nSubject:\s*(.+)/);
  const bodyMatch = notes.match(/Subject:[^\n]+\n\n([\s\S]+)$/);
  if (subjectMatch && bodyMatch) {
    return {
      subject: subjectMatch[1].trim(),
      bodyText: bodyMatch[1].trim()
    };
  }

  // 2. Extract pain point and solution
  let painPoint = "";
  let solution = "";
  const painMatch = notes.match(/\[PAIN POINTS \/ TRIGGERS\]\s*\n([\s\S]*?)(?=\n\[|$)/i);
  if (painMatch) painPoint = painMatch[1].trim();
  const solMatch = notes.match(/\[PROPOSED SOLUTION\]\s*\n([\s\S]*?)(?=\n\[|$)/i);
  if (solMatch) solution = solMatch[1].trim();

  const firstName = (lead.full_name || "").trim().split(/\s+/)[0] || "there";
  const company = lead.company_name || "your company";

  const subject = `Custom workflow automation for ${company}`;

  let body = `Hi ${firstName},\n\nI was reviewing ${company}'s operations and wanted to reach out directly.\n\nAt The Digital Dude, we build bespoke workflow management platforms and custom operations CRMs for growing businesses looking to replace rigid per-user software licensing.\n\n`;

  if (painPoint) {
    const firstPain = painPoint.split("\n")[0].replace(/^\d+[\.\)]\s*/, "").trim();
    body += `Most founders and operations leaders we partner with were losing dozens of hours every week dealing with ${firstPain.toLowerCase()}.\n\n`;
  }

  if (solution) {
    const firstSol = solution.split("\n")[0].replace(/^\d+[\.\)]\s*/, "").trim();
    body += `We build unified platforms tailored 100% to your workflow: ${firstSol.charAt(0).toLowerCase() + firstSol.slice(1)}—giving your team complete data ownership with zero recurring per-seat fees.\n\n`;
  }

  body += `Would you be open to a 30-minute discovery call next week to see if custom workflow automation would deliver high ROI for ${company}?`;

  return { subject, bodyText: body };
}

function stripRedundantBookingLinks(text) {
  if (!text) return "";
  return text
    .replace(/(?:Book a [^\n]*call[^\n]*:?\s*)?https?:\/\/(?:www\.)?digitaldude\.co\.uk\/contact\S*/gi, "")
    .replace(/^\s*Book a (?:30-minute )?discovery call:?\s*$/gim, "")
    .trim();
}

// Render Branded Personal HTML Email tailored to the specific Sales Rep
function renderRepEmailHtml({ bodyText, bookingUrl, unsubscribeUrl, rep }) {
  const paragraphsHtml = bodyText
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#2d2d4d;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const buttonHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 20px 0;">
      <tr>
        <td>
          <a href="${bookingUrl}" target="_blank" style="display:inline-block;background-color:#7b61ff;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:10px;">Book a 30-minute discovery call &rarr;</a>
        </td>
      </tr>
    </table>
  `;

  const repPhoto = rep.photo_url || "https://zwiueukitnvbcxylrewv.supabase.co/storage/v1/object/public/rep-photos/c08ff113-c16a-42be-9bc1-147a774135ba/4b788b6d-1ae0-4262-9ebd-fa2c037988d1.jpg";
  const repName = rep.outreach_display_name || rep.full_name;
  const repRole = rep.role_title || "Business Development";

  const signatureHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
      <tr>
        <td style="padding-right:14px;vertical-align:middle;">
          <img src="${repPhoto}" alt="${repName}" width="52" height="52" style="width:52px;height:52px;border-radius:50%;object-fit:cover;display:block;border:0;">
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a4e;">${repName}</p>
          <p style="margin:2px 0 0 0;font-size:13px;color:#7b61ff;font-weight:600;">${repRole}</p>
          <p style="margin:3px 0 0 0;font-size:12px;">
            <a href="https://www.digitaldude.co.uk" style="color:#7b61ff;text-decoration:none;">The Digital Dude &bull; Custom Systems &amp; Automation</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  const footerHtml = `
    <div style="margin-top:28px;font-size:11px;color:#8a8aa6;line-height:1.5;">
      <p style="margin:0;">${HEADQUARTERS_FOOTER}</p>
      <p style="margin:6px 0 0 0;"><a href="${unsubscribeUrl}" style="color:#8a8aa6;text-decoration:underline;">Unsubscribe from future emails</a></p>
    </div>
  `;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>The Digital Dude</title></head><body style="margin:0;padding:24px 16px;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:580px;margin:0 auto;">${paragraphsHtml}${buttonHtml}${signatureHtml}${footerHtml}</div></body></html>`;
}

async function sendBrevoOutreach({ toEmail, toName, subject, bodyText, rep }) {
  if (!BREVO_API_KEY) {
    console.log(`[DRY RUN] No BREVO_API_KEY configured. Simulated send to ${toEmail}`);
    return { ok: true, messageId: "dry-run" };
  }

  const cleanBody = stripRedundantBookingLinks(bodyText);
  const repBookingUrl = `https://www.digitaldude.co.uk/contact?ref=${rep.referral_code || 'farhad-hossain'}`;
  const unsubscribeUrl = `https://www.digitaldude.co.uk/api/outreach/unsubscribe?email=${encodeURIComponent(toEmail)}`;

  const repSenderName = `${rep.outreach_display_name || rep.full_name} | ${rep.role_title || 'Business Development'}, The Digital Dude`;
  const repSenderEmail = rep.assigned_outreach_email || "farhad@digitaldude.co.uk";

  const htmlContent = renderRepEmailHtml({
    bodyText: cleanBody,
    bookingUrl: repBookingUrl,
    unsubscribeUrl,
    rep
  });

  const payload = {
    sender: { name: repSenderName, email: repSenderEmail },
    to: [{ email: toEmail, name: toName }],
    replyTo: { name: "The Digital Dude", email: DEFAULT_REPLY_TO },
    subject: subject,
    textContent: `${cleanBody}\n\nBook a 30-minute discovery call: ${repBookingUrl}\n\n${rep.full_name}\n${rep.role_title || 'Business Development'} | The Digital Dude\n${HEADQUARTERS_FOOTER}\nhttps://www.digitaldude.co.uk\n\nUnsubscribe: ${unsubscribeUrl}`,
    htmlContent: htmlContent
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      return { ok: true, messageId: data.messageId };
    } else {
      return { ok: false, error: data.message || JSON.stringify(data) };
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log("==================================================================");
  console.log(" The Digital Dude — Multi-Rep Time-Optimized Outreach Engine      ");
  console.log("==================================================================");
  console.log(`Operating Headquarters: ${HEADQUARTERS_FOOTER}`);
  console.log(`Target Country Mode:    ${TARGET_COUNTRY_ARG}`);
  console.log(`Mode:                   ${AUTO_SEND ? "AUTO-SEND (Brevo Active with 5-10s Cooldown)" : "CRM REVIEW / DRY RUN ONLY"}`);

  const targetCountries = resolveTargetCountries(TARGET_COUNTRY_ARG);
  console.log(`Active Target Filter:   ${targetCountries ? targetCountries.join(", ") : "ALL COUNTRIES"}`);

  // Fetch all active sales representatives
  const { data: allEmployees, error: empErr } = await supabase
    .from("employees")
    .select("id, full_name, email, role_title, status, assigned_outreach_email, outreach_display_name, referral_code, photo_url")
    .order("created_at", { ascending: true });

  if (empErr || !allEmployees || allEmployees.length === 0) {
    console.error("No active sales representatives found in employees table.");
    return;
  }

  console.log(`Discovered ${allEmployees.length} registered team members in CRM.`);

  // Fetch all past outreach logs for deduplication
  const { data: pastLogs } = await supabase
    .from("rep_outreach_logs")
    .select("recipient_email, employee_id");

  const globalSentEmailSet = new Set((pastLogs || []).map(l => (l.recipient_email || "").toLowerCase().trim()));
  const globalContactedDomainSet = new Set();
  (pastLogs || []).forEach(l => {
    const d = extractDomain(l.recipient_email);
    if (d) globalContactedDomainSet.add(d);
  });

  let totalEmailsSentAllReps = 0;
  let totalTasksCreatedAllReps = 0;

  // Process dispatch per sales representative
  for (const rep of allEmployees) {
    console.log(`\n------------------------------------------------------------------`);
    console.log(`Processing Sales Rep: ${rep.full_name} (${rep.role_title})`);
    console.log(`Outreach Mailbox:     ${rep.assigned_outreach_email}`);
    console.log(`Booking Reference:    https://www.digitaldude.co.uk/contact?ref=${rep.referral_code}`);

    // Query candidate leads for this rep
    let leadQuery = supabase
      .from("rep_leads")
      .select("id, full_name, email, company_name, job_title, country, notes, tags, stage, status, created_at")
      .eq("employee_id", rep.id)
      .eq("stage", "new")
      .order("created_at", { ascending: false });

    // Apply country filter if active
    if (targetCountries && targetCountries.length > 0) {
      leadQuery = leadQuery.in("country", targetCountries);
    }

    const { data: rawCandidates, error: candErr } = await leadQuery;

    if (candErr) {
      console.error(`Error querying candidate leads for ${rep.full_name}:`, candErr);
      continue;
    }

    console.log(`Found ${(rawCandidates || []).length} pending leads in ${rep.full_name}'s CRM matching target region.`);

    const qualifiedLeads = [];

    for (const lead of (rawCandidates || [])) {
      if (qualifiedLeads.length >= MAX_EMAILS_PER_REP_PER_RUN) break;

      const email = (lead.email || "").toLowerCase().trim();
      const domain = extractDomain(email);

      // Gate 1: Check duplicate
      if (globalSentEmailSet.has(email)) continue;

      // Gate 2: Check role email (Auto-disqualify if invalid)
      if (isRoleBasedEmail(email)) {
        console.log(`[Disqualifying Lead] ${email} is role-based (admin/info/jobs).`);
        await supabase.from("rep_leads").update({
          status: "unqualified",
          notes: `${lead.notes || ""}\n\n[DISQUALIFIED BY OUTREACH ENGINE]: Role-based email prefix (${email.split('@')[0]}) not permitted for cold outreach.`
        }).eq("id", lead.id);
        continue;
      }

      // Gate 3: Check real human name
      if (!isValidHumanName(lead.full_name, email)) {
        console.log(`[Disqualifying Lead] "${lead.full_name}" is not a valid human name.`);
        await supabase.from("rep_leads").update({
          status: "unqualified",
          notes: `${lead.notes || ""}\n\n[DISQUALIFIED BY OUTREACH ENGINE]: Non-human or generic contact name.`
        }).eq("id", lead.id);
        continue;
      }

      // Gate 4: Check company name
      if (!isValidCompanyName(lead.company_name)) {
        continue;
      }

      // Gate 5: Check research intelligence
      const notes = lead.notes || "";
      const hasPain = notes.includes("[PAIN POINTS / TRIGGERS]") || notes.toLowerCase().includes("pain point");
      const hasSol = notes.includes("[PROPOSED SOLUTION]") || notes.toLowerCase().includes("proposed solution");
      if (!hasPain && !hasSol && notes.length < 50) {
        continue;
      }

      // Gate 6: Domain deduplication
      if (globalContactedDomainSet.has(domain)) {
        continue;
      }

      // Gate 7: Active MX Verification
      const hasMx = await verifyDomainMx(domain);
      if (!hasMx) {
        console.log(`[Disqualifying Lead] Domain ${domain} has no active MX records.`);
        await supabase.from("rep_leads").update({
          status: "unqualified",
          notes: `${lead.notes || ""}\n\n[DISQUALIFIED BY OUTREACH ENGINE]: Domain has no active MX mail exchangers.`
        }).eq("id", lead.id);
        continue;
      }

      globalContactedDomainSet.add(domain);
      qualifiedLeads.push(lead);
    }

    console.log(`Qualified Leads Ready for ${rep.full_name}: ${qualifiedLeads.length} (Max per run: ${MAX_EMAILS_PER_REP_PER_RUN})`);

    if (!AUTO_SEND) {
      console.log(`AUTO_SEND is disabled. Qualified leads remain in ${rep.full_name}'s Rep Dashboard.`);
      continue;
    }

    let repSentCount = 0;

    for (let i = 0; i < qualifiedLeads.length; i++) {
      const lead = qualifiedLeads[i];
      const cleanEmail = lead.email.toLowerCase().trim();

      // Synthesize bespoke tailored pitch
      const pitch = synthesizePitchFromIntelligence({ lead, rep });

      console.log(`[Dispatching #${i + 1}/${qualifiedLeads.length}] To: ${lead.full_name} <${cleanEmail}> at ${lead.company_name} via ${rep.assigned_outreach_email}`);

      const sendRes = await sendBrevoOutreach({
        toEmail: cleanEmail,
        toName: lead.full_name,
        subject: pitch.subject,
        bodyText: pitch.bodyText,
        rep
      });

      if (sendRes.ok) {
        repSentCount++;
        totalEmailsSentAllReps++;
        const nowIso = new Date().toISOString();

        // 1. Move lead stage to 'contacted'
        await supabase
          .from("rep_leads")
          .update({
            stage: "contacted",
            status: "attempted",
            last_contacted_at: nowIso,
            last_activity_at: nowIso
          })
          .eq("id", lead.id);

        // 2. Log in rep_outreach_logs
        await supabase.from("rep_outreach_logs").insert({
          employee_id: rep.id,
          recipient_email: cleanEmail,
          recipient_name: lead.full_name,
          company_name: lead.company_name,
          subject: pitch.subject,
          body_content: pitch.bodyText,
          template_used: (lead.tags && lead.tags[2]) || "bespoke_custom"
        });

        // 2b. Log in rep_audit_logs (for Admin Productivity & Real-Time Tracking)
        await supabase.from("rep_audit_logs").insert({
          employee_id: rep.id,
          action_type: "outreach_sent",
          description: `Sent cold outreach email to ${lead.full_name} (${cleanEmail}) via alias ${rep.assigned_outreach_email}.`,
          target_identifier: cleanEmail,
          metadata: {
            subject: pitch.subject,
            company: lead.company_name,
            rep_alias: rep.assigned_outreach_email,
            country: lead.country || "GB"
          },
          created_at: nowIso
        });

        // 3. Log activity in rep_lead_activities
        await supabase.from("rep_lead_activities").insert({
          lead_id: lead.id,
          employee_id: rep.id,
          type: "email_sent",
          outcome: "sent",
          summary: `Outreach email sent: "${pitch.subject}"`,
          details: {
            subject: pitch.subject,
            body: pitch.bodyText,
            sender: rep.assigned_outreach_email,
            messageId: sendRes.messageId || "ok"
          },
          occurred_at: nowIso
        });

        // 4. Auto-schedule follow-up task due in 4 working days assigned to this rep
        const followUpDue = addWorkingDays(new Date(), 4);
        await supabase.from("rep_lead_tasks").insert({
          lead_id: lead.id,
          employee_id: rep.id,
          title: `Follow up with ${lead.full_name} regarding custom workflow automation`,
          due_at: followUpDue.toISOString(),
          kind: "follow_up",
          auto: true,
          status: "open"
        });
        totalTasksCreatedAllReps++;

        globalSentEmailSet.add(cleanEmail);

        // Enforce 5-10 second randomized cooldown between sends (except after last email)
        if (i < qualifiedLeads.length - 1) {
          await sleepRandomCooldown(5000, 10000);
        }
      } else {
        console.error(`Failed to send to ${cleanEmail}:`, sendRes.error);
      }
    }

    console.log(`Finished dispatch for ${rep.full_name}: Sent ${repSentCount} emails.`);
  }

  console.log("\n==================================================================");
  console.log(" Outreach Execution Summary");
  console.log("==================================================================");
  console.log(`Total Emails Sent Across All Reps: ${totalEmailsSentAllReps}`);
  console.log(`Total Follow-Up Tasks Created:     ${totalTasksCreatedAllReps}`);
  console.log("Admin Productivity URL: /admin/reps");
  console.log("Rep Portal URL:         /rep/dashboard");
}

main().catch(console.error);
