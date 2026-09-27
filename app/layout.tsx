import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { seo } from "@/lib/content/seo";
import { SITE_URL } from "@/lib/utils";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: seo.home.title,
    template: "%s",
  },
  description: seo.home.description,
  alternates: {
    canonical: "/",
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: seo.home.title,
    description: seo.home.description,
    url: SITE_URL,
    siteName: "The Digital Dude",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "The Digital Dude" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.home.title,
    description: seo.home.description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "The Digital Dude",
  url: SITE_URL,
  description: seo.home.description,
  publisher: {
    "@type": "Organization",
    name: "The Digital Dude",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-full-color.png`,
    email: "info@digitaldude.co.uk",
    foundingDate: "2020",
    sameAs: [
      "https://www.linkedin.com/company/td-dude",
      "https://www.facebook.com/td.dude/",
      "https://www.instagram.com/td.dude",
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
        />
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-purple focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <CookieConsent />
        <Header />
        <main id="main" className="pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
