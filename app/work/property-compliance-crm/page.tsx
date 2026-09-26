import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";

export const metadata: Metadata = buildMetadata(
  "work/property-compliance-crm",
  "/work/property-compliance-crm"
);

export default function Page() {
  const project = getCaseStudy("property-compliance-crm")!;
  return <CaseStudyTemplate project={project} />;
}
