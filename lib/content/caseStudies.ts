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
      "The business was coordinating agencies, property managers, technicians and its own team across separate tools. Jobs slipped between scheduled, overdue and completed with no single view. Quotes, invoices and technician payments lived in spreadsheets and email, and management couldn't see performance across regions.",
    whatWeBuilt: [
      "Five separate portals for admin, team members, agencies, property managers and technicians, each showing only what that person needs",
      "Full job tracking from creation to payment, with dedicated views for scheduled, overdue and completed work",
      "Quotes, invoices and technician payments linked directly to each job",
      "Lead management to bring in and convert new agencies and property managers",
      "A regional dashboard and reports for management, plus a public marketing website",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "Operations now run through one system instead of spreadsheets and email. The platform manages 4,000+ rentals for 30+ agencies and runs about 4x faster than the system it replaced. Overdue jobs are visible the moment they slip.",
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
      "Enquiries arrived through WhatsApp, Facebook, phone calls and walk-ins, with nowhere to manage them together. It was hard to tell who owned each lead, there was no live view of conversions or lost sales, and management couldn't see how each agent was performing.",
    whatWeBuilt: [
      "Lead capture for WhatsApp, Facebook and manual entry, organised without duplicates",
      "A booking pipeline matched to how agents sell: in progress, itinerary sent, payment made",
      "A dashboard showing total leads, follow-ups, conversions, lost sales and progress against the monthly target, for any date range",
      "\"My leads\" and \"my follow-ups\" views so every agent knows what to do next",
      "Agent performance showing leads collected, conversions and conversion rate, plus customer history and quick search",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "The agency has one source of truth for every lead instead of scattered chats and spreadsheets. Management sees performance against target in real time, and every agent owns their own pipeline.",
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
      "In matchmaking, trust is the product. The client needed members to feel safe that every profile was real, while still making it easy to find a good match and to charge for premium access.",
    whatWeBuilt: [
      "An AI matchmaking engine that suggests compatible members",
      "Five levels of verification, up to identity and police checks",
      "Subscription plans with recurring billing",
      "Private messaging between members",
      "Community rooms for group conversation",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "The community runs on one platform that verifies members, suggests matches and handles payments, giving members confidence in who they are talking to.",
    builtWith: "[Confirm stack with the dev team]",
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
      "Bookings came in by phone and message, payments were chased after the job, and there was no proof of work when a customer complained. More cleaners meant more admin, and commission was tracked by hand.",
    whatWeBuilt: [
      "Customer app to choose a service, see the price, pay upfront and track the job",
      "Cleaner app to accept jobs, check in, upload before and after photos and mark jobs complete",
      "Admin CRM to approve cleaners, assign jobs, and track revenue, commission and payouts",
      "Automatic notifications at booking, assignment and completion, with invoice and photos sent to the customer",
      "A full history for every job, plus reports on revenue, job volume and cleaner performance",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "Payment is collected before work starts, every job has photo evidence, and new cleaners and areas can be added without adding admin staff.",
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
      "When a truck broke down, coordination happened over phone calls and messages. Dispatch lost time finding out where the driver was, what had happened and who could help.",
    whatWeBuilt: [
      "A mobile app for drivers to report a breakdown with the details dispatch needs",
      "An admin view showing every active incident and its status",
      "Coordination tools so admins can assign help and keep drivers updated",
    ],
    whatChangedLabel: "What changed",
    whatChanged:
      "Response coordination improved by 40%, and the team has one place to see every incident instead of chasing calls.",
    builtWith: "[Confirm stack with the dev team]",
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
      "Recruiters were juggling candidate documents, status updates and communication across email, spreadsheets and WhatsApp. Candidates kept asking for updates, and tracking people after placement was almost impossible.",
    whatWeBuilt: [
      "A candidate website to apply, upload documents and see application status in real time",
      "A CRM for admins and agents with role-based access, candidate filtering and interview approval",
      "Document checks for visas, clearances and agreements",
      "Automatic status updates by WhatsApp and email, plus an AI assistant for common candidate questions",
      "Post-placement tracking of start dates, salary, leave and employment status",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "Candidates see where they stand without calling, agents spend less time on updates, and the business can track every placement long after the start date.",
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
      "Tutors were spending hours every week writing quizzes, marking them and updating parents. Parents wanted more visibility, and the centre wanted to spot struggling students earlier.",
    whatWeBuilt: [
      "AI-generated quizzes matched to each student's subject and level, on a weekly, fortnightly or monthly cycle",
      "Instant grading with feedback on strengths, weak spots and what to practise next",
      "A portal where students and parents see results, reports, attendance and schedules",
      "An admin dashboard for classes, student progress and at-risk alerts",
      "Subscription billing and automatic reminders",
    ],
    whatChangedLabel: "What it makes possible",
    whatChanged:
      "Quizzes and progress reports go out without manual work, parents stay informed, and tutors can focus on teaching.",
    builtWith: "Next.js, Node.js, MongoDB, OpenAI GPT-4o, Stripe",
    related: ["matrimony-saas-platform", "recruitment-crm"],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
