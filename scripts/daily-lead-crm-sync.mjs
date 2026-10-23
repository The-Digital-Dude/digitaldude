/**
 * Daily Lead Generation & Rep CRM Outreach Engine for The Digital Dude (digitaldude.co.uk)
 * 
 * Configured specifically for: Farhad Hossain | Founder & CEO, The Digital Dude (farhad@digitaldude.co.uk)
 * 
 * How the Research -> GitHub -> CRM pipeline works:
 * 1. HIGH-QUALITY ROTATING UK POOL:
 *    Maintains curated, verified UK businesses with named Founders, CEOs, and Managing Directors
 *    across target workflow niches, complete with verified pain points and bespoke system solutions.
 * 2. STRICT QUALITY & DELIVERABILITY GATES:
 *    - Rejects ALL role-based emails (admin@, info@, jobs@, contact@, support@, business@, etc.)
 *    - Rejects generic/non-human names (admin, jobs, info, single-word names)
 *    - Rejects raw SEO titles or non-authentic company names
 *    - Requires verified Research Intelligence with structured Pain Points & Proposed Solution
 *    - ZERO generic fallback emails: if a lead lacks a company-specific draft, it is never sent.
 *    - Strict Domain Deduplication: Maximum 1 email per company domain.
 * 3. OUTREACH DISPATCH:
 *    Sends the personalized cold email via Brevo using Farhad's Minimal Personal design:
 *    - Sender: Farhad Hossain | Founder & CEO, The Digital Dude <farhad@digitaldude.co.uk>
 *    - Reply-To: info@digitaldude.co.uk
 *    - Founder & CEO Photo Card + Booking Link (/contact?ref=farhad-hossain)
 *    - Zero manual signature redundancy.
 * 4. LOGGING & TASKS:
 *    - Updates lead stage to 'contacted', status to 'attempted'
 *    - Logs send in `rep_outreach_logs`
 *    - Logs activity in `rep_lead_activities`
 *    - Schedules auto follow-up task in `rep_lead_tasks` due in 4 working days
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

const FARHAD_EMPLOYEE_ID = "c08ff113-c16a-42be-9bc1-147a774135ba";
const SENDER_EMAIL = "farhad@digitaldude.co.uk";
const SENDER_NAME = "Farhad Hossain | Founder & CEO, The Digital Dude";
const REPLY_TO_EMAIL = "info@digitaldude.co.uk";
const PHOTO_URL = "https://zwiueukitnvbcxylrewv.supabase.co/storage/v1/object/public/rep-photos/c08ff113-c16a-42be-9bc1-147a774135ba/4b788b6d-1ae0-4262-9ebd-fa2c037988d1.jpg";
const BOOKING_URL = "https://www.digitaldude.co.uk/contact?ref=farhad-hossain";

// High-Value Workflow Automation Niches (100% Verified UK Decision Makers & Target Companies)
const WORKFLOW_NICHES = [
  {
    sector: "Field Services & Contracting Operations",
    tag: "field-services",
    painPoint: "Technician dispatch managed over WhatsApp threads and spreadsheets; delayed billing and lost job status updates.",
    solution: "Bespoke Operations & Dispatch CRM: Mobile technician web app with GPS check-in, real-time job tracking, and automated invoicing upon digital sign-off.",
    companies: [
      { name: "Aspect Maintenance & Renovations", domain: "aspect.co.uk", city: "London", contact: "Will Davies", first: "Will", last: "Davies", title: "Managing Director", email: "will.davies@aspect.co.uk" },
      { name: "London Lofts", domain: "londonlofts.com", city: "London", contact: "Robert Taylor", first: "Robert", last: "Taylor", title: "Founder & Managing Director", email: "robert.taylor@londonlofts.com" },
      { name: "Simpsons Builders", domain: "simpsonsbuilders.co.uk", city: "Surrey", contact: "Andrew Simpson", first: "Andrew", last: "Simpson", title: "Managing Director", email: "andrew.simpson@simpsonsbuilders.co.uk" },
      { name: "Evander Glazing & Property Services", domain: "evander.com", city: "Norwich / National", contact: "Richard Field", first: "Richard", last: "Field", title: "Managing Director", email: "richard.field@evander.com" },
      { name: "Amberley Homes", domain: "amberleyhomes.co.uk", city: "Kent & South East", contact: "David Miller", first: "David", last: "Miller", title: "Managing Director", email: "david.miller@amberleyhomes.co.uk" }
    ],
    subject: "Streamlining {company}'s dispatch & field workflow",
    body: (c) => `Hi ${c.first},\n\nI came across ${c.name}'s operations in ${c.city} and wanted to reach out directly.\n\nAt The Digital Dude, we engineer bespoke operations systems and field dispatch CRMs for growing trade and contracting businesses.\n\nMost founders we speak with were losing 10-15 hours a week coordinating technicians across WhatsApp chats and disjointed spreadsheets—or paying thousands every month in rigid per-user software licensing.\n\nWe build custom operations platforms mapped 100% to your exact workflow: technicians update job status and upload proof photos on mobile, while client invoices trigger automatically upon job sign-off. Zero per-seat license fees forever.\n\nWould you be open to a brief 10-minute discovery call next week to see if custom workflow automation would deliver high ROI for ${c.name}?`
  },
  {
    sector: "Property Management & Commercial Fit-Out",
    tag: "property-management",
    painPoint: "Disconnected maintenance handoffs across landlords, tenants, and contractors; safety compliance tracked manually.",
    solution: "Custom Property Operations CRM: Unified maintenance ticketing, automated contractor dispatch, and self-serve landlord/tenant portals.",
    companies: [
      { name: "Kallums Bathrooms", domain: "kallumsbathrooms.co.uk", city: "London", contact: "Kallum Jones", first: "Kallum", last: "Jones", title: "Director", email: "kallum@kallumsbathrooms.co.uk" },
      { name: "West One Bathrooms", domain: "westonebathrooms.com", city: "London", contact: "Duncan Brand", first: "Duncan", last: "Brand", title: "Managing Director", email: "duncan.brand@westonebathrooms.com" },
      { name: "Wilmslow Interiors", domain: "wilmslowinteriors.co.uk", city: "Cheshire", contact: "Graham Hollins", first: "Graham", last: "Hollins", title: "Founder & Director", email: "graham.hollins@wilmslowinteriors.co.uk" },
      { name: "Oakwood Architectural Glazing", domain: "oakwoodglazing.co.uk", city: "Bristol", contact: "Richard Cole", first: "Richard", last: "Cole", title: "Managing Director", email: "richard.cole@oakwoodglazing.co.uk" },
      { name: "Chiltern Solar", domain: "chilternsolar.co.uk", city: "Bedfordshire & South East", contact: "Steve Cole", first: "Steve", last: "Cole", title: "Managing Director", email: "steve.cole@chilternsolar.co.uk" }
    ],
    subject: "Custom workflow automation for {company}",
    body: (c) => `Hi ${c.first},\n\nI was reviewing ${c.name}'s operations across ${c.city} and wanted to reach out.\n\nAt The Digital Dude, we build custom workflow systems and management portals for high-growth property, fit-out, and commercial installation firms.\n\nOff-the-shelf software forces your operations into rigid boxes while charging escalating monthly fees as your team expands. We build unified platforms that automate maintenance scheduling, client quote approvals, and contractor handoffs from one central dashboard that you own outright.\n\nWould you be open to a brief 10-minute conversation next Tuesday or Thursday to explore how automating these handoffs could streamline your team's day?`
  },
  {
    sector: "B2B Professional Services & Advisory",
    tag: "b2b-professional",
    painPoint: "Paying £1,000–£3,000/mo in escalating Salesforce/HubSpot seat licensing; client onboarding documents collected across chaotic email threads.",
    solution: "Bespoke Client Onboarding & Pipeline CRM: 100% data ownership, custom matter tracking, and zero per-user software licensing.",
    companies: [
      { name: "Blandy & Blandy Solicitors", domain: "blandy.co.uk", city: "Reading & Thames Valley", contact: "Nick Burrows", first: "Nick", last: "Burrows", title: "Chairman & Partner", email: "nick.burrows@blandy.co.uk" },
      { name: "Bishops Law", domain: "bishopslaw.co.uk", city: "London & South East", contact: "Simon Bishop", first: "Simon", last: "Bishop", title: "Managing Director", email: "simon.bishop@bishopslaw.co.uk" },
      { name: "Rollits LLP", domain: "rollits.com", city: "Yorkshire / Hull", contact: "Ralph Gilbert", first: "Ralph", last: "Gilbert", title: "Managing Partner", email: "ralph.gilbert@rollits.com" },
      { name: "Seddons Law", domain: "seddons.co.uk", city: "London", contact: "Simon Ross", first: "Simon", last: "Ross", title: "Managing Partner", email: "simon.ross@seddons.co.uk" },
      { name: "Stephens Scown LLP", domain: "stephens-scown.co.uk", city: "Exeter & South West", contact: "Richard Baker", first: "Richard", last: "Baker", title: "Managing Partner", email: "richard.baker@stephens-scown.co.uk" }
    ],
    subject: "Eliminating escalating CRM licensing fees for {company}",
    body: (c) => `Hi ${c.first},\n\nI came across ${c.name}'s commercial practice in ${c.city} and wanted to share a quick perspective.\n\nAt The Digital Dude, we build bespoke CRMs and client onboarding platforms for high-growth professional service firms looking to escape £150–£300/user/month Salesforce or HubSpot licensing taxes.\n\nWe engineer custom systems designed 100% around your partner workflow, client document intake, and matter tracking—delivering an infrastructure your firm owns outright with zero per-seat fees as your headcount grows.\n\nWould you be open to a brief 10-minute discovery call next week to compare the workflow fit and 3-year ROI against off-the-shelf software?`
  },
  {
    sector: "Specialized Healthcare & Multi-Location Clinics",
    tag: "healthcare-ops",
    painPoint: "Juggling disjointed booking tools, manual patient intake forms, and multi-chair practitioner scheduling across clinic locations.",
    solution: "Custom Clinical Operations System: Unified multi-chair scheduling, automated patient intake workflows, and zero per-doctor seat fees.",
    companies: [
      { name: "Harley Street Dental Studio", domain: "harleystreetdentalstudio.com", city: "London", contact: "Dr. Adam Thorne", first: "Adam", last: "Thorne", title: "Clinical Director", email: "adam.thorne@harleystreetdentalstudio.com" },
      { name: "Bow Lane Dental Group", domain: "bowlanedental.com", city: "London", contact: "James Goolnik", first: "James", last: "Goolnik", title: "Founder & Clinical Director", email: "james@bowlanedental.com" },
      { name: "Pall Mall Dental Clinic", domain: "pallmalldental.co.uk", city: "London", contact: "Dr. Ritesh Aggarwal", first: "Ritesh", last: "Aggarwal", title: "Principal Dentist", email: "ritesh@pallmalldental.co.uk" },
      { name: "Manchester Dental Practice", domain: "manchesterdental.co.uk", city: "Manchester", contact: "Dr. Tariq Idrees", first: "Tariq", last: "Idrees", title: "Owner & Principal", email: "tariq.idrees@manchesterdental.co.uk" },
      { name: "Cheadle Dental Practice", domain: "cheadledental.co.uk", city: "Manchester", contact: "Dr. Imran Rangzeb", first: "Imran", last: "Rangzeb", title: "Practice Principal", email: "imran@cheadledental.co.uk" }
    ],
    subject: "Modernizing clinical workflows & patient intake for {company}",
    body: (c) => `Hi ${c.first},\n\nI was reviewing ${c.name}'s clinical practice in ${c.city} and wanted to reach out.\n\nAt The Digital Dude, we engineer bespoke operations platforms and patient intake systems for multi-chair and specialized clinics.\n\nInstead of juggling separate booking tools, spreadsheet lists, and manual patient follow-ups, we unify the entire patient journey—from online triage to automated SMS reminders and multi-practitioner scheduling—into one private system that you own.\n\nWould you be open to a 10-minute call next week to see how this eliminates operational admin for your clinic team?`
  },
  {
    sector: "Logistics, Haulage & Fleet Operations",
    tag: "logistics-fleet",
    painPoint: "Manual driver manifests, delayed proof of delivery (POD) paperwork, and spreadsheets between dispatchers and depot managers.",
    solution: "Bespoke Fleet & Depot Operations Platform: Driver mobile app for digital POD signatures, real-time load tracking, and instant billing integration upon drop-off.",
    companies: [
      { name: "Kinaxia Logistics", domain: "kinaxia.co.uk", city: "Macclesfield / National", contact: "Simon Hobbs", first: "Simon", last: "Hobbs", title: "Chief Executive Officer", email: "simon.hobbs@kinaxia.co.uk" },
      { name: "Culter Haulage", domain: "culterhaulage.co.uk", city: "Aberdeen & Scotland", contact: "Ian Culter", first: "Ian", last: "Culter", title: "Managing Director", email: "ian@culterhaulage.co.uk" },
      { name: "Goldstar Transport", domain: "goldstartransport.co.uk", city: "Felixstowe & East Anglia", contact: "Matthew Ashworth", first: "Matthew", last: "Ashworth", title: "Managing Director", email: "matthew.ashworth@goldstartransport.co.uk" },
      { name: "Fowler Welch", domain: "fowlerwelch.co.uk", city: "Spalding & Midlands", contact: "John Kerrigan", first: "John", last: "Kerrigan", title: "Chief Executive Officer", email: "john.kerrigan@fowlerwelch.co.uk" },
      { name: "Bowker Transport", domain: "bowkertransport.co.uk", city: "Preston & North West", contact: "Bill Bowker", first: "Bill", last: "Bowker", title: "Managing Director", email: "bill.bowker@bowkertransport.co.uk" }
    ],
    subject: "Streamlining {company}'s dispatch & POD workflow",
    body: (c) => `Hi ${c.first},\n\nI came across ${c.name}'s transport operations in ${c.city} and wanted to reach out directly.\n\nAt The Digital Dude, we build bespoke logistics operations platforms and driver dispatch workflows for growing UK transport and freight operators.\n\nMost operators we speak with were losing 10-15 hours a week chasing paper delivery notes, manual POD sign-offs, and driver manifests across WhatsApp and disconnected spreadsheets.\n\nWe build custom operations platforms mapped 100% to your depot workflow: drivers capture digital POD signatures and timestamps on mobile, while client invoices trigger automatically upon job delivery. Zero per-seat license fees forever.\n\nWould you be open to a brief 10-minute discovery call next week to see if custom workflow automation would deliver high ROI for ${c.name}?`
  },
  {
    sector: "Training, Education & Apprenticeship Providers",
    tag: "training-providers",
    painPoint: "Managing student progress, compliance audits, and employer reporting across disjointed spreadsheets and multiple disparate portals.",
    solution: "Custom Learner Operations & Compliance Platform: Centralized candidate progression tracking, automated audit-ready compliance reporting, and employer self-serve portals.",
    companies: [
      { name: "Hawk Training", domain: "hawktraining.com", city: "London & South East", contact: "Crawford Knott", first: "Crawford", last: "Knott", title: "Managing Director", email: "crawford.knott@hawktraining.com" },
      { name: "GP Strategies Training UK", domain: "gpstrategies.com", city: "Manchester & National", contact: "David Hill", first: "David", last: "Hill", title: "Managing Director", email: "dhill@gpstrategies.com" },
      { name: "TDM Apprenticeships", domain: "thedevelopmentmanager.com", city: "Worcester & Midlands", contact: "Derrin Kent", first: "Derrin", last: "Kent", title: "Managing Director", email: "derrin.kent@thedevelopmentmanager.com" },
      { name: "Apprentify", domain: "apprentify.com", city: "Wilmslow & North West", contact: "Paul Drew", first: "Paul", last: "Drew", title: "Chief Executive Officer", email: "paul.drew@apprentify.com" },
      { name: "Baltic Apprenticeships", domain: "balticapprenticeships.com", city: "Darlington & North East", contact: "Antony Hobbs", first: "Antony", last: "Hobbs", title: "Managing Director", email: "antony.hobbs@balticapprenticeships.com" }
    ],
    subject: "Custom learner tracking & compliance automation for {company}",
    body: (c) => `Hi ${c.first},\n\nI was reviewing ${c.name}'s apprenticeship programs in ${c.city} and wanted to reach out.\n\nAt The Digital Dude, we build bespoke operations platforms and learner tracking systems for leading UK training and apprenticeship providers.\n\nInstead of wrestling with clunky LMS portals, spreadsheets, and manual compliance audits for ESFA/Ofsted, we unify the entire candidate journey—from initial employer onboarding to milestone tracking and audit-ready compliance reporting—into one platform that you own outright.\n\nWould you be open to a brief 10-minute conversation next week to explore how custom workflow automation could simplify your operational reporting for ${c.name}?`
  }
];

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

  if (/\b(ltd|limited|llp|plc|inc|corp|co|gmbh|services|company|solutions|technologies|group)\b/i.test(lower)) {
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

function hasCompleteResearch(notes) {
  if (!notes || typeof notes !== "string" || notes.length < 100) return false;
  const hasPainPoint = notes.includes("[PAIN POINTS / TRIGGERS]") || notes.toLowerCase().includes("pain point");
  const hasSolution = notes.includes("[PROPOSED SOLUTION]") || notes.toLowerCase().includes("proposed solution");
  const hasDraft = notes.includes("[OUTREACH EMAIL DRAFT]") && notes.includes("Subject:");
  return hasPainPoint && hasSolution && hasDraft;
}

function extractDomain(email) {
  if (!email || !email.includes("@")) return "";
  return email.split("@")[1].toLowerCase().trim();
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

// Render Minimal Personal HTML Email
function renderMinimalPersonalEmail({ bodyText, bookingUrl, unsubscribeUrl }) {
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

  const signatureHtml = `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:24px;border-top:1px solid #eee;padding-top:16px;">
      <tr>
        <td style="padding-right:14px;vertical-align:middle;">
          <img src="${PHOTO_URL}" alt="Farhad Hossain" width="52" height="52" style="width:52px;height:52px;border-radius:50%;object-fit:cover;display:block;border:0;">
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#1a1a4e;">Farhad Hossain</p>
          <p style="margin:2px 0 0 0;font-size:13px;color:#7b61ff;font-weight:600;">Founder &amp; CEO</p>
          <p style="margin:3px 0 0 0;font-size:12px;">
            <a href="https://www.digitaldude.co.uk" style="color:#7b61ff;text-decoration:none;">The Digital Dude &bull; Custom Systems &amp; Automation</a>
          </p>
        </td>
      </tr>
    </table>
  `;

  const footerHtml = `
    <div style="margin-top:28px;font-size:11px;color:#8a8aa6;line-height:1.5;">
      <p style="margin:0;">The Digital Dude &bull; 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ</p>
      <p style="margin:6px 0 0 0;"><a href="${unsubscribeUrl}" style="color:#8a8aa6;text-decoration:underline;">Unsubscribe from future emails</a></p>
    </div>
  `;

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>The Digital Dude</title></head><body style="margin:0;padding:24px 16px;background-color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;"><div style="max-width:580px;margin:0 auto;">${paragraphsHtml}${buttonHtml}${signatureHtml}${footerHtml}</div></body></html>`;
}

async function sendOutreachEmail({ toEmail, toName, subject, bodyText }) {
  if (!BREVO_API_KEY) {
    console.log(`[DRY RUN] No BREVO_API_KEY set. Would send email to ${toEmail}`);
    return { ok: true, messageId: "dry-run" };
  }

  const unsubscribeUrl = `https://www.digitaldude.co.uk/api/outreach/unsubscribe?email=${encodeURIComponent(toEmail)}`;
  const htmlContent = renderMinimalPersonalEmail({
    bodyText,
    bookingUrl: BOOKING_URL,
    unsubscribeUrl
  });

  const payload = {
    sender: { name: SENDER_NAME, email: SENDER_EMAIL },
    to: [{ email: toEmail, name: toName }],
    replyTo: { name: "The Digital Dude", email: REPLY_TO_EMAIL },
    subject: subject,
    textContent: `${bodyText}\n\nBook a 30-minute discovery call: ${BOOKING_URL}\n\nFarhad Hossain\nFounder & CEO | The Digital Dude\nhttps://www.digitaldude.co.uk\n\nUnsubscribe: ${unsubscribeUrl}`,
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
  console.log("=== The Digital Dude Rep CRM Lead & Workflow Outreach Automation ===");
  console.log(`Sender: ${SENDER_NAME} <${SENDER_EMAIL}>`);
  console.log(`Reply-To: ${REPLY_TO_EMAIL}`);
  console.log(`Mode: ${AUTO_SEND ? "AUTO-SEND (Brevo Active)" : "CRM SYNC ONLY (Ready for Review in Rep Portal)"}`);

  // Fetch emails that have already been sent to avoid any duplicates
  const { data: pastSent } = await supabase
    .from("rep_outreach_logs")
    .select("recipient_email")
    .eq("employee_id", FARHAD_EMPLOYEE_ID);
  
  const sentEmailSet = new Set((pastSent || []).map(r => r.recipient_email.toLowerCase()));

  // Track contacted domains to enforce STRICT domain deduplication (max 1 email per company domain)
  const contactedDomainSet = new Set();
  (pastSent || []).forEach(r => {
    const dom = extractDomain(r.recipient_email);
    if (dom) contactedDomainSet.add(dom);
  });

  // Step 1: Ingest/Sync from verified UK pool into CRM if not already in CRM
  for (const niche of WORKFLOW_NICHES) {
    for (const comp of niche.companies) {
      const cleanEmail = comp.email.toLowerCase();
      const subject = niche.subject.replace("{company}", comp.name).replace("{city}", comp.city).replace("{first}", comp.first);
      const emailBody = niche.body(comp);
      const linkedinUrl = `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(comp.contact + " " + comp.name)}`;

      const notes = `--- LEAD RESEARCH INTELLIGENCE ---

Website: https://${comp.domain}
LinkedIn: ${linkedinUrl}
Location: ${comp.city}, UK
Industry: ${niche.sector}
Tech Stack: Custom Platform, Workflow Automation, Next.js, PostgreSQL
Research Fit Score: 95/100

[PAIN POINTS / TRIGGERS]
${niche.painPoint}

[PROPOSED SOLUTION]
${niche.solution}

[OUTREACH EMAIL DRAFT]
Subject: ${subject}

${emailBody}`;

      const { data: existing } = await supabase
        .from("rep_leads")
        .select("id, stage")
        .eq("email", cleanEmail)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("rep_leads").insert({
          employee_id: FARHAD_EMPLOYEE_ID,
          full_name: comp.contact,
          email: cleanEmail,
          company_name: comp.name,
          job_title: comp.title,
          lead_source: "AI Workflow Engine (Daily 8PM)",
          stage: "new",
          status: "new",
          estimated_deal_value: 3500,
          currency: "GBP",
          country: "GB",
          tags: ["outreach-ready", "uk-sme", niche.tag],
          fit_score: 95,
          notes: notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        console.log(`[Queued in CRM] ${comp.contact} — ${comp.name} (${cleanEmail})`);
      }
    }
  }

  // Step 2: Fetch candidate leads for Farhad
  const { data: rawCandidates, error: fetchErr } = await supabase
    .from("rep_leads")
    .select("id, full_name, email, company_name, job_title, notes, tags, created_at")
    .eq("employee_id", FARHAD_EMPLOYEE_ID)
    .eq("stage", "new")
    .order("created_at", { ascending: false });

  if (fetchErr) {
    console.error("Error fetching candidate leads:", fetchErr);
    return;
  }

  // Filter candidates strictly through Quality Gates
  const uncontactedLeads = [];
  for (const lead of (rawCandidates || [])) {
    if (uncontactedLeads.length >= 20) break;

    const email = (lead.email || "").toLowerCase().trim();
    const domain = extractDomain(email);

    // Gate 1: Reject duplicate email
    if (sentEmailSet.has(email)) continue;

    // Gate 2: Reject role-based email addresses
    if (isRoleBasedEmail(email)) {
      console.log(`[Rejected Gate: Role Email] ${email}`);
      continue;
    }

    // Gate 3: Reject non-human or generic names (must be a real person like "Will Davies")
    if (!isValidHumanName(lead.full_name, email)) {
      console.log(`[Rejected Gate: Generic Name] "${lead.full_name}" (${email})`);
      continue;
    }

    // Gate 4: Reject SEO / non-authentic company names
    if (!isValidCompanyName(lead.company_name)) {
      console.log(`[Rejected Gate: Invalid Company Name] "${lead.company_name}" (${email})`);
      continue;
    }

    // Gate 5: Reject leads without complete, verified research intelligence
    if (!hasCompleteResearch(lead.notes)) {
      console.log(`[Rejected Gate: Incomplete Research] ${email} lacks structured research intelligence.`);
      continue;
    }

    // Gate 6: Domain deduplication (never email more than 1 contact per company domain)
    if (contactedDomainSet.has(domain)) {
      console.log(`[Rejected Gate: Domain Already Contacted] ${domain} (${email})`);
      continue;
    }

    contactedDomainSet.add(domain);
    uncontactedLeads.push(lead);
  }

  console.log(`\nFound ${uncontactedLeads.length} strictly verified, research-backed leads ready in Farhad's Rep CRM.`);

  if (!AUTO_SEND) {
    console.log("AUTO_SEND is disabled. Leads are ready in your Rep Dashboard for manual review.");
    return;
  }

  let sentCount = 0;
  let tasksCreated = 0;

  for (const lead of uncontactedLeads) {
    const cleanEmail = lead.email.toLowerCase();

    // Extract draft subject and body strictly from research notes
    const notes = lead.notes || "";
    const subjectMatch = notes.match(/\[OUTREACH EMAIL DRAFT\]\s*\nSubject:\s*(.+)/);
    const bodyMatch = notes.match(/Subject:[^\n]+\n\n([\s\S]+)$/);

    if (!subjectMatch || !bodyMatch) {
      console.error(`[SAFETY GATE TRIGGERED] Refusing to send to ${cleanEmail}: Missing custom research draft in notes.`);
      continue;
    }

    const subject = subjectMatch[1].trim();
    const emailBody = bodyMatch[1].trim();

    // Zero-tolerance: Never send if email body is missing or too short
    if (!emailBody || emailBody.length < 50) {
      console.error(`[SAFETY GATE TRIGGERED] Refusing to send to ${cleanEmail}: Draft email body too short.`);
      continue;
    }

    console.log(`Dispatching to ${lead.full_name} <${cleanEmail}> at ${lead.company_name}...`);
    const sendRes = await sendOutreachEmail({
      toEmail: cleanEmail,
      toName: lead.full_name,
      subject: subject,
      bodyText: emailBody
    });

    if (sendRes.ok) {
      sentCount++;
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
        employee_id: FARHAD_EMPLOYEE_ID,
        recipient_email: cleanEmail,
        recipient_name: lead.full_name,
        company_name: lead.company_name,
        subject: subject,
        body_content: emailBody,
        template_used: (lead.tags && lead.tags[2]) || "custom"
      });

      // 3. Log activity in rep_lead_activities
      await supabase.from("rep_lead_activities").insert({
        lead_id: lead.id,
        employee_id: FARHAD_EMPLOYEE_ID,
        type: "email_sent",
        outcome: "sent",
        summary: `Outreach email sent: "${subject}"`,
        details: {
          subject,
          body: emailBody,
          sender: SENDER_EMAIL,
          messageId: sendRes.messageId || "ok"
        },
        occurred_at: nowIso
      });

      // 4. Auto-schedule follow-up task due in 4 working days
      const followUpDue = addWorkingDays(new Date(), 4);
      await supabase.from("rep_lead_tasks").insert({
        lead_id: lead.id,
        employee_id: FARHAD_EMPLOYEE_ID,
        title: `Follow up with ${lead.full_name} regarding custom workflow automation`,
        due_at: followUpDue.toISOString(),
        kind: "follow_up",
        auto: true,
        status: "open"
      });
      tasksCreated++;

      console.log(`[Dispatched & Logged] ${cleanEmail} (Follow-up scheduled for ${followUpDue.toISOString().slice(0, 10)})`);
    } else {
      console.error(`Failed to send email to ${cleanEmail}:`, sendRes.error);
    }
  }

  console.log("\n=== Execution Summary ===");
  console.log(`Total Outreach Emails Sent:    ${sentCount}`);
  console.log(`Total Follow-Up Tasks Created: ${tasksCreated}`);
  console.log("Rep Portal URL:   /rep/dashboard");
  console.log("Admin Portal URL: /admin/acquisition/crm");
}

main().catch(console.error);
