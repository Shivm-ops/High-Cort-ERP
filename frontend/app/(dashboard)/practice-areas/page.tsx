"use client";
import React from "react";
import { motion } from "framer-motion";
import { Scale, ChevronRight, FileText, BookOpen, CheckSquare, BarChart3, Clock, CheckCircle2, TrendingUp, AlertCircle, Building2, ClipboardList, Home, BadgeIndianRupee, Users, Car, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const AREAS = [
  { id: "criminal", name: "Criminal Law", desc: "BNS, BNSS, bail, trials, appeals", cases: 0, active: 0, closed: 0, hearings: 0, revenue: "₹0", icon: "⚖️", color: "#EF4444" },
  { id: "civil", name: "Civil Law", desc: "CPC, suits, injunctions, decrees", cases: 0, active: 0, closed: 0, hearings: 0, revenue: "₹0", icon: "📋", color: "#3B82F6" },
  { id: "property", name: "Property Law", desc: "TP Act, RERA, title disputes", cases: 0, active: 0, closed: 0, hearings: 0, revenue: "₹0", icon: "🏠", color: "#F59E0B" },
  { id: "gst", name: "GST & Taxation", desc: "GST Act, appeals, CESTAT", cases: 0, active: 0, closed: 0, hearings: 0, revenue: "₹0", icon: "💰", color: "#10B981" },
  { id: "family", name: "Family Law", desc: "HMA, guardianship, maintenance", cases: 0, active: 0, closed: 0, hearings: 0, revenue: "₹0", icon: "👨‍👩‍👧", color: "#8B5CF6" },
  { id: "mact", name: "MACT", desc: "Accident claims, compensation", cases: 0, active: 0, closed: 0, hearings: 0, revenue: "₹0", icon: "🚗", color: "#F97316" },
];

const STATS = [
  { label: "TOTAL CASES", value: "0", icon: Building2, color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "ACTIVE CASES", value: "0", icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "CLOSED CASES", value: "0", icon: CheckSquare, color: "text-slate-600", bg: "bg-slate-50" },
  { label: "HEARINGS THIS WEEK", value: "0", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  { label: "REVENUE YTD", value: "₹0", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
];

export default function PracticeAreasPage() {
  const router = useRouter();

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <Header title="Practice Area Dashboard" subtitle="Manage cases, track hearings, and monitor revenue by domain" />
      
      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* Analytics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><Building2 className="w-6 h-6 text-indigo-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Total Cases</div></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Active Cases</div></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center"><CheckSquare className="w-6 h-6 text-gray-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Closed Cases</div></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><Clock className="w-6 h-6 text-amber-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Hearings This Week</div></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-emerald-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">₹0</div><div className="text-xs font-semibold text-gray-500 uppercase">Revenue YTD</div></div>
          </div>
        </div>

        {/* Practice Areas Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {AREAS.map((area, i) => (
            <motion.div key={area.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              onClick={() => router.push(`/practice-areas/${area.id}`)}
              className="bg-white rounded-2xl border border-gray-200 p-6 cursor-pointer group flex flex-col h-full hover:shadow-lg hover:border-indigo-300 transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-[0.03] transition-opacity group-hover:opacity-[0.06]" style={{ backgroundColor: area.color }} />
              
              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{area.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{area.name}</h3>
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
                  <span className="text-xl font-bold text-amber-700">{area.hearings}</span>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Upcoming Hearings</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-gray-900">{area.closed}</span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Closed</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-emerald-700">{area.revenue}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Revenue</span>
                </div>
              </div>

              <div className="mt-auto relative z-10 flex gap-3">
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/practice-areas/${area.id}`); }}
                  className="w-full py-2.5 bg-indigo-50 text-indigo-700 font-bold text-[13px] rounded-xl hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <Scale className="w-4 h-4" /> View Matters
                </button>
              </div>

            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
