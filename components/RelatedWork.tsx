import Link from "next/link";
import { caseStudies } from "@/lib/content/caseStudies";
import { ProjectCard } from "@/components/ProjectCard";

export function RelatedWork({ slugs, heading = "Related work" }: { slugs: string[]; heading?: string }) {
  const projects = slugs
    .map((slug) => caseStudies.find((c) => c.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (projects.length === 0) {
    if (slugs.length === 0) return null; // nothing to show — suppress entirely
    return (
      <section className="mx-auto max-w-content px-6 py-16">
        <h2 className="text-xl font-bold text-navy">{heading}</h2>
        <p className="mt-2 text-navy/70">
          <Link href="/work" className="font-semibold text-purple hover:underline">
            See all our projects →
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-content px-6 py-16">
      <h2 className="text-xl font-bold text-navy">{heading}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  );
}

