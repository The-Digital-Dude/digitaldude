"use client";

import { useState, type FormEvent } from "react";

const countries = ["Australia", "United Kingdom", "Bangladesh", "Other"];
const teamSizes = ["1 to 4", "5 to 20", "21 to 50", "51 to 200", "200+"];

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [firstName, setFirstName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: form.get("name"),
      workEmail: form.get("workEmail"),
      companyName: form.get("companyName"),
      country: form.get("country"),
      teamSize: form.get("teamSize"),
      message: form.get("message"),
      company: form.get("company"), // honeypot
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        return;
      }

      setFirstName(data.firstName || String(payload.name).split(" ")[0]);
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-tint bg-lavender p-8">
        <p className="text-navy">
          Thanks, {firstName}. We&rsquo;ve got your message. Farhad will reply within one working
          day with a few times for a call. If it&rsquo;s urgent, email{" "}
          <a href="mailto:info@digitaldude.co.uk" className="font-semibold text-purple">
            info@digitaldude.co.uk
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Hidden spam trap instead of a CAPTCHA */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-navy">
          Your name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-4 py-2.5 focus:border-purple focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="workEmail" className="block text-sm font-semibold text-navy">
          Work email
        </label>
        <input
          id="workEmail"
          name="workEmail"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-4 py-2.5 focus:border-purple focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="companyName" className="block text-sm font-semibold text-navy">
          Company name
        </label>
        <input
          id="companyName"
          name="companyName"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-4 py-2.5 focus:border-purple focus:outline-none"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="country" className="block text-sm font-semibold text-navy">
            Country
          </label>
          <select
            id="country"
            name="country"
            required
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-black/10 px-4 py-2.5 focus:border-purple focus:outline-none"
          >
            <option value="" disabled>
              Select a country
            </option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="teamSize" className="block text-sm font-semibold text-navy">
            Team size
          </label>
          <select
            id="teamSize"
            name="teamSize"
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-black/10 px-4 py-2.5 focus:border-purple focus:outline-none"
          >
            <option value="">Select a range</option>
            {teamSizes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-navy">
          What would you like to fix?
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={3}
          placeholder="For example: we manage bookings on spreadsheets and WhatsApp, and jobs keep slipping through."
          className="mt-1 w-full rounded-lg border border-black/10 px-4 py-2.5 focus:border-purple focus:outline-none"
        />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{errorMessage}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-purple py-3 font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending…" : "Send and book a call"}
      </button>

      <p className="text-xs text-navy/50">
        We reply within one working day. Your details are only used to get back to you.
      </p>
    </form>
  );
}
