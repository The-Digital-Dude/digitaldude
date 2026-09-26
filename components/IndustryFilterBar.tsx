"use client";

import { useState } from "react";
import { caseStudies, type Industry } from "@/lib/content/caseStudies";
import { ProjectCard } from "@/components/ProjectCard";
import { cn } from "@/lib/utils";

const filters: Array<Industry | "All"> = [
  "All",
  "Property",
  "Travel",
  "Home services",
  "Logistics",
  "Recruitment",
  "Education",
  "Community",
];

export function IndustryFilterBar() {
  const [active, setActive] = useState<(typeof filters)[number]>("All");

  const visible =
    active === "All" ? caseStudies : caseStudies.filter((c) => c.industry === active);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
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
