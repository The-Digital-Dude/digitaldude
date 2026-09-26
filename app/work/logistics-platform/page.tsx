import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";

export const metadata: Metadata = buildMetadata(
  "work/logistics-platform",
  "/work/logistics-platform"
);

export default function Page() {
  const project = getCaseStudy("logistics-platform")!;
  return <CaseStudyTemplate project={project} />;
}
