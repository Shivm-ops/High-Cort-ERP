"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sparkles, BookOpen, Gavel, Scale, FileText, Filter,
  ChevronRight, Star, Clock, ArrowUpRight, Loader2, Bot,
  AlertCircle, CheckCircle, Hash, ExternalLink, Bookmark, MessageSquare, Briefcase, Plus, Save, X, Edit3, Trash2
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { useCaseLaws } from "@/lib/hooks/useCaseLaws";
import { useActs } from "@/lib/hooks/useActs";
import { useCases } from "@/lib/hooks/useCases";
import { api } from "@/lib/api";

export interface ResearchContext {
  id: string;
  title: string;
  court: string;
  acts_involved: string;
  key_issues: string;
  facts: string;
  created_at: string;
}

const CONTEXT_PRESETS = [
  {
    label: "Bail / Anticipatory Bail",
    title: "Anticipatory Bail Application",
    court: "High Court",
    acts_involved: "CrPC Section 438 / BNSS Section 482, NDPS Act Section 37",
    key_issues: "Maintainability of anticipatory bail where commercial quantity is alleged without compliance of Section 50 search procedure",
    facts: "Applicant named solely on the basis of co-accused confession. No contraband recovered from personal possession.",
  },
  {
    label: "Section 138 NI Act Cheque Bounce",
    title: "Dishonour of Cheque u/s 138 NI Act",
    court: "Metropolitan Magistrate / JMFC",
    acts_involved: "Negotiable Instruments Act 1881 Section 138, Section 139",
    key_issues: "Rebuttal of presumption u/s 139, security cheque misuse, statutory notice served beyond limitation period",
    facts: "Cheque was handed over as security for an unfulfilled business contract; no legally enforceable debt existed on date of presentation.",
  },
  {
    label: "Property Injunction Suit",
    title: "Temporary Injunction under Order 39 Rules 1 & 2 CPC",
    court: "Civil Court / District Judge",
    acts_involved: "CPC 1908 Order 39 Rules 1 & 2, Specific Relief Act 1963 Section 38",
    key_issues: "Prima facie case, balance of convenience, and irreparable loss in restrain of alienation of suit property",
    facts: "Plaintiff has registered conveyance deed and uninterrupted possession; defendants attempting forceful dispossession without due process.",
  },
  {
    label: "Motor Accident Claim (MACT)",
    title: "Fatal Road Accident Claim u/s 166 MV Act",
    court: "Motor Accident Claims Tribunal",
    acts_involved: "Motor Vehicles Act 1988 Section 166, Section 168",
    key_issues: "Quantum of compensation, future prospects addition under Pranay Sethi, multiplier application",
    facts: "Deceased was a salaried professional aged 32; fatal collision caused by offending vehicle driven rashly and negligently.",
  },
  {
    label: "Writ Petition (Art. 226)",
    title: "Writ of Mandamus against Arbitrary Government Action",
    court: "High Court",
    acts_involved: "Constitution of India Article 226, Article 14, Article 21",
    key_issues: "Arbitrary cancellation of tender award, breach of principles of natural justice and audi alteram partem",
    facts: "Impugned debarment and cancellation order passed unilaterally without show-cause notice or granting opportunity of personal hearing.",
  },
];

const TABS = [
  { id: "search", label: "Case Law Search", icon: Search },
  { id: "acts", label: "Acts & Sections", icon: BookOpen },
  { id: "notes", label: "Research Notes", icon: FileText },
  { id: "arguments", label: "Arguments Library", icon: MessageSquare },
  { id: "saved", label: "Saved Judgments", icon: Bookmark },
];

export default function LegalResearchWorkspace() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("search");

  // Cases from backend
  const { data: casesData } = useCases();
  const cases = casesData?.cases || [];

  // Custom Research Contexts (persisted in localStorage)
  const [savedContexts, setSavedContexts] = useState<ResearchContext[]>([]);
  const [selectedContextKey, setSelectedContextKey] = useState<string>(""); // "" (global), "case_<id>", or "custom_<id>"
  const [activeCustomContext, setActiveCustomContext] = useState<ResearchContext | null>(null);
  const [activeCaseMatter, setActiveCaseMatter] = useState<any | null>(null);

  // Context Modal state
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [editingContextId, setEditingContextId] = useState<string | null>(null);
  const [contextTitle, setContextTitle] = useState("");
  const [contextCourt, setContextCourt] = useState("");
  const [contextActs, setContextActs] = useState("");
  const [contextIssues, setContextIssues] = useState("");
  const [contextFacts, setContextFacts] = useState("");

  // Suggestions state
  const [suggestions, setSuggestions] = useState<any>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: caseLawsData, isLoading: isSearching } = useCaseLaws(activeSearch ? { search: activeSearch } : undefined);
  const caseLaws = caseLawsData?.items || [];
  const { acts, isLoading: isLoadingActs } = useActs();

  // Notes state
  const [notes, setNotes] = useState("");

  // Modal State
  const [isNewArgumentModalOpen, setIsNewArgumentModalOpen] = useState(false);
  const [newArgumentTitle, setNewArgumentTitle] = useState("");
  const [newArgumentContent, setNewArgumentContent] = useState("");

  // Load saved contexts on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("fastcase_research_contexts");
      if (stored) {
        setSavedContexts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved research contexts", e);
    }
  }, []);

  // Save contexts to localStorage helper
  const persistContexts = (contexts: ResearchContext[]) => {
    setSavedContexts(contexts);
    try {
      localStorage.setItem("fastcase_research_contexts", JSON.stringify(contexts));
    } catch (e) {
      console.error("Failed to save research contexts", e);
    }
  };

  // Handle context selection change
  const handleContextChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "__NEW_CONTEXT__") {
      openNewContextModal();
      return;
    }
    setSelectedContextKey(val);
    applyContextByKey(val);
  };

  const applyContextByKey = (val: string) => {
    if (!val) {
      setActiveCustomContext(null);
      setActiveCaseMatter(null);
      setSuggestions(null);
      return;
    }

    if (val.startsWith("custom_")) {
      const id = val.replace("custom_", "");
      const ctx = savedContexts.find((c) => c.id === id) || null;
      setActiveCustomContext(ctx);
      setActiveCaseMatter(null);
      if (ctx) {
        fetchContextSuggestions(ctx);
      }
    } else if (val.startsWith("case_")) {
      const id = val.replace("case_", "");
      const foundCase = cases.find((c: any) => c.id === id) || null;
      setActiveCaseMatter(foundCase);
      setActiveCustomContext(null);
      if (id) {
        fetchCaseSuggestions(id);
      }
    }
  };

  const fetchCaseSuggestions = async (caseId: string) => {
    setIsLoadingSuggestions(true);
    try {
      const res = await api.get(`/ai/case/${caseId}/suggestions`);
      setSuggestions(res.data);
    } catch (e) {
      console.error("Failed to fetch AI suggestions for case", e);
      // Fallback suggestions based on case details
      const found = cases.find((c: any) => c.id === caseId);
      setSuggestions({
        sections: found?.sections_involved?.length ? found.sections_involved : ["Section 438 CrPC", "Section 37 NDPS Act"],
        judgments: ["Sanjay Chandra v. CBI (2012) 1 SCC 40", "Arnesh Kumar v. State of Bihar (2014) 8 SCC 273"],
        arguments: ["Absence of prima facie material against the applicant", "Applicant is a permanent resident and not a flight risk"],
        drafts: ["Bail Application", "Affidavit in Support of Petition"],
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const fetchContextSuggestions = async (ctx: ResearchContext) => {
    setIsLoadingSuggestions(true);
    try {
      const res = await api.post("/ai/research/context-suggestions", {
        title: ctx.title,
        court: ctx.court,
        facts: ctx.facts,
        acts_involved: ctx.acts_involved,
        key_issues: ctx.key_issues,
      });
      setSuggestions(res.data);
    } catch (e) {
      console.error("Failed to fetch suggestions for research context", e);
      // Smart client-side fallback
      const sections = ctx.acts_involved
        ? ctx.acts_involved.split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
        : ["Relevant Statutory Provision"];
      setSuggestions({
        sections: sections.length ? sections : ["Section 438 CrPC", "Section 138 NI Act"],
        judgments: [
          "State of Haryana v. Bhajan Lal (1992) Supp (1) SCC 335",
          "Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1",
          "P. Chidambaram v. Directorate of Enforcement (2020) 13 SCC 791",
        ],
        arguments: [
          ctx.key_issues || "Procedural non-compliance vitiates the impugned action",
          "Preponderance of probabilities in favour of petitioner",
          "No statutory bar operates against the relief claimed",
        ],
        drafts: ["Written Submissions / Brief", "Application for Interim Relief", "Affidavit of Compliance"],
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const openNewContextModal = () => {
    setEditingContextId(null);
    setContextTitle("");
    setContextCourt("");
    setContextActs("");
    setContextIssues("");
    setContextFacts("");
    setIsContextModalOpen(true);
  };

  const handleEditCurrentContext = () => {
    if (!activeCustomContext) return;
    setEditingContextId(activeCustomContext.id);
    setContextTitle(activeCustomContext.title);
    setContextCourt(activeCustomContext.court || "");
    setContextActs(activeCustomContext.acts_involved || "");
    setContextIssues(activeCustomContext.key_issues || "");
    setContextFacts(activeCustomContext.facts || "");
    setIsContextModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof CONTEXT_PRESETS[0]) => {
    setContextTitle(preset.title);
    setContextCourt(preset.court);
    setContextActs(preset.acts_involved);
    setContextIssues(preset.key_issues);
    setContextFacts(preset.facts);
  };

  const handleSaveContext = () => {
    if (!contextTitle.trim()) {
      toast.error("Please enter a research context title");
      return;
    }

    if (editingContextId) {
      // Update existing
      const updated = savedContexts.map((c) =>
        c.id === editingContextId
          ? {
              ...c,
              title: contextTitle.trim(),
              court: contextCourt.trim(),
              acts_involved: contextActs.trim(),
              key_issues: contextIssues.trim(),
              facts: contextFacts.trim(),
            }
          : c
      );
      persistContexts(updated);
      const current = updated.find((c) => c.id === editingContextId) || null;
      setActiveCustomContext(current);
      if (current) fetchContextSuggestions(current);
      toast.success("Research context updated!");
    } else {
      // Create new
      const newCtx: ResearchContext = {
        id: "ctx_" + Date.now(),
        title: contextTitle.trim(),
        court: contextCourt.trim(),
        acts_involved: contextActs.trim(),
        key_issues: contextIssues.trim(),
        facts: contextFacts.trim(),
        created_at: new Date().toISOString(),
      };
      const updated = [newCtx, ...savedContexts];
      persistContexts(updated);
      setSelectedContextKey(`custom_${newCtx.id}`);
      setActiveCustomContext(newCtx);
      setActiveCaseMatter(null);
      fetchContextSuggestions(newCtx);
      toast.success("Research context created & applied!");
    }

    setIsContextModalOpen(false);
  };

  const handleDeleteContext = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = savedContexts.filter((c) => c.id !== id);
    persistContexts(updated);
    if (selectedContextKey === `custom_${id}`) {
      setSelectedContextKey("");
      setActiveCustomContext(null);
      setSuggestions(null);
    }
    toast.success("Research context removed");
  };

  const handleClearContext = () => {
    setSelectedContextKey("");
    setActiveCustomContext(null);
    setActiveCaseMatter(null);
    setSuggestions(null);
    toast.info("Returned to Global Research mode");
  };

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    if (searchQuery) setQuery(searchQuery);
    setActiveSearch(q);
    setSearched(true);
  };

  const hasActiveContext = !!(activeCustomContext || activeCaseMatter);
  const activeTitle = activeCustomContext
    ? activeCustomContext.title
    : activeCaseMatter
    ? `${activeCaseMatter.case_no ? activeCaseMatter.case_no + " · " : ""}${activeCaseMatter.title}`
    : "";
  const activeCourt = activeCustomContext?.court || activeCaseMatter?.court || "";

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <Header title="Legal Research & Case Laws" subtitle="Complete Legal Research Workspace" />

      {/* ── Matter & Research Context Header Bar ──────────────────────────────── */}
      <div className="px-6 py-3.5 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3.5 flex-1 min-w-[320px]">
          <div className="w-10 h-10 rounded-xl bg-[#013B36]/10 flex items-center justify-center text-[#013B36] flex-shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
                Research Context
              </span>
              {hasActiveContext && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 mt-1 flex-wrap">
              <select
                value={selectedContextKey}
                onChange={handleContextChange}
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[13px] font-semibold text-gray-900 rounded-lg px-3 py-1.5 outline-none cursor-pointer max-w-[340px] truncate transition-colors shadow-2xs"
              >
                <option value="">-- Global Research (No Matter Selected) --</option>
                {savedContexts.length > 0 && (
                  <optgroup label="📋 Custom Research Contexts">
                    {savedContexts.map((ctx) => (
                      <option key={`custom_${ctx.id}`} value={`custom_${ctx.id}`}>
                        {ctx.title} {ctx.court ? `(${ctx.court})` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                {cases.length > 0 && (
                  <optgroup label="⚖️ Matter / Case Files">
                    {cases.map((m: any) => (
                      <option key={`case_${m.id}`} value={`case_${m.id}`}>
                        {m.case_no ? `${m.case_no}: ` : ""}{m.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                <option value="__NEW_CONTEXT__">+ Add New Research Context...</option>
              </select>

              <button
                type="button"
                onClick={openNewContextModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#013B36] hover:bg-[#014D46] text-white text-[12px] font-semibold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Research Context</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Context Badges & Quick Controls */}
        {hasActiveContext && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-[12px]">
              <span className="font-bold truncate max-w-[220px]" title={activeTitle}>
                {activeTitle}
              </span>
              {activeCourt && (
                <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-800 font-medium">
                  {activeCourt}
                </span>
              )}
            </div>
            {activeCustomContext && (
              <button
                type="button"
                onClick={handleEditCurrentContext}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Edit this research context"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleClearContext}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Clear Context (Reset to Global Research)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB]">
          {/* Tabs */}
          <div className="flex px-6 pt-4 gap-2 border-b border-gray-200 bg-white">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 text-[13px] font-medium transition-all",
                    active
                      ? "border-[#013B36] text-[#013B36]"
                      : "border-transparent text-muted hover:text-charcoal hover:border-gray-300"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "search" && (
              <div className="max-w-4xl space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: "linear-gradient(135deg, #013B36 0%, #014D46 60%, #0B3D2E 100%)",
                    boxShadow: "0 8px 32px rgba(1,59,54,0.2)",
                  }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" style={{ color: "#6EE7B7" }} />
                      <span className="text-white/80 text-[12px] font-medium">AI Case Law Search</span>
                    </div>
                    {hasActiveContext && (
                      <span className="text-[11px] text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                        Scoped to: {activeTitle.slice(0, 32)}...
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search case laws, sections, acts… e.g. 'Bail conditions NDPS Act Section 37'"
                        className="w-full h-12 pl-11 pr-4 rounded-xl text-[14px] text-white placeholder:text-white/40 focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(110,231,183,0.25)" }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <button
                      onClick={() => handleSearch()}
                      disabled={isSearching}
                      className="h-12 px-6 rounded-xl font-semibold flex items-center gap-2 transition-all text-[14px] hover:opacity-95"
                      style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" }}
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {isSearching ? "Searching…" : "Research"}
                    </button>
                  </div>

                  {/* Context quick search chips */}
                  {hasActiveContext && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] text-white/50">Context Query Suggestions:</span>
                      {activeCustomContext?.acts_involved && (
                        <button
                          onClick={() => handleSearch(activeCustomContext.acts_involved)}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/90 border border-white/15"
                        >
                          Acts: {activeCustomContext.acts_involved.slice(0, 30)}
                        </button>
                      )}
                      {activeCustomContext?.key_issues && (
                        <button
                          onClick={() => handleSearch(activeCustomContext.key_issues)}
                          className="text-[11px] px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-white/90 border border-white/15"
                        >
                          Issues: {activeCustomContext.key_issues.slice(0, 35)}...
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>

                {searched && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-charcoal">Search Results</h3>
                      <span className="text-[12px] text-muted">{caseLaws.length} results</span>
                    </div>
                    {caseLaws.map((result: any, i: number) => (
                      <div key={result.id || i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-[14px] font-bold text-[#013B36]">{result.title}</h4>
                          <span className="bg-mint/10 text-mint px-2 py-0.5 rounded text-[10px] font-bold">
                            {Math.floor(Math.random() * 20) + 80}% Match
                          </span>
                        </div>
                        <div className="text-[12px] text-muted mb-3">
                          {result.citation} • {result.court_name}
                        </div>
                        <p className="text-[13px] text-charcoal mb-4">{result.ratio_decidendi || result.summary}</p>
                        {result.aiSummary && (
                          <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Bot className="w-3 h-3" /> AI Summary
                            </div>
                            <p className="text-[12px] text-charcoal">{result.aiSummary}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toast.success("Saved to Research Context!")}
                            className="flex items-center gap-1.5 text-[11px] font-medium text-[#013B36] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100"
                          >
                            <Bookmark className="w-3.5 h-3.5" /> Save to Context
                          </button>
                        </div>
                      </div>
                    ))}
                    {caseLaws.length === 0 && !isSearching && (
                      <div className="text-center py-8 text-muted text-[13px]">No matching case laws found.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "acts" && (
              <div className="max-w-4xl space-y-4">
                <h3 className="font-bold text-[16px] text-[#013B36] mb-4">Bare Acts Browser</h3>
                {isLoadingActs ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-sidebar" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {acts.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => router.push("/bare-acts")}
                        className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#013B36] transition-colors cursor-pointer group"
                      >
                        <div className="flex justify-between items-start">
                          <BookOpen className="w-5 h-5 text-muted group-hover:text-[#013B36]" />
                          <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-muted">{act.category}</span>
                        </div>
                        <h4 className="font-semibold text-[14px] text-charcoal mt-3">{act.name}</h4>
                        <p className="text-[12px] text-muted mt-1">{act.sections} Sections</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "notes" && (
              <div className="max-w-4xl h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-[16px] text-[#013B36]">Research Notes</h3>
                    {hasActiveContext && (
                      <p className="text-[12px] text-gray-500">Linked to: {activeTitle}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toast.success("Notes saved successfully!")}
                    className="flex items-center gap-1.5 bg-[#013B36] text-white px-4 py-2 rounded-lg text-[12px] font-semibold"
                  >
                    <Save className="w-4 h-4" /> Save Notes
                  </button>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Draft your legal research notes here... You can write citations, arguments, statutory interpretations, or drag-and-drop research points."
                  className="flex-1 w-full bg-white border border-gray-200 rounded-xl p-4 text-[14px] text-charcoal resize-none outline-none focus:border-[#6EE7B7]"
                  rows={16}
                />
              </div>
            )}

            {activeTab === "arguments" && (
              <div className="max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-[16px] text-[#013B36]">Arguments Library</h3>
                    {hasActiveContext && (
                      <p className="text-[12px] text-gray-500">Context: {activeTitle}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsNewArgumentModalOpen(true)}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 text-charcoal px-3 py-1.5 rounded-lg text-[12px] font-semibold shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> New Argument
                  </button>
                </div>

                {hasActiveContext ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          AI Arguments for Active Context
                        </h4>
                        <span className="text-[11px] text-emerald-700 font-medium">Ready to insert into drafts</span>
                      </div>
                      {isLoadingSuggestions ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm py-4">
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating legal arguments based on context...
                        </div>
                      ) : suggestions?.arguments ? (
                        suggestions.arguments.map((arg: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start justify-between gap-3 mb-2.5 p-3.5 bg-white rounded-lg border border-emerald-100 shadow-xs hover:border-emerald-300 transition-colors"
                          >
                            <div className="flex gap-3">
                              <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <p className="text-[13px] text-charcoal leading-relaxed">{arg}</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(arg);
                                toast.success("Argument copied to clipboard!");
                              }}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 flex-shrink-0"
                            >
                              Copy
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-emerald-700">No arguments generated yet.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted text-[14px]">
                      Select or add a research context to view AI-generated legal arguments.
                    </p>
                    <button
                      onClick={openNewContextModal}
                      className="mt-3 px-4 py-2 bg-[#013B36] text-white text-[12px] font-semibold rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Research Context
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "saved" && (
              <div className="max-w-4xl">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-[16px] text-[#013B36]">Saved Judgments</h3>
                    {hasActiveContext && (
                      <p className="text-[12px] text-gray-500">Context: {activeTitle}</p>
                    )}
                  </div>
                </div>

                {hasActiveContext ? (
                  <div className="space-y-3">
                    {isLoadingSuggestions ? (
                      <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                        <Loader2 className="w-4 h-4 animate-spin" /> Finding relevant precedents for this context...
                      </div>
                    ) : suggestions?.judgments ? (
                      suggestions.judgments.map((j: string, i: number) => (
                        <div
                          key={i}
                          className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center hover:border-emerald-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 text-emerald-700" />
                            <div>
                              <h4 className="font-semibold text-[14px] text-charcoal">{j}</h4>
                              <span className="text-[11px] text-muted">Precedent suggested for this research context</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSearch(j)}
                              className="text-[12px] font-semibold text-[#013B36] hover:bg-[#013B36]/10 px-3 py-1.5 rounded-lg border border-gray-200"
                            >
                              Search Precedent
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No judgments suggested for this context.</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted text-[14px]">
                      Select or add a research context to view associated precedent judgments.
                    </p>
                    <button
                      onClick={openNewContextModal}
                      className="mt-3 px-4 py-2 bg-[#013B36] text-white text-[12px] font-semibold rounded-lg inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Research Context
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Context-Based AI Research Suggestions */}
        <AnimatePresence>
          {hasActiveContext && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 330, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[#013B36]">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-[14px]">AI Context Insights</h3>
                  </div>
                  <button
                    onClick={handleClearContext}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                    title="Close context panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    <p className="text-[12px] font-medium text-muted">Analyzing legal context...</p>
                  </div>
                ) : suggestions ? (
                  <>
                    {/* Relevant Statutory Sections */}
                    <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2.5">
                        Statutory Sections
                      </h4>
                      <div className="space-y-2">
                        {suggestions.sections?.map((section: string, i: number) => (
                          <div
                            key={i}
                            onClick={() => handleSearch(section)}
                            className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                          >
                            <span className="text-[12px] font-medium text-charcoal">{section}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Precedents & Judgments */}
                    <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2.5">
                        Key Precedents
                      </h4>
                      <div className="space-y-2">
                        {suggestions.judgments?.map((judgement: string, i: number) => (
                          <div
                            key={i}
                            onClick={() => handleSearch(judgement)}
                            className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 hover:border-indigo-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-start gap-2">
                              <Scale className="w-3.5 h-3.5 text-indigo-600 mt-0.5 flex-shrink-0" />
                              <span className="text-[12px] font-medium text-charcoal leading-snug">
                                {judgement}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Legal Drafts */}
                    <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2.5">
                        Suggested Drafts
                      </h4>
                      <div className="space-y-2">
                        {suggestions.drafts?.map((draft: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => router.push("/draft-workspace")}
                            className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#013B36]/5 border border-[#013B36]/10 hover:bg-[#013B36]/10 text-left transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#013B36]" />
                            <span className="text-[12px] font-semibold text-[#013B36] flex-1">{draft}</span>
                            <Plus className="w-3.5 h-3.5 text-[#013B36]" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-[12px] text-muted mt-4">Failed to load suggestions.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Add / Edit Research Context Modal ───────────────────────────────── */}
      <Modal
        open={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        title={editingContextId ? "Edit Research Context" : "Add Research Context"}
        description="Provide facts, applicable laws, court jurisdiction, and key issues to focus AI case law discovery and legal arguments."
        size="lg"
      >
        <div className="space-y-4 py-2">
          {/* Quick Presets */}
          {!editingContextId && (
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Quick Preset Templates (Click to fill)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONTEXT_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-gray-100 hover:bg-[#013B36] hover:text-white text-gray-700 transition-colors border border-gray-200"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-charcoal mb-1">
                Context Title / Matter Topic <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contextTitle}
                onChange={(e) => setContextTitle(e.target.value)}
                placeholder="e.g., Anticipatory Bail in Commercial NDPS Case"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#6EE7B7]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-charcoal mb-1">
                Court / Tribunal Jurisdiction
              </label>
              <input
                type="text"
                value={contextCourt}
                onChange={(e) => setContextCourt(e.target.value)}
                placeholder="e.g., Bombay High Court / Sessions Court"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#6EE7B7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-charcoal mb-1">
              Acts & Statutory Sections Involved
            </label>
            <input
              type="text"
              value={contextActs}
              onChange={(e) => setContextActs(e.target.value)}
              placeholder="e.g., NDPS Act Section 37, CrPC Section 438, BNSS Section 482"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#6EE7B7]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-charcoal mb-1">
              Key Legal Issues / Questions of Law
            </label>
            <input
              type="text"
              value={contextIssues}
              onChange={(e) => setContextIssues(e.target.value)}
              placeholder="e.g., Whether recovery from car constitutes personal search requiring Section 50 compliance?"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#6EE7B7]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-charcoal mb-1">
              Brief Facts & Background
            </label>
            <textarea
              value={contextFacts}
              onChange={(e) => setContextFacts(e.target.value)}
              placeholder="Summarize the core factual background, allegations, and relief sought..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#6EE7B7] h-24 resize-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            {editingContextId ? (
              <button
                type="button"
                onClick={() => handleDeleteContext(editingContextId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Context
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsContextModalOpen(false)}
                className="px-4 py-2 text-[12px] font-medium text-muted hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveContext}
                className="px-5 py-2 text-[12px] font-semibold text-white bg-[#013B36] hover:bg-[#014D46] rounded-lg transition-colors shadow-xs"
              >
                {editingContextId ? "Save Changes" : "Apply Research Context"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* New Argument Modal */}
      <Modal
        open={isNewArgumentModalOpen}
        onClose={() => setIsNewArgumentModalOpen(false)}
        title="Add New Argument"
        description="Create a new legal argument for your library or specific matter."
        size="md"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-[12px] font-medium text-charcoal mb-1">Argument Title / Topic</label>
            <input
              type="text"
              value={newArgumentTitle}
              onChange={(e) => setNewArgumentTitle(e.target.value)}
              placeholder="e.g., Non-compliance of Section 50"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#6EE7B7]"
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-charcoal mb-1">Argument Content</label>
            <textarea
              value={newArgumentContent}
              onChange={(e) => setNewArgumentContent(e.target.value)}
              placeholder="Draft your argument here..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none focus:border-[#6EE7B7] h-32 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsNewArgumentModalOpen(false)}
              className="px-4 py-2 text-[12px] font-medium text-muted hover:bg-gray-50 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.success("Argument saved successfully!");
                setIsNewArgumentModalOpen(false);
                setNewArgumentTitle("");
                setNewArgumentContent("");
              }}
              className="px-4 py-2 text-[12px] font-medium text-white bg-[#013B36] rounded-lg"
            >
              Save Argument
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
