import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/content/seo";

export const metadata: Metadata = buildMetadata("terms", "/terms");

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">Terms and conditions</h1>
      <p className="mt-4 text-sm text-navy/50">
        Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
        These terms cover using this website and booking a call. They have not been reviewed by a
        solicitor — have them checked before relying on them as your final legal document. They
        don't cover the terms of an actual project, which are set out in your own signed proposal
        or contract with us.
      </p>

      <div className="prose prose-slate mt-10 max-w-3xl space-y-8 text-navy/70">
        <div>
          <h2 className="text-lg font-bold text-navy">Who we are</h2>
          <p className="mt-2">
            This website, digitaldude.co.uk, is operated by The Digital Dude, a UK-registered
            company. Our team works from Dhaka, Bangladesh. Contact us at{" "}
            <a href="mailto:info@digitaldude.co.uk" className="font-semibold text-purple">
              info@digitaldude.co.uk
            </a>
            . By using this website, you accept these terms.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Using this website</h2>
          <p className="mt-2">
            This site is here to explain what we build, show our past work, and let you book a
            call with us. You can browse it and use the booking form for these purposes. You agree
            not to use the site in any way that could damage it, disrupt it for other visitors, or
            break the law.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Booking a call</h2>
          <p className="mt-2">
            Booking a 30-minute call through this site reserves time in our calendar — it isn't an
            order or a contract for any paid work. Nothing is charged to you for the call itself.
            If we agree there's a fit, any actual project only begins once we've both agreed and
            signed a separate proposal or contract setting out the scope, timeline and cost.
          </p>
          <p className="mt-2">
            Booking creates a Google Calendar event with a Google Meet link, and you'll receive a
            confirmation email. Need to reschedule or cancel? Just email{" "}
            <a href="mailto:info@digitaldude.co.uk" className="font-semibold text-purple">
              info@digitaldude.co.uk
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Accuracy of information</h2>
          <p className="mt-2">
            The statistics and results shown for our past projects (rentals managed, agencies,
            response times and similar) are real numbers from real projects. We keep client names
            and identifying details private by agreement, so projects are described by what they
            do rather than who they were built for. We try to keep the rest of the site accurate
            and up to date, but we don't guarantee it's error-free at every moment.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Intellectual property</h2>
          <p className="mt-2">
            The content on this site — text, design, logo and images — belongs to The Digital
            Dude unless stated otherwise. You're welcome to link to it, but please don't copy or
            reuse it without asking us first.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Other websites we link to</h2>
          <p className="mt-2">
            This site links to other places, like LinkedIn. We aren't responsible for the content
            or privacy practices of sites we don't run ourselves.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Liability</h2>
          <p className="mt-2">
            We provide this website as it is, and we don't promise it will always be available or
            fault-free. To the extent the law allows, we aren't liable for losses that come from
            using or being unable to use this website. Nothing in these terms limits liability
            where the law doesn't allow us to, such as for fraud or for death or personal injury
            caused by our negligence.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Changes to these terms</h2>
          <p className="mt-2">
            We may update these terms as the site or how we work changes. The version on this page
            is always the current one.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Governing law</h2>
          <p className="mt-2">These terms are governed by the laws of the United Kingdom.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Company</h2>
          <p className="mt-2">
            The Digital Dude, UK-registered. Team based in Dhaka, Bangladesh. See our{" "}
            <Link href="/privacy" className="font-semibold text-purple">
              privacy policy
            </Link>{" "}
            for how we handle your data.
          </p>
        </div>
      </div>
    </section>
  );
}
