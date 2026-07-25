"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gavel, CalendarDays, Clock, MapPin, User, Plus, ChevronLeft, ChevronRight,
  Pencil, Trash2, ExternalLink, AlertCircle, FileText, CheckCircle, Scale,
  Building2, Upload, FileBox, Search, ChevronDown, X, ListChecks,
  PrinterIcon, Download, Filter, LayoutList, Calendar, RefreshCw,
  ArrowRight, BookOpen, BadgeAlert, ClipboardCheck, Layers
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import HearingForm from "@/components/forms/HearingForm";
import {
  useHearings, useHearingStats, useUpdateHearing, useDeleteHearing, Hearing,
} from "@/lib/hooks/useHearings";
import { useUpcomingTasks } from "@/lib/hooks/useTasks";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ── Constants ──────────────────────────────────────────────────────────────────
const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const QUICK_TABS = ["All", "Today", "Upcoming", "Completed", "Adjourned"] as const;
type QuickTab = typeof QUICK_TABS[number];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  scheduled:  { label: "Scheduled",  bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-500" },
  completed:  { label: "Completed",  bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  adjourned:  { label: "Adjourned",  bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-500" },
  cancelled:  { label: "Cancelled",  bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500" },
};

const READINESS_OPTIONS = ["Ready","Documents Missing","Evidence Missing","Arguments Pending","Case Laws Pending"];
const READINESS_CONFIG: Record<string, { bg: string; text: string; icon: any }> = {
  "Ready":              { bg: "bg-green-100",  text: "text-green-700",  icon: CheckCircle },
  "Documents Missing":  { bg: "bg-red-100",    text: "text-red-700",    icon: FileBox },
  "Evidence Missing":   { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
  "Arguments Pending":  { bg: "bg-blue-100",   text: "text-blue-700",   icon: FileText },
  "Case Laws Pending":  { bg: "bg-purple-100", text: "text-purple-700", icon: Scale },
  "pending":            { bg: "bg-gray-100",   text: "text-gray-600",   icon: Clock },
};

const CHECKLIST_ITEMS = [
  { key: "documents_ready",  label: "Documents Ready" },
  { key: "evidence_ready",   label: "Evidence Ready" },
  { key: "arguments_ready",  label: "Arguments Ready" },
  { key: "case_laws_added",  label: "Case Laws Added" },
];

const CARRY_ITEMS = [
  { key: "carry_original_documents", label: "Original Documents" },
  { key: "carry_affidavit",          label: "Affidavit" },
  { key: "carry_evidence",           label: "Evidence / Exhibits" },
  { key: "carry_court_fees",         label: "Court Fees / Stamps" },
  { key: "carry_other_records",      label: "Other Req. Records" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function getDaysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function fmtDate(d?: string) {
  if (!d) return "–";
  return new Date(d + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(t?: string) {
  if (!t) return "–";
  const [h, m] = t.split(":");
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr}:${m} ${hr >= 12 ? "PM" : "AM"}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, subtitle }: { label: string; value: number; icon: any; color: string; subtitle?: string }) {
  return (
    <div className={cn("bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-all group cursor-default")}>
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <h2 className="text-3xl font-black text-gray-900">{value}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const cfg = STATUS_CONFIG[status || "scheduled"] || STATUS_CONFIG.scheduled;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold", cfg.bg, cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function ReadinessBadge({ status }: { status?: string }) {
  const cfg = READINESS_CONFIG[status || "pending"] || READINESS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold", cfg.bg, cfg.text)}>
      <Icon className="w-3 h-3" />
      {status && status !== "pending" ? status : "Not Set"}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function HearingsPage() {
  const router = useRouter();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // View state
  const [viewMode, setViewMode] = useState<"table" | "calendar">("table");
  const [activeTab, setActiveTab] = useState<QuickTab>("All");
  const [search, setSearch] = useState("");
  const [filterCourt, setFilterCourt] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editHearing, setEditHearing] = useState<Hearing | null>(null);
  const [deleteHearing, setDeleteHearing] = useState<Hearing | null>(null);
  const [prepHearing, setPrepHearing] = useState<Hearing | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Data
  const monthStart = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
  const monthEnd   = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${getDaysInMonth(calYear, calMonth).toString().padStart(2, "0")}`;

  const { data: allData, isLoading } = useHearings({ date_from: monthStart, date_to: monthEnd, limit: 500 });
  const { data: calData } = useHearings({ date_from: monthStart, date_to: monthEnd });
  const { data: selectedData } = useHearings({ date_from: selectedDate, date_to: selectedDate });
  const { data: upcomingTasksData } = useUpcomingTasks();
  const stats = useHearingStats();
  const updateHearing = useUpdateHearing();
  const deleteMutation = useDeleteHearing();

  const allHearings = allData?.hearings || [];
  const hearingDates = new Set((calData?.hearings || []).map(h => h.hearing_date));

  // Filtered hearings for table view
  const filteredHearings = useMemo(() => {
    let list = allHearings;
    const q = search.toLowerCase();

    if (activeTab === "Today")     list = list.filter(h => h.hearing_date === todayStr);
    if (activeTab === "Upcoming")  list = list.filter(h => h.hearing_date > todayStr && h.status === "scheduled");
    if (activeTab === "Completed") list = list.filter(h => h.status === "completed");
    if (activeTab === "Adjourned") list = list.filter(h => h.status === "adjourned");

    if (q) list = list.filter(h =>
      h.case_title?.toLowerCase().includes(q) ||
      h.case_no?.toLowerCase().includes(q) ||
      h.court?.toLowerCase().includes(q) ||
      h.client_name?.toLowerCase().includes(q) ||
      h.judge?.toLowerCase().includes(q)
    );
    if (filterCourt)  list = list.filter(h => h.court?.toLowerCase().includes(filterCourt.toLowerCase()));
    if (filterStatus) list = list.filter(h => h.status === filterStatus);

    return list;
  }, [allHearings, activeTab, search, filterCourt, filterStatus]);

  // Calendar date hearings
  const selectedHearings = selectedData?.hearings || [];

  const handleReadinessChange = async (h: Hearing, value: string) => {
    await updateHearing.mutateAsync({ id: h.id, readiness_status: value });
    setOpenDropdown(null);
  };

  const handleChecklistToggle = async (h: Hearing, key: string, value: boolean) => {
    await updateHearing.mutateAsync({ id: h.id, preparation_checklist: { ...(h.preparation_checklist || {}), [key]: value } });
  };

  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header
        title="Hearings"
        subtitle="Manage your court hearings, schedules, preparation, and daily appearances."
        rightContent={
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <PrinterIcon className="w-4 h-4" /> Print
            </button>
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-sidebar text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-sidebar-dark transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> Add Hearing
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* ── SUMMARY CARDS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today's Hearings" value={stats.today} icon={Gavel}        color="bg-blue-50 text-blue-600"   subtitle="Scheduled for today" />
          <StatCard label="Upcoming"          value={stats.upcoming} icon={CalendarDays} color="bg-amber-50 text-amber-600"  subtitle="Next 30 days" />
          <StatCard label="Completed"         value={stats.completed} icon={CheckCircle} color="bg-green-50 text-green-600"  subtitle="This period" />
          <StatCard label="Adjourned"         value={stats.adjourned} icon={BadgeAlert}  color="bg-red-50 text-red-600"     subtitle="Awaiting new date" />
        </div>

        {/* ── TOOLBAR ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          {/* Quick Tabs */}
          <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-gray-100">
            <div className="flex items-center gap-1">
              {QUICK_TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("px-4 py-2.5 text-sm font-bold rounded-t-lg transition-colors border-b-2 -mb-px",
                    activeTab === tab
                      ? "border-sidebar text-sidebar bg-sidebar/5"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  )}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pb-2">
              <button onClick={() => setViewMode("table")} className={cn("p-2 rounded-lg transition-colors", viewMode === "table" ? "bg-sidebar/10 text-sidebar" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}>
                <LayoutList className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode("calendar")} className={cn("p-2 rounded-lg transition-colors", viewMode === "calendar" ? "bg-sidebar/10 text-sidebar" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100")}>
                <Calendar className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-3 p-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by case, court, judge, client…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button onClick={() => setShowFilters(f => !f)} className={cn("flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border transition-colors", showFilters ? "bg-sidebar/10 border-sidebar/20 text-sidebar" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}>
              <Filter className="w-3.5 h-3.5" /> Filters {(filterCourt || filterStatus) && <span className="w-1.5 h-1.5 rounded-full bg-sidebar" />}
            </button>
            {(search || filterCourt || filterStatus || activeTab !== "All") && (
              <button onClick={() => { setSearch(""); setFilterCourt(""); setFilterStatus(""); setActiveTab("All"); }}
                className="text-xs font-semibold text-gray-500 hover:text-sidebar px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden border-t border-gray-100">
                <div className="p-3 flex flex-wrap gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Court</label>
                    <input type="text" placeholder="Filter by court…" value={filterCourt} onChange={e => setFilterCourt(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-sidebar w-44" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-sidebar bg-white">
                      <option value="">All Statuses</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                      <option value="adjourned">Adjourned</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── TABLE / CALENDAR ── */}
        {viewMode === "table" ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredHearings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Gavel className="w-9 h-9 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">No hearings scheduled</h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6">Your hearing list is clear for the selected filters. Schedule a new hearing or adjust your search.</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 bg-sidebar text-white rounded-xl text-sm font-bold hover:bg-sidebar-dark transition-colors">
                    + Add Hearing
                  </button>
                  <button onClick={() => { setSearch(""); setFilterCourt(""); setFilterStatus(""); setActiveTab("All"); }}
                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
                    Clear Filters
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <div>Case / Matter</div>
                  <div>Court & Judge</div>
                  <div>Date & Time</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                {/* Table Rows */}
                <div className="divide-y divide-gray-50">
                  {filteredHearings.map((h, i) => {
                    const rdCfg = READINESS_CONFIG[h.readiness_status || "pending"] || READINESS_CONFIG.pending;
                    const RdIcon = rdCfg.icon;
                    return (
                      <motion.div
                        key={h.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="grid grid-cols-[2fr_1.5fr_1fr_1fr_auto] gap-4 px-5 py-4 hover:bg-gray-50/80 transition-colors items-center group"
                      >
                        {/* Case */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200 shrink-0">
                              {h.case_no || "No Case No"}
                            </span>
                            {h.purpose && (
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-sidebar/10 text-sidebar rounded shrink-0">{h.purpose}</span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-gray-900 truncate">{h.case_title || "Untitled Matter"}</div>
                          {h.client_name && (
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <User className="w-3 h-3" /> {h.client_name}
                            </div>
                          )}
                        </div>

                        {/* Court & Judge */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 truncate">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="truncate">{h.court || "–"}</span>
                          </div>
                          {h.courtroom && <div className="text-xs text-gray-400 mt-0.5 ml-5">{h.courtroom}</div>}
                          {h.judge && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <Gavel className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{h.judge}</span>
                            </div>
                          )}
                          {h.attended_by && (
                            <div className="flex items-center gap-1.5 text-xs text-sidebar mt-1">
                              <User className="w-3 h-3 shrink-0" />
                              <span className="truncate">{h.attended_by}</span>
                            </div>
                          )}
                        </div>

                        {/* Date & Time */}
                        <div>
                          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                            <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                            {fmtDate(h.hearing_date)}
                          </div>
                          {h.hearing_time && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3" /> {fmtTime(h.hearing_time)}
                            </div>
                          )}
                        </div>

                        {/* Status + Readiness */}
                        <div className="space-y-1.5">
                          <StatusBadge status={h.status} />
                          <div>
                            {/* Readiness dropdown */}
                            <div className="relative">
                              <button onClick={() => setOpenDropdown(openDropdown === h.id ? null : h.id)}
                                className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-transparent transition-colors hover:border-gray-200", rdCfg.bg, rdCfg.text)}>
                                <RdIcon className="w-3 h-3" />
                                {h.readiness_status && h.readiness_status !== "pending" ? h.readiness_status : "Set Readiness"}
                                <ChevronDown className="w-3 h-3 ml-0.5" />
                              </button>
                              <AnimatePresence>
                                {openDropdown === h.id && (
                                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                    className="absolute left-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1">
                                    {READINESS_OPTIONS.map(opt => (
                                      <button key={opt} onClick={() => handleReadinessChange(h, opt)}
                                        className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                        {opt}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setPrepHearing(h)} title="Preparation Details"
                            className="p-1.5 text-gray-400 hover:text-sidebar hover:bg-sidebar/10 rounded-lg transition-colors">
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                          <button onClick={() => router.push(`/cases/${h.case_id}`)} title="Open Case"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditHearing(h)} title="Edit Hearing"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteHearing(h)} title="Delete Hearing"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Table Footer */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">{filteredHearings.length} hearing{filteredHearings.length !== 1 ? "s" : ""} shown</span>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── CALENDAR VIEW ── */
          <div className="flex gap-6">
            {/* Mini Calendar */}
            <div className="w-80 flex-shrink-0 space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-sm font-bold text-gray-900">{MONTHS[calMonth]} {calYear}</span>
                  <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_OF_WEEK.map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-black text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: getFirstDayOfMonth(calYear, calMonth) }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: getDaysInMonth(calYear, calMonth) }).map((_, i) => {
                    const day = i + 1;
                    const ds = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday = ds === todayStr;
                    const isSelected = ds === selectedDate;
                    const hasHearing = hearingDates.has(ds);
                    return (
                      <button key={day} onClick={() => setSelectedDate(ds)}
                        className={cn("relative h-8 w-full rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                          isSelected ? "bg-sidebar text-white shadow-sm"
                          : isToday ? "text-sidebar bg-sidebar/10 ring-1 ring-inset ring-sidebar/20"
                          : "text-gray-700 hover:bg-gray-50")}>
                        {day}
                        {hasHearing && !isSelected && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sidebar" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-red-50/50 p-3.5 border-b border-red-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <h3 className="text-sm font-bold text-red-900">Upcoming Deadlines</h3>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{upcomingTasksData?.total || 0}</span>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {!upcomingTasksData?.tasks?.length ? (
                    <div className="p-4 text-center text-sm text-gray-500">No upcoming deadlines</div>
                  ) : upcomingTasksData.tasks.map(task => (
                    <div key={task.id} onClick={() => router.push(`/cases/${task.case_id}`)}
                      className="p-3 hover:bg-gray-50 rounded-xl cursor-pointer border border-transparent hover:border-gray-100 transition-colors">
                      <div className="text-sm font-bold text-gray-900 truncate">{task.case_title || "Matter"}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{task.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Day's Hearings */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{selectedHearings.length} hearing{selectedHearings.length !== 1 ? "s" : ""}</p>
                  </div>
                  <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-white bg-sidebar rounded-xl hover:bg-sidebar-dark transition-colors">
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
                {selectedHearings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Gavel className="w-10 h-10 text-gray-200 mb-3" />
                    <p className="text-gray-500 font-medium">No hearings on this date</p>
                    <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-white border border-gray-200 text-sm font-bold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                      Schedule Hearing
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {selectedHearings.map(h => (
                      <div key={h.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="text-center w-14 bg-white rounded-xl p-2 border border-gray-100 shadow-sm flex-shrink-0">
                              <div className="text-xl font-black text-gray-900">{h.hearing_time?.split(":")[0] || "–"}</div>
                              <div className="text-[10px] font-bold text-gray-400">{h.hearing_time ? fmtTime(h.hearing_time).split(" ")[1] : ""}</div>
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-gray-500">{h.case_no}</span>
                                <StatusBadge status={h.status} />
                              </div>
                              <h4 className="font-bold text-gray-900">{h.case_title}</h4>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                                {h.court && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{h.court}</span>}
                                {h.judge && <span className="flex items-center gap-1"><Gavel className="w-3 h-3" />{h.judge}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setPrepHearing(h)} className="p-1.5 text-gray-400 hover:text-sidebar hover:bg-sidebar/10 rounded-lg transition-colors"><ClipboardCheck className="w-4 h-4" /></button>
                            <button onClick={() => router.push(`/cases/${h.case_id}`)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><ExternalLink className="w-4 h-4" /></button>
                            <button onClick={() => setEditHearing(h)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}

      {/* Create */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Schedule Hearing" size="md">
        <HearingForm onSuccess={() => setShowCreate(false)} />
      </Modal>

      {/* Edit */}
      <Modal open={!!editHearing} onClose={() => setEditHearing(null)} title="Edit Hearing" size="md">
        {editHearing && <HearingForm hearing={editHearing} onSuccess={() => setEditHearing(null)} />}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteHearing}
        onClose={() => setDeleteHearing(null)}
        onConfirm={async () => { if (deleteHearing) { await deleteMutation.mutateAsync(deleteHearing.id); setDeleteHearing(null); }}}
        title="Delete Hearing"
        message={`Delete hearing for ${deleteHearing?.case_no}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />

      {/* Preparation Panel */}
      <AnimatePresence>
        {prepHearing && (
          <div className="fixed inset-0 z-50 flex items-center justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setPrepHearing(null)} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-lg h-full bg-white shadow-2xl overflow-y-auto flex flex-col"
            >
              {/* Panel Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex items-start justify-between z-10">
                <div>
                  <span className="text-xs font-mono font-bold text-gray-400">{prepHearing.case_no}</span>
                  <h3 className="text-lg font-bold text-gray-900 mt-0.5">{prepHearing.case_title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={prepHearing.status} />
                    <ReadinessBadge status={prepHearing.readiness_status} />
                  </div>
                </div>
                <button onClick={() => setPrepHearing(null)} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 flex-1">
                {/* Hearing Info */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Court",      value: prepHearing.court },
                    { label: "Courtroom",  value: prepHearing.courtroom },
                    { label: "Judge",      value: prepHearing.judge },
                    { label: "Date",       value: fmtDate(prepHearing.hearing_date) },
                    { label: "Time",       value: fmtTime(prepHearing.hearing_time) },
                    { label: "Stage",      value: prepHearing.purpose },
                    { label: "Client",     value: prepHearing.client_name },
                    { label: "Advocate",   value: prepHearing.attended_by },
                  ].map(({ label, value }) => value ? (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-sm font-semibold text-gray-800">{value}</div>
                    </div>
                  ) : null)}
                </div>

                {/* Notes */}
                {prepHearing.notes && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Hearing Notes
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">{prepHearing.notes}</p>
                  </div>
                )}

                {/* Preparation Checklist */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <ListChecks className="w-4 h-4 text-sidebar" /> Preparation Checklist
                  </h4>
                  <div className="space-y-2">
                    {CHECKLIST_ITEMS.map(item => {
                      const checked = (prepHearing.preparation_checklist as any)?.[item.key] || false;
                      return (
                        <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                          <input type="checkbox" checked={checked}
                            onChange={e => handleChecklistToggle(prepHearing, item.key, e.target.checked)}
                            className="w-4 h-4 rounded text-sidebar focus:ring-sidebar border-gray-300" />
                          <span className={cn("text-sm font-medium transition-colors", checked ? "line-through text-gray-400" : "text-gray-700 group-hover:text-gray-900")}>
                            {item.label}
                          </span>
                          {checked && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* What to Carry */}
                <div>
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-sidebar" /> What to Carry
                  </h4>
                  <div className="space-y-2">
                    {CARRY_ITEMS.map(item => {
                      const checked = (prepHearing.preparation_checklist as any)?.[item.key] || false;
                      return (
                        <label key={item.key} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                          <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                            checked ? "bg-sidebar border-sidebar" : "border-gray-300 group-hover:border-sidebar/50")}>
                            {checked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={cn("text-sm font-medium transition-colors", checked ? "line-through text-gray-400" : "text-gray-700")}>
                            {item.label}
                          </span>
                          <input type="checkbox" className="hidden" checked={checked}
                            onChange={e => handleChecklistToggle(prepHearing, item.key, e.target.checked)} />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Open Case",     icon: ExternalLink, action: () => router.push(`/cases/${prepHearing.case_id}`) },
                      { label: "Upload Order",  icon: Upload,       action: () => router.push(`/cases/${prepHearing.case_id}?tab=documents`) },
                      { label: "View Drafts",   icon: FileText,     action: () => router.push(`/cases/${prepHearing.case_id}?tab=drafts`) },
                      { label: "Case Laws",     icon: Scale,        action: () => router.push(`/cases/${prepHearing.case_id}?tab=case_laws`) },
                    ].map(({ label, icon: Icon, action }) => (
                      <button key={label} onClick={action}
                        className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-sidebar hover:border-sidebar/30 transition-all">
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panel Footer */}
              <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3">
                <button onClick={() => setEditHearing(prepHearing)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-sidebar text-white rounded-xl text-sm font-bold hover:bg-sidebar-dark transition-colors">
                  <Pencil className="w-4 h-4" /> Edit Hearing
                </button>
                <button onClick={() => setPrepHearing(null)} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
