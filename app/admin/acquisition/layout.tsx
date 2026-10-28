import AdminLayout from "@/components/admin/AdminLayout";
import { SubNav, type NavCounts } from "@/components/acquisition/SubNav";
import { requireAdminPage } from "@/lib/acquisition/page-auth";
import { getDb } from "@/lib/acquisition/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Client Acquisition", robots: { index: false, follow: false } };

/** Pending counts for the navigation badges; a failure just hides the badges. */
async function navCounts(): Promise<NavCounts> {
  try {
    const db = getDb();
    const [a, r] = await Promise.all([
      db.from("acq_campaigns").select("id", { count: "exact", head: true }).eq("status", "pending_approval"),
      db.from("acq_replies").select("id", { count: "exact", head: true }).eq("human_review_status", "pending"),
    ]);
    return { approvals: a.count ?? 0, inbox: r.count ?? 0 };
  } catch {
    return { approvals: 0, inbox: 0 };
  }
}

export default async function AcquisitionLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  const counts = await navCounts();
  return (
    <AdminLayout>
      <SubNav counts={counts} />
      {children}
    </AdminLayout>
  );
}
