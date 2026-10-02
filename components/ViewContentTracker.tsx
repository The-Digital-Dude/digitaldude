"use client";

import { useEffect } from "react";
import { event } from "@/lib/metaPixel";

interface ViewContentTrackerProps {
  contentName: string;
  contentCategory?: string;
  contentIds?: string[];
  contentType?: string;
  value?: number;
  currency?: string;
}

export function ViewContentTracker({
  contentName,
  contentCategory,
  contentIds,
  contentType = "page",
  value,
  currency = "USD",
}: ViewContentTrackerProps) {
  useEffect(() => {
    event("ViewContent", {
      content_name: contentName,
      content_category: contentCategory,
      content_ids: contentIds,
      content_type: contentType,
      value,
      currency: value !== undefined ? currency : undefined,
    });
  }, [contentName, contentCategory, contentIds, contentType, value, currency]);

  return null;
}
