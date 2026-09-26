import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Service } from "@/lib/content/services";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <h3 className="text-lg font-bold text-navy group-hover:text-purple">{service.navLabel}</h3>
      <p className="mt-2 flex-1 text-sm text-navy/70">{service.oneLiner}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple">
        Learn more <ArrowRight size={16} />
      </span>
    </Link>
  );
}
