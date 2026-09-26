import Link from "next/link";
import type { CaseStudy } from "@/lib/content/caseStudies";

export function ProjectCard({ project }: { project: CaseStudy }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-lavender">
        {/* Plain img, not next/image: these are vector SVG mockups, and next/image's
            aggressive immutable cache headers make browsers ignore file updates. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.imageAlt}
          className="absolute inset-0 h-full w-full object-contain p-8"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy shadow">
          {project.status}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <span className="text-xs font-semibold uppercase tracking-wide text-purple">
          {project.tag}
        </span>
        <h3 className="mt-2 text-lg font-bold text-navy group-hover:text-purple">
          {project.title}
        </h3>
        <p className="mt-2 text-sm text-navy/70">{project.summary}</p>
      </div>
    </Link>
  );
}
