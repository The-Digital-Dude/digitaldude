"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/acquisition", label: "Overview", exact: true },
  { href: "/admin/acquisition/companies", label: "Companies & contacts" },
  { href: "/admin/acquisition/markets", label: "Markets & countries" },
  { href: "/admin/acquisition/campaigns", label: "Campaigns" },
  { href: "/admin/acquisition/approvals", label: "Approvals" },
  { href: "/admin/acquisition/inbox", label: "Inbox" },
  { href: "/admin/acquisition/meetings", label: "Meetings" },
  { href: "/admin/acquisition/settings", label: "Safety & settings" },
];

export function SubNav() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 pb-3" aria-label="Client acquisition sections">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link key={t.href} href={t.href} className={cn("rounded-lg px-3 py-1.5 text-sm font-semibold transition", active ? "bg-navy text-white" : "text-navy/70 hover:bg-lavender hover:text-purple")}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
