"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, Clock, CheckCircle, Search, Scale, FileSignature, FolderOpen, ExternalLink, CalendarDays } from "lucide-react";
import Header from "@/components/layout/Header";
import { useLimitationsDashboard } from "@/lib/hooks/useLimitations";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const COURTS = ["All", "District Court", "Consumer Forum", "MACT Tribunal", "High Court", "Supreme Court"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  critical: { color: "#DC2626", bg: "rgba(239,68,68,0.1)", icon: AlertTriangle },
  overdue: { color: "#991B1B", bg: "rgba(153,27,27,0.1)", icon: AlertTriangle },
  warning: { color: "#D97706", bg: "rgba(245,158,11,0.1)", icon: Clock },
  upcoming: { color: "#EAB308", bg: "rgba(234,179,8,0.1)", icon: CalendarDays },
  safe: { color: "#059669", bg: "rgba(16,185,129,0.1)", icon: CheckCircle },
};

export default function CompliancePage() {
  const router = useRouter();
  const [courtFilter, setCourtFilter] = useState("All");
  const [search, setSearch] = useState("");
  
  const { data, isLoading } = useLimitationsDashboard(courtFilter);

  const filteredMatters = data?.matters.filter(m => 
    m.case_no.toLowerCase().includes(search.toLowerCase()) || 
    m.title.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="page-enter min-h-screen bg-[#F7F8F6] flex flex-col">
      <Header title="Limitation & Deadline Management" subtitle="Legal risk-management and filing deadline tracker" />
      
      {isLoading ? (
         <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-sidebar border-t-transparent animate-spin"></div>
         </div>
      ) : (
        <div className="flex-1 p-6 space-y-6">
          
          {/* Dashboard Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
               className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm"
             >
               <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                 <Clock className="w-7 h-7 text-amber-500" />
               </div>
               <div>
                 <div className="text-3xl font-bold text-gray-900">{data?.widgets.today || 0}</div>
                 <div className="text-sm font-semibold text-gray-500">Today's Deadlines</div>
               </div>
             </motion.div>
             <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
               className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-5 shadow-sm"
             >
               <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                 <CalendarDays className="w-7 h-7 text-blue-500" />
               </div>
               <div>
                 <div className="text-3xl font-bold text-gray-900">{data?.widgets.tomorrow || 0}</div>
                 <div className="text-sm font-semibold text-gray-500">Tomorrow's Deadlines</div>
               </div>
             </motion.div>
             <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
               className="bg-white rounded-2xl border border-red-100 p-6 flex items-center gap-5 shadow-sm relative overflow-hidden"
             >
               <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-red-50 to-transparent"></div>
               <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center relative z-10">
                 <AlertTriangle className="w-7 h-7 text-red-600" />
               </div>
               <div className="relative z-10">
                 <div className="text-3xl font-bold text-red-600">{data?.widgets.overdue || 0}</div>
                 <div className="text-sm font-semibold text-red-700">Overdue Matters</div>
               </div>
             </motion.div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
               <div className="flex items-center gap-2">
                 <div className="relative">
                   <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                   <input
                     type="text"
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Search matter or case no..."
                     className="pl-9 pr-4 py-2 w-72 rounded-xl text-sm border-gray-200 focus:border-sidebar focus:ring-sidebar/20 bg-white"
                   />
                 </div>
               </div>
               <div className="flex gap-2">
                 {COURTS.map(c => (
                   <button
                     key={c}
                     onClick={() => setCourtFilter(c)}
                     className={cn(
                       "px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                       courtFilter === c 
                         ? "bg-sidebar text-white shadow-sm" 
                         : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                     )}
                   >
                     {c}
                   </button>
                 ))}
               </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider">
                    <th className="p-4 font-semibold">Risk Level</th>
                    <th className="p-4 font-semibold">Matter Info</th>
                    <th className="p-4 font-semibold">Limitation Source</th>
                    <th className="p-4 font-semibold text-right">Deadlines</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredMatters.map((m, i) => {
                    const sc = STATUS_CONFIG[m.status];
                    const Icon = sc.icon;
                    return (
                      <motion.tr 
                        key={m.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="p-4">
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: sc.bg }}>
                              <Icon className="w-4 h-4" style={{ color: sc.color }} />
                              <span className="text-xs font-bold" style={{ color: sc.color }}>{m.risk}</span>
                           </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-sidebar transition-colors">{m.title}</div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                             <span className="font-semibold">{m.case_no}</span>
                             <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                             <span className="flex items-center gap-1"><Scale className="w-3 h-3"/> {m.court}</span>
                          </div>
                        </td>
                        <td className="p-4">
                           <div className="text-[13px] font-semibold text-gray-800">{m.limitation_act}</div>
                           <div className="text-[11px] text-gray-500 mt-0.5">Section: {m.limitation_section}</div>
                        </td>
                        <td className="p-4 text-right">
                           <div className={cn("text-lg font-bold", m.days_left < 0 ? "text-red-600" : "text-gray-900")}>
                             {m.days_left < 0 ? `Overdue by ${Math.abs(m.days_left)}` : m.days_left} <span className="text-sm font-medium text-gray-500">days</span>
                           </div>
                           <div className="text-xs text-gray-500 mt-0.5">Filing Date: {m.limitation_date}</div>
                        </td>
                        <td className="p-4">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => router.push(`/cases/${m.id}`)} className="p-2 text-gray-500 hover:text-sidebar hover:bg-sidebar/10 rounded-lg transition-colors" title="Open Matter">
                                <ExternalLink className="w-4 h-4" />
                              </button>
                              <button onClick={() => router.push(`/draft-workspace`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Open Draft">
                                <FileSignature className="w-4 h-4" />
                              </button>
                              <button onClick={() => router.push(`/evidence`)} className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Add Evidence">
                                <FolderOpen className="w-4 h-4" />
                              </button>
                           </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                  {filteredMatters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-gray-500">
                        No active limitation periods found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
