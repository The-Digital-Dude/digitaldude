import Link from "next/link";
import { TrendingUp, Tag } from "lucide-react";
import type { CaseStudy } from "@/lib/content/caseStudies";

export function ProjectCard({ project }: { project: CaseStudy }) {
  // Parse tech stack items
  const techStack = project.builtWith
    ? project.builtWith
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];

  // Top KPI metric
  const topKpi = project.stats && project.stats.length > 0 ? project.stats[0] : null;

  return (
    <Link
      href={`/work/${project.slug}`}
      className="group flex flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-purple/30"
    >
      <div className="relative aspect-[4/3] w-full bg-lavender flex items-center justify-center p-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={project.image}
          alt={project.imageAlt || project.title}
          width={600}
          height={450}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain p-8 transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/95 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-navy shadow-xs border border-black/5">
          {project.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wide text-purple">
            {project.tag}
          </span>
          {topKpi && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold truncate max-w-[170px]">
              <TrendingUp size={11} className="shrink-0 text-emerald-600" />
              <span className="truncate">{topKpi}</span>
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-navy group-hover:text-purple transition leading-snug">
            {project.title}
          </h3>
          <p className="mt-1.5 text-sm text-navy/70 line-clamp-2 leading-relaxed">
            {project.summary}
          </p>
        </div>

        {/* Tech Stack Chips */}
        {techStack.length > 0 && (
          <div className="pt-2 mt-auto border-t border-slate-100 flex flex-wrap gap-1.5">
            {techStack.map((tech, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded-md bg-slate-50 text-navy/60 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold"
              >
                <Tag size={9} className="text-purple" /> {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
