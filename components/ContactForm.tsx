"use client";

import { useEffect, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";

const countries = ["Australia", "United Kingdom", "Bangladesh", "Other"];
const teamSizes = ["1 to 4", "5 to 20", "21 to 50", "51 to 200", "200+"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function maxDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 21);
  return d.toISOString().slice(0, 10);
}

function formatSlotTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatSlotDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ContactForm() {
  const [date, setDate] = useState(todayIso());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [confirmedSlot, setConfirmedSlot] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError("");
    setSelectedSlot(null);

    fetch(`/api/availability?date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (!data.ok) {
          setSlotsError(data.error || "Could not load available times.");
          setSlots([]);
        } else {
          setSlots(data.slots || []);
        }
      })
      .catch(() => {
        if (!cancelled) setSlotsError("Could not load available times.");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) return;

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
      slotStart: selectedSlot,
    };

    try {
      const res = await fetch("/api/book", {
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
      setConfirmedSlot(data.slotStart || selectedSlot);
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
          Thanks, {firstName}. Your call is booked for{" "}
          <strong>{confirmedSlot ? formatSlotDateTime(confirmedSlot) : "the selected time"}</strong>.
          We&rsquo;ve sent the details to our team, and you&rsquo;ll hear from us before then. If
          it&rsquo;s urgent, email{" "}
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
        <label htmlFor="date" className="block text-sm font-semibold text-navy">
          Pick a date
        </label>
        <input
          id="date"
          type="date"
          value={date}
          min={todayIso()}
          max={maxDateIso()}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-black/10 px-4 py-2.5 focus:border-purple focus:outline-none"
        />
      </div>

      <div>
        <span className="block text-sm font-semibold text-navy">Pick a time</span>
        {slotsLoading && <p className="mt-2 text-sm text-navy/50">Loading available times…</p>}
        {!slotsLoading && slotsError && <p className="mt-2 text-sm text-red-600">{slotsError}</p>}
        {!slotsLoading && !slotsError && slots.length === 0 && (
          <p className="mt-2 text-sm text-navy/50">
            No times available that day. Try another date.
          </p>
        )}
        {!slotsLoading && slots.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  "rounded-lg border px-2 py-2 text-sm font-medium transition",
                  selectedSlot === slot
                    ? "border-purple bg-purple text-white"
                    : "border-black/10 bg-white text-navy hover:border-purple"
                )}
              >
                {formatSlotTime(slot)}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSlot && (
        <>
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
            {status === "submitting"
              ? "Booking…"
              : `Confirm ${formatSlotTime(selectedSlot)} on ${new Date(selectedSlot).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
          </button>
        </>
      )}

      <p className="text-xs text-navy/50">
        Times shown in your local time zone. Your details are only used to get back to you.
      </p>
    </form>
  );
}
