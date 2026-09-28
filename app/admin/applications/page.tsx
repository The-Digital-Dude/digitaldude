"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  RefreshCw,
  Search,
  FileText,
  Image as ImageIcon,
  X,
  UserPlus,
  Trash2,
  Download,
  Star,
  Mail,
  Calendar,
  Video,
  Send,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  Plus,
  ExternalLink,
} from "lucide-react";
import { AddCandidateModal } from "@/components/admin/AddCandidateModal";

export interface Scorecard {
  written_test?: number;
  experience?: number;
  communication?: number;
  overall?: number;
}

export interface Application {
  id: string;
  job_posting_id: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string | null;
  cv_path: string;
  proof_of_results_path: string | null;
  written_test_response: string;
  status: string;
  internal_notes: string;
  scorecard?: Scorecard;
  created_at: string;
  job_postings?: { title: string; slug: string };
}

const STATUS_OPTIONS = ["new", "reviewing", "interview", "offered", "hired", "rejected"];

function statusBadgeClass(status: string) {
  switch (status) {
    case "hired":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "offered":
      return "bg-purple/10 text-purple border-purple/20";
    case "interview":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "reviewing":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getStatusEmailDefaults(status: string, applicantName: string, jobTitle: string) {
  const first = applicantName.trim().split(/\s+/)[0] || "there";
  switch (status) {
    case "interview":
      return {
        subject: `Interview Invitation — ${jobTitle} at The Digital Dude`,
        message: `Hi ${first},\n\nWe thoroughly reviewed your application and written test for the ${jobTitle} role, and we would love to invite you to a 30-minute interview with our team.\n\nPlease find your Google Meet interview room link below. Looking forward to our conversation!`,
        bookingUrl: "",
        meetingLink: "",
      };
    case "offered":
      return {
        subject: `Job Offer — ${jobTitle} at The Digital Dude`,
        message: `Dear ${first},\n\nWe were very impressed by your experience, assessment results, and discussion with our team, and we would like to formally extend an offer for the ${jobTitle} position at The Digital Dude!\n\nOur team will follow up directly with the formal agreement, compensation terms, and onboarding materials.`,
        bookingUrl: "",
        meetingLink: "",
      };
    case "rejected":
      return {
        subject: `Update on your application for ${jobTitle}`,
        message: `Dear ${first},\n\nThank you for taking the time to apply for the ${jobTitle} role and for completing our written assessment.\n\nWhile your background is noteworthy, we have decided to proceed with other candidates whose current experience more closely matches our immediate operational needs.\n\nWe truly appreciate your interest in The Digital Dude and wish you all the best in your career pursuits.`,
        bookingUrl: "",
        meetingLink: "",
      };
    case "reviewing":
      return {
        subject: `Application Status Update — ${jobTitle}`,
        message: `Hi ${first},\n\nYour application for ${jobTitle} is currently undergoing detailed review by our leadership team. We will be in touch shortly with next steps regarding your candidacy.`,
        bookingUrl: "",
        meetingLink: "",
      };
    default:
      return {
        subject: `Update regarding your application for ${jobTitle}`,
        message: `Hi ${first},\n\nWe wanted to share an update regarding your application for ${jobTitle} at The Digital Dude.`,
        bookingUrl: "",
        meetingLink: "",
      };
  }
}

function StarRating({
  value = 0,
  onChange,
  readOnly = false,
  size = 15,
}: {
  value?: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"} p-0.5`}
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

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [converting, setConverting] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);

  // Status Change & Email Modal State
  const [pendingStatusModal, setPendingStatusModal] = useState<{
    application: Application;
    newStatus: string;
    sendEmail: boolean;
    subject: string;
    message: string;
    bookingUrl: string;
    interviewDate: string;
    meetingLink: string;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingMeet, setGeneratingMeet] = useState(false);

  // Scorecard & Notes State inside detail modal
  const [draftScorecard, setDraftScorecard] = useState<Scorecard>({});
  const [draftNotes, setDraftNotes] = useState("");
  const [notesSaveSuccess, setNotesSaveSuccess] = useState(false);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      const data = await res.json();
      if (data.ok) {
        setApplications(data.applications || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (selected) {
      setDraftScorecard(selected.scorecard || {});
      setDraftNotes(selected.internal_notes || "");
      setNotesSaveSuccess(false);
    }
  }, [selected]);

  function handleOpenStatusChange(app: Application, targetStatus: string) {
    const jobTitle = app.job_postings?.title || "the role";
    const defaults = getStatusEmailDefaults(targetStatus, app.applicant_name, jobTitle);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    setPendingStatusModal({
      application: app,
      newStatus: targetStatus,
      sendEmail: ["interview", "offered", "rejected", "reviewing"].includes(targetStatus),
      subject: defaults.subject,
      message: defaults.message,
      bookingUrl: defaults.bookingUrl,
      interviewDate: tomorrow.toISOString().slice(0, 16),
      meetingLink: defaults.meetingLink,
    });
  }

  async function handleGenerateMeetForStatusModal() {
    if (!pendingStatusModal) return;
    const { application, interviewDate } = pendingStatusModal;
    const jobTitle = application.job_postings?.title || "Software Role";

    setGeneratingMeet(true);
    try {
      const res = await fetch("/api/admin/interviews/meet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: application.applicant_name,
          candidateEmail: application.applicant_email,
          jobTitle,
          slotStart: new Date(interviewDate).toISOString(),
          notes: application.internal_notes || application.written_test_response,
        }),
      });

      const data = await res.json();
      if (data.ok && data.meetUrl) {
        setPendingStatusModal((prev) => {
          if (!prev) return null;
          const updatedMsg = prev.message.includes(data.meetUrl)
            ? prev.message
            : `${prev.message}\n\nGoogle Meet Room: ${data.meetUrl}\nScheduled Time: ${new Date(
                interviewDate
              ).toLocaleString()}`;
          return {
            ...prev,
            meetingLink: data.meetUrl,
            message: updatedMsg,
          };
        });
      } else {
        alert(data.error || "Could not generate Google Meet room. Make sure Google OAuth is connected.");
      }
    } catch {
      alert("Network error generating Google Meet link.");
    } finally {
      setGeneratingMeet(false);
    }
  }

  async function handleConfirmStatusChange() {
    if (!pendingStatusModal) return;
    setUpdatingStatus(true);
    const { application, newStatus, sendEmail, subject, message, bookingUrl, meetingLink } =
      pendingStatusModal;

    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          send_email: sendEmail,
          email_subject: subject,
          email_message: message,
          interview_booking_url: bookingUrl || undefined,
          meeting_link: meetingLink || undefined,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === application.id ? data.application : a))
        );
        if (selected?.id === application.id) {
          setSelected(data.application);
        }
        setPendingStatusModal(null);
      } else {
        alert(data.error || "Failed to update status.");
      }
    } catch {
      alert("Network error updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveScorecardAndNotes() {
    if (!selected) return;
    setSavingNotes(true);
    setNotesSaveSuccess(false);

    try {
      const res = await fetch(`/api/admin/applications/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internal_notes: draftNotes,
          scorecard: draftScorecard,
          send_email: false,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === selected.id ? data.application : a))
        );
        setSelected(data.application);
        setNotesSaveSuccess(true);
        setTimeout(() => setNotesSaveSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to save feedback.");
      }
    } catch {
      alert("Network error saving feedback.");
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete application from "${name}"? This also removes their uploaded files.`))
      return;
    const res = await fetch(`/api/admin/applications/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      if (selected?.id === id) setSelected(null);
    } else {
      alert(data.error || "Failed to delete application.");
    }
  }

  async function viewDocument(id: string, type: "cv" | "proof") {
    if (type === "cv" && selected?.cv_path.startsWith("url:")) {
      const targetUrl = selected.cv_path.replace(/^url:/, "");
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      return;
    }

    const res = await fetch(`/api/admin/applications/${id}/documents/${type}`);
    const data = await res.json();
    if (data.ok) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    } else {
      alert(data.error || "Could not open this file.");
    }
  }

  async function convertToEmployee(app: Application) {
    if (!confirm(`Create an employee record for ${app.applicant_name}?`)) return;
    setConverting(true);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: app.applicant_name,
          email: app.applicant_email,
          role_title: app.job_postings?.title || "",
          source_application_id: app.id,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert("Employee created. Set their commission rates from the Employees page.");
        fetchApplications();
        setSelected(null);
      } else {
        alert(data.error || "Failed to create employee.");
      }
    } finally {
      setConverting(false);
    }
  }

  const filtered = applications.filter((a) => {
    const matchesSearch =
      a.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      a.applicant_email.toLowerCase().includes(search.toLowerCase()) ||
      (a.job_postings?.title || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function exportToCsv() {
    if (filtered.length === 0) {
      alert("No applications to export.");
      return;
    }

    const headers = [
      "Applicant Name",
      "Email",
      "Phone",
      "Role Applied",
      "Status",
      "Overall Score",
      "Written Test Score",
      "Experience Score",
      "Communication Score",
      "Applied Date",
      "Internal Notes",
      "Written Test Response",
    ];

    const rows = filtered.map((app) => {
      const sc = app.scorecard || {};
      const sanitize = (text: string | null | undefined) =>
        `"${(text || "").replace(/"/g, '""').replace(/\n/g, " ")}"`;

      return [
        sanitize(app.applicant_name),
        sanitize(app.applicant_email),
        sanitize(app.applicant_phone || ""),
        sanitize(app.job_postings?.title || "General"),
        sanitize(app.status),
        sc.overall || "",
        sc.written_test || "",
        sc.experience || "",
        sc.communication || "",
        sanitize(new Date(app.created_at).toISOString().split("T")[0]),
        sanitize(app.internal_notes || ""),
        sanitize(app.written_test_response || ""),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tdd-candidate-applications-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Applications & Candidates</h1>
            <p className="text-sm text-navy/60">
              Review applicant submissions, score candidates, automate email updates, and convert to staff.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddCandidateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-purple px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-purple/90 transition"
            >
              <Plus size={14} /> Add Candidate
            </button>
            <button
              onClick={exportToCsv}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/80 shadow-2xs hover:bg-slate-50 transition"
              title="Export filtered candidate list to CSV"
            >
              <Download size={14} className="text-navy/60" /> Export CSV ({filtered.length})
            </button>
            <button
              onClick={fetchApplications}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 shadow-2xs hover:bg-slate-50 transition"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search candidates by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-navy/40" />
            <label className="text-xs font-semibold text-navy/60">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-navy outline-none focus:border-purple"
            >
              <option value="all">All Statuses ({applications.length})</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)} (
                  {applications.filter((a) => a.status === s).length})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-navy/60">Loading applications…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-navy/60">No applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                  <tr>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Scorecard</th>
                    <th className="py-3.5 px-4">Applied</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((app) => {
                    const overallScore = app.scorecard?.overall;
                    return (
                      <tr
                        key={app.id}
                        className="hover:bg-slate-50/50 transition cursor-pointer"
                        onClick={() => setSelected(app)}
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy">{app.applicant_name}</div>
                          <div className="text-[11px] text-navy/60">{app.applicant_email}</div>
                        </td>
                        <td className="py-3.5 px-4 text-navy/70">
                          {app.job_postings?.title || "—"}
                        </td>
                        <td className="py-3.5 px-4">
                          {overallScore ? (
                            <div className="flex items-center gap-1">
                              <Star size={13} className="fill-amber-400 text-amber-400" />
                              <span className="font-bold text-navy">{overallScore}</span>
                              <span className="text-[11px] text-navy/40">/5</span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-navy/40 italic">Unrated</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-navy/60">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(
                              app.status
                            )}`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenStatusChange(app, "interview")}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                              title="Invite to Interview"
                            >
                              Interview
                            </button>
                            <button
                              onClick={() => handleDelete(app.id, app.applicant_name)}
                              className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 transition"
                              title="Delete Application"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-navy">{selected.applicant_name}</h2>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(
                      selected.status
                    )}`}
                  >
                    {selected.status}
                  </span>
                </div>
                <p className="text-sm text-navy/70 mt-0.5">
                  {selected.applicant_email}
                  {selected.applicant_phone ? ` · ${selected.applicant_phone}` : ""}
                </p>
                <p className="text-xs text-navy/50 mt-1">
                  Applied for <strong className="text-navy">{selected.job_postings?.title || "—"}</strong> on{" "}
                  {new Date(selected.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl p-2 text-navy/40 hover:bg-slate-100 hover:text-navy transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions & Stage Transition Bar */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy/60">
                Change Pipeline Stage & Notify
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleOpenStatusChange(selected, s)}
                    className={`rounded-xl border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition shadow-2xs ${
                      selected.status === s
                        ? `${statusBadgeClass(s)} ring-2 ring-purple/20`
                        : "border-slate-200 bg-white text-navy/60 hover:bg-slate-50 hover:text-navy"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Attachments & Employee Conversion */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {selected.cv_path && selected.cv_path !== "manual:no-file-provided" && (
                <button
                  onClick={() => viewDocument(selected.id, "cv")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-2xs hover:bg-slate-50 transition"
                >
                  {selected.cv_path.startsWith("url:") ? (
                    <>
                      <ExternalLink size={15} className="text-purple" /> Open CV Link
                    </>
                  ) : (
                    <>
                      <FileText size={15} className="text-purple" /> View CV / Resume
                    </>
                  )}
                </button>
              )}
              {selected.proof_of_results_path && (
                <button
                  onClick={() => viewDocument(selected.id, "proof")}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-2xs hover:bg-slate-50 transition"
                >
                  <ImageIcon size={15} className="text-blue-500" /> View Proof of Results
                </button>
              )}
              {selected.status === "hired" && (
                <button
                  onClick={() => convertToEmployee(selected)}
                  disabled={converting}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple/90 disabled:opacity-50 transition"
                >
                  <UserPlus size={15} /> {converting ? "Converting…" : "Convert to Employee"}
                </button>
              )}
            </div>

            {/* Candidate Written Test Assessment */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy/70">
                Candidate Written Test Response
              </h3>
              <p className="whitespace-pre-wrap text-sm text-navy/90 leading-relaxed font-mono text-xs bg-white p-3.5 rounded-xl border border-slate-200/80">
                {selected.written_test_response || "(No written response provided)"}
              </p>
            </div>

            {/* Multi-Factor Scorecard Assessment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-navy">Candidate Scorecard & Evaluation</h3>
                  <p className="text-xs text-navy/60">Rate the applicant across core evaluation criteria.</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy/40 block">Overall Score</span>
                  <div className="flex items-center gap-1 justify-end">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    <span className="text-base font-extrabold text-navy">
                      {draftScorecard.overall || "—"}
                    </span>
                    <span className="text-xs text-navy/40">/5</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <label className="block text-xs font-bold text-navy mb-1">
                    📝 Written Test Quality
                  </label>
                  <StarRating
                    value={draftScorecard.written_test}
                    onChange={(val) => setDraftScorecard((prev) => ({ ...prev, written_test: val }))}
                  />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <label className="block text-xs font-bold text-navy mb-1">
                    💼 Relevant Outbound Experience
                  </label>
                  <StarRating
                    value={draftScorecard.experience}
                    onChange={(val) => setDraftScorecard((prev) => ({ ...prev, experience: val }))}
                  />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <label className="block text-xs font-bold text-navy mb-1">
                    💬 Communication & English Fluency
                  </label>
                  <StarRating
                    value={draftScorecard.communication}
                    onChange={(val) => setDraftScorecard((prev) => ({ ...prev, communication: val }))}
                  />
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <label className="block text-xs font-bold text-navy mb-1">
                    ⭐ Overall Hiring Assessment
                  </label>
                  <StarRating
                    value={draftScorecard.overall}
                    onChange={(val) => setDraftScorecard((prev) => ({ ...prev, overall: val }))}
                  />
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-navy/70">
                  Internal Review Notes & Interview Feedback
                </label>
                <textarea
                  rows={4}
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Add notes about candidate background, interview impressions, compensation discussions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-navy outline-none focus:border-purple focus:bg-white transition"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {notesSaveSuccess ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={15} /> Feedback and scores saved successfully!
                  </span>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  onClick={handleSaveScorecardAndNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-2 rounded-xl bg-navy px-5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-navy/90 disabled:opacity-50 transition"
                >
                  {savingNotes && <Loader2 size={13} className="animate-spin" />}
                  {savingNotes ? "Saving…" : "Save Evaluation & Notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Change & Candidate Email Notification Modal */}
      {pendingStatusModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-navy">
                  Update Candidate Stage:{" "}
                  <span className="capitalize text-purple">{pendingStatusModal.newStatus}</span>
                </h2>
                <p className="text-xs text-navy/60 mt-0.5">
                  Applicant: <strong>{pendingStatusModal.application.applicant_name}</strong> (
                  {pendingStatusModal.application.applicant_email})
                </p>
              </div>
              <button
                onClick={() => setPendingStatusModal(null)}
                className="rounded-xl p-1.5 text-navy/40 hover:bg-slate-100 hover:text-navy"
              >
                <X size={18} />
              </button>
            </div>

            {/* Send Email Toggle */}
            <div className="rounded-2xl border border-purple/20 bg-purple/5 p-4 flex items-start gap-3">
              <Mail size={18} className="text-purple mt-0.5" />
              <div className="flex-1">
                <label className="flex items-center gap-2 text-xs font-bold text-navy cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pendingStatusModal.sendEmail}
                    onChange={(e) =>
                      setPendingStatusModal((prev) =>
                        prev ? { ...prev, sendEmail: e.target.checked } : null
                      )
                    }
                    className="h-4 w-4 rounded border-slate-300 text-purple focus:ring-purple"
                  />
                  Send branded notification email to candidate
                </label>
                <p className="text-[11px] text-navy/60 mt-1">
                  Deliver an automated, customized status update to{" "}
                  {pendingStatusModal.application.applicant_email}.
                </p>
              </div>
            </div>

            {pendingStatusModal.sendEmail && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Email Subject</label>
                  <input
                    type="text"
                    value={pendingStatusModal.subject}
                    onChange={(e) =>
                      setPendingStatusModal((prev) =>
                        prev ? { ...prev, subject: e.target.value } : null
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white"
                  />
                </div>

                {pendingStatusModal.newStatus === "interview" && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 space-y-3">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <Video size={13} className="text-blue-600" /> Google Meet Interview Generator
                    </span>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1 flex items-center gap-1">
                          <Calendar size={12} /> Interview Date &amp; Time
                        </label>
                        <input
                          type="datetime-local"
                          value={pendingStatusModal.interviewDate}
                          onChange={(e) =>
                            setPendingStatusModal((prev) =>
                              prev ? { ...prev, interviewDate: e.target.value } : null
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs text-navy outline-none focus:border-purple"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-navy/70 mb-1 flex items-center gap-1">
                          <Video size={12} /> Google Meet Room Link
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="meet.google.com/xxx-yyyy-zzz"
                            value={pendingStatusModal.meetingLink}
                            onChange={(e) =>
                              setPendingStatusModal((prev) =>
                                prev ? { ...prev, meetingLink: e.target.value } : null
                              )
                            }
                            className="flex-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-mono text-navy outline-none focus:border-purple"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateMeetForStatusModal}
                            disabled={generatingMeet}
                            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-2xs shrink-0"
                          >
                            {generatingMeet ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Video size={13} />
                            )}
                            {generatingMeet ? "Creating…" : "Generate Meet"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-navy mb-1">Email Message</label>
                  <textarea
                    rows={6}
                    value={pendingStatusModal.message}
                    onChange={(e) =>
                      setPendingStatusModal((prev) =>
                        prev ? { ...prev, message: e.target.value } : null
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-navy outline-none focus:border-purple focus:bg-white leading-relaxed"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setPendingStatusModal(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={handleConfirmStatusChange}
                className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple/90 disabled:opacity-50 transition"
              >
                {updatingStatus ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                {updatingStatus
                  ? "Updating…"
                  : pendingStatusModal.sendEmail
                  ? `Update to ${pendingStatusModal.newStatus} & Send Email`
                  : `Update to ${pendingStatusModal.newStatus} (Silently)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate Manually Modal */}
      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        onCreated={(newApp) => {
          setApplications((prev) => [newApp, ...prev]);
        }}
      />
    </AdminLayout>
  );
}
