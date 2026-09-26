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
        <CookieConsent />
        <Header />
        <main className="pb-20 md:pb-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
