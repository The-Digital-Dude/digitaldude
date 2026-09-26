import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getService } from "@/lib/content/services";
import { ServiceTemplate } from "@/components/ServiceTemplate";

export const metadata: Metadata = buildMetadata(
  "services/erp-hrm-systems",
  "/services/erp-hrm-systems"
);

export default function Page() {
  const service = getService("erp-hrm-systems")!;
  return <ServiceTemplate service={service} />;
}
