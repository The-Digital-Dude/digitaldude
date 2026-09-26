import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";

export const metadata: Metadata = buildMetadata(
  "work/ai-tutoring-platform",
  "/work/ai-tutoring-platform"
);

export default function Page() {
  const project = getCaseStudy("ai-tutoring-platform")!;
  return <CaseStudyTemplate project={project} />;
}
