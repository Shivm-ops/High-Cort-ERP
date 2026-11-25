"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  Phone,
  Briefcase,
  UserPlus,
  Loader2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import {
  useIntakes,
  useCreateIntake,
  useDeleteIntake,
  type Intake,
} from "@/lib/hooks/useIntakes";
import { useClients } from "@/lib/hooks/useClients";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  under_review: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  awaiting_documents: "bg-blue-50 text-blue-700",
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "under_review", label: "Under Review" },
  { key: "awaiting_documents", label: "Awaiting Docs" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
];

export default function IntakesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useIntakes({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search.trim() || undefined,
  });
  const { data: clientsData } = useClients({ limit: 200 });
  const createIntake = useCreateIntake();
  const deleteIntake = useDeleteIntake();

  // Start Intake Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [sourceMode, setSourceMode] = useState<"prospect" | "client">(
    "prospect"
  );
  const [prospectName, setProspectName] = useState("");
  const [prospectPhone, setProspectPhone] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [urgency, setUrgency] = useState("Normal");
  const [initialStatus, setInitialStatus] = useState("under_review");
  const [initialNarrative, setInitialNarrative] = useState("");

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<Intake | null>(null);

  const summary = data?.summary ?? {
    total: 0,
    under_review: 0,
    awaiting_documents: 0,
    accepted: 0,
    rejected: 0,
  };
  const intakes = useMemo(() => data?.intakes ?? [], [data?.intakes]);
  const clients = clientsData?.clients ?? [];

  const openNewModal = () => {
    setSourceMode("prospect");
    setProspectName("");
    setProspectPhone("");
    setSelectedClientId("");
    setUrgency("Normal");
    setInitialStatus("under_review");
    setInitialNarrative("");
    setShowNewModal(true);
  };

  const handleStartIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceMode === "prospect" && !prospectName.trim()) {
      toast.error("Please enter the walk-in prospect name");
      return;
    }
    if (sourceMode === "client" && !selectedClientId) {
      toast.error("Please select an existing client");
      return;
    }

    const res = await createIntake.mutateAsync({
      client_id: sourceMode === "client" ? selectedClientId : undefined,
      prospect_name:
        sourceMode === "prospect" ? prospectName.trim() : undefined,
      prospect_phone:
        sourceMode === "prospect" && prospectPhone.trim()
          ? prospectPhone.trim()
          : undefined,
      urgency_level: urgency,
      status: initialStatus,
      narrative: initialNarrative.trim() || undefined,
    });
    setShowNewModal(false);
    if (res?.id) {
      router.push(`/intakes/${res.id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8F6]">
      <Header
        title="Client Intake & Assessment"
        subtitle="Manage client interviews, walk-in prospects, and pre-case evaluations"
        rightContent={
          <button
            onClick={openNewModal}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
              color: "#013B36",
            }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> New Intake
          </button>
        }
      />

      <div className="flex-1 p-6 max-w-[1400px] w-full mx-auto space-y-5">
        {/* Clickable KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-sm text-left transition-all",
              statusFilter === "all"
                ? "border-mint/60 ring-2 ring-mint/15"
                : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 text-sidebar">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.total}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500">
              Total Intakes
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("under_review")}
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-sm text-left transition-all",
              statusFilter === "under_review"
                ? "border-amber-300 ring-2 ring-amber-100"
                : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.under_review}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500">Under Review</div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("awaiting_documents")}
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-sm text-left transition-all",
              statusFilter === "awaiting_documents"
                ? "border-blue-300 ring-2 ring-blue-100"
                : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.awaiting_documents}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500">
              Awaiting Docs
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("accepted")}
            className={cn(
              "bg-white rounded-2xl border p-5 shadow-sm text-left transition-all",
              statusFilter === "accepted"
                ? "border-emerald-300 ring-2 ring-emerald-100"
                : "border-gray-100 hover:border-gray-200"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {summary.accepted}
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500">Accepted</div>
          </button>
        </div>

        {/* Search & Status Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search client, walk-in name, phone, or facts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-gray-50 border border-gray-100 rounded-xl text-[13px] focus:outline-none focus:border-mint/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_FILTERS.map((st) => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-colors",
                  statusFilter === st.key
                    ? "bg-mint/15 border-mint/40 text-mint-dark"
                    : "bg-white border-gray-100 text-gray-500 hover:text-gray-900"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Intakes List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-sidebar" />
            </div>
          ) : intakes.length === 0 ? (
            <div className="py-16 text-center px-6">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {search || statusFilter !== "all"
                  ? "No Intakes Match Filters"
                  : "No Intakes Found"}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                {search || statusFilter !== "all"
                  ? "Try clearing your search or switching status filters."
                  : "Start a new client or walk-in prospect assessment to record facts, checklist items, and legal risk."}
              </p>
              {search || statusFilter !== "all" ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                  }}
                  className="h-9 px-4 rounded-xl text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-charcoal"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={openNewModal}
                  className="h-9 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                  style={{
                    background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                    color: "#013B36",
                  }}
                >
                  <Plus className="w-4 h-4" /> Start New Intake
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {intakes.map((intake) => {
                const displayName =
                  intake.client_name ||
                  intake.prospect_name ||
                  "Walk-in Prospect";
                return (
                  <div
                    key={intake.id}
                    onClick={() => router.push(`/intakes/${intake.id}`)}
                    className="p-5 hover:bg-gray-50/80 transition-colors cursor-pointer group flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg bg-gradient-to-br from-mint to-sidebar">
                      {displayName.slice(0, 1).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {displayName}
                          </h3>
                          {!intake.client_id && intake.prospect_name && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                              Walk-in Prospect
                            </span>
                          )}
                          {intake.case_id && (
                            <Link
                              href={`/cases/${intake.case_id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 hover:bg-emerald-100"
                            >
                              <Briefcase className="w-3 h-3" />
                              {intake.case_no || "Linked Case"}
                            </Link>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-semibold capitalize",
                              STATUS_COLORS[intake.status] ||
                                "bg-gray-100 text-gray-600"
                            )}
                          >
                            {intake.status.replace(/_/g, " ")}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(intake);
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete Intake"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {intake.narrative || "No narrative recorded yet."}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-400">
                        <span>
                          Started:{" "}
                          {new Date(intake.created_at).toLocaleDateString()}
                        </span>
                        {intake.prospect_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />
                            {intake.prospect_phone}
                          </span>
                        )}
                        {intake.urgency_level && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Urgency: {intake.urgency_level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start Client Intake Modal */}
      <Modal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Start Client Intake Assessment"
        size="md"
      >
        <form onSubmit={handleStartIntake} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1.5">
              Intake For
            </label>
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
              <button
                type="button"
                onClick={() => setSourceMode("prospect")}
                className={cn(
                  "h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                  sourceMode === "prospect"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-gray-500 hover:text-charcoal"
                )}
              >
                <UserPlus className="w-3.5 h-3.5" /> Walk-in Prospect
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("client")}
                className={cn(
                  "h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors",
                  sourceMode === "client"
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-gray-500 hover:text-charcoal"
                )}
              >
                <ClipboardList className="w-3.5 h-3.5" /> Existing CRM Client
              </button>
            </div>
          </div>

          {sourceMode === "prospect" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Prospect Name *
                </label>
                <input
                  required
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  placeholder="Full name"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Phone Number
                </label>
                <input
                  value={prospectPhone}
                  onChange={(e) => setProspectPhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Select Client *
              </label>
              <select
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] bg-white outline-none focus:border-mint"
              >
                <option value="">-- Choose CRM Client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] bg-white outline-none focus:border-mint"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Initial Status
              </label>
              <select
                value={initialStatus}
                onChange={(e) => setInitialStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] bg-white outline-none focus:border-mint"
              >
                <option value="under_review">Under Review</option>
                <option value="awaiting_documents">Awaiting Documents</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Initial Matter Brief / Narrative (Optional)
            </label>
            <textarea
              rows={3}
              value={initialNarrative}
              onChange={(e) => setInitialNarrative(e.target.value)}
              placeholder="Summary of dispute, key dates, or urgency..."
              className="w-full p-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint resize-y"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createIntake.isPending}
              className="h-9 px-5 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark disabled:opacity-60 flex items-center gap-1.5"
            >
              {createIntake.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Create &amp; Open Workspace
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Intake Assessment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-gray-600">
            Are you sure you want to delete this intake assessment for{" "}
            <strong className="text-charcoal">
              {deleteTarget?.client_name ||
                deleteTarget?.prospect_name ||
                "this prospect"}
            </strong>
            ?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteIntake.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
              }}
              disabled={deleteIntake.isPending}
              className="h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              {deleteIntake.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
