export type Industry =
  | "Property"
  | "Travel"
  | "Community"
  | "Home services"
  | "Logistics"
  | "Recruitment"
  | "Education";

export type CaseStudy = {
  slug: string;
  industry: Industry;
  tag: string; // display tag line, e.g. "Property · Australia"
  title: string;
  summary: string; // one-line summary used on cards
  status: "Live" | "Delivered";
  image: string;
  imageAlt: string; // outcome-specific alt text, not just the project name
  headline: string; // case study page headline
  pageSummary: string; // case study page one-line summary
  stats: string[];
  challenge: string;
  whatWeBuilt: string[];
  whatChanged: string; // or "What it makes possible" — stored as-is
  whatChangedLabel: "What changed" | "What it makes possible";
  builtWith: string;
  related: string[]; // slugs of two related projects
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "property-compliance-crm",
    industry: "Property",
    tag: "Property · Australia",
    title: "Property compliance CRM",
    summary:
      "Five role-based portals managing 4,000+ rentals across 30+ agencies, 4x faster than before",
    status: "Live",
    image: "/images/case-studies/property-compliance.svg",
    imageAlt:
      "Property compliance CRM dashboard showing 4,000+ rentals managed across 30+ agencies",
    headline: "A compliance CRM now running 4,000+ rentals across 30+ agencies",
    pageSummary:
      "One platform connecting agencies, property managers, technicians and the internal team, replacing spreadsheets and email threads.",
    stats: [
      "30+ agencies",
      "4,000+ rentals managed",
      "4x faster than the previous system",
      "5 role-based portals",
    ],
    challenge:
      "Property compliance work runs on deadlines: gas safety checks, smoke alarm testing, pool fencing inspections, each with its own regulatory cut-off and its own paper trail. Before this system existed, the business coordinated all of it across five separate audiences — agencies raising requests, property managers approving work, technicians in the field, an internal team chasing status, and no shared view connecting any of them. A job could be scheduled in one inbox, marked complete in a technician's group chat, and still show as outstanding in whatever spreadsheet the office was using that week. That gap showed up everywhere. Overdue compliance jobs — the ones with real regulatory consequences — were only visible once someone went looking for them, usually after an agency called to ask why a certificate hadn't arrived. Quotes were drafted in one place, invoiced in another, and technician payments reconciled by hand at the end of each month. With 30+ agencies and thousands of individual rental properties in the mix, there was no way for management to see which regions were falling behind, which technicians were overloaded, or where jobs were quietly slipping past their compliance window.",
    whatWeBuilt: [
      "Five separate portals — one each for admin, internal team members, agencies, property managers and technicians — so each person only sees what's relevant to their part of the job. An agency doesn't see internal margin data; a technician doesn't see agency billing.",
      "End-to-end job tracking from the moment a job is raised to the moment it's paid, with dedicated queues for scheduled, overdue and completed work so nothing sits invisible in an inbox.",
      "Quotes, invoices and technician payments linked directly to the job record they belong to, replacing a separate spreadsheet trail that had to be manually cross-referenced at month-end.",
      "A lead management flow to bring in and convert new agencies and property managers, so growth doesn't depend on someone remembering to follow up.",
      "A regional dashboard giving management a live view of job status, technician load and compliance risk across every area the business operates in, plus a public marketing site to support it.",
      "Automated notifications when a job moves stage, so agencies and property managers know where things stand without having to call and ask.",
      "Role-based permissions built in from the start, so technicians, agencies and property managers each only get access to the data and actions that apply to them.",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "Operations now run through one system instead of a patchwork of spreadsheets, email threads and phone calls. The platform manages 4,000+ rentals across 30+ agencies and runs at roughly 4x the speed of the system it replaced, measured by how long it takes a job to move from raised to paid. The bigger change is visibility. An overdue compliance job is visible to the office the moment it slips, not days later when an agency chases it — which matters when the job in question has a real regulatory deadline attached. Technicians know what's assigned to them without a phone call. Agencies and property managers can check status themselves instead of emailing to ask. And because every job, quote and payment lives in the same system, month-end reconciliation is a report instead of a multi-day exercise pulling numbers out of five different places.",
    builtWith: "React, TypeScript, Node.js, relational database, cloud hosting",
    related: ["airline-ticketing-crm", "logistics-platform"],
  },
  {
    slug: "airline-ticketing-crm",
    industry: "Travel",
    tag: "Travel · Australia",
    title: "Airline ticketing CRM",
    summary:
      "Every lead from WhatsApp, Facebook, phone and walk-ins in one place, with a live KPI dashboard",
    status: "Live",
    image: "/images/case-studies/air-travel-crm.svg",
    imageAlt: "Airline ticketing CRM dashboard unifying WhatsApp, Facebook, phone and walk-in leads",
    headline: "One CRM for every lead, from every channel",
    pageSummary:
      "A lead and customer management system for an airline ticketing agency, bringing WhatsApp, Facebook, phone and walk-in enquiries into one place.",
    stats: [
      "4 lead channels in one system",
      "7 live KPIs",
      "Conversion tracking per agent",
      "In daily use",
    ],
    challenge:
      "An airline ticketing agency lives or dies on how fast it responds to an enquiry, and enquiries arrived from everywhere: WhatsApp messages, Facebook comments and DMs, phone calls, and people walking in off the street. None of those channels talked to each other. A lead that came in on WhatsApp on Monday and followed up by phone on Wednesday looked like two separate people unless someone happened to remember the conversation. That made ownership murky — it was genuinely hard to say which agent was responsible for a given lead, which meant enquiries could sit untouched while everyone assumed someone else had it. There was no live view of how many leads were converting versus going cold, no way to see where in the booking process people dropped off, and no visibility into which agents were closing deals and which were falling behind. Management was running a multi-channel sales operation with single-channel tools.",
    whatWeBuilt: [
      "Lead capture from WhatsApp, Facebook and manual entry, deduplicated automatically so the same enquiry from two channels doesn't show up as two separate leads.",
      "A booking pipeline that matches how agents actually sell tickets: enquiry in progress, itinerary sent, payment made — rather than a generic sales-stage template that didn't fit the workflow.",
      "A dashboard showing total leads, follow-ups due, conversions, lost sales and progress against the monthly target, filterable to any date range management wants to check.",
      "\"My leads\" and \"my follow-ups\" views for every agent, so nobody has to guess what they're supposed to be doing next.",
      "Agent performance tracking — leads collected, conversions, conversion rate — alongside full customer history and quick search, so a repeat enquiry is recognised instantly.",
      "Automatic follow-up reminders so a lead that's gone quiet gets flagged before it goes cold, instead of being rediscovered weeks later.",
      "A single customer record that carries every interaction across every channel, so an agent picking up a call already has the full WhatsApp and Facebook history in front of them.",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "The agency now has one source of truth for every lead, regardless of which channel it arrived through, instead of scattered chats and spreadsheets that only told part of the story. Management sees performance against target in real time — 7 live KPIs update as agents work, rather than being compiled into a report after the fact. Every agent owns a clearly defined pipeline instead of working from memory and a shared inbox, and conversion tracking per agent means underperformance shows up early instead of at the end of the month. Because every enquiry across WhatsApp, Facebook, phone and walk-ins lands in the same system, nothing gets lost between channels, and the agency can see — for the first time — exactly where in the booking journey people convert and where they don't. That last point matters more than it sounds: knowing where prospective travellers drop off between first enquiry and payment is what lets the business actually fix the leak, rather than guessing at it from gut feel and end-of-month totals.",
    builtWith: "React, TypeScript, Vite, REST APIs",
    related: ["property-compliance-crm", "recruitment-crm"],
  },
  {
    slug: "matrimony-saas-platform",
    industry: "Community",
    tag: "Community · Australia",
    title: "Premium matrimony SaaS",
    summary:
      "AI matchmaking, 5-tier identity and police check verification, and subscription billing",
    status: "Live",
    image: "/images/case-studies/matrimony-saas.svg",
    imageAlt: "Matrimony SaaS platform dashboard showing AI matchmaking and 5-tier verification",
    headline: "A matchmaking platform built on trust",
    pageSummary:
      "A premium subscription platform for a community matchmaking service, combining AI matching with strict identity verification.",
    stats: [
      "AI matchmaking engine",
      "5-tier verification",
      "Subscription billing",
      "Live",
    ],
    challenge:
      "In matchmaking, trust is the product — a platform full of fake or unverified profiles is worthless no matter how good its matching algorithm is. The client needed members to feel confident that the person on the other end of a conversation was who they said they were, in a category where the stakes of getting that wrong are high and personal. That meant verification couldn't be an afterthought bolted onto a dating-app template. It had to be built in from the start, at multiple levels, without turning the platform into a bureaucratic wall that put genuine members off joining. At the same time, the business still needed a working product underneath the trust layer: a matching engine that actually helps people find compatible partners, and a subscription model that converts a free browser into a paying member without feeling like a paywall dropped on top of a serious life decision.",
    whatWeBuilt: [
      "An AI matchmaking engine that suggests compatible members based on stated preferences and behaviour, rather than a static filter search.",
      "Five levels of verification, from basic identity checks up to formal police and background checks, so members can see exactly how thoroughly someone has been vetted before they invest time in a conversation.",
      "Subscription plans with recurring billing, so premium features are gated cleanly without members having to manage payments manually each cycle.",
      "Private messaging with photo privacy controls, so members can share more as trust builds rather than exposing everything up front.",
      "Community rooms for group conversation, giving members a lower-stakes way to interact before committing to one-on-one messaging.",
      "A verification badge visible on every profile, so trust level is obvious at a glance rather than buried in a settings page.",
      "An admin review queue for the higher verification tiers, so identity and background checks are confirmed by a person, not just an automated form submission.",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "The community now runs on a single platform that verifies members, suggests matches and handles payments end to end, rather than stitching together a dating template with a separate verification process bolted on the side. Members can see, on any profile, exactly what level of verification that person has completed — from basic identity through to a full background check — before they decide to invest time in a conversation. That visible trust layer is what makes the rest of the product work: people are more willing to engage seriously, more willing to pay for premium access, and less likely to abandon the platform after one bad experience with an unverified profile. Subscription billing runs automatically in the background, so the business collects recurring revenue without a member having to manually renew, and the AI matching engine keeps surfacing new compatible members instead of the platform functioning as a one-time search tool. For a category built on a single high-stakes decision, that combination of visible trust and ongoing matching is what turns a curious sign-up into a member who keeps coming back.",
    builtWith: "Next.js",
    related: ["ai-tutoring-platform", "recruitment-crm"],
  },
  {
    slug: "cleaning-marketplace",
    industry: "Home services",
    tag: "Home services",
    title: "Cleaning marketplace",
    summary:
      "Customer app, cleaner app and admin CRM with upfront payment and photo proof",
    status: "Delivered",
    image: "/images/case-studies/cleaning-marketplace.svg",
    imageAlt:
      "Cleaning marketplace apps showing customer booking, cleaner job flow and admin CRM",
    headline: "A three-app platform that runs a cleaning business end to end",
    pageSummary:
      "A customer booking app, a cleaner mobile app and an admin CRM, connected by one system with upfront payment and photo proof on every job.",
    stats: [
      "3 connected apps",
      "Payment before every job",
      "Before and after photos",
      "4 user roles",
    ],
    challenge:
      "Bookings for the cleaning business came in however a customer happened to reach out — phone call, text message, sometimes a comment on a social post — and every one of them had to be manually turned into a scheduled job. Payment was chased after the work was done, which meant the business was carrying the risk of a customer who didn't pay, paid late, or disputed the amount after the fact. Worse, there was no proof of what actually happened on a job. If a customer complained the flat wasn't properly cleaned, it was one person's word against another's — no photos, no timestamped record, nothing to settle the dispute quickly. And the growth the business wanted — more cleaners, more coverage areas — was actively working against it operationally: every new cleaner added more manual admin, and commission was still being tracked by hand in a spreadsheet that got harder to trust with every addition.",
    whatWeBuilt: [
      "A customer app to browse services, see the price up front, pay before the job starts, and track status in real time — no more waiting for a call back to confirm a booking.",
      "A cleaner app to accept jobs, check in on arrival, upload before-and-after photos, and mark the job complete, so there's a timestamped record of every visit.",
      "An admin CRM to approve new cleaners, assign jobs to the right person, and track revenue, commission and payouts without a separate spreadsheet.",
      "Automatic notifications at booking, assignment and completion, with an invoice and the before-and-after photos sent straight to the customer.",
      "A full history for every job, plus reports on revenue, job volume and cleaner performance, so the business can see which areas and which cleaners are actually working.",
      "Upfront Stripe payment on every booking, removing the collections problem entirely — the business is never chasing a customer for money after the fact.",
      "A commission engine that calculates each cleaner's payout automatically from completed jobs, replacing the manual spreadsheet that got less reliable with every cleaner added.",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "Payment is collected before work starts, not chased afterwards, which removed the collections problem the business used to carry on every single booking. Every job now has timestamped before-and-after photo evidence, so a customer dispute is settled by looking at the record instead of taking someone's word for it. The bigger shift is that growth stopped being a liability. New cleaners and new coverage areas can be added without adding admin headcount, because commission, job assignment and customer communication all run through the same system instead of a spreadsheet that had to be manually updated for every change. With three connected apps — customer, cleaner and admin — covering the full loop from booking to payout, the business can scale the number of jobs it handles without scaling the amount of manual coordination behind it. That's the difference between a cleaning round-up business and a platform: one grows admin linearly with headcount, the other doesn't.",
    builtWith: "Mobile apps, REST API, Stripe payments, cloud image storage",
    related: ["logistics-platform", "recruitment-crm"],
  },
  {
    slug: "logistics-platform",
    industry: "Logistics",
    tag: "Logistics",
    title: "Logistics coordination platform",
    summary:
      "Mobile-first breakdown management for drivers and dispatch, 40% faster response coordination",
    status: "Live",
    image: "/images/case-studies/truck-breakdown.svg",
    imageAlt:
      "Logistics coordination platform showing live breakdown incidents and driver status",
    headline: "Breakdowns handled in minutes, not phone calls",
    pageSummary:
      "A mobile-first platform that connects drivers and dispatch the moment something goes wrong on the road.",
    stats: [
      "40% faster response coordination",
      "Mobile-first",
      "Driver and admin apps",
      "Live",
    ],
    challenge:
      "When a truck broke down on the road, everything that happened next ran through phone calls and text messages. A driver would call in, try to describe where they were and what had gone wrong, and dispatch would then start working the phones to figure out who was nearby and available to help. Every one of those steps cost time, and time is the expensive part of a breakdown — every extra minute is a delayed delivery, an SLA at risk, and a driver stuck on the side of the road. That gap wasn't just inefficient — it was risky: a breakdown that took longer to resolve than it needed to meant a client shipment arriving late, and in transport and logistics, missed delivery windows have a direct cost. Dispatch had no way to see, at a glance, how many incidents were active, where they were, or how far along the recovery process each one had gotten. The information that existed lived in whoever answered the phone, not in a system anyone else could check.",
    whatWeBuilt: [
      "A mobile app for drivers to report a breakdown in seconds — location captured automatically, defect details logged, no need to describe an exact spot on a motorway over a bad phone line.",
      "An admin view showing every active incident at once, with status, location and time elapsed, so dispatch isn't reconstructing the picture from memory and phone notes.",
      "Coordination tools so admins can assign the nearest available help and push status updates straight to the driver, instead of relaying information by phone.",
      "Photo capture built into the driver app, so a vehicle defect is documented on the spot rather than described secondhand.",
      "Automated timestamps on every stage of an incident, from report to resolution, giving the business a real record of how long recovery actually takes.",
      "A lightweight, mobile-first Progressive Web App rather than a native app, so drivers can use it instantly from a phone browser with no install step slowing them down mid-breakdown.",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "Response coordination improved by 40%, measured from the moment a breakdown is reported to the moment help is confirmed on the way. That gain comes almost entirely from removing the phone-call relay that used to sit between a driver noticing a problem and dispatch actually acting on it. The team now has one place to see every active incident, its location and its status, instead of piecing the picture together from whoever last picked up the phone. Drivers get a faster, more consistent response because the details dispatch needs — location, defect, timing — arrive automatically instead of being described over an unreliable roadside connection. For a business where every minute of downtime has a cost attached, that speed difference is the whole point of the system — and because the platform runs as a mobile-first web app rather than a native install, it reached every driver's phone without a rollout project of its own.",
    builtWith: "Next.js",
    related: ["property-compliance-crm", "cleaning-marketplace"],
  },
  {
    slug: "recruitment-crm",
    industry: "Recruitment",
    tag: "Recruitment · Staffing",
    title: "Recruitment CRM",
    summary:
      "Real-time candidate portal, document tracking and automated status updates",
    status: "Delivered",
    image: "/images/case-studies/recruitment-crm.svg",
    imageAlt: "Recruitment CRM dashboard showing candidate pipeline and document tracking",
    headline: "Every candidate, document and status update in one place",
    pageSummary:
      "A recruitment system with a real-time candidate portal, covering everything from application to post-placement tracking.",
    stats: [
      "Real-time candidate portal",
      "Document tracking",
      "Automated status messages",
      "Role-based access",
    ],
    challenge:
      "Recruiters were juggling candidate documents, status updates and day-to-day communication across email, spreadsheets and WhatsApp, with no single place any of it lived permanently. A visa document sent by email, a status update given over WhatsApp, and an interview note scribbled in a spreadsheet were three separate systems for three parts of the same candidate's journey. That fragmentation showed up as a constant stream of \"any update?\" messages from candidates who had no way to check their own status, which ate into time recruiters should have spent sourcing and interviewing. It got worse after placement: once someone started a job, tracking their ongoing status — start date confirmed, salary changes, leave taken — was almost impossible without someone remembering to update a spreadsheet that nobody consistently maintained. For a staffing business, that kind of gap doesn't just cost time — it costs candidates who give up waiting and go elsewhere.",
    whatWeBuilt: [
      "A candidate website to apply, upload documents and check application status in real time, so \"any update?\" messages stop being necessary.",
      "A CRM for admins and agents with role-based access, candidate filtering and interview approval, so everyone works from the same record instead of separate notes.",
      "Document checks built into the workflow for visas, clearances and agreements, so nothing progresses to interview or placement with an outstanding requirement.",
      "Automatic status updates by WhatsApp and email whenever a candidate's stage changes, plus an AI assistant to answer the common questions that used to interrupt a recruiter's day.",
      "Post-placement tracking of start dates, salary and leave, so a placement doesn't disappear from view the moment someone starts the job.",
      "Interview scheduling and approval built into the same system candidates use to check their own status, closing the loop between application and offer.",
      "A searchable candidate database that keeps a full history against every profile, so a candidate who applies again next year isn't starting from zero.",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "Candidates can see exactly where they stand at any point, without calling or messaging to ask, which has removed a steady stream of status-check interruptions from a recruiter's day. Documents for visas, clearances and agreements are tracked against each candidate automatically, so nothing slips through to interview stage with a requirement still outstanding. Agents now spend meaningfully less time on manual updates and more on the parts of the job that actually need a person — sourcing, interviewing, negotiating. And placements no longer disappear from view the moment someone starts a job: start dates, salary changes and leave are tracked long after the placement closes, giving the business a real picture of retention instead of losing visibility the moment a candidate stops being \"active.\" The AI assistant handling routine candidate questions has a similar effect in miniature: the questions that used to interrupt a recruiter ten times a day now get answered instantly, and only the questions that genuinely need a person reach one.",
    builtWith: "Next.js, Node.js, MongoDB, Twilio, GPT API",
    related: ["airline-ticketing-crm", "cleaning-marketplace"],
  },
  {
    slug: "ai-tutoring-platform",
    industry: "Education",
    tag: "Education",
    title: "AI tutoring platform",
    summary: "AI-generated quizzes, automatic grading and a parent and student portal",
    status: "Delivered",
    image: "/images/case-studies/ai-education.svg",
    imageAlt: "AI tutoring platform dashboard showing quiz generation and student progress",
    headline: "A tutoring platform where quizzes, marking and reports run themselves",
    pageSummary:
      "A student and parent portal with AI-generated quizzes, automatic grading and personalised feedback, plus an admin system for the tutoring centre.",
    stats: [
      "AI quiz generation",
      "Instant grading",
      "Parent and student portal",
      "Subscription billing",
    ],
    challenge:
      "Tutors at the centre were spending hours every week on work that had nothing to do with actually teaching: writing quizzes from scratch, marking them by hand, and then compiling updates to send to parents. That time came directly out of lesson preparation and one-on-one attention — the parts of the job that actually move a struggling student forward. Parents, meanwhile, wanted more visibility than an occasional update email gave them — real insight into how their child was actually progressing, not just a termly summary. And the centre itself had a harder problem: without consistent, timely marking data, it was difficult to spot a student starting to struggle early enough to do anything about it. The centre wanted a way to catch that earlier, without asking tutors to do more manual work than they were already doing. By the time a pattern showed up in a report, weeks of ground had often already been lost.",
    whatWeBuilt: [
      "AI-generated quizzes matched to each student's subject and level, created automatically on a weekly, fortnightly or monthly cycle instead of written by hand each time.",
      "Instant grading with feedback on strengths, weak spots and what to practise next, delivered the moment a quiz is submitted rather than days later.",
      "A portal where students and parents see results, progress reports, attendance and schedules in one place, replacing the occasional update email.",
      "An admin dashboard for classes, student progress and at-risk alerts, so a struggling student is flagged automatically instead of discovered weeks later in a report.",
      "Subscription billing and automatic reminders, so the centre isn't manually invoicing every family every cycle.",
      "A question bank that grows over time as quizzes are generated, so the AI has an increasingly tailored pool to draw from for each subject and level.",
      "Parent-facing progress summaries generated automatically after each quiz cycle, so visibility into a child's progress doesn't depend on a tutor finding time to write one.",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "Quizzes and progress reports now go out without manual work on a tutor's part — generated, marked and summarised automatically on whatever cycle the centre sets. That alone gave tutors back hours every week that used to go into writing and marking rather than teaching. Parents stay informed without waiting for a termly update, because a clear progress summary lands after every quiz cycle instead of an occasional email when someone finds time to write one. And because grading and at-risk flagging happen automatically and immediately, the centre can spot a student starting to struggle while there's still time to act, instead of finding out weeks later. Tutors are left doing the part of the job that actually requires a person: teaching. The question bank also means the system gets more tailored over time rather than staying static, so quiz quality keeps improving the longer the centre uses it, instead of the AI output plateauing after the first term.",
    builtWith: "Next.js, Node.js, MongoDB, OpenAI GPT-4o, Stripe",
    related: ["matrimony-saas-platform", "recruitment-crm"],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
