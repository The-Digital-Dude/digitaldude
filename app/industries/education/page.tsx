import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getIndustry } from "@/lib/content/industries";
import { IndustryTemplate } from "@/components/IndustryTemplate";

export const metadata: Metadata = buildMetadata("industries/education", "/industries/education");

export default function Page() {
  const industry = getIndustry("education")!;
  return <IndustryTemplate industry={industry} />;
}
