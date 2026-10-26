import { PseoPageData } from "@/lib/pseo/types";
import { SITE_URL } from "@/lib/utils";

interface PseoJsonLdProps {
  page: PseoPageData;
}

export function PseoJsonLd({ page }: PseoJsonLdProps) {
  const pageUrl = `${SITE_URL}/${page.slug}`;

  // 1. BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: page.breadcrumbs.map((b, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: b.label,
      item: b.url.startsWith("http") ? b.url : `${SITE_URL}${b.url}`,
    })),
  };

  // 2. Main Entity Schema (TechArticle with author for comparison guides, Service for commercial hubs)
  const mainEntitySchema =
    page.category === "comparison"
      ? {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": `${pageUrl}#article`,
          url: pageUrl,
          name: page.title,
          headline: page.heroHeadline,
          description: page.metaDescription,
          datePublished: "2026-04-01T00:00:00Z",
          dateModified: "2026-10-10T00:00:00Z",
          isPartOf: {
            "@type": "WebSite",
            "@id": `${SITE_URL}#website`,
            name: "The Digital Dude",
            url: SITE_URL,
          },
          author: {
            "@type": "Person",
            name: "Farhad Hossain",
            jobTitle: "Founder & Solutions Architect",
            url: `${SITE_URL}/about`,
            sameAs: ["https://www.linkedin.com/in/neiloy-farhad/"],
          },
          publisher: {
            "@type": "Organization",
            name: "The Digital Dude",
            url: SITE_URL,
            logo: {
              "@type": "ImageObject",
              url: `${SITE_URL}/logo-full-color.png`,
            },
          },
          about: [
            {
              "@type": "SoftwareApplication",
              name: page.competitorName,
              applicationCategory: "BusinessApplication",
            },
            {
              "@type": "SoftwareApplication",
              name: "Bespoke Custom Software Architecture",
              applicationCategory: "BusinessApplication",
            },
          ],
        }
      : {
          "@context": "https://schema.org",
          "@type": "Service",
          name: page.heroHeadline,
          description: page.metaDescription,
          url: pageUrl,
          provider: {
            "@type": "Organization",
            name: "The Digital Dude",
            url: SITE_URL,
            logo: `${SITE_URL}/logo-full-color.png`,
          },
          areaServed: page.city
            ? {
                "@type": "City",
                name: page.city,
                containedInPlace: {
                  "@type": "Country",
                  name: page.country || "United Kingdom",
                },
              }
            : {
                "@type": "Country",
                name: "United Kingdom & Australia",
              },
        };

  // 3. Category-Specific Rich Schemas (LocalBusiness for locations, SoftwareApplication for solutions)
  const localBusinessSchema =
    page.category === "location"
      ? {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          "@id": `${pageUrl}#localbusiness`,
          name: `The Digital Dude - ${page.city} Hub`,
          description: page.metaDescription,
          url: pageUrl,
          priceRange: "£££",
          address: {
            "@type": "PostalAddress",
            addressLocality: page.city,
            addressRegion: page.region || page.city,
            addressCountry: page.country === "Australia" ? "AU" : "GB",
          },
        }
      : null;

  const softwareAppSchema =
    page.category === "solution" || page.category === "comparison"
      ? {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "@id": `${pageUrl}#software`,
          name: page.category === "comparison" ? `Bespoke Software Architecture (vs ${page.competitorName})` : page.heroHeadline,
          applicationCategory: "BusinessApplication",
          operatingSystem: "Cloud, Web, Mobile (iOS/Android)",
          description: page.metaDescription,
        }
      : null;

  // 4. FAQPage Schema (if FAQs exist)
  const faqSchema =
    page.faqs && page.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mainEntitySchema) }}
      />
      {localBusinessSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      )}
      {softwareAppSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
        />
      )}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
    </>
  );
}
