import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabaseClient';
import { SITE_URL } from '@/lib/utils';
import { TableOfContents } from '@/components/TableOfContents';
import { AiSummaryBox } from '@/components/AiSummaryBox';
import { Clock, ArrowLeft, Share2, Sparkles, Calendar, User, ArrowRight, ShieldCheck, Award, CheckCircle2 } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

import { staticBlogArticles, getStaticBlogArticle, getAllStaticBlogArticles, BlogArticle } from '@/lib/content/blogArticles';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { authorSchema, findAuthor } from '@/lib/content/authors';

interface Article extends BlogArticle {}

interface FaqItem {
  question: string;
  answer: string;
}

function extractFaqsFromMarkdown(content: string): FaqItem[] {
  const faqs: FaqItem[] = [];
  if (!content) return faqs;

  // Check if there is an explicit FAQ section
  const faqSectionRegex = /##+\s*(?:Frequently Asked Questions|FAQ[s]?)\s*\n([\s\S]*?)(?=\n##\s+[^\n#]|$)/i;
  const sectionMatch = content.match(faqSectionRegex);
  const targetText = sectionMatch ? sectionMatch[1] : content;

  // Match ### Q: Question? OR ### Question?
  const itemRegex = /###\s*(?:Q:\s*)?([^\n]+?\?)\s*\n+([\s\S]*?)(?=\n###|\n##|$)/gi;
  let match;
  while ((match = itemRegex.exec(targetText)) !== null) {
    const question = match[1].replace(/^Q:\s*/i, '').trim();
    const rawAnswer = match[2].trim();
    if (question && rawAnswer) {
      const cleanAnswer = rawAnswer
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // remove markdown links
        .replace(/[*_#`]/g, '') // remove markdown asterisks/formatting
        .replace(/\n+/g, ' ')
        .trim();
      if (cleanAnswer.length > 10) {
        faqs.push({ question, answer: cleanAnswer });
      }
    }
  }

  // Fallback: if no section match but there are ### Q: throughout
  if (faqs.length === 0 && !sectionMatch) {
    const explicitQRegex = /###\s*Q:\s*([^\n]+)\s*\n+([\s\S]*?)(?=\n###|\n##|$)/gi;
    let qMatch;
    while ((qMatch = explicitQRegex.exec(content)) !== null) {
      const question = qMatch[1].trim();
      const rawAnswer = qMatch[2].trim();
      if (question && rawAnswer) {
        const cleanAnswer = rawAnswer
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[*_#`]/g, '')
          .replace(/\n+/g, ' ')
          .trim();
        faqs.push({ question, answer: cleanAnswer });
      }
    }
  }

  return faqs.slice(0, 10);
}

export async function generateStaticParams() {
  const staticSlugs = getAllStaticBlogArticles().map((article) => ({ slug: article.slug }));
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase
        .from('posts')
        .select('slug')
        .eq('status', 'published');

      if (data && data.length > 0) {
        const uniqueSlugs = new Set([
          ...staticSlugs.map((s) => s.slug),
          ...data.map((p) => p.slug),
        ]);
        return Array.from(uniqueSlugs).map((slug) => ({ slug }));
      }
    }
  } catch {}
  return staticSlugs;
}

async function getPost(slug: string): Promise<Article | null> {
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        return {
          ...data,
          read_time: data.read_time || (data.reading_time_minutes ? `${data.reading_time_minutes} min read` : '5 min read'),
        };
      }
    }
  } catch {}

  const fallback = getStaticBlogArticle(slug);
  if (fallback) return fallback;
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

  const absoluteCoverImage = post.cover_image
    ? post.cover_image.startsWith('http')
      ? post.cover_image
      : `${SITE_URL}${post.cover_image.startsWith('/') ? '' : '/'}${post.cover_image}`
    : `${SITE_URL}/og-image.png`;

  const author = findAuthor(post.author);
  const authorLd = authorSchema(post.author, SITE_URL);

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
        image: [absoluteCoverImage],
        datePublished: post.published_at,
        dateModified: post.updated_at || post.published_at,
        author: authorLd,
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

  const faqs = extractFaqsFromMarkdown(post.content);
  if (faqs.length > 0) {
    (jsonLd['@graph'] as any[]).push({
      '@type': 'FAQPage',
      '@id': `${postUrl}#faq`,
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      })),
    });
  }

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
                {author ? author.initials : 'DD'}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">
                  {author ? (
                    <a href={author.linkedin} target="_blank" rel="noopener noreferrer author" className="hover:text-purple underline-offset-2 hover:underline">
                      {author.name}
                    </a>
                  ) : (
                    post.author || 'The Digital Dude'
                  )}
                </p>
                <p className="text-xs text-navy/50">{author ? author.role : 'Performance Engineering & Growth'}</p>
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
        {post.excerpt && (
          <AiSummaryBox
            summary={post.excerpt}
            keyPoints={[
              `Core Focus: ${post.category}`,
              `Estimated Reading Time: ${post.read_time || '5 min read'}`,
              `Written by: ${author ? `${author.name}, ${author.role}` : post.author || 'The Digital Dude Team'}`
            ]}
          />
        )}

        <TableOfContents content={post.content} />

        <div className="prose prose-lg prose-indigo max-w-none text-navy/85 leading-relaxed font-sans">
          <MarkdownRenderer content={post.content} />
        </div>

        {/* Author E-E-A-T & Editorial Integrity Card */}
        <div className="mt-12 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm flex-shrink-0">
              {author ? author.initials : 'DD'}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-navy">
                  {author ? (
                    <a href={author.linkedin} target="_blank" rel="noopener noreferrer author" className="hover:text-purple underline-offset-2 hover:underline">
                      {author.name}
                    </a>
                  ) : (
                    post.author || 'The Digital Dude Engineering Team'
                  )}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-lavender px-2 py-0.5 text-[11px] font-semibold text-purple">
                  <Award className="w-3 h-3" />
                  {author ? author.role : 'The Digital Dude'}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-navy/70 leading-relaxed">
                {author
                  ? author.bio
                  : 'Written by the team at The Digital Dude, specialists in high-performance web architecture, custom CRMs, marketplaces and programmatic SEO.'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-navy/50 font-medium">
                {author && (
                  <a href={author.linkedin} target="_blank" rel="noopener noreferrer author" className="flex items-center gap-1 text-purple hover:underline">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {author.name} on LinkedIn
                  </a>
                )}
                <span>Category: {post.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contextual Service Conversion Banner */}
        <div className="mt-6 rounded-2xl bg-gradient-to-br from-navy to-purple/95 p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-purple/30 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-200 bg-white/10 px-2.5 py-1 rounded-full mb-2.5 backdrop-blur-xs">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                Custom Solutions for Your Tech Stack
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Need expert execution for {post.category}?
              </h3>
              <p className="mt-1.5 text-xs sm:text-sm text-white/80 leading-relaxed">
                Whether you are migrating from legacy tooling or architecting custom infrastructure, our UK-based engineers will design a high-converting solution tailored to your workflow.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto flex-shrink-0">
              <Link
                href="/blog/custom-software-development-cost-uk"
                className="inline-flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition text-center"
              >
                See Price Ranges
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-navy hover:bg-white/95 transition shadow-sm text-center"
              >
                Talk to an Engineer
                <ArrowRight className="w-3.5 h-3.5 text-purple" />
              </Link>
            </div>
          </div>
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
