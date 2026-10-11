import { redirect } from "next/navigation";

export default function AdminPseoRedirectPage() {
  redirect("/admin/seo?tab=pseo");
}
