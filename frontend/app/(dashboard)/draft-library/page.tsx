"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Search, Plus, Filter, Clock, Globe,
  Download, Trash2, Edit3, Eye, Copy, CheckCircle2,
  AlertCircle, BookOpen, User, Briefcase, FileSignature,
  Printer, ArrowRight, Loader2, Sparkles, Building2
} from "lucide-react";
import Header from "@/components/layout/Header";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import { useMyLetterhead } from "@/lib/hooks/useLetterhead";
import { generateDocx } from "@/lib/exportDocx";
import { 
  useDrafts, 
  useTemplates, 
  useDeleteDraft, 
  useCopyDraft, 
  Draft 
} from "@/lib/hooks/useDrafts";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const LANG_OPTIONS = [
  { code: "all", label: "All Languages", flag: "🌐" },
  { code: "English", label: "English", flag: "🇬🇧" },
  { code: "Marathi", label: "Marathi (मराठी)", flag: "🇮🇳" },
  { code: "Hindi", label: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "Gujarati", label: "Gujarati (ગુજરાતી)", flag: "🇮🇳" },
];

const CATEGORIES = [
  { key: "all", label: "All Categories" },
  { key: "application", label: "Applications" },
  { key: "affidavit", label: "Affidavits" },
  { key: "petition", label: "Petitions" },
  { key: "complaint", label: "Complaints" },
  { key: "reply", label: "Replies" },
  { key: "written_statement", label: "Written Statements" },
  { key: "notice", label: "Notices" },
  { key: "agreement", label: "Agreements" },
  { key: "appeal", label: "Appeals" },
  { key: "vakalatnama", label: "Vakalatnama" },
  { key: "motion", label: "Motions" },
];

export default function DraftLibraryPage() {
  const router = useRouter();

  // Active view: "saved" (My Drafts) or "templates" (Template Library)
  const [activeTab, setActiveTab] = useState<"saved" | "templates">("saved");

  // Filters for Saved Drafts
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Filters for Template Library
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("all");
  const [selectedTemplateCat, setSelectedTemplateCat] = useState<string>("all");

  // Modals & previews
  const [previewDraft, setPreviewDraft] = useState<Draft | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Draft | null>(null);

  const { data: myLetterhead } = useMyLetterhead();

  // Queries & Mutations
  const { data: draftsData, isLoading: isLoadingDrafts } = useDrafts();
  const savedDrafts = draftsData?.drafts || [];

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates(
    selectedTemplateCat !== "all" || selectedLang !== "all"
      ? {
          category: selectedTemplateCat !== "all" ? selectedTemplateCat : undefined,
          language: selectedLang !== "all" ? selectedLang : undefined,
        }
      : undefined
  );
  const masterTemplates = templatesData?.templates || [];

  const deleteDraftMutation = useDeleteDraft();
  const copyDraftMutation = useCopyDraft();

  // Filtered saved drafts
  const filteredDrafts = useMemo(() => {
    return savedDrafts.filter((d) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        (d.client_name && d.client_name.toLowerCase().includes(q)) ||
        (d.case_number && d.case_number.toLowerCase().includes(q)) ||
        (d.case_title && d.case_title.toLowerCase().includes(q));

      const matchStatus =
        statusFilter === "all" || (d.status || "draft") === statusFilter;
      const matchCat =
        categoryFilter === "all" || d.category === categoryFilter;

      return matchSearch && matchStatus && matchCat;
    });
  }, [savedDrafts, search, statusFilter, categoryFilter]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return masterTemplates.filter((t) => {
      const q = templateSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(q)));
      return matchSearch;
    });
  }, [masterTemplates, templateSearch]);

  // Handlers
  const handleDeleteDraft = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDraftMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyDraft = async (draft: Draft) => {
    try {
      const copy = await copyDraftMutation.mutateAsync(draft.id);
      toast.success(`Created duplicate copy: "${copy.title}"`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportDocx = async (draft: Draft) => {
    try {
      toast.info("Generating DOCX file...");
      const blob = await generateDocx(draft.content || "", myLetterhead || null, draft.language || "en");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${draft.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("DOCX Export completed");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate DOCX file");
    }
  };

  return (
    <div className="min-h-screen bg-workspace-bg pb-12 flex flex-col">
      <Header
        title="Templates & Drafts"
        subtitle="Manage saved pleadings, continue drafting, or assemble new documents from verified templates"
      />

      <div className="p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* Navigation & Controls Bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          
          {/* Main Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("saved")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === "saved"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              Saved Drafts
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded-full font-bold">
                {savedDrafts.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                activeTab === "templates"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Template Library
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-full font-bold">
                {masterTemplates.length}
              </span>
            </button>
          </div>

          {/* New Draft Primary Action Button */}
          <button
            onClick={() => router.push("/draft-workspace")}
            className="flex items-center gap-2 px-4 py-2.5 bg-sidebar hover:bg-sidebar-dark text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create New Draft
          </button>
        </div>

        {/* TAB 1: SAVED DRAFTS */}
        {activeTab === "saved" && (
          <div className="flex flex-col gap-5">
            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search drafts by title, client name, case number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-700 font-medium outline-none text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Working Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="finalized">Finalized</option>
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400 font-medium">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-700 font-medium outline-none text-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drafts List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {isLoadingDrafts ? (
                <div className="py-20 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs">Loading saved drafts...</p>
                </div>
              ) : filteredDrafts.length === 0 ? (
                <div className="py-20 text-center px-4 max-w-md mx-auto">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-800 mb-1">
                    {search || statusFilter !== "all" || categoryFilter !== "all"
                      ? "No drafts matching your filter"
                      : "No saved drafts yet"}
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    {search || statusFilter !== "all" || categoryFilter !== "all"
                      ? "Try clearing your search query or reset status filters."
                      : "Start drafting documents with verified templates or blank pleadings linked to clients & matters."}
                  </p>
                  <button
                    onClick={() => router.push("/draft-workspace")}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    Assemble First Draft
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="py-3 px-4">Document Title</th>
                        <th className="py-3 px-4">Client &amp; Matter</th>
                        <th className="py-3 px-4">Category &amp; Lang</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Last Updated</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredDrafts.map((draft) => (
                        <tr 
                          key={draft.id} 
                          className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                          onClick={() => router.push(`/draft-workspace?draftId=${draft.id}`)}
                        >
                          {/* Title */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-[13px]">
                                {draft.title}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                v{draft.version || 1}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {draft.word_count || 0} words
                            </div>
                          </td>

                          {/* Client & Matter */}
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-gray-800 font-medium flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                {draft.client_name || "Unlinked Client"}
                              </span>
                              <span className="text-[11px] text-gray-500 flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                                {draft.case_number || draft.case_title || "No matter linked"}
                              </span>
                            </div>
                          </td>

                          {/* Category & Lang */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 font-semibold capitalize border border-indigo-100">
                                {draft.category?.replace("_", " ") || "Application"}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-600 font-medium">
                                {draft.language || "English"}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[11px] font-bold capitalize",
                              draft.status === "finalized"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : draft.status === "in_review"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-blue-50 text-blue-700 border border-blue-200"
                            )}>
                              {draft.status || "draft"}
                            </span>
                          </td>

                          {/* Last Updated */}
                          <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                            {draft.updated_at ? new Date(draft.updated_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            }) : "Recent"}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              {/* Open / Edit */}
                              <button
                                onClick={() => router.push(`/draft-workspace?draftId=${draft.id}`)}
                                title="Open & Edit Draft"
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Preview */}
                              <button
                                onClick={() => setPreviewDraft(draft)}
                                title="Preview Document"
                                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Save As (Duplicate) */}
                              <button
                                onClick={() => handleCopyDraft(draft)}
                                title="Duplicate / Save As"
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Export DOCX */}
                              <button
                                onClick={() => handleExportDocx(draft)}
                                title="Download DOCX"
                                className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeleteTarget(draft)}
                                title="Delete Draft"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATE LIBRARY */}
        {activeTab === "templates" && (
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 shrink-0 flex flex-col gap-4">
              
              {/* Language Filter */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-3">
                  Language Filter
                </span>
                <div className="flex flex-col gap-1">
                  {LANG_OPTIONS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setSelectedLang(l.code)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors",
                        selectedLang === l.code
                          ? "bg-indigo-600 text-white font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-3">
                  Categories
                </span>
                <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelectedTemplateCat(c.key)}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors",
                        selectedTemplateCat === c.key
                          ? "bg-indigo-50 text-indigo-700 font-bold"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="flex-1 flex flex-col gap-5">
              
              {/* Search */}
              <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates by title or practice area..."
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {isLoadingTemplates ? (
                <div className="py-20 text-center text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                  <p className="text-xs">Loading verified templates...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 p-6">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-gray-800 mb-1">No templates found</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    Try switching language to &quot;All Languages&quot; or selecting a different category.
                  </p>
                  <button
                    onClick={() => { setSelectedLang("all"); setSelectedTemplateCat("all"); }}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Reset all template filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-bold text-gray-900 text-sm">{template.title}</h4>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shrink-0">
                            {template.language}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 font-medium">
                            {template.practice_area || "General"}
                          </span>
                          {template.court_type && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 font-medium">
                              {template.court_type}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <button
                          onClick={() => setPreviewDraft(template)}
                          className="text-xs font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                        <button
                          onClick={() => router.push(`/draft-workspace?templateId=${template.id}`)}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          Use Template <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Preview Modal */}
      {previewDraft && (
        <div className="fixed inset-0 z-50 flex bg-gray-900/70 backdrop-blur-xs items-center justify-center p-6 print:p-0">
          <div className="bg-gray-100 rounded-2xl w-full max-w-[920px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{previewDraft.title}</h3>
                <span className="text-[11px] text-gray-500">
                  {previewDraft.category} • {previewDraft.language}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const id = previewDraft.id;
                    setPreviewDraft(null);
                    router.push(
                      previewDraft.is_template
                        ? `/draft-workspace?templateId=${id}`
                        : `/draft-workspace?draftId=${id}`
                    );
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  {previewDraft.is_template ? "Use Template" : "Open in Workspace"}
                </button>
                <button
                  onClick={() => setPreviewDraft(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              <div className="w-full max-w-[700px] bg-white border border-gray-200 shadow-sm p-10 min-h-[600px] font-serif text-[13px] leading-relaxed text-gray-900 whitespace-pre-wrap">
                {previewDraft.content || "Empty document"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteDraft}
        title="Delete Draft"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={deleteDraftMutation.isPending}
      />
    </div>
  );
}
