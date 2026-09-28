"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ShieldCheck,
  Link as LinkIcon,
  Copy,
  Check,
  Calendar,
  DollarSign,
  TrendingUp,
  Send,
  Mail,
  User,
  Building,
  CheckCircle2,
  Circle,
  FileText,
  LogOut,
  ExternalLink,
  Sparkles,
  Loader2,
  AlertCircle,
  CreditCard,
  BookOpen,
  Award,
  Clock,
  Layers,
  HelpCircle,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  Users,
  Menu,
  X,
  Phone,
  Briefcase,
  ArrowUpRight,
} from "lucide-react";
import { SITE_URL } from "@/lib/utils";

interface ChecklistItem {
  task: string;
  done: boolean;
  done_at: string | null;
}

interface SourcedBooking {
  id: string;
  name: string;
  work_email: string;
  company_name: string;
  country: string;
  slot_start: string;
  status: string;
  stage?: string;
  deal_value?: number;
  meeting_bonus_payout_status?: string;
  deal_commission_payout_status?: string;
  payout_notes?: string;
  created_at: string;
}

interface RepProfile {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  employment_type: string;
  currency: string;
  referral_code?: string;
  assigned_outreach_email?: string;
  meeting_bonus_min: number | null;
  meeting_bonus_max: number | null;
  deal_commission_percent_min: number | null;
  deal_commission_percent_max: number | null;
  status: string;
  onboarding_completed?: boolean;
  onboarding_checklist: ChecklistItem[];
  payout_details?: Record<string, string>;
  daily_outreach_limit?: number;
}

interface CommissionSummary {
  currency: string;
  totalBookingsCount: number;
  qualifiedMeetings: number;
  meetingBonusRangeTotal: [number, number];
  meetingBonusPaidCount: number;
  wonDealsCount: number;
  wonDealValue: number;
  dealCommissionRangeTotal: [number, number];
  dealCommissionPaidCount: number;
  outreachSentCount: number;
}

interface OutreachLog {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  company_name: string | null;
  subject: string;
  body_content: string;
  template_used: string | null;
  sent_at: string;
}

interface RepLead {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  job_title: string | null;
  lead_source: string;
  stage: "new" | "contacted" | "meeting_booked" | "negotiation" | "won" | "lost";
  estimated_deal_value: number;
  currency: string;
  notes: string | null;
  last_contacted_at: string | null;
  created_at: string;
}

interface CustomTemplate {
  id: string;
  template_name: string;
  subject: string;
  body_content: string;
  is_default?: boolean;
}

const BUILTIN_TEMPLATES = [
  {
    id: "custom_crm",
    name: "Custom CRM & Systems Modernization",
    subject: "Modernizing operational workflows for {{company}}",
    body: "Hi {{name}},\n\nI noticed {{company}} is rapidly expanding and likely managing complex workflows across multiple tools.\n\nAt The Digital Dude, we engineer bespoke CRMs, custom internal operations platforms, and automated workflow pipelines tailored specifically to your business model.\n\nWould you be open to a brief 20-minute discussion this week to explore how a tailored system can eliminate operational bottlenecks?",
  },
  {
    id: "mvp_saas",
    name: "MVP & SaaS Web App Development",
    subject: "Engineering your SaaS platform / product roadmap",
    body: "Hi {{name}},\n\nReaching out from The Digital Dude. We specialize in rapid end-to-end architecture and full-stack development of high-performance web applications, MVP platforms, and SaaS products.\n\nIf you're currently planning or scoping technical development, we'd love to share some recent architecture case studies and discuss how we can accelerate your launch.\n\nLet me know if you have 15 minutes this Thursday or Friday.",
  },
  {
    id: "follow_up",
    name: "Gentle Follow-Up & Case Study",
    subject: "Re: Technical architecture for {{company}}",
    body: "Hi {{name}},\n\nFollowing up on my previous message regarding custom software development and CRM systems for {{company}}.\n\nYou can review some of our live client transformations and technical architectures here: {{referral_link}}\n\nHappy to align on a quick discovery call at your convenience.",
  },
];

const LEAD_STAGES = [
  { id: "all", label: "All Leads", color: "bg-slate-100 text-navy" },
  { id: "new", label: "New Lead", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "contacted", label: "Contacted", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "meeting_booked", label: "Meeting Booked", color: "bg-purple/10 text-purple border-purple/30" },
  { id: "negotiation", label: "In Negotiation", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { id: "won", label: "Won / Closed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "lost", label: "Lost / Closed", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function RepDashboardPage() {
  const router = useRouter();

  // Navigation State
  const [activeTab, setActiveTab] = useState<"onboarding" | "overview" | "leads" | "outreach" | "payouts">("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<RepProfile | null>(null);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [bookings, setBookings] = useState<SourcedBooking[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [leads, setLeads] = useState<RepLead[]>([]);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);

  // UI States
  const [copiedLink, setCopiedLink] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadStageFilter, setLeadStageFilter] = useState("all");
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<RepLead | null>(null);

  // New Lead Form
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadEmail, setNewLeadEmail] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadCompany, setNewLeadCompany] = useState("");
  const [newLeadJobTitle, setNewLeadJobTitle] = useState("");
  const [newLeadStage, setNewLeadStage] = useState<RepLead["stage"]>("new");
  const [newLeadValue, setNewLeadValue] = useState<number>(0);
  const [newLeadNotes, setNewLeadNotes] = useState("");
  const [savingLead, setSavingLead] = useState(false);

  // Outreach Composer State
  const [selectedTemplateId, setSelectedTemplateId] = useState("custom_crm");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [outreachStatus, setOutreachStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Template Manager Modal
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateSubject, setNewTemplateSubject] = useState("");
  const [newTemplateBody, setNewTemplateBody] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Payout Details Form
  const [payoutMethod, setPayoutMethod] = useState("bkash");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Onboarding Checklist
  const [onboardingChecklist, setOnboardingChecklist] = useState<ChecklistItem[]>([]);
  const [togglingOnboarding, setTogglingOnboarding] = useState(false);

  // Load Dashboard Data
  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/rep/dashboard");
        if (res.status === 401) {
          router.push("/rep/login");
          return;
        }

        const data = await res.json();
        if (data.ok) {
          setProfile(data.employee);
          setCommissionSummary(data.commissionSummary);
          setBookings(data.bookings || []);
          setOutreachLogs(data.outreachLogs || []);
          setOnboardingChecklist(data.employee?.onboarding_checklist || []);

          if (data.employee?.payout_details) {
            setPayoutMethod(data.employee.payout_details.method || "bkash");
            setAccountNumber(data.employee.payout_details.account_number || "");
            setBankName(data.employee.payout_details.bank_name || "");
            setBranchName(data.employee.payout_details.branch_name || "");
            setRoutingNumber(data.employee.payout_details.routing_number || "");
            setPayoutNotes(data.employee.payout_details.notes || "");
          }

          // If onboarding is incomplete, land on Onboarding tab first
          if (!data.employee?.onboarding_completed) {
            setActiveTab("onboarding");
          }
        }
      } catch {
        // Network error
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
    fetchLeads();
    fetchCustomTemplates();
  }, [router]);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/rep/leads");
      const data = await res.json();
      if (data.ok) {
        setLeads(data.leads || []);
      }
    } catch {}
  }

  async function fetchCustomTemplates() {
    try {
      const res = await fetch("/api/rep/templates");
      const data = await res.json();
      if (data.ok) {
        setCustomTemplates(data.templates || []);
      }
    } catch {}
  }

  // Handle template selection & variable replacement
  useEffect(() => {
    const allTemplates = [
      ...BUILTIN_TEMPLATES,
      ...customTemplates.map((t) => ({
        id: t.id,
        name: t.template_name,
        subject: t.subject,
        body: t.body_content,
      })),
    ];

    const found = allTemplates.find((t) => t.id === selectedTemplateId) || BUILTIN_TEMPLATES[0];
    if (found) {
      const refLink = `${SITE_URL}/contact?ref=${profile?.referral_code || "rep"}`;
      const nameVal = recipientName.trim() ? recipientName.trim().split(/\s+/)[0] : "there";
      const compVal = companyName.trim() || "your team";

      const replacedSubject = found.subject
        .replace(/\{\{name\}\}/gi, nameVal)
        .replace(/\{\{company\}\}/gi, compVal);

      const replacedBody = found.body
        .replace(/\{\{name\}\}/gi, nameVal)
        .replace(/\{\{company\}\}/gi, compVal)
        .replace(/\{\{referral_link\}\}/gi, refLink);

      setEmailSubject(replacedSubject);
      setEmailMessage(replacedBody);
    }
  }, [selectedTemplateId, recipientName, companyName, profile?.referral_code, customTemplates]);

  // Copy Referral Link
  function handleCopyReferralLink() {
    const link = `${SITE_URL}/contact?ref=${profile?.referral_code || ""}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // Handle Logout
  async function handleLogout() {
    try {
      await fetch("/api/rep/auth/logout", { method: "POST" });
      router.push("/rep/login");
    } catch {
      router.push("/rep/login");
    }
  }

  // Save New Lead
  async function handleSaveLead(e: React.FormEvent) {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadEmail.trim()) {
      alert("Lead Name and Email are required.");
      return;
    }

    setSavingLead(true);
    try {
      const endpoint = editingLead ? `/api/rep/leads/${editingLead.id}` : "/api/rep/leads";
      const method = editingLead ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newLeadName,
          email: newLeadEmail,
          phone: newLeadPhone,
          company_name: newLeadCompany,
          job_title: newLeadJobTitle,
          stage: newLeadStage,
          estimated_deal_value: newLeadValue,
          notes: newLeadNotes,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setShowAddLeadModal(false);
        setEditingLead(null);
        resetLeadForm();
        fetchLeads();
      } else {
        alert(data.error || "Failed to save lead.");
      }
    } catch {
      alert("Network error saving lead.");
    } finally {
      setSavingLead(false);
    }
  }

  function resetLeadForm() {
    setNewLeadName("");
    setNewLeadEmail("");
    setNewLeadPhone("");
    setNewLeadCompany("");
    setNewLeadJobTitle("");
    setNewLeadStage("new");
    setNewLeadValue(0);
    setNewLeadNotes("");
    setEditingLead(null);
  }

  // Delete Lead
  async function handleDeleteLead(leadId: string) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      const res = await fetch(`/api/rep/leads/${leadId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== leadId));
      }
    } catch {}
  }

  // Shortcut to Email Lead from CRM
  function handleEmailLeadShortcut(lead: RepLead) {
    setRecipientEmail(lead.email);
    setRecipientName(lead.full_name);
    setCompanyName(lead.company_name || "");
    setActiveTab("outreach");
  }

  // Update Lead Stage
  async function handleUpdateLeadStage(leadId: string, nextStage: RepLead["stage"]) {
    try {
      const res = await fetch(`/api/rep/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: nextStage }),
      });
      const data = await res.json();
      if (data.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, stage: nextStage } : l))
        );
      }
    } catch {}
  }

  // Create Custom Template
  async function handleSaveCustomTemplate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTemplateName || !newTemplateSubject || !newTemplateBody) return;

    setSavingTemplate(true);
    try {
      const res = await fetch("/api/rep/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_name: newTemplateName,
          subject: newTemplateSubject,
          body_content: newTemplateBody,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setCustomTemplates((prev) => [data.template, ...prev]);
        setShowTemplateModal(false);
        setNewTemplateName("");
        setNewTemplateSubject("");
        setNewTemplateBody("");
        setSelectedTemplateId(data.template.id);
      } else {
        alert(data.error || "Failed to save template.");
      }
    } catch {
      alert("Network error saving template.");
    } finally {
      setSavingTemplate(false);
    }
  }

  // Send Cold Outreach Email
  async function handleSendOutreach(e: React.FormEvent, forceSend = false) {
    if (e) e.preventDefault();
    setSendingOutreach(true);
    setOutreachStatus(null);
    if (!forceSend) setDuplicateWarning(null);

    try {
      const res = await fetch("/api/rep/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          recipientName,
          companyName,
          subject: emailSubject,
          message: emailMessage,
          templateUsed: selectedTemplateId,
          forceSend,
        }),
      });

      const data = await res.json();
      if (res.status === 409 && data.isDuplicate) {
        setDuplicateWarning(data.error);
        setSendingOutreach(false);
        return;
      }

      if (data.ok) {
        setOutreachStatus({ type: "success", message: data.message || "Outreach email sent successfully!" });
        setDuplicateWarning(null);
        setRecipientEmail("");
        setRecipientName("");
        setCompanyName("");

        if (data.log) {
          setOutreachLogs((prev) => [data.log, ...prev]);
        }
      } else {
        setOutreachStatus({ type: "error", message: data.error || "Failed to send outreach email." });
      }
    } catch {
      setOutreachStatus({ type: "error", message: "Network error sending email." });
    } finally {
      setSendingOutreach(false);
    }
  }

  // Save Payout Details
  async function handleSavePayoutDetails(e: React.FormEvent) {
    e.preventDefault();
    setSavingPayout(true);
    setPayoutSuccess(false);

    try {
      const res = await fetch("/api/rep/payout-details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payout_details: {
            method: payoutMethod,
            account_number: accountNumber,
            bank_name: bankName,
            branch_name: branchName,
            routing_number: routingNumber,
            notes: payoutNotes,
          },
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setPayoutSuccess(true);
        setTimeout(() => setPayoutSuccess(false), 3000);
      }
    } catch {} finally {
      setSavingPayout(false);
    }
  }

  // Toggle Onboarding Complete
  async function handleCompleteOnboarding() {
    setTogglingOnboarding(true);
    try {
      const res = await fetch("/api/rep/onboarding/complete", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        if (profile) {
          setProfile({ ...profile, onboarding_completed: true });
        }
        setActiveTab("overview");
      }
    } catch {} finally {
      setTogglingOnboarding(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 text-white">
          <Loader2 size={32} className="animate-spin text-purple" />
          <p className="text-sm font-medium text-white/70">Loading Sales Rep Portal…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const currencySymbol = profile.currency === "BDT" ? "৳" : profile.currency === "GBP" ? "£" : "$";
  const repAlias = profile.assigned_outreach_email || `${profile.full_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "")}@digitaldude.co.uk`;
  const corporateReplyTo = profile.assigned_outreach_email || "info@digitaldude.co.uk";
  const referralLink = `${SITE_URL}/contact?ref=${profile.referral_code || "rep"}`;

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.email.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (lead.company_name && lead.company_name.toLowerCase().includes(leadSearch.toLowerCase()));

    const matchesStage = leadStageFilter === "all" || lead.stage === leadStageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* ========================================================================= */}
      {/* MOBILE TOP BAR */}
      {/* ========================================================================= */}
      <div className="md:hidden flex items-center justify-between bg-navy/95 border-b border-white/10 px-5 py-3.5 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-purple flex items-center justify-center text-white font-bold text-sm shadow-md">
            DD
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Sales Rep CRM</h1>
            <p className="text-[10px] text-white/50">{profile.full_name}</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white/5 text-white/80 hover:text-white"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* DEDICATED DARK / NAVY CRM SIDEBAR */}
      {/* ========================================================================= */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-navy border-r border-white/10 flex flex-col justify-between p-4 transition-transform duration-200 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 px-2">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple shadow-lg text-white font-bold text-sm">
                DD
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-wide">THE DIGITAL DUDE</h2>
                <span className="text-[10px] font-semibold text-purple tracking-widest uppercase block">
                  Rep Portal CRM
                </span>
              </div>
            </div>
          </div>

          {/* Rep Profile Mini Card */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple/20 border border-purple/40 text-purple flex items-center justify-center font-bold text-sm">
                {profile.full_name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">{profile.full_name}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Rep
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-white/60">
              <span>Alias:</span>
              <span className="font-mono text-purple truncate max-w-[130px]">{repAlias}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                setActiveTab("onboarding");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === "onboarding"
                  ? "bg-purple text-white shadow-lg shadow-purple/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BookOpen size={16} />
                <span>Onboarding &amp; Pitch Deck</span>
              </div>
              {!profile.onboarding_completed && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-400/20 text-amber-300 font-extrabold border border-amber-400/40">
                  START
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab("overview");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === "overview"
                  ? "bg-purple text-white shadow-lg shadow-purple/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <TrendingUp size={16} />
              <span>Overview &amp; Analytics</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("leads");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === "leads"
                  ? "bg-purple text-white shadow-lg shadow-purple/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users size={16} />
                <span>Leads CRM</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/80">
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("outreach");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === "outreach"
                  ? "bg-purple text-white shadow-lg shadow-purple/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send size={16} />
                <span>Cold Outreach</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple/20 text-purple font-mono">
                {outreachLogs.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("payouts");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                activeTab === "payouts"
                  ? "bg-purple text-white shadow-lg shadow-purple/20"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <CreditCard size={16} />
              <span>Earnings &amp; Payouts</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-3 pt-4 border-t border-white/10">
          {/* Quick Copy Outreach Link */}
          <div className="rounded-xl bg-white/[0.04] border border-white/10 p-2.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              Your Referral Link
            </span>
            <button
              onClick={handleCopyReferralLink}
              className="w-full flex items-center justify-between rounded-lg bg-purple/10 hover:bg-purple/20 border border-purple/30 p-1.5 text-xs text-purple transition font-medium"
            >
              <span className="font-mono text-[11px] truncate mr-1">?ref={profile.referral_code}</span>
              {copiedLink ? <Check size={14} className="text-emerald-400 shrink-0" /> : <Copy size={14} className="shrink-0" />}
            </button>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
        {/* ===================================================================== */}
        {/* VIEW 1: ONBOARDING & TRAINING */}
        {/* ===================================================================== */}
        {activeTab === "onboarding" && (
          <div className="max-w-4xl space-y-6 animate-in fade-in duration-150">
            {/* Onboarding Header Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy via-slate-900 to-purple/30 border border-purple/30 p-6 sm:p-8 shadow-2xl">
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-purple/20 px-3 py-1 text-xs font-bold text-purple border border-purple/40">
                  <Sparkles size={13} />
                  <span>Representative Kickoff Guide</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome to The Digital Dude Sales Team
                </h1>
                <p className="text-xs sm:text-sm text-white/70 max-w-2xl leading-relaxed">
                  Everything you need to source discovery calls, qualify high-ticket clients, and earn competitive milestone bonuses &amp; deal commissions.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={handleCompleteOnboarding}
                    disabled={togglingOnboarding}
                    className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-md transition disabled:opacity-50"
                  >
                    {togglingOnboarding ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : profile.onboarding_completed ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    {profile.onboarding_completed ? "Onboarding Marked Complete" : "Mark Onboarding as Complete"}
                  </button>

                  <button
                    onClick={() => setActiveTab("leads")}
                    className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
                  >
                    Go to Leads CRM →
                  </button>
                </div>
              </div>
            </div>

            {/* Core Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Module 1: Value Prop */}
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 space-y-3">
                <div className="flex items-center gap-2 text-purple font-bold text-sm">
                  <Layers size={18} />
                  <h3>1. Our Core Value Proposition</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  We build high-performance <strong>Custom CRMs, SaaS Platforms, Operations Systems, and AI-Driven Workflows</strong> for rapidly scaling businesses in the UK, Australia, US, and Bangladesh.
                </p>
                <div className="rounded-xl bg-white/[0.04] p-3 text-xs text-slate-400 space-y-1">
                  <p>• <strong>Deal Size:</strong> $3,000 to $50,000+ USD (or 300,000৳ to 5,000,000৳ BDT)</p>
                  <p>• <strong>Ideal Client:</strong> CEOs, CTOs, Founders, Operations Directors, Agency Owners.</p>
                </div>
              </div>

              {/* Module 2: Commission Structure */}
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Award size={18} />
                  <h3>2. Your Compensation Structure</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  You earn across two lucrative milestones on every opportunity you bring:
                </p>
                <div className="rounded-xl bg-white/[0.04] p-3 text-xs text-slate-400 space-y-1">
                  <p>• <strong>Qualified Meeting Bonus:</strong> {currencySymbol}{profile.meeting_bonus_min || 1000} – {currencySymbol}{profile.meeting_bonus_max || 2000} per held call.</p>
                  <p>• <strong>Closed Deal Commission:</strong> {profile.deal_commission_percent_min || 10}% – {profile.deal_commission_percent_max || 15}% of total contract revenue.</p>
                </div>
              </div>

              {/* Module 3: Objection Handling */}
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <HelpCircle size={18} />
                  <h3>3. Cold Outreach &amp; Objections</h3>
                </div>
                <div className="space-y-2 text-xs text-slate-300">
                  <p><strong>&ldquo;We already use off-the-shelf software:&rdquo;</strong></p>
                  <p className="text-slate-400 italic pl-2 border-l border-amber-400/40">
                    &ldquo;Most off-the-shelf tools don&apos;t talk to each other, forcing duplicate manual entry. We custom-build unified systems where data flows seamlessly.&rdquo;
                  </p>
                </div>
              </div>

              {/* Module 4: Step-by-Step Workflow */}
              <div className="rounded-2xl bg-slate-900/70 border border-white/10 p-5 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                  <TrendingUp size={18} />
                  <h3>4. Daily Execution Cadence</h3>
                </div>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li>1. Find prospects on LinkedIn / Apollo and add to <strong>Leads CRM</strong>.</li>
                  <li>2. Dispatch personalized outreach via the <strong>Cold Outreach</strong> tab.</li>
                  <li>3. Send them your unique booking link: <span className="font-mono text-purple">{referralLink}</span></li>
                  <li>4. Our technical leadership conducts the call — you earn meeting bonus + deal commission!</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: OVERVIEW & ANALYTICS */}
        {/* ===================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Top Bar Banner */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Representative Performance</h1>
                <p className="text-xs text-white/60">Live metrics tracked to your unique referral tag: <strong>{profile.referral_code}</strong></p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyReferralLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple/20 border border-purple/40 px-3.5 py-2 text-xs font-bold text-purple hover:bg-purple/30 transition"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>Copy Outreach Link</span>
                </button>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-2">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase">
                  <span>Discovery Calls</span>
                  <Calendar size={16} className="text-purple" />
                </div>
                <div className="text-2xl font-black text-white">{commissionSummary?.totalBookingsCount || 0}</div>
                <p className="text-[11px] text-emerald-400 font-medium">
                  {commissionSummary?.qualifiedMeetings || 0} Qualified &amp; Held
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-2">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase">
                  <span>Meeting Bonus Range</span>
                  <DollarSign size={16} className="text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {currencySymbol}{commissionSummary?.meetingBonusRangeTotal[0] || 0} – {currencySymbol}{commissionSummary?.meetingBonusRangeTotal[1] || 0}
                </div>
                <p className="text-[11px] text-white/50">
                  {commissionSummary?.meetingBonusPaidCount || 0} bonuses paid out
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-2">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase">
                  <span>Deals Won</span>
                  <Award size={16} className="text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">{commissionSummary?.wonDealsCount || 0}</div>
                <p className="text-[11px] text-white/50">
                  {currencySymbol}{commissionSummary?.wonDealValue?.toLocaleString() || 0} total deal volume
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-2">
                <div className="flex items-center justify-between text-white/50 text-xs font-bold uppercase">
                  <span>Deal Commissions</span>
                  <Sparkles size={16} className="text-purple" />
                </div>
                <div className="text-2xl font-black text-white">
                  {currencySymbol}{commissionSummary?.dealCommissionRangeTotal[0] || 0} – {currencySymbol}{commissionSummary?.dealCommissionRangeTotal[1] || 0}
                </div>
                <p className="text-[11px] text-white/50">
                  {commissionSummary?.dealCommissionPaidCount || 0} commissions finalized
                </p>
              </div>
            </div>

            {/* Discovery Calls Table */}
            <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Discovery Calls &amp; Deals Sourced</h3>
                  <p className="text-xs text-white/50">Clients who booked through your referral tag</p>
                </div>
                <span className="text-xs font-bold text-purple">{bookings.length} Tracked</span>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <Calendar size={28} className="mx-auto text-white/20" />
                  <p className="text-xs text-white/50">No discovery calls tracked yet.</p>
                  <p className="text-[11px] text-white/40">Use the Leads CRM or Cold Outreach tab to start sending your link!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-3">Client</th>
                        <th className="py-3 px-3">Company</th>
                        <th className="py-3 px-3">Scheduled Date</th>
                        <th className="py-3 px-3">Call Status</th>
                        <th className="py-3 px-3">Meeting Bonus</th>
                        <th className="py-3 px-3">Deal Comm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3">
                            <span className="font-bold text-white block">{b.name}</span>
                            <span className="text-[11px] text-white/50 font-mono">{b.work_email}</span>
                          </td>
                          <td className="py-3 px-3 text-white/80">{b.company_name || "—"}</td>
                          <td className="py-3 px-3 text-white/70">
                            {new Date(b.slot_start).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === "completed"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : b.status === "cancelled"
                                  ? "bg-rose-500/20 text-rose-300"
                                  : "bg-purple/20 text-purple"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.meeting_bonus_payout_status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-amber-500/20 text-amber-300"
                              }`}
                            >
                              {b.meeting_bonus_payout_status === "paid" ? "Paid" : "Pending Review"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.deal_commission_payout_status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {b.deal_commission_payout_status === "paid" ? "Paid" : "Pending Close"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 3: LEADS CRM */}
        {/* ===================================================================== */}
        {activeTab === "leads" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Leads Pipeline CRM</h1>
                <p className="text-xs text-white/60">Organize prospective clients, track stage transitions, and trigger outreach.</p>
              </div>

              <button
                onClick={() => {
                  resetLeadForm();
                  setShowAddLeadModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-purple px-4 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-lg shadow-purple/25 transition"
              >
                <Plus size={16} />
                <span>Add New Lead</span>
              </button>
            </div>

            {/* Search & Stage Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search leads by name, email, company…"
                  className="w-full rounded-xl bg-slate-900 border border-white/10 py-2 pl-9 pr-3 text-xs text-white placeholder:text-white/30 outline-none focus:border-purple"
                />
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {LEAD_STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLeadStageFilter(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                      leadStageFilter === s.id
                        ? "bg-purple text-white shadow-md shadow-purple/20"
                        : "bg-slate-900 text-white/60 hover:text-white border border-white/5"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads Table */}
            <div className="rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-xl">
              {filteredLeads.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Users size={32} className="mx-auto text-white/20" />
                  <p className="text-sm font-semibold text-white/60">No leads found in this filter.</p>
                  <button
                    onClick={() => {
                      resetLeadForm();
                      setShowAddLeadModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-bold text-white transition"
                  >
                    <Plus size={13} />
                    <span>Create Your First Lead</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-white/50 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">Lead Contact</th>
                        <th className="py-3.5 px-4">Company &amp; Role</th>
                        <th className="py-3.5 px-4">Stage</th>
                        <th className="py-3.5 px-4">Est. Deal Value</th>
                        <th className="py-3.5 px-4">Notes</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-4">
                            <span className="font-bold text-white block">{lead.full_name}</span>
                            <span className="text-[11px] text-white/50 font-mono">{lead.email}</span>
                            {lead.phone && <span className="text-[10px] text-white/40 block">{lead.phone}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-white font-medium block">{lead.company_name || "—"}</span>
                            <span className="text-[11px] text-white/50">{lead.job_title || "Decision Maker"}</span>
                          </td>
                          <td className="py-3 px-4">
                            <select
                              value={lead.stage}
                              onChange={(e) => handleUpdateLeadStage(lead.id, e.target.value as RepLead["stage"])}
                              className="rounded-lg bg-slate-950 border border-white/10 px-2 py-1 text-xs font-semibold text-purple outline-none focus:border-purple"
                            >
                              <option value="new">New Lead</option>
                              <option value="contacted">Contacted</option>
                              <option value="meeting_booked">Meeting Booked</option>
                              <option value="negotiation">In Negotiation</option>
                              <option value="won">Closed Won</option>
                              <option value="lost">Closed Lost</option>
                            </select>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-white">
                            {currencySymbol}{lead.estimated_deal_value?.toLocaleString() || "0"}
                          </td>
                          <td className="py-3 px-4 text-white/60 text-[11px] max-w-xs truncate">
                            {lead.notes || "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEmailLeadShortcut(lead)}
                                title="Send Cold Email"
                                className="p-1.5 rounded-lg bg-purple/10 hover:bg-purple/20 text-purple transition"
                              >
                                <Send size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingLead(lead);
                                  setNewLeadName(lead.full_name);
                                  setNewLeadEmail(lead.email);
                                  setNewLeadPhone(lead.phone || "");
                                  setNewLeadCompany(lead.company_name || "");
                                  setNewLeadJobTitle(lead.job_title || "");
                                  setNewLeadStage(lead.stage);
                                  setNewLeadValue(lead.estimated_deal_value || 0);
                                  setNewLeadNotes(lead.notes || "");
                                  setShowAddLeadModal(true);
                                }}
                                title="Edit Lead"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                title="Delete Lead"
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 4: COLD OUTREACH */}
        {/* ===================================================================== */}
        {activeTab === "outreach" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Outreach Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white">Cold Outreach Engine</h1>
                <p className="text-xs text-white/60">Dispatch high-deliverability cold emails through your verified corporate alias.</p>
              </div>

              <button
                onClick={() => setShowTemplateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-3.5 py-2 text-xs font-bold text-white transition border border-white/10"
              >
                <Plus size={14} />
                <span>Create Custom Template</span>
              </button>
            </div>

            {/* Alias Configuration Notice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-slate-900/80 border border-white/10 p-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-purple/20 text-purple flex items-center justify-center font-bold">
                  @
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Sender Corporate Alias</span>
                  <span className="font-mono text-purple font-bold">{repAlias}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  ↩
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/40 block">Replies Routed To</span>
                  <span className="font-mono text-blue-300 font-bold">{corporateReplyTo}</span>
                </div>
              </div>
            </div>

            {/* Duplicate Warning Override */}
            {duplicateWarning && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                  <span>{duplicateWarning}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleSendOutreach(e, true)}
                  disabled={sendingOutreach}
                  className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  Send Anyway
                </button>
              </div>
            )}

            {/* Outreach Status Feedback */}
            {outreachStatus && (
              <div
                className={`rounded-2xl border p-4 text-xs font-medium flex items-center gap-2.5 ${
                  outreachStatus.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                {outreachStatus.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{outreachStatus.message}</span>
              </div>
            )}

            {/* Email Composer Form */}
            <form onSubmit={(e) => handleSendOutreach(e, false)} className="rounded-3xl bg-slate-900/90 border border-white/10 p-6 space-y-5 shadow-2xl">
              {/* Template Picker */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Select Email Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs font-bold text-white outline-none focus:border-purple"
                >
                  <optgroup label="System Presets">
                    {BUILTIN_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
                  {customTemplates.length > 0 && (
                    <optgroup label="My Custom Templates">
                      {customTemplates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.template_name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Recipient Contact Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="prospect@company.com"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Prospect Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Subject Line *
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs font-bold text-white outline-none focus:border-purple"
                />
              </div>

              {/* Email Body */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Message Content *
                </label>
                <textarea
                  required
                  rows={8}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 p-3 text-xs text-slate-200 outline-none focus:border-purple leading-relaxed font-sans"
                />
              </div>

              {/* Action */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <p className="text-[11px] text-white/40">
                  Includes your branded email signature &amp; technical discovery booking button automatically.
                </p>
                <button
                  type="submit"
                  disabled={sendingOutreach}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-lg shadow-purple/25 transition disabled:opacity-50"
                >
                  {sendingOutreach ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending Email…
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Cold Email
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Sent Outreach History */}
            <div className="rounded-3xl bg-slate-900/80 border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Outreach History</h3>
                  <p className="text-xs text-white/50">Recent cold emails dispatched from this portal</p>
                </div>
                <span className="text-xs font-bold text-purple">{outreachLogs.length} Total</span>
              </div>

              {outreachLogs.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-6">No emails sent yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 px-3">Recipient</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Sent Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {outreachLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-mono text-white">
                            {log.recipient_name ? `${log.recipient_name} (${log.recipient_email})` : log.recipient_email}
                          </td>
                          <td className="py-3 px-3 text-slate-300">{log.subject}</td>
                          <td className="py-3 px-3 text-white/50 text-[11px]">
                            {new Date(log.sent_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 5: EARNINGS & PAYOUTS */}
        {/* ===================================================================== */}
        {activeTab === "payouts" && (
          <div className="max-w-3xl space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-white/10 pb-5">
              <h1 className="text-xl sm:text-2xl font-black text-white">Earnings &amp; Payout Settings</h1>
              <p className="text-xs text-white/60">Configure your banking / MFS withdrawal details for milestone disbursements.</p>
            </div>

            {payoutSuccess && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Payout details updated successfully!</span>
              </div>
            )}

            {/* Payout Form */}
            <form onSubmit={handleSavePayoutDetails} className="rounded-3xl bg-slate-900/90 border border-white/10 p-6 space-y-5 shadow-2xl">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  Preferred Payout Method
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {["bkash", "nagad", "bank", "paypal"].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPayoutMethod(method)}
                      className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition ${
                        payoutMethod === method
                          ? "bg-purple text-white border-purple shadow-lg shadow-purple/20"
                          : "bg-slate-950 border-white/10 text-white/60 hover:text-white"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Account / Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={payoutMethod === "bkash" || payoutMethod === "nagad" ? "017XXXXXXXX" : "Account number or PayPal email"}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white font-mono outline-none focus:border-purple"
                />
              </div>

              {payoutMethod === "bank" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. City Bank / BRAC Bank"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g. Gulshan Branch"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">Routing Number</label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      placeholder="e.g. 225272..."
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white font-mono outline-none focus:border-purple"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                  Additional Notes
                </label>
                <textarea
                  rows={2}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="Special instructions or account holder name..."
                  className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                />
              </div>

              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={savingPayout}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-6 py-2.5 text-xs font-bold text-white hover:bg-purple/90 shadow-md transition disabled:opacity-50"
                >
                  {savingPayout ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  <span>Save Payout Details</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT LEAD */}
      {/* ========================================================================= */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0 bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-purple/20 text-purple flex items-center justify-center">
                  <User size={16} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingLead ? "Edit Lead" : "Add New Lead"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowAddLeadModal(false);
                  resetLeadForm();
                }}
                className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveLead} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                      Lead Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLeadName}
                      onChange={(e) => setNewLeadName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                      Lead Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newLeadEmail}
                      onChange={(e) => setNewLeadEmail(e.target.value)}
                      placeholder="sarah@company.com"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={newLeadCompany}
                      onChange={(e) => setNewLeadCompany(e.target.value)}
                      placeholder="Acme Logistics"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newLeadPhone}
                      onChange={(e) => setNewLeadPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                      Lead Stage
                    </label>
                    <select
                      value={newLeadStage}
                      onChange={(e) => setNewLeadStage(e.target.value as RepLead["stage"])}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs font-bold text-white outline-none focus:border-purple"
                    >
                      <option value="new">New Lead</option>
                      <option value="contacted">Contacted</option>
                      <option value="meeting_booked">Meeting Booked</option>
                      <option value="negotiation">In Negotiation</option>
                      <option value="won">Closed Won</option>
                      <option value="lost">Closed Lost</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                      Est. Deal Value ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={newLeadValue}
                      onChange={(e) => setNewLeadValue(Number(e.target.value))}
                      className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Notes &amp; Prospect Context
                  </label>
                  <textarea
                    rows={3}
                    value={newLeadNotes}
                    onChange={(e) => setNewLeadNotes(e.target.value)}
                    placeholder="Key pain points, current software stack, budget notes..."
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLeadModal(false);
                    resetLeadForm();
                  }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLead}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:bg-purple/90 shadow-md transition disabled:opacity-50"
                >
                  {savingLead ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{editingLead ? "Save Changes" : "Create Lead"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CUSTOM TEMPLATE */}
      {/* ========================================================================= */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4 shrink-0 bg-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-purple/20 text-purple flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-base font-bold text-white">Create Custom Email Template</h3>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomTemplate} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. E-Commerce Automation Outreach"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTemplateSubject}
                    onChange={(e) => setNewTemplateSubject(e.target.value)}
                    placeholder="e.g. Accelerating engineering for {{company}}"
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    Body Content *
                  </label>
                  <p className="text-[11px] text-white/40 mb-1">
                    Available dynamic tags: <code className="text-purple">{"{{name}}"}</code>,{" "}
                    <code className="text-purple">{"{{company}}"}</code>,{" "}
                    <code className="text-purple">{"{{referral_link}}"}</code>
                  </p>
                  <textarea
                    required
                    rows={6}
                    value={newTemplateBody}
                    onChange={(e) => setNewTemplateBody(e.target.value)}
                    placeholder="Hi {{name}},\n\nI noticed {{company}} is..."
                    className="w-full rounded-xl bg-slate-950 border border-white/10 p-3 text-xs text-slate-200 outline-none focus:border-purple leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-slate-950/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-white/70 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple px-5 py-2 text-xs font-bold text-white hover:bg-purple/90 shadow-md transition disabled:opacity-50"
                >
                  {savingTemplate ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
