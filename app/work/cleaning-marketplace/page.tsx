import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";

export const metadata: Metadata = buildMetadata(
  "work/cleaning-marketplace",
  "/work/cleaning-marketplace"
);

export default function Page() {
  const project = getCaseStudy("cleaning-marketplace")!;
  return <CaseStudyTemplate project={project} />;
}
