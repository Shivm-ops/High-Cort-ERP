"use client";

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react";
import {
  FileText, Search, User, Briefcase, FileCheck,
  ChevronRight, Save, Download, FileSignature, BookOpen,
  Plus, Edit3, Copy, Trash2, Printer, ArrowLeft, Check, Clock, Globe,
  FolderOpen, Shield, RefreshCw, Sparkles, GitCompare, Languages,
  RotateCcw, AlertCircle, Settings, Wand2, ChevronDown, Library, Upload, Eye, X
} from "lucide-react";
import Header from "@/components/layout/Header";
import { api, getErrorMessage } from "@/lib/api";
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
import { getDocumentContent } from "@/lib/hooks/useDataBridge";

type WorkspaceMode = "drafts_list" | "templates" | "wizard" | "ai_generate" | "compare" | "editor";
type AiAssistTab = "enhance" | "translate" | "research";

const TEMPLATE_PLACEHOLDERS = [
  "{{client_name}}",
  "{{client_address}}",
  "{{client_age}}",
  "{{case_number}}",
  "{{court_name}}",
  "{{judge_name}}",
  "{{opponent_name}}",
  "{{advocate_name}}",
];

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

const AI_PRESETS = [
  { label: "Bail Application", draftType: "bail", category: "Applications" },
  { label: "Legal Notice", draftType: "notice", category: "Notices" },
  { label: "Notice Reply", draftType: "reply", category: "Replies" },
  { label: "Consumer Complaint", draftType: "complaint", category: "Complaints" },
  { label: "Written Statement", draftType: "written_statement", category: "Written Statements" },
  { label: "Affidavit", draftType: "affidavit", category: "Affidavits" },
  { label: "Appeal", draftType: "appeal", category: "Appeals" },
  { label: "Divorce Petition", draftType: "petition", category: "Petitions" },
  { label: "Agreement", draftType: "agreement", category: "Agreements" },
  { label: "Writ Petition", draftType: "petition", category: "Petitions" },
  { label: "Custom Draft", draftType: "other", category: "Other" },
];

const AI_ENHANCE_ACTIONS = [
  { label: "Improve Legal Language", action: "improve_legal_language" },
  { label: "Rewrite Professionally", action: "rewrite_professionally" },
  { label: "Expand Arguments", action: "expand_arguments" },
  { label: "Add Prayer for Relief", action: "add_prayer" },
  { label: "Suggest Acts & Statutes", action: "suggest_acts" },
  { label: "Court Formatting Check", action: "court_formatting" },
];

function languageNameToCode(langName: string): string {
  const lower = (langName || "").toLowerCase();
  if (lower.startsWith("hi")) return "hi";
  if (lower.startsWith("mr") || lower.includes("marathi")) return "mr";
  if (lower.startsWith("gu") || lower.includes("gujarati")) return "gu";
  return "en";
}

function codeToLanguageName(code: string): string {
  if (code === "hi") return "Hindi";
  if (code === "mr") return "Marathi";
  if (code === "gu") return "Gujarati";
  return "English";
}

interface DiffLine {
  type: "same" | "added" | "removed";
  line: string;
}

function computeLineDiff(textA: string, textB: string): DiffLine[] {
  const linesA = textA.split("\n");
  const linesB = textB.split("\n");
  const m = linesA.length;
  const n = linesB.length;

  // Guard against quadratic memory on massive pastes
  if (m * n > 250000) {
    const out: DiffLine[] = [];
    const maxLen = Math.max(m, n);
    for (let idx = 0; idx < maxLen; idx++) {
      const a = linesA[idx];
      const b = linesB[idx];
      if (a === b && a !== undefined) {
        out.push({ type: "same", line: a });
      } else {
        if (a !== undefined) out.push({ type: "removed", line: a });
        if (b !== undefined) out.push({ type: "added", line: b });
      }
    }
    return out;
  }

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (linesA[i] === linesB[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (linesA[i] === linesB[j]) {
      diff.push({ type: "same", line: linesA[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      diff.push({ type: "removed", line: linesA[i] });
      i++;
    } else {
      diff.push({ type: "added", line: linesB[j] });
      j++;
    }
  }
  while (i < m) {
    diff.push({ type: "removed", line: linesA[i++] });
  }
  while (j < n) {
    diff.push({ type: "added", line: linesB[j++] });
  }
  return diff;
}

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
  const urlDocumentId = searchParams.get("documentId");
  const urlTemplateId = searchParams.get("templateId");
  const urlClientId = searchParams.get("clientId");
  const urlCaseId = searchParams.get("caseId");
  const urlMode = searchParams.get("mode");

  const initialMode: WorkspaceMode =
    urlDraftId || urlDocumentId
      ? "editor"
      : urlTemplateId || urlCaseId || urlClientId || urlMode === "wizard"
      ? "wizard"
      : urlMode === "templates"
      ? "templates"
      : urlMode === "ai"
      ? "ai_generate"
      : urlMode === "compare"
      ? "compare"
      : "drafts_list";

  const [activeMode, setActiveMode] = useState<WorkspaceMode>(initialMode);

  // Sync mode query parameter changes
  useEffect(() => {
    if (urlDraftId || urlDocumentId) return;
    if (urlMode === "templates") setActiveMode("templates");
    else if (urlMode === "ai") setActiveMode("ai_generate");
    else if (urlMode === "wizard") {
      setActiveMode("wizard");
      setStep(1);
    } else if (urlMode === "compare") setActiveMode("compare");
  }, [urlMode, urlDraftId, urlDocumentId]);

  // Wizard state (steps 1 to 4)
  const [step, setStep] = useState<number>(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedMatter, setSelectedMatter] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("Applications");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");

  // AI Draft generation state
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; provider?: string; model?: string } | null>(null);
  const [aiPresetLabel, setAiPresetLabel] = useState<string>("Legal Notice");
  const [aiDraftType, setAiDraftType] = useState<string>("notice");
  const [aiCategory, setAiCategory] = useState<string>("Notices");
  const [aiLanguage, setAiLanguage] = useState<string>("English");
  const [aiClientId, setAiClientId] = useState<string>("");
  const [aiCaseId, setAiCaseId] = useState<string>("");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);

  // Editor state
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(urlDraftId || null);
  const [draftTitle, setDraftTitle] = useState<string>("Untitled Draft");
  const [editorContent, setEditorContent] = useState<string>("");
  const [currentVersion, setCurrentVersion] = useState<number>(1);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // AI Assist drawer inside editor
  const [showAiAssist, setShowAiAssist] = useState<boolean>(false);
  const [aiAssistTab, setAiAssistTab] = useState<AiAssistTab>("enhance");
  const [customAiInstruction, setCustomAiInstruction] = useState<string>("");
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [researchQuery, setResearchQuery] = useState<string>("");
  const [researchData, setResearchData] = useState<{
    ai_analysis?: string;
    case_laws?: Array<{ title?: string; citation?: string; summary?: string }>;
    sections?: Array<{ act?: string; section?: string; summary?: string }>;
  } | null>(null);
  const [isSearchingResearch, setIsSearchingResearch] = useState<boolean>(false);

  // Compare Drafts state
  const [compareLeftDraftId, setCompareLeftDraftId] = useState<string>("");
  const [compareRightDraftId, setCompareRightDraftId] = useState<string>("");
  const [compareTextA, setCompareTextA] = useState<string>("");
  const [compareTextB, setCompareTextB] = useState<string>("");
  const [diffResult, setDiffResult] = useState<DiffLine[] | null>(null);

  // Saved Drafts List Filters
  const [savedDraftsSearch, setSavedDraftsSearch] = useState<string>("");
  const [savedDraftsCategory, setSavedDraftsCategory] = useState<string>("all");

  // Template Library Filters & Modals
  const [templateLibSearch, setTemplateLibSearch] = useState<string>("");
  const [templateLibLanguage, setTemplateLibLanguage] = useState<string>("all");
  const [templateLibCategory, setTemplateLibCategory] = useState<string>("all");
  const [templateLibSource, setTemplateLibSource] = useState<"all" | "master" | "firm">("all");
  const [previewTemplate, setPreviewTemplate] = useState<Draft | null>(null);
  const [previewClientId, setPreviewClientId] = useState<string>("");
  const [previewCaseId, setPreviewCaseId] = useState<string>("");
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);
  const [editingTemplate, setEditingTemplate] = useState<Draft | null>(null);
  const [formTemplateTitle, setFormTemplateTitle] = useState<string>("");
  const [formTemplateCategory, setFormTemplateCategory] = useState<string>("Applications");
  const [formTemplateLanguage, setFormTemplateLanguage] = useState<string>("English");
  const [formTemplatePractice, setFormTemplatePractice] = useState<string>("");
  const [formTemplateTags, setFormTemplateTags] = useState<string>("");
  const [formTemplateContent, setFormTemplateContent] = useState<string>("");
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<Draft | null>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);

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
  const { data: clientsData } = useClients();
  const clients = clientsData?.clients || [];

  const { data: casesData } = useCases(selectedClient ? { client_id: selectedClient.id } : undefined);
  const cases = casesData?.cases || [];

  const { data: aiCasesData } = useCases(aiClientId ? { client_id: aiClientId } : undefined);
  const aiCases = aiCasesData?.cases || [];

  const { data: previewCasesData } = useCases(previewClientId ? { client_id: previewClientId } : undefined);
  const previewCases = previewCasesData?.cases || [];

  const { data: savedDraftsData, isLoading: isLoadingDrafts, refetch: refetchDrafts } = useDrafts({ is_template: false });
  const savedDrafts = savedDraftsData?.drafts || [];

  const { data: allTemplatesData, isLoading: isLoadingAllTemplates, refetch: refetchTemplates } = useTemplates();
  const allTemplates = allTemplatesData?.templates || [];

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({
    category: selectedCategory,
    language: selectedLanguage,
    search: templateSearchQuery || undefined
  });
  const templates = templatesData?.templates || [];

  const { data: draftDetailData } = useDraft(currentDraftId || "");

  const { mutate: autoFill, isPending: isAutofilling } = useAutoFill();
  const { mutate: createDraft, isPending: isCreating } = useCreateDraft();
  const { mutate: updateDraft, isPending: isUpdating } = useUpdateDraft();
  const { mutate: duplicateDraft, isPending: isDuplicating } = useDuplicateDraft();
  const { mutate: deleteDraft, isPending: isDeleting } = useDeleteDraft();

  // Check AI configuration status on mount
  useEffect(() => {
    api.get("/ai/status")
      .then((res) => setAiStatus(res.data))
      .catch(() => setAiStatus({ configured: false }));
  }, []);

  // Load draft into editor when draftDetailData arrives
  useEffect(() => {
    if (draftDetailData && currentDraftId === draftDetailData.id) {
      setDraftTitle(draftDetailData.title);
      setEditorContent(draftDetailData.content);
      setCurrentVersion(draftDetailData.version || 1);
      setIsAiGenerated(Boolean(draftDetailData.ai_generated));
      setSelectedCategory(draftDetailData.category || "Applications");
      setSelectedLanguage(draftDetailData.language || "English");
      if (draftDetailData.client_id) {
        setSelectedClient({ id: draftDetailData.client_id, name: draftDetailData.client_name });
      }
      if (draftDetailData.case_id) {
        setSelectedMatter({ id: draftDetailData.case_id, case_no: draftDetailData.case_no, title: draftDetailData.case_title });
      }
      setUndoStack([]);
      setIsDirty(false);
      setLastSavedTime(new Date(draftDetailData.updated_at));
    }
  }, [draftDetailData, currentDraftId]);

  // Handle URL documentId to load imported file text directly
  useEffect(() => {
    if (urlDocumentId) {
      getDocumentContent(urlDocumentId).then((res) => {
        setDraftTitle(`Draft - ${res.name.replace(/\.[^/.]+$/, "")}`);
        setEditorContent(res.text || "");
        setIsAiGenerated(false);
        setUndoStack([]);
        if (res.client_id) {
          setSelectedClient({ id: res.client_id, name: res.client_name });
        }
        if (res.case_id) {
          setSelectedMatter({ id: res.case_id, case_no: res.case_no, title: res.case_title });
        }
        setActiveMode("editor");
        setIsDirty(false);
        toast.success("Document loaded into Draft Workspace");
      }).catch(() => {
        toast.error("Could not load document text for editing");
      });
    }
  }, [urlDocumentId]);

  // Handle URL templateId to auto-load template into editor
  useEffect(() => {
    if (urlTemplateId) {
      api.get(`/drafts/${urlTemplateId}`)
        .then((res) => {
          handleSelectTemplate(res.data);
        })
        .catch(() => {
          toast.error("Could not load selected template");
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlTemplateId]);

  // Handle URL params for client & case preselection
  useEffect(() => {
    if (urlClientId && clients.length > 0 && !selectedClient) {
      const match = clients.find((c: any) => c.id === urlClientId);
      if (match) {
        setSelectedClient(match);
        setStep(2);
      }
    }
  }, [urlClientId, clients, selectedClient]);

  useEffect(() => {
    if (urlCaseId && cases.length > 0 && !selectedMatter) {
      const match = cases.find((c: any) => c.id === urlCaseId);
      if (match) {
        setSelectedMatter(match);
        setStep(3);
      }
    }
  }, [urlCaseId, cases, selectedMatter]);

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

  const confirmLeaveDirtyEditor = (nextAction: () => void) => {
    if (activeMode === "editor" && isDirty) {
      if (!confirm("You have unsaved changes in your document. Continue anyway?")) return;
    }
    nextAction();
  };

  // Handle template selection and autofill
  const handleSelectTemplate = (template: any) => {
    const templateContent = template.content || `BEFORE THE HON'BLE COURT\n\nCase No: {{case_number}}\n\n{{client_name}} ... Petitioner\nVs\n{{opponent_name}} ... Respondent\n\n1. That the applicant submits this ${template.title} in the interests of justice.`;

    autoFill({
      template_content: templateContent,
      client_id: selectedClient?.id,
      case_id: selectedMatter?.id
    }, {
      onSuccess: (res) => {
        setCurrentDraftId(null);
        setIsAiGenerated(false);
        setUndoStack([]);
        setDraftTitle(`${template.title} - ${selectedClient?.name || "General"}`);
        setEditorContent(res.filled_content);
        setCurrentVersion(1);
        setIsDirty(true);
        setActiveMode("editor");
      },
      onError: () => {
        const filled = templateContent
          .replace(/{{client_name}}/g, selectedClient?.name || "[Client Name]")
          .replace(/{{case_number}}/g, selectedMatter?.case_no || "UNFILED")
          .replace(/{{opponent_name}}/g, "Respondent / State");
        setCurrentDraftId(null);
        setIsAiGenerated(false);
        setUndoStack([]);
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
    setIsAiGenerated(false);
    setUndoStack([]);
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

  // Generate draft via AI endpoint
  const handleGenerateAiDraft = async () => {
    if (!aiPrompt.trim() && !aiCaseId && !aiClientId) {
      toast.error("Please describe the facts or select a Client / Matter to generate a draft.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const matchedClient = clients.find((c: any) => c.id === aiClientId) || null;
      const matchedMatter = aiCases.find((c: any) => c.id === aiCaseId) || null;
      const res = await api.post("/ai/draft/generate", {
        draft_type: aiDraftType,
        language: languageNameToCode(aiLanguage),
        prompt: aiPrompt.trim() || `Prepare a formal ${aiPresetLabel} based on the linked case and client details.`,
        client_id: aiClientId || undefined,
        case_id: aiCaseId || undefined,
        context: {},
      });

      const generated = res.data?.draft || "";
      setCurrentDraftId(null);
      setIsAiGenerated(true);
      setUndoStack([]);
      setSelectedClient(matchedClient);
      setSelectedMatter(matchedMatter);
      setSelectedCategory(aiCategory);
      setSelectedLanguage(aiLanguage);
      setDraftTitle(`${aiPresetLabel}${matchedClient ? ` - ${matchedClient.name}` : ""}`);
      setEditorContent(generated);
      setCurrentVersion(1);
      setIsDirty(true);
      setShowAiAssist(Boolean(res.data?.ai_powered));
      setActiveMode("editor");

      if (res.data?.ai_powered) {
        toast.success("AI draft generated and opened in editor");
      } else {
        toast.success("Structured court draft prepared with your case details");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // AI Assist actions inside the unified editor
  const handleEnhanceDraft = async (action: string, instructions?: string) => {
    if (!editorContent.trim()) {
      toast.error("Draft content is empty.");
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await api.post("/ai/draft/enhance", {
        content: editorContent,
        action,
        instructions: instructions || undefined,
        language: languageNameToCode(selectedLanguage),
      });
      if (res.data?.draft) {
        setUndoStack((prev) => [editorContent, ...prev]);
        setEditorContent(res.data.draft);
        setIsDirty(true);
        setCustomAiInstruction("");
        toast.success("Draft updated with AI");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleTranslateDraft = async (targetCode: string) => {
    if (!editorContent.trim()) {
      toast.error("Draft content is empty.");
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await api.post("/ai/translate", {
        text: editorContent,
        source_lang: languageNameToCode(selectedLanguage),
        target_lang: targetCode,
      });
      if (res.data?.translated) {
        setUndoStack((prev) => [editorContent, ...prev]);
        setEditorContent(res.data.translated);
        setSelectedLanguage(codeToLanguageName(targetCode));
        setIsDirty(true);
        toast.success(`Translated to ${codeToLanguageName(targetCode)}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndoAiEdit = () => {
    if (undoStack.length === 0) return;
    const [latest, ...rest] = undoStack;
    setEditorContent(latest);
    setUndoStack(rest);
    setIsDirty(true);
    toast.success("Restored previous draft version");
  };

  const handleLegalResearchSearch = async () => {
    if (!researchQuery.trim()) {
      toast.error("Enter a legal topic, Act, or judgment keyword.");
      return;
    }
    setIsSearchingResearch(true);
    try {
      const { data } = await api.post("/ai/research", {
        query: researchQuery.trim(),
        language: languageNameToCode(selectedLanguage),
        include_acts: true,
        include_case_laws: true,
      });
      setResearchData(data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSearchingResearch(false);
    }
  };

  const handleInsertIntoDraft = (snippet: string) => {
    setUndoStack((prev) => [editorContent, ...prev]);
    setEditorContent((prev) => `${prev.trimEnd()}\n\n${snippet}`);
    setIsDirty(true);
    toast.success("Inserted into draft");
  };

  // Open an existing draft from the list
  const handleOpenDraft = (draft: Draft) => {
    setCurrentDraftId(draft.id);
    setDraftTitle(draft.title);
    setEditorContent(draft.content);
    setCurrentVersion(draft.version || 1);
    setIsAiGenerated(Boolean(draft.ai_generated));
    setSelectedCategory(draft.category || "Applications");
    setSelectedLanguage(draft.language || "English");
    setUndoStack([]);
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
      createDraft({
        title: draftTitle,
        content: editorContent,
        category: selectedCategory,
        language: selectedLanguage,
        client_id: selectedClient?.id || undefined,
        case_id: selectedMatter?.id || undefined,
        is_template: false,
        ai_generated: isAiGenerated
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

  // Compare Drafts handler
  const handleRunCompare = () => {
    if (!compareTextA.trim() && !compareTextB.trim()) {
      toast.error("Select two saved drafts or paste text in both boxes to compare.");
      return;
    }
    setDiffResult(computeLineDiff(compareTextA, compareTextB));
  };

  const diffStats = useMemo(() => {
    if (!diffResult) return { added: 0, removed: 0 };
    return {
      added: diffResult.filter((d) => d.type === "added").length,
      removed: diffResult.filter((d) => d.type === "removed").length,
    };
  }, [diffResult]);

  // Word count & stats
  const wordCount = useMemo(() => {
    return editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0;
  }, [editorContent]);

  const charCount = editorContent.length;

  const filteredLibraryTemplates = useMemo(() => {
    const q = templateLibSearch.trim().toLowerCase();
    return allTemplates.filter((t) => {
      const isMaster = Boolean(t.is_public_template) || !t.firm_id;
      if (templateLibSource === "master" && !isMaster) return false;
      if (templateLibSource === "firm" && isMaster) return false;
      if (templateLibLanguage !== "all" && languageNameToCode(t.language) !== templateLibLanguage) return false;
      if (templateLibCategory !== "all" && (t.category || "").toLowerCase() !== templateLibCategory.toLowerCase()) return false;
      if (q) {
        const hay = `${t.title} ${t.category} ${t.practice_area || ""} ${(t.tags || []).join(" ")} ${t.content || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allTemplates, templateLibSearch, templateLibLanguage, templateLibCategory, templateLibSource]);

  const openCreateFirmTemplateModal = () => {
    setEditingTemplate(null);
    setFormTemplateTitle("");
    setFormTemplateCategory("Applications");
    setFormTemplateLanguage("English");
    setFormTemplatePractice("");
    setFormTemplateTags("");
    setFormTemplateContent("");
    setShowTemplateModal(true);
  };

  const openEditFirmTemplateModal = (tpl: Draft) => {
    setEditingTemplate(tpl);
    setFormTemplateTitle(tpl.title || "");
    setFormTemplateCategory(tpl.category || "Other");
    setFormTemplateLanguage(codeToLanguageName(languageNameToCode(tpl.language || "en")));
    setFormTemplatePractice(tpl.practice_area || "");
    setFormTemplateTags((tpl.tags || []).join(", "));
    setFormTemplateContent(tpl.content || "");
    setShowTemplateModal(true);
  };

  const handleLoadTemplateFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (text) {
        setFormTemplateContent(text);
        if (!formTemplateTitle.trim()) {
          setFormTemplateTitle(file.name.replace(/\.[^/.]+$/, ""));
        }
        toast.success("Template text loaded");
      }
    };
    reader.readAsText(file);
    if (templateFileInputRef.current) templateFileInputRef.current.value = "";
  };

  const handleSaveFirmTemplate = () => {
    if (!formTemplateTitle.trim() || !formTemplateContent.trim()) {
      toast.error("Template title and content are required");
      return;
    }
    const tags = formTemplateTags.split(",").map((s) => s.trim()).filter(Boolean);
    if (editingTemplate) {
      updateDraft({
        id: editingTemplate.id,
        title: formTemplateTitle.trim(),
        category: formTemplateCategory,
        language: languageNameToCode(formTemplateLanguage),
        practice_area: formTemplatePractice.trim() || undefined,
        tags,
        content: formTemplateContent,
        is_template: true,
      }, {
        onSuccess: () => {
          setShowTemplateModal(false);
          refetchTemplates();
        }
      });
    } else {
      createDraft({
        title: formTemplateTitle.trim(),
        category: formTemplateCategory,
        language: languageNameToCode(formTemplateLanguage),
        practice_area: formTemplatePractice.trim() || undefined,
        tags,
        content: formTemplateContent,
        is_template: true,
      }, {
        onSuccess: () => {
          setShowTemplateModal(false);
          refetchTemplates();
        }
      });
    }
  };

  const handleUsePreviewTemplate = () => {
    if (!previewTemplate) return;
    const matchedClient = clients.find((c: any) => c.id === previewClientId) || null;
    const matchedMatter = previewCases.find((c: any) => c.id === previewCaseId) || null;
    setSelectedClient(matchedClient);
    setSelectedMatter(matchedMatter);
    setSelectedCategory(previewTemplate.category || "Applications");
    setSelectedLanguage(codeToLanguageName(languageNameToCode(previewTemplate.language || "en")));

    const templateContent = previewTemplate.content || "";
    autoFill({
      template_content: templateContent,
      client_id: matchedClient?.id,
      case_id: matchedMatter?.id,
    }, {
      onSuccess: (res) => {
        setPreviewTemplate(null);
        setCurrentDraftId(null);
        setIsAiGenerated(false);
        setUndoStack([]);
        setDraftTitle(`${previewTemplate.title} - ${matchedClient?.name || "General"}`);
        setEditorContent(res.filled_content);
        setCurrentVersion(1);
        setIsDirty(true);
        setActiveMode("editor");
      },
      onError: () => {
        setPreviewTemplate(null);
        setCurrentDraftId(null);
        setIsAiGenerated(false);
        setUndoStack([]);
        setDraftTitle(`${previewTemplate.title} - ${matchedClient?.name || "General"}`);
        setEditorContent(templateContent);
        setCurrentVersion(1);
        setIsDirty(true);
        setActiveMode("editor");
      }
    });
  };

  const handleConfirmDeleteFirmTemplate = () => {
    if (!deleteTemplateTarget) return;
    deleteDraft(deleteTemplateTarget.id, {
      onSuccess: () => {
        setDeleteTemplateTarget(null);
        refetchTemplates();
      }
    });
  };

  return (
    <div className="min-h-screen bg-workspace-bg pb-12 flex flex-col">
      <div className={cn("flex flex-col flex-1", showPrintPreview && "print:hidden")}>
        <Header
          title="Draft Workspace"
          subtitle="Saved drafts, template auto-fill, AI-assisted drafting, revision comparison, and letterhead export"
        />

        <div className="flex-1 p-6 flex flex-col gap-6 max-w-[1600px] mx-auto w-full">

          {/* Top Mode Selector Tabs */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => confirmLeaveDirtyEditor(() => setActiveMode("drafts_list"))}
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
                onClick={() => confirmLeaveDirtyEditor(() => setActiveMode("templates"))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeMode === "templates"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Library className="w-4 h-4" />
                Template Library
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-bold",
                  activeMode === "templates" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}>
                  {allTemplates.length}
                </span>
              </button>

              <button
                onClick={() => confirmLeaveDirtyEditor(() => { setActiveMode("wizard"); setStep(1); })}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeMode === "wizard"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Plus className="w-4 h-4" />
                Assemble from Template
              </button>

              <button
                onClick={() => confirmLeaveDirtyEditor(() => setActiveMode("ai_generate"))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeMode === "ai_generate"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </button>

              <button
                onClick={() => confirmLeaveDirtyEditor(() => setActiveMode("compare"))}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
                  activeMode === "compare"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <GitCompare className="w-4 h-4" />
                Compare Drafts
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

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveMode("ai_generate")}
                    className="flex items-center justify-center gap-2 px-4 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" /> AI Draft
                  </button>
                  <button
                    onClick={() => { setActiveMode("wizard"); setStep(1); }}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Create from Template
                  </button>
                </div>
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
                      : "Assemble pleadings, affidavits, notices, and applications from firm templates or AI assistance."}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => { setActiveMode("wizard"); setStep(1); }}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Assemble from Template
                    </button>
                    <button
                      onClick={() => setActiveMode("ai_generate")}
                      className="px-5 py-2.5 border border-indigo-200 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Generate with AI
                    </button>
                  </div>
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
                            <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-2 flex-wrap">
                              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                              <span>{draft.title}</span>
                              {draft.ai_generated ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Sparkles className="w-2.5 h-2.5" /> AI
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                                  Template
                                </span>
                              )}
                            </div>
                            {draft.tags && draft.tags.length > 0 && (
                              <div className="flex gap-1.5 mt-1">
                                {draft.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
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
                              {new Date(draft.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

          {/* MODE 2: TEMPLATE LIBRARY */}
          {activeMode === "templates" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Library className="w-5 h-5 text-indigo-600" />
                    Template Library
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Preview platform master formats, create reusable firm templates, auto-fill client details, or export to Word.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateFirmTemplateModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Create Firm Template
                </button>
              </div>

              {/* Toolbar Filters */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={templateLibSearch}
                      onChange={(e) => setTemplateLibSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <select
                    value={templateLibCategory}
                    onChange={(e) => setTemplateLibCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="all">All Categories</option>
                    {DRAFT_CATEGORIES.map((cat) => (
                      <option key={cat.key} value={cat.key.toLowerCase()}>
                        {cat.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={templateLibSource}
                    onChange={(e) => setTemplateLibSource(e.target.value as "all" | "master" | "firm")}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="all">All Sources</option>
                    <option value="master">Master Templates</option>
                    <option value="firm">Firm Templates</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTemplateLibLanguage("all")}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
                      templateLibLanguage === "all"
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    All ({allTemplates.length})
                  </button>
                  {LANGUAGES.map((lang) => {
                    const cnt = allTemplates.filter((t) => languageNameToCode(t.language) === lang.code).length;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setTemplateLibLanguage(lang.code)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
                          templateLibLanguage === lang.code
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        )}
                      >
                        {lang.label} ({cnt})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Templates Grid */}
              {isLoadingAllTemplates ? (
                <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
                  <span>Loading template library...</span>
                </div>
              ) : filteredLibraryTemplates.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl p-6">
                  <Library className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-800 mb-1">No matching templates found</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Adjust your search filters or create a reusable custom template for your chamber.
                  </p>
                  <button
                    type="button"
                    onClick={openCreateFirmTemplateModal}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                  >
                    + Create Firm Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredLibraryTemplates.map((tpl) => {
                    const isFirmCustom = !tpl.is_public_template && Boolean(tpl.firm_id);
                    const langCode = languageNameToCode(tpl.language);
                    return (
                      <div
                        key={tpl.id}
                        className="p-5 rounded-2xl border border-gray-200 hover:border-indigo-400 bg-white hover:shadow-sm transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                isFirmCustom
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-indigo-50 text-indigo-700 border-indigo-100"
                              )}
                            >
                              {isFirmCustom ? "Firm Template" : "Master Template"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {codeToLanguageName(langCode)}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-sm mb-1.5 line-clamp-2">{tpl.title}</h3>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {tpl.content ? `${tpl.content.slice(0, 140)}...` : "Court-ready legal format."}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-gray-400 capitalize truncate">
                            {tpl.category}{tpl.practice_area ? ` · ${tpl.practice_area}` : ""}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {isFirmCustom && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditFirmTemplateModal(tpl)}
                                  title="Edit Firm Template"
                                  className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTemplateTarget(tpl)}
                                  title="Delete Firm Template"
                                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleExportDocx(tpl.content, tpl.title)}
                              title="Download Word (.docx)"
                              className="p-1.5 text-gray-500 hover:text-emerald-600 rounded-lg hover:bg-gray-100"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewClientId("");
                                setPreviewCaseId("");
                                setPreviewTemplate(tpl);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> Preview &amp; Use
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MODE 3: TEMPLATE WIZARD */}
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
                    Back to Saved Drafts
                  </button>
                </div>
              </div>

              {/* Wizard Body & Sidebar */}
              <div className="flex flex-col xl:flex-row gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">

                  {/* Step 1: Select Client */}
                  {step === 1 && (
                    <div className="p-8">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <User className="w-6 h-6 text-indigo-600" /> Select Client
                          </h2>
                          <p className="text-xs text-gray-500 mt-1">
                            Choose an existing client for autofill, or proceed with a general draft without client linkage.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedClient(null);
                              setSelectedMatter(null);
                              setStep(3);
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
                                onClick={() => router.push("/clients")}
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
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                        <div className="flex items-center gap-4">
                          <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Back to Client
                          </button>
                          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Briefcase className="w-6 h-6 text-indigo-600" /> Select Matter
                          </h2>
                        </div>
                        <button
                          onClick={() => { setSelectedMatter(null); setStep(3); }}
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
                            You can proceed with an unlinked pre-litigation draft now, or create a new matter in Case Management.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-4">
                            <button
                              onClick={() => { setSelectedMatter(null); setStep(3); }}
                              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                              Proceed without Matter →
                            </button>
                            <button
                              onClick={() => router.push("/cases")}
                              className="px-5 py-2.5 border border-gray-200 bg-white text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                            >
                              Create New Matter
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {cases.map((c: any) => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedMatter(c); setStep(3); }}
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
                            onClick={() => { setSelectedMatter(null); setStep(3); }}
                            className="text-left p-6 rounded-xl border border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/30 transition-colors flex flex-col items-center justify-center text-center"
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
                          <FileSignature className="w-6 h-6 text-indigo-600" /> Select Draft Category
                        </h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {DRAFT_CATEGORIES.map((cat) => (
                          <button
                            key={cat.key}
                            onClick={() => { setSelectedCategory(cat.key); setStep(4); }}
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
                              Filter by language or search by name. Master templates load from the database.
                            </p>
                          </div>
                        </div>

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

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                        <div className="relative w-full sm:w-80">
                          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search templates..."
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
                            Switch to English templates, use AI Draft generation, or start with a structured blank format.
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
                                  {t.content ? `${t.content.slice(0, 140)}...` : "Standard court filing template."}
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
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: GENERATE WITH AI */}
          {activeMode === "ai_generate" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    Generate Legal Draft
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Pick a document type, optionally link a Client &amp; Matter for auto-populated court details, and enter your instructions.
                  </p>
                </div>

                {aiStatus?.configured ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Live AI Connected ({aiStatus.model || "OpenAI"})
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No AI API key configured — structured template mode active</span>
                    <button
                      type="button"
                      onClick={() => router.push("/settings")}
                      className="inline-flex items-center gap-1 font-bold underline hover:text-amber-950 ml-1"
                    >
                      <Settings className="w-3 h-3" /> Settings
                    </button>
                  </div>
                )}
              </div>

              {/* Document Type Presets */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  1. Document Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {AI_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setAiPresetLabel(preset.label);
                        setAiDraftType(preset.draftType);
                        setAiCategory(preset.category);
                      }}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all",
                        aiPresetLabel === preset.label
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50/40 hover:border-indigo-300"
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Client, Matter, Language */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    2. Client (Optional)
                  </label>
                  <select
                    value={aiClientId}
                    onChange={(e) => {
                      setAiClientId(e.target.value);
                      setAiCaseId("");
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- General / No Client --</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Matter (Optional)
                  </label>
                  <select
                    value={aiCaseId}
                    onChange={(e) => setAiCaseId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">-- Pre-litigation / Unlinked --</option>
                    {aiCases.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.case_no} — {c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Language
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prompt / Facts */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  3. Case Facts &amp; Drafting Instructions
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  rows={6}
                  placeholder={`Describe the key facts, opponent details, statutory sections, dates, and relief sought for this ${aiPresetLabel.toLowerCase()}...`}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/40"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-gray-400">
                  Generated drafts open directly in the unified editor for review, database saving, and letterhead export.
                </span>
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Generate Draft
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* MODE 4: COMPARE DRAFTS */}
          {activeMode === "compare" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <GitCompare className="w-5 h-5 text-indigo-600" />
                    Compare Draft Revisions
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Load any two saved drafts or paste text side-by-side to inspect exact line-by-line additions and deletions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunCompare}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <GitCompare className="w-4 h-4" /> Compare Drafts
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Draft A */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Draft A (Original)</label>
                    <select
                      value={compareLeftDraftId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setCompareLeftDraftId(id);
                        const match = savedDrafts.find((d: Draft) => d.id === id);
                        if (match) setCompareTextA(match.content || "");
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white max-w-[230px]"
                    >
                      <option value="">Load saved draft...</option>
                      {savedDrafts.map((d: Draft) => (
                        <option key={d.id} value={d.id}>{d.title} (v{d.version || 1})</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={compareTextA}
                    onChange={(e) => setCompareTextA(e.target.value)}
                    rows={11}
                    placeholder="Paste original draft text or load a saved draft above..."
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-xs font-mono leading-relaxed bg-gray-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                {/* Draft B */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Draft B (Revised)</label>
                    <select
                      value={compareRightDraftId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setCompareRightDraftId(id);
                        const match = savedDrafts.find((d: Draft) => d.id === id);
                        if (match) setCompareTextB(match.content || "");
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white max-w-[230px]"
                    >
                      <option value="">Load saved draft...</option>
                      {savedDrafts.map((d: Draft) => (
                        <option key={d.id} value={d.id}>{d.title} (v{d.version || 1})</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={compareTextB}
                    onChange={(e) => setCompareTextB(e.target.value)}
                    rows={11}
                    placeholder="Paste revised draft text or load a saved draft above..."
                    className="w-full p-3.5 border border-gray-200 rounded-xl text-xs font-mono leading-relaxed bg-gray-50/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {diffResult && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Line Comparison Output</span>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">+{diffStats.added} added</span>
                      <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800">-{diffStats.removed} removed</span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 font-mono text-xs">
                    {diffResult.map((entry, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "px-4 py-1.5 whitespace-pre-wrap flex gap-3",
                          entry.type === "added" && "bg-emerald-50 text-emerald-900",
                          entry.type === "removed" && "bg-rose-50 text-rose-900 line-through",
                          entry.type === "same" && "bg-white text-gray-600"
                        )}
                      >
                        <span className="w-4 shrink-0 font-bold select-none">
                          {entry.type === "added" ? "+" : entry.type === "removed" ? "-" : " "}
                        </span>
                        <span className="flex-1">{entry.line || " "}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE 5: UNIFIED DOCUMENT EDITOR */}
          {activeMode === "editor" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">

              {/* Editor Top Bar */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between p-4 border-b border-gray-200 gap-4 bg-gray-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => confirmLeaveDirtyEditor(() => setActiveMode("drafts_list"))}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-200 bg-white shrink-0"
                    title="Back to Saved Drafts"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={draftTitle}
                        onChange={(e) => {
                          setDraftTitle(e.target.value);
                          setIsDirty(true);
                        }}
                        className="font-bold text-gray-900 text-base bg-transparent border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-indigo-600 focus:outline-none px-1 py-0.5 min-w-0 flex-1"
                        placeholder="Draft Title..."
                      />
                      <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                        v{currentVersion}
                      </span>
                      {isAiGenerated && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                          <Sparkles className="w-3 h-3" /> AI
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>Client: <strong>{selectedClient?.name || "General"}</strong></span>
                      <span>•</span>
                      <span>Matter: <strong>{selectedMatter?.case_no || "Unfiled"}</strong></span>
                      <span>•</span>
                      <span>Category: <strong>{selectedCategory}</strong></span>
                      <span>•</span>
                      <span>Language: <strong>{selectedLanguage}</strong></span>
                      {lastSavedTime && (
                        <>
                          <span>•</span>
                          <span className="text-gray-400">
                            Saved: {lastSavedTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Editor Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
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

                  {/* AI Assist Drawer Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowAiAssist((s) => !s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-colors",
                      showAiAssist
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                    )}
                  >
                    <Wand2 className="w-4 h-4" /> AI Assist
                  </button>

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
                      <Download className="w-4 h-4" /> Export <ChevronDown className="w-3.5 h-3.5" />
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

              {/* Editor Body + Optional AI Assist Sidebar */}
              <div className="flex flex-col xl:flex-row flex-1">
                {/* Paper Canvas */}
                <div className="flex-1 p-6 md:p-8 bg-gray-100 flex flex-col items-center overflow-y-auto">
                  <div className="w-full max-w-[900px] bg-white border border-gray-300 shadow-md min-h-[900px] p-10 md:p-14 rounded-sm relative flex flex-col">
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
                      rows={34}
                      spellCheck={false}
                    />

                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400 select-none">
                      <span>Words: <strong>{wordCount}</strong> • Characters: <strong>{charCount}</strong></span>
                      <span>Version {currentVersion}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible AI Assist Drawer */}
                {showAiAssist && (
                  <div className="w-full xl:w-[360px] border-t xl:border-t-0 xl:border-l border-gray-200 bg-white flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <Sparkles className="w-4 h-4 text-purple-600" /> AI Assist
                      </div>
                      {undoStack.length > 0 && (
                        <button
                          type="button"
                          onClick={handleUndoAiEdit}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Undo ({undoStack.length})
                        </button>
                      )}
                    </div>

                    {/* Drawer Tabs */}
                    <div className="grid grid-cols-3 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500">
                      <button
                        type="button"
                        onClick={() => setAiAssistTab("enhance")}
                        className={cn("py-2.5 border-b-2 transition-colors", aiAssistTab === "enhance" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent hover:text-gray-800")}
                      >
                        Enhance
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiAssistTab("translate")}
                        className={cn("py-2.5 border-b-2 transition-colors", aiAssistTab === "translate" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent hover:text-gray-800")}
                      >
                        Translate
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiAssistTab("research")}
                        className={cn("py-2.5 border-b-2 transition-colors", aiAssistTab === "research" ? "border-indigo-600 text-indigo-600 bg-white" : "border-transparent hover:text-gray-800")}
                      >
                        Research
                      </button>
                    </div>

                    <div className="p-4 space-y-4 overflow-y-auto flex-1">
                      {!aiStatus?.configured && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            Configure an OpenAI / compatible API key in{" "}
                            <button type="button" onClick={() => router.push("/settings")} className="font-bold underline">
                              Settings
                            </button>{" "}
                            to use live AI enhancement and translation.
                          </div>
                        </div>
                      )}

                      {aiAssistTab === "enhance" && (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            {AI_ENHANCE_ACTIONS.map((tool) => (
                              <button
                                key={tool.action}
                                type="button"
                                disabled={isEnhancing}
                                onClick={() => handleEnhanceDraft(tool.action)}
                                className="w-full text-left px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-indigo-50/40 hover:border-indigo-300 transition-colors disabled:opacity-50"
                              >
                                {tool.label}
                              </button>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-gray-100 space-y-2">
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Custom Instruction</label>
                            <textarea
                              value={customAiInstruction}
                              onChange={(e) => setCustomAiInstruction(e.target.value)}
                              rows={3}
                              placeholder="e.g. Add a paragraph citing Section 138 NI Act delay condonation..."
                              className="w-full p-2.5 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              disabled={isEnhancing || !customAiInstruction.trim()}
                              onClick={() => handleEnhanceDraft("custom", customAiInstruction.trim())}
                              className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                            >
                              {isEnhancing ? "Applying..." : "Apply Instruction"}
                            </button>
                          </div>
                        </div>
                      )}

                      {aiAssistTab === "translate" && (
                        <div className="space-y-3">
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Languages className="w-4 h-4 text-indigo-600" />
                            Translate the current draft while preserving statutory terminology.
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.code}
                                type="button"
                                disabled={isEnhancing}
                                onClick={() => handleTranslateDraft(lang.code)}
                                className="px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-indigo-50/40 hover:border-indigo-300 disabled:opacity-50 transition-colors"
                              >
                                {lang.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiAssistTab === "research" && (
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={researchQuery}
                              onChange={(e) => setResearchQuery(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleLegalResearchSearch()}
                              placeholder="Search Act, section, or precedent..."
                              className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={handleLegalResearchSearch}
                              disabled={isSearchingResearch}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
                            >
                              {isSearchingResearch ? "..." : "Go"}
                            </button>
                          </div>

                          {researchData?.ai_analysis && (
                            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Legal Analysis
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleInsertIntoDraft(researchData.ai_analysis || "")}
                                  className="text-[11px] font-bold text-indigo-600 hover:underline"
                                >
                                  Insert into Draft
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                                {researchData.ai_analysis}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
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
                  <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

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

      {/* Real Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[780px]">
            <div className="flex-1 bg-gray-50 p-6 overflow-y-auto border-r border-gray-100">
              <div className="bg-white border border-gray-200 shadow-xs p-8 font-serif text-xs leading-relaxed text-gray-800 whitespace-pre-wrap">
                {previewTemplate.content}
              </div>
            </div>

            <div className="w-full md:w-[340px] bg-white p-6 flex flex-col shrink-0 overflow-y-auto gap-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    {codeToLanguageName(languageNameToCode(previewTemplate.language))} · {previewTemplate.category}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">{previewTemplate.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTemplate(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {previewTemplate.tags && previewTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {previewTemplate.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="text-xs font-bold text-gray-700">Auto-Fill Details (Optional)</div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Client</label>
                  <select
                    value={previewClientId}
                    onChange={(e) => {
                      setPreviewClientId(e.target.value);
                      setPreviewCaseId("");
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="">-- No Client (Leave Placeholders) --</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 mb-1">Matter / Case</label>
                  <select
                    value={previewCaseId}
                    onChange={(e) => setPreviewCaseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-white"
                  >
                    <option value="">-- Unlinked Matter --</option>
                    {previewCases.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.case_no} — {c.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-4">
                <button
                  type="button"
                  onClick={handleUsePreviewTemplate}
                  disabled={isAutofilling}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isAutofilling ? "Merging..." : "Auto-Fill & Open in Editor"}
                </button>
                <button
                  type="button"
                  onClick={() => handleExportDocx(previewTemplate.content, previewTemplate.title)}
                  className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download (.docx)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Firm Template Modal */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title={editingTemplate ? "Edit Firm Template" : "Create Firm Template"}
        size="lg"
      >
        <div className="space-y-4 py-1 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Template Title *</label>
              <input
                type="text"
                value={formTemplateTitle}
                onChange={(e) => setFormTemplateTitle(e.target.value)}
                placeholder="e.g. Vakalatnama — Commercial Suit"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={formTemplateCategory}
                onChange={(e) => setFormTemplateCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                {DRAFT_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Language</label>
              <select
                value={formTemplateLanguage}
                onChange={(e) => setFormTemplateLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Practice Area</label>
              <input
                type="text"
                value={formTemplatePractice}
                onChange={(e) => setFormTemplatePractice(e.target.value)}
                placeholder="e.g. Civil / Criminal"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={formTemplateTags}
              onChange={(e) => setFormTemplateTags(e.target.value)}
              placeholder="e.g. Bail, Urgency, Court Format"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-gray-700">Template Body *</label>
              <div>
                <input
                  type="file"
                  accept=".txt,.md"
                  ref={templateFileInputRef}
                  onChange={handleLoadTemplateFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => templateFileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Upload className="w-3 h-3" /> Load from .txt / .md
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_PLACEHOLDERS.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setFormTemplateContent((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${ph}`)}
                  className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-100"
                >
                  + {ph}
                </button>
              ))}
            </div>

            <textarea
              value={formTemplateContent}
              onChange={(e) => setFormTemplateContent(e.target.value)}
              rows={10}
              placeholder="Paste or write your template format with {{client_name}}, {{case_number}}, {{court_name}} placeholders..."
              className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowTemplateModal(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveFirmTemplate}
              disabled={isCreating || isUpdating || !formTemplateTitle.trim() || !formTemplateContent.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {isCreating || isUpdating ? "Saving..." : editingTemplate ? "Save Changes" : "Save Firm Template"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTemplateTarget)}
        onClose={() => setDeleteTemplateTarget(null)}
        onConfirm={handleConfirmDeleteFirmTemplate}
        title="Delete Firm Template"
        message={`Delete firm template "${deleteTemplateTarget?.title}"?`}
        confirmLabel="Delete"
        danger
        loading={isDeleting}
      />
    </div>
  );
}
