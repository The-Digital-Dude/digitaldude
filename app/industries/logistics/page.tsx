import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getIndustry } from "@/lib/content/industries";
import { IndustryTemplate } from "@/components/IndustryTemplate";

export const metadata: Metadata = buildMetadata("industries/logistics", "/industries/logistics");

export default function Page() {
  const industry = getIndustry("logistics")!;
  return <IndustryTemplate industry={industry} />;
}
