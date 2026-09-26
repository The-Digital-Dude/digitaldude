import type { Faq } from "@/lib/content/services";

export type IndustryPage = {
  slug: string;
  navLabel: string; // short label, e.g. "Property"
  displayLabel: string; // full label, e.g. "Property and real estate"
  headline: string;
  intro: string;
  painPoints: string[];
  whatWeBuild: string[];
  caseStudySlug: string;
  relatedServiceSlugs: string[];
  faqs: Faq[];
};

export const industries: IndustryPage[] = [
  {
    slug: "property",
    navLabel: "Property",
    displayLabel: "Property and real estate",
    headline: "Custom CRMs for property and real estate businesses",
    intro:
      "Property and real estate businesses coordinate agencies, property managers and technicians across more moving parts than most CRMs are built for. We build systems shaped around how your operation actually runs.",
    painPoints: [
      "Agencies, property managers, technicians and your own team all working from separate tools",
      "Jobs slipping between scheduled, overdue and completed with no single view",
      "Quotes, invoices and technician payments scattered across spreadsheets and email",
      "No way for management to see performance across regions or agencies",
    ],
    whatWeBuild: [
      "Separate portals for admin, team members, agencies, property managers and technicians",
      "Full job tracking from creation to payment, with dedicated views for scheduled, overdue and completed work",
      "Quotes, invoices and payments linked directly to each job",
      "Lead management to bring in and convert new agencies and property managers",
      "Regional dashboards and reports for management",
    ],
    caseStudySlug: "property-compliance-crm",
    relatedServiceSlugs: ["crm-development", "erp-hrm-systems"],
    faqs: [
      {
        q: "Can it handle multiple agencies or portfolios?",
        a: "Yes. Our property compliance CRM manages 4,000+ rentals across 30+ agencies on one platform, with each agency and property manager seeing only their own portfolio.",
      },
      {
        q: "Can it replace our spreadsheets and email threads?",
        a: "That's the point of it. Jobs, quotes, invoices and technician payments all move through one system instead of scattered tools.",
      },
      {
        q: "How long does a property CRM take to build?",
        a: "A multi-portal system with several user types, like agencies, property managers and technicians, usually takes 8 to 14 weeks.",
      },
    ],
  },
  {
    slug: "travel",
    navLabel: "Travel",
    displayLabel: "Travel and tourism",
    headline: "Custom CRMs for travel and ticketing agencies",
    intro:
      "Travel and ticketing agencies lose track of leads the moment they arrive from more than one channel. We build CRMs that bring every enquiry into one pipeline your agents actually use.",
    painPoints: [
      "Enquiries arriving through WhatsApp, Facebook, phone calls and walk-ins with nowhere to manage them together",
      "No clear ownership of who's handling each lead",
      "No live view of conversions, lost sales or progress against target",
      "No visibility into how each agent is performing",
    ],
    whatWeBuild: [
      "Lead capture from WhatsApp, Facebook and manual entry, organised without duplicates",
      "A booking pipeline matched to how your agents actually sell",
      "A dashboard showing leads, follow-ups, conversions and progress against target for any date range",
      "\"My leads\" and \"my follow-ups\" views so every agent knows what to do next",
      "Agent performance tracking: leads collected, conversions and conversion rate",
    ],
    caseStudySlug: "airline-ticketing-crm",
    relatedServiceSlugs: ["crm-development"],
    faqs: [
      {
        q: "Can it bring in leads from WhatsApp and Facebook automatically?",
        a: "Yes. Our airline ticketing CRM captures leads from WhatsApp, Facebook and manual entry into one pipeline, without duplicates.",
      },
      {
        q: "Can we see how each agent is performing?",
        a: "Yes. Agent performance views show leads collected, conversions and conversion rate, alongside customer history and quick search.",
      },
      {
        q: "How long does a travel agency CRM take?",
        a: "A focused CRM usually takes 4 to 6 weeks. Adding dashboards and agent performance views takes closer to 8 to 14 weeks.",
      },
    ],
  },
  {
    slug: "home-services",
    navLabel: "Home services",
    displayLabel: "Cleaning and home services",
    headline: "Booking, job and payment systems for home service businesses",
    intro:
      "Cleaning and other home service businesses need customers to book and pay upfront, providers to manage their jobs, and admins to see it all — without adding headcount every time you grow.",
    painPoints: [
      "Bookings coming in by phone and message instead of a proper system",
      "Payments chased after the job instead of collected upfront",
      "No proof of work when a customer complains",
      "More cleaners or providers meaning more admin overhead",
    ],
    whatWeBuild: [
      "A customer app to choose a service, see the price, pay upfront and track the job",
      "A provider app to accept jobs, check in, upload before and after photos and mark jobs complete",
      "An admin CRM to approve providers, assign jobs, and track revenue, commission and payouts",
      "Automatic notifications at booking, assignment and completion",
      "Full job history and reports on revenue, volume and provider performance",
    ],
    caseStudySlug: "cleaning-marketplace",
    relatedServiceSlugs: ["marketplace-development"],
    faqs: [
      {
        q: "Can customers pay before the job starts?",
        a: "Yes. Our cleaning marketplace platform takes payment upfront through Stripe before any job begins.",
      },
      {
        q: "Can we prove work was done if a customer complains?",
        a: "Yes. Providers upload before and after photos for every job, giving you evidence and a full history to check.",
      },
      {
        q: "Can we add more providers or areas without adding admin staff?",
        a: "That's the goal. Approvals, job assignment and payouts run through the admin CRM, so growth doesn't mean more manual work.",
      },
    ],
  },
  {
    slug: "logistics",
    navLabel: "Logistics",
    displayLabel: "Transport and logistics",
    headline: "Coordination systems for transport and logistics teams",
    intro:
      "When something goes wrong on the road, every minute spent on phone calls is a minute of delay. We build systems that connect drivers and dispatch the moment an incident happens.",
    painPoints: [
      "Breakdowns and incidents coordinated over phone calls and messages",
      "Dispatch losing time finding out where a driver is and what happened",
      "No single view of every active incident and its status",
      "Slow coordination between drivers and the people who can help them",
    ],
    whatWeBuild: [
      "A mobile app for drivers to report an incident with the details dispatch needs",
      "An admin view showing every active incident and its status",
      "Coordination tools so admins can assign help and keep drivers updated",
    ],
    caseStudySlug: "logistics-platform",
    relatedServiceSlugs: ["erp-hrm-systems", "marketplace-development"],
    faqs: [
      {
        q: "Can drivers report issues from their phone?",
        a: "Yes. Our logistics coordination platform is mobile-first, so drivers report incidents from the road with the details dispatch needs.",
      },
      {
        q: "Does it actually speed up response times?",
        a: "For our logistics client, response coordination improved by 40% after moving off phone calls and onto one coordination platform.",
      },
      {
        q: "How long does a coordination platform take to build?",
        a: "It depends on scope, but a mobile app plus an admin coordination view typically falls in the 8 to 14 week range.",
      },
    ],
  },
  {
    slug: "recruitment",
    navLabel: "Recruitment",
    displayLabel: "Recruitment and staffing",
    headline: "Recruitment CRMs with real-time candidate portals",
    intro:
      "Recruitment and staffing agencies juggle candidate documents, status updates and communication across email, spreadsheets and WhatsApp. We build systems that put all of it in one place.",
    painPoints: [
      "Candidate documents and status updates scattered across email, spreadsheets and WhatsApp",
      "Candidates calling in just to ask where their application stands",
      "Manual document checks for visas, clearances and agreements",
      "No way to track candidates after they're placed",
    ],
    whatWeBuild: [
      "A candidate website to apply, upload documents and see application status in real time",
      "A CRM for admins and agents with role-based access, candidate filtering and interview approval",
      "Document checks for visas, clearances and agreements",
      "Automatic status updates by WhatsApp and email",
      "Post-placement tracking of start dates, salary, leave and employment status",
    ],
    caseStudySlug: "recruitment-crm",
    relatedServiceSlugs: ["crm-development"],
    faqs: [
      {
        q: "Can candidates check their own status without calling us?",
        a: "Yes. Our recruitment CRM gives candidates a real-time portal to see where their application stands and upload documents.",
      },
      {
        q: "Can it track candidates after they're placed?",
        a: "Yes. Post-placement tracking covers start dates, salary, leave and employment status, so you can follow up long after the start date.",
      },
      {
        q: "How long does a recruitment CRM take?",
        a: "A multi-portal system with a candidate site plus an internal CRM usually takes 8 to 14 weeks.",
      },
    ],
  },
  {
    slug: "education",
    navLabel: "Education",
    displayLabel: "Education",
    headline: "AI-powered systems for tutoring and education businesses",
    intro:
      "Tutors spend hours every week writing quizzes, marking them and updating parents. We build platforms that handle the repetitive parts automatically, so tutors can focus on teaching.",
    painPoints: [
      "Hours spent every week writing and marking quizzes by hand",
      "Parents wanting more visibility into how their child is progressing",
      "No early warning when a student starts struggling",
      "Manual scheduling and progress reporting",
    ],
    whatWeBuild: [
      "AI-generated quizzes matched to each student's subject and level",
      "Instant grading with feedback on strengths, weak spots and what to practise next",
      "A portal where students and parents see results, reports, attendance and schedules",
      "An admin dashboard for classes, student progress and at-risk alerts",
      "Subscription billing and automatic reminders",
    ],
    caseStudySlug: "ai-tutoring-platform",
    relatedServiceSlugs: ["saas-development"],
    faqs: [
      {
        q: "Can it generate and mark quizzes automatically?",
        a: "Yes. Our AI tutoring platform generates quizzes matched to each student's level and grades them instantly with feedback.",
      },
      {
        q: "Can parents see their child's progress?",
        a: "Yes. Parents and students get a portal showing results, reports, attendance and schedules.",
      },
      {
        q: "Can it flag students who are falling behind?",
        a: "Yes. The admin dashboard includes at-risk alerts so tutors can step in earlier.",
      },
    ],
  },
  {
    slug: "community",
    navLabel: "Community",
    displayLabel: "Community platforms",
    headline: "Trust-first platforms for community and matchmaking businesses",
    intro:
      "In community and matchmaking platforms, trust is the product. We build systems that verify members properly while still making it easy to connect and easy for you to charge for it.",
    painPoints: [
      "Members needing to feel confident every profile is real",
      "Verification that's either too weak to build trust or too heavy to use",
      "Matching members manually instead of with any real intelligence",
      "Payments and subscriptions bolted on as an afterthought",
    ],
    whatWeBuild: [
      "An AI matchmaking engine that suggests compatible members",
      "Multiple levels of verification, up to identity and police checks",
      "Subscription plans with recurring billing",
      "Private messaging between members",
      "Community rooms for group conversation",
    ],
    caseStudySlug: "matrimony-saas-platform",
    relatedServiceSlugs: ["saas-development"],
    faqs: [
      {
        q: "How thorough can verification be?",
        a: "Our matchmaking platform runs 5 tiers of verification, up to identity and police checks, so members can trust who they're talking to.",
      },
      {
        q: "Can it suggest matches automatically?",
        a: "Yes. An AI matchmaking engine suggests compatible members based on the platform's matching logic.",
      },
      {
        q: "Can we charge for premium access?",
        a: "Yes. Subscription plans with recurring billing are built in from the start.",
      },
    ],
  },
];

export function getIndustry(slug: string) {
  return industries.find((i) => i.slug === slug);
}
