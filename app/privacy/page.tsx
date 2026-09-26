import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/content/seo";

export const metadata: Metadata = buildMetadata("privacy", "/privacy");

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">Privacy policy</h1>
      <p className="mt-4 text-sm text-navy/50">
        Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
        This policy describes how our website actually works. It has not been reviewed by a
        solicitor — have it checked before relying on it as your final legal document.
      </p>

      <div className="prose prose-slate mt-10 max-w-3xl space-y-8 text-navy/70">
        <div>
          <h2 className="text-lg font-bold text-navy">Who we are</h2>
          <p className="mt-2">
            The Digital Dude ("we", "us", "our") is a UK-registered software development company.
            Our team works from Dhaka, Bangladesh, and we build systems for clients in Australia,
            the UK and Bangladesh. You can reach us at{" "}
            <a href="mailto:info@digitaldude.co.uk" className="font-semibold text-purple">
              info@digitaldude.co.uk
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">What we collect, and why</h2>
          <p className="mt-2">
            When you book a call on this site, we collect your name, work email, company name,
            country, team size, the message you send us, and the date and time you choose. We use
            this to reply to you, schedule and run the call, and, if you become a client, to
            deliver our services.
          </p>
          <p className="mt-2">
            We also use Google Analytics to see how visitors use the site (pages viewed, general
            location, device type). This uses cookies. We don't currently show a cookie consent
            banner before Analytics loads — if you're visiting from the UK or EU, be aware
            analytics cookies are set on your first visit.
          </p>
          <p className="mt-2">We don't collect payment details on this website.</p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Who we share it with</h2>
          <p className="mt-2">
            We use a small number of other companies to run this site and deliver bookings. Each
            only receives what it needs to do its job:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> stores your booking details in our database.
            </li>
            <li>
              <strong>Brevo</strong> sends the confirmation email to you and the notification email
              to our team.
            </li>
            <li>
              <strong>Google</strong> hosts the calendar event and video call (Google Meet) for
              your booking, so Google receives your name, email and the call time as an attendee
              on that event.
            </li>
            <li>
              <strong>Google Analytics</strong> processes anonymised usage statistics about how the
              site is used.
            </li>
          </ul>
          <p className="mt-2">
            We don't sell your information, and we don't share it with anyone else for marketing.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Where it's processed</h2>
          <p className="mt-2">
            These providers may store or process data outside your own country, including in the
            UK, the EU and the US. Where that happens, each provider maintains its own safeguards
            for handling data across borders (for example, standard contractual clauses).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">How long we keep it</h2>
          <p className="mt-2">
            We keep booking and enquiry details for as long as we're in an active conversation or
            working relationship with you, and for a reasonable period afterwards in case you get
            back in touch or we need it for our own accounting or legal obligations. You can ask us
            to delete it sooner at any time — see "Your rights" below.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Your rights</h2>
          <p className="mt-2">
            Depending on where you live, you may have the right to ask us to show you what we hold
            about you, correct it, delete it, or stop using it for certain purposes. To ask us
            anything about your data, email{" "}
            <a href="mailto:info@digitaldude.co.uk" className="font-semibold text-purple">
              info@digitaldude.co.uk
            </a>
            . If you're in the UK and unhappy with how we've handled your request, you can also
            complain to the{" "}
            <a
              href="https://ico.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-purple"
            >
              Information Commissioner's Office (ICO)
            </a>
            .
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Security</h2>
          <p className="mt-2">
            We use providers with their own security measures (encryption in transit, access
            controls) to protect your data. No system is completely secure, but we don't hold more
            data than we need, and we don't store payment or government ID details on this site.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Children</h2>
          <p className="mt-2">
            This site and our services are intended for businesses, not children. We don't
            knowingly collect information from anyone under 18.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Changes to this policy</h2>
          <p className="mt-2">
            If how we handle your data changes, we'll update this page. Check back occasionally if
            you want to stay informed.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-navy">Company</h2>
          <p className="mt-2">
            The Digital Dude, UK-registered. Team based in Dhaka, Bangladesh. See our{" "}
            <Link href="/terms" className="font-semibold text-purple">
              terms and conditions
            </Link>{" "}
            for how using this website and booking a call works.
          </p>
        </div>
      </div>
    </section>
  );
}
