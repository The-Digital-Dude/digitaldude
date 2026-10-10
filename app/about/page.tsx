import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/content/seo";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = buildMetadata("about", "/about");

const beliefs = [
  {
    title: "Understand first, build second.",
    body: "The right system starts with how your team actually works.",
  },
  {
    title: "Plain talk.",
    body: "No jargon, no surprises in scope or cost.",
  },
  {
    title: "Show, don't promise.",
    body: "We'd rather show you something we've built than tell you what we could build.",
  },
  {
    title: "You own what we build.",
    body: "Code, data and accounts are yours.",
  },
];

const byTheNumbers = [
  "2020 founded",
  "7 live and delivered products",
  "5 industries",
  "3 countries served",
];

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AboutPage",
      "@id": `${SITE_URL}/about#webpage`,
      url: `${SITE_URL}/about`,
      name: "About The Digital Dude | Bespoke Software Engineering Team",
      description: "Learn about The Digital Dude, our engineering values, delivery track record, and how we build custom CRMs, SaaS platforms, and enterprise tooling.",
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
          name: "About",
          item: `${SITE_URL}/about`,
        },
      ],
    },
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <h1 className="max-w-2xl text-3xl font-bold text-navy sm:text-4xl">
          A small team that builds big systems
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">
          The Digital Dude is a software team that builds CRMs, SaaS platforms and operations
          systems for growing businesses in Australia, the UK and Bangladesh. We&rsquo;re
          UK-registered, based in Dhaka, and have been building since 2020.
        </p>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">Our story</h2>
        <p className="mt-4 max-w-3xl text-navy/70">
          We started The Digital Dude in July 2020 after seeing the same problem again and again:
          good businesses held back by bad tools. Teams were running jobs on spreadsheets, chasing
          leads across WhatsApp, and paying for software that never quite fit how they worked.
        </p>
        <p className="mt-4 max-w-3xl text-navy/70">
          So we started building systems around the business, not the other way round. Six years
          on, our team has shipped seven live and delivered products across five industries, from
          a property CRM managing 4,000+ rentals to a three-app cleaning marketplace.
        </p>
        <p className="mt-4 max-w-3xl text-navy/70">
          We&rsquo;ve stayed deliberately small. Every project is scoped by our founder, built
          in-house, and handed over with everything you need to own it.
        </p>
      </section>

      <section className="bg-lavender py-16">
        <div className="mx-auto max-w-content px-6">
          <h2 className="text-xl font-bold text-navy">What we believe</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {beliefs.map((belief) => (
              <div key={belief.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-bold text-navy">{belief.title}</h3>
                <p className="mt-2 text-sm text-navy/70">{belief.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-16 text-center">
        <h2 className="text-xl font-bold text-navy">By the numbers</h2>
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-x-3 gap-y-2 text-navy/70">
          {byTheNumbers.map((stat, index) => (
            <span key={stat} className="font-semibold text-navy">
              {stat}
              {index < byTheNumbers.length - 1 && <span className="ml-3 text-navy/30">·</span>}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">The team</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-tint bg-white p-6 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Engineering Leadership</span>
            <h3 className="mt-2 text-lg font-bold text-navy">Solutions Architecture & Technical Direction</h3>
            <p className="mt-2 text-sm text-navy/70 leading-relaxed">
              Every client system is scoped and architected by our founder. We define data schemas, API contracts, security policies, and performance baselines before a single line of code is written.
            </p>
          </div>
          <div className="rounded-2xl border border-tint bg-white p-6 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Core Engineering</span>
            <h3 className="mt-2 text-lg font-bold text-navy">In-House Full-Stack Development</h3>
            <p className="mt-2 text-sm text-navy/70 leading-relaxed">
              Our dedicated engineering studio specializes in Next.js, TypeScript, Supabase PostgreSQL, and Stripe integration. We do not outsource to unvetted freelancers.
            </p>
          </div>
          <div className="rounded-2xl border border-tint bg-white p-6 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Product & Interface</span>
            <h3 className="mt-2 text-lg font-bold text-navy">UI/UX Design Systems</h3>
            <p className="mt-2 text-sm text-navy/70 leading-relaxed">
              High-converting, role-based interfaces designed in Figma with comprehensive clickable prototypes so your operational team approves every workflow upfront.
            </p>
          </div>
          <div className="rounded-2xl border border-tint bg-white p-6 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Delivery & Reliability</span>
            <h3 className="mt-2 text-lg font-bold text-navy">QA, Data Migration & Support</h3>
            <p className="mt-2 text-sm text-navy/70 leading-relaxed">
              Rigorous test automation, secure spreadsheet-to-PostgreSQL data migrations, and continuous monitoring to ensure zero production disruptions.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 pb-12 pt-4">
        <h2 className="text-xl font-bold text-navy">Where we are</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl bg-lavender p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Registered Entity</span>
            <h3 className="mt-2 font-bold text-navy">United Kingdom</h3>
            <p className="mt-2 text-xs text-navy/70 leading-relaxed">
              The Digital Dude Ltd is registered in England &amp; Wales, operating under UK corporate, contract, and data protection laws (GDPR).
            </p>
          </div>
          <div className="rounded-2xl bg-lavender p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Delivery Hub</span>
            <h3 className="mt-2 font-bold text-navy">Dhaka Engineering Hub</h3>
            <p className="mt-2 text-xs text-navy/70 leading-relaxed">
              Our central software engineering studio is located in Dhaka, Bangladesh, housing our full-time developers and technical delivery team.
            </p>
          </div>
          <div className="rounded-2xl bg-lavender p-6">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Client Service Areas</span>
            <h3 className="mt-2 font-bold text-navy">UK &amp; Australia Coverage</h3>
            <p className="mt-2 text-xs text-navy/70 leading-relaxed">
              We partner with high-growth enterprises across London, Manchester, Sydney, Melbourne, Brisbane, and internationally with localized timezone overlap.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-content px-6 pb-16 text-center">
        <Link href="/contact" className="font-semibold text-purple">
          Want to see if we&rsquo;re the right fit? Book a 30-minute call with our team.
        </Link>
      </div>

      <StandardCTA />
    </>
  );
}
