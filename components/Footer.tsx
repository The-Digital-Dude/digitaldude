"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { caseStudies } from "@/lib/content/caseStudies";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="bg-navy text-white/80">
      <div className="mx-auto grid max-w-content gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/logo-full-white.png"
            alt="The Digital Dude"
            width={175}
            height={32}
            className="h-8 w-auto"
          />
          <p className="mt-4 text-sm font-medium text-white">We build systems that scale.</p>
          <p className="mt-2 text-sm text-white/60">
            Custom CRMs, SaaS platforms and operations systems for growing businesses.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Work</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {caseStudies.slice(0, 3).map((c) => (
              <li key={c.slug}>
                <Link href={`/work/${c.slug}`} className="hover:text-white">
                  {c.title}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/work" className="hover:text-white">
                All projects
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Services</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/services/crm-development" className="hover:text-white">
                CRM development
              </Link>
            </li>
            <li>
              <Link href="/services/saas-development" className="hover:text-white">
                SaaS development
              </Link>
            </li>
            <li>
              <Link href="/services/erp-hrm-systems" className="hover:text-white">
                ERP and HRM systems
              </Link>
            </li>
            <li>
              <Link href="/services/marketplace-development" className="hover:text-white">
                Marketplaces and apps
              </Link>
            </li>
            <li>
              <Link href="/services/website-development" className="hover:text-white">
                Websites
              </Link>
            </li>
            <li>
              <Link href="/services/seo-growth" className="hover:text-white">
                SEO and growth
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Company</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/how-we-work" className="hover:text-white">
                How we work
              </Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white">
                Blog & Insights
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-white">
                About
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <a href="mailto:info@digitaldude.co.uk" className="hover:text-white">
                info@digitaldude.co.uk
              </a>
            </li>
            <li>
              <a
                href="https://www.linkedin.com/company/td-dude"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                LinkedIn
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-content flex-col gap-2 px-6 py-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} The Digital Dude. UK-registered company.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy policy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms and conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
