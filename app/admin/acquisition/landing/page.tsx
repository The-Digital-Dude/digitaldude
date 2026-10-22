import { getDb } from "@/lib/acquisition/db";
import { loadLanding } from "@/lib/landing";
import { PageHeader } from "@/components/acquisition/ui";
import { LandingEditor } from "@/components/landing/LandingEditor";

export const dynamic = "force-dynamic";

export default async function LandingEditorPage() {
  const db = getDb();
  const [content, studies] = await Promise.all([
    loadLanding(db),
    db.from("case_studies").select("slug,title,summary,stats,status").neq("status", "Draft").order("created_at", { ascending: false }).limit(50),
  ]);
  const options = ((studies.data ?? []) as { slug: string; title: string; summary: string; stats: string[] | null }[]).map((s) => ({ slug: s.slug, title: s.title, summary: s.summary, stat: s.stats?.[0] ?? null }));
  return (
    <>
      <PageHeader title="Booking page" subtitle="The page the 'Book a 30-minute call' button opens (digitaldude.co.uk/b/...). It greets the visitor by name and company, shows the rep who wrote to them, and adapts to their industry. Edit the default and any industry here." />
      <LandingEditor initial={content} studies={options} />
    </>
  );
}
