"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  onboarding_checklist: ChecklistItem[];
  payout_details?: Record<string, string>;
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

const OUTREACH_TEMPLATES = [
  {
    id: "crm_operations",
    name: "Custom CRM & Operations Architecture",
    subject: "Replacing manual spreadsheets & WhatsApp dispatch for {companyName}",
    body: `Hi {recipientName},\n\nI came across {companyName} and was really impressed by what your team is executing in your industry.\n\nAt The Digital Dude, we specialize in replacing messy Google Sheets and fragmented WhatsApp dispatches with custom-built, multi-portal CRM & ERP architectures built for scale.\n\nWe recently engineered a dispatch & CRM system for an operations firm that cut booking processing time by 80% and automated customer invoicing.\n\nWould you be open to a brief 15-minute technical discovery call next week to explore how a custom web portal could streamline operations at {companyName}?`,
  },
  {
    id: "saas_mvp",
    name: "SaaS Product / MVP Engineering",
    subject: "Building and launching {companyName}'s SaaS platform with fixed timeline",
    body: `Hi {recipientName},\n\nHope your week is going great!\n\nI wanted to reach out because our engineering team at The Digital Dude specializes in designing and building scalable SaaS platforms, multi-tenant portals, and modern Next.js web applications.\n\nWe provide full architecture blueprints, fixed-scope delivery timelines, and full IP transfer so founders own 100% of their codebase without tech debt.\n\nLet me know if you'd be open to a quick 15-minute architecture conversation — you can choose a time that fits your schedule via our live booking calendar below.`,
  },
  {
    id: "marketplace",
    name: "3-Sided Marketplace Development",
    subject: "Scaling {companyName}'s provider & customer marketplace",
    body: `Hi {recipientName},\n\nI'm reaching out from The Digital Dude. We architect high-performance marketplaces connecting customers, service providers, and administrative dispatchers.\n\nOur system architectures include automated escrow/Stripe payouts, real-time dispatch tracking, and custom CRM dashboards.\n\nIf upgrading or launching your marketplace infrastructure is on {companyName}'s roadmap this quarter, I'd love to invite you to a 30-minute discovery call with our senior tech leads.`,
  },
];

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: "৳",
  GBP: "£",
  USD: "$",
  EUR: "€",
};

export default function RepDashboardPage() {
  const router = useRouter();

  const [rep, setRep] = useState<RepProfile | null>(null);
  const [sourcedBookings, setSourcedBookings] = useState<SourcedBooking[]>([]);
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leads" | "outreach" | "earnings" | "onboarding">("leads");

  // Referral Link Copy State
  const [copiedLink, setCopiedLink] = useState(false);

  // Outreach Composer Form State
  const [selectedTemplate, setSelectedTemplate] = useState("crm_operations");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [outreachSubject, setOutreachSubject] = useState("");
  const [outreachMessage, setOutreachMessage] = useState("");
  const [sendingOutreach, setSendingOutreach] = useState(false);
  const [outreachSuccess, setOutreachSuccess] = useState<string | null>(null);
  const [outreachError, setOutreachError] = useState<string | null>(null);

  // Payout Details Form State
  const [payoutMethod, setPayoutMethod] = useState<"bkash" | "nagad" | "bank" | "wise">("bkash");
  const [payoutAccountNum, setPayoutAccountNum] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState("");
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutRouting, setPayoutRouting] = useState("");
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/rep/dashboard");
      if (res.status === 401) {
        router.push("/rep/login");
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setRep(data.rep);
        setSourcedBookings(data.sourcedBookings || []);
        setCommission(data.commissionSummary);

        // Pre-fill payout details if available
        if (data.rep.payout_details) {
          const pd = data.rep.payout_details;
          setPayoutMethod(pd.method || "bkash");
          setPayoutAccountNum(pd.account_number || "");
          setPayoutAccountName(pd.account_name || "");
          setPayoutBankName(pd.bank_name || "");
          setPayoutRouting(pd.routing_number || "");
        }
      }
    } catch {
      router.push("/rep/login");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOutreachLogs() {
    try {
      const res = await fetch("/api/rep/outreach");
      const data = await res.json();
      if (data.ok) {
        setOutreachLogs(data.logs || []);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchDashboard();
    fetchOutreachLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update template fields when template or recipient details change
  useEffect(() => {
    const tmpl = OUTREACH_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!tmpl) return;

    const first = recipientName.trim() || "there";
    const comp = companyName.trim() || "your team";

    const sub = tmpl.subject.replace(/{companyName}/g, comp).replace(/{recipientName}/g, first);
    const body = tmpl.body.replace(/{companyName}/g, comp).replace(/{recipientName}/g, first);

    setOutreachSubject(sub);
    setOutreachMessage(body);
  }, [selectedTemplate, recipientName, companyName]);

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  async function handleSendOutreach(e?: React.FormEvent, forceSend = false) {
    if (e) e.preventDefault();
    if (!recipientEmail.trim() || !outreachSubject.trim() || !outreachMessage.trim()) return;

    setSendingOutreach(true);
    setOutreachSuccess(null);
    setOutreachError(null);
    setDuplicateWarning(null);

    try {
      const res = await fetch("/api/rep/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail: recipientEmail.trim(),
          recipientName: recipientName.trim() || undefined,
          companyName: companyName.trim() || undefined,
          subject: outreachSubject.trim(),
          message: outreachMessage.trim(),
          templateUsed: selectedTemplate,
          forceSend,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 409 && data.duplicateWarning) {
          setDuplicateWarning(data.error || "You emailed this contact recently.");
          return;
        }
        throw new Error(data.error || "Failed to dispatch outreach email.");
      }

      setOutreachSuccess(`Outreach email successfully delivered to ${recipientEmail.trim()}!`);
      setRecipientEmail("");
      setRecipientName("");
      setCompanyName("");
      setDuplicateWarning(null);
      fetchOutreachLogs();
      fetchDashboard();
      setTimeout(() => setOutreachSuccess(null), 5000);
    } catch (err: unknown) {
      setOutreachError((err as Error).message || "An unexpected error occurred.");
    } finally {
      setSendingOutreach(false);
    }
  }

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
            account_number: payoutAccountNum.trim(),
            account_name: payoutAccountName.trim(),
            bank_name: payoutMethod === "bank" ? payoutBankName.trim() : undefined,
            routing_number: payoutMethod === "bank" ? payoutRouting.trim() : undefined,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to update payout details.");
      }

      setPayoutSuccess(true);
      setTimeout(() => setPayoutSuccess(false), 3000);
    } catch (err: unknown) {
      alert((err as Error).message || "Error saving payout details.");
    } finally {
      setSavingPayout(false);
    }
  }

  async function toggleOnboardingTask(index: number, done: boolean) {
    if (!rep) return;
    try {
      const res = await fetch("/api/rep/onboarding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskIndex: index, done }),
      });

      const data = await res.json();
      if (data.ok) {
        setRep((prev) => (prev ? { ...prev, onboarding_checklist: data.onboarding_checklist } : null));
      }
    } catch {
      alert("Failed to update task.");
    }
  }

  async function handleLogout() {
    await fetch("/api/rep/auth/logout", { method: "POST" });
    router.push("/rep/login");
  }

  function copyReferralLink() {
    if (!rep) return;
    const refCode = rep.referral_code || rep.id;
    const link = `${SITE_URL}/contact?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d1f] text-white">
        <div className="flex items-center gap-3 text-sm text-purple">
          <Loader2 size={18} className="animate-spin" /> Loading Rep Dashboard…
        </div>
      </div>
    );
  }

  if (!rep) return null;

  const symbol = CURRENCY_SYMBOLS[rep.currency] || "$";
  const refCode = rep.referral_code || rep.id;
  const referralUrl = `${SITE_URL}/contact?ref=${refCode}`;
  const checklist = rep.onboarding_checklist || [];
  const completedTasks = checklist.filter((c) => c.done).length;
  const senderAlias = rep.assigned_outreach_email || "info@digitaldude.co.uk";

  return (
    <div className="min-h-screen bg-[#0d0d1f] text-white selection:bg-purple selection:text-white pb-20">
      {/* Top Header Bar */}
      <header className="border-b border-white/10 bg-[#0d0d1f]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple to-indigo-500 shadow-md shadow-purple/20">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white">{rep.full_name}</span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {rep.status}
                </span>
              </div>
              <p className="text-xs text-white/50">
                {rep.role_title || "Sales Rep (BDE)"} · {rep.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Rep Referral Outreach Hero */}
        <div className="relative rounded-3xl border border-purple/30 bg-gradient-to-br from-purple/10 via-indigo-950/40 to-purple/5 p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-purple">
              <Sparkles size={12} /> Your Dedicated Outreach &amp; Referral Link
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Share your link with founders &amp; prospect leads
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              When a prospect clicks your link, a 30-day attribution cookie is installed. Any discovery call they book is credited directly to you for meeting bonuses and closed-won commissions.
            </p>
            <div className="font-mono text-xs text-purple-200 bg-black/40 p-3 rounded-xl border border-purple/20 break-all select-all flex items-center justify-between gap-2">
              <span>{referralUrl}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={copyReferralLink}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple to-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-purple/30 hover:brightness-110 transition"
            >
              {copiedLink ? <Check size={16} /> : <Copy size={16} />}
              {copiedLink ? "Copied Referral Link!" : "Copy Outreach Link"}
            </button>
            <a
              href={referralUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            >
              Test Link <ExternalLink size={13} />
            </a>
          </div>
        </div>

        {/* Live Metrics Ribbon */}
        {commission && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                Total Sourced Calls
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-white">
                  {commission.qualifiedMeetings}
                </span>
                <span className="text-xs text-white/60">qualified discovery calls</span>
              </div>
              <p className="mt-1 text-[11px] text-white/40">
                {commission.meetingBonusPaidCount} bonus payouts completed
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                Meeting Bonus Accrued
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-white">
                  {symbol}
                  {commission.meetingBonusRangeTotal[0].toLocaleString()}
                </span>
                <span className="text-xs text-white/40">
                  – {symbol}
                  {commission.meetingBonusRangeTotal[1].toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-emerald-400 font-medium">
                {symbol}{rep.meeting_bonus_min || 1000} – {symbol}{rep.meeting_bonus_max || 2000} per qualified call
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                Closed-Won Deal Revenue
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400">
                  ${commission.wonDealValue.toLocaleString()}
                </span>
                <span className="text-xs text-white/60">({commission.wonDealsCount} won)</span>
              </div>
              <p className="mt-1 text-[11px] text-white/40">From your attributed bookings</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-xl">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block">
                Deal Commission Accrued
              </span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-black text-purple">
                  ${commission.dealCommissionRangeTotal[0].toLocaleString()}
                </span>
                <span className="text-xs text-white/40">
                  – ${commission.dealCommissionRangeTotal[1].toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-purple font-medium">
                {rep.deal_commission_percent_min || 10}%–{rep.deal_commission_percent_max || 15}% closed deal commission
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "leads"
                ? "border-purple text-white bg-purple/10 rounded-t-xl"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <TrendingUp size={14} /> My Leads &amp; Deals ({sourcedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab("outreach")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "outreach"
                ? "border-purple text-white bg-purple/10 rounded-t-xl"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <Send size={14} /> Cold Outreach Suite ({commission?.outreachSentCount || 0})
          </button>
          <button
            onClick={() => setActiveTab("earnings")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "earnings"
                ? "border-purple text-white bg-purple/10 rounded-t-xl"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <DollarSign size={14} /> Earnings &amp; Payout Account
          </button>
          <button
            onClick={() => setActiveTab("onboarding")}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === "onboarding"
                ? "border-purple text-white bg-purple/10 rounded-t-xl"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            <BookOpen size={14} /> Onboarding &amp; Playbook ({completedTasks}/{checklist.length})
          </button>
        </div>

        {/* TAB 1: SOURCED LEADS & DEALS */}
        {activeTab === "leads" && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Attributed Discovery Calls &amp; Pipeline Deals</h3>
                <p className="text-xs text-white/50">
                  Every meeting booked via your link appears here automatically with live deal stages.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/5 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-white/50">
                  <tr>
                    <th className="py-3 px-4">Client / Company</th>
                    <th className="py-3 px-4">Call Date</th>
                    <th className="py-3 px-4">Deal Stage</th>
                    <th className="py-3 px-4">Contract Value</th>
                    <th className="py-3 px-4">Meeting Bonus</th>
                    <th className="py-3 px-4">Deal Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {sourcedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{b.name}</div>
                        <div className="text-[11px] text-white/50">
                          {b.company_name} · {b.work_email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-white/70">
                        {new Date(b.slot_start).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                          {(b.stage || b.status || "confirmed").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">
                        ${(Number(b.deal_value) || 8500).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                            b.meeting_bonus_payout_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : b.meeting_bonus_payout_status === "approved"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {b.meeting_bonus_payout_status || "pending"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                            b.deal_commission_payout_status === "paid"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : b.deal_commission_payout_status === "approved"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {b.deal_commission_payout_status || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {sourcedBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-white/40">
                        No discovery calls attributed yet. Start sending outreach emails in the Cold Outreach Suite tab!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: COLD OUTREACH SUITE */}
        {activeTab === "outreach" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Outreach Email Composer */}
              <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Send size={18} className="text-purple" /> Send Client Outreach Email
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">
                      Sends high-converting sales emails with your unique tracking link automatically embedded.
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple/10 border border-purple/30 px-3 py-1 text-[11px] font-mono text-purple-200">
                    Sender: <strong className="text-white">{senderAlias}</strong>
                  </div>
                </div>

                {outreachSuccess && (
                  <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 font-medium">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                    <span>{outreachSuccess}</span>
                  </div>
                )}

                {outreachError && (
                  <div className="flex items-center gap-2 rounded-2xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-300 font-medium">
                    <AlertCircle size={16} className="shrink-0 text-red-400" />
                    <span>{outreachError}</span>
                  </div>
                )}

                {duplicateWarning && (
                  <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 space-y-2.5 text-xs text-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="shrink-0 text-amber-400 mt-0.5" />
                      <span className="leading-relaxed font-medium">{duplicateWarning}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <button
                        type="button"
                        onClick={() => handleSendOutreach(undefined, true)}
                        className="rounded-xl bg-amber-500 hover:bg-amber-400 text-navy font-bold px-3 py-1.5 text-xs transition shadow-xs cursor-pointer active:scale-95"
                      >
                        Send Anyway
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateWarning(null)}
                        className="rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white/80 font-medium px-3 py-1.5 text-xs transition cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSendOutreach} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                      Choose Sales Pitch Template
                    </label>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-semibold text-white outline-none focus:border-purple focus:bg-white/10"
                    >
                      {OUTREACH_TEMPLATES.map((tmpl) => (
                        <option key={tmpl.id} value={tmpl.id} className="bg-[#0d0d1f] text-white">
                          {tmpl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                        Recipient Work Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="prospect@company.com"
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Sarah Connor"
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                        Prospect Company
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Apex Logistics Ltd"
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white placeholder-white/20 outline-none focus:border-purple"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                      Email Subject Line *
                    </label>
                    <input
                      type="text"
                      required
                      value={outreachSubject}
                      onChange={(e) => setOutreachSubject(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs font-semibold text-white outline-none focus:border-purple"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                      Email Body Content * (Auto-includes 1-click meeting booking button)
                    </label>
                    <textarea
                      rows={8}
                      required
                      value={outreachMessage}
                      onChange={(e) => setOutreachMessage(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none focus:border-purple leading-relaxed font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-white/40">
                      Replies will go directly to <strong className="text-white/70">{rep.email}</strong>
                    </p>

                    <button
                      type="submit"
                      disabled={sendingOutreach || !recipientEmail.trim()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple/30 hover:brightness-110 disabled:opacity-50 transition"
                    >
                      {sendingOutreach ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Sending via {senderAlias}…
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Send Outreach Email
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Outreach Tips & Tracking Stats */}
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple flex items-center gap-1.5">
                    <Sparkles size={14} /> High-Conversion Sales Tips
                  </h4>
                  <ul className="space-y-2.5 text-xs text-white/70 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="text-purple shrink-0 mt-0.5" />
                      <span><strong>Personalize First:</strong> Mention their exact company name and pain point (e.g. spreadsheet bottlenecks).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="text-purple shrink-0 mt-0.5" />
                      <span><strong>Value First:</strong> Frame the call as a 15-minute technical discovery / architecture advice session.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight size={14} className="text-purple shrink-0 mt-0.5" />
                      <span><strong>Follow-Up Cadence:</strong> Most closed-won deals schedule after the 2nd follow-up message.</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/10 bg-purple/5 p-6 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple">Attribution Safeguard</span>
                  <p className="text-xs text-white/70 leading-relaxed">
                    Every outreach email sent from this portal automatically tags the link with your code <code className="text-purple font-mono font-bold">{refCode}</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Sent Outreach History Log */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
              <h3 className="text-base font-bold text-white">Sent Outreach Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-white/50">
                    <tr>
                      <th className="py-2.5 px-3">Prospect Email</th>
                      <th className="py-2.5 px-3">Company</th>
                      <th className="py-2.5 px-3">Subject</th>
                      <th className="py-2.5 px-3">Template</th>
                      <th className="py-2.5 px-3">Date Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {outreachLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-bold text-white">{log.recipient_email}</td>
                        <td className="py-3 px-3 text-white/70">{log.company_name || "—"}</td>
                        <td className="py-3 px-3 text-white/80 max-w-xs truncate">{log.subject}</td>
                        <td className="py-3 px-3">
                          <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                            {log.template_used || "custom"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white/50">
                          {new Date(log.sent_at).toLocaleDateString()} {new Date(log.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                    {outreachLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-white/40">
                          No outreach emails sent yet. Compose your first message above!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EARNINGS & PAYOUT DETAILS */}
        {activeTab === "earnings" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Compensation Overview */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <DollarSign size={18} className="text-purple" /> Commission &amp; Bonus Structure
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Your agreed compensation model and payout currency.
                </p>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">Meeting Bonus Range</span>
                    <span className="text-xl font-bold text-white">
                      {symbol}{rep.meeting_bonus_min || 1000} – {symbol}{rep.meeting_bonus_max || 2000}
                    </span>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    Per Qualified Call
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">Closed Deal Commission</span>
                    <span className="text-xl font-bold text-purple">
                      {rep.deal_commission_percent_min || 10}% – {rep.deal_commission_percent_max || 15}%
                    </span>
                  </div>
                  <span className="text-xs text-purple font-bold bg-purple/10 px-3 py-1 rounded-full border border-purple/20">
                    Of Closed Contract Value
                  </span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white/50 uppercase tracking-wider block">Payout Currency</span>
                    <span className="text-base font-bold text-white">{rep.currency} ({symbol})</span>
                  </div>
                  <span className="text-xs text-white/60">Bi-weekly / Monthly Payouts</span>
                </div>
              </div>
            </div>

            {/* Payout Account Manager */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-white/5 pb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CreditCard size={18} className="text-purple" /> Payout Account Settings
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Submit or update where your bonuses and commissions should be wired.
                  </p>
                </div>
                {payoutSuccess && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <Check size={14} /> Saved!
                  </span>
                )}
              </div>

              <form onSubmit={handleSavePayoutDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                    Payout Method
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value as "bkash" | "nagad" | "bank" | "wise")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 p-3 text-xs font-semibold text-white outline-none focus:border-purple"
                  >
                    <option value="bkash" className="bg-[#0d0d1f]">bKash (Personal / Merchant)</option>
                    <option value="nagad" className="bg-[#0d0d1f]">Nagad</option>
                    <option value="bank" className="bg-[#0d0d1f]">Bank Transfer (Local / International)</option>
                    <option value="wise" className="bg-[#0d0d1f]">Wise / Payoneer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                    {payoutMethod === "bank" ? "Account / IBAN Number *" : "Mobile / Account Number *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutAccountNum}
                    onChange={(e) => setPayoutAccountNum(e.target.value)}
                    placeholder={payoutMethod === "bank" ? "e.g. 205012345678" : "e.g. 01700000000"}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutAccountName}
                    onChange={(e) => setPayoutAccountName(e.target.value)}
                    placeholder="Full legal name on account"
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white outline-none focus:border-purple"
                  />
                </div>

                {payoutMethod === "bank" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={payoutBankName}
                        onChange={(e) => setPayoutBankName(e.target.value)}
                        placeholder="e.g. City Bank, HSBC"
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white outline-none focus:border-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/60 mb-1">
                        Routing / Branch Code
                      </label>
                      <input
                        type="text"
                        value={payoutRouting}
                        onChange={(e) => setPayoutRouting(e.target.value)}
                        placeholder="e.g. 225272635"
                        className="w-full rounded-xl border border-white/10 bg-white/5 p-2.5 text-xs text-white outline-none focus:border-purple"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingPayout}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple/25 hover:brightness-110 disabled:opacity-50 transition"
                >
                  {savingPayout ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving Payout Details…
                    </>
                  ) : (
                    <>
                      <Check size={14} /> Update Payout Account
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: ONBOARDING & PLAYBOOK */}
        {activeTab === "onboarding" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Checklist */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-purple" /> Your Onboarding Checklist
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Complete each task as you get set up with our sales operations.
                </p>
              </div>

              <div className="space-y-3">
                {checklist.map((task, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleOnboardingTask(idx, !task.done)}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/5 transition text-left"
                  >
                    {task.done ? (
                      <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Circle size={20} className="text-white/30 shrink-0" />
                    )}
                    <span className={`text-xs ${task.done ? "text-white/40 line-through" : "text-white font-medium"}`}>
                      {task.task}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Sales Playbook Quick Reference */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen size={18} className="text-purple" /> Sales Playbook &amp; Pitch Guidelines
                </h3>
                <p className="text-xs text-white/50 mt-0.5">
                  Core value proposition and ideal client profiles.
                </p>
              </div>

              <div className="space-y-4 text-xs text-white/70 leading-relaxed">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-sm">🎯 Ideal Customer Profile (ICP)</h4>
                  <p>
                    Mid-market businesses, logistics firms, recruitment agencies, and founders in the UK, Australia, and US currently suffering from spreadsheet or WhatsApp bottlenecks.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-sm">💡 What We Deliver</h4>
                  <p>
                    Bespoke Next.js &amp; PostgreSQL platforms, custom CRM dispatch systems, 3-sided marketplaces, and SaaS MVPs with guaranteed delivery timelines and fixed pricing.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1.5">
                  <h4 className="font-bold text-white text-sm">🤝 Qualification Checklist</h4>
                  <p>
                    A qualified call has a real business stakeholder (Founder, CEO, COO, or Operations Director) looking to invest in bespoke software within 1–3 months.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
