"use client";

import React from "react";
import Link from "next/link";

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2] && match[3]) {
      const linkText = match[2];
      const linkUrl = match[3];
      const isInternal = linkUrl.startsWith("/") || linkUrl.includes("digitaldude.co.uk");
      if (isInternal) {
        parts.push(
          <Link
            key={`l-${keyIndex++}`}
            href={linkUrl}
            className="font-semibold text-purple underline decoration-purple/40 underline-offset-2 hover:decoration-purple"
          >
            {linkText}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={`a-${keyIndex++}`}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-purple underline decoration-purple/40 underline-offset-2 hover:decoration-purple"
          >
            {linkText}
          </a>
        );
      }
    } else if (match[4]) {
      parts.push(
        <strong key={`b-${keyIndex++}`} className="font-bold text-navy">
          {match[4]}
        </strong>
      );
    } else if (match[5]) {
      parts.push(
        <em key={`i-${keyIndex++}`} className="italic">
          {match[5]}
        </em>
      );
    } else if (match[6]) {
      parts.push(
        <code
          key={`c-${keyIndex++}`}
          className="rounded-md bg-purple/10 px-1.5 py-0.5 font-mono text-xs font-semibold text-purple"
        >
          {match[6]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;

  const normalized = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const rawSections = normalized.split(/\n\n+/);
  const elements: React.ReactNode[] = [];

  rawSections.forEach((section, sIdx) => {
    const trimmed = section.trim();
    if (!trimmed) return;

    if (trimmed.startsWith("```")) {
      const codeLines = trimmed.split("\n");
      const lang = codeLines[0].replace("```", "").trim();
      const code = codeLines
        .slice(1, codeLines[codeLines.length - 1].startsWith("```") ? -1 : undefined)
        .join("\n");
      elements.push(
        <div
          key={`code-${sIdx}`}
          className="my-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-md"
        >
          {lang && (
            <div className="border-b border-slate-800 bg-slate-950 px-4 py-1.5 font-mono text-xs uppercase text-slate-400">
              {lang}
            </div>
          )}
          <pre className="overflow-x-auto p-4 font-mono text-xs sm:text-sm text-emerald-300">
            <code>{code}</code>
          </pre>
        </div>
      );
      return;
    }

    if (trimmed === "---" || trimmed === "***") {
      elements.push(<hr key={`hr-${sIdx}`} className="my-8 border-t border-black/10" />);
      return;
    }

    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      elements.push(
        <figure
          key={`img-${sIdx}`}
          className="my-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgMatch[2]} alt={imgMatch[1] || "Illustration"} className="w-full object-cover" />
          {imgMatch[1] && (
            <figcaption className="border-t border-slate-200 bg-white p-3 text-center text-xs italic text-navy/60">
              {imgMatch[1]}
            </figcaption>
          )}
        </figure>
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      const quoteText = trimmed.replace(/^>\s*/gm, "");
      elements.push(
        <blockquote
          key={`quote-${sIdx}`}
          className="my-6 rounded-r-2xl border-l-4 border-purple bg-lavender/40 px-5 py-4 text-base sm:text-lg italic leading-relaxed text-navy/85"
        >
          {parseInlineMarkdown(quoteText)}
        </blockquote>
      );
      return;
    }

    const lines = trimmed.split("\n");
    let currentListType: "ul" | "ol" | null = null;
    let listItems: string[] = [];

    const flushList = () => {
      if (currentListType && listItems.length > 0) {
        if (currentListType === "ol") {
          elements.push(
            <ol
              key={`ol-${sIdx}-${elements.length}`}
              className="my-5 list-decimal space-y-2.5 pl-6 text-base sm:text-lg leading-relaxed text-navy/80"
            >
              {listItems.map((item, iIdx) => (
                <li key={iIdx} className="pl-1">
                  {parseInlineMarkdown(item)}
                </li>
              ))}
            </ol>
          );
        } else {
          elements.push(
            <ul
              key={`ul-${sIdx}-${elements.length}`}
              className="my-5 list-disc space-y-2.5 pl-6 text-base sm:text-lg leading-relaxed text-navy/80"
            >
              {listItems.map((item, iIdx) => (
                <li key={iIdx} className="pl-1">
                  {parseInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }
        currentListType = null;
        listItems = [];
      }
    };

    lines.forEach((line, lIdx) => {
      const lTrim = line.trim();
      if (!lTrim) return;

      if (lTrim.startsWith("## ")) {
        flushList();
        const rawText = lTrim.replace(/^##\s+/, "").replace(/\*\*|\*|`/g, "");
        const headingId = rawText
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        elements.push(
          <h2
            key={`h2-${sIdx}-${lIdx}`}
            id={headingId}
            className="scroll-mt-24 border-b border-black/5 pb-3 pt-8 text-2xl font-extrabold tracking-tight text-navy sm:text-3xl"
          >
            {parseInlineMarkdown(lTrim.replace(/^##\s+/, ""))}
          </h2>
        );
        return;
      }

      if (lTrim.startsWith("### ")) {
        flushList();
        const rawText = lTrim.replace(/^###\s+/, "").replace(/\*\*|\*|`/g, "");
        const headingId = rawText
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        elements.push(
          <h3
            key={`h3-${sIdx}-${lIdx}`}
            id={headingId}
            className="scroll-mt-24 pb-2 pt-6 text-xl font-bold tracking-tight text-navy sm:text-2xl"
          >
            {parseInlineMarkdown(lTrim.replace(/^###\s+/, ""))}
          </h3>
        );
        return;
      }

      if (lTrim.startsWith("#### ")) {
        flushList();
        const rawText = lTrim.replace(/^####\s+/, "").replace(/\*\*|\*|`/g, "");
        const headingId = rawText
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, "")
          .replace(/[\s_-]+/g, "-")
          .replace(/^-+|-+$/g, "");

        elements.push(
          <h4
            key={`h4-${sIdx}-${lIdx}`}
            id={headingId}
            className="scroll-mt-24 pb-1 pt-4 text-lg font-bold text-navy"
          >
            {parseInlineMarkdown(lTrim.replace(/^####\s+/, ""))}
          </h4>
        );
        return;
      }

      const olMatch = lTrim.match(/^\d+\.\s+(.+)$/);
      if (olMatch) {
        if (currentListType !== "ol") {
          flushList();
          currentListType = "ol";
        }
        listItems.push(olMatch[1]);
        return;
      }

      const ulMatch = lTrim.match(/^[-*]\s+(.+)$/);
      if (ulMatch) {
        if (currentListType !== "ul") {
          flushList();
          currentListType = "ul";
        }
        listItems.push(ulMatch[1]);
        return;
      }

      flushList();
      elements.push(
        <p
          key={`p-${sIdx}-${lIdx}`}
          className="my-4 text-base sm:text-lg font-normal leading-relaxed text-navy/85"
        >
          {parseInlineMarkdown(lTrim)}
        </p>
      );
    });

    flushList();
  });

  return <div className="space-y-2">{elements}</div>;
}

export default MarkdownRenderer;
