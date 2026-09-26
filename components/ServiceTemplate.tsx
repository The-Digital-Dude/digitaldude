import type { Service } from "@/lib/content/services";
import { FaqAccordion } from "@/components/FaqAccordion";
import { RelatedWork } from "@/components/RelatedWork";
import { StandardCTA } from "@/components/StandardCTA";
import { SITE_URL } from "@/lib/utils";

export function ServiceTemplate({ service }: { service: Service }) {
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.headline,
        description: service.intro,
        provider: {
          "@type": "Organization",
          name: "The Digital Dude",
          url: SITE_URL,
        },
        serviceType: service.navLabel,
        offers: {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Services",
            item: `${SITE_URL}/services`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: service.navLabel,
            item: `${SITE_URL}/services/${service.slug}`,
          },
        ],
      },
      ...(service.faqs && service.faqs.length > 0
        ? [
            {
              "@type": "FAQPage",
              mainEntity: service.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.q,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.a,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <section className="mx-auto max-w-content px-6 pb-12 pt-32 sm:pt-40">
        <h1 className="max-w-3xl text-3xl font-bold text-navy sm:text-4xl">{service.headline}</h1>
        <p className="mt-4 max-w-2xl text-lg text-navy/70">{service.intro}</p>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">What&rsquo;s included</h2>
        <ul className="mt-4 max-w-3xl space-y-3">
          {service.included.map((item) => (
            <li key={item} className="flex gap-3 text-navy/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">Who it&rsquo;s for</h2>
        <p className="mt-4 max-w-3xl text-navy/70">{service.whoFor}</p>
      </section>

      <RelatedWork slugs={service.related} heading="Related work" />

      <section className="mx-auto max-w-content px-6 py-10">
        <h2 className="text-xl font-bold text-navy">FAQs</h2>
        <div className="mt-6 max-w-3xl">
          <FaqAccordion faqs={service.faqs} />
        </div>
      </section>

      <StandardCTA />
    </>
  );
}
