import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/content/seo";
import { StandardCTA } from "@/components/StandardCTA";

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

export default function AboutPage() {
  return (
    <>
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
        <p className="mt-4 max-w-2xl text-sm text-navy/50">
          [Photos and first names with roles, e.g. Senior Developer, Developer, Digital Marketing
          Manager.]
        </p>
        <p className="mt-4 max-w-2xl text-navy/70">
          We bring in trusted specialists for projects that need extra hands, managed by the same
          core team from start to finish.
        </p>
      </section>

      <section className="mx-auto max-w-content px-6 pb-10 pt-2">
        <h2 className="text-xl font-bold text-navy">Where we are</h2>
        <p className="mt-4 max-w-3xl text-navy/70">
          UK-registered company · Team based in Dhaka, Bangladesh · Working with clients in
          Australia, the UK and Bangladesh
        </p>
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
