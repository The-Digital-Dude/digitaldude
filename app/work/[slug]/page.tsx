import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCaseStudy, getCaseStudies } from "@/lib/caseStudiesServer";
import { CaseStudyTemplate } from "@/components/CaseStudyTemplate";
import { seo, type SeoEntry } from "@/lib/content/seo";
import { SITE_URL } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getCaseStudy(slug);
  if (!project) return {};

  // Use the hand-tuned SEO copy from the audit when it exists for this slug;
  // fall back to a generated title/description for case studies added later
  // via the admin panel that don't have a curated entry yet.
  const seoEntry = (seo as Record<string, SeoEntry>)[`work/${slug}`];
  const title = seoEntry?.title || `${project.title} Case Study | The Digital Dude`;
  const description = seoEntry?.description || project.pageSummary || project.summary;
  const canonical = `${SITE_URL}/work/${project.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "The Digital Dude",
      type: "article",
      images: [
        {
          url: project.image.startsWith("http") ? project.image : `${SITE_URL}${project.image}`,
          alt: project.imageAlt || project.title,
        },
      ],
    },
  };
}

export async function generateStaticParams() {
  const allProjects = await getCaseStudies();
  return allProjects.map((p) => ({ slug: p.slug }));
}

export default async function DynamicWorkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getCaseStudy(slug);

  if (!project) {
    notFound();
  }

  return <CaseStudyTemplate project={project} />;
}
