"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import CaseForm from "@/components/forms/CaseForm";
import { useCases } from "@/lib/hooks/useCases";
import { useHearings } from "@/lib/hooks/useHearings";
import {
  PRACTICE_AREA_DEFINITIONS,
  matchesPracticeArea,
  isCaseClosedStatus,
} from "@/lib/constants/practiceAreas";
import { useRouter } from "next/navigation";
import { ChevronLeft, FolderOpen, Search, Scale, CheckSquare, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function PracticeAreaDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const areaId = params.id;
  const areaInfo =
    PRACTICE_AREA_DEFINITIONS.find((a) => a.id === areaId) || {
      id: areaId,
      value: areaId,
      label: "Practice Area",
      desc: "",
      icon: "⚖️",
      color: "#6366F1",
      aliases: [areaId.toLowerCase()],
    };

  const [showNewCase, setShowNewCase] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: casesData, isLoading } = useCases({ limit: 500 });
  const { data: hearingsData } = useHearings({ limit: 500 });

  const todayStr = new Date().toISOString().split("T")[0];

  const areaCases = useMemo(() => {
    const all = casesData?.cases || [];
    return all.filter((c) => matchesPracticeArea(c.practice_area, areaId));
  }, [casesData, areaId]);

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return areaCases;
    return areaCases.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.case_no || "").toLowerCase().includes(q) ||
        (c.client_name || "").toLowerCase().includes(q) ||
        (c.court || "").toLowerCase().includes(q) ||
        (c.stage || "").toLowerCase().includes(q)
    );
  }, [areaCases, searchQuery]);

  const stats = useMemo(() => {
    const areaCaseIds = new Set(areaCases.map((c) => c.id));
    const active = areaCases.filter((c) => !isCaseClosedStatus(c.status)).length;
    const upcomingHearings = (hearingsData?.hearings || []).filter(
      (h) =>
        areaCaseIds.has(h.case_id) &&
        h.status === "scheduled" &&
        h.hearing_date >= todayStr
    ).length;
    const feesReceived = areaCases.reduce(
      (sum, c) => sum + Number(c.fees_received || 0),
      0
    );

    return {
      total: areaCases.length,
      active,
      upcomingHearings,
      feesReceived,
    };
  }, [areaCases, hearingsData, todayStr]);

  return (
    <div className="min-h-screen bg-workspace-bg flex flex-col">
      <Header
        title={`${areaInfo.icon} ${areaInfo.label}`}
        subtitle={`Managing all matters, upcoming hearings, and collections under ${areaInfo.label}`}
      />

      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/practice-areas")}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Practice Areas
          </button>

          <button
            onClick={() => setShowNewCase(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <FolderOpen className="w-4 h-4" /> New Matter
          </button>
        </div>

        {/* Analytics Mini-Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Matters</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.active}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stats.upcomingHearings}</div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Upcoming Hearings</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">
                ₹{Math.round(stats.feesReceived).toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fees Received</div>
            </div>
          </div>
        </div>

        {/* Matters Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-[15px] flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" /> Matters ({filteredCases.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, client, court..."
                className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Case Details</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Court</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stage &amp; Status</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Next Hearing</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-gray-500">Loading matters...</td>
                  </tr>
                ) : filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-gray-500">
                      No matching matters found in {areaInfo.label}.
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
                      <td className="p-4 text-[13px] text-gray-600">{c.court || "Not assigned"}</td>
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

      <Modal open={showNewCase} onClose={() => setShowNewCase(false)} title="Add New Case" size="xl">
        <CaseForm
          defaultPracticeArea={areaInfo.value}
          onSuccess={(id) => {
            setShowNewCase(false);
            if (id) router.push(`/cases/${id}`);
          }}
        />
      </Modal>
    </div>
  );
}
