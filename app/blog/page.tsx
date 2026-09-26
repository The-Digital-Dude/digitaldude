import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { Clock, Tag, ArrowRight, BookOpen, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog & Insights | The Digital Dude - Growth, Web & Performance',
  description: 'Actionable strategies on e-commerce scaling, technical SEO, conversion rate optimization, and custom software engineering.',
  openGraph: {
    title: 'The Digital Dude Blog - Insights & Playbooks',
    description: 'Practical guides and deep dives on revenue-focused engineering and performance marketing.',
    url: 'https://thedigitaldude.com/blog',
    type: 'website',
  },
  alternates: {
    canonical: 'https://thedigitaldude.com/blog'
  }
};

export const revalidate = 60; // ISR revalidation every minute

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  cover_image: string | null;
  read_time: string;
  published_at: string;
  author: string;
}

const fallbackPosts: Post[] = [
  {
    id: 'f-1',
    title: 'How We Scaled E-Commerce Organic Revenue by 340% in 90 Days',
    slug: 'scaled-ecommerce-organic-revenue-340-percent',
    excerpt: 'A step-by-step breakdown of fixing technical crawl bloat, optimizing category facet indexing, and implementing programmatic landing pages.',
    category: 'E-Commerce Growth',
    cover_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    read_time: '6 min read',
    published_at: new Date().toISOString(),
    author: 'The Digital Dude Team'
  },
  {
    id: 'f-2',
    title: 'Next.js 15 & Server Actions: Building High-Converting Funnels with Zero Bloat',
    slug: 'nextjs-15-server-actions-high-converting-funnels',
    excerpt: 'Why modern performance architecture drives lower customer acquisition costs and how server components eliminate client-side bundle lag.',
    category: 'Full-Stack Web Dev',
    cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    read_time: '8 min read',
    published_at: new Date().toISOString(),
    author: 'The Digital Dude Team'
  },
  {
    id: 'f-3',
    title: 'Google Ads ROAS Stalling? 5 Tracking & Bidding Fixes You Need Now',
    slug: 'google-ads-roas-stalling-bidding-fixes',
    excerpt: 'How Enhanced Conversions, server-side Google Tag Manager, and value-based bidding unlock scalable return on ad spend.',
    category: 'Google Ads & PPC',
    cover_image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    read_time: '5 min read',
    published_at: new Date().toISOString(),
    author: 'The Digital Dude Team'
  }
];

export default async function BlogPage() {
  let posts: Post[] = [];

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, slug, excerpt, category, cover_image, read_time, published_at, author')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (!error && data && data.length > 0) {
      posts = data as Post[];
    } else {
      posts = fallbackPosts;
    }
  } catch {
    posts = fallbackPosts;
  }

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-sand text-navy">
      {/* Hero Section */}
      <section className="mx-auto max-w-content px-6 pt-32 pb-12 sm:pt-40 sm:pb-16 border-b border-black/5">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple/10 text-purple text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Engineering & Growth Playbooks
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-navy leading-[1.15]">
            Insights on Scaling Digital Revenue
          </h1>
          <p className="mt-4 text-lg text-navy/70 leading-relaxed max-w-2xl">
            Practical strategies, technical deep dives, and performance engineering playbooks from our work with high-growth businesses.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="mx-auto max-w-content px-6 py-12">
        {featuredPost && (
          <div className="mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-navy/50 mb-4">Featured Story</h2>
            <Link 
              href={`/blog/${featuredPost.slug}`}
              className="group block bg-white rounded-3xl overflow-hidden border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-purple/30"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {featuredPost.cover_image && (
                  <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto relative overflow-hidden bg-lavender">
                    <img
                      src={featuredPost.cover_image}
                      alt={featuredPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className={`p-8 sm:p-10 flex flex-col justify-between ${featuredPost.cover_image ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-lavender text-purple">
                        {featuredPost.category}
                      </span>
                      <span className="text-xs text-navy/50 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPost.read_time}
                      </span>
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold text-navy group-hover:text-purple transition-colors leading-tight">
                      {featuredPost.title}
                    </h3>

                    <p className="mt-4 text-navy/70 leading-relaxed text-sm sm:text-base line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
                    <span className="text-xs font-medium text-navy/60">
                      By {featuredPost.author}
                    </span>
                    <span className="text-sm font-semibold text-purple flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Grid for Remaining Posts */}
        {remainingPosts.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-navy/50 mb-6">Latest Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {remainingPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-black/5 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-purple/20"
                >
                  {post.cover_image && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-lavender">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-lavender text-purple">
                          {post.category}
                        </span>
                        <span className="text-xs text-navy/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {post.read_time}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-navy group-hover:text-purple transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h3>

                      <p className="mt-2.5 text-sm text-navy/70 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-xs">
                      <span className="text-navy/50 font-medium">{post.author}</span>
                      <span className="font-semibold text-purple flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* CTA Box */}
      <section className="bg-lavender py-16 mt-12 border-t border-black/5">
        <div className="mx-auto max-w-content px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy">
            Ready to scale your digital infrastructure?
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-navy/70 text-sm sm:text-base">
            Book a 30-minute discovery call to evaluate your technical architecture, SEO pipeline, and conversion funnel.
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl bg-purple px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-purple/90 transition-all"
            >
              Book a Strategy Call
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
