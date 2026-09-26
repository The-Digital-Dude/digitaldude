import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getIndustry } from "@/lib/content/industries";
import { IndustryTemplate } from "@/components/IndustryTemplate";

export const metadata: Metadata = buildMetadata(
  "industries/home-services",
  "/industries/home-services"
);

export default function Page() {
  const industry = getIndustry("home-services")!;
  return <IndustryTemplate industry={industry} />;
}
