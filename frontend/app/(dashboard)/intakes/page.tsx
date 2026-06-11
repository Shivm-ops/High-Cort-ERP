"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, ClipboardList, Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";
import Header from "@/components/layout/Header";
import { useIntakes, useCreateIntake } from "@/lib/hooks/useIntakes";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  under_review: "bg-amber-50 text-amber-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  awaiting_documents: "bg-blue-50 text-blue-700",
};

export default function IntakesPage() {
  const router = useRouter();
  const { data, isLoading } = useIntakes();
  const createIntake = useCreateIntake();
  const [search, setSearch] = useState("");

  const handleNewIntake = async () => {
    const res = await createIntake.mutateAsync({ status: "under_review" });
    if (res.id) {
      router.push(`/intakes/${res.id}`);
    }
  };

  if (isLoading) return <div className="flex flex-col h-full bg-[#F7F8F6]"><Header title="Loading..." subtitle="" /></div>;

  const allIntakes = data?.intakes || [];
  // Filter out completely blank drafts to prevent "fake records" counting
  const intakes = allIntakes.filter((i: any) => i.client_name?.trim() || i.narrative?.trim());
  const filtered = intakes.filter(i => {
    if (!search) return true;
    const s = search.toLowerCase();
    const nameMatch = i.client_name?.toLowerCase().includes(s) ?? false;
    const narrativeMatch = i.narrative?.toLowerCase().includes(s) ?? false;
    return nameMatch || narrativeMatch;
  });

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Client Intake & Assessment" subtitle="Manage new client interviews and pre-case evaluations" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Top Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search intakes by client or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint transition-shadow placeholder:text-gray-400"
            />
          </div>
          <button onClick={handleNewIntake} disabled={createIntake.isPending}
            className="flex items-center gap-2 bg-sidebar text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-sidebar-dark transition-colors shadow-sm disabled:opacity-50">
            <Plus className="w-4 h-4" /> New Intake
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Intakes", value: intakes.length, icon: ClipboardList, color: "text-sidebar" },
            { label: "Under Review", value: intakes.filter(i => i.status === "under_review").length, icon: Clock, color: "text-amber-600" },
            { label: "Awaiting Docs", value: intakes.filter(i => i.status === "awaiting_documents").length, icon: FileText, color: "text-blue-600" },
            { label: "Accepted", value: intakes.filter(i => i.status === "accepted").length, icon: CheckCircle, color: "text-green-600" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50", stat.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                </div>
                <div className="text-sm font-medium text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {!filtered.length ? (
            <div className="py-16 text-center">
              <ClipboardList className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No Intakes Found</h3>
              <p className="text-sm text-gray-500">Start a new client assessment to see it here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((intake) => (
                <div key={intake.id} onClick={() => router.push(`/intakes/${intake.id}`)}
                  className="p-5 hover:bg-gray-50/80 transition-colors cursor-pointer group flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-lg",
                    !intake.client_name ? "bg-gray-200" : "bg-gradient-to-br from-mint to-sidebar")}>
                    {intake.client_name ? intake.client_name.slice(0, 1).toUpperCase() : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-gray-900 truncate">
                        {intake.client_name || "New Client Intake (Draft)"}
                      </h3>
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium capitalize", STATUS_COLORS[intake.status] || "bg-gray-100 text-gray-600")}>
                        {intake.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                      {intake.narrative || "No narrative recorded yet."}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-gray-400">
                      <span>Started: {new Date(intake.created_at).toLocaleDateString()}</span>
                      {intake.urgency_level && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" /> {intake.urgency_level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
