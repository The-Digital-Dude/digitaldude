import type { CaseStudy } from "@/lib/content/caseStudies";
import { StatRow } from "@/components/StatRow";
import { RelatedWork } from "@/components/RelatedWork";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";

import { ViewContentTracker } from "@/components/ViewContentTracker";

export function CaseStudyTemplate({ project }: { project: CaseStudy }) {
  const caseStudyJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        headline: project.headline,
        name: project.title,
        description: project.pageSummary,
        image: project.image.startsWith("http") ? project.image : `${SITE_URL}${project.image}`,
        author: {
          "@type": "Organization",
          name: "The Digital Dude",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "The Digital Dude",
          url: SITE_URL,
          logo: `${SITE_URL}/logo-full-color.png`,
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `${SITE_URL}/work/${project.slug}`,
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
        <p className="mt-4 max-w-3xl text-navy/70">{project.challenge}</p>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">What we built</h2>
        <ul className="mt-4 max-w-3xl space-y-3">
          {project.whatWeBuilt.map((item) => (
            <li key={item} className="flex gap-3 text-navy/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">{project.whatChangedLabel}</h2>
        <p className="mt-4 max-w-3xl text-navy/70">{project.whatChanged}</p>
      </section>

      <section className="mx-auto max-w-content px-6 pb-10 pt-2">
        <h2 className="text-xl font-bold text-navy">Built with</h2>
        <p className="mt-4 max-w-3xl text-navy/70">{project.builtWith}</p>
      </section>

      <RelatedWork slugs={project.related} heading="Related work" />

      <StandardCTA />
    </>
  );
}
