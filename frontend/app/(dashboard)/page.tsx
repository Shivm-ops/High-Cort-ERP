"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase, CalendarDays, FileText, IndianRupee, Users, AlertTriangle,
  Clock, TrendingUp, TrendingDown, ArrowUpRight, ArrowRight, Sparkles,
  Scale, ChevronRight, Search, FileSignature, Upload, FileDiff, CheckCircle2, FileVideo, 
  Wallet, FileBox, FileArchive, ArrowRightCircle
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn, formatCurrency } from "@/lib/utils";
import { useDashboardMetrics } from "@/lib/hooks/useDashboard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  bg: string;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, accent, bg, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer hover:shadow-md transition-shadow group flex items-center justify-between"
    >
      <div>
        <div className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{value}</div>
        <div className="text-xs font-semibold text-gray-500">{label}</div>
      </div>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style={{ background: bg }}>
        <Icon className="w-6 h-6" style={{ color: accent }} strokeWidth={1.75} />
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState("");
  const { data: metrics, isLoading } = useDashboardMetrics();

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#F7F8F6]">
        <Header title="Legal Operations Dashboard" subtitle={`Welcome back · ${todayLabel}`} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-sidebar border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Legal Operations" subtitle={`Welcome back · ${todayLabel}`} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Global Search Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, #013B36 0%, #014D46 60%, #0B3D2E 100%)", boxShadow: "0 8px 32px rgba(1,59,54,0.25)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(110,231,183,0.08) 0%, transparent 70%)" }} />
          <div className="relative flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Search className="w-4 h-4 text-emerald-300" />
                <span className="text-white text-sm font-semibold">Global Workspace Search</span>
              </div>
              <h2 className="text-white/60 text-xs">Search across matters, clients, notices, drafts, and invoices.</h2>
            </div>
            <div className="flex-1 max-w-2xl ml-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === "Enter" && globalSearch) {
                         toast.info(`Searching for "${globalSearch}" across workspace...`);
                     }
                  }}
                  placeholder="Enter case number, client name, or document reference..."
                  className="w-full h-11 pl-11 pr-16 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(110,231,183,0.2)" }}
                />
                <button 
                  onClick={() => globalSearch && toast.info(`Searching for "${globalSearch}" across workspace...`)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-3 rounded-lg text-xs font-bold text-[#013B36]" style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)" }}>
                  Search
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 1. Today's Critical Matters */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 ml-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Today's Critical Items
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Today's Hearings" value={metrics.critical_matters.today_hearings} icon={CalendarDays}
              accent="#EF4444" bg="rgba(239,68,68,0.12)" delay={0.05}
            />
            <StatCard
              label="Urgent Filings" value={metrics.critical_matters.urgent_filings} icon={FileArchive}
              accent="#F97316" bg="rgba(249,115,22,0.12)" delay={0.1}
            />
            <StatCard
              label="Pending Replies" value={metrics.critical_matters.pending_notices} icon={FileSignature}
              accent="#EAB308" bg="rgba(234,179,8,0.12)" delay={0.15}
            />
            <StatCard
              label="Limitation Alerts" value={metrics.critical_matters.limitation_alerts} icon={Clock}
              accent="#A855F7" bg="rgba(168,85,247,0.12)" delay={0.2}
            />
            <StatCard
              label="Pending Affidavits" value={metrics.critical_matters.pending_affidavits} icon={FileText}
              accent="#3B82F6" bg="rgba(59,130,246,0.12)" delay={0.25}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (Takes up 2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 5. Upcoming Hearings Widget */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sidebar" /> Upcoming Hearings
                </h3>
                <button onClick={() => router.push("/hearings")} className="text-xs font-semibold text-sidebar hover:underline">View All</button>
              </div>
              <div className="divide-y divide-gray-50">
                {metrics.upcoming_hearings.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">No upcoming hearings scheduled.</div>
                ) : (
                  metrics.upcoming_hearings.map(h => (
                    <div key={h.id} className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors" onClick={() => router.push(`/cases/${h.case_id}`)}>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{h.case_title}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Scale className="w-3 h-3"/> {h.court}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {h.assigned_advocate}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                         <div className="text-sm font-bold text-gray-900">{h.hearing_date}</div>
                         <div className="text-xs text-sidebar font-medium mt-0.5">{h.hearing_time ? h.hearing_time.substring(0, 5) : 'TBD'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 3. Notice Management Summary */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Notice Management
                </h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Notices Received</span>
                      <span className="font-semibold text-gray-900">{metrics.notice_summary.received}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Pending Replies</span>
                      <span className="font-bold text-amber-600">{metrics.notice_summary.pending_replies}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Overdue Replies</span>
                      <span className="font-bold text-red-600">{metrics.notice_summary.overdue_replies}</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Replies Sent</span>
                      <span className="font-semibold text-green-600">{metrics.notice_summary.replies_sent}</span>
                   </div>
                </div>
              </motion.div>

              {/* 4. Matter Status Dashboard */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-emerald-500" /> Matter Pipeline
                </h3>
                <div className="space-y-3">
                   {[
                     { label: "Active Matters", val: metrics.matter_status.active, color: "bg-emerald-500" },
                     { label: "Drafting Stage", val: metrics.matter_status.drafting, color: "bg-blue-500" },
                     { label: "Evidence Stage", val: metrics.matter_status.evidence, color: "bg-amber-500" },
                     { label: "Argument Stage", val: metrics.matter_status.argument, color: "bg-purple-500" },
                     { label: "Appeal Stage", val: metrics.matter_status.appeal, color: "bg-pink-500" },
                     { label: "Closed Matters", val: metrics.matter_status.closed, color: "bg-gray-400" },
                   ].map(item => (
                     <div key={item.label} className="flex items-center text-sm">
                        <div className={cn("w-2 h-2 rounded-full mr-2", item.color)}></div>
                        <span className="text-gray-600 flex-1">{item.label}</span>
                        <span className="font-semibold text-gray-900">{item.val}</span>
                     </div>
                   ))}
                </div>
              </motion.div>
            </div>

            {/* 9. Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" /> Recent Activity Feed
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                {metrics.recent_activity.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">No recent activity.</div>
                ) : (
                  metrics.recent_activity.map((act, i) => (
                    <div key={i} className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                         {act.type.includes('case') ? <Briefcase className="w-4 h-4 text-sidebar"/> : <FileText className="w-4 h-4 text-sidebar"/>}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{act.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{act.date ? new Date(act.date).toLocaleString() : 'Just now'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

          </div>

          {/* Right Column (Takes up 1/3) */}
          <div className="space-y-6">
            
            {/* 8. Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "New Client", icon: Users, href: "/clients" },
                  { label: "New Matter", icon: Briefcase, href: "/cases" },
                  { label: "Upload Notice", icon: Upload, href: "/notices" },
                  { label: "Generate Reply", icon: FileSignature, href: "/notices" },
                  { label: "Upload Evidence", icon: FileVideo, href: "/evidence" },
                  { label: "Create Draft", icon: FileDiff, href: "/draft-workspace" },
                  { label: "Add Hearing", icon: CalendarDays, href: "/hearings" },
                  { label: "Gen Invoice", icon: Wallet, href: "/billing" },
                ].map(action => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-sidebar hover:bg-sidebar/5 transition-all group"
                  >
                    <action.icon className="w-5 h-5 text-gray-400 group-hover:text-sidebar transition-colors" />
                    <span className="text-[11px] font-semibold text-gray-600 group-hover:text-sidebar text-center leading-tight">
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* 2. Limitation & Deadline Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Limitation Alerts
                </h3>
              </div>
              <div className="divide-y divide-gray-50">
                {metrics.limitation_alerts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">No approaching limitation dates.</div>
                ) : (
                  metrics.limitation_alerts.map(alert => (
                    <div key={alert.id} className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/cases/${alert.id}`)}>
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="text-sm font-semibold text-gray-900 truncate">{alert.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{alert.case_no}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                         <div className={cn("text-xs font-bold px-2 py-1 rounded-md", alert.days_left <= 7 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                           {alert.days_left} Days Left
                         </div>
                         <div className="text-[10px] text-gray-400 mt-1">{alert.limitation_date}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* 6. Legal Billing Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-[#013B36] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 100% 0%, rgba(110,231,183,0.15) 0%, transparent 60%)" }} />
              <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2 relative z-10">
                <Wallet className="w-4 h-4 text-emerald-400" /> Billing Snapshot
              </h3>
              <div className="space-y-4 relative z-10">
                 <div>
                    <div className="text-xs text-white/60 mb-1">Total Outstanding</div>
                    <div className="text-2xl font-bold text-emerald-300">{formatCurrency(metrics.billing.outstanding)}</div>
                 </div>
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                    <div>
                       <div className="text-[10px] text-white/60 mb-0.5">Pending Hearing Fees</div>
                       <div className="text-sm font-semibold">{formatCurrency(metrics.billing.pending_hearing_fees)}</div>
                    </div>
                    <div>
                       <div className="text-[10px] text-white/60 mb-0.5">Pending Filing Fees</div>
                       <div className="text-sm font-semibold">{formatCurrency(metrics.billing.pending_filing_fees)}</div>
                    </div>
                 </div>
                 <div className="pt-2">
                    <div className="flex justify-between items-center bg-white/5 rounded-lg p-2 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => router.push('/billing')}>
                       <div>
                         <div className="text-[10px] text-white/60">Advance Balance Pool</div>
                         <div className="text-sm font-bold text-emerald-400">{formatCurrency(metrics.billing.advance_balance)}</div>
                       </div>
                       <ArrowRightCircle className="w-5 h-5 text-white/40" />
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* 7. Team Work Dashboard */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-sidebar" /> Team Work Allocation
              </h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{metrics.team_work.drafting}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Drafting Tasks</div>
                 </div>
                 <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{metrics.team_work.research}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Research Tasks</div>
                 </div>
                 <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{metrics.team_work.filing}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Filing Tasks</div>
                 </div>
                 <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className="text-xl font-bold text-gray-900">{metrics.team_work.hearing}</div>
                    <div className="text-xs font-medium text-gray-500 mt-0.5">Hearing Assignments</div>
                 </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
