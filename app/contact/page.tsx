import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { ContactForm } from "@/components/ContactForm";
import { SITE_URL } from "@/lib/utils";

export const metadata: Metadata = buildMetadata("contact", "/contact");

const nextSteps = [
  "Pick a date and time that suits you",
  "Tell us a little about your business",
  "Your call is confirmed straight away, no back-and-forth",
  "If there's a fit, you get a clear proposal within 48 hours",
];

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      "@id": `${SITE_URL}/contact#webpage`,
      url: `${SITE_URL}/contact`,
      name: "Contact The Digital Dude | Book a Technical Strategy Consultation",
      description: "Directly schedule a 30-minute technical discovery call or submit project requirements for custom software engineering.",
      isPartOf: {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        name: "The Digital Dude",
        url: SITE_URL,
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
          name: "Contact",
          item: `${SITE_URL}/contact`,
        },
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}#service`,
      name: "The Digital Dude",
      url: SITE_URL,
      email: "info@digitaldude.co.uk",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "Discovery Consultations & Client Enquiries",
        email: "info@digitaldude.co.uk",
        url: `${SITE_URL}/contact`,
        availableLanguage: ["English"],
        hoursAvailable: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          opens: "08:00",
          closes: "18:00",
        },
      },
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Let&rsquo;s talk about how your business runs
          </h1>
          <p className="mt-4 text-lg text-navy/70">
            Pick a time that suits you and tell us a little about your business. No pitch, no
            pressure, no waiting for a reply.
          </p>

          <div className="mt-10">
            <ContactForm />
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-tint bg-lavender p-6">
            <h2 className="font-bold text-navy">What happens next</h2>
            <ol className="mt-4 list-none space-y-3">
              {nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3 text-sm text-navy/70">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8">
            <h2 className="font-bold text-navy">Other ways to reach us</h2>
            <p className="mt-3 text-sm text-navy/70">
              <a href="mailto:info@digitaldude.co.uk" className="font-semibold text-purple">
                info@digitaldude.co.uk
              </a>{" "}
              ·{" "}
              <a
                href="https://www.linkedin.com/company/td-dude"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple"
              >
                LinkedIn
              </a>
            </p>
            <p className="mt-3 text-sm text-navy/70">
              Prefer Google Calendar directly?{" "}
              <a
                href="https://calendar.app.google/KxYSGddA1FNWojHr8"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple underline"
              >
                Open Google Appointment Schedule &rarr;
              </a>
            </p>
          </div>

          <div className="mt-8">
            <h2 className="font-bold text-navy">Company</h2>
            <p className="mt-3 text-sm text-navy/70">
              The Digital Dude, UK-registered. Team based in Dhaka, Bangladesh.
            </p>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
