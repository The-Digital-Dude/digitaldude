export type Faq = { q: string; a: string };

export type Service = {
  slug: string;
  navLabel: string; // label used in header dropdown / overview cards
  oneLiner: string; // used on the services overview card
  headline: string;
  intro: string;
  included: string[];
  whoFor: string;
  related: string[]; // case study slugs
  faqs: Faq[];
};

export const services: Service[] = [
  {
    slug: "crm-development",
    navLabel: "CRM development",
    oneLiner:
      "Leads, customers, jobs and follow-ups in one place, shaped around your process.",
    headline: "CRMs built around how your team actually works",
    intro:
      "Off-the-shelf CRMs make you change your process to fit the software. We do it the other way round. We map how leads, customers and jobs move through your business, then build a CRM that fits.",
    included: [
      "Lead capture from your website, WhatsApp, Facebook, email and phone",
      "Pipelines with the stages your team really uses",
      "Separate logins and views for each role, from admin to field staff",
      "Dashboards and reports on the numbers you care about",
      "Quotes, invoices and payments connected to each customer or job",
      "Moving your existing spreadsheet data across",
    ],
    whoFor:
      "Teams of 5 to 200 people who manage leads, jobs or bookings across spreadsheets and chat apps, or who pay for a CRM nobody uses properly.",
    related: ["property-compliance-crm", "airline-ticketing-crm", "recruitment-crm"],
    faqs: [
      {
        q: "Why not just use HubSpot or Salesforce?",
        a: "They're great for standard sales teams. If your business has its own workflow, like jobs moving between agencies and technicians, you end up paying for features you don't use and working around the ones you need. A custom CRM fits from day one.",
      },
      {
        q: "Can you move our data from spreadsheets?",
        a: "Yes. Importing existing data is part of every CRM project.",
      },
      {
        q: "How long does it take?",
        a: "A focused CRM usually takes 4 to 6 weeks. A multi-portal system with several user types takes 8 to 14 weeks.",
      },
    ],
  },
  {
    slug: "saas-development",
    navLabel: "SaaS development",
    oneLiner: "Subscription products with portals, billing and user roles, ready to sell.",
    headline: "SaaS platforms, from idea to paying customers",
    intro:
      "Have a product idea or an internal tool others would pay for? We build SaaS platforms with the parts that matter from the start: user accounts, subscriptions, admin tools and a foundation that can grow.",
    included: [
      "Scoping the first version so you launch with what customers need, not everything at once",
      "User accounts, roles and permissions",
      "Subscription plans and billing with Stripe",
      "Admin dashboard to manage users, plans and content",
      "AI features where they add real value, such as matching, grading or recommendations",
      "Launch, hosting setup and support after release",
    ],
    whoFor:
      "Founders launching a new product, and businesses turning an internal system into something they can sell.",
    related: ["matrimony-saas-platform", "ai-tutoring-platform", "property-compliance-crm"],
    faqs: [
      {
        q: "Can you build an MVP first?",
        a: "Yes, and we usually recommend it. We help you decide what goes into version one so you can launch sooner and learn from real users.",
      },
      {
        q: "Who owns the code?",
        a: "You do, along with every account and all your data.",
      },
      {
        q: "Can you add AI features?",
        a: "Yes. We've built AI matchmaking, AI-generated quizzes and automatic grading. We only suggest AI where it saves real time or improves results.",
      },
    ],
  },
  {
    slug: "erp-hrm-systems",
    navLabel: "ERP and HRM systems",
    oneLiner: "Operations, staff, payroll and reporting connected in one system.",
    headline: "Run your operations, staff and reporting from one system",
    intro:
      "When stock, staff, payroll and reporting each live in a different tool, nobody sees the full picture. We build ERP and HRM systems that connect them, shaped around how your business already operates.",
    included: [
      "Operations tracking across branches, sites or teams",
      "Staff records, attendance, leave and payroll",
      "Stock, purchasing and sales where you need them",
      "Reports that pull numbers from across the business",
      "Role-based access so each manager sees their area",
    ],
    whoFor:
      "Multi-location or multi-team businesses that have outgrown spreadsheets and off-the-shelf tools.",
    related: ["property-compliance-crm", "logistics-platform"],
    faqs: [
      {
        q: "Can it connect to our accounting software?",
        a: "Usually, yes. We scope integrations during discovery and list them clearly in the proposal.",
      },
      {
        q: "Do we need to replace everything at once?",
        a: "No. Many clients start with the part causing the most pain and add modules over time.",
      },
      {
        q: "Can staff use it on their phones?",
        a: "Yes. Everything we build works on mobile.",
      },
    ],
  },
  {
    slug: "marketplace-development",
    navLabel: "Marketplaces and apps",
    oneLiner: "Customer app, provider app and admin, working as one.",
    headline: "Marketplaces where customers, providers and your team work as one",
    intro:
      "On-demand businesses need three things to work together: a way for customers to book and pay, a way for providers to receive and complete jobs, and a way for you to run it all. We build all three as one connected system.",
    included: [
      "Customer app or website for booking and upfront payment",
      "Provider app for jobs, check-ins, photos and completion",
      "Admin CRM for approvals, job assignment, commission and payouts",
      "Automatic notifications at every step",
      "Reports on revenue, volume and provider performance",
    ],
    whoFor:
      "Cleaning, home services, logistics and other on-demand businesses ready to grow without adding admin staff.",
    related: ["cleaning-marketplace", "logistics-platform"],
    faqs: [
      {
        q: "Are the apps native or web-based?",
        a: "It depends on what you need. We'll recommend the right approach in the proposal and explain the trade-offs in plain terms.",
      },
      {
        q: "How do payments and commission work?",
        a: "Customers pay upfront through Stripe, commission is calculated automatically, and payouts are tracked for every provider.",
      },
      {
        q: "How long does a marketplace take?",
        a: "Usually 12 to 20 weeks for all three parts.",
      },
    ],
  },
  {
    slug: "website-development",
    navLabel: "Websites",
    oneLiner: "Fast, search-friendly sites built to bring in enquiries.",
    headline: "Websites built to bring in enquiries, not just look good",
    intro:
      "Your website is often the first thing a potential client checks. We build fast, clear sites that explain what you do, prove it, and make getting in touch easy. They're built so Google can read every page from day one.",
    included: [
      "Page structure and copy guidance focused on turning visitors into enquiries",
      "Custom design in your brand",
      "Fast, mobile-friendly build in Next.js or WordPress",
      "Search basics set up properly: page titles, descriptions, sitemap and structured data",
      "Contact forms connected to your inbox or CRM",
    ],
    whoFor: "Service businesses whose website is outdated, slow, or not bringing in enquiries.",
    related: ["property-compliance-crm"],
    faqs: [
      {
        q: "Can you connect the website to our CRM?",
        a: "Yes. Enquiries can flow straight into your CRM so nothing gets missed.",
      },
      {
        q: "Will I be able to edit it?",
        a: "Yes. We set up simple editing for the content you change often.",
      },
      {
        q: "How long does it take?",
        a: "Most websites take 3 to 6 weeks.",
      },
    ],
  },
  {
    slug: "seo-growth",
    navLabel: "SEO and growth",
    oneLiner: "Get found by the customers already searching for you.",
    headline: "Get found by the customers already searching for you",
    intro:
      "A great system needs customers to use it. Our team handles SEO and growth for clients who want more of the right enquiries, starting with the technical foundations most sites get wrong.",
    included: [
      "Technical SEO audit and fixes",
      "Keyword research based on what your customers actually search",
      "On-page improvements and content planning",
      "Google Analytics and Search Console setup and tracking",
      "Monthly reporting on what's working",
    ],
    whoFor: "Businesses with a solid website that isn't bringing in enough traffic or enquiries.",
    related: [],
    faqs: [
      {
        q: "How long until we see results?",
        a: "SEO usually takes 3 to 6 months to show real movement. We'll tell you honestly what to expect before you start.",
      },
      {
        q: "Do you run paid ads?",
        a: "Yes, Google and Meta ads, as part of a wider growth plan.",
      },
      {
        q: "Can you fix our current site's SEO without rebuilding it?",
        a: "Often, yes. The audit will show whether fixes are enough or a rebuild makes more sense.",
      },
    ],
  },
];

export function getService(slug: string) {
  return services.find((s) => s.slug === slug);
}
