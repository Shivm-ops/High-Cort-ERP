"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { Users, FileText, Activity, RefreshCcw, ArrowUpRight, CheckCircle, Clock, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdvocateWorkload, useTransfers, useAppealsReport, exportToCSV } from "@/lib/hooks/useReports";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<"workload" | "transfers" | "appeals">("workload");

  const { workload, isLoading: loadingWorkload } = useAdvocateWorkload();
  const { transfers, isLoading: loadingTransfers } = useTransfers();
  const { appeals, isLoading: loadingAppeals } = useAppealsReport();

  const handleExport = () => {
    if (activeTab === "workload" && workload) {
      exportToCSV(workload, "Advocate_Workload_Report");
    } else if (activeTab === "transfers" && transfers) {
      exportToCSV(transfers, "Case_Transfers_Report");
    } else if (activeTab === "appeals" && appeals?.data) {
      exportToCSV(appeals.data, "Appeals_Report");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Analytics & Reports" subtitle="Advocate workloads, transfers, and appeal metrics" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-sidebar font-medium text-sm mb-3">
              <Users className="w-5 h-5" /> Team Members Active
            </div>
            <div className="text-3xl font-bold text-gray-900">{workload?.length || 0}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-purple-600 font-medium text-sm mb-3">
              <Activity className="w-5 h-5" /> Total Pending Tasks
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {workload?.reduce((sum: number, w: any) => sum + w.tasks_pending, 0) || 0}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-blue-600 font-medium text-sm mb-3">
              <ArrowUpRight className="w-5 h-5" /> Total Appeals
            </div>
            <div className="text-3xl font-bold text-gray-900">{appeals?.metrics?.total_appeals || 0}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-red-600 font-medium text-sm mb-3">
              <RefreshCcw className="w-5 h-5" /> Case Transfers
            </div>
            <div className="text-3xl font-bold text-gray-900">{transfers?.length || 0}</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 p-1 bg-gray-200/50 rounded-xl w-max">
            {(["workload", "transfers", "appeals"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("px-4 py-2 text-sm font-medium rounded-lg capitalize transition-colors",
                  activeTab === tab ? "bg-white text-sidebar shadow-sm" : "text-gray-500 hover:text-gray-900")}>
                {tab === "workload" ? "Advocate Workloads" : tab === "transfers" ? "Transfer History" : "Appeal Analytics"}
              </button>
            ))}
          </div>
          <button onClick={handleExport} className="px-4 py-2 bg-sidebar text-white text-sm font-semibold rounded-lg hover:bg-sidebar/90 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[400px]">
          {activeTab === "workload" && (
            <div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Advocate Name</th>
                    <th className="px-6 py-4 font-semibold">Role Level</th>
                    <th className="px-6 py-4 font-semibold text-center">Active Matters</th>
                    <th className="px-6 py-4 font-semibold text-center">As Senior</th>
                    <th className="px-6 py-4 font-semibold text-center">As Junior</th>
                    <th className="px-6 py-4 font-semibold text-center">Pending Tasks</th>
                    <th className="px-6 py-4 font-semibold text-center">Completed Tasks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingWorkload ? <tr><td colSpan={7} className="text-center py-10">Loading...</td></tr> :
                   workload?.map((w: any) => (
                    <tr key={w.advocate_id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-medium text-gray-900">{w.name}</td>
                      <td className="px-6 py-4 text-gray-500 capitalize">{w.role}</td>
                      <td className="px-6 py-4 text-center font-semibold">{w.active_cases}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{w.senior_role}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{w.junior_role}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" /> {w.tasks_pending}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                          <CheckCircle className="w-3.5 h-3.5" /> {w.tasks_completed}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loadingWorkload && !workload?.length && (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-500">No active advocates found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "transfers" && (
            <div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Case No.</th>
                    <th className="px-6 py-4 font-semibold">Advocate</th>
                    <th className="px-6 py-4 font-semibold">Transfer Date</th>
                    <th className="px-6 py-4 font-semibold">Transfer Reason</th>
                    <th className="px-6 py-4 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingTransfers ? <tr><td colSpan={5} className="text-center py-10">Loading...</td></tr> :
                   transfers?.map((t: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">{t.case_no}</td>
                      <td className="px-6 py-4 text-gray-700">{t.advocate_name}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(t.end_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded-md text-xs font-medium">{t.transfer_reason}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{t.notes || "—"}</td>
                    </tr>
                  ))}
                  {!loadingTransfers && !transfers?.length && (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-500">No transfer history found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "appeals" && (
            <div>
              <div className="flex gap-4 p-5 bg-blue-50/50 border-b border-gray-100">
                <div className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-medium text-sm">
                  Pending Appeals: {appeals?.metrics?.pending || 0}
                </div>
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-xl font-medium text-sm">
                  Disposed Appeals: {appeals?.metrics?.disposed || 0}
                </div>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Appeal Case No.</th>
                    <th className="px-6 py-4 font-semibold">Appeal Type</th>
                    <th className="px-6 py-4 font-semibold">Court / Forum</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingAppeals ? <tr><td colSpan={4} className="text-center py-10">Loading...</td></tr> :
                   appeals?.data?.map((a: any) => (
                    <tr key={a.case_id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-mono font-medium text-gray-900">{a.case_no}</td>
                      <td className="px-6 py-4 text-gray-700 uppercase text-xs">{a.appeal_type}</td>
                      <td className="px-6 py-4 text-gray-500">{a.court}</td>
                      <td className="px-6 py-4">
                        <span className={cn("px-2 py-1 rounded-md text-xs font-medium",
                          a.status === "closed" || a.status === "disposed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!loadingAppeals && !appeals?.data?.length && (
                    <tr><td colSpan={4} className="text-center py-10 text-gray-500">No appeals found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
