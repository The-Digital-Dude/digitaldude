import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabaseClient";
import { DEMO_PROPOSAL, Proposal } from "@/lib/content/proposals";
import { ProposalView } from "@/components/ProposalView";
import { verifyAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

const SHARED_STATUSES = ["sent", "accepted", "completed", "active"];

// "instant_draft" proposals (auto-generated the moment someone books a call,
// before any human review) are viewable by whoever holds the unguessable
// slug — that's the same visitor the booking confirmation just linked it to
// — but deliberately excluded from SHARED_STATUSES so nothing that treats
// SHARED_STATUSES as "the team has reviewed and sent this" gets confused.
const PUBLICLY_VIEWABLE_STATUSES = [...SHARED_STATUSES, "instant_draft"];

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
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const isAdmin = sessionToken ? await verifyAdminSessionToken(sessionToken) : false;

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        if (PUBLICLY_VIEWABLE_STATUSES.includes(data.status) || isAdmin) {
          return data as Proposal;
        }
        return null;
      }
    } catch {
      // Fallback
    }
  }

  // Check in-memory store for newly created proposals
  const { findInMemoryProposal } = await import("@/lib/content/proposals");
  const inMem = findInMemoryProposal(slug);
  if (inMem) {
    if (PUBLICLY_VIEWABLE_STATUSES.includes(inMem.status) || isAdmin) {
      return inMem;
    }
    return null;
  }

  if (slug === DEMO_PROPOSAL.slug) {
    return DEMO_PROPOSAL;
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
