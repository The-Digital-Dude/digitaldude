import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/admin/", "/admin/", "/private/"],
      },
      // Explicitly allow AI Search Engines & LLMs for Generative Answer Optimization (AEO/GEO)
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "anthropic-ai",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "Cohere-ai",
          "FacebookBot",
        ],
        allow: ["/", "/blog/", "/work/", "/services/", "/industries/", "/about", "/how-we-work", "/llms.txt", "/llms-full.txt"],
        disallow: ["/api/admin/", "/admin/", "/private/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
