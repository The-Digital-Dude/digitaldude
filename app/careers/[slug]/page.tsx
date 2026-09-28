import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { SITE_URL } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { JobApplicationForm } from "@/components/JobApplicationForm";
import { JobViewTracker } from "@/components/JobViewTracker";
import { MapPin, Briefcase, ArrowLeft } from "lucide-react";

export const revalidate = 60;

interface JobPosting {
  slug: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  compensation_summary: string;
  description: string;
  status: string;
}

async function getJob(slug: string): Promise<JobPosting | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .eq("slug", slug)
    .eq("status", "open")
    .single();
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return {};

  return {
    title: `${job.title} | Careers | The Digital Dude`,
    description: job.compensation_summary,
    alternates: { canonical: `${SITE_URL}/careers/${job.slug}` },
  };
}

export default async function JobPostingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <JobViewTracker
        jobTitle={job.title}
        jobSlug={job.slug}
        department={job.department}
      />
      <Link href="/careers" className="inline-flex items-center gap-2 text-sm font-medium text-navy/60 hover:text-purple">
        <ArrowLeft size={15} /> Back to all roles
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-navy sm:text-4xl">{job.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-navy/60">
        <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
        <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
        <span>{job.employment_type}</span>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 prose prose-slate max-w-none text-navy/80">
          <MarkdownRenderer content={job.description} />
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-28">
            <JobApplicationForm jobSlug={job.slug} jobTitle={job.title} />
          </div>
        </div>
      </div>
    </section>
  );
}
