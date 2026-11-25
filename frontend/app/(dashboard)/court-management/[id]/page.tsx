"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import CaseForm from "@/components/forms/CaseForm";
import CourtFormModal from "@/components/courts/CourtFormModal";
import { useCourt } from "@/lib/hooks/useCourts";
import { useCases } from "@/lib/hooks/useCases";
import { useHearings } from "@/lib/hooks/useHearings";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, FolderOpen, Search, Scale, Calendar, Clock, Pencil, Building2
} from "lucide-react";
import { format } from "date-fns";

function matchesCourtName(itemCourt: string | undefined, targetCourtName: string): boolean {
  const a = (itemCourt || "").trim().toLowerCase();
  const b = (targetCourtName || "").trim().toLowerCase();
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export default function CourtDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const courtId = params.id;

  const { court, isLoading: isLoadingCourt, mutate: mutateCourt } = useCourt(courtId);
  const { data: casesData, isLoading: isLoadingCases } = useCases({ limit: 500 });
  const { data: hearingsData } = useHearings({ limit: 500 });

  const [showNewCase, setShowNewCase] = useState(false);
  const [showEditCourt, setShowEditCourt] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const courtName = court?.name || "";
  const todayStr = new Date().toISOString().split("T")[0];

  const courtCases = useMemo(() => {
    if (!courtName) return [];
    return (casesData?.cases || []).filter((c) => matchesCourtName(c.court, courtName));
  }, [casesData, courtName]);

  const courtCaseIds = useMemo(() => new Set(courtCases.map((c) => c.id)), [courtCases]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return courtCases;
    return courtCases.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.case_no || "").toLowerCase().includes(q) ||
        (c.client_name || "").toLowerCase().includes(q) ||
        (c.stage || "").toLowerCase().includes(q)
    );
  }, [courtCases, searchQuery]);

  const courtHearings = useMemo(() => {
    if (!courtName) return [];
    return (hearingsData?.hearings || []).filter(
      (h) => matchesCourtName(h.court, courtName) || courtCaseIds.has(h.case_id)
    );
  }, [hearingsData, courtName, courtCaseIds]);

  const todaysHearings = useMemo(
    () => courtHearings.filter((h) => h.hearing_date === todayStr),
    [courtHearings, todayStr]
  );

  const upcomingHearings = useMemo(
    () =>
      courtHearings
        .filter((h) => h.hearing_date > todayStr && h.status === "scheduled")
        .slice(0, 5),
    [courtHearings, todayStr]
  );

  return (
    <div className="min-h-screen bg-workspace-bg flex flex-col">
      <Header
        title={court ? `${court.name}` : isLoadingCourt ? "Loading Court..." : "Court Details"}
        subtitle={
          court
            ? `${court.type}${court.jurisdiction ? ` · ${court.jurisdiction}` : ""}${court.room_number ? ` · ${court.room_number}` : ""}`
            : "Court cases, hearings, and bench details"
        }
      />

      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push("/court-management")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Courts
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {court && (
              <>
                <button
                  onClick={() => setShowEditCourt(true)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4" /> Edit Court
                </button>
                <button
                  onClick={() => router.push(`/hearings?search=${encodeURIComponent(court.name)}`)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" /> Court Hearings
                </button>
              </>
            )}
            <button
              onClick={() => setShowNewCase(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <FolderOpen className="w-4 h-4" /> New Case Here
            </button>
          </div>
        </div>

        {/* Real Court Details Bar */}
        {court && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Court Type</div>
              <div className="font-semibold text-gray-900 mt-0.5 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" /> {court.type}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Jurisdiction</div>
              <div className="font-semibold text-gray-900 mt-0.5">{court.jurisdiction || "N/A"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Presiding Officer</div>
              <div className="font-semibold text-gray-900 mt-0.5">{court.presiding_officer || "N/A"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Room Number</div>
              <div className="font-semibold text-gray-900 mt-0.5">{court.room_number || "N/A"}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Address / Contact</div>
              <div className="font-semibold text-gray-900 mt-0.5 truncate" title={court.address || court.contact_info || ""}>
                {court.address || court.contact_info || "N/A"}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Column: Real Today's Hearings & Upcoming Hearings */}
          <div className="w-full xl:w-[420px] flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-amber-50/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" /> Today&apos;s Hearings
                </h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-bold">
                  {todaysHearings.length} Listed
                </span>
              </div>

              <div className="p-3 flex-1 overflow-y-auto">
                {todaysHearings.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No hearings scheduled in this court today.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todaysHearings.map((h) => (
                      <div
                        key={h.id}
                        className="p-4 rounded-xl border border-amber-100 bg-[#fffdf5] flex flex-col gap-1.5 cursor-pointer hover:border-amber-300 transition-colors"
                        onClick={() => router.push(`/cases/${h.case_id}`)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-800 text-[11px] font-bold">
                            {h.hearing_time || "Scheduled"}
                          </span>
                          <span className="text-[11px] font-bold text-gray-500 uppercase">
                            {h.purpose || h.status}
                          </span>
                        </div>
                        <div className="font-bold text-gray-900 text-sm">{h.case_title || "Matter"}</div>
                        <div className="text-xs font-semibold text-gray-500">
                          {h.case_no || "Unfiled"}{h.client_name ? ` · ${h.client_name}` : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-indigo-600" /> Upcoming Hearings
              </h3>
              {upcomingHearings.length === 0 ? (
                <p className="text-xs text-gray-500">No upcoming scheduled hearings for this court.</p>
              ) : (
                <div className="space-y-2.5">
                  {upcomingHearings.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => router.push(`/cases/${h.case_id}`)}
                      className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-gray-900 truncate">{h.case_title || h.case_no}</div>
                        <div className="text-[11px] text-gray-500">{h.purpose || "Hearing"}</div>
                      </div>
                      <span className="font-bold text-indigo-700 shrink-0">
                        {format(new Date(h.hearing_date + "T12:00:00"), "dd MMM yyyy")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: All Cases Table */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-[15px] flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-500" /> Matters in Court ({filteredCases.length})
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search case, client, stage..."
                  className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Case Details</th>
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stage &amp; Status</th>
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Next Hearing</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCases || isLoadingCourt ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-gray-500">Loading cases...</td>
                    </tr>
                  ) : filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-sm text-gray-500">
                        No cases matched {courtName || "this court"}.
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => router.push(`/cases/${c.id}`)}
                        className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="p-4">
                          <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.title}</div>
                          <div className="text-[12px] text-gray-500">{c.case_no || "Unfiled"}</div>
                        </td>
                        <td className="p-4 text-[13px] font-medium text-gray-700">{c.client_name || "–"}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold capitalize">
                              {c.stage || "N/A"}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-[11px] font-medium capitalize">
                              {c.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-[13px] font-semibold text-gray-800">
                          {c.next_hearing_date
                            ? format(new Date(c.next_hearing_date), "dd MMM yyyy")
                            : "Not Scheduled"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal open={showNewCase} onClose={() => setShowNewCase(false)} title="Add New Case" size="xl">
        <CaseForm
          defaultCourt={courtName || undefined}
          onSuccess={(id) => {
            setShowNewCase(false);
            if (id) router.push(`/cases/${id}`);
          }}
        />
      </Modal>

      <CourtFormModal
        isOpen={showEditCourt}
        court={court}
        onClose={() => setShowEditCourt(false)}
        onSuccess={() => mutateCourt()}
      />
    </div>
  );
}
