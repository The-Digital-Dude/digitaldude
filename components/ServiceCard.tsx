import Link from "next/link";
import { ArrowRight, Users, Cloud, Building2, Store, Globe, TrendingUp, type LucideIcon } from "lucide-react";
import type { Service } from "@/lib/content/services";

const serviceIcons: Record<string, LucideIcon> = {
  "crm-development": Users,
  "saas-development": Cloud,
  "erp-hrm-systems": Building2,
  "marketplace-development": Store,
  "website-development": Globe,
  "seo-growth": TrendingUp,
};

export function ServiceCard({ service }: { service: Service }) {
  const Icon = serviceIcons[service.slug] ?? Users;

  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint text-purple">
        <Icon size={20} />
      </span>
      <h3 className="mt-4 text-lg font-bold text-navy group-hover:text-purple">
        {service.navLabel}
      </h3>
      <p className="mt-2 flex-1 text-sm text-navy/70">{service.oneLiner}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-purple">
        Learn more <ArrowRight size={16} />
      </span>
    </Link>
  );
}
