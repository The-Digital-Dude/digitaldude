import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = buildMetadata("contact", "/contact");

const nextSteps = [
  "You send the form",
  "We reply within one working day with times that suit your time zone",
  "A 30-minute call with Farhad about your business",
  "If there's a fit, you get a clear proposal within 48 hours",
];

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
        <div>
          <h1 className="text-3xl font-bold text-navy sm:text-4xl">
            Let&rsquo;s talk about how your business runs
          </h1>
          <p className="mt-4 text-lg text-navy/70">
            Book a 30-minute call with our founder, Farhad. We&rsquo;ll talk about how things work
            today, where they get stuck, and whether a system would help. No pitch, no pressure.
          </p>

          <div className="mt-10">
            <ContactForm />
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-tint bg-lavender p-6">
            <h2 className="font-bold text-navy">What happens next</h2>
            <ol className="mt-4 space-y-3">
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
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-purple"
              >
                LinkedIn
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
  );
}
