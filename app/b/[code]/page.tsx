import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getBookLink, isBot, isExpired, recordView, CODE_RE, type BookLink } from "@/lib/bookLinks";
import { defaultLanding, loadLanding, sectionFor } from "@/lib/landing";
import { LandingClient } from "@/components/landing/LandingClient";
import type { ProofCard } from "@/components/landing/LandingView";

export const dynamic = "force-dynamic";

// A personal link: never indexed, and no referrer leaks the code.
export const metadata: Metadata = {
  title: "Book a 30-minute call | The Digital Dude",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function BookLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const db = getSupabaseServerClient();

  // An unknown, malformed or expired link still shows the page, just without anything personal.
  let link: BookLink | null = null;
  if (db && CODE_RE.test(code)) {
    link = await getBookLink(db, code).catch(() => null);
    if (link && isExpired(link)) link = null;
  }

  if (db && link && !isBot((await headers()).get("user-agent"))) await recordView(db, link.code).catch(() => {});

  const content = db ? await loadLanding(db) : null;
  const section = sectionFor(content ?? defaultLanding(), link?.industry);

  let rep: { name: string; role: string | null; photoUrl: string | null; refCode: string | null } | null = null;
  if (db && link?.employee_id) {
    const { data: e } = await db.from("employees").select("full_name,outreach_display_name,role_title,photo_url,referral_code,status").eq("id", link.employee_id).maybeSingle();
    if (e && e.status !== "offboarded") {
      rep = {
        name: String(e.outreach_display_name || e.full_name || "").split("|")[0].trim() || "The Digital Dude team",
        role: (e.role_title as string | null) ?? null,
        photoUrl: (e.photo_url as string | null) ?? null,
        refCode: (e.referral_code as string | null) ?? null,
      };
    }
  }

  // Proof: only items the admin approved. Case studies are read from the existing case studies, never made up.
  const proof: ProofCard[] = [];
  const slugs = section.proof.filter((p) => p.type === "case_study").map((p) => (p as { slug: string }).slug);
  const studies = new Map<string, { slug: string; title: string; summary: string; stats: string[] | null }>();
  if (db && slugs.length) {
    const { data } = await db.from("case_studies").select("slug,title,summary,stats,status").in("slug", slugs);
    for (const s of (data ?? []) as { slug: string; title: string; summary: string; stats: string[] | null; status: string }[]) if (s.status !== "Draft") studies.set(s.slug, s);
  }
  for (const p of section.proof) {
    if (p.type === "custom") proof.push({ title: p.title, metric: p.metric || undefined, detail: p.detail || undefined });
    else {
      const s = studies.get(p.slug);
      if (s) proof.push({ title: s.title, metric: s.stats?.[0] || undefined, detail: s.summary, href: `/work/${s.slug}` });
    }
  }

  const firstName = (link?.recipient_name ?? "").trim().split(/\s+/)[0] || null;
  return (
    <LandingClient
      code={link?.code ?? null}
      section={section}
      person={{ firstName, company: link?.company_name, repName: rep?.name }}
      rep={rep ? { name: rep.name, role: rep.role, photoUrl: rep.photoUrl } : null}
      proof={proof}
      refCode={rep?.refCode ?? null}
      prefill={{ name: link?.recipient_name ?? undefined, email: link?.recipient_email ?? undefined, company: link?.company_name ?? undefined }}
    />
  );
}
