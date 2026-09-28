"use client";

import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Mail,
  Video,
  Calendar,
  Sparkles,
  Upload,
  Link as LinkIcon,
  Star,
  Send,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { Scorecard, Application } from "@/app/admin/applications/page";

interface JobOption {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (app: Application) => void;
}

const STAGES = ["new", "reviewing", "interview", "offered", "hired", "rejected"];

function getTemplateDefaults(status: string, name: string, roleTitle: string) {
  const first = name.trim().split(/\s+/)[0] || "there";
  const role = roleTitle || "the role";
  switch (status) {
    case "interview":
      return {
        subject: `Interview Invitation — ${role} at The Digital Dude`,
        message: `Hi ${first},\n\nWe were very impressed by your background and assessment for the ${role} position, and we would love to invite you to an interview with our team.\n\nPlease find your Google Meet interview room link below. Looking forward to our discussion!`,
      };
    case "offered":
      return {
        subject: `Job Offer — ${role} at The Digital Dude`,
        message: `Dear ${first},\n\nCongratulations! We are delighted to extend an offer for the ${role} position at The Digital Dude.\n\nOur leadership team will follow up directly with the formal agreement, compensation milestones, and onboarding schedule.`,
      };
    case "rejected":
      return {
        subject: `Update regarding your application for ${role}`,
        message: `Dear ${first},\n\nThank you for your interest in the ${role} role at The Digital Dude.\n\nWhile your experience is commendable, we have decided to proceed with other candidates whose background more closely matches our immediate operational needs.\n\nWe appreciate your time and wish you the best in your career pursuits.`,
      };
    case "reviewing":
      return {
        subject: `Application Status Update — ${role}`,
        message: `Hi ${first},\n\nYour application for ${role} is currently under active review by our team. We will be in touch shortly with next steps.`,
      };
    default:
      return {
        subject: `Application received — ${role}`,
        message: `Hi ${first},\n\nThank you for applying for the ${role} position at The Digital Dude. We review every profile personally and will be in touch with next steps.`,
      };
  }
}

function StarRating({
  value = 0,
  onChange,
  size = 15,
}: {
  value?: number;
  onChange: (val: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className="cursor-pointer hover:scale-110 transition-transform p-0.5"
        >
          <Star
            size={size}
            className={`${
              star <= (value || 0)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-200 hover:text-slate-300"
            }`}
          />
        </button>
      ))}
      <span className="ml-1.5 text-xs font-bold text-navy/70">
        {value ? `${value}/5` : "—"}
      </span>
    </div>
  );
}

export function AddCandidateModal({
  isOpen,
  onClose,
  onCreated,
}: AddCandidateModalProps) {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [jobPostingId, setJobPostingId] = useState("");
  const [status, setStatus] = useState("interview");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUrl, setCvUrl] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [writtenTestResponse, setWrittenTestResponse] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  // Scorecard State
  const [scorecard, setScorecard] = useState<Scorecard>({
    written_test: 0,
    experience: 0,
    communication: 0,
    overall: 0,
  });

  // Dynamic Email & Google Meet State
  const [sendEmail, setSendEmail] = useState(true);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [interviewDate, setInterviewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(14, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [meetingLink, setMeetingLink] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [generatingMeet, setGeneratingMeet] = useState(false);
  const [meetGenerated, setMeetGenerated] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch active job postings
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const list = data.jobs || [];
          setJobs(list);
          if (list.length > 0 && !jobPostingId) {
            setJobPostingId(list[0].id);
          }
        }
      })
      .catch(() => {});
  }, [isOpen, jobPostingId]);

  // Dynamically update default email copy when status, name, or role changes
  useEffect(() => {
    const selectedJob = jobs.find((j) => j.id === jobPostingId);
    const roleTitle = selectedJob?.title || "Role";
    const defaults = getTemplateDefaults(status, applicantName, roleTitle);
    setEmailSubject(defaults.subject);
    setEmailMessage(defaults.message);
    setSendEmail(["interview", "offered", "reviewing", "rejected"].includes(status));
  }, [status, applicantName, jobPostingId, jobs]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedJob = jobs.find((j) => j.id === jobPostingId);
  const roleTitle = selectedJob?.title || "General Opening";

  async function handleGenerateMeet() {
    if (!applicantName || !applicantEmail) {
      alert("Please fill in candidate Name and Email first.");
      return;
    }
    if (!interviewDate) {
      alert("Please select an interview date & time.");
      return;
    }

    setGeneratingMeet(true);
    try {
      const res = await fetch("/api/admin/interviews/meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: applicantName,
          candidateEmail: applicantEmail,
          jobTitle: roleTitle,
          slotStart: new Date(interviewDate).toISOString(),
          notes: internalNotes || writtenTestResponse,
        }),
      });

      const data = await res.json();
      if (data.ok && data.meetUrl) {
        setMeetingLink(data.meetUrl);
        setMeetGenerated(true);
        // Automatically insert into email message if not already present
        if (!emailMessage.includes(data.meetUrl)) {
          setEmailMessage(
            (prev) => `${prev}\n\nGoogle Meet Room: ${data.meetUrl}\nScheduled Time: ${new Date(interviewDate).toLocaleString()}`
          );
        }
      } else {
        alert(data.error || "Could not generate Google Meet link. Make sure Google OAuth is connected.");
      }
    } catch {
      alert("Network error generating Google Meet link.");
    } finally {
      setGeneratingMeet(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");

    if (!applicantName.trim() || !applicantEmail.trim()) {
      setErrorMessage("Please enter both Candidate Name and Email.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("applicantName", applicantName.trim());
      formData.append("applicantEmail", applicantEmail.trim().toLowerCase());
      formData.append("applicantPhone", applicantPhone.trim());
      formData.append("jobPostingId", jobPostingId);
      formData.append("status", status);
      formData.append("writtenTestResponse", writtenTestResponse.trim());
      formData.append("internalNotes", internalNotes.trim());
      formData.append("scorecard", JSON.stringify(scorecard));
      formData.append("sendEmail", sendEmail ? "true" : "false");
      formData.append("emailSubject", emailSubject.trim());
      formData.append("emailMessage", emailMessage.trim());
      formData.append("interviewBookingUrl", bookingUrl.trim());
      formData.append("interviewDate", interviewDate);
      formData.append("meetingLink", meetingLink.trim());

      if (cvFile) formData.append("cv", cvFile);
      if (cvUrl) formData.append("cvUrl", cvUrl.trim());
      if (proofFile) formData.append("proofOfResults", proofFile);

      const res = await fetch("/api/admin/applications", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.error || "Failed to create candidate.");
      }

      onCreated(data.application);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving candidate.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4.5 sm:px-8 bg-white shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-purple/10 px-2.5 py-1 text-xs font-bold text-purple">
              <UserPlus size={13} />
              <span>Recruiting &amp; Talent Acquisition</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-navy mt-1">Add Candidate Manually</h2>
            <p className="text-xs text-navy/60">
              Create an offline applicant, referred talent, or headhunted candidate with dynamic email dispatch &amp; Google Meet scheduling.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-navy/40 hover:bg-slate-100 hover:text-navy transition shrink-0 ml-4"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-8 space-y-5">
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">
                {errorMessage}
              </div>
            )}
          {/* Row 1: Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Candidate Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Tariq Ahmed"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                placeholder="e.g. tariq@gmail.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="text"
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                placeholder="+880 1700-000000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Row 2: Target Role & Initial Stage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Target Role / Job Opening
              </label>
              <select
                value={jobPostingId}
                onChange={(e) => setJobPostingId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-bold text-navy outline-none focus:border-purple focus:bg-white"
              >
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Initial Pipeline Stage
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                      status === s
                        ? "bg-purple text-white shadow-xs"
                        : "border border-slate-200 bg-slate-50 text-navy/60 hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Resume / CV Upload & External Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1 flex items-center gap-1">
                <Upload size={13} /> Attach CV / Resume File (PDF/Word/Image)
              </label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,image/png,image/jpeg,image/webp"
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-purple/10 file:px-2.5 file:py-1 file:text-xs file:font-bold file:text-purple hover:file:bg-purple/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1 flex items-center gap-1">
                <LinkIcon size={13} /> Or Portfolio / LinkedIn / Google Drive URL
              </label>
              <input
                type="url"
                value={cvUrl}
                onChange={(e) => setCvUrl(e.target.value)}
                placeholder="https://linkedin.com/in/username or portfolio link"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Row 4: Assessment Response & Internal Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Written Test Response / Pitch Sample
              </label>
              <textarea
                rows={3}
                value={writtenTestResponse}
                onChange={(e) => setWrittenTestResponse(e.target.value)}
                placeholder="Sample cold message or test pitch submitted by candidate..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy font-mono leading-relaxed outline-none focus:border-purple focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-navy/70 mb-1">
                Internal Hiring Notes
              </label>
              <textarea
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Initial screening notes, referral background, compensation discussions..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
              />
            </div>
          </div>

          {/* Optional Quick Scorecard Evaluation */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" /> Initial Candidate Scorecard (Optional)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Written Test</span>
                <StarRating
                  value={scorecard.written_test}
                  onChange={(v) => setScorecard((sc) => ({ ...sc, written_test: v }))}
                />
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Experience</span>
                <StarRating
                  value={scorecard.experience}
                  onChange={(v) => setScorecard((sc) => ({ ...sc, experience: v }))}
                />
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Communication</span>
                <StarRating
                  value={scorecard.communication}
                  onChange={(v) => setScorecard((sc) => ({ ...sc, communication: v }))}
                />
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <span className="block text-[10px] font-bold uppercase text-navy/60 mb-1">Overall Rating</span>
                <StarRating
                  value={scorecard.overall}
                  onChange={(v) => setScorecard((sc) => ({ ...sc, overall: v }))}
                />
              </div>
            </div>
          </div>

          {/* Dynamic Candidate Email & Google Meet Dispatch */}
          <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <Mail size={14} className="text-purple" /> Dynamic Candidate Status Email
                </span>
                <p className="text-[11px] text-navy/60">
                  Notify candidate of their initial stage ({status}) with a personalized branded email.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple"></div>
              </label>
            </div>

            {sendEmail && (
              <div className="pt-3 border-t border-purple/15 space-y-3.5 animate-in fade-in duration-200">
                {/* Google Meet & Interview Scheduling if stage is interview */}
                {status === "interview" && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Video size={14} className="text-blue-600" /> Google Meet Interview Generator
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1 flex items-center gap-1">
                          <Calendar size={12} /> Interview Date &amp; Time
                        </label>
                        <input
                          type="datetime-local"
                          value={interviewDate}
                          onChange={(e) => setInterviewDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-navy outline-none focus:border-purple"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1 flex items-center gap-1">
                          <Video size={12} /> Google Meet Video Room URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={meetingLink}
                            onChange={(e) => setMeetingLink(e.target.value)}
                            placeholder="https://meet.google.com/xxx-yyyy-zzz"
                            className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono text-navy outline-none focus:border-purple"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateMeet}
                            disabled={generatingMeet}
                            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-2xs shrink-0"
                          >
                            {generatingMeet ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : meetGenerated ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <Video size={13} />
                            )}
                            {generatingMeet ? "Creating…" : meetGenerated ? "Regenerate" : "Generate Meet"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-navy font-semibold outline-none focus:border-purple shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1">
                    Email Message Content
                  </label>
                  <textarea
                    rows={5}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-navy font-mono leading-relaxed outline-none focus:border-purple shadow-xs"
                  />
                </div>
              </div>
            )}
          </div>

          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 sm:px-8 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy/70 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-md transition disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <UserPlus size={14} />
              )}
              {submitting
                ? "Creating Candidate…"
                : sendEmail
                ? `Create Candidate & Send Email`
                : `Create Candidate (Silently)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
