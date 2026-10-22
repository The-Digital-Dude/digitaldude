"use client";

import { useRef } from "react";
import { ContactForm } from "@/components/ContactForm";
import { LandingView, type ProofCard, type RepCard } from "./LandingView";
import type { LandingPerson, LandingSection } from "@/lib/landing";

/** The live booking page: the shared view, the real booking form (pre-filled), and click tracking tied to the private link. */
export function LandingClient({
  code,
  section,
  person,
  rep,
  proof,
  refCode,
  prefill,
}: {
  code: string | null;
  section: LandingSection;
  person: LandingPerson;
  rep: RepCard | null;
  proof: ProofCard[];
  refCode: string | null;
  prefill: { name?: string; email?: string; company?: string };
}) {
  const clicked = useRef(false);
  return (
    <LandingView
      section={section}
      person={person}
      rep={rep}
      proof={proof}
      onCtaClick={() => {
        if (clicked.current || !code) return;
        clicked.current = true;
        void fetch(`/api/b/${code}/click`, { method: "POST" }).catch(() => {});
      }}
      form={<ContactForm refCode={refCode ?? undefined} linkCode={code ?? undefined} prefill={prefill} />}
    />
  );
}
