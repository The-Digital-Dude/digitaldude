import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getIndustry } from "@/lib/content/industries";
import { IndustryTemplate } from "@/components/IndustryTemplate";

export const metadata: Metadata = buildMetadata("industries/community", "/industries/community");

export default function Page() {
  const industry = getIndustry("community")!;
  return <IndustryTemplate industry={industry} />;
}
