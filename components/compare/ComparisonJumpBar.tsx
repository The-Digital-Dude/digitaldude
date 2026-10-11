"use client";

import React, { useEffect, useState } from "react";
import { Scale, Table, Calculator, HelpCircle, Calendar, ArrowRight } from "lucide-react";

interface JumpLink {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const defaultLinks: JumpLink[] = [
  { id: "overview", label: "Overview", icon: Scale },
  { id: "matrix", label: "Matrix", icon: Table },
  { id: "tco-simulator", label: "TCO Simulator", icon: Calculator },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "booking", label: "Book Discovery", icon: Calendar },
];

export function ComparisonJumpBar({ links = defaultLinks }: { links?: JumpLink[] }) {
  const [activeId, setActiveId] = useState<string>(links[0]?.id || "");

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // offset for fixed header
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveId(id);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120;
      for (const link of links) {
        const el = document.getElementById(link.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(link.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [links]);

  return (
    <div className="sticky top-[57px] z-30 -mx-4 px-4 py-2.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs mb-8 transition-all">
      <div className="container mx-auto max-w-4xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activeId === link.id;

            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => scrollToSection(e, link.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-purple text-white shadow-xs"
                    : "text-slate-600 hover:text-navy hover:bg-slate-100"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>

        <div className="hidden sm:block shrink-0">
          <a
            href="#booking"
            onClick={(e) => scrollToSection(e, "booking")}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-primary hover:text-accent-primary/80 transition"
          >
            <span>Review Needs</span>
            <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
