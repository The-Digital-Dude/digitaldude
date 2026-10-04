"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ShieldCheck, Sparkles, MapPin, Mail, Globe, CheckCircle2 } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Hide on admin, proposal, rep, and client portal routes
  if (
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/proposals/") ||
    pathname?.startsWith("/rep") ||
    pathname?.startsWith("/portal")
  ) {
    return null;
  }

  return (
    <footer className="bg-[#0F0F2D] text-slate-300 border-t border-white/10 relative overflow-hidden">
      {/* Background subtle glow effect */}
      <div className="absolute top-0 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-[#5B4FE8]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 h-96 w-96 translate-y-1/2 rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />

      {/* Main Footer Grid */}
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-12 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand, Tagline & Direct Contact */}
          <div className="space-y-5 lg:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-full-white.png"
                alt="The Digital Dude"
                width={175}
                height={32}
                className="h-8 w-auto brightness-110"
              />
            </Link>
            <p className="text-xs leading-relaxed text-slate-400">
              We build custom CRMs, scalable SaaS platforms, and operational systems for high-growth enterprises in the UK & Australia.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <a
                href="mailto:info@digitaldude.co.uk"
                className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition"
              >
                <Mail className="h-3.5 w-3.5 text-[#5B4FE8]" />
                <span>info@digitaldude.co.uk</span>
              </a>
              <div className="flex items-center gap-2 text-slate-400">
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>UK & Australia Engineering Hubs</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300 border border-white/10">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Available for New Q4/Q1 Builds</span>
              </div>
            </div>
          </div>

          {/* Column 2: Core Engineering Services */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Engineering Services
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/services/crm-development" className="hover:text-white transition inline-flex items-center gap-1">
                  Custom CRM Development
                </Link>
              </li>
              <li>
                <Link href="/services/saas-development" className="hover:text-white transition inline-flex items-center gap-1">
                  SaaS Platforms & MVPs
                </Link>
              </li>
              <li>
                <Link href="/services/erp-hrm-systems" className="hover:text-white transition inline-flex items-center gap-1">
                  ERP & Operations Portals
                </Link>
              </li>
              <li>
                <Link href="/services/marketplace-development" className="hover:text-white transition inline-flex items-center gap-1">
                  Marketplaces & Multi-Vendor
                </Link>
              </li>
              <li>
                <Link href="/services/website-development" className="hover:text-white transition inline-flex items-center gap-1">
                  High-Performance Web Apps
                </Link>
              </li>
              <li>
                <Link href="/services/seo-growth" className="hover:text-white transition inline-flex items-center gap-1">
                  Technical SEO & pSEO Engine
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Industry Solutions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Industry Verticals
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/solutions/property/crm-development" className="hover:text-white transition">
                  Property & Real Estate CRM
                </Link>
              </li>
              <li>
                <Link href="/solutions/logistics/erp-operations" className="hover:text-white transition">
                  Logistics & Fleet Systems
                </Link>
              </li>
              <li>
                <Link href="/solutions/travel/marketplace-booking" className="hover:text-white transition">
                  Travel & Booking Engines
                </Link>
              </li>
              <li>
                <Link href="/solutions/recruitment/candidate-portal" className="hover:text-white transition">
                  Recruitment & ATS Portals
                </Link>
              </li>
              <li>
                <Link href="/solutions/home-services/dispatch-management" className="hover:text-white transition">
                  Field & Home Services
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="text-[#5B4FE8] hover:underline font-semibold inline-flex items-center gap-1 pt-1">
                  Explore All Solutions
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Engineering Hubs & Comparisons */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Hubs & Comparisons
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/locations/london/crm-development" className="hover:text-white transition">
                  London Tech Hub
                </Link>
              </li>
              <li>
                <Link href="/locations/manchester/saas-development" className="hover:text-white transition">
                  Manchester Engineering
                </Link>
              </li>
              <li>
                <Link href="/locations/sydney/saas-development" className="hover:text-white transition">
                  Sydney Innovation Hub
                </Link>
              </li>
              <li>
                <Link href="/locations/melbourne/crm-development" className="hover:text-white transition">
                  Melbourne Tech Hub
                </Link>
              </li>
              <li>
                <Link href="/compare" className="hover:text-white transition">
                  Build vs. Buy SaaS Guides
                </Link>
              </li>
              <li>
                <Link href="/locations" className="text-[#5B4FE8] hover:underline font-semibold inline-flex items-center gap-1 pt-1">
                  All 10+ Metros
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Company & Resources */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Company & Work
            </h3>
            <ul className="mt-4 space-y-2.5 text-xs">
              <li>
                <Link href="/work" className="hover:text-white transition">
                  Case Studies & Proof
                </Link>
              </li>
              <li>
                <Link href="/how-we-work" className="hover:text-white transition">
                  How We Work (Fixed-Price)
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition">
                  Engineering Blog
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About Our Team
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-white transition inline-flex items-center gap-1.5">
                  <span>Careers</span>
                  <span className="rounded bg-[#5B4FE8]/30 px-1.5 py-0.2 text-[10px] font-bold text-[#5B4FE8]">
                    Hiring
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Book Architecture Call
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="mt-12 border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <p>&copy; {new Date().getFullYear()} The Digital Dude Ltd. Registered in England & Wales.</p>
            <span className="hidden md:inline text-white/20">•</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>100% Client Code & IP Ownership</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-white transition">
              Terms of Service
            </Link>
            <Link href="/sitemap.xml" target="_blank" className="hover:text-white transition">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
