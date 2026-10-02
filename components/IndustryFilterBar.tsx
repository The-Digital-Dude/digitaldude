"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Tag, X, Layers, Briefcase } from "lucide-react";
import { caseStudies as defaultCaseStudies, type CaseStudy } from "@/lib/content/caseStudies";
import { ProjectCard } from "@/components/ProjectCard";
import { cn } from "@/lib/utils";
import { trackSearch } from "@/lib/metaPixel";

export function IndustryFilterBar({
  projects = defaultCaseStudies,
}: {
  projects?: CaseStudy[];
}) {
  const [activeIndustry, setActiveIndustry] = useState<string>("All");
  const [activeTechFilter, setActiveTechFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Debounced Meta Pixel Search standard event
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) return;

    const timer = setTimeout(() => {
      trackSearch({
        search_string: trimmed,
        content_category: activeIndustry !== "All" ? activeIndustry : "Case Studies & Work",
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [searchQuery, activeIndustry]);

  // Extract all unique industries
  const allIndustries = useMemo(() => {
    const raw = Array.from(new Set(projects.map((p) => p.industry).filter(Boolean)));
    return ["All", ...raw];
  }, [projects]);

  // Extract all unique tech stack tags
  const allTechStacks = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.builtWith) {
        p.builtWith.split(",").forEach((t) => {
          const clean = t.trim();
          if (clean) set.add(clean);
        });
      }
    });
    return ["All", ...Array.from(set)];
  }, [projects]);

  // Count projects per industry
  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: projects.length };
    projects.forEach((p) => {
      if (p.industry) {
        counts[p.industry] = (counts[p.industry] || 0) + 1;
      }
    });
    return counts;
  }, [projects]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Industry filter
      if (activeIndustry !== "All" && p.industry !== activeIndustry) {
        return false;
      }

      // Tech stack filter
      if (activeTechFilter !== "All") {
        if (!p.builtWith || !p.builtWith.toLowerCase().includes(activeTechFilter.toLowerCase())) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSummary = p.summary?.toLowerCase().includes(q);
        const matchChallenge = p.challenge?.toLowerCase().includes(q);
        const matchTech = p.builtWith?.toLowerCase().includes(q);
        const matchTag = p.tag?.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchChallenge && !matchTech && !matchTag) {
          return false;
        }
      }

      return true;
    });
  }, [projects, activeIndustry, activeTechFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Search Bar & Tech Filter Chips */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy/40" />
          <input
            type="text"
            placeholder="Search systems by keyword, challenge, tech stack…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white pl-10 pr-9 py-2.5 text-sm text-navy outline-none focus:border-purple focus:ring-2 focus:ring-purple/10 transition shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Tech Stack Dropdown / Selector */}
        {allTechStacks.length > 1 && (
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-navy/50 flex items-center gap-1">
              <Tag size={12} className="text-purple" /> Stack:
            </span>
            <select
              value={activeTechFilter}
              onChange={(e) => setActiveTechFilter(e.target.value)}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-navy outline-none focus:border-purple shadow-2xs cursor-pointer"
            >
              {allTechStacks.map((tech) => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Industry Pills with Dynamic Counters */}
      <div className="flex flex-wrap gap-2 pt-1">
        {allIndustries.map((filter) => {
          const count = industryCounts[filter] || 0;
          const isActive = activeIndustry === filter;

          return (
            <button
              key={filter}
              onClick={() => setActiveIndustry(filter)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                isActive
                  ? "border-purple bg-purple text-white shadow-xs"
                  : "border-black/10 bg-white text-navy/80 hover:border-purple/40 hover:text-purple"
              )}
            >
              <span>{filter}</span>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                  isActive ? "bg-white/20 text-white" : "bg-slate-100 text-navy/60"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Indicators */}
      {(searchQuery || activeIndustry !== "All" || activeTechFilter !== "All") && (
        <div className="flex items-center gap-2 text-xs text-navy/60">
          <span>Showing {filteredProjects.length} of {projects.length} case studies</span>
          <button
            onClick={() => {
              setActiveIndustry("All");
              setActiveTechFilter("All");
              setSearchQuery("");
            }}
            className="text-purple font-bold hover:underline ml-2"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white/50 p-12 text-center space-y-3">
          <Briefcase size={32} className="mx-auto text-slate-400" />
          <h3 className="text-base font-bold text-navy">No systems matched your filter</h3>
          <p className="text-xs text-navy/60 max-w-sm mx-auto">
            Try resetting your search query or selecting a different industry.
          </p>
          <button
            onClick={() => {
              setActiveIndustry("All");
              setActiveTechFilter("All");
              setSearchQuery("");
            }}
            className="rounded-full bg-purple px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-purple/90"
          >
            Show all systems
          </button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
