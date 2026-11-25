"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2, Calendar, Plus, Upload, Scale, ChevronRight, Trash2, Pencil, Search, Gavel
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { useCourts, Court } from "@/lib/hooks/useCourts";
import { useCases } from "@/lib/hooks/useCases";
import { useHearings, useTodayHearings } from "@/lib/hooks/useHearings";
import { isCaseClosedStatus } from "@/lib/constants/practiceAreas";
import CourtFormModal from "@/components/courts/CourtFormModal";
import Modal from "@/components/ui/Modal";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

const getCourtColor = (type: string) => {
  if (type?.toLowerCase().includes("high court")) return "#EF4444";
  if (type?.toLowerCase().includes("sessions")) return "#3B82F6";
  if (type?.toLowerCase().includes("family")) return "#F59E0B";
  if (type?.toLowerCase().includes("tribunal")) return "#10B981";
  if (type?.toLowerCase().includes("forum")) return "#F97316";
  return "#8B5CF6";
};

function matchesCourtName(itemCourt: string | undefined, targetCourtName: string): boolean {
  const a = (itemCourt || "").trim().toLowerCase();
  const b = (targetCourtName || "").trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export default function CourtManagementPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const { courts, isLoading, mutate } = useCourts(searchQuery || undefined, selectedType);
  const { data: casesData } = useCases({ limit: 500 });
  const { data: hearingsData } = useHearings({ limit: 500 });
  const { data: todayHearingsData } = useTodayHearings();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [courtToDelete, setCourtToDelete] = useState<string | null>(null);

  const cases = casesData?.cases || [];
  const hearings = hearingsData?.hearings || [];
  const todayStr = new Date().toISOString().split("T")[0];

  const globalStats = useMemo(() => {
    const activeCases = cases.filter((c) => !isCaseClosedStatus(c.status)).length;
    const todayListed = todayHearingsData?.count || 0;
    const upcomingHearings = hearings.filter(
      (h) => h.status === "scheduled" && h.hearing_date > todayStr
    ).length;

    return {
      totalCourts: courts.length,
      activeCases,
      todayListed,
      upcomingHearings,
    };
  }, [courts.length, cases, hearings, todayHearingsData, todayStr]);

  const courtTypes = useMemo(() => {
    const types = new Set<string>();
    courts.forEach((c) => {
      if (c.type) types.add(c.type);
    });
    return ["All", ...Array.from(types).sort()];
  }, [courts]);

  const confirmDelete = async () => {
    if (!courtToDelete) return;
    try {
      await api.delete(`/courts/${courtToDelete}`);
      toast.success("Court deleted successfully");
      mutate();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCourtToDelete(null);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <Header
        title="Court Management"
        subtitle="Manage courts, benches, rooms, and track court-wise cases & hearings"
        rightContent={
          <button
            onClick={() => {
              setEditingCourt(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#013B36] text-white rounded-xl text-sm font-semibold hover:bg-[#013B36]/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Court
          </button>
        }
      />

      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {/* Global Live Court Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.totalCourts}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Registered Courts</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Scale className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.activeCases}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Active Cases</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.todayListed}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Listed Today</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Gavel className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.upcomingHearings}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Upcoming Hearings</div>
            </div>
          </div>
        </div>

        {/* Search & Type Filter Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search court name or jurisdiction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
          >
            {courtTypes.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Court Types" : type}
              </option>
            ))}
          </select>
        </div>

        {/* Court Grid or Clean Empty State */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">Loading courts...</div>
        ) : courts.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-14 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-indigo-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {searchQuery || selectedType !== "All" ? "No matching courts found" : "No courts added yet"}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              Register the High Courts, District Courts, or Tribunals you practice before to track room numbers, judges, cases, and hearings per court.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingCourt(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-2.5 bg-[#013B36] text-white rounded-xl text-sm font-semibold hover:bg-[#013B36]/90 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Your First Court
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {courts.map((court, i) => {
              const color = getCourtColor(court.type);
              const courtCases = cases.filter((c) => matchesCourtName(c.court, court.name));
              const courtActiveCount = courtCases.filter((c) => !isCaseClosedStatus(c.status)).length;
              const courtUpcomingHearings = hearings.filter(
                (h) =>
                  (matchesCourtName(h.court, court.name) ||
                    courtCases.some((c) => c.id === h.case_id)) &&
                  h.status === "scheduled" &&
                  h.hearing_date >= todayStr
              ).length;

              return (
                <motion.div
                  key={court.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col group relative overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-[0.03] transition-opacity group-hover:opacity-[0.06]"
                    style={{ backgroundColor: color }}
                  />

                  <div
                    className="flex items-start justify-between mb-4 relative z-10 cursor-pointer"
                    onClick={() => router.push(`/court-management/${court.id}`)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100 shrink-0">
                        <Building2 className="w-6 h-6" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1 truncate">
                          <span className="truncate">{court.name}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 uppercase tracking-wider">
                          {court.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 z-20 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCourt(court);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit Court"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCourtToDelete(court.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Court"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Live Case & Hearing Counts for this Court */}
                  <div className="flex items-center gap-2 mb-4 relative z-10">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {courtActiveCount} Active Cases
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                      {courtUpcomingHearings} Upcoming Hearings
                    </span>
                  </div>

                  <div
                    className="grid grid-cols-2 gap-3 mb-5 relative z-10 cursor-pointer"
                    onClick={() => router.push(`/court-management/${court.id}`)}
                  >
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Jurisdiction</span>
                      <span className="text-[12px] font-bold text-gray-900 truncate">{court.jurisdiction || "N/A"}</span>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex flex-col">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Presiding</span>
                      <span className="text-[12px] font-bold text-amber-700 truncate">{court.presiding_officer || "N/A"}</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Room No</span>
                      <span className="text-[13px] font-bold text-gray-900 mt-1">{court.room_number || "N/A"}</span>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex flex-col">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Address</span>
                      <span className="text-[11px] font-bold text-blue-800 mt-1 truncate">{court.address || "N/A"}</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-auto relative z-10 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => router.push(`/court-management/${court.id}`)}
                      className="py-2 bg-indigo-50 text-indigo-700 font-bold text-[12px] rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Scale className="w-3.5 h-3.5" /> View Cases
                    </button>
                    <button
                      onClick={() => router.push(`/hearings?search=${encodeURIComponent(court.name)}`)}
                      className="py-2 bg-amber-50 text-amber-700 font-bold text-[12px] rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Hearings
                    </button>
                    <button
                      onClick={() => router.push("/hearings")}
                      className="py-2 bg-gray-50 border border-gray-200 text-gray-600 font-bold text-[12px] rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Hearing
                    </button>
                    <button
                      onClick={() => router.push("/evidence")}
                      className="py-2 bg-gray-50 border border-gray-200 text-gray-600 font-bold text-[12px] rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" /> Evidence &amp; Orders
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <CourtFormModal
        isOpen={isModalOpen}
        court={editingCourt}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCourt(null);
        }}
        onSuccess={() => mutate()}
      />

      <Modal
        open={!!courtToDelete}
        onClose={() => setCourtToDelete(null)}
        title="Delete Court"
        description="Are you sure you want to delete this court? This action cannot be undone."
        size="sm"
      >
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
          <button
            onClick={() => setCourtToDelete(null)}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete Court
          </button>
        </div>
      </Modal>
    </div>
  );
}
