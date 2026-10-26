import type { CaseStudy } from "@/lib/content/caseStudies";
import { StatRow } from "@/components/StatRow";
import { RelatedWork } from "@/components/RelatedWork";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";
import { ViewContentTracker } from "@/components/ViewContentTracker";
import { Quote, Star, ShieldCheck } from "lucide-react";

export function CaseStudyTemplate({ project }: { project: CaseStudy }) {
  const caseStudyJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: project.headline,
        name: project.title,
        description: project.pageSummary,
        image: project.image.startsWith("http") ? project.image : `${SITE_URL}${project.image}`,
        datePublished: "2025-06-01T00:00:00Z",
        dateModified: "2026-10-10T00:00:00Z",
        author: {
          "@type": "Person",
          name: "Farhad Hossain",
          jobTitle: "Founder & Solutions Architect",
          url: "https://www.linkedin.com/in/neiloy-farhad/",
        },
        publisher: {
          "@type": "Organization",
          name: "The Digital Dude",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/logo-full-color.png`,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SITE_URL}/work/${project.slug}`,
        },
        about: {
          "@type": "SoftwareApplication",
          name: project.title,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web, Cloud",
        },
      },
      ...(project.testimonial
        ? [
            {
              "@type": "Review",
              itemReviewed: {
                "@type": "SoftwareApplication",
                name: project.title,
              },
              reviewRating: {
                "@type": "Rating",
                ratingValue: project.testimonial.ratingValue || 5,
                bestRating: 5,
              },
              author: {
                "@type": "Person",
                name: project.testimonial.author,
                jobTitle: project.testimonial.role,
              },
              reviewBody: project.testimonial.quote,
              publisher: {
                "@type": "Organization",
                name: project.testimonial.companyOrContext,
              },
            },
          ]
        : []),
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
            name: "Work",
            item: `${SITE_URL}/work`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: project.title,
            item: `${SITE_URL}/work/${project.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <ViewContentTracker
        contentName={project.title}
        contentCategory={project.tag}
        contentIds={[project.slug]}
        contentType="case_study"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(caseStudyJsonLd) }}
      />
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <span className="text-xs font-semibold uppercase tracking-wide text-purple">
          {project.tag} · {project.status}
        </span>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold text-navy sm:text-4xl">
          {project.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">{project.pageSummary}</p>

        <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-2xl bg-lavender">
          {/* Plain img, not next/image: SVG mockup, same caching rationale as ProjectCard.tsx */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={project.imageAlt}
            width={1200}
            height={675}
            loading="eager"
            className="absolute inset-0 h-full w-full object-contain p-10"
          />
        </div>

        <div className="mt-10">
          <StatRow stats={project.stats} />
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">The challenge</h2>
        <p className="mt-4 max-w-3xl text-navy/70 leading-relaxed">{project.challenge}</p>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">What we built</h2>
        <ul className="mt-4 max-w-3xl space-y-3">
          {project.whatWeBuilt.map((item) => (
            <li key={item} className="flex gap-3 text-navy/70 leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">{project.whatChangedLabel}</h2>
        <p className="mt-4 max-w-3xl text-navy/70 leading-relaxed">{project.whatChanged}</p>
      </section>

      {/* Verified Client Testimonial / Stakeholder Endorsement */}
      {project.testimonial && (
        <section className="mx-auto max-w-content px-6 py-8">
          <div className="rounded-2xl border border-purple/20 bg-gradient-to-br from-lavender/40 to-white p-8 md:p-10 shadow-sm relative overflow-hidden">
            <Quote className="absolute right-6 top-6 h-16 w-16 text-purple/10 pointer-events-none" />

            <div className="flex items-center gap-1.5 text-amber-500 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 text-xs font-bold text-navy uppercase tracking-wider inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Verified Client Outcome
              </span>
            </div>

            <blockquote className="text-base md:text-lg italic text-navy font-medium leading-relaxed">
              &ldquo;{project.testimonial.quote}&rdquo;
            </blockquote>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-purple/10 pt-4">
              <div>
                <div className="font-bold text-navy text-sm">{project.testimonial.author}</div>
                <div className="text-xs text-navy/60">{project.testimonial.role}</div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple border border-purple/20 shadow-xs">
                {project.testimonial.companyOrContext}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-content px-6 pb-10 pt-2">
        <h2 className="text-xl font-bold text-navy">Built with</h2>
        <p className="mt-4 max-w-3xl text-navy/70">{project.builtWith}</p>
      </section>

      <RelatedWork slugs={project.related} heading="Related work" />

      <StandardCTA />
    </>
  );
}
