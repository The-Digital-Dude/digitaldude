import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";
import { services } from "@/lib/content/services";
import { industries } from "@/lib/content/industries";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getCaseStudies } from "@/lib/caseStudiesServer";

import { getIndexablePseoSlugs } from "@/lib/pseo/engine";

import { getAllStaticBlogArticles } from "@/lib/content/blogArticles";

export const revalidate = 3600; // Cache and revalidate sitemap every hour for instant edge delivery

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseReleaseDate = new Date("2026-04-01T00:00:00Z");
  const recentAuditUpdate = new Date("2026-10-10T00:00:00Z");

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: recentAuditUpdate },
    { url: `${SITE_URL}/work`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/services`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/solutions`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/locations`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/compare`, lastModified: recentAuditUpdate },
    { url: `${SITE_URL}/how-we-work`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/blog`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/about`, lastModified: recentAuditUpdate },
    { url: `${SITE_URL}/contact`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/careers`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/privacy`, lastModified: baseReleaseDate },
    { url: `${SITE_URL}/terms`, lastModified: baseReleaseDate },
  ];

  const allCaseStudies = await getCaseStudies();
  const caseStudyPages: MetadataRoute.Sitemap = allCaseStudies.map((c) => ({
    url: `${SITE_URL}/work/${c.slug}`,
    lastModified: recentAuditUpdate,
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: recentAuditUpdate,
  }));

  const industryPages: MetadataRoute.Sitemap = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: baseReleaseDate,
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
        lastModified: job.updated_at ? new Date(job.updated_at) : baseReleaseDate,
      }));
    }
  } catch {}

  const blogUrlMap = new Map<string, { url: string; lastModified: Date }>();
  for (const staticPost of getAllStaticBlogArticles()) {
    blogUrlMap.set(staticPost.slug, {
      url: `${SITE_URL}/blog/${staticPost.slug}`,
      lastModified: new Date(staticPost.updated_at || staticPost.published_at || recentAuditUpdate),
    });
  }

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("posts")
        .select("slug, updated_at, published_at")
        .eq("status", "published");

      if (data && data.length > 0) {
        for (const post of data) {
          blogUrlMap.set(post.slug, {
            url: `${SITE_URL}/blog/${post.slug}`,
            lastModified: new Date(post.updated_at || post.published_at || baseReleaseDate),
          });
        }
      }
    }
  } catch {}

  const blogPages: MetadataRoute.Sitemap = Array.from(blogUrlMap.values());
  // The blog hub changes whenever a post does, so its date follows the newest post.
  const newestPost = blogPages.reduce<Date | null>((m, p) => (p.lastModified && (!m || new Date(p.lastModified) > m) ? new Date(p.lastModified) : m), null);
  if (newestPost) {
    const hub = staticPages.find((p) => p.url === `${SITE_URL}/blog`);
    if (hub) hub.lastModified = newestPost;
  }

  let pseoPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getIndexablePseoSlugs();
    pseoPages = slugs.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: recentAuditUpdate,
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
