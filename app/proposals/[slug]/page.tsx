import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { DEMO_PROPOSAL, Proposal } from "@/lib/content/proposals";
import { ProposalView } from "@/components/ProposalView";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  let title = "Technical Architecture Specification & Proposal";
  let description = "Comprehensive software architecture specification and project scope brief by The Digital Dude.";

  if (slug === DEMO_PROPOSAL.slug) {
    title = `${DEMO_PROPOSAL.project_title} | Technical Specification`;
    description = DEMO_PROPOSAL.scope_summary;
  }

  return {
    title: `${title} | The Digital Dude`,
    description,
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function getProposal(slug: string): Promise<Proposal | null> {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        return data as Proposal;
      }
    } catch {
      // Fallback
    }
  }

  if (slug === DEMO_PROPOSAL.slug || slug.startsWith("TDD-SPEC-DEMO")) {
    return DEMO_PROPOSAL;
  }

  // Synthesize dynamic preview proposal if valid format
  if (slug.startsWith("TDD-SPEC-")) {
    return {
      ...DEMO_PROPOSAL,
      slug,
      project_title: `Custom Architecture & Technical Specification (${slug})`,
    };
  }

  return null;
}

export default async function ProposalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proposal = await getProposal(slug);

  if (!proposal) {
    notFound();
  }

  return <ProposalView proposal={proposal} />;
}
