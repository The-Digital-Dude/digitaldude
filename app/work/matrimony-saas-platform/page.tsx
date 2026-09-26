import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";

export const metadata: Metadata = buildMetadata(
  "work/matrimony-saas-platform",
  "/work/matrimony-saas-platform"
);

export default function Page() {
  const project = getCaseStudy("matrimony-saas-platform")!;
  return <CaseStudyTemplate project={project} />;
}
