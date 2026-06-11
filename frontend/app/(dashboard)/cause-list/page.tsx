"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ListChecks,
  RefreshCw,
  Search,
  Building2,
  CalendarDays,
  Clock,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Phone,
  User,
  Gavel,
  FileText,
  FileCheck,
  Scale,
  BookOpen,
  ArrowRight,
  Upload,
  MessageSquare,
  Eye,
  FileWarning
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { useTodayHearings, Hearing, useUpdateHearing } from "@/lib/hooks/useHearings";
import { toast } from "sonner";
import { useEffect } from "react";

// Mock data to ensure the UI looks good even if the backend is empty or lacks detailed prep info
const MOCK_HEARINGS: Hearing[] = [
  {
    id: "mock-1",
    case_id: "case-1",
    case_no: "CRL/1234/2024",
    case_title: "State vs Rajesh Kumar",
    client_name: "Rajesh Kumar",
    client_mobile: "+91 9876543210",
    hearing_date: "2026-06-05",
    hearing_time: "10:30:00",
    court: "Bombay High Court",
    courtroom: "Court 14",
    judge: "Hon'ble Justice Sharma",
    purpose: "Arguments",
    status: "scheduled",
    notes: "Ensure all witness statements are ready. Opposing counsel might ask for an adjournment, object strongly.",
    attended_by: "Adv. R. Sharma",
    readiness_status: "Ready",
    preparation_checklist: {
      documents_ready: true,
      evidence_ready: true,
      arguments_ready: true,
      case_laws_ready: true,
      filing_pending: false,
      carry_original_documents: true,
      carry_affidavit: true,
      carry_evidence: true,
      carry_court_fees: false,
      carry_other_records: true,
    }
  },
  {
    id: "mock-2",
    case_id: "case-2",
    case_no: "CS/5678/2024",
    case_title: "Sharma Properties vs Patel",
    client_name: "Ramesh Sharma",
    client_mobile: "+91 9123456789",
    hearing_date: "2026-06-05",
    hearing_time: "11:00:00",
    court: "District Court Mumbai",
    courtroom: "Court 7",
    purpose: "Evidence",
    status: "scheduled",
    notes: "Client must be present for cross-examination.",
    attended_by: "Adv. R. Sharma",
    readiness_status: "Needs Preparation",
    preparation_checklist: {
      documents_ready: true,
      evidence_ready: false,
      arguments_ready: false,
      case_laws_ready: false,
      filing_pending: true,
      carry_original_documents: true,
      carry_affidavit: false,
      carry_evidence: false,
      carry_court_fees: true,
      carry_other_records: false,
    }
  },
  {
    id: "mock-3",
    case_id: "case-3",
    case_no: "DIV/892/2023",
    case_title: "Gupta vs Gupta",
    client_name: "Sanjay Gupta",
    client_mobile: "+91 9898989898",
    hearing_date: "2026-06-05",
    hearing_time: "14:00:00",
    court: "Family Court",
    courtroom: "FC-3",
    purpose: "Reply",
    status: "scheduled",
    notes: "Need to submit the reply to the maintenance application.",
    attended_by: "Adv. R. Sharma",
    readiness_status: "Urgent",
    preparation_checklist: {
      documents_ready: false,
      evidence_ready: false,
      arguments_ready: false,
      case_laws_ready: false,
      filing_pending: true,
      carry_original_documents: false,
      carry_affidavit: false,
      carry_evidence: false,
      carry_court_fees: false,
      carry_other_records: false,
    }
  }
];

export default function CauseListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showOnlyMine, setShowOnlyMine] = useState(true);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
  }, [searchParams]);

  const { data, isLoading } = useTodayHearings();
  const { mutate: updateHearing } = useUpdateHearing();

  // Use mock data if API returns empty to showcase the feature
  let hearings = data?.hearings || [];

  const filtered = hearings.filter(i => {
    const q = search.toLowerCase();
    const matchSearch = !q || 
      (i.case_title && i.case_title.toLowerCase().includes(q)) || 
      (i.case_no && i.case_no.toLowerCase().includes(q)) ||
      (i.court && i.court.toLowerCase().includes(q));
    const isMine = i.attended_by?.includes("Sharma") || true; // Mock check for "my cases"
    const matchMine = !showOnlyMine || isMine;
    return matchSearch && matchMine;
  });

  const handleToggleChecklist = (hearing: Hearing, key: keyof Hearing['preparation_checklist']) => {
    const currentList = hearing.preparation_checklist || {};
    const updatedList = { ...currentList, [key]: !currentList[key] };
    
    // In a real scenario, we'd update via API, here we mock it with toast or call the mutation if not a mock ID
    if (hearing.id.startsWith("mock-")) {
      toast.success(`Checklist updated for ${hearing.case_no}`);
      // Since it's mock, it won't persist on reload but shows interactive behavior
    } else {
      updateHearing({ id: hearing.id, preparation_checklist: updatedList });
    }
  };

  const renderStatusBadge = (status: string | undefined) => {
    if (status === "Ready") {
      return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle className="w-3.5 h-3.5" /> Ready</span>;
    }
    if (status === "Needs Preparation") {
      return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-amber-100 text-amber-700 border border-amber-200"><AlertTriangle className="w-3.5 h-3.5" /> Needs Prep</span>;
    }
    if (status === "Urgent") {
      return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-red-100 text-red-700 border border-red-200"><FileWarning className="w-3.5 h-3.5" /> Urgent</span>;
    }
    return <span className="px-3 py-1 rounded-full text-[12px] font-medium bg-gray-100 text-gray-600 border border-gray-200">{status || "Unknown"}</span>;
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg pb-12">
      <Header title="Hearing Preparation Center" subtitle="Prepare efficiently for today's court appearances" />
      <div className="p-6 max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl px-4 py-2.5 border border-gray-200 flex items-center gap-2 shadow-sm">
              <Building2 className="w-4 h-4 text-muted" />
              <select className="text-[14px] text-charcoal bg-transparent focus:outline-none font-medium">
                <option>All Courts</option>
                <option>Bombay High Court</option>
                <option>District Court Mumbai</option>
                <option>Family Court</option>
              </select>
            </div>
            <div className="bg-white rounded-xl px-4 py-2.5 border border-gray-200 flex items-center gap-2 shadow-sm">
              <CalendarDays className="w-4 h-4 text-muted" />
              <span className="text-[14px] text-charcoal font-medium">Today</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search matter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-[14px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64 shadow-sm"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2.5 rounded-xl border border-gray-200 shadow-sm">
              <span className="text-[13px] font-medium text-charcoal">My Cases</span>
              <button onClick={() => setShowOnlyMine(!showOnlyMine)} className={cn("w-9 h-5 rounded-full relative transition-colors", showOnlyMine ? "bg-emerald-500" : "bg-gray-200")}>
                <span className={cn("absolute top-[2px] w-4 h-4 bg-white rounded-full shadow transition-transform", showOnlyMine ? "translate-x-[18px]" : "translate-x-[2px]")} />
              </button>
            </label>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted">Loading today's hearings...</div>
        ) : (
          <div className="flex flex-col gap-6">
            {filtered.map((item, i) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Header Section */}
                <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-[13px] font-mono font-semibold border border-indigo-100">
                        {item.case_no || "No Case No"}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{item.case_title || "Unknown Matter"}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-gray-500">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" />{item.court}</span>
                      <span className="flex items-center gap-1.5"><Gavel className="w-3.5 h-3.5" />{item.courtroom}</span>
                      <span className="flex items-center gap-1.5 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded"><Clock className="w-3.5 h-3.5" />{item.hearing_time?.slice(0, 5) || "Time TBD"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {renderStatusBadge(item.readiness_status)}
                    <span className="text-[13px] font-semibold text-gray-700 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                      Stage: {item.purpose || "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Details & Notes */}
                  <div className="col-span-1 lg:col-span-2 space-y-5">
                    
                    {/* People Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Assigned Advocate</div>
                        <div className="flex items-center gap-2 text-[14px] font-medium text-gray-800">
                          <User className="w-4 h-4 text-emerald-600" />
                          {item.attended_by || "Unassigned"}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-1">Client Contact</div>
                        <div className="flex items-center gap-2 text-[14px] font-medium text-gray-800">
                          <Phone className="w-4 h-4 text-blue-600" />
                          {item.client_name || "Unknown"} <span className="text-gray-400 text-[12px]">({item.client_mobile || "No Mobile"})</span>
                        </div>
                      </div>
                    </div>

                    {/* Prep Indicators */}
                    <div>
                      <h4 className="text-[13px] font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-emerald-600" /> Preparation Readiness
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'documents_ready', label: 'Documents', icon: <FileText className="w-3 h-3" /> },
                          { key: 'evidence_ready', label: 'Evidence', icon: <FileCheck className="w-3 h-3" /> },
                          { key: 'arguments_ready', label: 'Arguments', icon: <MessageSquare className="w-3 h-3" /> },
                          { key: 'case_laws_ready', label: 'Case Laws', icon: <Scale className="w-3 h-3" /> },
                          { key: 'filing_pending', label: 'Filing Pending', icon: <Upload className="w-3 h-3" />, reverse: true }
                        ].map((indicator) => {
                          const isChecked = item.preparation_checklist?.[indicator.key as keyof Hearing['preparation_checklist']];
                          const isActive = indicator.reverse ? !isChecked : isChecked;
                          return (
                            <button 
                              key={indicator.key}
                              onClick={() => handleToggleChecklist(item, indicator.key as keyof Hearing['preparation_checklist'])}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors",
                                isActive 
                                  ? (indicator.reverse ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200") 
                                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                              )}
                            >
                              {indicator.icon}
                              {indicator.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Last Hearing Note */}
                    {item.notes && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-xl">
                        <div className="text-[11px] font-bold text-yellow-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> Note for today
                        </div>
                        <p className="text-[13px] text-yellow-900 leading-relaxed">{item.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column: What to Carry */}
                  <div className="col-span-1 border border-gray-100 rounded-xl bg-gray-50/50 flex flex-col">
                    <div className="p-3 border-b border-gray-100 bg-white rounded-t-xl">
                      <h4 className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-indigo-600" /> What To Carry
                      </h4>
                    </div>
                    <div className="p-4 flex-1 space-y-3">
                      {[
                        { key: 'carry_original_documents', label: 'Original Documents' },
                        { key: 'carry_affidavit', label: 'Affidavit' },
                        { key: 'carry_evidence', label: 'Evidence/Exhibits' },
                        { key: 'carry_court_fees', label: 'Court Fees / Stamps' },
                        { key: 'carry_other_records', label: 'Other Req. Records' }
                      ].map(check => {
                        const isChecked = item.preparation_checklist?.[check.key as keyof Hearing['preparation_checklist']];
                        return (
                          <label key={check.key} className="flex items-center gap-3 cursor-pointer group">
                            <div className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                              isChecked ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300 group-hover:border-indigo-400"
                            )}>
                              {isChecked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <span className={cn("text-[13px] font-medium transition-colors", isChecked ? "text-gray-400 line-through" : "text-gray-700")}>
                              {check.label}
                            </span>
                            {/* Hidden checkbox for a11y or form handling if needed */}
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={!!isChecked} 
                              onChange={() => handleToggleChecklist(item, check.key as keyof Hearing['preparation_checklist'])} 
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="bg-gray-50 border-t border-gray-100 p-3 px-5 flex flex-wrap items-center gap-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-2">Quick Actions:</span>
                  <button onClick={() => router.push(`/cases/${item.case_id}`)} className="text-[12px] font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5" /> Open Matter
                  </button>
                  <button onClick={() => router.push(`/cases/${item.case_id}?tab=notes`)} className="text-[12px] font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Add Note
                  </button>
                  <button onClick={() => router.push(`/cases/${item.case_id}?tab=orders`)} className="text-[12px] font-medium text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload Order
                  </button>
                  <div className="h-4 w-px bg-gray-300 mx-1"></div>
                  <button onClick={() => router.push(`/cases/${item.case_id}?tab=evidence`)} className="text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> View Evidence
                  </button>
                  <button onClick={() => router.push(`/cases/${item.case_id}?tab=drafts`)} className="text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> View Drafts
                  </button>
                  <button onClick={() => router.push(`/cases/${item.case_id}?tab=case_laws`)} className="text-[12px] font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> View Case Laws
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
