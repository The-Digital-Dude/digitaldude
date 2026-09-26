"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { nextAvailableDateIso, BOOKING_WINDOW_DAYS } from "@/lib/availability";
import {
  Calendar as CalendarIcon,
  Clock,
  Globe,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Video,
  Sparkles,
  Building,
  Mail,
  User,
  ShieldCheck,
  CalendarPlus,
  Download,
  AlertCircle
} from "lucide-react";

const countries = [
  "Australia",
  "United Kingdom",
  "United States",
  "Canada",
  "New Zealand",
  "Singapore",
  "Germany",
  "United Arab Emirates",
  "Bangladesh",
  "Other"
];

const teamSizes = [
  "1 to 4 people",
  "5 to 20 people",
  "21 to 50 people",
  "51 to 200 people",
  "200+ people"
];

const systemTypes = [
  { id: "crm", label: "Custom CRM System", desc: "Leads, multi-portal dispatch, pipelines & field apps" },
  { id: "saas", label: "SaaS Product / MVP", desc: "Multi-tenant architecture, Stripe billing & portals" },
  { id: "marketplace", label: "3-Sided Marketplace", desc: "Customer app, provider mobile app & admin CRM" },
  { id: "erp", label: "ERP & HRM Operations", desc: "Staffing, payroll, inventory & multi-branch tracking" },
  { id: "webapp", label: "High-Performance Web App", desc: "Next.js web application & conversion overhaul" },
  { id: "other", label: "Other Bespoke Software", desc: "Custom APIs, automations & workflow software" }
];

const timelines = [
  "Immediate (< 1 month)",
  "1 to 3 months",
  "3 to 6 months",
  "Flexible / Planning Stage"
];

const commonTimezones = [
  "Europe/London",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Dhaka",
  "UTC"
];

function maxDateIso() {
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const maxUtc = new Date(todayUtc.getTime() + BOOKING_WINDOW_DAYS * 86400000);
  return maxUtc.toISOString().slice(0, 10);
}

export function ContactForm() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Qualification State
  const [systemType, setSystemType] = useState<string>("crm");
  const [teamSize, setTeamSize] = useState<string>("5 to 20 people");
  const [timeline, setTimeline] = useState<string>("1 to 3 months");

  // Step 2: Calendar & Timezone State
  const [userTimezone, setUserTimezone] = useState<string>("UTC");
  const [date, setDate] = useState(nextAvailableDateIso());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Step 3: Contact Details
  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("United Kingdom");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");

  // Submission State
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmedData, setConfirmedData] = useState<{
    firstName: string;
    slotStart: string;
    meetUrl?: string | null;
  } | null>(null);

  // Detect user's timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setUserTimezone(detected);
        if (detected.includes("Australia")) setCountry("Australia");
        else if (detected.includes("London") || detected.includes("Europe")) setCountry("United Kingdom");
        else if (detected.includes("America")) setCountry("United States");
      }
    } catch {
      setUserTimezone("Europe/London");
    }
  }, []);

  // Fetch slots whenever the selected date changes
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

  // Format time in user's selected timezone
  const formatSlotTime = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: userTimezone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }
  };

  const formatFullDate = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("en-GB", {
        timeZone: userTimezone,
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(iso));
    } catch {
      return new Date(iso).toLocaleDateString();
    }
  };

  // Google Calendar URL generator
  const googleCalendarUrl = useMemo(() => {
    if (!confirmedData?.slotStart) return "";
    const start = new Date(confirmedData.slotStart);
    const end = new Date(start.getTime() + 30 * 60000);
    const startIso = start.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = end.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const title = encodeURIComponent(`The Digital Dude Discovery Call — ${companyName || "Project"}`);
    const details = encodeURIComponent(
      `30-Minute Technical Discovery & Architecture Call with The Digital Dude.\n\nMeeting link: ${confirmedData.meetUrl || "Google Meet"}\n\nTopics: System requirements, architecture blueprint, delivery timelines, and fixed scope proposal.`
    );
    const location = encodeURIComponent(confirmedData.meetUrl || "Google Meet Video Call");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  }, [confirmedData, companyName]);

  // Download .ics File
  const handleDownloadIcs = () => {
    if (!confirmedData?.slotStart) return;
    const start = new Date(confirmedData.slotStart);
    const end = new Date(start.getTime() + 30 * 60000);
    const formatIcsDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//The Digital Dude//Discovery Call//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:REQUEST",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@digitaldude.co.uk`,
      `DTSTAMP:${formatIcsDate(new Date())}`,
      `DTSTART:${formatIcsDate(start)}`,
      `DTEND:${formatIcsDate(end)}`,
      `SUMMARY:The Digital Dude Discovery Call — ${companyName || "Project"}`,
      `DESCRIPTION:30-Minute Technical Discovery Call with The Digital Dude.\\nMeeting Room: ${confirmedData.meetUrl || "Google Meet"}`,
      `LOCATION:${confirmedData.meetUrl || "Google Meet Video Call"}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "digital-dude-discovery-call.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNextStep1 = () => {
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (!selectedSlot) return;
    setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !name.trim() || !workEmail.trim() || !companyName.trim()) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const fullMessage = [
      `[System Type]: ${systemTypes.find((s) => s.id === systemType)?.label || systemType}`,
      `[Team Size]: ${teamSize}`,
      `[Target Timeline]: ${timeline}`,
      `[Client Timezone]: ${userTimezone}`,
      message ? `\n[Project Scope / Details]:\n${message}` : "",
    ].join("\n");

    const payload = {
      name,
      workEmail,
      companyName,
      country,
      teamSize,
      message: fullMessage,
      slotStart: selectedSlot,
      company: honeypot,
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
        setErrorMessage(data.error || "Could not complete your booking. Please try another time slot.");
        return;
      }

      setConfirmedData({
        firstName: data.firstName || name.split(" ")[0],
        slotStart: data.slotStart || selectedSlot,
        meetUrl: data.meetUrl,
      });
      setStatus("success");
      setCurrentStep(4);
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try submitting again.");
    }
  };

  // Step 4: Success View
  if (currentStep === 4 && confirmedData) {
    return (
      <div className="rounded-3xl border border-purple/20 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
            <CheckCircle2 size={26} />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-navy">
              Discovery Call Confirmed, {confirmedData.firstName}!
            </h2>
            <p className="text-xs sm:text-sm text-navy/60">
              A calendar invite and meeting link have been reserved for you.
            </p>
          </div>
        </div>

        {/* Meeting Details Card */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3.5">
          <div className="flex items-center gap-3 text-sm text-navy">
            <CalendarIcon size={18} className="text-purple flex-shrink-0" />
            <div>
              <span className="font-bold">{formatFullDate(confirmedData.slotStart)}</span>
              <span className="block text-xs text-navy/60">
                {formatSlotTime(confirmedData.slotStart)} ({userTimezone}) · 30 min discovery call
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-navy">
            <Building size={18} className="text-purple flex-shrink-0" />
            <span>{companyName}</span>
          </div>

          {confirmedData.meetUrl && (
            <div className="pt-2 border-t border-slate-200">
              <a
                href={confirmedData.meetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110 shadow-xs"
              >
                <Video size={15} /> Open Google Meet Video Room
              </a>
            </div>
          )}
        </div>

        {/* 1-Click Calendar Add Actions */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-navy/60">
            Add to your personal calendar:
          </p>
          <div className="flex flex-wrap gap-2.5">
            {googleCalendarUrl && (
              <a
                href={googleCalendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/80 hover:bg-slate-50 hover:text-purple shadow-xs transition"
              >
                <CalendarPlus size={15} className="text-purple" />
                Add to Google Calendar
              </a>
            )}

            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/80 hover:bg-slate-50 hover:text-purple shadow-xs transition"
            >
              <Download size={15} className="text-purple" />
              Download .ics (Outlook / Apple)
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs text-navy/60 leading-relaxed">
            Need to reschedule or add colleagues? Check the confirmation email sent to{" "}
            <strong className="text-navy">{workEmail}</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8 shadow-sm">
      {/* Wizard Progress Bar */}
      <div className="mb-8 border-b border-slate-100 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                currentStep >= 1 ? "bg-purple text-white" : "bg-slate-100 text-navy/40"
              )}
            >
              1
            </span>
            <span className={cn("text-xs font-semibold hidden sm:inline", currentStep === 1 ? "text-navy" : "text-navy/50")}>
              Project Scope
            </span>
          </div>

          <div className="h-[2px] w-8 sm:w-12 bg-slate-200 mx-1" />

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                currentStep >= 2 ? "bg-purple text-white" : "bg-slate-100 text-navy/40"
              )}
            >
              2
            </span>
            <span className={cn("text-xs font-semibold hidden sm:inline", currentStep === 2 ? "text-navy" : "text-navy/50")}>
              Date &amp; Time
            </span>
          </div>

          <div className="h-[2px] w-8 sm:w-12 bg-slate-200 mx-1" />

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition",
                currentStep >= 3 ? "bg-purple text-white" : "bg-slate-100 text-navy/40"
              )}
            >
              3
            </span>
            <span className={cn("text-xs font-semibold hidden sm:inline", currentStep === 3 ? "text-navy" : "text-navy/50")}>
              Contact Details
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm flex items-center gap-2.5">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Project Scope & Qualification */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Step 1 of 3</span>
            <h2 className="text-xl sm:text-2xl font-bold text-navy mt-1">What are you looking to build?</h2>
            <p className="text-xs sm:text-sm text-navy/60 mt-1">
              Select the system architecture that best aligns with your business goals.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {systemTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSystemType(item.id)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition relative flex flex-col justify-between",
                  systemType === item.id
                    ? "border-purple bg-purple/5 shadow-xs ring-1 ring-purple"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                )}
              >
                <div>
                  <h3 className="text-sm font-bold text-navy">{item.label}</h3>
                  <p className="text-xs text-navy/60 mt-1 leading-normal">{item.desc}</p>
                </div>
                {systemType === item.id && (
                  <CheckCircle2 size={16} className="text-purple absolute top-3.5 right-3.5" />
                )}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1.5">
                <Users size={14} className="text-purple" />
                Current Team Size
              </label>
              <select
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-navy outline-none focus:border-purple"
              >
                {teamSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-purple" />
                Target Timeline
              </label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-navy outline-none focus:border-purple"
              >
                {timelines.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={handleNextStep1}
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-3 text-xs font-bold text-white transition hover:bg-purple/90 shadow-xs"
            >
              Select Meeting Time <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Timezone-Aware Calendar & Slot Picker */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple">Step 2 of 3</span>
              <h2 className="text-xl sm:text-2xl font-bold text-navy mt-1">Pick a date &amp; time</h2>
            </div>

            {/* Timezone Switcher */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
              <Globe size={13} className="text-purple flex-shrink-0" />
              <select
                value={userTimezone}
                onChange={(e) => setUserTimezone(e.target.value)}
                className="bg-transparent text-xs font-semibold text-navy outline-none cursor-pointer"
              >
                {commonTimezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace("_", " ")}
                  </option>
                ))}
                {!commonTimezones.includes(userTimezone) && (
                  <option value={userTimezone}>{userTimezone.replace("_", " ")}</option>
                )}
              </select>
            </div>
          </div>

          {/* Date Picker Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-purple" />
              Select Date (Mon–Fri)
            </label>
            <input
              type="date"
              value={date}
              min={nextAvailableDateIso()}
              max={maxDateIso()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-navy outline-none focus:border-purple"
            />
          </div>

          {/* Slots View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70">
                Available Times on {formatFullDate(date)}:
              </label>
              <span className="text-[11px] font-semibold text-purple">30 min call</span>
            </div>

            {slotsLoading && (
              <div className="py-8 text-center text-xs text-navy/50">
                Loading available appointment times…
              </div>
            )}

            {!slotsLoading && slotsError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs">{slotsError}</div>
            )}

            {!slotsLoading && !slotsError && slots.length === 0 && (
              <div className="py-8 text-center text-xs text-navy/50 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No slots available on this date. Please pick another business day above.
              </div>
            )}

            {!slotsLoading && !slotsError && slots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-semibold transition text-center",
                        isSelected
                          ? "border-purple bg-purple text-white shadow-xs"
                          : "border-slate-200 bg-slate-50/70 text-navy hover:border-purple hover:bg-white"
                      )}
                    >
                      {formatSlotTime(slot)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy/60 hover:text-navy"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              type="button"
              disabled={!selectedSlot}
              onClick={handleNextStep2}
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-3 text-xs font-bold text-white transition hover:bg-purple/90 shadow-xs disabled:opacity-40"
            >
              Next: Your Contact Details <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Contact & Business Details */}
      {currentStep === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-purple">Step 3 of 3</span>
            <h2 className="text-xl sm:text-2xl font-bold text-navy mt-1">Your details</h2>
            <p className="text-xs sm:text-sm text-navy/60 mt-1">
              Confirm your booking for <strong className="text-navy">{selectedSlot && formatSlotTime(selectedSlot)}</strong> on {selectedSlot && formatFullDate(selectedSlot)}.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1">
                <User size={13} className="text-purple" /> Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1">
                <Mail size={13} className="text-purple" /> Work Email *
              </label>
              <input
                type="email"
                required
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="alex@company.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1">
                <Building size={13} className="text-purple" /> Company Name *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Morgan Logistics Ltd"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5 flex items-center gap-1">
                <Globe size={13} className="text-purple" /> Country *
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-navy outline-none focus:border-purple"
              >
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1.5">
              What operational problem are you looking to solve? (Optional)
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Currently tracking 500+ jobs in Google Sheets and dispatching over WhatsApp. Looking to replace with a custom web portal."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white leading-relaxed"
            />
          </div>

          {/* Hidden Honeypot */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
          />

          <div className="pt-3 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy/60 hover:text-navy"
            >
              <ArrowLeft size={14} /> Back
            </button>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-3 text-xs font-bold text-white transition hover:bg-purple/90 shadow-xs disabled:opacity-50"
            >
              <Sparkles size={14} />
              {status === "submitting" ? "Confirming Booking…" : "Confirm Discovery Call"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
