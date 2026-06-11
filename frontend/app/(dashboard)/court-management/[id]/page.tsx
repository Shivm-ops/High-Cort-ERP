"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import CaseForm from "@/components/forms/CaseForm";
import { useCases } from "@/lib/hooks/useCases";
import { useRouter } from "next/navigation";
import { ChevronLeft, FolderOpen, Search, Scale, Calendar, AlertCircle, Building2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const COURTS_MAP: Record<string, { name: string, type: string }> = {
  "bombay-high-court": { name: "Bombay High Court", type: "High Court" },
  "sessions-court": { name: "District & Sessions Court", type: "Sessions" },
  "family-court": { name: "Family Court Andheri", type: "Family" },
  "cestat-mumbai": { name: "CESTAT Mumbai", type: "Tribunal" },
  "mact-mumbai": { name: "MACT Mumbai", type: "Tribunal" },
  "consumer-forum": { name: "Consumer Forum", type: "Forum" },
};

export default function CourtDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  const courtId = params.id;
  const courtInfo = COURTS_MAP[courtId] || { name: "Court", type: "General" };
  const [showNewCase, setShowNewCase] = useState(false);

  // Fetch actual cases for this court
  const { data, isLoading } = useCases({ court: courtInfo.name });
  const cases = data?.cases || [];

  // Mocking "Today's Cause List" based on the first few active cases for demonstration
  const todaysMatters = cases.slice(0, 3);

  return (
    <div className="min-h-screen bg-workspace-bg flex flex-col">
      <Header title={`${courtInfo.name} Dashboard`} subtitle={`Track all cases, hearings, and orders in ${courtInfo.name}`} />
      
      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        <div className="flex items-center justify-between">
          <button onClick={() => router.push("/court-management")} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/cause-list?search=${encodeURIComponent(courtInfo.name)}`)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Full Cause List
            </button>
            <button onClick={() => setShowNewCase(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <FolderOpen className="w-4 h-4" /> New Case Here
            </button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Left Column: Today's Cause List */}
          <div className="w-full xl:w-[450px] flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-amber-50/50 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-[15px] flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-600"/> Today's Matters</h3>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[11px] font-bold">{todaysMatters.length} Listed</span>
              </div>
              
              <div className="p-2 flex-1 overflow-y-auto">
                {todaysMatters.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">No matters listed for today.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {todaysMatters.map((m: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl border border-amber-100 bg-[#fffdf5] flex flex-col gap-2 cursor-pointer hover:border-amber-300 transition-colors" onClick={() => router.push(`/cases/${m.id}`)}>
                        <div className="flex items-start justify-between">
                          <span className="px-2 py-0.5 rounded bg-white border border-amber-200 text-amber-800 text-[11px] font-bold">Item {i + 1}</span>
                          <span className="text-[11px] font-bold text-gray-500 uppercase">{m.stage || "Hearing"}</span>
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{m.title}</div>
                          <div className="text-[12px] font-semibold text-gray-500">{m.case_no || "Unfiled"}</div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-white border border-gray-100 px-2 py-1 rounded w-fit">
                          <User className="w-3.5 h-3.5" /> Adv. A. Patil
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
               <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2 mb-3">
                 <AlertCircle className="w-4 h-4 text-red-600" /> Pending Tasks
               </h3>
               <div className="space-y-3">
                 <div className="flex items-center justify-between text-[13px]">
                   <span className="text-gray-700">Upload Order (State vs Sharma)</span>
                   <button className="text-indigo-600 font-semibold hover:underline">Upload</button>
                 </div>
                 <div className="flex items-center justify-between text-[13px]">
                   <span className="text-gray-700">File Reply (Ramesh vs Gupta)</span>
                   <button className="text-indigo-600 font-semibold hover:underline">Draft</button>
                 </div>
               </div>
            </div>
          </div>

          {/* Right Column: All Cases Table */}
          <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-[15px] flex items-center gap-2"><Scale className="w-4 h-4 text-indigo-500"/> All Active Cases</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Search cases..." className="pl-9 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 w-64" />
              </div>
            </div>
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Case Details</th>
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stage</th>
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Assigned Advocate</th>
                    <th className="p-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Next Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-500">Loading cases...</td></tr>
                  ) : cases.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-sm text-gray-500">No active cases found in {courtInfo.name}.</td></tr>
                  ) : (
                    cases.map((c: any) => (
                      <tr key={c.id} onClick={() => router.push(`/cases/${c.id}`)} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                        <td className="p-4">
                          <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.title}</div>
                          <div className="text-[12px] text-gray-500">{c.case_no || "Unfiled"}</div>
                        </td>
                        <td className="p-4 text-[13px] font-medium text-gray-700">{c.client?.name || "Unknown"}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold">{c.stage || "N/A"}</span>
                        </td>
                        <td className="p-4 text-[13px] font-medium text-gray-600 flex items-center gap-1.5 mt-2">
                          <User className="w-3.5 h-3.5 text-gray-400" /> A. Patil
                        </td>
                        <td className="p-4 text-[13px] font-semibold text-gray-800">
                          <div className="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200 inline-block">22 Jun 2025</div>
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
          defaultCourt={courtInfo.name} 
          onSuccess={(id) => {
            setShowNewCase(false);
            if (id) router.push(`/cases/${id}`);
          }} 
        />
      </Modal>

    </div>
  );
}
