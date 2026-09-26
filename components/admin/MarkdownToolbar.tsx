"use client";

import React from "react";
import {
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
  HelpCircle,
} from "lucide-react";

interface MarkdownToolbarProps {
  onFormat: (prefix: string, suffix?: string, defaultText?: string) => void;
  onOpenImageModal?: () => void;
}

export function MarkdownToolbar({ onFormat, onOpenImageModal }: MarkdownToolbarProps) {
  const tools = [
    {
      label: "Heading 2",
      icon: Heading2,
      action: () => onFormat("## ", "", "Heading 2"),
    },
    {
      label: "Heading 3",
      icon: Heading3,
      action: () => onFormat("### ", "", "Heading 3"),
    },
    {
      label: "Bold",
      icon: Bold,
      action: () => onFormat("**", "**", "bold text"),
    },
    {
      label: "Italic",
      icon: Italic,
      action: () => onFormat("*", "*", "italic text"),
    },
    {
      label: "Bullet List",
      icon: List,
      action: () => onFormat("- ", "", "List item"),
    },
    {
      label: "Numbered List",
      icon: ListOrdered,
      action: () => onFormat("1. ", "", "First item"),
    },
    {
      label: "Quote",
      icon: Quote,
      action: () => onFormat("> ", "", "Quote text"),
    },
    {
      label: "Code Block",
      icon: Code,
      action: () => onFormat("```typescript\n", "\n```", "const hello = 'world';"),
    },
    {
      label: "Link",
      icon: LinkIcon,
      action: () => onFormat("[", "](https://example.com)", "Link text"),
    },
    {
      label: "Divider",
      icon: Minus,
      action: () => onFormat("\n---\n", "", ""),
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-1.5 rounded-t-xl">
      <div className="flex flex-wrap items-center gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.label}
              type="button"
              onClick={tool.action}
              className="flex h-7 w-7 items-center justify-center rounded-md text-navy/70 hover:bg-white hover:text-purple hover:shadow-xs transition"
              title={tool.label}
            >
              <Icon size={14} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {onOpenImageModal && (
          <button
            type="button"
            onClick={onOpenImageModal}
            className="flex items-center gap-1 rounded-md bg-lavender px-2 py-1 text-xs font-semibold text-purple hover:bg-purple hover:text-white transition"
          >
            Upload Media
          </button>
        )}
        <span
          className="hidden sm:inline-flex items-center gap-1 text-[11px] text-navy/40"
          title="Markdown syntax supported. Live preview updates instantaneously."
        >
          <HelpCircle size={12} />
          Markdown Supported
        </span>
      </div>
    </div>
  );
}
