import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";
import { services } from "@/lib/content/services";
import { industries } from "@/lib/content/industries";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getCaseStudies } from "@/lib/caseStudiesServer";

import { getAllPseoSlugs } from "@/lib/pseo/engine";

export const revalidate = 3600; // Cache and revalidate sitemap every hour for instant edge delivery

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use a stable content release date for core static architecture rather than current timestamp
  const releaseDate = new Date("2026-04-01T00:00:00Z");

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: releaseDate },
    { url: `${SITE_URL}/work`, lastModified: releaseDate },
    { url: `${SITE_URL}/services`, lastModified: releaseDate },
    { url: `${SITE_URL}/solutions`, lastModified: releaseDate },
    { url: `${SITE_URL}/locations`, lastModified: releaseDate },
    { url: `${SITE_URL}/compare`, lastModified: releaseDate },
    { url: `${SITE_URL}/how-we-work`, lastModified: releaseDate },
    { url: `${SITE_URL}/blog`, lastModified: releaseDate },
    { url: `${SITE_URL}/about`, lastModified: releaseDate },
    { url: `${SITE_URL}/contact`, lastModified: releaseDate },
    { url: `${SITE_URL}/careers`, lastModified: releaseDate },
    { url: `${SITE_URL}/privacy`, lastModified: releaseDate },
    { url: `${SITE_URL}/terms`, lastModified: releaseDate },
  ];

  const allCaseStudies = await getCaseStudies();
  const caseStudyPages: MetadataRoute.Sitemap = allCaseStudies.map((c) => ({
    url: `${SITE_URL}/work/${c.slug}`,
    lastModified: releaseDate,
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: releaseDate,
  }));

  const industryPages: MetadataRoute.Sitemap = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: releaseDate,
  }));

  let jobPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("job_postings")
        .select("slug, updated_at")
        .eq("status", "open");

      jobPages = (data || []).map((job) => ({
        url: `${SITE_URL}/careers/${job.slug}`,
        lastModified: job.updated_at ? new Date(job.updated_at) : releaseDate,
      }));
    }
  } catch {}

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("posts")
        .select("slug, updated_at, published_at")
        .eq("status", "published");

      if (data && data.length > 0) {
        blogPages = data.map((post) => ({
          url: `${SITE_URL}/blog/${post.slug}`,
          lastModified: new Date(post.updated_at || post.published_at || releaseDate),
        }));
      }
    }
  } catch {}

  let pseoPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllPseoSlugs();
    pseoPages = slugs.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: releaseDate,
    }));
  } catch {}

  return [
    ...staticPages,
    ...caseStudyPages,
    ...servicePages,
    ...industryPages,
    ...jobPages,
    ...blogPages,
    ...pseoPages,
  ];
}
