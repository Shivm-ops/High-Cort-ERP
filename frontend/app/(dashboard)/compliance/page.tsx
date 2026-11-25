"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Scale,
  FileSignature,
  FolderOpen,
  ExternalLink,
  CalendarDays,
  Plus,
  Calculator,
  Edit3,
  Mail,
  ShieldAlert,
  Wand2,
  Loader2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import {
  useLimitationsDashboard,
  useSetCaseLimitation,
  type LimitationMatter,
} from "@/lib/hooks/useLimitations";
import { useCases } from "@/lib/hooks/useCases";
import {
  LIMITATION_RULES,
  computeStatutoryDeadline,
} from "@/lib/constants/limitations";
import { useRouter } from "next/navigation";
import { cn, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const COURTS = [
  "All",
  "District Court",
  "Consumer Forum",
  "MACT Tribunal",
  "High Court",
  "Supreme Court",
];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  critical: { color: "#DC2626", bg: "rgba(239,68,68,0.1)" },
  overdue: { color: "#991B1B", bg: "rgba(153,27,27,0.1)" },
  warning: { color: "#D97706", bg: "rgba(245,158,11,0.1)" },
  upcoming: { color: "#CA8A04", bg: "rgba(234,179,8,0.12)" },
  safe: { color: "#059669", bg: "rgba(16,185,129,0.1)" },
};

function renderStatusIcon(status: string, color: string) {
  switch (status) {
    case "overdue":
    case "critical":
      return <AlertTriangle className="w-4 h-4" style={{ color }} />;
    case "warning":
      return <Clock className="w-4 h-4" style={{ color }} />;
    case "upcoming":
      return <CalendarDays className="w-4 h-4" style={{ color }} />;
    default:
      return <CheckCircle className="w-4 h-4" style={{ color }} />;
  }
}

export default function CompliancePage() {
  const router = useRouter();
  const [courtFilter, setCourtFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<"all" | "case" | "notice">(
    "all"
  );
  const [search, setSearch] = useState("");

  const { data, isLoading } = useLimitationsDashboard(
    courtFilter,
    sourceFilter
  );
  const { data: casesData } = useCases({ limit: 200 });
  const setCaseLimitation = useSetCaseLimitation();

  // Set / Edit Case Limitation Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCaseId, setFormCaseId] = useState("");
  const [formRuleId, setFormRuleId] = useState("");
  const [formIncidentDate, setFormIncidentDate] = useState("");
  const [formLimitationDate, setFormLimitationDate] = useState("");
  const [formAct, setFormAct] = useState("");
  const [formSection, setFormSection] = useState("");

  const allCases = casesData?.cases ?? [];

  const filteredMatters = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.matters ?? []).filter(
      (m) =>
        !q ||
        m.case_no.toLowerCase().includes(q) ||
        m.title.toLowerCase().includes(q) ||
        m.limitation_act.toLowerCase().includes(q) ||
        (m.client_name && m.client_name.toLowerCase().includes(q))
    );
  }, [data?.matters, search]);

  const applyPresetRule = (ruleId: string, incidentIso: string) => {
    const rule = LIMITATION_RULES.find((r) => r.id === ruleId);
    if (!rule) return;
    setFormAct(rule.act);
    setFormSection(rule.section);
    if (incidentIso) {
      const calc = computeStatutoryDeadline(incidentIso, rule);
      if (calc) {
        setFormLimitationDate(calc.deadlineIso);
      }
    }
  };

  const openSetLimitationModal = (existing?: LimitationMatter) => {
    if (existing && existing.case_id) {
      setFormCaseId(existing.case_id);
      setFormRuleId("");
      setFormIncidentDate(existing.incident_date || "");
      setFormLimitationDate(existing.limitation_date || "");
      setFormAct(existing.limitation_act || "");
      setFormSection(existing.limitation_section || "");
    } else {
      setFormCaseId("");
      setFormRuleId("");
      setFormIncidentDate("");
      setFormLimitationDate("");
      setFormAct("");
      setFormSection("");
    }
    setIsModalOpen(true);
  };

  const handleSaveLimitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCaseId || !formLimitationDate) {
      toast.error("Please select a Case and Limitation Date");
      return;
    }
    await setCaseLimitation.mutateAsync({
      case_id: formCaseId,
      limitation_date: formLimitationDate,
      incident_date: formIncidentDate || null,
      limitation_act: formAct.trim() || null,
      limitation_section: formSection.trim() || null,
    });
    setIsModalOpen(false);
  };

  return (
    <div className="page-enter min-h-screen bg-[#F7F8F6] flex flex-col">
      <Header
        title="Limitation & Deadline Management"
        subtitle="Statutory filing deadlines, notice reply cutoffs, and legal risk alerts"
        rightContent={
          <div className="flex items-center gap-2.5">
            <Link
              href="/tools?tool=limitation"
              className="h-9 px-3.5 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal flex items-center gap-1.5 shadow-sm"
            >
              <Calculator className="w-3.5 h-3.5 text-mint-dark" />
              Limitation Calculator
            </Link>
            <button
              onClick={() => openSetLimitationModal()}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Set Case Limitation
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sidebar" />
        </div>
      ) : (
        <div className="flex-1 p-6 max-w-[1440px] w-full mx-auto space-y-6">
          {/* 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data?.widgets.today || 0}
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  Today&apos;s Deadlines
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <CalendarDays className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data?.widgets.tomorrow || 0}
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  Tomorrow&apos;s Deadlines
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-orange-100 p-5 flex items-center gap-4 shadow-sm"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {data?.widgets.within_7_days || 0}
                </div>
                <div className="text-xs font-semibold text-gray-500">
                  Due Within 7 Days
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl border border-red-100 p-5 flex items-center gap-4 shadow-sm relative overflow-hidden"
            >
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-red-50 to-transparent" />
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center relative z-10 shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-bold text-red-600">
                  {data?.widgets.overdue || 0}
                </div>
                <div className="text-xs font-semibold text-red-700">
                  Overdue Matters
                </div>
              </div>
            </motion.div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search matter, case no, act, client..."
                    className="pl-9 pr-4 h-9 w-72 rounded-xl text-[13px] border border-gray-200 focus:outline-none focus:border-sidebar bg-white"
                  />
                </div>

                {/* Source Pills */}
                <div className="flex items-center bg-white p-1 rounded-xl border border-gray-200">
                  {[
                    {
                      key: "all" as const,
                      label: `All (${(data?.widgets.case_count || 0) + (data?.widgets.notice_count || 0)})`,
                    },
                    {
                      key: "case" as const,
                      label: `Case Limitations (${data?.widgets.case_count || 0})`,
                    },
                    {
                      key: "notice" as const,
                      label: `Notice Replies (${data?.widgets.notice_count || 0})`,
                    },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSourceFilter(s.key)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors",
                        sourceFilter === s.key
                          ? "bg-sidebar text-white shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {sourceFilter !== "notice" && (
                <div className="flex flex-wrap gap-1.5">
                  {COURTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCourtFilter(c)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all",
                        courtFilter === c
                          ? "bg-sidebar text-white shadow-sm"
                          : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 font-semibold">Risk Level</th>
                    <th className="p-4 font-semibold">Matter / Notice</th>
                    <th className="p-4 font-semibold">Limitation Source</th>
                    <th className="p-4 font-semibold text-right">Deadline</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMatters.map((m, i) => {
                    const sc = STATUS_STYLE[m.status] || STATUS_STYLE.safe;
                    return (
                      <motion.tr
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex flex-col items-start gap-1.5">
                            <div
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg"
                              style={{ background: sc.bg }}
                            >
                              {renderStatusIcon(m.status, sc.color)}
                              <span
                                className="text-xs font-bold"
                                style={{ color: sc.color }}
                              >
                                {m.risk}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                                m.source === "notice"
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-emerald-50 text-emerald-700"
                              )}
                            >
                              {m.source === "notice" ? "Notice Reply" : "Case"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-gray-900">
                            {m.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                            <span className="font-semibold">{m.case_no}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span className="flex items-center gap-1">
                              {m.source === "notice" ? (
                                <Mail className="w-3 h-3" />
                              ) : (
                                <Scale className="w-3 h-3" />
                              )}
                              {m.court}
                            </span>
                            {m.client_name && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>Client: {m.client_name}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-[13px] font-semibold text-gray-800">
                            {m.limitation_act}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {m.source === "notice"
                              ? m.limitation_section
                              : `Section / Article: ${m.limitation_section}`}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div
                            className={cn(
                              "text-base font-bold",
                              m.days_left < 0 ? "text-red-600" : "text-gray-900"
                            )}
                          >
                            {m.days_left < 0
                              ? `Overdue by ${Math.abs(m.days_left)}`
                              : m.days_left === 0
                              ? "Due Today"
                              : m.days_left}{" "}
                            {m.days_left !== 0 && (
                              <span className="text-xs font-medium text-gray-500">
                                days
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            Cutoff: {formatDate(m.limitation_date)}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {m.source === "notice" && m.notice_id ? (
                              <>
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/notices/reply-builder?noticeId=${m.notice_id}`
                                    )
                                  }
                                  className="h-8 px-2.5 text-[11px] font-semibold text-mint-dark bg-mint/15 hover:bg-mint/25 rounded-lg flex items-center gap-1"
                                  title="Draft Reply"
                                >
                                  <Wand2 className="w-3.5 h-3.5" /> Draft Reply
                                </button>
                                <button
                                  onClick={() => router.push("/notices")}
                                  className="p-2 text-gray-500 hover:text-sidebar hover:bg-sidebar/10 rounded-lg transition-colors"
                                  title="Open Notices"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => openSetLimitationModal(m)}
                                  className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Edit Limitation Deadline"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    router.push(`/cases/${m.case_id || m.id}`)
                                  }
                                  className="p-2 text-gray-500 hover:text-sidebar hover:bg-sidebar/10 rounded-lg transition-colors"
                                  title="Open Case"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    router.push("/draft-workspace")
                                  }
                                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Open Draft Workspace"
                                >
                                  <FileSignature className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push("/evidence")}
                                  className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Evidence & Docs"
                                >
                                  <FolderOpen className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}

                  {filteredMatters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="text-sm font-bold text-charcoal">
                            No active limitation or reply deadlines found
                          </div>
                          <p className="text-xs text-muted">
                            Set a statutory filing deadline on any Case, or record a Legal Notice reply deadline to track urgent cutoffs here.
                          </p>
                          <div className="flex items-center justify-center gap-3 pt-1">
                            <button
                              onClick={() => openSetLimitationModal()}
                              className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                              style={{
                                background:
                                  "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                                color: "#013B36",
                              }}
                            >
                              <Plus className="w-3.5 h-3.5" /> Set Case Limitation
                            </button>
                            <Link
                              href="/tools?tool=limitation"
                              className="h-9 px-4 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal flex items-center gap-1.5"
                            >
                              <Calculator className="w-3.5 h-3.5" /> Open Calculator
                            </Link>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Set / Edit Case Limitation Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Set Case Statutory Limitation Deadline"
        size="lg"
      >
        <form onSubmit={handleSaveLimitation} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Select Case / Matter *
            </label>
            <select
              required
              value={formCaseId}
              onChange={(e) => {
                const cid = e.target.value;
                setFormCaseId(cid);
                const cObj = allCases.find((c) => c.id === cid);
                if (cObj) {
                  if (cObj.limitation_date) {
                    setFormLimitationDate(cObj.limitation_date);
                  }
                  if (cObj.limitation_act) setFormAct(cObj.limitation_act);
                  if (cObj.limitation_section) {
                    setFormSection(cObj.limitation_section);
                  }
                }
              }}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
            >
              <option value="">-- Choose Case --</option>
              {allCases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_no ? `${c.case_no} — ` : ""}
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl bg-emerald-50/40 border border-emerald-100 p-3.5 space-y-3">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Auto-Calculate from Indian Statute (Optional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Cause of Action / Provision
                </label>
                <select
                  value={formRuleId}
                  onChange={(e) => {
                    const nextRule = e.target.value;
                    setFormRuleId(nextRule);
                    applyPresetRule(nextRule, formIncidentDate);
                  }}
                  className="w-full h-9 px-2.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none"
                >
                  <option value="">-- Select Preset Rule --</option>
                  {LIMITATION_RULES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label} ({r.amount} {r.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Cause of Action / Incident Date
                </label>
                <input
                  type="date"
                  value={formIncidentDate}
                  onChange={(e) => {
                    const d = e.target.value;
                    setFormIncidentDate(d);
                    if (formRuleId) {
                      applyPresetRule(formRuleId, d);
                    }
                  }}
                  className="w-full h-9 px-2.5 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Filing Limitation Date *
              </label>
              <input
                type="date"
                required
                value={formLimitationDate}
                onChange={(e) => setFormLimitationDate(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Act / Statute
              </label>
              <input
                value={formAct}
                onChange={(e) => setFormAct(e.target.value)}
                placeholder="e.g. Limitation Act, 1963"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Section / Article
              </label>
              <input
                value={formSection}
                onChange={(e) => setFormSection(e.target.value)}
                placeholder="e.g. Article 136"
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={setCaseLimitation.isPending}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              {setCaseLimitation.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Save Limitation Date
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
