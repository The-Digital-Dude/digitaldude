import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { SITE_URL } from '@/lib/utils';
import { Clock, ArrowLeft, Share2, Sparkles, Calendar, User, ArrowRight } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

interface Article {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image: string | null;
  read_time: string;
  published_at: string;
  updated_at?: string;
  author: string;
  meta_title?: string;
  meta_description?: string;
}

const fallbackArticles: Record<string, Article> = {
  'scaled-ecommerce-organic-revenue-340-percent': {
    title: 'How We Scaled E-Commerce Organic Revenue by 340% in 90 Days',
    slug: 'scaled-ecommerce-organic-revenue-340-percent',
    excerpt: 'A step-by-step breakdown of fixing technical crawl bloat, optimizing category facet indexing, and implementing programmatic landing pages.',
    content: `## The Challenge

Our client, a multi-brand DTC retail platform with over 15,000 SKUs, was experiencing severe organic traffic stagnation. Despite heavy investments in content marketing, search engine crawlers were failing to discover new inventory, and page load speeds on mobile exceeded 4.2 seconds.

### Root Cause Audit
When we performed our deep technical crawl audit, we identified three major bottlenecks:

1. **Faceted Navigation Crawl Traps:** Over 120,000 parameter URLs were indexable, creating immense duplicate content signals and exhausting Googlebot's crawl budget.
2. **Client-Side Hydration Delays:** Product listing pages were loading a heavy 2.8MB JavaScript bundle before rendering primary HTML elements.
3. **Missing Canonical & Structured Data:** Product variants lacked proper schema markup, resulting in lost rich snippet opportunities.

---

## The Strategic Solution

We executed a comprehensive 3-phase technical overhaul over 60 days:

### 1. Programmatic Crawl Budget Cleanup
We implemented strict robots.txt directives and dynamic canonical rules to consolidate URL parameters. We mapped out clean static filter URLs for high-volume search queries like \`/womens/sneakers/white\` while adding \`noindex,follow\` to low-value multi-filter permutations.

### 2. Migration to Next.js Incremental Static Regeneration (ISR)
We rebuilt the storefront frontend with Next.js ISR. Category pages now render as pure, lightning-fast static HTML with sub-200ms TTFB (Time to First Byte). Real-time pricing and inventory availability are hydrated via lightweight micro-APIs.

### 3. Comprehensive JSON-LD Product & Merchant Schema
We embedded rich structured data across all product and category views, delivering price, availability, aggregate rating, and return policy signals directly to search engine results.

\`\`\`json
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Performance Running Shoes",
  "image": "https://example.com/shoes.jpg",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "USD",
    "price": "145.00",
    "availability": "https://schema.org/InStock"
  }
}
\`\`\`

---

## The Measurable Results

Within 90 days of deploying the new architecture:

- **Organic Revenue:** Increased by +340% YoY
- **Average Page Load Time (LCP):** Reduced from 4.2s to 1.1s (99% passing Core Web Vitals)
- **Indexed Clean Pages:** Increased by 220% with zero duplicate crawl errors
- **Non-Branded Keyword Rankings:** 48 new top-3 organic rankings for high-intent category terms

---

## Conclusion & Next Steps

Scaling e-commerce revenue requires treating performance engineering as a primary marketing lever. When your site is blazingly fast and architecturally clean, search engines reward you with authority and users convert at significantly higher rates.`,
    category: 'E-Commerce Growth',
    cover_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    read_time: '6 min read',
    published_at: '2026-03-15T00:00:00Z',
    author: 'The Digital Dude Team'
  }
};

async function getPost(slug: string) {
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) return data;
    }
  } catch {}

  if (fallbackArticles[slug]) return fallbackArticles[slug];
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Article Not Found | The Digital Dude',
    };
  }

  const title = post.meta_title || `${post.title} | The Digital Dude`;
  const description = post.meta_description || post.excerpt || `Read ${post.title} on The Digital Dude blog.`;
  const canonicalUrl = `${SITE_URL}/blog/${post.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at || post.published_at,
      authors: [post.author || 'The Digital Dude'],
      images: post.cover_image
        ? [{ url: post.cover_image, alt: post.title }]
        : [{ url: `${SITE_URL}/og-image.png`, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.cover_image ? [post.cover_image] : [`${SITE_URL}/og-image.png`],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BlogPostDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  // Schema.org BlogPosting & BreadcrumbList Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${postUrl}#article`,
        isPartOf: {
          '@type': 'WebPage',
          '@id': postUrl,
        },
        headline: post.title,
        description: post.meta_description || post.excerpt,
        image: post.cover_image ? [post.cover_image] : [`${SITE_URL}/og-image.png`],
        datePublished: post.published_at,
        dateModified: post.updated_at || post.published_at,
        author: {
          '@type': 'Person',
          name: post.author || 'The Digital Dude Team',
        },
        publisher: {
          '@type': 'Organization',
          name: 'The Digital Dude',
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo-full-color.png`,
          },
        },
        mainEntityOfPage: postUrl,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Blog',
            item: `${SITE_URL}/blog`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title,
            item: postUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-sand text-navy">
      {/* Article JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero / Header */}
      <section className="mx-auto max-w-content px-6 pt-32 pb-10 sm:pt-40 sm:pb-12 border-b border-black/5">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy/60 hover:text-purple transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Articles
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-lavender text-purple">
              {post.category}
            </span>
            <span className="text-xs text-navy/50 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              {post.read_time || '5 min read'}
            </span>
            {post.published_at && (
              <span className="text-xs text-navy/50 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-navy tracking-tight leading-[1.2]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-5 text-lg sm:text-xl text-navy/70 leading-relaxed font-normal">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple/10 flex items-center justify-center text-purple font-bold text-sm">
                DD
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">{post.author || 'The Digital Dude'}</p>
                <p className="text-xs text-navy/50">Performance Engineering & Growth</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Cover Image */}
      {post.cover_image && (
        <div className="max-w-4xl mx-auto px-6 -mt-4 sm:-mt-6 mb-12">
          <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-xl border border-black/5 bg-lavender">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <article className="max-w-3xl mx-auto px-6 py-8">
        <div className="prose prose-lg prose-indigo max-w-none text-navy/85 leading-relaxed space-y-6 font-sans">
          {post.content.split('\n\n').map((paragraph: string, idx: number) => {
            // Heading 2
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={idx} className="text-2xl sm:text-3xl font-bold text-navy pt-6 pb-2 border-b border-black/5">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            // Heading 3
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-xl sm:text-2xl font-bold text-navy pt-4">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            // Code block
            if (paragraph.startsWith('```')) {
              const cleanCode = paragraph.replace(/```[a-z]*\n?/g, '').trim();
              return (
                <pre key={idx} className="bg-slate-900 text-cyan-300 p-5 rounded-2xl overflow-x-auto text-sm font-mono my-6 border border-slate-800">
                  <code>{cleanCode}</code>
                </pre>
              );
            }
            // Bullet list
            if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
              const items = paragraph.split('\n');
              return (
                <ul key={idx} className="space-y-2 list-disc pl-6 text-navy/80">
                  {items.map((item, itemIdx) => (
                    <li key={itemIdx} className="pl-1">
                      {item.replace(/^[-*]|\d+\.\s*/, '').trim()}
                    </li>
                  ))}
                </ul>
              );
            }
            // Horizontal rule
            if (paragraph.trim() === '---') {
              return <hr key={idx} className="my-8 border-t border-black/10" />;
            }
            // Standard Paragraph
            return (
              <p key={idx} className="text-base sm:text-lg text-navy/80 leading-relaxed">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Share & Feedback */}
        <div className="mt-14 pt-8 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-navy/50">Tags:</span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-lavender text-purple">
              #{post.category.toLowerCase().replace(/\s+/g, '-')}
            </span>
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple hover:underline"
          >
            Discuss this strategy with our engineering team <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </article>

      {/* Bottom Sticky CTA Box */}
      <section className="bg-lavender py-16 mt-16 border-t border-black/5">
        <div className="mx-auto max-w-content px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple/10 text-purple text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Grow With Confidence
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy">
            Want us to implement this on your site?
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-navy/70 text-sm sm:text-base">
            Book a 30-minute discovery call with our technical leads. We will review your architecture, conversion funnel, and SEO opportunities.
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-purple px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-purple/90 transition-all"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
