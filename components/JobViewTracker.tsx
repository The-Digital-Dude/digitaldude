"use client";

import { useEffect } from "react";
import { event } from "@/lib/metaPixel";

interface JobViewTrackerProps {
  jobTitle: string;
  jobSlug: string;
  department?: string;
}

export function JobViewTracker({ jobTitle, jobSlug, department }: JobViewTrackerProps) {
  useEffect(() => {
    event("ViewContent", {
      content_name: jobTitle,
      content_category: department || "Careers",
      content_ids: [jobSlug],
      content_type: "job_posting",
    });
  }, [jobTitle, jobSlug, department]);

  return null;
}
