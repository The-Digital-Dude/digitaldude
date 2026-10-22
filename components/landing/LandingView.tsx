"use client";

import { useRef, type ReactNode } from "react";
import { fillTokens, type LandingPerson, type LandingSection } from "@/lib/landing";

export interface ProofCard {
  title: string;
  metric?: string;
  detail?: string;
  href?: string;
}

export interface RepCard {
  name: string;
  role?: string | null;
  photoUrl?: string | null;
}

/**
 * The booking page, presentational only. Used by the live page (/b/<code>) and by the admin editor's live preview, so what the admin
 * sees while editing is what a prospect sees. All text is plain text (React escapes it): no editable field can inject markup.
 */
export function LandingView({
  section,
  person,
  rep,
  proof,
  form,
  onCtaClick,
}: {
  section: LandingSection;
  person: LandingPerson;
  rep: RepCard | null;
  proof: ProofCard[];
  /** The booking form (kept outside so the preview can show a placeholder). */
  form: ReactNode;
  onCtaClick?: () => void;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  const p = { ...person, repName: person.repName ?? rep?.name };
  const initials = (rep?.name ?? "?").split(/\s+/).map((w) => w[0] ?? "").join("").slice(0, 2).toUpperCase();
  const accent = section.accent;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white">
      <section className="mx-auto max-w-4xl px-6 pb-10 pt-28 sm:pt-36">
        {rep && (
          <div className="mb-6 flex items-center gap-3">
            {rep.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={rep.photoUrl} alt={rep.name} width={56} height={56} className="h-14 w-14 rounded-full border border-white/10 object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: accent }}>{initials}</span>
            )}
            <div>
              <p className="text-sm font-bold">{rep.name}</p>
              {rep.role && <p className="text-xs text-slate-400">{rep.role} · The Digital Dude</p>}
            </div>
          </div>
        )}
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">{fillTokens(section.headline, p)}</h1>
        {section.subheadline && <p className="mt-4 max-w-2xl text-base text-slate-300 sm:text-lg">{fillTokens(section.subheadline, p)}</p>}
        <button
          type="button"
          onClick={() => {
            onCtaClick?.();
            formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="mt-8 rounded-xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
          style={{ backgroundColor: accent }}
        >
          {section.ctaLabel} &rarr;
        </button>
        {section.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={section.imageUrl} alt="" className="mt-10 max-h-72 w-full rounded-2xl border border-white/10 object-cover" />
        )}
      </section>

      {(section.painPoints.length > 0 || section.builds.length > 0) && (
        <section className="mx-auto grid max-w-4xl gap-6 px-6 pb-10 sm:grid-cols-2">
          {section.painPoints.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-base font-bold">{section.painTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {section.painPoints.map((x, i) => (<li key={i} className="flex gap-2"><span style={{ color: accent }}>&bull;</span>{fillTokens(x, p)}</li>))}
              </ul>
            </div>
          )}
          {section.builds.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-base font-bold">{section.buildTitle}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {section.builds.map((x, i) => (<li key={i} className="flex gap-2"><span style={{ color: accent }}>&check;</span>{fillTokens(x, p)}</li>))}
              </ul>
            </div>
          )}
        </section>
      )}

      {proof.length > 0 && (
        <section className="mx-auto max-w-4xl px-6 pb-10">
          <h2 className="mb-4 text-base font-bold">{section.proofTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {proof.map((c, i) => {
              const inner = (
                <>
                  {c.metric && <p className="text-2xl font-extrabold" style={{ color: accent }}>{c.metric}</p>}
                  <p className="mt-1 text-sm font-bold">{c.title}</p>
                  {c.detail && <p className="mt-1 text-xs text-slate-400">{c.detail}</p>}
                </>
              );
              return c.href ? (
                <a key={i} href={c.href} className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.06]">{inner}</a>
              ) : (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">{inner}</div>
              );
            })}
          </div>
        </section>
      )}

      <section ref={formRef} className="mx-auto max-w-4xl scroll-mt-24 px-6 pb-24">
        <h2 className="mb-4 text-xl font-extrabold">{section.formTitle}</h2>
        {form}
      </section>
    </div>
  );
}
