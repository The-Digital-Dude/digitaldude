import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { IndustryFilterBar } from "@/components/IndustryFilterBar";
import { getCaseStudies } from "@/lib/caseStudiesServer";

export const metadata: Metadata = buildMetadata("work", "/work");
export const revalidate = 60;

export default async function WorkPage() {
  const projects = await getCaseStudies();

  return (
    <>
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <h1 className="text-3xl font-bold text-navy sm:text-4xl">
          Systems our team has built and shipped
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">
          Production systems across multiple industries. We keep client names private,
          so each project is described by what it does, the architecture, and what changed.
        </p>

        <div className="mt-10">
          <IndustryFilterBar projects={projects} />
        </div>
      </section>

      <section className="bg-lavender py-16">
        <div className="mx-auto max-w-content px-6 text-center">
          <p className="mx-auto max-w-2xl text-navy/80">
            Don&rsquo;t see your industry? Most of what we build solves the same problem: too many
            tools, not enough visibility.{" "}
            <Link href="/contact" className="font-semibold text-purple">
              Book a call
            </Link>{" "}
            and tell us how your business runs.
          </p>
        </div>
      </section>
    </>
  );
}
