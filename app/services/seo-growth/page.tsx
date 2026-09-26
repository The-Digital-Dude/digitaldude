import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getService } from "@/lib/content/services";
import { ServiceTemplate } from "@/components/ServiceTemplate";

export const metadata: Metadata = buildMetadata("services/seo-growth", "/services/seo-growth");

export default function Page() {
  const service = getService("seo-growth")!;
  return <ServiceTemplate service={service} />;
}
