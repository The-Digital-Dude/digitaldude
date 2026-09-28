"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RefreshCw, Search } from "lucide-react";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role_title: string;
  status: string;
  created_at: string;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "offboarded":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function fetchEmployees() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/employees");
      const data = await res.json();
      if (data.ok) setEmployees(data.employees || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = employees.filter((e) => {
    const matchesSearch = e.full_name.toLowerCase().includes(search.toLowerCase()) || e.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy">Employees & Onboarding</h1>
            <p className="text-sm text-navy/60">Track onboarding progress and commission for each team member.</p>
          </div>
          <button
            onClick={fetchEmployees}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-navy/70 hover:bg-slate-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-2xs">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/40" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-navy outline-none focus:border-purple focus:bg-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-navy/60">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-navy outline-none focus:border-purple"
            >
              <option value="all">All Statuses</option>
              <option value="onboarding">Onboarding</option>
              <option value="active">Active</option>
              <option value="offboarded">Offboarded</option>
            </select>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {loading ? (
            <div className="p-12 text-center text-xs text-navy/60">Loading employees…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-navy/60">
              No employees yet. Convert a hired application from the Applications page to add one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-navy/60">
                  <tr>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-navy">{emp.full_name}</div>
                        <div className="text-[11px] text-navy/60">{emp.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-navy/70">{emp.role_title || "—"}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(emp.status)}`}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/employees/${emp.id}`} className="text-xs font-bold text-purple hover:underline">
                          View / Onboarding →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
