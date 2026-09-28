"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

export function JobApplicationForm({ jobSlug, jobTitle }: { jobSlug: string; jobTitle: string }) {
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [writtenTestResponse, setWrittenTestResponse] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cvFile) {
      setErrorMessage("Please attach your CV.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    const form = new FormData();
    form.append("jobSlug", jobSlug);
    form.append("applicantName", applicantName);
    form.append("applicantEmail", applicantEmail);
    form.append("applicantPhone", applicantPhone);
    form.append("writtenTestResponse", writtenTestResponse);
    form.append("cv", cvFile);
    if (proofFile) form.append("proofOfResults", proofFile);
    form.append("website", website);

    try {
      const res = await fetch("/api/apply", { method: "POST", body: form });
      const data = await res.json();
      if (!data.ok) {
        setErrorMessage(data.error || "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
        <h3 className="mt-3 text-lg font-bold text-navy">Application received</h3>
        <p className="mt-1 text-sm text-navy/70">
          Thanks for applying to {jobTitle}. We review every application personally and will be in touch if it&rsquo;s a fit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-navy">Apply for {jobTitle}</h3>

      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold text-navy mb-1">Full name</label>
          <input
            required
            value={applicantName}
            onChange={(e) => setApplicantName(e.target.value)}
            className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-purple"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-navy mb-1">Email</label>
          <input
            required
            type="email"
            value={applicantEmail}
            onChange={(e) => setApplicantEmail(e.target.value)}
            className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-purple"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">Phone (optional)</label>
        <input
          value={applicantPhone}
          onChange={(e) => setApplicantPhone(e.target.value)}
          className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-purple"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">CV / Resume (PDF, Word, or image, max 10MB)</label>
        <input
          required
          type="file"
          accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-purple"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">Proof of results (optional)</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
          onChange={(e) => setProofFile(e.target.files?.[0] || null)}
          className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-purple"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-navy mb-1">Written test response</label>
        <textarea
          required
          rows={5}
          value={writtenTestResponse}
          onChange={(e) => setWrittenTestResponse(e.target.value)}
          className="w-full rounded-xl border border-black/10 p-2.5 text-sm outline-none focus:border-purple"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-purple px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
      >
        {status === "submitting" && <Loader2 size={16} className="animate-spin" />}
        {status === "submitting" ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}
