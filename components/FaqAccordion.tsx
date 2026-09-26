"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/content/services";
import { cn } from "@/lib/utils";

export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-tint rounded-2xl border border-tint">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        const panelId = `faq-panel-${index}`;
        return (
          <div key={faq.q}>
            <button
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span className="font-semibold text-navy">{faq.q}</span>
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={cn("shrink-0 text-purple transition", isOpen && "rotate-180")}
              />
            </button>
            {isOpen && (
              <p id={panelId} className="px-5 pb-4 text-sm text-navy/70">
                {faq.a}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

