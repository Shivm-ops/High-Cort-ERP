"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, User, Plus, ChevronLeft, ChevronRight, Pencil, Trash2, ExternalLink, AlertCircle, FileText, CheckCircle, Scale, Building2, Calendar, FileBox, Upload, Milestone, Gavel, FileCheck2, Search, ChevronDown } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import HearingForm from "@/components/forms/HearingForm";
import { useHearings, useUpdateHearing, useDeleteHearing, Hearing } from "@/lib/hooks/useHearings";
import { useUpcomingTasks } from "@/lib/hooks/useTasks";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Utility functions
const DAYS_OF_WEEK = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getRelativeDateLabel(dateStr?: string) {
  if (!dateStr) return { label: "Unknown", diffDays: 999 };
  const target = new Date(dateStr);
  const today = new Date();
  target.setHours(0,0,0,0);
  today.setHours(0,0,0,0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return { label: "Overdue", diffDays };
  if (diffDays === 0) return { label: "Today", diffDays };
  if (diffDays === 1) return { label: "Tomorrow", diffDays };
  if (diffDays > 1 && diffDays < 7) return { label: `In ${diffDays} Days`, diffDays };
  if (diffDays >= 7 && diffDays < 14) return { label: "Next Week", diffDays };
  return { label: new Date(dateStr).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' }), diffDays };
}

function getTaskColors(diffDays: number) {
  if (diffDays < 0) return { bg: "bg-red-100", text: "text-red-800" };
  if (diffDays <= 1) return { bg: "bg-red-50", text: "text-red-600" };
  if (diffDays <= 3) return { bg: "bg-amber-50", text: "text-amber-600" };
  return { bg: "bg-gray-100", text: "text-gray-600" };
}

function getCourtType(courtName: string = "") {
  const c = courtName.toLowerCase();
  if (c.includes("high court") || c.includes("hc")) return "High Court";
  if (c.includes("district") || c.includes("sessions") || c.includes("city civil")) return "District & Sessions Court";
  if (c.includes("consumer") || c.includes("ncdrc") || c.includes("scdrc") || c.includes("dcdrf")) return "Consumer Court";
  if (c.includes("tribunal") || c.includes("nclt") || c.includes("drbt") || c.includes("nclat")) return "Tribunals";
  if (c.includes("supreme")) return "Supreme Court";
  return "Other Courts";
}

const READINESS_OPTIONS = [
  "Ready", 
  "Documents Missing", 
  "Evidence Missing", 
  "Arguments Pending", 
  "Case Laws Pending"
];

const READINESS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  "Ready": { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle },
  "Documents Missing": { bg: "bg-red-100", text: "text-red-700", icon: FileBox },
  "Evidence Missing": { bg: "bg-orange-100", text: "text-orange-700", icon: AlertCircle },
  "Arguments Pending": { bg: "bg-blue-100", text: "text-blue-700", icon: FileText },
  "Case Laws Pending": { bg: "bg-purple-100", text: "text-purple-700", icon: Scale },
  "pending": { bg: "bg-gray-100", text: "text-gray-600", icon: Clock },
};

const CHECKLIST_ITEMS = [
  { key: "documents_ready", label: "Documents Ready" },
  { key: "evidence_ready", label: "Evidence Ready" },
  { key: "arguments_ready", label: "Arguments Ready" },
  { key: "case_laws_added", label: "Case Laws Added" },
];

export default function HearingsPage() {
  const router = useRouter();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const [showCreate, setShowCreate] = useState(false);
  const [editHearing, setEditHearing] = useState<Hearing | null>(null);
  const [deleteHearing, setDeleteHearing] = useState<Hearing | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
  const monthEnd = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${getDaysInMonth(currentYear, currentMonth).toString().padStart(2, "0")}`;

  const { data: monthData } = useHearings({ date_from: monthStart, date_to: monthEnd });
  const { data: selectedData, isLoading } = useHearings({ date_from: selectedDate, date_to: selectedDate });
  const { data: upcomingTasksData } = useUpcomingTasks();
  
  const updateHearing = useUpdateHearing();
  const deleteMutation = useDeleteHearing();

  const selectedHearings = selectedData?.hearings || [];
  const hearingDates = new Set((monthData?.hearings || []).map((h) => h.hearing_date));
  
  // Calculate grouped hearings
  const groupedHearings = selectedHearings.reduce((acc, h) => {
    const type = getCourtType(h.court);
    if (!acc[type]) acc[type] = [];
    acc[type].push(h);
    return acc;
  }, {} as Record<string, Hearing[]>);

  // Quick Stats
  const allHearings = monthData?.hearings || [];
  const todaysCount = allHearings.filter(h => h.hearing_date === todayStr).length;
  const upcomingCount = allHearings.filter(h => h.hearing_date > todayStr && h.status === "scheduled").length;
  const thisWeekCount = allHearings.filter(h => {
    const hDate = new Date(h.hearing_date);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    return hDate >= today && hDate <= endOfWeek;
  }).length;
  
  // Handlers
  const handleChecklistToggle = async (hearing: Hearing, key: string, value: boolean) => {
    const currentChecklist = hearing.preparation_checklist || {};
    await updateHearing.mutateAsync({
      id: hearing.id,
      preparation_checklist: { ...currentChecklist, [key]: value }
    });
  };

  const handleReadinessChange = async (hearing: Hearing, status: string) => {
    await updateHearing.mutateAsync({
      id: hearing.id,
      readiness_status: status
    });
    setOpenDropdown(null);
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Hearing Command Center" subtitle="Prepare, track, and manage all your court appearances" />

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* TOP METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Today's Hearings</p>
              <h2 className="text-3xl font-bold text-gray-900">{todaysCount}</h2>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Gavel className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">This Week</p>
              <h2 className="text-3xl font-bold text-gray-900">{thisWeekCount}</h2>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Upcoming (Total)</p>
              <h2 className="text-3xl font-bold text-gray-900">{upcomingCount}</h2>
            </div>
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* MAIN WORKSPACE: CAUSE LIST */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sidebar/10 text-sidebar rounded-xl flex items-center justify-center">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Cause List</h2>
                  <p className="text-sm text-gray-500 font-medium">
                    {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreate(true)} className="h-10 px-5 rounded-xl text-sm font-bold flex items-center gap-2 bg-sidebar text-white hover:bg-sidebar-dark transition-colors shadow-sm">
                <Plus className="w-4 h-4" /> Schedule Hearing
              </button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                    <div className="h-5 bg-gray-100 rounded w-1/3 mb-4" />
                    <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                  </div>
                ))}
              </div>
            ) : selectedHearings.length === 0 ? (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gavel className="w-8 h-8 text-gray-300" />
                </div>
                <div className="text-lg font-bold text-gray-700">No matters listed for this date</div>
                <div className="text-sm text-gray-500 mt-2 max-w-sm mx-auto">Your cause list is clear. Select another date from the calendar or schedule a new hearing.</div>
                <button onClick={() => setShowCreate(true)} className="mt-6 px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-colors">
                  Schedule Hearing
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedHearings).map(([courtType, hearings]) => (
                  <div key={courtType} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-gray-400" />
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{courtType}</h3>
                      <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{hearings.length}</span>
                    </div>

                    <div className="grid gap-4">
                      {hearings.map((h, i) => {
                        const statusConfig = READINESS_COLORS[h.readiness_status || "pending"] || READINESS_COLORS["pending"];
                        const StatusIcon = statusConfig.icon;
                        const checklist = h.preparation_checklist || {};

                        return (
                          <motion.div
                            key={h.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 p-0 hover:shadow-md transition-all overflow-hidden flex flex-col"
                          >
                            <div className="p-5 flex items-start gap-4">
                              {/* Time Column */}
                              <div className="text-center flex-shrink-0 w-16 bg-gray-50 rounded-xl p-2 border border-gray-100">
                                {h.hearing_time ? (
                                  <>
                                    <div className="text-xl font-black text-gray-900">{h.hearing_time.split(":")[0]}</div>
                                    <div className="text-xs font-bold text-gray-500">{h.hearing_time.split(":")[1]} {parseInt(h.hearing_time.split(":")[0]) >= 12 ? 'PM' : 'AM'}</div>
                                  </>
                                ) : (
                                  <Clock className="w-6 h-6 text-gray-300 mx-auto my-2" />
                                )}
                              </div>
                              
                              {/* Details Column */}
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold px-2 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-200">{h.case_no}</span>
                                    <span className="text-xs font-bold px-2.5 py-1 bg-sidebar/10 text-sidebar rounded-md">{h.purpose || "Hearing"}</span>
                                  </div>
                                  
                                  {/* Readiness Dropdown */}
                                  <div className="relative">
                                    <button 
                                      onClick={() => setOpenDropdown(openDropdown === h.id ? null : h.id)}
                                      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-transparent", statusConfig.bg, statusConfig.text, openDropdown === h.id ? "ring-2 ring-offset-1" : "")}>
                                      <StatusIcon className="w-3.5 h-3.5" />
                                      {h.readiness_status && h.readiness_status !== "pending" ? h.readiness_status : "Set Readiness"}
                                      <ChevronDown className="w-3 h-3 ml-1" />
                                    </button>
                                    {openDropdown === h.id && (
                                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-10 py-1 overflow-hidden">
                                        {READINESS_OPTIONS.map(opt => (
                                          <button 
                                            key={opt}
                                            onClick={() => handleReadinessChange(h, opt)}
                                            className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                          >
                                            {opt}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <h4 className="text-base font-bold text-gray-900 truncate pr-4">{h.case_title || "Untitled Matter"}</h4>
                                
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <MapPin className="w-3.5 h-3.5 text-gray-400" /> {h.court || "Court not specified"} {h.courtroom ? `(${h.courtroom})` : ""}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <User className="w-3.5 h-3.5 text-gray-400" /> {h.judge ? `Before ${h.judge}` : "Judge not assigned"}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs font-medium text-sidebar">
                                    <User className="w-3.5 h-3.5" /> Assigned: {h.attended_by || "Unassigned"}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Checklist & Actions Footer */}
                            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Preparation</span>
                                <div className="flex items-center gap-3">
                                  {CHECKLIST_ITEMS.map((item) => (
                                    <label key={item.key} className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 cursor-pointer hover:text-gray-900">
                                      <input 
                                        type="checkbox" 
                                        checked={(checklist as any)[item.key] || false}
                                        onChange={(e) => handleChecklistToggle(h, item.key, e.target.checked)}
                                        className="w-3.5 h-3.5 rounded text-sidebar focus:ring-sidebar border-gray-300"
                                      />
                                      {item.label}
                                    </label>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Quick Actions */}
                              <div className="flex items-center gap-2">
                                <button onClick={() => router.push(`/cases/${h.case_id}`)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" /> Open
                                </button>
                                <button onClick={() => router.push(`/cases/${h.case_id}?tab=documents`)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1">
                                  <Upload className="w-3 h-3" /> Upload Order
                                </button>
                                <button onClick={() => router.push(`/cases/${h.case_id}?tab=drafts`)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-1">
                                  <FileText className="w-3 h-3" /> Drafts
                                </button>
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <button onClick={() => setEditHearing(h)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteHearing(h)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="w-80 flex-shrink-0 space-y-5">
            {/* Mini Calendar for Cause List Selection */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <button onClick={prevMonth} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <span className="text-sm font-bold text-gray-900">{MONTHS[currentMonth]} {currentYear}</span>
                <button onClick={nextMonth} className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS_OF_WEEK.map((d, idx) => (
                  <div key={idx} className="text-center text-[10px] font-black text-gray-400 py-1">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, i) => (
                  <div key={`e-${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;
                  const hasHearing = hearingDates.has(dateStr);
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={cn(
                        "relative h-8 w-full rounded-lg text-xs font-bold transition-all flex items-center justify-center",
                        isSelected
                          ? "bg-sidebar text-white shadow-sm"
                          : isToday
                          ? "text-sidebar bg-sidebar/10 ring-1 ring-inset ring-sidebar/20"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      {day}
                      {hasHearing && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sidebar" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Deadlines Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 p-0 shadow-sm overflow-hidden">
              <div className="bg-red-50/50 p-4 border-b border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <h3 className="text-sm font-bold text-red-900">Upcoming Deadlines</h3>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">{upcomingTasksData?.total || 0}</span>
              </div>
              <div className="p-2">
                {!upcomingTasksData?.tasks || upcomingTasksData.tasks.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500 font-medium">No upcoming deadlines</div>
                ) : (
                  upcomingTasksData.tasks.map(task => {
                    const { label, diffDays } = getRelativeDateLabel(task.deadline);
                    const colors = getTaskColors(diffDays);
                    return (
                      <div key={task.id} onClick={() => router.push(`/cases/${task.case_id}`)} className="p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>{label}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">{task.task_type.replace('_', ' ')}</span>
                        </div>
                        <div className="text-sm font-bold text-gray-900 truncate">{task.case_title || "Matter"}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{task.title}</div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-center">
                <button className="text-xs font-bold text-sidebar hover:text-sidebar-dark transition-colors">View All Deadlines →</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Schedule Hearing" size="md">
        <HearingForm onSuccess={() => { setShowCreate(false); }} />
      </Modal>

      <Modal open={!!editHearing} onClose={() => setEditHearing(null)} title="Edit Hearing" size="md">
        {editHearing && (
          <HearingForm hearing={editHearing} onSuccess={() => setEditHearing(null)} />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteHearing}
        onClose={() => setDeleteHearing(null)}
        onConfirm={async () => {
          if (deleteHearing) {
            await deleteMutation.mutateAsync(deleteHearing.id);
            setDeleteHearing(null);
          }
        }}
        title="Delete Hearing"
        message={`Delete hearing for ${deleteHearing?.case_no}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
