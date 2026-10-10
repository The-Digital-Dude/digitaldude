import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { ReferralTracker } from "@/components/ReferralTracker";
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
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.png",
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

const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: "The Digital Dude",
      url: SITE_URL,
      description: seo.home.description,
      publisher: {
        "@id": `${SITE_URL}#organization`,
      },
      inLanguage: "en-GB",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "The Digital Dude",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-full-color.png`,
      },
      image: `${SITE_URL}/og-image.png`,
      description: "Bespoke CRM, SaaS, and internal tooling engineering studio delivering custom software systems for scaling businesses in the UK & Australia.",
      email: "info@digitaldude.co.uk",
      foundingDate: "2020",
      sameAs: [
        "https://www.linkedin.com/company/td-dude",
        "https://www.facebook.com/td.dude/",
        "https://www.instagram.com/td.dude",
      ],
      areaServed: [
        { "@type": "Country", name: "United Kingdom" },
        { "@type": "Country", name: "Australia" },
        { "@type": "Country", name: "United States" },
        { "@type": "AdministrativeArea", name: "Global" },
      ],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "Customer Support & Technical Enquiries",
          email: "info@digitaldude.co.uk",
          url: `${SITE_URL}/contact`,
          availableLanguage: ["English"],
          areaServed: ["GB", "AU", "US", "Global"],
        },
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Custom Software Engineering Services",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Custom CRM Development",
              url: `${SITE_URL}/services/crm-development`,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "SaaS Platform Engineering",
              url: `${SITE_URL}/services/saas-development`,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "ERP & HRM Operational Systems",
              url: `${SITE_URL}/services/erp-hrm-systems`,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Two-Sided Marketplaces & Web Apps",
              url: `${SITE_URL}/services/marketplace-development`,
            },
          },
        ],
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="en" className={plusJakarta.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(rootJsonLd) }}
        />
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-purple focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <CookieConsent />
        <ReferralTracker />
        <Header />
        <main id="main" className="pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
