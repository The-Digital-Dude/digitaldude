import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getService } from "@/lib/content/services";
import { ServiceTemplate } from "@/components/ServiceTemplate";

export const metadata: Metadata = buildMetadata(
  "services/website-development",
  "/services/website-development"
);

export default function Page() {
  const service = getService("website-development")!;
  return <ServiceTemplate service={service} />;
}
