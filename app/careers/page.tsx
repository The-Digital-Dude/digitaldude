import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { SITE_URL } from "@/lib/utils";
import { ArrowRight, MapPin, Briefcase } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers | The Digital Dude",
  description: "Open roles at The Digital Dude — join a team building custom CRMs, SaaS platforms and operational systems for growing businesses.",
  alternates: { canonical: `${SITE_URL}/careers` },
};

export const revalidate = 60;

interface JobPosting {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  employment_type: string;
  compensation_summary: string;
}

async function getOpenJobs(): Promise<JobPosting[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("job_postings")
    .select("id, slug, title, department, location, employment_type, compensation_summary")
    .eq("status", "open")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export default async function CareersPage() {
  const jobs = await getOpenJobs();

  return (
    <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">Careers at The Digital Dude</h1>
      <p className="mt-4 max-w-2xl text-lg text-navy/70">
        We&rsquo;re a small team building real, production software for businesses in the UK and Australia. Here&rsquo;s what we&rsquo;re hiring for right now.
      </p>

      <div className="mt-10 space-y-4">
        {jobs.length === 0 ? (
          <p className="text-navy/60">No open roles right now. Check back soon.</p>
        ) : (
          jobs.map((job) => (
            <Link
              key={job.id}
              href={`/careers/${job.slug}`}
              className="group block rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:border-purple/30 hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-navy group-hover:text-purple transition-colors">{job.title}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-navy/60">
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {job.department}</span>
                    <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-purple">
                  View role <ArrowRight size={15} />
                </span>
              </div>
              <p className="mt-3 text-sm text-navy/70">{job.compensation_summary}</p>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
