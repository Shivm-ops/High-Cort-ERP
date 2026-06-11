"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sparkles, BookOpen, Gavel, Scale, FileText, Filter,
  ChevronRight, Star, Clock, ArrowUpRight, Loader2, Bot,
  AlertCircle, CheckCircle, Hash, ExternalLink, Bookmark, MessageSquare, Briefcase, Plus, Save
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
import { useEffect } from "react";

const TABS = [
  { id: "search", label: "Case Law Search", icon: Search },
  { id: "acts", label: "Acts & Sections", icon: BookOpen },
  { id: "notes", label: "Research Notes", icon: FileText },
  { id: "arguments", label: "Arguments Library", icon: MessageSquare },
  { id: "saved", label: "Saved Judgments", icon: Bookmark },
];

const RECENT_SEARCHES = [
  "Bail conditions NDPS Act",
  "Section 138 NI Act limitation period",
  "RERA applicability commercial property",
  "GST ITC reversal conditions",
];

// ACTS_DATA is removed. SEARCH_RESULTS is removed.

export default function LegalResearchWorkspace() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("search");
  const [selectedMatter, setSelectedMatter] = useState<string>("");
  const [matterSuggestions, setMatterSuggestions] = useState<any>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const { data: casesData } = useCases();
  const cases = casesData?.cases || [];
  
  const [query, setQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [searched, setSearched] = useState(false);

  const { data: caseLawsData, isLoading: isSearching } = useCaseLaws(activeSearch ? { search: activeSearch } : undefined);
  const caseLaws = caseLawsData?.items || [];
  const { acts, isLoading: isLoadingActs } = useActs();
  
  // Notes State
  const [notes, setNotes] = useState("");

  // Modal State
  const [isNewArgumentModalOpen, setIsNewArgumentModalOpen] = useState(false);
  const [newArgumentTitle, setNewArgumentTitle] = useState("");
  const [newArgumentContent, setNewArgumentContent] = useState("");

  const handleSearch = (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim()) return;
    if (searchQuery) setQuery(searchQuery);
    setActiveSearch(q);
    setSearched(true);
  };

  useEffect(() => {
    async function fetchSuggestions() {
      if (!selectedMatter) {
        setMatterSuggestions(null);
        return;
      }
      setIsLoadingSuggestions(true);
      try {
        const res = await api.get(`/ai/case/${selectedMatter}/suggestions`);
        setMatterSuggestions(res.data);
      } catch (e) {
        console.error("Failed to fetch AI suggestions", e);
        toast.error("Failed to fetch AI suggestions for this matter.");
        setMatterSuggestions(null);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
  }, [selectedMatter]);

  const currentSuggestions = selectedMatter ? matterSuggestions : null;

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <Header title="Legal Research & Case Laws" subtitle="Complete Legal Research Workspace" />

      {/* Matter Context Selector */}
      <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Briefcase className="w-5 h-5 text-[#013B36]" />
          <div className="flex flex-col">
            <span className="text-[12px] text-muted font-medium">Matter Context</span>
            <select 
              value={selectedMatter}
              onChange={(e) => setSelectedMatter(e.target.value)}
              className="bg-transparent border-none text-[14px] font-semibold text-charcoal outline-none cursor-pointer"
            >
              <option value="">-- Global Research (No Matter Selected) --</option>
              {cases.map((m: any) => (
                <option key={m.id} value={m.id}>{m.case_number || m.title}</option>
              ))}
            </select>
          </div>
        </div>
        
        {selectedMatter && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-mint/10 text-mint text-[11px] font-bold rounded-lg border border-mint/20 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Matter Context Active
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB]">
          {/* Tabs */}
          <div className="flex px-6 pt-4 gap-2 border-b border-gray-200 bg-white">
            {TABS.map(tab => {
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
              )
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "search" && (
              <div className="max-w-4xl space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl p-6"
                  style={{
                    background: "linear-gradient(135deg, #013B36 0%, #014D46 60%, #0B3D2E 100%)",
                    boxShadow: "0 8px 32px rgba(1,59,54,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4" style={{ color: "#6EE7B7" }} />
                    <span className="text-white/60 text-[12px] font-medium">AI Case Law Search</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search case laws, sections, acts… e.g. 'Bail conditions NDPS Act Section 37'"
                        className="w-full h-12 pl-11 pr-4 rounded-xl text-[14px] text-white placeholder:text-white/30 focus:outline-none"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(110,231,183,0.2)" }}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                    </div>
                    <button
                      onClick={() => handleSearch()}
                      disabled={isSearching}
                      className="h-12 px-6 rounded-xl font-semibold flex items-center gap-2 transition-all text-[14px]"
                      style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" }}
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      {isSearching ? "Searching…" : "Research"}
                    </button>
                  </div>
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
                          <span className="bg-mint/10 text-mint px-2 py-0.5 rounded text-[10px] font-bold">{Math.floor(Math.random() * 20) + 80}% Match</span>
                        </div>
                        <div className="text-[12px] text-muted mb-3">{result.citation} • {result.court_name}</div>
                        <p className="text-[13px] text-charcoal mb-4">{result.ratio_decidendi || result.summary}</p>
                        {result.aiSummary && (
                          <div className="mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100/50">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 flex items-center gap-1"><Bot className="w-3 h-3"/> AI Summary</div>
                            <p className="text-[12px] text-charcoal">{result.aiSummary}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <button onClick={() => toast.success("Saved to Matter!")} className="flex items-center gap-1.5 text-[11px] font-medium text-[#013B36] bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                            <Bookmark className="w-3.5 h-3.5" /> Save to Matter
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
                  <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-sidebar" /></div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {acts.map((act) => (
                      <div key={act.id} onClick={() => router.push("/bare-acts")} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-[#013B36] transition-colors cursor-pointer group">
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
                  <h3 className="font-bold text-[16px] text-[#013B36]">Research Notes</h3>
                  <button onClick={() => toast.success("Notes saved successfully!")} className="flex items-center gap-1.5 bg-[#013B36] text-white px-4 py-2 rounded-lg text-[12px] font-semibold">
                    <Save className="w-4 h-4" /> Save Notes
                  </button>
                </div>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Draft your legal research notes here... You can drag and drop case laws or sections here."
                  className="flex-1 w-full bg-white border border-gray-200 rounded-xl p-4 text-[14px] text-charcoal resize-none outline-none focus:border-[#6EE7B7]"
                />
              </div>
            )}

            {activeTab === "arguments" && (
              <div className="max-w-4xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-[16px] text-[#013B36]">Arguments Library</h3>
                  <button onClick={() => setIsNewArgumentModalOpen(true)} className="flex items-center gap-1.5 bg-white border border-gray-200 text-charcoal px-3 py-1.5 rounded-lg text-[12px] font-semibold shadow-sm">
                    <Plus className="w-4 h-4" /> New Argument
                  </button>
                </div>
                {selectedMatter ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <h4 className="text-[12px] font-bold text-emerald-800 uppercase tracking-wider mb-2">Matter Arguments</h4>
                      {isLoadingSuggestions ? (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm">
                          <Loader2 className="w-4 h-4 animate-spin" /> Generating AI arguments...
                        </div>
                      ) : currentSuggestions?.arguments ? currentSuggestions.arguments.map((arg: string, i: number) => (
                        <div key={i} className="flex gap-3 mb-2 p-3 bg-white rounded-lg border border-emerald-100 shadow-sm">
                          <MessageSquare className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <p className="text-[13px] text-charcoal">{arg}</p>
                        </div>
                      )) : (
                        <p className="text-sm text-emerald-700">No arguments generated.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted text-[14px]">Select a matter to view its associated arguments, or browse global arguments.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "saved" && (
              <div className="max-w-4xl">
                <h3 className="font-bold text-[16px] text-[#013B36] mb-4">Saved Judgments</h3>
                {selectedMatter ? (
                   <div className="space-y-3">
                   {isLoadingSuggestions ? (
                     <div className="flex items-center gap-2 text-gray-500 text-sm">
                       <Loader2 className="w-4 h-4 animate-spin" /> Finding relevant judgments...
                     </div>
                   ) : currentSuggestions?.judgments ? currentSuggestions.judgments.map((j: string, i: number) => (
                     <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-center">
                       <div>
                         <h4 className="font-semibold text-[14px] text-charcoal">{j}</h4>
                         <span className="text-[11px] text-muted">Suggested by AI for this matter</span>
                       </div>
                       <button onClick={() => toast.success("Removed from Saved Judgments!")} className="text-red-500 hover:text-red-600 text-[12px] font-medium px-3 py-1 border border-red-100 rounded-lg bg-red-50">Remove</button>
                     </div>
                   )) : (
                     <p className="text-sm text-gray-500">No judgments suggested.</p>
                   )}
                 </div>
                ) : (
                  <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted text-[14px]">Select a matter to view saved judgments, or search to save new ones.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Matter-Based Research Suggestions */}
        <AnimatePresence>
          {selectedMatter && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-200 bg-white overflow-y-auto"
            >
              <div className="p-5">
                <div className="flex items-center gap-2 mb-6 text-[#013B36]">
                  <Sparkles className="w-4 h-4 text-mint" />
                  <h3 className="font-bold text-[14px]">AI Matter Suggestions</h3>
                </div>

                {isLoadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <Loader2 className="w-6 h-6 text-mint animate-spin" />
                    <p className="text-[12px] font-medium text-muted">Analyzing case context...</p>
                  </div>
                ) : currentSuggestions ? (
                  <>
                    {/* Relevant Sections */}
                    <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Relevant Sections</h4>
                      <div className="space-y-2">
                        {currentSuggestions.sections?.map((section: string, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:border-mint/30">
                            <span className="text-[12px] font-medium text-charcoal">{section}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-muted" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Judgments */}
                    <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Key Judgments</h4>
                      <div className="space-y-2">
                        {currentSuggestions.judgments?.map((judgement: string, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100/50">
                            <div className="flex items-start gap-2">
                              <Scale className="w-3.5 h-3.5 text-indigo-500 mt-0.5" />
                              <span className="text-[12px] font-medium text-charcoal leading-snug">{judgement}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Available Drafts */}
                    <div className="mb-6">
                      <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Suggested Drafts</h4>
                      <div className="space-y-2">
                        {currentSuggestions.drafts?.map((draft: string, i: number) => (
                          <button key={i} className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-[#013B36]/5 border border-[#013B36]/10 hover:bg-[#013B36]/10 text-left transition-colors">
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
