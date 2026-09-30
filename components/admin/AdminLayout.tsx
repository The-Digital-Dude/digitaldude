"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarCheck,
  FileText,
  Briefcase,
  ExternalLink,
  LogOut,
  Menu,
  X,
  ScrollText,
  ClipboardList,
  Inbox,
  UserCheck,
  FolderKanban,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/projects", label: "Client Projects", icon: FolderKanban, exact: false },
  { href: "/admin/reps", label: "Rep Activity & Audit", icon: Activity, exact: false },
  { href: "/admin/bookings", label: "Meetings & Bookings", icon: CalendarCheck, exact: false },
  { href: "/admin/proposals", label: "Proposals & Specs", icon: ScrollText, exact: false },
  { href: "/admin/case-studies", label: "Case Studies", icon: Briefcase, exact: false },
  { href: "/admin/blogs", label: "Blog & Content", icon: FileText, exact: false },
  { href: "/admin/jobs", label: "Job Postings", icon: ClipboardList, exact: false },
  { href: "/admin/applications", label: "Applications", icon: Inbox, exact: false },
  { href: "/admin/employees", label: "Employees & Onboarding", icon: UserCheck, exact: false },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-navy antialiased">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 shrink-0 sticky top-0 h-screen overflow-y-auto flex-col justify-between border-r border-slate-200 bg-white p-5 lg:flex">
        <div>
          <div className="flex items-center gap-3 px-2 py-3">
            <Image
              src="/logo-full-color.png"
              alt="The Digital Dude"
              width={150}
              height={28}
              className="h-7 w-auto"
            />
            <span className="rounded bg-lavender px-2 py-0.5 text-xs font-bold text-purple">
              Admin
            </span>
          </div>

          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-purple text-white shadow-sm"
                      : "text-navy/70 hover:bg-lavender hover:text-purple"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-4">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl px-3.5 py-2 text-sm font-medium text-navy/70 transition hover:bg-slate-100 hover:text-navy"
          >
            <span className="flex items-center gap-2">
              <ExternalLink size={16} /> Live Website
            </span>
            <span className="text-xs text-navy/40">&rarr;</span>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            <LogOut size={16} />
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar Mobile */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:hidden">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-full-color.png"
              alt="The Digital Dude"
              width={130}
              height={24}
              className="h-6 w-auto"
            />
            <span className="rounded bg-lavender px-2 py-0.5 text-xs font-bold text-purple">
              Admin
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-navy hover:text-purple"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </header>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="border-b border-slate-200 bg-white p-4 lg:hidden">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold",
                      active ? "bg-purple text-white" : "text-navy hover:bg-lavender"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                Sign out
              </button>
            </nav>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

export default AdminLayout;
