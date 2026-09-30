"use client";

import React from "react";
import { useParams } from "next/navigation";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CaseStudyEditor } from "@/components/admin/CaseStudyEditor";

export default function EditCaseStudyPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <AdminLayout>
      <CaseStudyEditor mode="edit" caseStudyId={id} />
    </AdminLayout>
  );
}
