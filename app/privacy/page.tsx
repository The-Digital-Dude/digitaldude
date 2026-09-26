import type { Metadata } from "next";
import { buildMetadata } from "@/lib/content/seo";

export const metadata: Metadata = buildMetadata("privacy", "/privacy");

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-content px-6 pb-20 pt-32 sm:pt-40">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">Privacy policy</h1>
      <p className="mt-4 text-sm text-navy/50">
        [This is placeholder legal copy. Replace with a policy reviewed by your legal advisor
        before launch — see the pre-launch checklist item "Privacy policy page written".]
      </p>

      <div className="prose prose-slate mt-10 max-w-3xl space-y-6 text-navy/70">
        <div>
          <h2 className="text-lg font-bold text-navy">What we collect</h2>
          <p className="mt-2">
            When you use our contact form, we collect your name, work email, company name,
            country, team size and the message you send us. We use this only to reply to your
            enquiry and, if you become a client, to deliver our services.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy">How we use it</h2>
          <p className="mt-2">
            We reply to your enquiry, and may follow up about the call you booked. We don&rsquo;t
            sell or share your details with third parties for marketing.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy">Where it&rsquo;s stored</h2>
          <p className="mt-2">
            Contact form submissions are stored securely in our database, hosted by Supabase.
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy">Your rights</h2>
          <p className="mt-2">
            You can ask us to see, correct or delete the information we hold about you at any time
            by emailing{" "}
            <a href="mailto:info@digitaldude.co.uk" className="font-semibold text-purple">
              info@digitaldude.co.uk
            </a>
            .
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold text-navy">Company</h2>
          <p className="mt-2">The Digital Dude, UK-registered. Team based in Dhaka, Bangladesh.</p>
        </div>
      </div>
    </section>
  );
}
