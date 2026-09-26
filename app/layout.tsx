import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans antialiased">
        <Header />
        <main className="pb-20 md:pb-0">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
