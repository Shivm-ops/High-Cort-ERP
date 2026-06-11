"use client";

import React, { useState, useRef } from "react";
import Header from "@/components/layout/Header";
import { useCaseLaws, useCreateCaseLaw } from "@/lib/hooks/useCaseLaws";
import { useUploadDocument } from "@/lib/hooks/useDocuments";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { Scale, Search, Bookmark, BookmarkCheck, FileText, Upload, Plus, Filter, AlertCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function CaseLawsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavorite, setFilterFavorite] = useState<boolean | undefined>(undefined);
  const [selectedCaseLawId, setSelectedCaseLawId] = useState<string | null>(null);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCitation, setNewCitation] = useState("");
  const [newCourt, setNewCourt] = useState("");
  const [newSummary, setNewSummary] = useState("");
  const [newDocumentUrl, setNewDocumentUrl] = useState("");
  
  const createCaseLaw = useCreateCaseLaw();
  const uploadDoc = useUploadDocument();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddCaseLaw = async () => {
    if (!newTitle || !newCitation) {
      toast.error("Title and Citation are required");
      return;
    }
    await createCaseLaw.mutateAsync({
      title: newTitle,
      citation: newCitation,
      court_name: newCourt,
      summary: newSummary,
      document_url: newDocumentUrl,
      keywords: [],
      mapped_sections: [],
      important_paragraphs: [],
      arguments: [],
      is_favorite: false
    });
    setShowAddModal(false);
    setNewTitle("");
    setNewCitation("");
    setNewCourt("");
    setNewSummary("");
    setNewDocumentUrl("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const res = await uploadDoc.mutateAsync({ file, doc_type: "case_law" });
      setNewDocumentUrl(res.file_path || res.id || "");
      setNewTitle(file.name.replace(/\.pdf$/i, ""));
      setShowAddModal(true);
      toast.success("PDF uploaded successfully! Please add case details.");
    } catch (err) {
      console.error(err);
      // useUploadDocument already shows error toast
    }
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { data, isLoading } = useCaseLaws({ 
    search: searchQuery,
    is_favorite: filterFavorite
  });

  const caseLaws = data?.items || [];
  const selectedCaseLaw = caseLaws.find(c => c.id === selectedCaseLawId);

  return (
    <div className="min-h-screen bg-workspace-bg pb-12 flex flex-col">
      <Header title="Case Law Management" subtitle="Centralized judgment, citation, and legal research repository" />
      
      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col xl:flex-row gap-6">
        
        {/* Left List Pane */}
        <div className="w-full xl:w-[450px] flex flex-col h-[calc(100vh-140px)]">
          <div className="bg-white p-4 rounded-t-2xl border border-gray-200 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by citation, case name, keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                />
              </div>
              <button className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setFilterFavorite(undefined)}
                className={cn("px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors", filterFavorite === undefined ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              >
                All Judgments
              </button>
              <button 
                onClick={() => setFilterFavorite(true)}
                className={cn("px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center gap-1.5", filterFavorite === true ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}
              >
                <Bookmark className="w-3.5 h-3.5" /> Favorites
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-white border-x border-b border-gray-200 shadow-sm rounded-b-2xl overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500 text-sm">Loading judgments...</div>
            ) : caseLaws.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Scale className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                No case laws found.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {caseLaws.map((cl) => (
                  <button 
                    key={cl.id} 
                    onClick={() => setSelectedCaseLawId(cl.id)}
                    className={cn(
                      "text-left p-4 rounded-xl border transition-all", 
                      selectedCaseLawId === cl.id 
                        ? "border-indigo-500 bg-indigo-50/30 shadow-sm ring-1 ring-indigo-500" 
                        : "border-transparent hover:bg-gray-50 hover:border-gray-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-gray-800 text-[15px] leading-tight line-clamp-2 pr-4">{cl.title}</span>
                      {cl.is_favorite ? <BookmarkCheck className="w-4 h-4 text-amber-500 shrink-0" /> : <Bookmark className="w-4 h-4 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100" />}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{cl.citation || "Unreported"}</span>
                      {cl.judgment_date && <span className="text-[12px] text-gray-500">{format(new Date(cl.judgment_date), 'MMM yyyy')}</span>}
                    </div>
                    <div className="text-[12px] text-gray-500 line-clamp-1 mb-2">{cl.court_name}</div>
                    
                    {cl.mapped_sections && cl.mapped_sections.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cl.mapped_sections.slice(0, 3).map((sec, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100">{sec}</span>
                        ))}
                        {cl.mapped_sections.length > 3 && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium border border-gray-200">+{cl.mapped_sections.length - 3}</span>}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Detail Pane */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm h-[calc(100vh-140px)] flex flex-col overflow-hidden relative">
          
          {/* Toolbar */}
          <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
            <h2 className="font-semibold text-gray-800">Judgment Viewer</h2>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                accept="application/pdf" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload} 
              />
              <button 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploadDoc.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-70"
              >
                <Upload className="w-4 h-4" /> {uploadDoc.isPending ? "Uploading..." : "Upload PDF"}
              </button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" /> Add Case Law
              </button>
            </div>
          </div>

          {selectedCaseLaw ? (
            <div className="flex-1 overflow-y-auto p-8 flex flex-col gap-8">
              
              {/* Header */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 leading-snug">{selectedCaseLaw.title}</h1>
                  <button className={cn("p-2 rounded-lg border transition-colors shrink-0", selectedCaseLaw.is_favorite ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-white border-gray-200 text-gray-400 hover:text-gray-600")}>
                    {selectedCaseLaw.is_favorite ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-4 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Citation:</span>
                    <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">{selectedCaseLaw.citation || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Court:</span>
                    <span className="font-medium text-gray-900">{selectedCaseLaw.court_name}</span>
                  </div>
                  {selectedCaseLaw.judge_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Judge:</span>
                      <span className="font-medium text-gray-900">{selectedCaseLaw.judge_name}</span>
                    </div>
                  )}
                  {selectedCaseLaw.judgment_date && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium text-gray-900">{format(new Date(selectedCaseLaw.judgment_date), 'dd MMM yyyy')}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedCaseLaw.practice_area && <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[12px] font-semibold">{selectedCaseLaw.practice_area}</span>}
                  {selectedCaseLaw.keywords?.map((kw, i) => (
                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[12px] font-medium">{kw}</span>
                  ))}
                </div>
              </div>

              {/* Sections & Matter Linking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-[13px] font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Scale className="w-4 h-4" /> Mapped Sections
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedCaseLaw.mapped_sections?.length > 0 ? selectedCaseLaw.mapped_sections.map((sec, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white text-blue-700 rounded-lg text-[13px] font-medium border border-blue-200 shadow-sm">{sec}</span>
                    )) : <span className="text-sm text-gray-500">No sections mapped.</span>}
                  </div>
                </div>

                <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100">
                  <h3 className="text-[13px] font-bold text-emerald-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Linked Matter Context
                  </h3>
                  {selectedCaseLaw.case_id ? (
                    <div className="bg-white p-3 rounded-lg border border-emerald-200 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600 mb-0.5">ACTIVE MATTER</div>
                        <div className="text-[14px] font-medium text-gray-900">State vs Sharma (BNS 316)</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Not linked to a specific matter. <button className="text-emerald-600 font-medium hover:underline">Link to matter</button></div>
                  )}
                </div>
              </div>

              {/* Research Notes & Summaries */}
              <div className="space-y-6">
                
                {selectedCaseLaw.summary && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Summary</h3>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-gray-800 text-[15px] leading-relaxed">
                      {selectedCaseLaw.summary}
                    </div>
                  </div>
                )}

                {selectedCaseLaw.ratio_decidendi && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Ratio Decidendi</h3>
                    <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200 text-gray-900 text-[15px] leading-relaxed font-medium">
                      {selectedCaseLaw.ratio_decidendi}
                    </div>
                  </div>
                )}

                {selectedCaseLaw.key_findings && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Key Findings</h3>
                    <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                      {selectedCaseLaw.key_findings}
                    </div>
                  </div>
                )}

                {selectedCaseLaw.personal_notes && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">Personal Research Notes</h3>
                    <div className="bg-[#fffdf0] p-5 rounded-xl border border-amber-100 text-gray-800 text-[15px] leading-relaxed">
                      {selectedCaseLaw.personal_notes}
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50">
              <Scale className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Case Law</h3>
              <p className="text-gray-500 max-w-md">Search your repository or select a judgment from the list to view its full text, mapped sections, and personal notes.</p>
            </div>
          )}

        </div>

      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Case Law" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Case Title / Parties *</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. State of Maharashtra vs XYZ" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Citation *</label>
            <input value={newCitation} onChange={e => setNewCitation(e.target.value)} placeholder="e.g. 2024 SCC 123" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Court Name</label>
            <input value={newCourt} onChange={e => setNewCourt(e.target.value)} placeholder="e.g. Supreme Court of India" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Summary</label>
            <textarea value={newSummary} onChange={e => setNewSummary(e.target.value)} placeholder="Brief summary of the judgment..." rows={4} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowAddModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={handleAddCaseLaw} disabled={createCaseLaw.isPending || !newTitle || !newCitation} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {createCaseLaw.isPending ? "Saving..." : "Save Case Law"}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
