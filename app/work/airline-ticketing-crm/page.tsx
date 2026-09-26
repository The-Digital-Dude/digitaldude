import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { getCaseStudy } from "@/lib/content/caseStudies";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";

export const metadata: Metadata = buildMetadata(
  "work/airline-ticketing-crm",
  "/work/airline-ticketing-crm"
);

export default function Page() {
  const project = getCaseStudy("airline-ticketing-crm")!;
  return <CaseStudyTemplate project={project} />;
}
