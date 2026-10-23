"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  variant?: "light" | "dark";
}

function getPageWindow(page: number, totalPages: number): (number | "...")[] {
  const window: (number | "...")[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) {
    window.push(1);
    if (start > 2) window.push("...");
  }
  for (let p = start; p <= end; p++) window.push(p);
  if (end < totalPages) {
    if (end < totalPages - 1) window.push("...");
    window.push(totalPages);
  }
  return window;
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
  variant = "light",
}: PaginationProps) {
  const isDark = variant === "dark";
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  if (totalCount === 0) return null;

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between transition ${
        isDark ? "border-t border-white/[0.08] bg-[#0F1626]" : "border-t border-slate-100 bg-white"
      }`}
    >
      <div className={`flex items-center gap-3 text-xs ${isDark ? "text-slate-400" : "text-navy/60"}`}>
        <span>
          Showing <strong className={isDark ? "text-white" : "text-navy"}>{from}</strong>–
          <strong className={isDark ? "text-white" : "text-navy"}>{to}</strong> of{" "}
          <strong className={isDark ? "text-white" : "text-navy"}>{totalCount}</strong>
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className={`rounded-lg px-2 py-1 text-xs font-medium outline-none focus:border-purple ${
            isDark
              ? "border border-white/10 bg-[#131B2E] text-slate-200"
              : "border border-slate-200 bg-slate-50 text-navy"
          }`}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size} / page
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={`rounded-lg p-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition ${
            isDark
              ? "border border-white/10 bg-[#131B2E] text-slate-300 hover:bg-white/10"
              : "border border-slate-200 bg-white text-navy/70 hover:bg-slate-50"
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>

        {getPageWindow(page, totalPages).map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className={`px-1.5 text-xs ${isDark ? "text-slate-500" : "text-navy/40"}`}>
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                p === page
                  ? "bg-purple text-white shadow-xs"
                  : isDark
                  ? "border border-white/10 bg-[#131B2E] text-slate-300 hover:bg-white/10"
                  : "border border-slate-200 bg-white text-navy/70 hover:bg-slate-50"
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className={`rounded-lg p-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition ${
            isDark
              ? "border border-white/10 bg-[#131B2E] text-slate-300 hover:bg-white/10"
              : "border border-slate-200 bg-white text-navy/70 hover:bg-slate-50"
          }`}
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
