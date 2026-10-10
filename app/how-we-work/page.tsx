import type { Metadata } from "next";
import { Search, PenTool, Code2, CheckCircle2, Rocket, PackageCheck } from "lucide-react";
import { buildMetadata } from "@/lib/content/seo";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = buildMetadata("how-we-work", "/how-we-work");

const steps = [
  {
    step: "1. Discovery",
    icon: Search,
    happens: "A call with our founder, then a deeper session to map how your business runs today",
    get: "A one-page brief: what we'll build, what's out of scope, the deadline, and who owns each part",
  },
  {
    step: "2. Design",
    icon: PenTool,
    happens: "We design every screen of the system",
    get: "Clickable designs you review and approve before any code is written",
  },
  {
    step: "3. Development",
    icon: Code2,
    happens: "Our team builds the system in stages",
    get: "A live demo every two weeks, so you see real progress",
  },
  {
    step: "4. Testing",
    icon: CheckCircle2,
    happens: "We test everything, then your team tries it with real examples",
    get: "A system checked by the people who will use it",
  },
  {
    step: "5. Launch",
    icon: Rocket,
    happens: "We go live and move your existing data across",
    get: "Your team working in the new system, with us on hand",
  },
  {
    step: "6. Handover",
    icon: PackageCheck,
    happens: "A walkthrough session and a written guide",
    get: "Full access to the code, data and every account",
  },
];

const timelines = [
  { type: "Website", time: "3 to 6 weeks" },
  { type: "Focused CRM", time: "4 to 6 weeks" },
  { type: "Multi-portal CRM or SaaS platform", time: "8 to 14 weeks" },
  { type: "Marketplace with customer, provider and admin apps", time: "12 to 20 weeks" },
];

const howWeWorkJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/how-we-work#webpage`,
      url: `${SITE_URL}/how-we-work`,
      name: "Engineering Methodology & Delivery Process | The Digital Dude",
      description: "Our structured 6-stage software delivery framework from discovery and interactive design to staging, QA, and handover.",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: "The Digital Dude",
        url: SITE_URL,
      },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "How We Work",
          item: `${SITE_URL}/how-we-work`,
        },
      ],
    },
    {
      "@type": "ItemList",
      name: "How Custom Software Is Engineered & Delivered at The Digital Dude",
      description: "A disciplined 6-step engineering framework ensuring high software quality, bi-weekly demos, and seamless production handover.",
      itemListElement: steps.map((s, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: s.step,
        description: `${s.happens}. Key Deliverable: ${s.get}`,
      })),
    },
  ],
};

export default function HowWeWorkPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howWeWorkJsonLd) }}
      />
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <h1 className="max-w-2xl text-3xl font-bold text-navy sm:text-4xl">
          How working with us goes
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">
          Working with a development team overseas should feel as simple as working with one down
          the road. Here&rsquo;s exactly what happens from the first call to launch day and
          beyond.
        </p>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <div className="overflow-x-auto rounded-2xl border border-tint">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-lavender text-navy">
              <tr>
                <th className="px-5 py-3 font-semibold">Step</th>
                <th className="px-5 py-3 font-semibold">What happens</th>
                <th className="px-5 py-3 font-semibold">What you get</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tint">
              {steps.map((row) => (
                <tr key={row.step}>
                  <td className="px-5 py-4 font-semibold text-navy">
                    <span className="flex items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tint text-purple">
                        <row.icon size={16} />
                      </span>
                      {row.step}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-navy/70">{row.happens}</td>
                  <td className="px-5 py-4 text-navy/70">{row.get}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">How long it takes</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {timelines.map((row) => (
            <div
              key={row.type}
              className="flex items-center justify-between rounded-xl border border-tint bg-lavender p-4"
            >
              <span className="font-medium text-navy">{row.type}</span>
              <span className="font-semibold text-purple">{row.time}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">How payment works</h2>
        <p className="mt-4 max-w-3xl text-navy/70">
          You pay 50% upfront to start, and the remaining 50% across agreed milestones during the
          project. Every cost is fixed in the proposal before we begin, so there are no surprise
          invoices. We accept bank transfer through Wise and card payments through Stripe.
        </p>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">Staying in touch</h2>
        <ul className="mt-4 max-w-3xl space-y-3">
          {[
            "One main contact on our side for the whole project",
            "A progress update every week",
            "A live demo every two weeks",
            "We work across time zones, with meeting slots during Australian mornings and UK afternoons",
          ].map((item) => (
            <li key={item} className="flex gap-3 text-navy/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">After launch</h2>
        <p className="mt-4 max-w-3xl text-navy/70">
          Every project includes 30 days of support after launch to fix any bugs at no extra cost.
          After that, you can choose a monthly support plan for updates, improvements and priority
          help, or simply come back when you need something.
        </p>
      </section>

      <section className="mx-auto max-w-content px-6 pb-10 pt-2">
        <h2 className="text-xl font-bold text-navy">What we need from you</h2>
        <ul className="mt-4 max-w-3xl space-y-3">
          {[
            "One person who can make decisions on the project",
            "Feedback within a few working days at each review point",
            "Access to existing data and accounts when we need them",
          ].map((item) => (
            <li key={item} className="flex gap-3 text-navy/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <StandardCTA />
    </>
  );
}
