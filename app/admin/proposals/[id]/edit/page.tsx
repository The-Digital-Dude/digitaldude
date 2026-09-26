"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProposalEditor } from "@/components/admin/ProposalEditor";
import { Proposal } from "@/lib/content/proposals";

export default function EditProposalPage() {
  const params = useParams();
  const id = params?.id as string;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProposal() {
      try {
        const res = await fetch(`/api/admin/proposals/${id}`);
        const data = await res.json();
        if (data.ok && data.proposal) {
          setProposal(data.proposal);
        } else {
          setError(data.error || "Proposal not found");
        }
      } catch {
        setError("Failed to load proposal details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadProposal();
    }
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-12 text-center text-xs text-navy/60">Loading proposal data…</div>
      </AdminLayout>
    );
  }

  if (error || !proposal) {
    return (
      <AdminLayout>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-xs font-medium text-red-600">
          {error || "Proposal not found."}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ProposalEditor initialData={proposal} isEdit={true} />
    </AdminLayout>
  );
}
