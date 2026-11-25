"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Scale, CheckSquare, Clock, TrendingUp, Building2, CheckCircle2, Loader2
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { useCases } from "@/lib/hooks/useCases";
import { useHearings } from "@/lib/hooks/useHearings";
import {
  PRACTICE_AREA_DEFINITIONS,
  matchesPracticeArea,
  isCaseClosedStatus,
} from "@/lib/constants/practiceAreas";
import { cn } from "@/lib/utils";

function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

export default function PracticeAreasPage() {
  const router = useRouter();
  const [showOnlyActiveAreas, setShowOnlyActiveAreas] = useState(false);

  const { data: casesData, isLoading: isLoadingCases } = useCases({ limit: 500 });
  const { data: hearingsData } = useHearings({ limit: 500 });

  const cases = casesData?.cases || [];
  const hearings = hearingsData?.hearings || [];

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const globalStats = useMemo(() => {
    const activeCount = cases.filter((c) => !isCaseClosedStatus(c.status)).length;
    const closedCount = cases.filter((c) => isCaseClosedStatus(c.status)).length;
    const hearingsThisWeek = hearings.filter(
      (h) =>
        h.status === "scheduled" &&
        h.hearing_date >= todayStr &&
        h.hearing_date <= weekEndStr
    ).length;
    const totalFees = cases.reduce((sum, c) => sum + Number(c.fees_received || 0), 0);

    return {
      total: cases.length,
      active: activeCount,
      closed: closedCount,
      hearingsThisWeek,
      totalFees,
    };
  }, [cases, hearings, todayStr, weekEndStr]);

  const areaCards = useMemo(() => {
    return PRACTICE_AREA_DEFINITIONS.map((area) => {
      const areaCases = cases.filter((c) => matchesPracticeArea(c.practice_area, area.id));
      const areaCaseIds = new Set(areaCases.map((c) => c.id));
      const active = areaCases.filter((c) => !isCaseClosedStatus(c.status)).length;
      const closed = areaCases.filter((c) => isCaseClosedStatus(c.status)).length;
      const upcomingHearings = hearings.filter(
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
        ...area,
        totalCases: areaCases.length,
        active,
        closed,
        upcomingHearings,
        feesReceived,
      };
    });
  }, [cases, hearings, todayStr]);

  const visibleCards = useMemo(() => {
    if (!showOnlyActiveAreas) return areaCards;
    const nonZero = areaCards.filter((a) => a.totalCases > 0);
    return nonZero.length > 0 ? nonZero : areaCards;
  }, [areaCards, showOnlyActiveAreas]);

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <Header
        title="Practice Areas"
        subtitle="Real-time caseload, upcoming hearings, and fee collection across legal domains"
        rightContent={
          <button
            type="button"
            onClick={() => setShowOnlyActiveAreas((v) => !v)}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors",
              showOnlyActiveAreas
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            )}
          >
            {showOnlyActiveAreas ? "Showing Active Areas" : "Only Areas with Cases"}
          </button>
        }
      />

      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {/* Live Analytics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.total}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Total Cases</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.active}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Active Cases</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.closed}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Closed Cases</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{globalStats.hearingsThisWeek}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Hearings This Week</div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{formatINR(globalStats.totalFees)}</div>
              <div className="text-xs font-semibold text-gray-500 uppercase">Fees Received</div>
            </div>
          </div>
        </div>

        {/* Practice Areas Grid */}
        {isLoadingCases ? (
          <div className="py-20 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            Loading practice area analytics...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleCards.map((area, i) => (
              <motion.div
                key={area.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => router.push(`/practice-areas/${area.id}`)}
                className="bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer group flex flex-col h-full hover:shadow-lg hover:border-indigo-300 transition-all relative overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-[0.04] transition-opacity group-hover:opacity-[0.08]"
                  style={{ backgroundColor: area.color }}
                />

                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{area.icon}</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {area.label}
                      </h3>
                      <p className="text-[12px] text-gray-500">{area.desc}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 relative z-10">
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{area.active}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active Cases</span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-amber-700">{area.upcomingHearings}</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Upcoming Hearings</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">{area.closed}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Closed</span>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-emerald-700">{formatINR(area.feesReceived)}</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Fees Received</span>
                  </div>
                </div>

                <div className="mt-auto relative z-10 flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/practice-areas/${area.id}`);
                    }}
                    className="w-full py-2.5 bg-indigo-50 text-indigo-700 font-bold text-[13px] rounded-xl hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <Scale className="w-4 h-4" /> View Matters ({area.totalCases})
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
