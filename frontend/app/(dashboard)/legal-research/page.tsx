"use client";

import React, { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Sparkles, BookOpen, Scale, FileText, ChevronRight, Loader2,
  AlertCircle, Bookmark, BookmarkCheck, MessageSquare, Briefcase, Plus,
  Save, X, Edit3, Trash2, Upload, Copy, Settings, ExternalLink, Filter
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import {
  useCaseLaws, useCreateCaseLaw, useUpdateCaseLaw, useDeleteCaseLaw, CaseLaw
} from "@/lib/hooks/useCaseLaws";
import { useUploadDocument } from "@/lib/hooks/useDocuments";
import { useActs, Act } from "@/lib/hooks/useActs";
import { useCases } from "@/lib/hooks/useCases";
import { format } from "date-fns";

type ResearchTab = "library" | "acts" | "notes" | "arguments";

export interface ResearchContext {
  id: string;
  title: string;
  court: string;
  acts_involved: string;
  key_issues: string;
  facts: string;
  created_at: string;
}

interface SavedNoteEntry {
  content: string;
  updatedAt: string;
}

interface SavedArgument {
  id: string;
  title: string;
  content: string;
  contextKey: string;
  contextLabel: string;
  updatedAt: string;
}

interface ActSection {
  id: string;
  number: string;
  title: string;
  content: string;
}

const CONTEXT_PRESETS = [
  {
    label: "Bail / Anticipatory Bail",
    title: "Anticipatory Bail Application",
    court: "High Court",
    acts_involved: "CrPC Section 438 / BNSS Section 482, NDPS Act Section 37",
    key_issues: "Maintainability of anticipatory bail where commercial quantity is alleged without search procedure compliance",
    facts: "Applicant named solely on co-accused statement. No recovery made from personal possession.",
  },
  {
    label: "Section 138 NI Act Cheque Bounce",
    title: "Dishonour of Cheque u/s 138 NI Act",
    court: "Magistrate Court",
    acts_involved: "Negotiable Instruments Act 1881 Section 138, Section 139",
    key_issues: "Rebuttal of presumption u/s 139, security cheque misuse, statutory notice limitation",
    facts: "Cheque was issued as security for an unfulfilled contract; no legally enforceable debt existed on presentation date.",
  },
  {
    label: "Property Injunction Suit",
    title: "Temporary Injunction under Order 39 Rules 1 & 2 CPC",
    court: "Civil Court / District Judge",
    acts_involved: "CPC 1908 Order 39 Rules 1 & 2, Specific Relief Act 1963 Section 38",
    key_issues: "Prima facie case, balance of convenience, and irreparable loss against forceful dispossession",
    facts: "Plaintiff holds registered sale deed and continuous possession; defendant attempting interference without due process.",
  },
  {
    label: "Motor Accident Claim (MACT)",
    title: "Road Accident Compensation Claim u/s 166 MV Act",
    court: "Motor Accident Claims Tribunal",
    acts_involved: "Motor Vehicles Act 1988 Section 166, Section 168",
    key_issues: "Quantum of compensation, future prospects addition, and appropriate multiplier",
    facts: "Claimant suffered permanent disability due to rash and negligent driving of the offending insured vehicle.",
  },
  {
    label: "Writ Petition (Art. 226)",
    title: "Writ Petition Challenging Arbitrary Administrative Action",
    court: "High Court",
    acts_involved: "Constitution of India Article 226, Article 14, Article 21",
    key_issues: "Violation of principles of natural justice and right to be heard prior to adverse order",
    facts: "Impugned cancellation order passed unilaterally without issuing a show-cause notice or personal hearing.",
  },
];

const STANDARD_PRACTICE_AREAS = [
  "Civil",
  "Criminal",
  "Constitutional",
  "Corporate & Commercial",
  "Family",
  "Property & RERA",
  "Labour & Service",
  "Tax & GST",
  "Consumer",
  "MACT",
  "Banking & DRT",
];

const TABS: Array<{ id: ResearchTab; label: string; icon: React.ComponentType<any> }> = [
  { id: "library", label: "Case Law Library", icon: Scale },
  { id: "acts", label: "Acts & Sections", icon: BookOpen },
  { id: "notes", label: "Research Notes", icon: FileText },
  { id: "arguments", label: "Arguments Library", icon: MessageSquare },
];

const NOTES_STORAGE_KEY = "fastcase_research_notes_v1";
const ARGUMENTS_STORAGE_KEY = "fastcase_research_arguments_v1";
const CONTEXTS_STORAGE_KEY = "fastcase_research_contexts";

export default function LegalResearchPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading legal research workspace...</div>}>
      <LegalResearchWorkspace />
    </Suspense>
  );
}

function LegalResearchWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as ResearchTab | null;

  const [activeTab, setActiveTab] = useState<ResearchTab>(
    urlTab && ["library", "acts", "notes", "arguments"].includes(urlTab) ? urlTab : "library"
  );

  useEffect(() => {
    if (urlTab && ["library", "acts", "notes", "arguments"].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);

  // Cases & AI Status
  const { data: casesData } = useCases({ limit: 200 });
  const cases = casesData?.cases || [];
  const [aiStatus, setAiStatus] = useState<{ configured: boolean; model?: string } | null>(null);

  useEffect(() => {
    api.get("/ai/status")
      .then((res) => setAiStatus(res.data))
      .catch(() => setAiStatus({ configured: false }));
  }, []);

  // Research Contexts (persisted in localStorage)
  const [savedContexts, setSavedContexts] = useState<ResearchContext[]>([]);
  const [selectedContextKey, setSelectedContextKey] = useState<string>("");
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

  // AI Context Insights state
  const [suggestions, setSuggestions] = useState<{
    ai_powered?: boolean;
    sections?: string[];
    judgments?: string[];
    arguments?: string[];
    drafts?: string[];
  } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Case Law Library state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavorite, setFilterFavorite] = useState<boolean | undefined>(undefined);
  const [filterOnlyActiveCase, setFilterOnlyActiveCase] = useState(false);
  const [filterPracticeArea, setFilterPracticeArea] = useState("");
  const [filterCourt, setFilterCourt] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCaseLawId, setSelectedCaseLawId] = useState<string | null>(null);

  // AI Legal Analysis bar state
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiResearchQuery, setAiResearchQuery] = useState("");
  const [aiResearchAnswer, setAiResearchAnswer] = useState("");
  const [isRunningAiResearch, setIsRunningAiResearch] = useState(false);

  // Case Law Add / Edit / Delete modal state
  const [showCaseLawModal, setShowCaseLawModal] = useState(false);
  const [editingCaseLaw, setEditingCaseLaw] = useState<CaseLaw | null>(null);
  const [deleteTargetCaseLaw, setDeleteTargetCaseLaw] = useState<CaseLaw | null>(null);

  const [clTitle, setClTitle] = useState("");
  const [clCitation, setClCitation] = useState("");
  const [clCourt, setClCourt] = useState("");
  const [clJudge, setClJudge] = useState("");
  const [clDate, setClDate] = useState("");
  const [clPracticeArea, setClPracticeArea] = useState("");
  const [clSectionsText, setClSectionsText] = useState("");
  const [clKeywordsText, setClKeywordsText] = useState("");
  const [clSummary, setClSummary] = useState("");
  const [clRatio, setClRatio] = useState("");
  const [clKeyFindings, setClKeyFindings] = useState("");
  const [clPersonalNotes, setClPersonalNotes] = useState("");
  const [clDocumentUrl, setClDocumentUrl] = useState("");
  const [clCaseId, setClCaseId] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: caseLawsData, isLoading: isLoadingCaseLaws } = useCaseLaws({
    search: searchQuery.trim() || undefined,
    is_favorite: filterFavorite,
    practice_area: filterPracticeArea || undefined,
    court_name: filterCourt || undefined,
    case_id: filterOnlyActiveCase && activeCaseMatter ? activeCaseMatter.id : undefined,
  });
  const caseLaws = caseLawsData?.items || [];

  const createCaseLaw = useCreateCaseLaw();
  const updateCaseLaw = useUpdateCaseLaw();
  const deleteCaseLaw = useDeleteCaseLaw();
  const uploadDoc = useUploadDocument();

  const selectedCaseLaw = useMemo(
    () => caseLaws.find((c) => c.id === selectedCaseLawId) || null,
    [caseLaws, selectedCaseLawId]
  );

  // Dynamic court options from loaded case laws
  const courtOptions = useMemo(() => {
    const set = new Set<string>();
    caseLaws.forEach((c) => {
      if (c.court_name) set.add(c.court_name);
    });
    return Array.from(set).sort();
  }, [caseLaws]);

  // Acts & Sections state
  const [actSearch, setActSearch] = useState("");
  const [actCategory, setActCategory] = useState("All");
  const { acts, isLoading: isLoadingActs } = useActs(actSearch || undefined, actCategory);
  const [selectedAct, setSelectedAct] = useState<Act | null>(null);
  const [actSections, setActSections] = useState<ActSection[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [sectionSearch, setSectionSearch] = useState("");

  useEffect(() => {
    if (!selectedAct) {
      setActSections([]);
      return;
    }
    setIsLoadingSections(true);
    api.get(`/acts/${selectedAct.id}/sections`)
      .then((res) => setActSections(res.data?.sections || []))
      .catch((err) => {
        toast.error(getErrorMessage(err));
        setActSections([]);
      })
      .finally(() => setIsLoadingSections(false));
  }, [selectedAct]);

  const filteredSections = useMemo(() => {
    const q = sectionSearch.trim().toLowerCase();
    if (!q) return actSections;
    return actSections.filter(
      (s) =>
        (s.number || "").toLowerCase().includes(q) ||
        (s.title || "").toLowerCase().includes(q) ||
        (s.content || "").toLowerCase().includes(q)
    );
  }, [actSections, sectionSearch]);

  // Active context identity
  const hasActiveContext = Boolean(activeCustomContext || activeCaseMatter);
  const contextStorageKey = selectedContextKey || "global";
  const activeTitle = activeCustomContext
    ? activeCustomContext.title
    : activeCaseMatter
    ? `${activeCaseMatter.case_no ? activeCaseMatter.case_no + " · " : ""}${activeCaseMatter.title}`
    : "Global Research";
  const activeCourt = activeCustomContext?.court || activeCaseMatter?.court || "";

  // Research Notes (real persistence per context)
  const [notesByContext, setNotesByContext] = useState<Record<string, SavedNoteEntry>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string | null>(null);

  // Arguments Library (real persistence)
  const [savedArguments, setSavedArguments] = useState<SavedArgument[]>([]);
  const [argumentFilterOnlyContext, setArgumentFilterOnlyContext] = useState(false);
  const [argumentSearch, setArgumentSearch] = useState("");
  const [isArgumentModalOpen, setIsArgumentModalOpen] = useState(false);
  const [editingArgument, setEditingArgument] = useState<SavedArgument | null>(null);
  const [argTitle, setArgTitle] = useState("");
  const [argContent, setArgContent] = useState("");

  // Load persisted data on mount
  useEffect(() => {
    try {
      const ctxRaw = localStorage.getItem(CONTEXTS_STORAGE_KEY);
      if (ctxRaw) setSavedContexts(JSON.parse(ctxRaw));
      const notesRaw = localStorage.getItem(NOTES_STORAGE_KEY);
      if (notesRaw) setNotesByContext(JSON.parse(notesRaw));
      const argsRaw = localStorage.getItem(ARGUMENTS_STORAGE_KEY);
      if (argsRaw) setSavedArguments(JSON.parse(argsRaw));
    } catch (e) {
      console.error("Failed to load research storage", e);
    }
  }, []);

  // Load note draft when context changes
  useEffect(() => {
    const entry = notesByContext[contextStorageKey];
    setNoteDraft(entry?.content || "");
    setNoteUpdatedAt(entry?.updatedAt || null);
  }, [contextStorageKey, notesByContext]);

  const persistContexts = (contexts: ResearchContext[]) => {
    setSavedContexts(contexts);
    try {
      localStorage.setItem(CONTEXTS_STORAGE_KEY, JSON.stringify(contexts));
    } catch (e) {
      console.error("Failed to save research contexts", e);
    }
  };

  const handleSaveNotes = () => {
    const updated: Record<string, SavedNoteEntry> = {
      ...notesByContext,
      [contextStorageKey]: {
        content: noteDraft,
        updatedAt: new Date().toISOString(),
      },
    };
    setNotesByContext(updated);
    setNoteUpdatedAt(updated[contextStorageKey].updatedAt);
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(updated));
      toast.success("Research notes saved");
    } catch (e) {
      toast.error("Could not save notes locally");
    }
  };

  const persistArguments = (list: SavedArgument[]) => {
    setSavedArguments(list);
    try {
      localStorage.setItem(ARGUMENTS_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Failed to persist arguments", e);
    }
  };

  const filteredArguments = useMemo(() => {
    const q = argumentSearch.trim().toLowerCase();
    return savedArguments.filter((a) => {
      const matchCtx = !argumentFilterOnlyContext || a.contextKey === contextStorageKey;
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q);
      return matchCtx && matchSearch;
    });
  }, [savedArguments, argumentFilterOnlyContext, contextStorageKey, argumentSearch]);

  // Context handlers
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
      setFilterOnlyActiveCase(false);
      setSuggestions(null);
      return;
    }
    if (val.startsWith("custom_")) {
      const id = val.replace("custom_", "");
      const ctx = savedContexts.find((c) => c.id === id) || null;
      setActiveCustomContext(ctx);
      setActiveCaseMatter(null);
      setFilterOnlyActiveCase(false);
      if (ctx) fetchContextSuggestions(ctx);
    } else if (val.startsWith("case_")) {
      const id = val.replace("case_", "");
      const foundCase = cases.find((c: any) => c.id === id) || null;
      setActiveCaseMatter(foundCase);
      setActiveCustomContext(null);
      if (id) fetchCaseSuggestions(id);
    }
  };

  const fetchCaseSuggestions = async (caseId: string) => {
    setIsLoadingSuggestions(true);
    try {
      const res = await api.get(`/ai/case/${caseId}/suggestions`);
      setSuggestions(res.data);
    } catch {
      setSuggestions({ ai_powered: false, sections: [], judgments: [], arguments: [], drafts: [] });
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
    } catch {
      setSuggestions({ ai_powered: false, sections: [], judgments: [], arguments: [], drafts: [] });
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
      toast.success("Research context updated");
    } else {
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
      toast.success("Research context created");
    }
    setIsContextModalOpen(false);
  };

  const handleDeleteContext = (id: string) => {
    const updated = savedContexts.filter((c) => c.id !== id);
    persistContexts(updated);
    if (selectedContextKey === `custom_${id}`) {
      setSelectedContextKey("");
      setActiveCustomContext(null);
      setSuggestions(null);
    }
    setIsContextModalOpen(false);
    toast.success("Research context removed");
  };

  const handleClearContext = () => {
    setSelectedContextKey("");
    setActiveCustomContext(null);
    setActiveCaseMatter(null);
    setFilterOnlyActiveCase(false);
    setSuggestions(null);
    toast.info("Returned to Global Research mode");
  };

  // Case Law Add / Edit / Upload / Favorite handlers
  const resetCaseLawForm = () => {
    setEditingCaseLaw(null);
    setClTitle("");
    setClCitation("");
    setClCourt("");
    setClJudge("");
    setClDate("");
    setClPracticeArea("");
    setClSectionsText("");
    setClKeywordsText("");
    setClSummary("");
    setClRatio("");
    setClKeyFindings("");
    setClPersonalNotes("");
    setClDocumentUrl("");
    setClCaseId(activeCaseMatter?.id || "");
  };

  const openAddCaseLawModal = () => {
    resetCaseLawForm();
    setShowCaseLawModal(true);
  };

  const openEditCaseLawModal = (cl: CaseLaw) => {
    setEditingCaseLaw(cl);
    setClTitle(cl.title || "");
    setClCitation(cl.citation || "");
    setClCourt(cl.court_name || "");
    setClJudge(cl.judge_name || "");
    setClDate(cl.judgment_date ? String(cl.judgment_date).slice(0, 10) : "");
    setClPracticeArea(cl.practice_area || "");
    setClSectionsText((cl.mapped_sections || []).join(", "));
    setClKeywordsText((cl.keywords || []).join(", "));
    setClSummary(cl.summary || "");
    setClRatio(cl.ratio_decidendi || "");
    setClKeyFindings(cl.key_findings || "");
    setClPersonalNotes(cl.personal_notes || "");
    setClDocumentUrl(cl.document_url || "");
    setClCaseId(cl.case_id || "");
    setShowCaseLawModal(true);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadDoc.mutateAsync({ file, doc_type: "case_law" });
      resetCaseLawForm();
      setClDocumentUrl(res.file_path || res.id || "");
      setClTitle(file.name.replace(/\.pdf$/i, ""));
      setShowCaseLawModal(true);
      toast.success("PDF uploaded — fill in citation details to save");
    } catch {
      // toast handled in hook
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveCaseLaw = async () => {
    if (!clTitle.trim() || !clCitation.trim()) {
      toast.error("Title and Citation are required");
      return;
    }
    const payload = {
      title: clTitle.trim(),
      citation: clCitation.trim(),
      court_name: clCourt.trim() || undefined,
      judge_name: clJudge.trim() || undefined,
      judgment_date: clDate || undefined,
      practice_area: clPracticeArea || undefined,
      mapped_sections: clSectionsText.split(",").map((s) => s.trim()).filter(Boolean),
      keywords: clKeywordsText.split(",").map((s) => s.trim()).filter(Boolean),
      important_paragraphs: editingCaseLaw?.important_paragraphs || [],
      arguments: editingCaseLaw?.arguments || [],
      summary: clSummary.trim() || undefined,
      ratio_decidendi: clRatio.trim() || undefined,
      key_findings: clKeyFindings.trim() || undefined,
      personal_notes: clPersonalNotes.trim() || undefined,
      document_url: clDocumentUrl || undefined,
      is_favorite: editingCaseLaw ? editingCaseLaw.is_favorite : false,
      case_id: clCaseId || null,
    };

    if (editingCaseLaw) {
      const updated = await updateCaseLaw.mutateAsync({ id: editingCaseLaw.id, ...payload });
      setSelectedCaseLawId(updated.id);
    } else {
      const created = await createCaseLaw.mutateAsync(payload);
      setSelectedCaseLawId(created.id);
    }
    setShowCaseLawModal(false);
    resetCaseLawForm();
  };

  const handleToggleFavorite = async (cl: CaseLaw, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    await updateCaseLaw.mutateAsync({ id: cl.id, is_favorite: !cl.is_favorite });
  };

  const handleLinkCaseChange = async (cl: CaseLaw, newCaseId: string) => {
    await updateCaseLaw.mutateAsync({ id: cl.id, case_id: newCaseId || null });
  };

  const handleConfirmDeleteCaseLaw = async () => {
    if (!deleteTargetCaseLaw) return;
    await deleteCaseLaw.mutateAsync(deleteTargetCaseLaw.id);
    if (selectedCaseLawId === deleteTargetCaseLaw.id) {
      setSelectedCaseLawId(null);
    }
    setDeleteTargetCaseLaw(null);
  };

  // AI Legal Analysis handler
  const handleRunAiAnalysis = async () => {
    const q = aiResearchQuery.trim() || searchQuery.trim();
    if (!q) {
      toast.error("Enter a legal question, section, or topic to analyze.");
      return;
    }
    setIsRunningAiResearch(true);
    try {
      const { data } = await api.post("/ai/research", {
        query: q,
        language: "en",
        include_acts: true,
        include_case_laws: true,
      });
      if (!data?.ai_powered || !data?.ai_analysis) {
        setAiResearchAnswer("");
        toast.info("Configure an AI API key in Settings to generate AI legal analysis.");
      } else {
        setAiResearchAnswer(data.ai_analysis);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsRunningAiResearch(false);
    }
  };

  // Arguments Library handlers
  const openNewArgumentModal = () => {
    setEditingArgument(null);
    setArgTitle("");
    setArgContent("");
    setIsArgumentModalOpen(true);
  };

  const openEditArgumentModal = (arg: SavedArgument) => {
    setEditingArgument(arg);
    setArgTitle(arg.title);
    setArgContent(arg.content);
    setIsArgumentModalOpen(true);
  };

  const handleSaveArgument = () => {
    if (!argTitle.trim() || !argContent.trim()) {
      toast.error("Both argument title and content are required");
      return;
    }
    if (editingArgument) {
      const updated = savedArguments.map((a) =>
        a.id === editingArgument.id
          ? { ...a, title: argTitle.trim(), content: argContent.trim(), updatedAt: new Date().toISOString() }
          : a
      );
      persistArguments(updated);
      toast.success("Argument updated");
    } else {
      const newArg: SavedArgument = {
        id: "arg_" + Date.now(),
        title: argTitle.trim(),
        content: argContent.trim(),
        contextKey: contextStorageKey,
        contextLabel: activeTitle,
        updatedAt: new Date().toISOString(),
      };
      persistArguments([newArg, ...savedArguments]);
      toast.success("Argument saved");
    }
    setIsArgumentModalOpen(false);
    setArgTitle("");
    setArgContent("");
  };

  const handleDeleteArgument = (id: string) => {
    persistArguments(savedArguments.filter((a) => a.id !== id));
    toast.success("Argument removed");
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <Header
        title="Legal Research & Case Laws"
        subtitle="Manage firm judgments, browse Bare Acts, store research notes, and organize arguments"
      />

      {/* ── Matter & Research Context Header Bar ──────────────────────────── */}
      <div className="px-6 py-3.5 bg-white border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3.5 flex-1 min-w-[300px]">
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
                className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[13px] font-semibold text-gray-900 rounded-lg px-3 py-1.5 outline-none cursor-pointer max-w-[340px] truncate transition-colors"
              >
                <option value="">-- Global Research (No Matter Selected) --</option>
                {savedContexts.length > 0 && (
                  <optgroup label="Custom Research Contexts">
                    {savedContexts.map((ctx) => (
                      <option key={`custom_${ctx.id}`} value={`custom_${ctx.id}`}>
                        {ctx.title} {ctx.court ? `(${ctx.court})` : ""}
                      </option>
                    ))}
                  </optgroup>
                )}
                {cases.length > 0 && (
                  <optgroup label="Matter / Case Files">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#013B36] hover:bg-[#014D46] text-white text-[12px] font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Research Context</span>
              </button>
            </div>
          </div>
        </div>

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
        <div className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB]">
          {/* Tabs */}
          <div className="flex px-6 pt-3 gap-2 border-b border-gray-200 bg-white overflow-x-auto">
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 border-b-2 text-[13px] font-semibold transition-all whitespace-nowrap",
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

            {/* ── TAB 1: CASE LAW LIBRARY & SEARCH ──────────────────────────── */}
            {activeTab === "library" && (
              <div className="max-w-[1600px] mx-auto flex flex-col gap-5">

                {/* Top Toolbar */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by title, citation, court, judge, ratio decidendi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFilterFavorite(undefined)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold transition-colors",
                          filterFavorite === undefined
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        All Judgments
                      </button>
                      <button
                        type="button"
                        onClick={() => setFilterFavorite(filterFavorite === true ? undefined : true)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5",
                          filterFavorite === true
                            ? "bg-amber-500 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        )}
                      >
                        <Bookmark className="w-3.5 h-3.5" /> Favorites
                      </button>

                      {activeCaseMatter && (
                        <button
                          type="button"
                          onClick={() => setFilterOnlyActiveCase((v) => !v)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5",
                            filterOnlyActiveCase
                              ? "bg-emerald-600 text-white"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          )}
                        >
                          <Briefcase className="w-3.5 h-3.5" /> Linked to Active Matter
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowFilters((v) => !v)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5",
                          showFilters || filterPracticeArea || filterCourt
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        <Filter className="w-3.5 h-3.5" /> Filters
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAiAnalysis((v) => !v)}
                        className={cn(
                          "px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5",
                          showAiAnalysis
                            ? "bg-[#013B36] text-white border-[#013B36]"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> AI Research
                      </button>

                      <input
                        type="file"
                        accept="application/pdf"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handlePdfUpload}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadDoc.isPending}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-60"
                      >
                        <Upload className="w-3.5 h-3.5" /> {uploadDoc.isPending ? "Uploading..." : "Upload PDF"}
                      </button>

                      <button
                        type="button"
                        onClick={openAddCaseLawModal}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Case Law
                      </button>
                    </div>
                  </div>

                  {/* Expanded Court & Practice Area Filters */}
                  {showFilters && (
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-end gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Practice Area</label>
                        <select
                          value={filterPracticeArea}
                          onChange={(e) => setFilterPracticeArea(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        >
                          <option value="">All Practice Areas</option>
                          {STANDARD_PRACTICE_AREAS.map((pa) => (
                            <option key={pa} value={pa}>{pa}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Court</label>
                        <select
                          value={filterCourt}
                          onChange={(e) => setFilterCourt(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        >
                          <option value="">All Courts</option>
                          {courtOptions.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      {(filterPracticeArea || filterCourt || filterFavorite !== undefined || filterOnlyActiveCase || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setFilterFavorite(undefined);
                            setFilterPracticeArea("");
                            setFilterCourt("");
                            setFilterOnlyActiveCase(false);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:text-indigo-600"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  )}

                  {/* Collapsible AI Research Box */}
                  {showAiAnalysis && (
                    <div className="pt-3 border-t border-gray-100 space-y-3">
                      {!aiStatus?.configured && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            Configure your OpenAI or compatible API key in Settings to run live AI legal research analysis.
                          </span>
                          <button
                            type="button"
                            onClick={() => router.push("/settings")}
                            className="inline-flex items-center gap-1 font-bold underline shrink-0"
                          >
                            <Settings className="w-3.5 h-3.5" /> Settings
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiResearchQuery}
                          onChange={(e) => setAiResearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleRunAiAnalysis()}
                          placeholder="Ask a legal research question (e.g. Bail conditions under NDPS Act Section 37)..."
                          className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleRunAiAnalysis}
                          disabled={isRunningAiResearch}
                          className="px-4 py-2 bg-[#013B36] text-white rounded-xl text-xs font-semibold hover:bg-[#014D46] disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {isRunningAiResearch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                          Analyze
                        </button>
                      </div>
                      {aiResearchAnswer && (
                        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {aiResearchAnswer}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Master-Detail Repository */}
                <div className="flex flex-col xl:flex-row gap-6">
                  {/* Left List Pane */}
                  <div className="w-full xl:w-[440px] flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm h-[calc(100vh-300px)] min-h-[420px] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <span>Saved Judgments ({caseLaws.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      {isLoadingCaseLaws ? (
                        <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                          Loading judgments...
                        </div>
                      ) : caseLaws.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm flex flex-col items-center">
                          <Scale className="w-9 h-9 text-gray-300 mb-3" />
                          <p className="font-semibold text-gray-700 mb-1">No case laws found</p>
                          <p className="text-xs text-gray-400 mb-4">Add judgments manually or upload a judgment PDF to build your library.</p>
                          <button
                            type="button"
                            onClick={openAddCaseLawModal}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                          >
                            + Add Case Law
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {caseLaws.map((cl) => (
                            <div
                              key={cl.id}
                              onClick={() => setSelectedCaseLawId(cl.id)}
                              className={cn(
                                "text-left p-4 rounded-xl border transition-all cursor-pointer group",
                                selectedCaseLawId === cl.id
                                  ? "border-indigo-500 bg-indigo-50/30 shadow-sm ring-1 ring-indigo-500"
                                  : "border-gray-100 hover:bg-gray-50 hover:border-gray-200"
                              )}
                            >
                              <div className="flex justify-between items-start gap-2 mb-1.5">
                                <span className="font-bold text-gray-800 text-[14px] leading-snug line-clamp-2">{cl.title}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleFavorite(cl, e)}
                                  title={cl.is_favorite ? "Remove from Favorites" : "Mark as Favorite"}
                                  className="shrink-0 p-1 rounded hover:bg-amber-50"
                                >
                                  {cl.is_favorite ? (
                                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                                  ) : (
                                    <Bookmark className="w-4 h-4 text-gray-300 group-hover:text-amber-400" />
                                  )}
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                  {cl.citation || "Unreported"}
                                </span>
                                {cl.judgment_date && (
                                  <span className="text-[11px] text-gray-500">
                                    {format(new Date(cl.judgment_date), "MMM yyyy")}
                                  </span>
                                )}
                                {cl.case_no && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    {cl.case_no}
                                  </span>
                                )}
                              </div>
                              <div className="text-[12px] text-gray-500 line-clamp-1">{cl.court_name || "Court not specified"}</div>
                              {cl.mapped_sections && cl.mapped_sections.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {cl.mapped_sections.slice(0, 3).map((sec, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-100">
                                      {sec}
                                    </span>
                                  ))}
                                  {cl.mapped_sections.length > 3 && (
                                    <span className="px-1.5 py-0.5 bg-gray-50 text-gray-500 rounded text-[10px] font-medium border border-gray-200">
                                      +{cl.mapped_sections.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Judgment Viewer */}
                  <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm h-[calc(100vh-300px)] min-h-[420px] flex flex-col overflow-hidden">
                    {selectedCaseLaw ? (
                      <>
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
                          <h2 className="font-bold text-gray-800 text-sm">Judgment Viewer</h2>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${selectedCaseLaw.title} (${selectedCaseLaw.citation || ""})`);
                                toast.success("Citation copied");
                              }}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" /> Copy Citation
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFavorite(selectedCaseLaw)}
                              className={cn(
                                "px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors",
                                selectedCaseLaw.is_favorite
                                  ? "bg-amber-50 border-amber-200 text-amber-700"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {selectedCaseLaw.is_favorite ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                              {selectedCaseLaw.is_favorite ? "Favorited" : "Favorite"}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCaseLawModal(selectedCaseLaw)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTargetCaseLaw(selectedCaseLaw)}
                              className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                          <div>
                            <h1 className="text-2xl font-bold text-gray-900 leading-snug mb-3">{selectedCaseLaw.title}</h1>
                            <div className="flex flex-wrap gap-4 text-sm mb-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Citation:</span>
                                <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{selectedCaseLaw.citation || "N/A"}</span>
                              </div>
                              {selectedCaseLaw.court_name && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Court:</span>
                                  <span className="font-medium text-gray-900">{selectedCaseLaw.court_name}</span>
                                </div>
                              )}
                              {selectedCaseLaw.judge_name && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Judge:</span>
                                  <span className="font-medium text-gray-900">{selectedCaseLaw.judge_name}</span>
                                </div>
                              )}
                              {selectedCaseLaw.judgment_date && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Date:</span>
                                  <span className="font-medium text-gray-900">{format(new Date(selectedCaseLaw.judgment_date), "dd MMM yyyy")}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {selectedCaseLaw.practice_area && (
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
                                  {selectedCaseLaw.practice_area}
                                </span>
                              )}
                              {selectedCaseLaw.keywords?.map((kw, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Mapped Sections & Real Linked Matter */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                              <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                <Scale className="w-4 h-4" /> Mapped Sections
                              </h3>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCaseLaw.mapped_sections?.length > 0 ? (
                                  selectedCaseLaw.mapped_sections.map((sec, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-white text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                                      {sec}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-500">No sections mapped yet.</span>
                                )}
                              </div>
                            </div>

                            <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100 space-y-2">
                              <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Briefcase className="w-4 h-4" /> Linked Matter
                              </h3>
                              {selectedCaseLaw.case_id && (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/cases/${selectedCaseLaw.case_id}`)}
                                  className="w-full text-left bg-white p-2.5 rounded-lg border border-emerald-200 hover:border-emerald-400 flex items-center justify-between transition-colors"
                                >
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold text-emerald-700">{selectedCaseLaw.case_no || "LINKED CASE"}</div>
                                    <div className="text-xs font-semibold text-gray-900 truncate">{selectedCaseLaw.case_title || "View Matter"}</div>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                </button>
                              )}
                              <select
                                value={selectedCaseLaw.case_id || ""}
                                onChange={(e) => handleLinkCaseChange(selectedCaseLaw, e.target.value)}
                                className="w-full text-xs bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                              >
                                <option value="">-- Not linked to any matter --</option>
                                {cases.map((c: any) => (
                                  <option key={c.id} value={c.id}>{c.case_no} — {c.title}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {selectedCaseLaw.document_url && (
                            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-600" />
                                Attached PDF Reference: <span className="font-mono text-gray-500">{selectedCaseLaw.document_url}</span>
                              </span>
                            </div>
                          )}

                          {selectedCaseLaw.summary && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2">Summary</h3>
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedCaseLaw.summary}
                              </div>
                            </div>
                          )}

                          {selectedCaseLaw.ratio_decidendi && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2">Ratio Decidendi</h3>
                              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-gray-900 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                                {selectedCaseLaw.ratio_decidendi}
                              </div>
                            </div>
                          )}

                          {selectedCaseLaw.key_findings && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2">Key Findings</h3>
                              <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedCaseLaw.key_findings}
                              </div>
                            </div>
                          )}

                          {selectedCaseLaw.personal_notes && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2">Personal Research Notes</h3>
                              <div className="bg-[#fffdf0] p-4 rounded-xl border border-amber-100 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                                {selectedCaseLaw.personal_notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/60">
                        <Scale className="w-14 h-14 text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-800 mb-1.5">Select or Add a Case Law</h3>
                        <p className="text-sm text-gray-500 max-w-md mb-5">
                          Search your firm&apos;s repository or select a judgment on the left to read its ratio decidendi, mapped sections, and linked matter.
                        </p>
                        <button
                          type="button"
                          onClick={openAddCaseLawModal}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                        >
                          + Add Case Law
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 2: ACTS & SECTIONS ──────────────────────────────────── */}
            {activeTab === "acts" && (
              <div className="max-w-6xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={actSearch}
                        onChange={(e) => setActSearch(e.target.value)}
                        placeholder="Search Bare Acts..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:bg-white"
                      />
                    </div>
                    <select
                      value={actCategory}
                      onChange={(e) => setActCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                    >
                      <option value="All">All Categories</option>
                      <option value="Criminal">Criminal</option>
                      <option value="Civil">Civil</option>
                      <option value="Constitutional">Constitutional</option>
                      <option value="Evidence">Evidence</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/bare-acts")}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Full Bare Acts Reader
                  </button>
                </div>

                {isLoadingActs ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#013B36]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    <div className="lg:col-span-5 space-y-2.5 max-h-[62vh] overflow-y-auto pr-1">
                      {acts.map((act) => (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() => {
                            setSelectedAct(act);
                            setSectionSearch("");
                          }}
                          className={cn(
                            "w-full text-left bg-white rounded-xl border p-4 transition-colors",
                            selectedAct?.id === act.id
                              ? "border-[#013B36] bg-emerald-50/30 ring-1 ring-[#013B36]"
                              : "border-gray-200 hover:border-[#013B36]"
                          )}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-semibold text-sm text-gray-900">{act.name}</span>
                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 shrink-0">{act.category}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{act.short_name} · {act.sections} Sections</p>
                        </button>
                      ))}
                      {acts.length === 0 && (
                        <div className="p-8 text-center text-sm text-gray-500 bg-white rounded-xl border border-gray-200">
                          No matching acts found.
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 p-5 max-h-[62vh] flex flex-col">
                      {selectedAct ? (
                        <>
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100 mb-3">
                            <div>
                              <h3 className="font-bold text-gray-900 text-base">{selectedAct.name}</h3>
                              <p className="text-xs text-gray-500">{selectedAct.category}</p>
                            </div>
                            <input
                              type="text"
                              value={sectionSearch}
                              onChange={(e) => setSectionSearch(e.target.value)}
                              placeholder="Filter sections..."
                              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                            />
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-3">
                            {isLoadingSections ? (
                              <div className="py-10 text-center text-xs text-gray-500">Loading sections...</div>
                            ) : filteredSections.length === 0 ? (
                              <div className="py-10 text-center text-xs text-gray-500">No sections found for this act.</div>
                            ) : (
                              filteredSections.map((sec) => (
                                <div key={sec.id} className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="font-bold text-xs text-[#013B36]">
                                      Section {sec.number}{sec.title ? ` — ${sec.title}` : ""}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(`Section ${sec.number}: ${sec.title}\n${sec.content}`);
                                        toast.success("Section copied");
                                      }}
                                      className="text-[11px] font-semibold text-indigo-600 hover:underline shrink-0"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{sec.content}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-500">
                          <BookOpen className="w-10 h-10 text-gray-300 mb-3" />
                          <p className="text-sm font-semibold text-gray-700">Select an Act to read its sections</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: RESEARCH NOTES (REAL LOCAL PERSISTENCE) ───────────── */}
            {activeTab === "notes" && (
              <div className="max-w-4xl mx-auto flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-[#013B36]">Research Notes</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Scoped to: <strong>{activeTitle}</strong>
                      {noteUpdatedAt && ` · Last saved ${new Date(noteUpdatedAt).toLocaleString("en-IN")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(noteDraft);
                        toast.success("Notes copied to clipboard");
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNotes}
                      className="flex items-center gap-1.5 bg-[#013B36] hover:bg-[#014D46] text-white px-4 py-2 rounded-xl text-xs font-semibold"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Notes
                    </button>
                  </div>
                </div>
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Write citations, case notes, hearing points, or statutory interpretations here. Notes are saved per Research Context."
                  className="w-full bg-white border border-gray-200 rounded-2xl p-5 text-sm text-charcoal leading-relaxed outline-none focus:border-[#6EE7B7] min-h-[420px]"
                  rows={18}
                />
              </div>
            )}

            {/* ── TAB 4: ARGUMENTS LIBRARY (REAL LOCAL PERSISTENCE) ────────── */}
            {activeTab === "arguments" && (
              <div className="max-w-5xl mx-auto space-y-5">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={argumentSearch}
                        onChange={(e) => setArgumentSearch(e.target.value)}
                        placeholder="Search saved arguments..."
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none focus:bg-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setArgumentFilterOnlyContext((v) => !v)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-semibold border transition-colors",
                        argumentFilterOnlyContext
                          ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                          : "bg-white border-gray-200 text-gray-600"
                      )}
                    >
                      {argumentFilterOnlyContext ? `Context: ${activeTitle}` : "All Contexts"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push("/draft-workspace?mode=ai")}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Open Draft Workspace →
                    </button>
                    <button
                      type="button"
                      onClick={openNewArgumentModal}
                      className="flex items-center gap-1.5 bg-[#013B36] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#014D46]"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Argument
                    </button>
                  </div>
                </div>

                {filteredArguments.length === 0 ? (
                  <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300">
                    <MessageSquare className="w-9 h-9 text-gray-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-gray-800 mb-1">No saved arguments yet</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Build reusable legal grounds and submissions for your cases, then copy them into any pleading.
                    </p>
                    <button
                      type="button"
                      onClick={openNewArgumentModal}
                      className="px-4 py-2 bg-[#013B36] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Argument
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredArguments.map((arg) => (
                      <div key={arg.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-gray-900">{arg.title}</h4>
                            <span className="text-[11px] text-gray-500">Context: {arg.contextLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(`${arg.title}\n\n${arg.content}`);
                                toast.success("Argument copied to clipboard");
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditArgumentModal(arg)}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-gray-100"
                              title="Edit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteArgument(arg.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{arg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Context-Based AI Research Insights */}
        <AnimatePresence>
          {hasActiveContext && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 hidden lg:block"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[#013B36]">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-bold text-[14px]">AI Context Insights</h3>
                  </div>
                  <button
                    onClick={handleClearContext}
                    className="text-gray-400 hover:text-gray-600"
                    title="Close context panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isLoadingSuggestions ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-3">
                    <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
                    <p className="text-xs font-medium text-muted">Analyzing legal context...</p>
                  </div>
                ) : suggestions?.ai_powered ? (
                  <div className="space-y-5">
                    {suggestions.sections && suggestions.sections.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Statutory Sections</h4>
                        <div className="space-y-1.5">
                          {suggestions.sections.map((section, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setActiveTab("library");
                                setSearchQuery(section);
                              }}
                              className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer hover:border-emerald-400"
                            >
                              <span className="text-xs font-medium text-charcoal">{section}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-muted" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.judgments && suggestions.judgments.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Relevant Precedents</h4>
                        <div className="space-y-1.5">
                          {suggestions.judgments.map((j, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs text-charcoal">
                              {j}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {suggestions.arguments && suggestions.arguments.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Suggested Grounds</h4>
                        <div className="space-y-1.5">
                          {suggestions.arguments.map((arg, i) => (
                            <div key={i} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-charcoal">
                              {arg}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                    <p className="font-semibold">AI Context Suggestions Inactive</p>
                    <p>Configure an AI API key in Settings to generate automatic statutory and precedent suggestions for this context.</p>
                    <button
                      type="button"
                      onClick={() => router.push("/settings")}
                      className="inline-flex items-center gap-1 font-bold underline"
                    >
                      <Settings className="w-3.5 h-3.5" /> Configure in Settings
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Add / Edit Case Law Modal ─────────────────────────────────────── */}
      <Modal
        open={showCaseLawModal}
        onClose={() => setShowCaseLawModal(false)}
        title={editingCaseLaw ? "Edit Case Law" : "Add Case Law"}
        size="lg"
      >
        <div className="space-y-4 py-1 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Case Title / Parties *</label>
              <input value={clTitle} onChange={(e) => setClTitle(e.target.value)} placeholder="e.g. State of Maharashtra vs XYZ" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Citation *</label>
              <input value={clCitation} onChange={(e) => setClCitation(e.target.value)} placeholder="e.g. (2024) 4 SCC 123" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Court Name</label>
              <input value={clCourt} onChange={(e) => setClCourt(e.target.value)} placeholder="e.g. Supreme Court of India / Bombay HC" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Judge Name</label>
              <input value={clJudge} onChange={(e) => setClJudge(e.target.value)} placeholder="e.g. Hon'ble Justice A. B. Joshi" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Judgment Date</label>
              <input type="date" value={clDate} onChange={(e) => setClDate(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Practice Area</label>
              <select value={clPracticeArea} onChange={(e) => setClPracticeArea(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white">
                <option value="">-- Select Practice Area --</option>
                {STANDARD_PRACTICE_AREAS.map((pa) => (
                  <option key={pa} value={pa}>{pa}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mapped Sections (comma-separated)</label>
              <input value={clSectionsText} onChange={(e) => setClSectionsText(e.target.value)} placeholder="e.g. Sec 138 NI Act, Sec 139 NI Act" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Keywords (comma-separated)</label>
              <input value={clKeywordsText} onChange={(e) => setClKeywordsText(e.target.value)} placeholder="e.g. cheque dishonour, security" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Link to Firm Matter (Optional)</label>
            <select value={clCaseId} onChange={(e) => setClCaseId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white">
              <option value="">-- Not linked --</option>
              {cases.map((c: any) => (
                <option key={c.id} value={c.id}>{c.case_no} — {c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Summary</label>
            <textarea value={clSummary} onChange={(e) => setClSummary(e.target.value)} rows={3} placeholder="Brief overview of facts and holding..." className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Ratio Decidendi</label>
            <textarea value={clRatio} onChange={(e) => setClRatio(e.target.value)} rows={2} placeholder="Binding legal principle laid down..." className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Key Findings</label>
              <textarea value={clKeyFindings} onChange={(e) => setClKeyFindings(e.target.value)} rows={2} placeholder="Important paragraphs or court observations..." className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Personal Notes</label>
              <textarea value={clPersonalNotes} onChange={(e) => setClPersonalNotes(e.target.value)} rows={2} placeholder="How to apply in your submissions..." className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
            </div>
          </div>

          {clDocumentUrl && (
            <div className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-2 rounded-lg">
              Attached PDF: <span className="font-mono">{clDocumentUrl}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button type="button" onClick={() => setShowCaseLawModal(false)} className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCaseLaw}
              disabled={createCaseLaw.isPending || updateCaseLaw.isPending || !clTitle.trim() || !clCitation.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              {createCaseLaw.isPending || updateCaseLaw.isPending ? "Saving..." : editingCaseLaw ? "Save Changes" : "Save Case Law"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTargetCaseLaw)}
        onClose={() => setDeleteTargetCaseLaw(null)}
        onConfirm={handleConfirmDeleteCaseLaw}
        title="Delete Case Law"
        message={`Delete "${deleteTargetCaseLaw?.title}" from your repository?`}
        confirmLabel="Delete"
        danger
        loading={deleteCaseLaw.isPending}
      />

      {/* ── Add / Edit Research Context Modal ──────────────────────────────── */}
      <Modal
        open={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        title={editingContextId ? "Edit Research Context" : "Add Research Context"}
        description="Save matter facts, applicable statutes, and legal issues to scope your notes and arguments."
        size="lg"
      >
        <div className="space-y-4 py-2">
          {!editingContextId && (
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Quick Preset Templates
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
              <label className="block text-xs font-semibold text-charcoal mb-1">Context Title *</label>
              <input
                type="text"
                value={contextTitle}
                onChange={(e) => setContextTitle(e.target.value)}
                placeholder="e.g., Anticipatory Bail in NDPS Matter"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Court / Tribunal</label>
              <input
                type="text"
                value={contextCourt}
                onChange={(e) => setContextCourt(e.target.value)}
                placeholder="e.g., Bombay High Court"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Acts &amp; Sections</label>
            <input
              type="text"
              value={contextActs}
              onChange={(e) => setContextActs(e.target.value)}
              placeholder="e.g., NDPS Act Section 37, BNSS Section 482"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Key Legal Issues</label>
            <input
              type="text"
              value={contextIssues}
              onChange={(e) => setContextIssues(e.target.value)}
              placeholder="Core questions of law..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Brief Facts</label>
            <textarea
              value={contextFacts}
              onChange={(e) => setContextFacts(e.target.value)}
              placeholder="Summarize key facts..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none h-24 resize-none"
            />
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
            {editingContextId ? (
              <button
                type="button"
                onClick={() => handleDeleteContext(editingContextId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Context
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsContextModalOpen(false)} className="px-4 py-2 text-xs font-medium text-muted hover:bg-gray-50 rounded-lg">
                Cancel
              </button>
              <button type="button" onClick={handleSaveContext} className="px-5 py-2 text-xs font-semibold text-white bg-[#013B36] hover:bg-[#014D46] rounded-lg">
                {editingContextId ? "Save Changes" : "Apply Context"}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── New / Edit Argument Modal ──────────────────────────────────────── */}
      <Modal
        open={isArgumentModalOpen}
        onClose={() => setIsArgumentModalOpen(false)}
        title={editingArgument ? "Edit Argument" : "Add New Argument"}
        description="Save a reusable legal submission or ground in your Arguments Library."
        size="md"
      >
        <div className="space-y-4 py-2">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Argument Title *</label>
            <input
              type="text"
              value={argTitle}
              onChange={(e) => setArgTitle(e.target.value)}
              placeholder="e.g., Non-compliance with mandatory search safeguards"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Argument Content *</label>
            <textarea
              value={argContent}
              onChange={(e) => setArgContent(e.target.value)}
              placeholder="Draft your legal ground or submission..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] outline-none h-36 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setIsArgumentModalOpen(false)} className="px-4 py-2 text-xs font-medium text-muted hover:bg-gray-50 rounded-lg">
              Cancel
            </button>
            <button type="button" onClick={handleSaveArgument} className="px-4 py-2 text-xs font-semibold text-white bg-[#013B36] rounded-lg hover:bg-[#014D46]">
              {editingArgument ? "Save Changes" : "Save Argument"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
