import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";

export const metadata: Metadata = buildMetadata("work/recruitment-crm", "/work/recruitment-crm");

export default function Page() {
  const project = getCaseStudy("recruitment-crm")!;
  return <CaseStudyTemplate project={project} />;
}
