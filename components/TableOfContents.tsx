"use client";

import React, { useState, useEffect } from "react";
import { ListOrdered, ChevronDown, ChevronRight, Hash } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extractHeadings(content: string): TocItem[] {
  if (!content) return [];
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const items: TocItem[] = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      const text = trimmed.replace(/^##\s+/, "").replace(/\*\*|\*|`/g, "");
      items.push({ id: slugifyHeading(text), text, level: 2 });
    } else if (trimmed.startsWith("### ")) {
      const text = trimmed.replace(/^###\s+/, "").replace(/\*\*|\*|`/g, "");
      items.push({ id: slugifyHeading(text), text, level: 3 });
    }
  });

  return items;
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const extracted = extractHeadings(content);
    setHeadings(extracted);
  }, [content]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0% -60% 0%" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 2) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs mb-8 transition-all"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between text-left font-bold text-navy"
      >
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-purple font-bold">
          <ListOrdered size={16} />
          <span>Table of Contents</span>
        </div>
        <span className="p-1 rounded-lg hover:bg-slate-100 text-navy/50">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      </button>

      {isExpanded && (
        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
          {headings.map((item) => (
            <li
              key={item.id}
              className={item.level === 3 ? "pl-4" : ""}
            >
              <a
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const target = document.getElementById(item.id);
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                    window.history.pushState(null, "", `#${item.id}`);
                  }
                }}
                className={`group flex items-center gap-1.5 py-1 transition-colors ${
                  activeId === item.id
                    ? "font-semibold text-purple"
                    : "text-navy/70 hover:text-navy"
                }`}
              >
                <Hash
                  size={12}
                  className={`opacity-0 transition-opacity group-hover:opacity-100 ${
                    activeId === item.id ? "opacity-100 text-purple" : "text-navy/40"
                  }`}
                />
                <span className="line-clamp-1">{item.text}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}

export default TableOfContents;
