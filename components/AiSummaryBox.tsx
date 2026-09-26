"use client";

import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface AiSummaryBoxProps {
  summary: string;
  keyPoints?: string[];
}

export function AiSummaryBox({ summary, keyPoints }: AiSummaryBoxProps) {
  if (!summary && (!keyPoints || keyPoints.length === 0)) return null;

  return (
    <div className="my-8 rounded-3xl border border-purple/20 bg-gradient-to-br from-lavender/60 via-white to-lavender/30 p-6 sm:p-8 shadow-xs">
      <div className="flex items-center gap-2 text-purple font-bold text-xs uppercase tracking-wider mb-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple text-white shadow-xs">
          <Sparkles size={13} />
        </span>
        <span>AI Overview &amp; Key Takeaways</span>
      </div>

      {summary && (
        <p className="text-base sm:text-lg font-medium text-navy leading-relaxed mb-4">
          {summary}
        </p>
      )}

      {keyPoints && keyPoints.length > 0 && (
        <ul className="space-y-2.5 pt-2 border-t border-purple/15">
          {keyPoints.map((point, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm sm:text-base text-navy/80 leading-snug">
              <CheckCircle2 size={16} className="text-purple flex-shrink-0 mt-1" />
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AiSummaryBox;
