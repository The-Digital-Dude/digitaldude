import { NextRequest, NextResponse } from "next/server";
import {
  generateBlogOutline,
  generateFullBlogArticle,
  getRecommendedInternalLinks,
} from "@/lib/seo/blogGenerator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "outline";

    if (action === "outline") {
      const { focusKeyword, secondaryKeywords, targetAudience, contentGoal } = body;
      if (!focusKeyword || typeof focusKeyword !== "string") {
        return NextResponse.json({ ok: false, error: "Focus keyword is required" }, { status: 400 });
      }

      const outline = await generateBlogOutline({
        focusKeyword,
        secondaryKeywords: Array.isArray(secondaryKeywords) ? secondaryKeywords : [],
        targetAudience,
        contentGoal,
      });

      return NextResponse.json({ ok: true, outline });
    }

    if (action === "article") {
      const { outline, selectedLinks, customInstructions } = body;
      if (!outline || !outline.focusKeyword) {
        return NextResponse.json({ ok: false, error: "Valid outline is required" }, { status: 400 });
      }

      const article = await generateFullBlogArticle({
        outline,
        selectedLinks: Array.isArray(selectedLinks) ? selectedLinks : [],
        customInstructions,
      });

      return NextResponse.json({ ok: true, article });
    }

    if (action === "optimize_meta") {
      const { title, content, focusKeyword } = body;
      const kw = focusKeyword || title || "Custom Software";

      // Optimize title (aiming for 50-58 chars)
      let optimizedTitle = title.trim();
      if (!optimizedTitle.includes("| The Digital Dude")) {
        const base = optimizedTitle.replace(/\s*\|\s*The Digital Dude/gi, "");
        if (base.length <= 40) {
          optimizedTitle = `${base} | The Digital Dude`;
        } else {
          optimizedTitle = `${base.slice(0, 42)}... | The Digital Dude`;
        }
      }

      // Optimize description (aiming for 135-155 chars)
      const sanitizedDesc = `Discover why technical leaders evaluate ${kw}. Compare off-the-shelf software with bespoke architecture, 3-year TCO, and zero per-seat licensing.`;

      return NextResponse.json({
        ok: true,
        metaTitle: optimizedTitle,
        metaDescription: sanitizedDesc,
      });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("AI Blog generation error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to generate blog content" },
      { status: 500 }
    );
  }
}
