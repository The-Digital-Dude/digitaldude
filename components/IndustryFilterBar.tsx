"use client";

import { useState } from "react";
import { caseStudies as defaultCaseStudies, type CaseStudy, type Industry } from "@/lib/content/caseStudies";
import { ProjectCard } from "@/components/ProjectCard";
import { cn } from "@/lib/utils";

const baseFilters: Array<Industry | "All"> = [
  "All",
  "Property",
  "Travel",
  "Home services",
  "Logistics",
  "Recruitment",
  "Education",
  "Community",
];

export function IndustryFilterBar({
  projects = defaultCaseStudies,
}: {
  projects?: CaseStudy[];
}) {
  const [active, setActive] = useState<string>("All");

  // Dynamically include any additional industries from custom case studies
  const dynamicIndustries = Array.from(
    new Set(projects.map((p) => p.industry).filter(Boolean))
  );
  
  const allFilters = Array.from(
    new Set([...baseFilters, ...dynamicIndustries])
  );

  const visible =
    active === "All" ? projects : projects.filter((c) => c.industry === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {allFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActive(filter)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              active === filter
                ? "border-purple bg-purple text-white"
                : "border-black/10 bg-white text-navy hover:border-purple"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
