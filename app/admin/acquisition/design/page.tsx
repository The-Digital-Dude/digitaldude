import { getDb } from "@/lib/acquisition/db";
import { loadBrand } from "@/lib/repEmail";
import { PageHeader } from "@/components/acquisition/ui";
import { DesignEditor } from "@/components/acquisition/DesignEditor";

export const dynamic = "force-dynamic";

export default async function EmailDesignPage() {
  const brand = await loadBrand(getDb());
  return (
    <>
      <PageHeader title="Email design" subtitle="The look and feel of rep outreach emails. Reps choose a design per email (Minimal personal for a first email and Plain text for a follow-up by default); the colours, button, logo and industry themes you set here apply to every design." />
      <DesignEditor initial={brand} />
    </>
  );
}
