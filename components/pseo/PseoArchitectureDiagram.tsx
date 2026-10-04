import { Layers, ShieldCheck, Cpu, Database, Server, Smartphone } from "lucide-react";

interface PseoArchitectureDiagramProps {
  title?: string;
  serviceName?: string;
  techStack?: string[];
}

export function PseoArchitectureDiagram({
  title = "Modular Cloud Architecture & Security Blueprint",
  serviceName = "Custom System",
  techStack = ["Next.js 16 App Router", "React 19", "Supabase PostgreSQL", "Tailwind CSS", "Server Actions", "Stripe API"],
}: PseoArchitectureDiagramProps) {
  return (
    <div className="my-12 rounded-2xl border border-slate-200 bg-slate-900 p-6 md:p-8 text-white shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-accent-primary uppercase tracking-wider">
            <Layers className="h-4 w-4" />
            Engineering Topology
          </div>
          <h3 className="text-xl font-bold text-white mt-1">{title}</h3>
        </div>
        <div className="text-xs text-slate-400">Serverless • Low-Latency Edge • Full IP Ownership</div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Layer 1: Client Frontends */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-accent-primary text-sm font-semibold">
              <Smartphone className="h-4 w-4" />
              1. Unified Interfaces
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Multi-role web portals for Admin, Operations dispatchers, Mobile Field Techs, and External Clients.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400">
            Next.js 16 • React 19 • PWA
          </div>
        </div>

        {/* Layer 2: Edge & Auth Security */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4" />
              2. Security & Auth
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Row-Level Security (RLS) database isolation, role-based access control (RBAC), and automated session tokens.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400">
            HMAC Session Guards • GDPR / APP
          </div>
        </div>

        {/* Layer 3: Business Logic & Workflows */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
              <Cpu className="h-4 w-4" />
              3. Business Engine
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Server Actions, automated PDF certificate builders, webhook dispatch, SMS reminders, and payment hooks.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400">
            TypeScript • Stripe • Brevo API
          </div>
        </div>

        {/* Layer 4: Storage & Data */}
        <div className="rounded-xl bg-white/5 p-4 border border-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
              <Database className="h-4 w-4" />
              4. Relational Storage
            </div>
            <p className="text-xs text-slate-300 mt-2">
              High-concurrency PostgreSQL database, immutable event logs, encrypted media buckets, and automated daily backups.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-slate-400">
            PostgreSQL • Supabase Storage
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
        <span className="text-xs text-slate-400 font-medium mr-2">Featured Technologies:</span>
        {techStack.map((t, idx) => (
          <span
            key={idx}
            className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-mono text-slate-200 border border-white/5"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
