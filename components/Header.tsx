"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { services } from "@/lib/content/services";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/work", label: "Work" },
  { href: "/how-we-work", label: "How we work" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

export function Header() {
  const pathname = usePathname();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/proposals/")) {
    return null;
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center" onClick={() => setMobileOpen(false)}>
            <Image
              src="/logo-full-color.png"
              alt="The Digital Dude"
              width={175}
              height={32}
              priority
              className="h-8 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
              onBlur={(e) => {
                // Close once focus leaves both the button and the menu links,
                // so keyboard users can Tab through the dropdown normally.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setServicesOpen(false);
                }
              }}
            >
              <button
                type="button"
                className="flex items-center gap-1 text-sm font-medium text-navy hover:text-purple"
                aria-expanded={servicesOpen}
                aria-haspopup="true"
                onClick={() => setServicesOpen((v) => !v)}
                onFocus={() => setServicesOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setServicesOpen(false);
                }}
              >
                Services
                <ChevronDown size={16} />
              </button>
              {servicesOpen && (
                <div className="absolute left-0 top-full w-64 rounded-xl border border-black/5 bg-white p-2 shadow-lg">
                  {services
                    .filter((s) => s.slug !== "seo-growth")
                    .map((s) => (
                      <Link
                        key={s.slug}
                        href={`/services/${s.slug}`}
                        className="block rounded-lg px-3 py-2 text-sm text-navy hover:bg-lavender"
                      >
                        {s.navLabel}
                      </Link>
                    ))}
                  <Link
                    href="/services"
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-purple hover:bg-lavender"
                  >
                    See all services
                  </Link>
                </div>
              )}
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-navy hover:text-purple"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href="/contact"
              className="rounded-full bg-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Book a call
            </Link>
          </div>

          <button
            className="text-navy md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        <div
          className={cn(
            "overflow-hidden border-t border-black/5 bg-white md:hidden",
            mobileOpen ? "max-h-[80vh]" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-1 px-6 py-4">
            <Link
              href="/services"
              className="rounded-lg px-2 py-2 text-sm font-semibold text-navy"
              onClick={() => setMobileOpen(false)}
            >
              Services
            </Link>
            <div className="ml-2 flex flex-col gap-1 border-l border-tint pl-3">
              {services
                .filter((s) => s.slug !== "seo-growth")
                .map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    className="rounded-lg px-2 py-1.5 text-sm text-navy/80"
                    onClick={() => setMobileOpen(false)}
                  >
                    {s.navLabel}
                  </Link>
                ))}
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-2 py-2 text-sm font-semibold text-navy"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile sticky "Book a call" bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white p-3 md:hidden">
        <Link
          href="/contact"
          className="block w-full rounded-full bg-purple py-3 text-center text-sm font-semibold text-white"
        >
          Book a 30-minute call
        </Link>
      </div>
    </>
  );
}
