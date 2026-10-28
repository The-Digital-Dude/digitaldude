"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Page { href: string; label: string; exact?: boolean; badge?: keyof NavCounts }
interface Section { key: string; label: string; pages: Page[] }

export interface NavCounts { approvals: number; inbox: number }

export const SECTIONS: Section[] = [
  { key: "home", label: "Home", pages: [{ href: "/admin/acquisition", label: "Overview", exact: true }] },
  {
    key: "leads", label: "Leads", pages: [
      { href: "/admin/acquisition/companies", label: "Companies & contacts" },
      { href: "/admin/acquisition/suggestions", label: "Suggestions" },
      { href: "/admin/acquisition/markets", label: "Markets & countries" },
    ],
  },
  {
    key: "outreach", label: "Outreach", pages: [
      { href: "/admin/acquisition/campaigns", label: "Campaigns" },
      { href: "/admin/acquisition/approvals", label: "Approvals", badge: "approvals" },
      { href: "/admin/acquisition/inbox", label: "Inbox", badge: "inbox" },
      { href: "/admin/acquisition/meetings", label: "Meetings" },
    ],
  },
  {
    key: "team", label: "Sales team", pages: [
      { href: "/admin/acquisition/crm", label: "Rep CRM" },
      { href: "/admin/acquisition/reports", label: "Reports" },
    ],
  },
  {
    key: "content", label: "Content & settings", pages: [
      { href: "/admin/acquisition/blog", label: "Blog automation" },
      { href: "/admin/acquisition/design", label: "Email design" },
      { href: "/admin/acquisition/landing", label: "Booking page" },
      { href: "/admin/acquisition/settings", label: "Safety & settings" },
    ],
  },
];

const isActive = (pathname: string, p: Page) => (p.exact ? pathname === p.href : pathname.startsWith(p.href));

/** The section a path belongs to; unknown paths fall back to Home. */
export function sectionFor(pathname: string): Section {
  return SECTIONS.find((s) => s.pages.some((p) => isActive(pathname, p))) ?? SECTIONS[0];
}

const sectionCount = (s: Section, counts: NavCounts) => s.pages.reduce((n, p) => n + (p.badge ? counts[p.badge] : 0), 0);

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">{n > 99 ? "99+" : n}</span>;
}

export function SubNav({ counts = { approvals: 0, inbox: 0 } }: { counts?: NavCounts }) {
  const pathname = usePathname();
  const current = sectionFor(pathname);
  return (
    <div className="mb-6 border-b border-slate-200 pb-3">
      <nav className="flex flex-wrap gap-1" aria-label="Client acquisition sections">
        {SECTIONS.map((s) => (
          <Link key={s.key} href={s.pages[0].href} aria-current={s.key === current.key ? "page" : undefined} className={cn("rounded-lg px-3 py-1.5 text-sm font-bold transition", s.key === current.key ? "bg-navy text-white" : "text-navy/70 hover:bg-lavender hover:text-purple")}>
            {s.label}<Count n={sectionCount(s, counts)} />
          </Link>
        ))}
      </nav>
      {current.pages.length > 1 && (
        <nav className="mt-2 flex flex-wrap gap-1 border-t border-slate-100 pt-2" aria-label={`${current.label} pages`}>
          {current.pages.map((p) => (
            <Link key={p.href} href={p.href} className={cn("rounded-md px-2.5 py-1 text-sm font-semibold transition", isActive(pathname, p) ? "bg-lavender text-purple" : "text-navy/60 hover:text-purple")}>
              {p.label}{p.badge && <Count n={counts[p.badge]} />}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
