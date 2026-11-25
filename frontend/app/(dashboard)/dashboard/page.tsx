"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  CalendarDays,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  Scale,
  Search,
  FileSignature,
  Upload,
  FileDiff,
  FileVideo,
  Wallet,
  FileArchive,
  ArrowRightCircle,
  X,
  Loader2,
  Mail,
  ClipboardList,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn, formatCurrency } from "@/lib/utils";
import { useDashboardMetrics } from "@/lib/hooks/useDashboard";
import { api, getErrorMessage } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  bg: string;
  delay?: number;
  onClick?: () => void;
}

function StatCard({
  label,
  value,
  icon,
  bg,
  delay = 0,
  onClick,
}: StatCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="w-full text-left bg-white rounded-2xl p-5 border border-gray-100 cursor-pointer hover:shadow-md hover:border-mint/40 transition-all group flex items-center justify-between"
    >
      <div>
        <div className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
          {value}
        </div>
        <div className="text-xs font-semibold text-gray-500">{label}</div>
      </div>
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0"
        style={{ background: bg }}
      >
        {icon}
      </div>
    </motion.button>
  );
}

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
}

interface UnifiedSearchResponse {
  query: string;
  total: number;
  results: {
    cases?: SearchHit[];
    clients?: SearchHit[];
    notices?: SearchHit[];
    drafts?: SearchHit[];
    documents?: SearchHit[];
    invoices?: SearchHit[];
  };
}

const SEARCH_CATEGORIES: Array<{
  key: keyof UnifiedSearchResponse["results"];
  label: string;
}> = [
  { key: "cases", label: "Cases & Matters" },
  { key: "clients", label: "Clients" },
  { key: "notices", label: "Legal Notices" },
  { key: "drafts", label: "Drafts" },
  { key: "documents", label: "Documents & Evidence" },
  { key: "invoices", label: "Invoices" },
];

const emptyMetrics = {
  critical_matters: {
    today_hearings: 0,
    urgent_filings: 0,
    pending_notices: 0,
    limitation_alerts: 0,
    pending_affidavits: 0,
  },
  limitation_alerts: [],
  notice_summary: {
    received: 0,
    pending_replies: 0,
    overdue_replies: 0,
    replies_sent: 0,
  },
  matter_status: {
    active: 0,
    drafting: 0,
    evidence: 0,
    argument: 0,
    appeal: 0,
    closed: 0,
  },
  upcoming_hearings: [],
  billing: {
    outstanding: 0,
    pending_hearing_fees: 0,
    pending_filing_fees: 0,
    advance_balance: 0,
  },
  team_work: {
    drafting: 0,
    research: 0,
    filing: 0,
    hearing: 0,
  },
  recent_activity: [],
};

export default function DashboardPage() {
  const router = useRouter();
  const [globalSearch, setGlobalSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] =
    useState<UnifiedSearchResponse | null>(null);

  const { data: rawMetrics, isLoading } = useDashboardMetrics();
  const metrics = rawMetrics || emptyMetrics;

  const today = new Date();
  const todayLabel = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleRunSearch = async () => {
    const q = globalSearch.trim();
    if (q.length < 2) {
      toast.info("Type at least 2 characters to search");
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await api.get<UnifiedSearchResponse>("/search/", {
        params: { q },
      });
      setSearchResults(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-[#F7F8F6]">
        <Header
          title="Fastcase Operations"
          subtitle={`Welcome back · ${todayLabel}`}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-sidebar border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header
        title="Fastcase Operations"
        subtitle={`Welcome back · ${todayLabel}`}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Real Unified Practice Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669]">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <span className="text-slate-900 text-sm font-bold">
                  Unified Practice Search
                </span>
              </div>
              <p className="text-slate-500 text-xs">
                Search across all active matters, clients, notices, drafts, documents, and invoices.
              </p>
            </div>

            <div className="w-full md:w-auto md:flex-1 md:max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGlobalSearch(v);
                    if (!v.trim()) setSearchResults(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRunSearch();
                    }
                  }}
                  placeholder="Enter case CNR, suit number, client name, notice, or document..."
                  className="w-full h-10 pl-10 pr-28 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                {searchResults && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalSearch("");
                      setSearchResults(null);
                    }}
                    className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRunSearch}
                  disabled={isSearching}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3.5 rounded-lg text-xs font-bold text-white shadow-xs transition-all hover:bg-[#02201D] active:scale-95 bg-[#013B36] cursor-pointer disabled:opacity-60 flex items-center gap-1"
                >
                  {isSearching ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : null}
                  Search
                </button>
              </div>
            </div>
          </div>

          {searchResults && (
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">
                  {searchResults.total} result
                  {searchResults.total === 1 ? "" : "s"} for &ldquo;
                  {searchResults.query}&rdquo;
                </span>
                <button
                  type="button"
                  onClick={() => setSearchResults(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close Results
                </button>
              </div>

              {searchResults.total === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                  No matching cases, clients, notices, drafts, documents, or invoices found.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                  {SEARCH_CATEGORIES.map((cat) => {
                    const hits = searchResults.results[cat.key] || [];
                    if (hits.length === 0) return null;
                    return (
                      <div
                        key={cat.key}
                        className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2"
                      >
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {cat.label} ({hits.length})
                        </div>
                        <div className="space-y-1.5">
                          {hits.map((hit) => (
                            <button
                              key={hit.id}
                              type="button"
                              onClick={() => router.push(hit.href)}
                              className="w-full text-left p-2 rounded-lg bg-white border border-slate-100 hover:border-mint/60 transition-colors flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-900 truncate">
                                  {hit.title}
                                </div>
                                {hit.subtitle && (
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {hit.subtitle}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 capitalize shrink-0">
                                {hit.badge.replace(/_/g, " ")}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* 1. Today's Critical Matters (Clickable Cards) */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3 ml-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" /> Today&apos;s Critical Items
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Today's Hearings"
              value={metrics.critical_matters.today_hearings}
              icon={
                <CalendarDays
                  className="w-6 h-6"
                  style={{ color: "#EF4444" }}
                  strokeWidth={1.75}
                />
              }
              bg="rgba(239,68,68,0.12)"
              delay={0.05}
              onClick={() => router.push("/hearings?tab=Today")}
            />
            <StatCard
              label="Urgent Filings"
              value={metrics.critical_matters.urgent_filings}
              icon={
                <FileArchive
                  className="w-6 h-6"
                  style={{ color: "#F97316" }}
                  strokeWidth={1.75}
                />
              }
              bg="rgba(249,115,22,0.12)"
              delay={0.1}
              onClick={() => router.push("/cases")}
            />
            <StatCard
              label="Pending Replies"
              value={metrics.critical_matters.pending_notices}
              icon={
                <FileSignature
                  className="w-6 h-6"
                  style={{ color: "#EAB308" }}
                  strokeWidth={1.75}
                />
              }
              bg="rgba(234,179,8,0.12)"
              delay={0.15}
              onClick={() => router.push("/notices")}
            />
            <StatCard
              label="Limitation Alerts"
              value={metrics.critical_matters.limitation_alerts}
              icon={
                <Clock
                  className="w-6 h-6"
                  style={{ color: "#A855F7" }}
                  strokeWidth={1.75}
                />
              }
              bg="rgba(168,85,247,0.12)"
              delay={0.2}
              onClick={() => router.push("/compliance")}
            />
            <StatCard
              label="Pending Affidavits"
              value={metrics.critical_matters.pending_affidavits}
              icon={
                <FileText
                  className="w-6 h-6"
                  style={{ color: "#3B82F6" }}
                  strokeWidth={1.75}
                />
              }
              bg="rgba(59,130,246,0.12)"
              delay={0.25}
              onClick={() => router.push("/draft-workspace")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Hearings Widget */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-sidebar" /> Upcoming Hearings
                </h3>
                <button
                  onClick={() => router.push("/hearings")}
                  className="text-xs font-semibold text-sidebar hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {metrics.upcoming_hearings.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No upcoming hearings scheduled.
                  </div>
                ) : (
                  metrics.upcoming_hearings.map((h) => (
                    <div
                      key={h.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between transition-colors"
                      onClick={() => router.push(`/cases/${h.case_id}`)}
                    >
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">
                          {h.case_title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Scale className="w-3 h-3" /> {h.court}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {h.assigned_advocate}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm font-bold text-gray-900">
                          {h.hearing_date}
                        </div>
                        <div className="text-xs text-sidebar font-medium mt-0.5">
                          {h.hearing_time
                            ? h.hearing_time.substring(0, 5)
                            : "TBD"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notice Management Summary */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-500" /> Notice Management
                  </h3>
                  <button
                    onClick={() => router.push("/notices")}
                    className="text-xs font-semibold text-sidebar hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Notices Received</span>
                    <span className="font-semibold text-gray-900">
                      {metrics.notice_summary.received}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Pending Replies</span>
                    <span className="font-bold text-amber-600">
                      {metrics.notice_summary.pending_replies}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Overdue Replies</span>
                    <span className="font-bold text-red-600">
                      {metrics.notice_summary.overdue_replies}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Replies Sent</span>
                    <span className="font-semibold text-green-600">
                      {metrics.notice_summary.replies_sent}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Matter Status Pipeline */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-500" /> Matter Pipeline
                  </h3>
                  <button
                    onClick={() => router.push("/cases")}
                    className="text-xs font-semibold text-sidebar hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      label: "Active Matters",
                      val: metrics.matter_status.active,
                      color: "bg-emerald-500",
                    },
                    {
                      label: "Drafting Stage",
                      val: metrics.matter_status.drafting,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Evidence Stage",
                      val: metrics.matter_status.evidence,
                      color: "bg-amber-500",
                    },
                    {
                      label: "Argument Stage",
                      val: metrics.matter_status.argument,
                      color: "bg-purple-500",
                    },
                    {
                      label: "Appeal Stage",
                      val: metrics.matter_status.appeal,
                      color: "bg-pink-500",
                    },
                    {
                      label: "Closed Matters",
                      val: metrics.matter_status.closed,
                      color: "bg-gray-400",
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center text-sm">
                      <div
                        className={cn("w-2 h-2 rounded-full mr-2", item.color)}
                      />
                      <span className="text-gray-600 flex-1">{item.label}</span>
                      <span className="font-semibold text-gray-900">
                        {item.val}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" /> Recent Activity Feed
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                {metrics.recent_activity.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">
                    No recent activity.
                  </div>
                ) : (
                  metrics.recent_activity.map((act, i) => (
                    <button
                      type="button"
                      key={`${act.type}-${act.id}-${i}`}
                      onClick={() =>
                        router.push(
                          act.href ||
                            (act.type.includes("case")
                              ? `/cases/${act.id}`
                              : "/evidence")
                        )
                      }
                      className="w-full text-left p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {act.type.includes("case") ? (
                          <Briefcase className="w-4 h-4 text-sidebar" />
                        ) : act.type.includes("notice") ? (
                          <Mail className="w-4 h-4 text-amber-600" />
                        ) : act.type.includes("intake") ? (
                          <ClipboardList className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-sidebar" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {act.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {act.date
                            ? new Date(act.date).toLocaleString()
                            : "Just now"}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Column (1/3) */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "New Client", icon: Users, href: "/clients" },
                  { label: "New Matter", icon: Briefcase, href: "/cases" },
                  { label: "Upload Notice", icon: Upload, href: "/notices" },
                  {
                    label: "Generate Reply",
                    icon: FileSignature,
                    href: "/notices/reply-builder",
                  },
                  { label: "Upload Evidence", icon: FileVideo, href: "/evidence" },
                  {
                    label: "Create Draft",
                    icon: FileDiff,
                    href: "/draft-workspace",
                  },
                  { label: "Add Hearing", icon: CalendarDays, href: "/hearings" },
                  { label: "Gen Invoice", icon: Wallet, href: "/billing" },
                ].map((action) => (
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

            {/* Limitation & Deadline Alerts */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Limitation Alerts
                </h3>
                <button
                  onClick={() => router.push("/compliance")}
                  className="text-xs font-semibold text-sidebar hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {metrics.limitation_alerts.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No approaching limitation dates.
                  </div>
                ) : (
                  metrics.limitation_alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => router.push(`/cases/${alert.id}`)}
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <div className="text-sm font-semibold text-gray-900 truncate">
                          {alert.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {alert.case_no}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={cn(
                            "text-xs font-bold px-2 py-1 rounded-md",
                            alert.days_left <= 7
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          )}
                        >
                          {alert.days_left} Days Left
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {alert.limitation_date}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Legal Billing Snapshot */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-[#02201D] rounded-2xl p-5 text-white shadow-lg relative overflow-hidden border border-[#03362E]"
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at 100% 0%, rgba(52,211,153,0.15) 0%, transparent 60%)",
                }}
              />
              <h3 className="text-sm font-semibold text-white/90 mb-4 flex items-center gap-2 relative z-10">
                <Wallet className="w-4 h-4 text-[#34D399]" /> Billing Snapshot
              </h3>
              <div className="space-y-4 relative z-10">
                <div>
                  <div className="text-xs text-white/60 mb-1">
                    Total Outstanding
                  </div>
                  <div className="text-2xl font-bold text-[#6EE7B7]">
                    {formatCurrency(metrics.billing.outstanding)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <div className="text-[10px] text-white/60 mb-0.5">
                      Pending Hearing Fees
                    </div>
                    <div className="text-sm font-semibold text-white/90">
                      {formatCurrency(metrics.billing.pending_hearing_fees)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-white/60 mb-0.5">
                      Pending Filing Fees
                    </div>
                    <div className="text-sm font-semibold text-white/90">
                      {formatCurrency(metrics.billing.pending_filing_fees)}
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <div
                    className="flex justify-between items-center bg-white/5 rounded-lg p-2 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => router.push("/billing")}
                  >
                    <div>
                      <div className="text-[10px] text-white/60">
                        Advance Balance Pool
                      </div>
                      <div className="text-sm font-bold text-[#34D399]">
                        {formatCurrency(metrics.billing.advance_balance)}
                      </div>
                    </div>
                    <ArrowRightCircle className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Team Work Allocation */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl border border-gray-100 p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-sidebar" /> Team Work Allocation
                </h3>
                <button
                  onClick={() => router.push("/team")}
                  className="text-xs font-semibold text-sidebar hover:underline"
                >
                  View Team
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {metrics.team_work.drafting}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">
                    Drafting Tasks
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {metrics.team_work.research}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">
                    Research Tasks
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {metrics.team_work.filing}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">
                    Filing Tasks
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {metrics.team_work.hearing}
                  </div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">
                    Hearing Assignments
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
