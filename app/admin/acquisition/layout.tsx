import AdminLayout from "@/components/admin/AdminLayout";
import { SubNav } from "@/components/acquisition/SubNav";
import { requireAdminPage } from "@/lib/acquisition/page-auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Client Acquisition", robots: { index: false, follow: false } };

export default async function AcquisitionLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return (
    <AdminLayout>
      <SubNav />
      {children}
    </AdminLayout>
  );
}
