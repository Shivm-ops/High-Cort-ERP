"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import CaseForm from "@/components/forms/CaseForm";
import { useCases } from "@/lib/hooks/useCases";
import { useRouter } from "next/navigation";
import { ChevronLeft, FolderOpen, Search, Scale, FileText, CheckSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const AREAS_MAP: Record<string, { name: string, icon: string }> = {
  criminal: { name: "Criminal Law", icon: "⚖️" },
  civil: { name: "Civil Law", icon: "📋" },
  property: { name: "Property Law", icon: "🏠" },
  gst: { name: "GST & Taxation", icon: "💰" },
  family: { name: "Family Law", icon: "👨‍👩‍👧" },
  mact: { name: "MACT", icon: "🚗" },
};

export default function PracticeAreaDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const areaId = params.id;
  const areaInfo = AREAS_MAP[areaId] || { name: "Practice Area", icon: "⚖️" };
  const [showNewCase, setShowNewCase] = useState(false);

  // Fetch actual cases for this practice area
  const { data, isLoading } = useCases({ practice_area: areaInfo.name });
  const cases = data?.cases || [];

  return (
    <div className="min-h-screen bg-workspace-bg flex flex-col">
      <Header title={`${areaInfo.icon} ${areaInfo.name} Dashboard`} subtitle={`Managing all matters under ${areaInfo.name}`} />
      
      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/practice-areas")} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <button onClick={() => setShowNewCase(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <FolderOpen className="w-4 h-4" /> New Matter
          </button>
        </div>

        {/* Analytics Mini-Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center"><FolderOpen className="w-5 h-5 text-indigo-600"/></div>
             <div><div className="text-xl font-bold text-gray-900">{cases.length}</div><div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Matters</div></div>
           </div>
           <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckSquare className="w-5 h-5 text-emerald-600"/></div>
             <div><div className="text-xl font-bold text-gray-900">{cases.filter((c: any) => c.status === "ACTIVE").length}</div><div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Active</div></div>
           </div>
           <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600"/></div>
             <div><div className="text-xl font-bold text-gray-900">{cases.reduce((acc, c: any) => acc + (c.hearings?.length || 0), 0)}</div><div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Upcoming Hearings</div></div>
           </div>
           <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center"><FileText className="w-5 h-5 text-blue-600"/></div>
             <div><div className="text-xl font-bold text-gray-900">{cases.reduce((acc, c: any) => acc + (c.drafts?.length || 0), 0)}</div><div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Drafts Generated</div></div>
           </div>
        </div>

        {/* Active Matters Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-[15px] flex items-center gap-2"><Scale className="w-4 h-4 text-indigo-500"/> Active Matters</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder="Search cases..." className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 w-64" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Case Details</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Client</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Court</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Next Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-500">Loading matters...</td></tr>
                ) : cases.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-500">No active matters found in {areaInfo.name}.</td></tr>
                ) : (
                  cases.map((c: any) => (
                    <tr key={c.id} onClick={() => router.push(`/cases/${c.id}`)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.title}</div>
                        <div className="text-[12px] text-gray-500">{c.case_no || "Unfiled"}</div>
                      </td>
                      <td className="p-4 text-[13px] font-medium text-gray-700">{c.client?.name || "Unknown"}</td>
                      <td className="p-4 text-[13px] text-gray-600">{c.court || "Not assigned"}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold">{c.stage || "N/A"}</span>
                      </td>
                      <td className="p-4 text-[13px] font-semibold text-gray-800">
                        {c.next_hearing_date ? new Date(c.next_hearing_date).toLocaleDateString() : "Not Scheduled"}
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
          defaultPracticeArea={areaInfo.name} 
          onSuccess={(id) => {
            setShowNewCase(false);
            if (id) router.push(`/cases/${id}`);
          }} 
        />
      </Modal>

    </div>
  );
}
