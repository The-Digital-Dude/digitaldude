"use client";

import React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { CaseStudyEditor } from "@/components/admin/CaseStudyEditor";

export default function NewCaseStudyPage() {
  return (
    <AdminLayout>
      <CaseStudyEditor mode="create" />
    </AdminLayout>
  );
}
