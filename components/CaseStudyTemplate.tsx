import type { CaseStudy } from "@/lib/content/caseStudies";
import { StatRow } from "@/components/StatRow";
import { RelatedWork } from "@/components/RelatedWork";
import { StandardCTA } from "@/components/StandardCTA";

export function CaseStudyTemplate({ project }: { project: CaseStudy }) {
  return (
    <>
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <span className="text-xs font-semibold uppercase tracking-wide text-purple">
          {project.tag} · {project.status}
        </span>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold text-navy sm:text-4xl">
          {project.headline}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">{project.pageSummary}</p>

        <div className="relative mt-10 aspect-video w-full overflow-hidden rounded-2xl bg-lavender">
          <img
            src={project.image}
            alt={project.title}
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
