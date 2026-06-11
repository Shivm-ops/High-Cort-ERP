"use client";

import { useState } from "react";
import { Plus, Search, Briefcase, Pencil, ExternalLink, X } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CaseForm from "@/components/forms/CaseForm";
import HearingForm from "@/components/forms/HearingForm";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useCases, useCaseStats, useCloseCase, Case } from "@/lib/hooks/useCases";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-100",
  urgent: "bg-red-50 text-red-700 border-red-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  stayed: "bg-blue-50 text-blue-700 border-blue-100",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
  disposed: "bg-gray-100 text-gray-500 border-gray-200",
};

const STAGE_COLORS: Record<string, string> = {
  filing: "bg-slate-100 text-slate-600",
  notice: "bg-yellow-50 text-yellow-700",
  reply: "bg-orange-50 text-orange-700",
  evidence: "bg-blue-50 text-blue-700",
  arguments: "bg-purple-50 text-purple-700",
  judgment: "bg-green-50 text-green-700",
  execution: "bg-teal-50 text-teal-700",
};

export default function CasesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editCase, setEditCase] = useState<Case | null>(null);
  const [closeCase, setCloseCase] = useState<Case | null>(null);
  const [scheduleHearing, setScheduleHearing] = useState<string | null>(null);

  const { data, isLoading, error } = useCases({
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const { data: stats } = useCaseStats();
  const closeMutation = useCloseCase();

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Case Management" subtitle="Track all active and closed cases" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Cases", value: stats?.total ?? "—", color: "text-gray-700" },
            { label: "Active", value: stats?.active ?? "—", color: "text-green-600" },
            { label: "Urgent", value: stats?.urgent ?? "—", color: "text-red-600" },
            { label: "Upcoming Hearings", value: stats?.upcoming_hearings ?? "—", color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cases..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white w-64"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-white outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="urgent">Urgent</option>
            <option value="pending">Pending</option>
            <option value="stayed">Stayed</option>
            <option value="disposed">Disposed</option>
            <option value="closed">Closed</option>
          </select>
          <button onClick={() => setShowCreate(true)}
            className="ml-auto flex items-center gap-2 rounded-xl bg-sidebar px-4 py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors">
            <Plus className="w-4 h-4" /> New Case
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
            <p className="text-red-600 text-sm">Failed to load cases. Ensure the backend is running at localhost:8000</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <span className="text-sm font-medium text-gray-700">{data?.total ?? 0} cases</span>
            </div>
            {!data?.cases.length ? (
              <div className="py-16 text-center">
                <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No cases found</p>
                <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-sidebar font-medium hover:underline">
                  Create your first case
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      {["Case No.", "Title & Client", "Court", "Practice Area", "Stage", "Next Hearing", "Fees", "Status", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.cases.map((c) => {
                      const feePct = c.fees_agreed > 0 ? Math.min(100, Math.round((c.fees_received / c.fees_agreed) * 100)) : 0;
                      return (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{c.case_no}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900 max-w-[200px] truncate">{c.title}</div>
                            <div className="text-xs text-gray-400">{c.client_name}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{c.court}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{c.practice_area}</td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs px-2 py-1 rounded-lg font-medium", STAGE_COLORS[c.stage] || "bg-gray-100 text-gray-600")}>
                              {c.stage}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            {c.next_hearing_date ? <span className="text-amber-600 font-medium">{c.next_hearing_date}</span> : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs text-gray-700 whitespace-nowrap">
                              ₹{(c.fees_received / 1000).toFixed(0)}K / ₹{(c.fees_agreed / 1000).toFixed(0)}K
                            </div>
                            <div className="mt-1 h-1 bg-gray-100 rounded-full w-20 overflow-hidden">
                              <div className="h-full bg-mint rounded-full" style={{ width: `${feePct}%` }} />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn("text-xs px-2 py-1 rounded-full font-medium border", STATUS_COLORS[c.status] || "bg-gray-100 text-gray-600 border-gray-200")}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => router.push(`/cases/${c.id}`)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-sidebar hover:bg-sidebar/5">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditCase(c)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setScheduleHearing(c.id)}
                                className="rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 text-xs font-medium px-2 py-1">
                                +Hearing
                              </button>
                              {c.status !== "closed" && (
                                <button onClick={() => setCloseCase(c)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
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
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New Case" size="xl">
        <CaseForm onSuccess={(id) => { setShowCreate(false); if (id) router.push(`/cases/${id}`); }} />
      </Modal>
      <Modal open={!!editCase} onClose={() => setEditCase(null)} title="Edit Case" size="xl">
        {editCase && <CaseForm caseData={editCase} onSuccess={() => setEditCase(null)} />}
      </Modal>
      <Modal open={!!scheduleHearing} onClose={() => setScheduleHearing(null)} title="Schedule Hearing" size="md">
        {scheduleHearing && <HearingForm defaultCaseId={scheduleHearing} onSuccess={() => setScheduleHearing(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!closeCase}
        onClose={() => setCloseCase(null)}
        onConfirm={async () => { if (closeCase) { await closeMutation.mutateAsync(closeCase.id); setCloseCase(null); } }}
        title="Close Case"
        message={`Close case ${closeCase?.case_no}? This will mark it as closed.`}
        confirmLabel="Close Case"
        danger
        loading={closeMutation.isPending}
      />
    </div>
  );
}
