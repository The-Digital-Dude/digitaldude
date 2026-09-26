import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/utils";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { getCaseStudies } from "@/lib/caseStudiesServer";

export const revalidate = 3600;

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

export async function GET() {
  const caseStudies = await getCaseStudies();

  let blogArticles: Array<{
    title: string;
    slug: string;
    excerpt: string;
    published_at: string;
    author: string;
    category: string;
  }> = [];

  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from("posts")
        .select("title, slug, excerpt, published_at, author, category")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (data && data.length > 0) {
        blogArticles = data;
      }
    }
  } catch {}

  const buildDate = new Date().toUTCString();

  const blogItems = blogArticles
    .map((b) => {
      const pubDate = b.published_at ? new Date(b.published_at).toUTCString() : buildDate;
      const url = `${SITE_URL}/blog/${b.slug}`;
      return `    <item>
      <title>${escapeXml(b.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(b.category || "Technical Engineering")}</category>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">${escapeXml(b.author || "The Digital Dude")}</dc:creator>
      <description>${escapeXml(b.excerpt || "")}</description>
    </item>`;
    })
    .join("\n");

  const caseStudyItems = caseStudies
    .map((c) => {
      const url = `${SITE_URL}/work/${c.slug}`;
      return `    <item>
      <title>${escapeXml(c.title)} — Production Case Study</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${buildDate}</pubDate>
      <category>${escapeXml(c.industry || "Custom Software")}</category>
      <dc:creator xmlns:dc="http://purl.org/dc/elements/1.1/">The Digital Dude</dc:creator>
      <description>${escapeXml(c.summary + " | " + c.challenge)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>The Digital Dude — Technical Engineering &amp; Growth Insights</title>
    <link>${SITE_URL}</link>
    <description>Bespoke CRMs, SaaS platforms, on-demand marketplaces, and operational software systems for growing businesses in the UK and Australia.</description>
    <language>en-gb</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${blogItems}
${caseStudyItems}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
