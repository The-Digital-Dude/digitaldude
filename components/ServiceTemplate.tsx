import type { Service } from "@/lib/content/services";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RelatedWork } from "@/components/RelatedWork";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";
import { 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Clock, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export function ServiceTemplate({ service }: { service: Service }) {
  const serviceUrl = `${SITE_URL}/services/${service.slug}`;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${serviceUrl}#service`,
        name: service.headline,
        description: service.intro,
        provider: {
          "@type": "Organization",
          name: "The Digital Dude",
          url: SITE_URL,
          logo: `${SITE_URL}/logo-full-color.png`,
        },
        serviceType: service.navLabel,
        areaServed: [
          { "@type": "Country", name: "United Kingdom" },
          { "@type": "Country", name: "Australia" }
        ],
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
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
            name: "Services",
            item: `${SITE_URL}/services`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.navLabel,
            item: serviceUrl,
          },
        ],
      },
      ...(service.faqs && service.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: service.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      {/* Hero Section */}
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <div className="inline-flex items-center gap-2 rounded-full bg-purple/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-purple mb-4">
          <Sparkles size={14} />
          {service.navLabel}
        </div>
        <h1 className="max-w-4xl text-3xl font-extrabold text-navy sm:text-5xl leading-[1.15] tracking-tight">
          {service.headline}
        </h1>
        <p className="mt-5 max-w-3xl text-lg sm:text-xl text-navy/75 leading-relaxed font-normal">
          {service.intro}
        </p>

        {/* ROI Metrics Stat Strip */}
        {service.roiHighlights && service.roiHighlights.length > 0 && (
          <div className="mt-10 grid gap-4 sm:grid-cols-3 rounded-2xl border border-black/5 bg-white p-6 shadow-xs">
            {service.roiHighlights.map((roi, idx) => (
              <div key={idx} className="border-l-2 border-purple pl-4">
                <span className="text-2xl sm:text-3xl font-bold text-navy">{roi.metric}</span>
                <p className="text-xs font-bold uppercase tracking-wide text-purple mt-0.5">{roi.label}</p>
                <p className="text-xs text-navy/60 mt-1 leading-normal">{roi.detail}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* What's Included / Core Capabilities */}
      <section className="mx-auto max-w-content px-6 py-12 border-t border-black/5">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold text-navy flex items-center gap-2.5">
            <Layers size={22} className="text-purple" />
            What&rsquo;s Included &amp; Key Deliverables
          </h2>
          <p className="text-sm text-navy/60 mt-1 mb-6">
            Production-ready features engineered with zero bloat and complete operational alignment.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {service.included.map((item, idx) => (
            <div key={idx} className="flex gap-3.5 rounded-2xl border border-black/5 bg-white p-5 shadow-xs">
              <CheckCircle2 size={18} className="text-purple flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-navy/80 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Architecture Blueprint */}
      {service.architectureBlueprint && service.architectureBlueprint.length > 0 && (
        <section className="bg-lavender/40 py-16 border-y border-black/5">
          <div className="mx-auto max-w-content px-6">
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-purple">Technical Blueprint</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1 flex items-center gap-2.5">
                <Cpu size={24} className="text-purple" />
                Core System Modules &amp; Data Flow
              </h2>
              <p className="text-sm text-navy/70 mt-2 leading-relaxed">
                How we architect high-concurrency, secure data pipelines designed to run reliably at scale.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {service.architectureBlueprint.map((module, idx) => (
                <div key={idx} className="rounded-2xl border border-black/5 bg-white p-6 sm:p-7 shadow-xs space-y-3">
                  <h3 className="text-lg font-bold text-navy">{module.title}</h3>
                  <p className="text-sm text-navy/70 leading-relaxed">{module.description}</p>
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {module.techHighlights.map((tech, tIdx) => (
                      <span key={tIdx} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-navy/70">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comparison Matrix: Custom vs Off-The-Shelf */}
      {service.comparisonMatrix && service.comparisonMatrix.length > 0 && (
        <section className="mx-auto max-w-content px-6 py-16">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Strategic ROI</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1 flex items-center gap-2.5">
              <TrendingUp size={24} className="text-purple" />
              Bespoke Architecture vs. Generic SaaS &amp; Spreadsheets
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-navy">
                    <th className="p-4 sm:p-5 w-1/4">Evaluation Factor</th>
                    <th className="p-4 sm:p-5 w-3/8 text-purple bg-purple/5">Custom Engineering (The Digital Dude)</th>
                    <th className="p-4 sm:p-5 w-3/8 text-navy/50">Off-the-Shelf SaaS / Spreadsheets</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {service.comparisonMatrix.map((row, idx) => (
                    <tr key={idx} className="transition hover:bg-slate-50/50">
                      <td className="p-4 sm:p-5 font-bold text-navy">{row.feature}</td>
                      <td className="p-4 sm:p-5 text-navy/90 font-medium bg-purple/5 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 size={16} className="text-purple flex-shrink-0 mt-0.5" />
                          <span>{row.custom}</span>
                        </div>
                      </td>
                      <td className="p-4 sm:p-5 text-navy/60 leading-relaxed">{row.offTheShelf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 4-Stage Phased Delivery Framework */}
      {service.deliveryPhases && service.deliveryPhases.length > 0 && (
        <section className="bg-sand/60 py-16 border-t border-black/5">
          <div className="mx-auto max-w-content px-6">
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-purple">Agile Engineering</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1 flex items-center gap-2.5">
                <Clock size={24} className="text-purple" />
                Delivery Framework &amp; Milestones
              </h2>
              <p className="text-sm text-navy/70 mt-2 leading-relaxed">
                Clear milestones, bi-weekly staging builds, fixed proposals, and zero hidden scope creep.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {service.deliveryPhases.map((phase, idx) => (
                <div key={idx} className="rounded-2xl border border-black/5 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-purple mb-2">
                      <span className="rounded-md bg-purple/10 px-2 py-0.5">Step 0{idx + 1}</span>
                      <span className="text-navy/50">{phase.duration}</span>
                    </div>
                    <h3 className="font-bold text-navy text-sm">{phase.phase}</h3>
                    <p className="text-xs text-navy/70 mt-2 leading-relaxed">{phase.focus}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold uppercase text-navy/40 mb-1.5">Deliverables:</p>
                    <ul className="space-y-1">
                      {phase.deliverables.map((del, dIdx) => (
                        <li key={dIdx} className="text-xs text-navy/75 flex items-start gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-purple mt-1.5 flex-shrink-0" />
                          <span>{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Target Audience Profile */}
      <section className="mx-auto max-w-content px-6 py-12">
        <div className="rounded-2xl border border-black/5 bg-white p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-lg font-bold text-navy flex items-center gap-2">
              <ShieldCheck size={20} className="text-purple" />
              Ideal Client Profile
            </h3>
            <p className="text-sm text-navy/70 leading-relaxed">{service.whoFor}</p>
          </div>
          <Link
            href="/contact"
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-3 text-xs font-bold text-white transition hover:bg-purple/90 shadow-xs"
          >
            Check Technical Feasibility <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Related Shipped Work */}
      <RelatedWork slugs={service.related} heading="Production Proof & Case Studies" />

      {/* Deep-Dive FAQ Accordion */}
      <section className="mx-auto max-w-content px-6 py-16">
        <div className="max-w-3xl mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-purple">Direct Answers</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mt-1">Frequently Asked Technical Questions</h2>
          <p className="text-sm text-navy/60 mt-1">
            Everything you need to know about timelines, source code ownership, data migration, and post-launch support.
          </p>
        </div>
        <div className="max-w-3xl">
          <FaqAccordion faqs={service.faqs} />
        </div>
      </section>

      <StandardCTA />
    </>
  );
}
