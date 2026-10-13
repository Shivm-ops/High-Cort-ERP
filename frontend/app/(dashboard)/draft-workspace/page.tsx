"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, User, Briefcase, FileCheck, 
  ChevronRight, Save, Download, Gavel, FileSignature, BookOpen, AlertCircle,
  Plus, Edit3, Copy, Trash2, Printer, ArrowLeft, Check, Clock, Globe,
  FolderOpen, Shield, HelpCircle, RefreshCw, Eye
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import { 
  useTemplates, useAutoFill, useDrafts, useDraft, 
  useCreateDraft, useUpdateDraft, useDuplicateDraft, useDeleteDraft, Draft 
} from "@/lib/hooks/useDrafts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useMyLetterhead } from "@/lib/hooks/useLetterhead";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { generateDocx } from "@/lib/exportDocx";
import { useLanguageStore } from "@/lib/store/languageStore";

const DRAFT_CATEGORIES = [
  { key: "Applications", label: "Applications", desc: "Interlocutory, bail & interim applications" },
  { key: "Affidavits", label: "Affidavits", desc: "Sworn statements, verification & evidence" },
  { key: "Petitions", label: "Petitions", desc: "Writ, civil & criminal petitions" },
  { key: "Vakalatnama", label: "Vakalatnama", desc: "Memos of appearance & authorization" },
  { key: "Notices", label: "Notices", desc: "Legal demand, NI Act & reply notices" },
  { key: "Replies", label: "Replies", desc: "Rejoinders, responses & rejoinder affidavits" },
  { key: "Written Statements", label: "Written Statements", desc: "Defense statements & counter-claims" },
  { key: "Agreements", label: "Agreements & Contracts", desc: "Deeds, MoUs, lease & commercial agreements" },
  { key: "Appeals", label: "Appeals & Revisions", desc: "High Court & appellate court appeals" },
  { key: "Complaints", label: "Complaints", desc: "Police, magistrate, consumer & RERA complaints" },
  { key: "Other", label: "Other Formats", desc: "List of dates, synopsis & general pleadings" }
];

const LANGUAGES = [
  { id: "English", label: "English", code: "en" },
  { id: "Hindi", label: "हिन्दी (Hindi)", code: "hi" },
  { id: "Marathi", label: "मराठी (Marathi)", code: "mr" },
  { id: "Gujarati", label: "ગુજરાતી (Gujarati)", code: "gu" }
];

export default function DraftWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading workspace...</div>}>
      <DraftWorkspaceContent />
    </Suspense>
  );
}

function DraftWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlDraftId = searchParams.get("draftId");
  const urlTemplateId = searchParams.get("templateId");
  const urlClientId = searchParams.get("clientId");
  const urlCaseId = searchParams.get("caseId");

  // Mode: "drafts_list" | "wizard" | "editor"
  const [activeMode, setActiveMode] = useState<"drafts_list" | "wizard" | "editor">(
    urlDraftId ? "editor" : urlTemplateId || urlCaseId || urlClientId ? "wizard" : "drafts_list"
  );

  // Wizard state (steps 1 to 4)
  const [step, setStep] = useState<number>(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedMatter, setSelectedMatter] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Applications");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Editor state
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(urlDraftId || null);
  const [draftTitle, setDraftTitle] = useState<string>("Untitled Draft");
  const [editorContent, setEditorContent] = useState<string>("");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Saved Drafts List Filters
  const [savedDraftsSearch, setSavedDraftsSearch] = useState<string>("");
  const [savedDraftsCategory, setSavedDraftsCategory] = useState<string>("all");

  // Modals & previews
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateTargetDraft, setDuplicateTargetDraft] = useState<Draft | null>(null);
  const [duplicateTitleInput, setDuplicateTitleInput] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Search queries in wizard
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");

  const { data: myLetterhead } = useMyLetterhead();
  const { documentLanguage } = useLanguageStore();

  // API hooks
  const { data: clientsData, isLoading: isLoadingClients } = useClients();
  const clients = clientsData?.clients || [];

  const { data: casesData } = useCases(selectedClient ? { client_id: selectedClient.id } : undefined);
  const cases = casesData?.cases || [];

  const { data: savedDraftsData, isLoading: isLoadingDrafts, refetch: refetchDrafts } = useDrafts();
  const savedDrafts = savedDraftsData?.drafts || [];

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({
    category: selectedCategory,
    language: selectedLanguage,
    search: templateSearchQuery || undefined
  });
  const templates = templatesData?.templates || [];

  // Detail query for active draft if editing by ID
  const { data: draftDetailData } = useDraft(currentDraftId || "");

  const { mutate: autoFill, isPending: isAutofilling } = useAutoFill();
  const { mutate: createDraft, isPending: isCreating } = useCreateDraft();
  const { mutate: updateDraft, isPending: isUpdating } = useUpdateDraft();
  const { mutate: duplicateDraft, isPending: isDuplicating } = useDuplicateDraft();
  const { mutate: deleteDraft, isPending: isDeleting } = useDeleteDraft();

  // Load draft into editor when draftDetailData arrives
  useEffect(() => {
    if (draftDetailData && currentDraftId === draftDetailData.id) {
      setDraftTitle(draftDetailData.title);
      setEditorContent(draftDetailData.content);
      setCurrentVersion(draftDetailData.version || 1);
      setSelectedCategory(draftDetailData.category || "Applications");
      setSelectedLanguage(draftDetailData.language || "English");
      if (draftDetailData.client_id) {
        setSelectedClient({ id: draftDetailData.client_id, name: draftDetailData.client_name });
      }
      if (draftDetailData.case_id) {
        setSelectedMatter({ id: draftDetailData.case_id, case_no: draftDetailData.case_no, title: draftDetailData.case_title });
      }
      setIsDirty(false);
      setLastSavedTime(new Date(draftDetailData.updated_at));
    }
  }, [draftDetailData, currentDraftId]);

  // Handle URL params for client & case preselection
  useEffect(() => {
    if (urlClientId && clients.length > 0 && !selectedClient) {
      const match = clients.find((c: any) => c.id === urlClientId);
      if (match) {
        setSelectedClient(match);
        setStep(2);
      }
    }
  }, [urlClientId, clients]);

  // Filter clients for step 1
  const filteredClients = useMemo(() => {
    return clients.filter((c: any) =>
      c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
      (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearchQuery.replace(/[^0-9]/g, "")))
    );
  }, [clients, clientSearchQuery]);

  // Filter saved drafts for tab 1
  const filteredSavedDrafts = useMemo(() => {
    return savedDrafts.filter((d: Draft) => {
      const matchesSearch =
        !savedDraftsSearch ||
        d.title.toLowerCase().includes(savedDraftsSearch.toLowerCase()) ||
        (d.client_name && d.client_name.toLowerCase().includes(savedDraftsSearch.toLowerCase())) ||
        (d.case_no && d.case_no.toLowerCase().includes(savedDraftsSearch.toLowerCase()));
      const matchesCategory =
        savedDraftsCategory === "all" ||
        d.category.toLowerCase() === savedDraftsCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [savedDrafts, savedDraftsSearch, savedDraftsCategory]);

  // Handle template selection and autofill
  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    const templateContent = template.content || `BEFORE THE HON'BLE COURT\n\nCase No: {{case_number}}\n\n{{client_name}} ... Petitioner\nVs\n{{opponent_name}} ... Respondent\n\n1. That the applicant submits this ${template.title} in the interests of justice.`;

    autoFill({
      template_content: templateContent,
      client_id: selectedClient?.id,
      case_id: selectedMatter?.id
    }, {
      onSuccess: (res) => {
        setCurrentDraftId(null); // It's a new draft until saved
        setDraftTitle(`${template.title} - ${selectedClient?.name || "General"}`);
        setEditorContent(res.filled_content);
        setCurrentVersion(1);
        setIsDirty(true);
        setActiveMode("editor");
      },
      onError: () => {
        // Fallback: simple merge
        let filled = templateContent
          .replace(/{{client_name}}/g, selectedClient?.name || "[Client Name]")
          .replace(/{{case_number}}/g, selectedMatter?.case_no || "UNFILED")
          .replace(/{{opponent_name}}/g, "Respondent / State");
        setCurrentDraftId(null);
        setDraftTitle(`${template.title} - ${selectedClient?.name || "General"}`);
        setEditorContent(filled);
        setCurrentVersion(1);
        setIsDirty(true);
        setActiveMode("editor");
      }
    });
  };

  // Start with blank document
  const handleStartBlank = () => {
    setCurrentDraftId(null);
    setDraftTitle(`Blank ${selectedCategory} - ${selectedClient?.name || "General"}`);
    setEditorContent(
      `IN THE COURT OF ____________________\n\nCASE NO. ${selectedMatter?.case_no || "____ / 2026"}\n\nIN THE MATTER OF:\n${selectedClient?.name || "[PETITIONER / APPLICANT]"}\t\t...PETITIONER\n\nVERSUS\n\n[RESPONDENT / OPPONENT]\t\t...RESPONDENT\n\n` +
      `------------------------------------------------------------\n` +
      `${selectedCategory.toUpperCase()}\n` +
      `------------------------------------------------------------\n\n` +
      `MOST RESPECTFULLY SHOWETH:\n\n1. That the applicant respectfully submits...\n\n\nPRAYER:\nWherefore it is prayed that this Hon'ble Court may graciously be pleased to...\n\n`
    );
    setCurrentVersion(1);
    setIsDirty(true);
    setActiveMode("editor");
  };

  // Open an existing draft from the list
  const handleOpenDraft = (draft: Draft) => {
    setCurrentDraftId(draft.id);
    setDraftTitle(draft.title);
    setEditorContent(draft.content);
    setCurrentVersion(draft.version || 1);
    setSelectedCategory(draft.category || "Applications");
    setSelectedLanguage(draft.language || "English");
    if (draft.client_id) {
      setSelectedClient({ id: draft.client_id, name: draft.client_name });
    } else {
      setSelectedClient(null);
    }
    if (draft.case_id) {
      setSelectedMatter({ id: draft.case_id, case_no: draft.case_no, title: draft.case_title });
    } else {
      setSelectedMatter(null);
    }
    setIsDirty(false);
    setLastSavedTime(new Date(draft.updated_at));
    setActiveMode("editor");
  };

  // Save draft
  const handleSaveDraft = () => {
    if (!draftTitle.trim()) {
      toast.error("Please enter a title for this draft");
      return;
    }

    if (currentDraftId) {
      // Update existing draft
      updateDraft({
        id: currentDraftId,
        title: draftTitle,
        content: editorContent,
        category: selectedCategory,
        language: selectedLanguage,
        client_id: selectedClient?.id || undefined,
        case_id: selectedMatter?.id || undefined
      }, {
        onSuccess: (saved) => {
          setCurrentVersion(saved.version);
          setIsDirty(false);
          setLastSavedTime(new Date());
          refetchDrafts();
        }
      });
    } else {
      // Create new draft
      createDraft({
        title: draftTitle,
        content: editorContent,
        category: selectedCategory,
        language: selectedLanguage,
        client_id: selectedClient?.id || undefined,
        case_id: selectedMatter?.id || undefined,
        is_template: false
      }, {
        onSuccess: (created) => {
          setCurrentDraftId(created.id);
          setCurrentVersion(created.version);
          setIsDirty(false);
          setLastSavedTime(new Date());
          refetchDrafts();
        }
      });
    }
  };

  // Open Save As / Duplicate Modal
  const handlePromptDuplicate = (draft?: Draft) => {
    const target = draft || (currentDraftId ? { id: currentDraftId, title: draftTitle } as Draft : null);
    if (!target) {
      toast.error("Please save the draft first before creating a copy.");
      return;
    }
    setDuplicateTargetDraft(target);
    setDuplicateTitleInput(`Copy of ${target.title}`);
    setDuplicateModalOpen(true);
  };

  const handleConfirmDuplicate = () => {
    if (!duplicateTargetDraft) return;
    duplicateDraft({
      id: duplicateTargetDraft.id,
      title: duplicateTitleInput.trim() || undefined
    }, {
      onSuccess: (newDraft) => {
        setDuplicateModalOpen(false);
        setDuplicateTargetDraft(null);
        refetchDrafts();
        // If we duplicated from within the editor, switch to editing the new duplicate
        if (activeMode === "editor") {
          handleOpenDraft(newDraft);
        }
      }
    });
  };

  // Delete draft
  const handlePromptDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    deleteDraft(deleteTargetId, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        setDeleteTargetId(null);
        if (currentDraftId === deleteTargetId) {
          setCurrentDraftId(null);
          setActiveMode("drafts_list");
        }
        refetchDrafts();
      }
    });
  };

  // Exports
  const handleExportText = () => {
    const blob = new Blob([editorContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draftTitle.replace(/[^a-z0-9_-]/gi, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Draft exported as text");
  };

  const handleExportDocx = async (contentToExport = editorContent, titleToExport = draftTitle) => {
    try {
      toast.info("Generating DOCX with letterhead...");
      const blob = await generateDocx(contentToExport, myLetterhead || null, documentLanguage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${titleToExport.replace(/[^a-z0-9_-]/gi, "_")}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("DOCX Export completed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate DOCX file");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Word count & stats
  const wordCount = useMemo(() => {
    return editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0;
  }, [editorContent]);

  const charCount = editorContent.length;

  return (
    <div className="min-h-screen bg-workspace-bg pb-12 flex flex-col">
      <div className={cn("flex flex-col flex-1", showPrintPreview && "print:hidden")}>
        <Header 
          title="Draft Workspace" 
          subtitle="Matter-based document assembly, centralized saved drafts, and professional template library" 
        />
        
        <div className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
          
          {/* Top Mode Selector Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeMode === "editor" && isDirty) {
                    if (!confirm("You have unsaved changes in your document. Switch to Saved Drafts anyway?")) return;
                  }
                  setActiveMode("drafts_list");
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeMode === "drafts_list"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <FolderOpen className="w-4 h-4" />
                Saved Drafts
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  activeMode === "drafts_list" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}>
                  {savedDrafts.length}
                </span>
              </button>

              <button
                onClick={() => {
                  if (activeMode === "editor" && isDirty) {
                    if (!confirm("You have unsaved changes in your document. Switch to New Draft Wizard anyway?")) return;
                  }
                  setActiveMode("wizard");
                  setStep(1);
                }}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeMode === "wizard"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Plus className="w-4 h-4" />
                Assemble New Draft
              </button>

              {activeMode === "editor" && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Edit3 className="w-4 h-4 text-emerald-600" />
                  <span>Document Editor</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold">
                    v{currentVersion}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                Autofill &amp; Letterhead Ready
              </span>
            </div>
          </div>

          {/* MODE 1: SAVED DRAFTS LIST */}
          {activeMode === "drafts_list" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
              
              {/* Header & Search */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search title, client, or case number..."
                      value={savedDraftsSearch}
                      onChange={(e) => setSavedDraftsSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={savedDraftsCategory}
                    onChange={(e) => setSavedDraftsCategory(e.target.value)}
                    className="w-full sm:w-48 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    <option value="all">All Categories</option>
                    {DRAFT_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key.toLowerCase()}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setActiveMode("wizard");
                    setStep(1);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create New Draft
                </button>
              </div>

              {/* Drafts List / Table */}
              {isLoadingDrafts ? (
                <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span>Loading saved drafts...</span>
                </div>
              ) : filteredSavedDrafts.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">
                    {savedDraftsSearch || savedDraftsCategory !== "all" ? "No matching drafts found" : "No saved drafts yet"}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mb-6">
                    {savedDraftsSearch || savedDraftsCategory !== "all"
                      ? "Try refining your search terms or filter criteria."
                      : "Start assembling legal pleadings, affidavits, notices, and applications with automatic client merge."}
                  </p>
                  <button
                    onClick={() => {
                      setActiveMode("wizard");
                      setStep(1);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Start First Draft
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-medium text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">Draft Title</th>
                        <th className="px-4 py-3.5">Client &amp; Matter</th>
                        <th className="px-4 py-3.5">Category &amp; Lang</th>
                        <th className="px-3 py-3.5 text-center">Version</th>
                        <th className="px-4 py-3.5">Last Updated</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSavedDrafts.map((draft: Draft) => (
                        <tr 
                          key={draft.id} 
                          className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                          onClick={() => handleOpenDraft(draft)}
                        >
                          <td className="px-5 py-4">
                            <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>{draft.title}</span>
                            </div>
                            {draft.tags && draft.tags.length > 0 && (
                              <div className="flex gap-1.5 mt-1">
                                {draft.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-gray-900 font-medium">
                              {draft.client_name ? draft.client_name : (
                                <span className="text-gray-400 italic">No Client (General)</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {draft.case_no ? (
                                <span className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  {draft.case_no}
                                </span>
                              ) : (
                                <span className="text-gray-400">Unlinked matter</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                              {draft.category}
                            </span>
                            <div className="text-xs text-gray-400 mt-1 capitalize">
                              {draft.language}
                            </div>
                          </td>
                          <td className="px-3 py-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded font-mono text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              v{draft.version || 1}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-gray-500 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {new Date(draft.updated_at).toLocaleDateString()}
                            </div>
                            <div className="text-[11px] text-gray-400">
                              {new Date(draft.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenDraft(draft)}
                                title="Edit Draft"
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePromptDuplicate(draft)}
                                title="Duplicate / Save As"
                                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleExportDocx(draft.content, draft.title)}
                                title="Download DOCX"
                                className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDraftTitle(draft.title);
                                  setEditorContent(draft.content);
                                  setShowPrintPreview(true);
                                }}
                                title="Print / PDF Preview"
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handlePromptDelete(draft.id)}
                                title="Delete Draft"
                                className="p-2 text-gray-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm"
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
          )}

          {/* MODE 2: WIZARD */}
          {activeMode === "wizard" && (
            <div className="flex flex-col gap-6">
              
              {/* Stepper Header */}
              <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-wrap items-center gap-2 md:gap-4 text-[13px] font-medium text-gray-500">
                <div className={cn("flex items-center gap-1.5 cursor-pointer", step >= 1 ? "text-indigo-600 font-bold" : "")} onClick={() => setStep(1)}>
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 1 ? "bg-indigo-600" : "bg-gray-300")}>1</span>
                  Client
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className={cn("flex items-center gap-1.5 cursor-pointer", step >= 2 ? "text-indigo-600 font-bold" : "")} onClick={() => selectedClient && setStep(2)}>
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 2 ? "bg-indigo-600" : "bg-gray-300")}>2</span>
                  Matter
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className={cn("flex items-center gap-1.5 cursor-pointer", step >= 3 ? "text-indigo-600 font-bold" : "")} onClick={() => setStep(3)}>
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 3 ? "bg-indigo-600" : "bg-gray-300")}>3</span>
                  Category
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className={cn("flex items-center gap-1.5 cursor-pointer", step >= 4 ? "text-indigo-600 font-bold" : "")} onClick={() => setStep(4)}>
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 4 ? "bg-indigo-600" : "bg-gray-300")}>4</span>
                  Template
                </div>

                <div className="ml-auto flex items-center gap-3">
                  <button
                    onClick={() => setActiveMode("drafts_list")}
                    className="text-xs text-gray-500 hover:text-gray-900 underline"
                  >
                    Cancel to Saved Drafts
                  </button>
                </div>
              </div>

              {/* Wizard Body & Sidebar */}
              <div className="flex flex-col xl:flex-row gap-6">
                
                {/* Wizard Steps */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                  
                  {/* Step 1: Select Client */}
                  {step === 1 && (
                    <div className="p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <User className="w-6 h-6 text-indigo-600"/> Select Client
                          </h2>
                          <p className="text-xs text-gray-500 mt-1">
                            Choose an existing client for autofill, or proceed with a general draft without client linkage.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedClient(null);
                              setSelectedMatter(null);
                              setStep(3); // Jump directly to Category selection
                            }}
                            className="px-4 py-2 border border-dashed border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl text-xs font-semibold transition-colors"
                          >
                            Draft without Client (General) →
                          </button>
                          <div className="relative w-full md:w-64">
                            <input
                              type="text"
                              placeholder="Search client name or phone..."
                              value={clientSearchQuery}
                              onChange={(e) => setClientSearchQuery(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredClients.length === 0 ? (
                          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                            <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">No matching clients found</h3>
                            <p className="text-sm text-gray-500 mb-4">You can draft without client, or add a client in CRM.</p>
                            <div className="flex items-center justify-center gap-3">
                              <button 
                                onClick={() => { setSelectedClient(null); setStep(3); }} 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                              >
                                Draft without Client
                              </button>
                              <button 
                                onClick={() => router.push('/clients')} 
                                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                              >
                                Add Client in CRM
                              </button>
                            </div>
                          </div>
                        ) : (
                          filteredClients.map((c: any) => (
                            <button 
                              key={c.id} 
                              onClick={() => { setSelectedClient(c); setStep(2); }} 
                              className={cn(
                                "text-left p-4 rounded-xl border transition-all flex flex-col justify-between",
                                selectedClient?.id === c.id 
                                  ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20" 
                                  : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20"
                              )}
                            >
                              <div className="font-semibold text-gray-900 flex items-center justify-between">
                                <span>{c.name}</span>
                                {selectedClient?.id === c.id && <Check className="w-4 h-4 text-indigo-600" />}
                              </div>
                              <div className="text-[12px] text-gray-500 mt-2">
                                {c.phone || "No phone"} {c.city ? `• ${c.city}` : ""}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Select Matter */}
                  {step === 2 && (
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to Client
                          </button>
                          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-indigo-600"/> Select Matter
                          </h2>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMatter(null);
                            setStep(3);
                          }}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Proceed without Matter (Unlinked Draft) →
                        </button>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 flex items-center justify-between">
                        <span>Client: <strong>{selectedClient?.name}</strong></span>
                        <button onClick={() => setStep(1)} className="text-indigo-600 hover:underline">Change client</button>
                      </div>

                      {cases.length === 0 ? (
                        <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-2xl">
                          <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-gray-800 mb-1">
                            No matters found for this client
                          </h3>
                          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                            You can smoothly proceed with an unlinked pre-litigation draft now, or create a new matter in Case Management.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            <button 
                              onClick={() => {
                                setSelectedMatter(null);
                                setStep(3);
                              }} 
                              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                            >
                              Proceed without Matter (Unlinked Draft) →
                            </button>
                            <button 
                              onClick={() => router.push(`/cases`)} 
                              className="px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                              Create New Matter in CRM
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cases.map((c: any) => (
                            <button 
                              key={c.id} 
                              onClick={() => { 
                                setSelectedMatter(c); 
                                setStep(3); 
                              }} 
                              className={cn(
                                "text-left p-4 rounded-xl border transition-all",
                                selectedMatter?.id === c.id 
                                  ? "border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20" 
                                  : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20"
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                  {c.case_no || "Unfiled"}
                                </span>
                                <span className="text-[11px] text-gray-500">{c.court || "Any Court"}</span>
                              </div>
                              <div className="font-semibold text-gray-900">{c.title}</div>
                              <div className="text-[12px] text-gray-500 mt-1">{c.practice_area || "General"}</div>
                            </button>
                          ))}

                          <button 
                            onClick={() => { 
                              setSelectedMatter(null); 
                              setStep(3); 
                            }} 
                            className="text-left p-4 rounded-xl border border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/30 transition-colors flex flex-col items-center justify-center text-center p-6"
                          >
                            <span className="font-semibold text-indigo-700 text-sm">Proceed without specific matter</span>
                            <span className="text-xs text-gray-400 mt-1">For general consultation, agreements, or pre-litigation notices</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 3: Select Category */}
                  {step === 3 && (
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <button onClick={() => setStep(selectedClient ? 2 : 1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                          <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <FileSignature className="w-6 h-6 text-indigo-600"/> Select Draft Category
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DRAFT_CATEGORIES.map((cat) => (
                          <button 
                            key={cat.key} 
                            onClick={() => { 
                              setSelectedCategory(cat.key); 
                              setStep(4); 
                            }} 
                            className={cn(
                              "p-5 rounded-2xl border text-left transition-all flex flex-col justify-between group",
                              selectedCategory === cat.key
                                ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20"
                                : "border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/20"
                            )}
                          >
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-indigo-600 text-base mb-1">
                                {cat.label}
                              </div>
                              <div className="text-xs text-gray-500 leading-relaxed">
                                {cat.desc}
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between text-xs font-semibold text-indigo-600">
                              <span>Select Category</span>
                              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Select Template & Language */}
                  {step === 4 && (
                    <div className="p-8 flex flex-col h-full">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-4">
                          <button onClick={() => setStep(3)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back
                          </button>
                          <div>
                            <h2 className="text-xl font-bold text-gray-800">
                              Select {selectedCategory} Template
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Filter by language or search by name. Master templates load automatically.
                            </p>
                          </div>
                        </div>

                        {/* Language Selector Pills */}
                        <div className="flex flex-wrap items-center gap-2">
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang.id}
                              onClick={() => setSelectedLanguage(lang.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                                selectedLanguage === lang.id
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                              )}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Search Bar & Actions */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full sm:w-80">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder="Search templates or clauses..." 
                            value={templateSearchQuery}
                            onChange={(e) => setTemplateSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          />
                        </div>

                        <button 
                          onClick={handleStartBlank} 
                          className="w-full sm:w-auto px-4 py-2 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5" /> Start with Blank {selectedCategory} Document
                        </button>
                      </div>

                      {/* Template Grid */}
                      {isLoadingTemplates ? (
                        <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                          <span>Loading templates for {selectedCategory} in {selectedLanguage}...</span>
                        </div>
                      ) : templates.length === 0 ? (
                        <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl">
                          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-base font-semibold text-gray-800 mb-1">
                            No templates found for {selectedCategory} in {selectedLanguage}
                          </h3>
                          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                            You can switch to English or start immediately with a standard structured blank format.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              onClick={() => setSelectedLanguage("English")}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
                            >
                              Switch to English Templates
                            </button>
                            <button 
                              onClick={handleStartBlank} 
                              className="px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                            >
                              Start with Blank Document
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {templates.map((t: Draft) => (
                            <div 
                              key={t.id} 
                              className="p-5 rounded-2xl border border-gray-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/10 transition-all flex flex-col justify-between"
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <h4 className="font-bold text-gray-900 text-base">{t.title}</h4>
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {t.language || selectedLanguage}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                                  {t.content ? t.content.slice(0, 140) + "..." : "Standard court filing template."}
                                </div>
                                {t.tags && t.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-4">
                                    {t.tags.map((tag) => (
                                      <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                <span className="text-[11px] text-gray-400">
                                  Practice: {t.practice_area || "General Litigation"}
                                </span>
                                <button 
                                  onClick={() => handleSelectTemplate(t)} 
                                  disabled={isAutofilling}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isAutofilling ? "Merging..." : "Use Template"}
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                </div>

                {/* Right Context Summary Drawer */}
                <div className="w-full xl:w-80 flex flex-col gap-5">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Current Assembly Context
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5 text-xs text-gray-700">
                        <User className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Client</div>
                          <div className="font-semibold text-gray-900">{selectedClient?.name || "None (General Draft)"}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 text-xs text-gray-700">
                        <Briefcase className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Matter</div>
                          <div className="font-semibold text-gray-900">{selectedMatter?.case_no || "Unfiled / Pre-litigation"}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 text-xs text-gray-700">
                        <FileSignature className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Category</div>
                          <div className="font-semibold text-gray-900">{selectedCategory}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 text-xs text-gray-700">
                        <Globe className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-[10px] text-gray-400 font-semibold uppercase">Language</div>
                          <div className="font-semibold text-gray-900">{selectedLanguage}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Required Documents / Checklist */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <h3 className="text-xs font-bold text-gray-800 flex items-center gap-2 mb-3">
                      <FileCheck className="w-4 h-4 text-emerald-600" /> Required Verification
                    </h3>
                    <div className="space-y-2 text-xs text-gray-700">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" defaultChecked />
                        Aadhaar / ID Verification
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" defaultChecked />
                        Vakalatnama Execution
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                        Court Fee / Stamp Verification
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                        Opponent Notice / Acknowledgment
                      </label>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* MODE 3: DOCUMENT EDITOR */}
          {activeMode === "editor" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
              
              {/* Editor Top Bar */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-4 border-b border-gray-200 gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (isDirty) {
                        if (!confirm("You have unsaved changes. Exit to Saved Drafts?")) return;
                      }
                      setActiveMode("drafts_list");
                    }}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
                    title="Back to Saved Drafts"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => {
                          setDraftTitle(e.target.value);
                          setIsDirty(true);
                        }}
                        className="font-bold text-gray-900 text-base bg-transparent border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-indigo-600 focus:outline-none px-1 py-0.5"
                        placeholder="Draft Title..."
                      />
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        v{currentVersion}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>Client: <strong>{selectedClient?.name || "General"}</strong></span>
                      <span>•</span>
                      <span>Matter: <strong>{selectedMatter?.case_no || "Unfiled"}</strong></span>
                      <span>•</span>
                      <span>Category: <strong>{selectedCategory}</strong></span>
                      <span>•</span>
                      {lastSavedTime && (
                        <span className="text-gray-400">
                          Saved: {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editor Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Save Status Indicator */}
                  <div className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200">
                    {isCreating || isUpdating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                        <span className="text-gray-500 font-medium">Saving...</span>
                      </>
                    ) : isDirty ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-amber-700 font-medium">Unsaved changes</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                        <span className="text-emerald-700 font-medium">Saved to Database</span>
                      </>
                    )}
                  </div>

                  {/* Primary Save Button */}
                  <button
                    onClick={handleSaveDraft}
                    disabled={isCreating || isUpdating}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" /> Save
                  </button>

                  {/* Duplicate / Save As */}
                  <button
                    onClick={() => handlePromptDuplicate()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
                    title="Duplicate draft as a new copy (Save As)"
                  >
                    <Copy className="w-4 h-4" /> Save As...
                  </button>

                  {/* Export Dropdown */}
                  <div className="relative group">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                      <Download className="w-4 h-4" /> Export
                    </button>
                    <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 hidden group-hover:block z-20 text-left">
                      <button onClick={handleExportText} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 flex items-center gap-2">
                        Export as Plain Text (.txt)
                      </button>
                      <button onClick={() => handleExportDocx()} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 flex items-center gap-2 font-medium">
                        Export as Word (.docx)
                      </button>
                    </div>
                  </div>

                  {/* Preview & Print */}
                  <button 
                    onClick={() => setShowPrintPreview(true)} 
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Letterhead Print
                  </button>
                </div>
              </div>

              {/* Editor Canvas Area */}
              <div className="flex-1 p-6 md:p-8 bg-gray-100 flex flex-col items-center overflow-y-auto">
                <div className="w-full max-w-[900px] bg-white border border-gray-300 shadow-md min-h-[950px] p-12 md:p-16 rounded-sm relative flex flex-col">
                  
                  {/* Subtle document watermark / header simulation */}
                  <div className="border-b border-gray-200 pb-4 mb-8 flex justify-between items-center text-[11px] text-gray-400 font-mono select-none">
                    <span>FASTCASE LEGAL DRAFTING SYSTEM</span>
                    <span>{selectedCategory.toUpperCase()} • {selectedLanguage.toUpperCase()}</span>
                  </div>

                  <textarea
                    value={editorContent}
                    onChange={(e) => {
                      setEditorContent(e.target.value);
                      setIsDirty(true);
                    }}
                    placeholder="Enter or edit legal draft content..."
                    className="flex-1 w-full resize-none outline-none font-serif text-gray-900 leading-relaxed text-[15px] bg-transparent whitespace-pre-wrap selection:bg-indigo-100"
                    rows={36}
                    spellCheck={false}
                  />

                  {/* Bottom Canvas Stats */}
                  <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 select-none">
                    <span>Words: <strong>{wordCount}</strong> • Characters: <strong>{charCount}</strong></span>
                    <span>Version {currentVersion}</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Duplicate / Save As Modal */}
      <Modal open={duplicateModalOpen} onClose={() => setDuplicateModalOpen(false)} title="Save As / Duplicate Draft" size="md">
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Create an independent copy of this draft. Your existing draft will remain unchanged.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">New Draft Title *</label>
            <input
              type="text"
              value={duplicateTitleInput}
              onChange={(e) => setDuplicateTitleInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              placeholder="e.g. Copy of Bail Application"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => setDuplicateModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDuplicate}
              disabled={isDuplicating || !duplicateTitleInput.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50"
            >
              {isDuplicating ? "Duplicating..." : "Create Duplicate"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Draft"
        message="Are you sure you want to delete this draft? You can restore it from system records if needed."
        confirmLabel={isDeleting ? "Deleting..." : "Delete Draft"}
        danger
      />

      {/* Letterhead Print Preview Overlay */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex bg-gray-900/70 items-center justify-center p-6 print:p-0 print:bg-white print:block backdrop-blur-sm">
          <div className="bg-gray-100 rounded-2xl w-full max-w-[950px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:w-full print:max-h-none print:shadow-none print:bg-white print:rounded-none">
            
            {/* Modal Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-sm font-bold text-gray-900">
                  Letterhead Print &amp; PDF Preview
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSettingsModal(true)} 
                  className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Configure Letterhead
                </button>
                <button 
                  onClick={handlePrint} 
                  className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5"/> Print / Save PDF
                </button>
                <button 
                  onClick={() => setShowPrintPreview(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible relative">
              <LetterheadPreview 
                letterhead={myLetterhead || null} 
                content={editorContent} 
                onConfigure={() => setShowSettingsModal(true)}
              />
            </div>
            
          </div>
        </div>
      )}

      {/* Inline Letterhead Settings Modal */}
      <Modal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Configure Letterhead" size="lg">
        <LetterheadSettings />
      </Modal>

    </div>
  );
}
