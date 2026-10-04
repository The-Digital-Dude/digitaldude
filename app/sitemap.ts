import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";
import { services } from "@/lib/content/services";
import { industries } from "@/lib/content/industries";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getCaseStudies } from "@/lib/caseStudiesServer";

import { getAllPseoSlugs } from "@/lib/pseo/engine";

export const revalidate = 3600; // Cache and revalidate sitemap every hour for instant edge delivery

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE_URL}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/services`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/solutions`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/locations`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/compare`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_URL}/how-we-work`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: "daily", priority: 0.85 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${SITE_URL}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const allCaseStudies = await getCaseStudies();
  const caseStudyPages: MetadataRoute.Sitemap = allCaseStudies.map((c) => ({
    url: `${SITE_URL}/work/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((s) => ({
    url: `${SITE_URL}/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const industryPages: MetadataRoute.Sitemap = industries.map((i) => ({
    url: `${SITE_URL}/industries/${i.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
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
        lastModified: new Date(job.updated_at || now),
        changeFrequency: "weekly",
        priority: 0.6,
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
          lastModified: new Date(post.updated_at || post.published_at || now),
          changeFrequency: "weekly",
          priority: 0.8,
        }));
      }
    }
  } catch {}

  let pseoPages: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllPseoSlugs();
    pseoPages = slugs.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
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
