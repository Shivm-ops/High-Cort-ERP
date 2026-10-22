"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDriveUpload,
  FolderOpen,
  FileSpreadsheet,
  Download,
  History,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  Upload,
  FileUp,
  FolderUp,
  ShieldCheck,
  Check,
  X,
  FileArchive,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  Database,
  Trash2,
  AlertTriangle,
  Eye,
  Edit3,
  Copy,
  CheckSquare,
  Square,
  Filter,
  Lock,
  FileCheck,
  CornerDownRight,
  Wand2
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, API_URL, getErrorMessage } from "@/lib/api";
import { useCases } from "@/lib/hooks/useCases";
import { useClients } from "@/lib/hooks/useClients";
import {
  BridgeUploadItem,
  ClientDocument,
  useDataBridgeHistory,
  useClientDocuments,
  uploadBridgeFile,
  analyzeBridgeFile,
  previewMigrationFile,
  validateMigrationData,
  executeMigration,
  MigrationPreviewResult,
  MigrationValidationResult,
  MigrationExecutionResult,
  validatePracticeRestore,
  executePracticeRestore,
  getDocumentContent,
  aiDraftImprove,
  updateDocument,
  exportClientDocuments,
} from "@/lib/hooks/useDataBridge";
import { generateDocx } from "@/lib/exportDocx";

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function resolveFullStreamUrl(relativeUrl: string): string {
  if (!relativeUrl) return "";
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }
  const root = API_URL.replace("/api/v1", "");
  return `${root}${relativeUrl}`;
}

const DOC_TYPES = [
  { value: "court_document", label: "Pleadings & Petitions" },
  { value: "order", label: "Court Orders & Judgments" },
  { value: "notice", label: "Notices & Demands" },
  { value: "reply", label: "Replies & Rejoinders" },
  { value: "evidence_document", label: "Evidence & Annexures" },
  { value: "identity_document", label: "Client Identity / KYC" },
  { value: "medical_record", label: "Medical Records" },
  { value: "bank_record", label: "Bank & Financial Records" },
  { value: "other", label: "Other / Unclassified" },
];

const AI_OPERATIONS = [
  { id: "improve_grammar", label: "Improve Language & Grammar", desc: "Refines flow and fixes typos while retaining legal accuracy" },
  { id: "make_professional", label: "Make More Professional", desc: "Elevates tone to match Indian High Court standards" },
  { id: "restructure", label: "Rewrite & Restructure", desc: "Organizes into numbered legal paragraphs and prayer" },
  { id: "summarize", label: "Summarize Document", desc: "Extracts parties, core facts, key dates, charges, and relief" },
  { id: "prepare_draft", label: "Prepare Court Draft", desc: "Drafts formal court pleading based on document facts" },
  { id: "revise_with_instructions", label: "Revise with Instructions", desc: "Custom revisions guided by advocate instructions" },
  { id: "compare_draft", label: "Compare Original vs Proposed", desc: "Clause-by-clause comparison and impact report" },
  { id: "generate_first_draft", label: "Generate First Draft", desc: "Creates fresh pleading from given facts and instructions" },
];

export default function DataBridgePage() {
  const [activeTab, setActiveTab] = useState<
    "import" | "library" | "export" | "migrate" | "backup" | "history"
  >("import");

  const { data: casesData } = useCases({ limit: 500 });
  const { data: clientsData } = useClients({ limit: 500 });
  const cases = casesData?.cases || [];
  const clients = clientsData?.clients || [];

  const { data: historyItems, refetch: refetchHistory } = useDataBridgeHistory();

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: IMPORT DOCUMENTS STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [uploadQueue, setUploadQueue] = useState<BridgeUploadItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [enableOcr, setEnableOcr] = useState<boolean>(true);
  const [autoClassify, setAutoClassify] = useState<boolean>(true);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Filter cases strictly by selected client
  const clientCases = useMemo(() => {
    if (!selectedClientId) return cases;
    return cases.filter((c: any) => c.client_id === selectedClientId);
  }, [cases, selectedClientId]);

  const selectedClientObj = useMemo(() => {
    return clients.find((c: any) => c.id === selectedClientId);
  }, [clients, selectedClientId]);

  const handleFilesAdded = async (files: FileList | File[], isFolder = false) => {
    const newItems: BridgeUploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = (file as any).webkitRelativePath || file.name;
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      if (["exe", "bat", "sh", "dll"].includes(ext)) {
        toast.error(`Skipped prohibited file: ${file.name}`);
        continue;
      }

      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: ext,
        relativePath: isFolder ? relPath : undefined,
        status: "pending",
        progress: 0,
        docType: "other",
        caseId: selectedCaseId || undefined,
        clientId: selectedClientId || undefined,
        clientName: selectedClientObj?.name,
      });
    }

    if (newItems.length === 0) return;
    setUploadQueue((prev) => [...prev, ...newItems]);
    toast.info(`Added ${newItems.length} file(s) to import queue`);

    // AI Classification & Hint discovery
    for (const item of newItems) {
      if (item.size < 5 * 1024 * 1024) {
        analyzeBridgeFile(item.file)
          .then((res) => {
            setUploadQueue((current) =>
              current.map((q) => {
                if (q.id === item.id) {
                  return {
                    ...q,
                    docType: res.suggested_doc_type || q.docType,
                    confidence: res.confidence,
                    hints: res.hints,
                  };
                }
                return q;
              })
            );
          })
          .catch(() => {});
      }
    }
  };

  const startQueueUpload = async () => {
    if (isProcessingQueue) return;
    const pending = uploadQueue.filter((i) => i.status === "pending" || i.status === "error");
    if (pending.length === 0) {
      toast.info("No pending files to import");
      return;
    }

    setIsProcessingQueue(true);
    let successCount = 0;
    let failCount = 0;

    for (const item of pending) {
      setUploadQueue((q) => q.map((it) => (it.id === item.id ? { ...it, status: "uploading", progress: 10 } : it)));

      try {
        const res = await uploadBridgeFile(item.file, {
          caseId: item.caseId || selectedCaseId || undefined,
          clientId: item.clientId || selectedClientId || undefined,
          docType: item.docType,
          relativePath: item.relativePath,
          autoClassify: autoClassify,
          onProgress: (p) => {
            setUploadQueue((q) => q.map((it) => (it.id === item.id ? { ...it, progress: p } : it)));
          },
        });

        successCount++;
        setUploadQueue((q) =>
          q.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: "completed",
                  progress: 100,
                  docId: res.id,
                  previewUrl: res.preview_url,
                  downloadUrl: res.download_url,
                  hashSha256: res.hash_sha256,
                  ocrProcessed: res.ocr_processed,
                  caseTitle: res.case_title,
                  clientName: res.client_name,
                }
              : it
          )
        );
      } catch (err: any) {
        failCount++;
        const msg = getErrorMessage(err);
        setUploadQueue((q) =>
          q.map((it) => (it.id === item.id ? { ...it, status: "error", errorMessage: msg } : it))
        );
      }
    }

    setIsProcessingQueue(false);
    refetchHistory();
    if (failCount === 0) {
      toast.success(`Successfully imported all ${successCount} document(s)!`);
    } else {
      toast.warning(`Imported ${successCount} file(s), ${failCount} failed. You can retry failed files.`);
    }
  };

  const clearCompleted = () => {
    setUploadQueue((prev) => prev.filter((i) => i.status !== "completed"));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 2: CLIENT DOCUMENT LIBRARY STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [libClientId, setLibClientId] = useState<string>("");
  const [libCaseId, setLibCaseId] = useState<string>("");
  const [libDocType, setLibDocType] = useState<string>("all");
  const [libSearch, setLibSearch] = useState<string>("");
  const [libUnassignedOnly, setLibUnassignedOnly] = useState<boolean>(false);

  const { data: libData, isLoading: libLoading, refetch: refetchLib } = useClientDocuments({
    clientId: libClientId || undefined,
    caseId: libCaseId || undefined,
    docType: libDocType !== "all" ? libDocType : undefined,
    search: libSearch || undefined,
    unassignedOnly: libUnassignedOnly,
  });

  const libDocuments = libData?.documents || [];

  // Filter cases in library by selected client
  const libClientCases = useMemo(() => {
    if (!libClientId) return cases;
    return cases.filter((c: any) => c.client_id === libClientId);
  }, [cases, libClientId]);

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 3: CLIENT-WISE EXPORT STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [exportClientId, setExportClientId] = useState<string>("");
  const [exportCaseFilter, setExportCaseFilter] = useState<string>("");
  const [exportSelectedDocIds, setExportSelectedDocIds] = useState<string[]>([]);
  const [isExportingClient, setIsExportingClient] = useState<boolean>(false);

  const { data: exportClientDocsData } = useClientDocuments({
    clientId: exportClientId || undefined,
    caseId: exportCaseFilter || undefined,
  });

  const exportDocs = exportClientDocsData?.documents || [];

  const handleSelectAllExportDocs = () => {
    if (exportSelectedDocIds.length === exportDocs.length) {
      setExportSelectedDocIds([]);
    } else {
      setExportSelectedDocIds(exportDocs.map((d) => d.id));
    }
  };

  const handleToggleExportDoc = (id: string) => {
    setExportSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleExportClientDocuments = async () => {
    if (!exportClientId) {
      toast.error("Please select a client to export");
      return;
    }
    setIsExportingClient(true);
    try {
      const res = await exportClientDocuments(
        exportClientId,
        exportCaseFilter || undefined,
        exportSelectedDocIds.length > 0 ? exportSelectedDocIds : undefined
      );

      const disposition = res.headers["content-disposition"] || "";
      let filename = "Client_Documents_Export.zip";
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/zip" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Export archive downloaded: ${filename}`);
      refetchHistory();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsExportingClient(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 4: LEGACY DATA MIGRATION STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [migrationStep, setMigrationStep] = useState<1 | 2 | 3 | 4>(1);
  const [migrationEntity, setMigrationEntity] = useState<"client" | "case">("client");
  const [migrationFile, setMigrationFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<MigrationPreviewResult | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [validationResult, setValidationResult] = useState<MigrationValidationResult | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<"skip" | "update" | "create_new">("skip");
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationExecutionResult | null>(null);

  const handleMigrationFileSelected = async (file: File) => {
    setMigrationFile(file);
    try {
      toast.loading("Analyzing spreadsheet structure...", { id: "mig-prev" });
      const res = await previewMigrationFile(file);
      setPreviewData(res);
      setMigrationEntity(res.suggested_entity);
      setColumnMapping(res.suggested_mapping);
      setMigrationStep(2);
      toast.success(`Loaded ${res.total_rows} rows from ${file.name}`, { id: "mig-prev" });
    } catch (e: any) {
      toast.error(getErrorMessage(e), { id: "mig-prev" });
    }
  };

  const runValidation = async () => {
    if (!previewData) return;
    try {
      toast.loading("Validating fields & detecting duplicates...", { id: "mig-val" });
      const val = await validateMigrationData(migrationEntity, previewData.preview_rows, columnMapping);
      setValidationResult(val);
      setMigrationStep(3);
      toast.success("Validation complete", { id: "mig-val" });
    } catch (e: any) {
      toast.error(getErrorMessage(e), { id: "mig-val" });
    }
  };

  const runExecution = async () => {
    if (!previewData) return;
    setIsMigrating(true);
    try {
      toast.loading("Executing migration in database...", { id: "mig-exec" });
      const res = await executeMigration(migrationEntity, previewData.preview_rows, columnMapping, duplicateStrategy);
      setMigrationResult(res);
      setMigrationStep(4);
      refetchHistory();
      toast.success(`Imported ${res.imported} record(s) successfully!`, { id: "mig-exec" });
    } catch (e: any) {
      toast.error(getErrorMessage(e), { id: "mig-exec" });
    } finally {
      setIsMigrating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 5: PRACTICE BACKUP & RECOVERY STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [exportPracticeCaseId, setExportPracticeCaseId] = useState<string>("");
  const [isExportingPractice, setIsExportingPractice] = useState<boolean>(false);
  const [backupPassphrase, setBackupPassphrase] = useState<string>("");
  const [includeDocFiles, setIncludeDocFiles] = useState<boolean>(true);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassphrase, setRestorePassphrase] = useState<string>("");
  const [restoreReport, setRestoreReport] = useState<any>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleValidateRestore = async (file: File) => {
    setIsRestoring(true);
    try {
      const rep = await validatePracticeRestore(file, restorePassphrase);
      setRestoreReport(rep);
      toast.success("Backup archive validated successfully!");
    } catch (e: any) {
      toast.error(getErrorMessage(e));
      setRestoreReport(null);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!restoreFile) return;
    setIsRestoring(true);
    try {
      const result = await executePracticeRestore(restoreFile, restorePassphrase, "skip");
      toast.success(`Restore complete! Restored ${result.clients_restored} clients, ${result.cases_restored} cases.`);
      setRestoreReport(null);
      setRestoreFile(null);
      refetchHistory();
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsRestoring(false);
    }
  };

  const downloadExport = async (endpoint: string, fallbackName: string) => {
    setIsExportingPractice(true);
    try {
      const res = await api.get(endpoint, { responseType: "blob" });
      const disposition = res.headers["content-disposition"] || "";
      let filename = fallbackName;
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) filename = match[1];

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Export ready: ${filename}`);
      refetchHistory();
    } catch (e: any) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsExportingPractice(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PREVIEW MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [previewDoc, setPreviewDoc] = useState<ClientDocument | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  const downloadSampleTemplate = (entity: string) => {
    let headers = "";
    let sampleRow = "";
    if (entity === "client") {
      headers = "name,email,phone,type,city,state,pincode,address,pan,gstin,contact_person,notes\n";
      sampleRow = "Acme Corp Ltd,contact@acme.com,+919876543210,corporate,Mumbai,Maharashtra,400001,\"123 Marine Drive\",ABCDE1234F,27ABCDE1234F1Z5,John Doe,Retainer client\n";
    } else {
      headers = "case_no,title,court,practice_area,case_type,status,stage,priority,judge,fees_agreed,description\n";
      sampleRow = "WP/101/2026,Acme Corp vs State of Maharashtra,High Court of Bombay,Civil,Writ Petition,active,filing,high,Hon'ble Justice Sharma,250000.0,Writ challenging municipal notice\n";
    }
    const blob = new Blob([headers + sampleRow], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `sample_${entity}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openDocumentPreview = async (doc: ClientDocument | BridgeUploadItem) => {
    const docAny = doc as any;
    const docId = docAny.docId || docAny.id;
    const clientDoc: ClientDocument = {
      id: docId,
      name: docAny.name,
      original_filename: docAny.original_filename || docAny.name,
      doc_type: docAny.doc_type || docAny.docType || "other",
      file_size: docAny.file_size || docAny.size || 0,
      mime_type: docAny.mime_type || "application/octet-stream",
      preview_url: docAny.preview_url || docAny.previewUrl || `/api/v1/documents/${docId}/stream?disposition=inline`,
      download_url: docAny.download_url || docAny.downloadUrl || `/api/v1/documents/${docId}/stream?disposition=attachment`,
      client_name: docAny.client_name || docAny.clientName,
      case_title: docAny.case_title || docAny.caseTitle,
      created_at: docAny.created_at || new Date().toISOString(),
    };

    setPreviewDoc(clientDoc);
    setIsLoadingPreview(true);
    setPreviewContent("");

    try {
      const res = await getDocumentContent(docId);
      setPreviewContent(res.text || "");
      if (res.preview_url) {
        clientDoc.preview_url = res.preview_url;
      }
      if (res.download_url) {
        clientDoc.download_url = res.download_url;
      }
    } catch (e) {
      // Content extraction error is non-fatal if preview_url exists
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // AI DRAFT / IMPROVE WORKSPACE MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [aiDraftDoc, setAiDraftDoc] = useState<ClientDocument | null>(null);
  const [aiOriginalText, setAiOriginalText] = useState<string>("");
  const [aiProposedDraft, setAiProposedDraft] = useState<string>("");
  const [aiOperation, setAiOperation] = useState<string>("improve_grammar");
  const [aiInstructions, setAiInstructions] = useState<string>("");
  const [isAiProcessing, setIsAiProcessing] = useState<boolean>(false);
  const [aiActiveTab, setAiActiveTab] = useState<"draft" | "compare">("draft");
  const [isSavingDraft, setIsSavingDraft] = useState<boolean>(false);

  const openAiDraftModal = async (doc: ClientDocument | BridgeUploadItem) => {
    const docAny = doc as any;
    const docId = docAny.docId || docAny.id;
    const clientDoc: ClientDocument = {
      id: docId,
      name: docAny.name,
      original_filename: docAny.original_filename || docAny.name,
      doc_type: docAny.doc_type || docAny.docType || "other",
      file_size: docAny.file_size || docAny.size || 0,
      mime_type: docAny.mime_type || "application/octet-stream",
      preview_url: docAny.preview_url || "",
      download_url: docAny.download_url || "",
      client_id: docAny.client_id || docAny.clientId,
      client_name: docAny.client_name || docAny.clientName,
      case_id: docAny.case_id || docAny.caseId,
      case_title: docAny.case_title || docAny.caseTitle,
      created_at: docAny.created_at || new Date().toISOString(),
    };

    setAiDraftDoc(clientDoc);
    setAiOriginalText("Loading document text...");
    setAiProposedDraft("");
    setAiInstructions("");
    setAiActiveTab("draft");

    try {
      const res = await getDocumentContent(docId);
      setAiOriginalText(res.text || "No selectable text could be extracted from this document.");
    } catch (e: any) {
      setAiOriginalText("Failed to extract document text. You can still type facts and instructions below.");
    }
  };

  const handleRunAiOperation = async () => {
    if (!aiDraftDoc) return;
    setIsAiProcessing(true);
    try {
      toast.loading("AI is analyzing and drafting revision...", { id: "ai-draft" });
      const res = await aiDraftImprove({
        doc_id: aiDraftDoc.id,
        operation: aiOperation,
        instructions: aiInstructions || undefined,
        text: aiOriginalText !== "No selectable text could be extracted from this document." ? aiOriginalText : undefined,
        category: aiDraftDoc.doc_type || "other",
        client_id: aiDraftDoc.client_id,
        case_id: aiDraftDoc.case_id,
      });

      setAiProposedDraft(res.proposed_draft);
      toast.success("AI draft ready for review!", { id: "ai-draft" });
    } catch (e: any) {
      toast.error(getErrorMessage(e), { id: "ai-draft" });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!aiProposedDraft.trim()) {
      toast.error("Please generate or edit a draft before saving");
      return;
    }
    setIsSavingDraft(true);
    try {
      toast.loading("Saving approved draft to database...", { id: "save-draft" });
      const res = await aiDraftImprove({
        doc_id: aiDraftDoc?.id,
        operation: aiOperation,
        instructions: aiInstructions,
        text: aiProposedDraft,
        save_as_draft: true,
        draft_title: `Revised Draft - ${aiDraftDoc?.name || "Document"}`,
        category: aiDraftDoc?.doc_type || "other",
        client_id: aiDraftDoc?.client_id,
        case_id: aiDraftDoc?.case_id,
      });

      toast.success("Approved revision saved to Drafts Library!", { id: "save-draft" });
    } catch (e: any) {
      toast.error(getErrorMessage(e), { id: "save-draft" });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDownloadDraftDocx = async () => {
    if (!aiProposedDraft.trim()) return;
    try {
      const blob = await generateDocx(aiProposedDraft, null, "en");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Draft_${aiDraftDoc?.name ? aiDraftDoc.name.replace(/\.[^/.]+$/, "") : "Document"}_AI_Revision.docx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Downloaded Word (.docx) draft");
    } catch (e: any) {
      toast.error("Failed to generate DOCX file: " + e.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENAME & REASSIGN MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [editingDoc, setEditingDoc] = useState<ClientDocument | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editClientId, setEditClientId] = useState<string>("");
  const [editCaseId, setEditCaseId] = useState<string>("");
  const [editDocType, setEditDocType] = useState<string>("");
  const [isUpdatingDoc, setIsUpdatingDoc] = useState<boolean>(false);

  const openEditModal = (doc: ClientDocument) => {
    setEditingDoc(doc);
    setEditName(doc.name);
    setEditClientId(doc.client_id || "");
    setEditCaseId(doc.case_id || "");
    setEditDocType(doc.doc_type || "other");
  };

  const handleSaveDocumentEdit = async () => {
    if (!editingDoc) return;
    setIsUpdatingDoc(true);
    try {
      await updateDocument(editingDoc.id, {
        name: editName.trim(),
        client_id: editClientId || undefined,
        case_id: editCaseId || undefined,
        doc_type: editDocType,
      });
      toast.success("Document updated successfully!");
      setEditingDoc(null);
      refetchLib();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdatingDoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <Header
        title="Fastcase Data Bridge"
        subtitle="Unified client document management, secure bulk import & export, and AI-assisted drafting."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm flex flex-wrap gap-2">
          {[
            { id: "import", label: "Import Documents", icon: HardDriveUpload, desc: "Client & Bulk Ingestion" },
            { id: "library", label: "Client Document Library", icon: FolderOpen, desc: "Search, Reassign & Preview" },
            { id: "export", label: "Client-Wise Export", icon: Download, desc: "Export ZIP & Manifests" },
            { id: "migrate", label: "Legacy Data Migration", icon: FileSpreadsheet, desc: "CSV / Excel Wizard" },
            { id: "backup", label: "Practice Backup & Recovery", icon: ShieldCheck, desc: "Disaster Recovery" },
            { id: "history", label: "Audit & Migration History", icon: History, desc: "Firm Provenance Log" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 min-w-[170px] py-3 px-4 rounded-xl text-left transition-all relative flex items-center gap-3",
                  isActive
                    ? "bg-sidebar text-white shadow-md shadow-sidebar/10"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    isActive ? "bg-white/10 text-mint" : "bg-gray-100 text-gray-500"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs leading-tight truncate">{tab.label}</div>
                  <div
                    className={cn(
                      "text-[10px] truncate mt-0.5",
                      isActive ? "text-gray-300" : "text-gray-400"
                    )}
                  >
                    {tab.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: IMPORT DOCUMENTS */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "import" && (
          <div className="space-y-6">
            {/* Top configuration panel with prominent Select Client */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Target Client & Matter Assignment</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select the client before importing so every document is reliably associated with that client's record.
                  </p>
                </div>
                {selectedClientObj && (
                  <span className="px-3 py-1 bg-mint/10 text-sidebar text-xs font-semibold rounded-full border border-mint/30 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-mint" />
                    Selected: {selectedClientObj.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-1">
                {/* 1. SELECT CLIENT (PROMINENT) */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                    Select Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value);
                      setSelectedCaseId(""); // Reset case when client changes
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white font-medium text-gray-900"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((cl: any) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name} {cl.phone ? `(${cl.phone})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {selectedClientObj
                      ? `Ref: ${selectedClientObj.phone || selectedClientObj.email || "No contact info"}`
                      : "Required: Documents will be linked to this client"}
                  </p>
                </div>

                {/* 2. SELECT CASE (FILTERED TO CLIENT) */}
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Target Case / Matter (Optional)
                  </label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    disabled={!selectedClientId && clientCases.length === 0}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white font-medium text-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="">-- General Client Documents (No specific case) --</option>
                    {clientCases.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.case_no} — {c.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {selectedClientId
                      ? `Showing ${clientCases.length} case(s) belonging to ${selectedClientObj?.name}`
                      : "Select a client first to see their cases"}
                  </p>
                </div>

                {/* 3. SETTINGS */}
                <div className="flex flex-col justify-center space-y-2.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={enableOcr}
                      onChange={(e) => setEnableOcr(e.target.checked)}
                      className="w-4 h-4 rounded text-sidebar focus:ring-mint border-gray-300"
                    />
                    <span>Run OCR on Scanned Orders & Notices (Tesseract)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={autoClassify}
                      onChange={(e) => setAutoClassify(e.target.checked)}
                      className="w-4 h-4 rounded text-sidebar focus:ring-mint border-gray-300"
                    />
                    <span>Suggest Document Category & Case Matching</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Dropzone & Selector Actions */}
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center hover:border-sidebar/40 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-mint/10 text-sidebar flex items-center justify-center mx-auto mb-4">
                <HardDriveUpload className="w-8 h-8 text-sidebar" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Select Documents or Folders from Your Computer</h3>
              <p className="text-sm text-gray-500 max-w-xl mx-auto mb-6">
                Directly import local case files, briefs, orders, and evidence. Supported formats:{" "}
                <span className="font-semibold text-gray-700">PDF, DOCX, DOC, TXT, JPG, PNG</span> (up to 50 MB each).
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesAdded(e.target.files, false)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-sidebar-dark transition-all flex items-center gap-2 shadow-sm"
                >
                  <FileUp className="w-4 h-4 text-mint" />
                  Select Individual Files
                </button>

                <input
                  type="file"
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  ref={folderInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesAdded(e.target.files, true)}
                />
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                >
                  <FolderUp className="w-4 h-4 text-sidebar" />
                  Select Entire Folder Structure
                </button>
              </div>
            </div>

            {/* Import Queue List */}
            {uploadQueue.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">Import Queue</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">
                      {uploadQueue.length} file(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearCompleted}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Clear Completed
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingQueue}
                      onClick={startQueueUpload}
                      className="px-4 py-1.5 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      {isProcessingQueue ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-mint" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-mint" />
                          Start Import ({uploadQueue.filter((q) => q.status === "pending" || q.status === "error").length})
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50/50 transition-colors space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-sidebar" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-gray-100 text-gray-600 shrink-0">
                                {item.type}
                              </span>
                              {item.relativePath && item.relativePath !== item.name && (
                                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-50 text-blue-700 truncate max-w-[200px]">
                                  {item.relativePath}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-0.5">
                              <span>{formatBytes(item.size)}</span>
                              <span className="text-gray-700 font-medium">
                                Client: <span className="text-sidebar">{item.clientName || selectedClientObj?.name || "Unassigned"}</span>
                              </span>
                              {item.caseTitle && (
                                <span className="text-sidebar font-medium">Matter: {item.caseTitle}</span>
                              )}
                              {item.docType && item.docType !== "other" && (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                                  {DOC_TYPES.find((t) => t.value === item.docType)?.label || item.docType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {item.status === "uploading" && (
                            <div className="w-28 flex items-center gap-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-sidebar h-full transition-all duration-200"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-medium text-gray-500">{item.progress}%</span>
                            </div>
                          )}

                          {item.status === "completed" && (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Imported
                              </span>

                              {/* WORKING PREVIEW BUTTON */}
                              <button
                                type="button"
                                onClick={() => openDocumentPreview(item)}
                                className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-sidebar hover:text-white text-gray-700 text-xs font-semibold transition-all flex items-center gap-1"
                                title="Open or Preview Document"
                              >
                                <Eye className="w-3.5 h-3.5 text-mint" />
                                Preview
                              </button>

                              {/* WORKING DOWNLOAD BUTTON */}
                              {item.downloadUrl && (
                                <a
                                  href={resolveFullStreamUrl(item.downloadUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={item.name}
                                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all flex items-center gap-1"
                                  title="Download Original File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download
                                </a>
                              )}

                              {/* AI DRAFT BUTTON */}
                              <button
                                type="button"
                                onClick={() => openAiDraftModal(item)}
                                className="px-3 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all flex items-center gap-1 border border-purple-200"
                                title="AI Draft or Improve Document"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                                AI Draft
                              </button>
                            </div>
                          )}

                          {item.status === "error" && (
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {item.errorMessage || "Failed"}
                            </span>
                          )}

                          {item.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => setUploadQueue((q) => q.filter((it) => it.id !== item.id))}
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                              title="Remove from queue"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* AI Suggestion Banner if detected */}
                      {item.hints && item.hints.suggested_client_name && item.hints.suggested_client_id !== item.clientId && (
                        <div className="flex items-center justify-between text-xs bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-2 text-amber-900">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              AI detected match: <strong>{item.hints.suggested_client_name}</strong>
                              {item.hints.suggested_case_title && ` (Case: ${item.hints.suggested_case_title})`}
                              {" "}&bull; Confidence: {Math.round((item.confidence || 0.8) * 100)}%
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadQueue((q) =>
                                q.map((it) =>
                                  it.id === item.id
                                    ? {
                                        ...it,
                                        clientId: item.hints.suggested_client_id,
                                        clientName: item.hints.suggested_client_name,
                                        caseId: item.hints.suggested_case_id || it.caseId,
                                        caseTitle: item.hints.suggested_case_title || it.caseTitle,
                                      }
                                    : it
                                )
                              );
                              toast.success(`Assigned to ${item.hints.suggested_client_name}`);
                            }}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold"
                          >
                            Confirm Match
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: CLIENT DOCUMENT LIBRARY */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "library" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={libSearch}
                    onChange={(e) => setLibSearch(e.target.value)}
                    placeholder="Search documents or clients..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                </div>

                {/* Client Filter */}
                <select
                  value={libClientId}
                  onChange={(e) => {
                    setLibClientId(e.target.value);
                    setLibCaseId("");
                  }}
                  className="px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white font-medium text-gray-800"
                >
                  <option value="">All Clients</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>

                {/* Case Filter */}
                <select
                  value={libCaseId}
                  onChange={(e) => setLibCaseId(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white font-medium text-gray-800"
                >
                  <option value="">All Matters</option>
                  {libClientCases.map((cs: any) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.case_no} — {cs.title}
                    </option>
                  ))}
                </select>

                {/* Doc Type Filter */}
                <select
                  value={libDocType}
                  onChange={(e) => setLibDocType(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white font-medium text-gray-800"
                >
                  <option value="all">All Document Types</option>
                  {DOC_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => refetchLib()}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                  title="Refresh library"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("import")}
                  className="px-4 py-2 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <FileUp className="w-3.5 h-3.5 text-mint" />
                  Import New
                </button>
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="font-bold text-sm text-gray-900">
                  Client Documents ({libDocuments.length})
                </div>
                {libClientId && (
                  <button
                    type="button"
                    onClick={() => {
                      setExportClientId(libClientId);
                      setActiveTab("export");
                    }}
                    className="px-3 py-1.5 rounded-lg bg-mint/10 text-sidebar text-xs font-semibold hover:bg-mint/20 transition-all flex items-center gap-1 border border-mint/20"
                  >
                    <Download className="w-3.5 h-3.5 text-sidebar" />
                    Export This Client's Documents
                  </button>
                )}
              </div>

              {libLoading ? (
                <div className="p-12 text-center text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sidebar" />
                  <p className="text-xs">Loading documents...</p>
                </div>
              ) : libDocuments.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-700">No documents found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try adjusting your filters or import files from the Import Documents tab.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                      <tr>
                        <th className="py-3 px-4">Document Name</th>
                        <th className="py-3 px-4">Client</th>
                        <th className="py-3 px-4">Case / Matter</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Uploaded</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {libDocuments.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <FileText className="w-4 h-4 text-sidebar shrink-0" />
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 truncate max-w-[240px]">{doc.name}</p>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {formatBytes(doc.file_size)} {doc.hash_sha256 ? `• SHA: ${doc.hash_sha256.slice(0, 8)}...` : ""}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {doc.client_name ? (
                              <div>
                                <span className="font-semibold text-gray-900">{doc.client_name}</span>
                                {doc.client_phone && (
                                  <p className="text-[10px] text-gray-400">{doc.client_phone}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                                Unassigned
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {doc.case_title ? (
                              <div className="max-w-[200px] truncate">
                                <span className="font-medium text-sidebar">{doc.case_no}</span>
                                <p className="text-[10px] text-gray-400 truncate">{doc.case_title}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-700">
                              {DOC_TYPES.find((t) => t.value === doc.doc_type)?.label || doc.doc_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* PREVIEW */}
                              <button
                                type="button"
                                onClick={() => openDocumentPreview(doc)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-sidebar hover:bg-gray-100 transition-colors"
                                title="Preview Document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* DOWNLOAD */}
                              <a
                                href={resolveFullStreamUrl(doc.download_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={doc.name}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-sidebar hover:bg-gray-100 transition-colors"
                                title="Download Original File"
                              >
                                <Download className="w-4 h-4" />
                              </a>

                              {/* AI DRAFT */}
                              <button
                                type="button"
                                onClick={() => openAiDraftModal(doc)}
                                className="p-1.5 rounded-lg text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors"
                                title="AI Draft / Improve"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>

                              {/* RENAME / REASSIGN */}
                              <button
                                type="button"
                                onClick={() => openEditModal(doc)}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-sidebar hover:bg-gray-100 transition-colors"
                                title="Rename or Move Document"
                              >
                                <Edit3 className="w-4 h-4" />
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

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 3: CLIENT-WISE EXPORT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "export" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Export Client Documents & Manifest</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Create a structured ZIP archive for a specific client containing their KYC files, case records, and general documents, bundled with a cryptographic JSON/CSV manifest.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Select Client to Export <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={exportClientId}
                    onChange={(e) => {
                      setExportClientId(e.target.value);
                      setExportSelectedDocIds([]);
                    }}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white font-medium text-gray-900"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((cl: any) => (
                      <option key={cl.id} value={cl.id}>
                        {cl.name} {cl.phone ? `(${cl.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Filter by Matter (Optional)
                  </label>
                  <select
                    value={exportCaseFilter}
                    onChange={(e) => setExportCaseFilter(e.target.value)}
                    disabled={!exportClientId}
                    className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white font-medium text-gray-900 disabled:bg-gray-50"
                  >
                    <option value="">All Matters & General Files</option>
                    {cases
                      .filter((c: any) => c.client_id === exportClientId)
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.case_no} — {c.title}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Document Selection List */}
            {exportClientId && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllExportDocs}
                      className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-sidebar transition-colors"
                    >
                      {exportSelectedDocIds.length === exportDocs.length && exportDocs.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-sidebar" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                      Select All ({exportDocs.length} documents)
                    </button>
                    {exportSelectedDocIds.length > 0 && (
                      <span className="text-xs bg-sidebar text-white px-2.5 py-0.5 rounded-full font-semibold">
                        {exportSelectedDocIds.length} selected
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={isExportingClient || exportDocs.length === 0}
                    onClick={handleExportClientDocuments}
                    className="px-5 py-2.5 rounded-xl bg-sidebar text-white text-xs font-bold hover:bg-sidebar-dark disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                  >
                    {isExportingClient ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-mint" />
                        Generating ZIP...
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 text-mint" />
                        Export {exportSelectedDocIds.length > 0 ? `${exportSelectedDocIds.length} Selected` : "All"} Documents
                      </>
                    )}
                  </button>
                </div>

                {exportDocs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <p className="text-sm">No documents found for this client.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                    {exportDocs.map((d) => {
                      const isSelected = exportSelectedDocIds.includes(d.id);
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleToggleExportDoc(d.id)}
                          className={cn(
                            "py-3 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-colors",
                            isSelected ? "bg-mint/5 border border-mint/20" : "hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-sidebar shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">{d.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                                <span>{formatBytes(d.file_size)}</span>
                                <span>&bull;</span>
                                <span className="font-semibold text-gray-600">
                                  {d.case_no ? `Case: ${d.case_no}` : "General Client File"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {DOC_TYPES.find((t) => t.value === d.doc_type)?.label || d.doc_type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: LEGACY DATA MIGRATION (CSV & EXCEL WIZARD) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "migrate" && (
          <div className="space-y-6">
            {/* Step indicator */}
            <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
              {[
                { s: 1, title: "Upload" },
                { s: 2, title: "Map Columns" },
                { s: 3, title: "Validate & Duplicates" },
                { s: 4, title: "Complete" },
              ].map((st, idx) => (
                <div key={st.s} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                      migrationStep === st.s
                        ? "bg-sidebar text-mint shadow-md"
                        : migrationStep > st.s
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {migrationStep > st.s ? <Check className="w-4 h-4" /> : st.s}
                  </div>
                  <span className="text-xs font-medium text-gray-700 hidden sm:inline">{st.title}</span>
                  {idx < 3 && <div className="w-12 h-0.5 bg-gray-200 mx-2 hidden sm:block" />}
                </div>
              ))}
            </div>

            {/* STEP 1: UPLOAD */}
            {migrationStep === 1 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm max-w-2xl mx-auto space-y-6">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Import Legacy Spreadsheet</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Migrate legacy clients or active matters into Fastcase from CSV, TSV, or Excel (.xlsx) files.
                  </p>
                </div>

                <div className="flex gap-4">
                  {[
                    { id: "client", label: "Migrate Clients / Parties", icon: Layers },
                    { id: "case", label: "Migrate Matters / Court Cases", icon: FolderOpen },
                  ].map((ent) => (
                    <button
                      key={ent.id}
                      type="button"
                      onClick={() => setMigrationEntity(ent.id as any)}
                      className={cn(
                        "flex-1 p-4 rounded-xl border text-left transition-all",
                        migrationEntity === ent.id
                          ? "border-sidebar bg-sidebar/5 text-sidebar ring-1 ring-sidebar font-bold"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      )}
                    >
                      <ent.icon className="w-5 h-5 mb-2" />
                      <div className="text-xs font-semibold">{ent.label}</div>
                    </button>
                  ))}
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-sidebar/40 transition-colors">
                  <FileSpreadsheet className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-xs font-semibold text-gray-800 mb-1">Select your CSV or Excel file</p>
                  <p className="text-[11px] text-gray-400 mb-4">Supported formats: .csv, .xlsx (up to 20 MB)</p>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.tsv"
                    className="hidden"
                    id="mig-file-input"
                    onChange={(e) => e.target.files && handleMigrationFileSelected(e.target.files[0])}
                  />
                  <label
                    htmlFor="mig-file-input"
                    className="cursor-pointer px-4 py-2 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark inline-block shadow-sm"
                  >
                    Browse Spreadsheet
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span>Need a formatted spreadsheet template?</span>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate(migrationEntity)}
                    className="text-sidebar font-semibold hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3 h-3 text-mint" />
                    Download Sample {migrationEntity === "client" ? "Client" : "Case"} CSV
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: COLUMN MAPPING */}
            {migrationStep === 2 && previewData && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-3xl mx-auto space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Map Columns to Fastcase Fields</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Found {previewData.total_rows} rows in {previewData.filename}. Match your headers below.
                    </p>
                  </div>
                  <span className="text-xs bg-sidebar text-white px-2.5 py-1 rounded-lg font-semibold uppercase">
                    {migrationEntity}
                  </span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
                  {Object.keys(columnMapping).map((targetField) => (
                    <div key={targetField} className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="w-1/3">
                        <span className="text-xs font-bold text-gray-800 capitalize">
                          {targetField.replace(/_/g, " ")}
                        </span>
                        {["name", "case_no", "title"].includes(targetField) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <select
                        value={columnMapping[targetField] || ""}
                        onChange={(e) =>
                          setColumnMapping({ ...columnMapping, [targetField]: e.target.value })
                        }
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-mint bg-white"
                      >
                        <option value="">-- Ignore / Unmapped --</option>
                        {previewData.headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setMigrationStep(1)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={runValidation}
                    className="px-5 py-2.5 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark flex items-center gap-1.5 shadow-sm"
                  >
                    Continue to Validation <ArrowRight className="w-3.5 h-3.5 text-mint" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VALIDATION & DUPLICATES */}
            {migrationStep === 3 && validationResult && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-3xl mx-auto space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Validation & Duplicate Resolution</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Evaluated {validationResult.total_evaluated} records against existing firm data.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                    <span className="text-xs text-emerald-800 font-semibold">Ready to Import</span>
                    <p className="text-xl font-bold text-emerald-700 mt-0.5">{validationResult.valid_count}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                    <span className="text-xs text-amber-800 font-semibold">Duplicates Detected</span>
                    <p className="text-xl font-bold text-amber-700 mt-0.5">{validationResult.duplicate_count}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-center">
                    <span className="text-xs text-red-800 font-semibold">Validation Errors</span>
                    <p className="text-xl font-bold text-red-700 mt-0.5">{validationResult.invalid_count}</p>
                  </div>
                </div>

                {/* Duplicate strategy */}
                {validationResult.duplicate_count > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Duplicate Handling Strategy:
                    </div>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {[
                        { id: "skip", label: "Skip Duplicates (Keep existing untouched)" },
                        { id: "update", label: "Update Existing (Merge new info)" },
                        { id: "create_new", label: "Create As New (Allow separate record)" },
                      ].map((s) => (
                        <label key={s.id} className="flex items-center gap-2 text-xs text-gray-800 cursor-pointer">
                          <input
                            type="radio"
                            name="strategy"
                            value={s.id}
                            checked={duplicateStrategy === s.id}
                            onChange={(e) => setDuplicateStrategy(e.target.value as any)}
                            className="text-sidebar focus:ring-mint"
                          />
                          <span>{s.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setMigrationStep(2)}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Mapping
                  </button>
                  <button
                    type="button"
                    disabled={isMigrating || (validationResult.valid_count === 0 && validationResult.duplicate_count === 0)}
                    onClick={runExecution}
                    className="px-5 py-2.5 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {isMigrating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-mint" />
                        Migrating...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 text-mint" />
                        Confirm & Execute Migration
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: REPORT */}
            {migrationStep === 4 && migrationResult && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center space-y-6 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Migration Completed Successfully!</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Your records have been integrated with Fastcase.
                  </p>
                </div>

                <div className="flex justify-center gap-6 max-w-md mx-auto">
                  <div className="p-3 bg-gray-50 rounded-xl flex-1 border border-gray-100">
                    <span className="text-xs text-gray-500">Imported New</span>
                    <p className="text-xl font-bold text-emerald-700 mt-0.5">{migrationResult.imported}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl flex-1 border border-gray-100">
                    <span className="text-xs text-gray-500">Updated</span>
                    <p className="text-xl font-bold text-blue-700 mt-0.5">{migrationResult.updated}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl flex-1 border border-gray-100">
                    <span className="text-xs text-gray-500">Skipped</span>
                    <p className="text-xl font-bold text-amber-700 mt-0.5">{migrationResult.skipped}</p>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setMigrationStep(1);
                      setMigrationFile(null);
                      setPreviewData(null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Import Another File
                  </button>
                  <a
                    href={migrationResult.entity_type === "client" ? "/clients" : "/cases"}
                    className="px-5 py-2.5 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark flex items-center gap-1.5 shadow-sm"
                  >
                    View {migrationResult.entity_type === "client" ? "Clients CRM" : "Cases"} <ExternalLink className="w-3.5 h-3.5 text-mint" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 5: PRACTICE BACKUP & RECOVERY */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "backup" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Full Practice Disaster Recovery Backup */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  {backupPassphrase.trim() ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> AES-256-GCM
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                      Standard ZIP
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-gray-900">Practice-Wide Disaster Recovery Backup</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Export complete practice database (clients, cases, filings, metadata) into an encrypted or standard archive.
                </p>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-gray-700">Optional AES-256 Encryption Passphrase</label>
                  <input
                    type="password"
                    value={backupPassphrase}
                    onChange={(e) => setBackupPassphrase(e.target.value)}
                    placeholder="Leave empty for unencrypted ZIP..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-mint"
                  />
                  <p className="text-[11px] text-gray-400">
                    If set, backup will be encrypted using authenticated PBKDF2-HMAC-SHA256 (600,000 iterations).
                  </p>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 pt-2 select-none">
                  <input
                    type="checkbox"
                    checked={includeDocFiles}
                    onChange={(e) => setIncludeDocFiles(e.target.checked)}
                    className="w-4 h-4 rounded text-sidebar focus:ring-mint border-gray-300"
                  />
                  <span>Bundle binary document files (up to 150 MB quota)</span>
                </label>
              </div>

              <button
                type="button"
                disabled={isExportingPractice}
                onClick={() =>
                  downloadExport(
                    `/data-bridge/export/backup?include_documents=${includeDocFiles}&passphrase=${encodeURIComponent(
                      backupPassphrase.trim()
                    )}`,
                    backupPassphrase.trim() ? "Fastcase_Practice_Backup.fcenc" : "Fastcase_Practice_Backup.zip"
                  )
                }
                className="w-full py-2.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 transition-all flex items-center justify-center gap-1.5 shadow-sm mt-4"
              >
                <Download className="w-3.5 h-3.5 text-mint" />
                Generate Practice Backup Archive
              </button>
            </div>

            {/* 2. Practice Backup Restoration */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Restore Practice from Backup</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Restore clients and matters from a previously generated Fastcase backup archive (.zip or .fcenc).
                </p>

                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-semibold text-gray-700">Decryption Passphrase (if encrypted)</label>
                  <input
                    type="password"
                    value={restorePassphrase}
                    onChange={(e) => setRestorePassphrase(e.target.value)}
                    placeholder="Enter passphrase if archive is encrypted..."
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-mint"
                  />
                </div>

                <div className="border border-dashed border-gray-200 rounded-xl p-4 text-center mt-2">
                  <input
                    type="file"
                    accept=".zip,.fcenc"
                    ref={restoreInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setRestoreFile(e.target.files[0]);
                        handleValidateRestore(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => restoreInputRef.current?.click()}
                    className="text-xs font-semibold text-sidebar hover:underline"
                  >
                    {restoreFile ? restoreFile.name : "Select .zip or .fcenc archive"}
                  </button>
                </div>

                {restoreReport && (
                  <div className="p-3 bg-gray-50 rounded-xl text-xs space-y-1 border border-gray-100">
                    <div className="font-bold text-gray-800">Archive Contents:</div>
                    <div className="text-gray-600">
                      Clients: {restoreReport.counts?.clients || 0} &bull; Cases: {restoreReport.counts?.cases || 0}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!restoreReport || isRestoring}
                onClick={handleExecuteRestore}
                className="w-full py-2.5 rounded-xl bg-sidebar text-white text-xs font-bold hover:bg-sidebar-dark disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm mt-4"
              >
                {isRestoring ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-mint" />
                    Restoring...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-mint" />
                    Execute Practice Restore
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 6: AUDIT & MIGRATION HISTORY */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <span className="font-bold text-sm text-gray-900">Firm Provenance & Data Bridge Audit Log</span>
              <button
                type="button"
                onClick={() => refetchHistory()}
                className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {!historyItems || historyItems.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No migration or export events recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[550px] overflow-y-auto">
                {historyItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.action.replace(/_/g, " ")}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                          {item.resource_type}
                        </span>
                      </div>
                      <div className="text-gray-500 font-mono text-[11px]">
                        ID: {item.resource_id}
                        {item.details?.filename && ` • File: ${item.details.filename}`}
                        {item.details?.imported && ` • Imported: ${item.details.imported}`}
                        {item.details?.client_name && ` • Client: ${item.details.client_name}`}
                      </div>
                    </div>
                    <span className="text-gray-400 text-[11px] whitespace-nowrap">
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* UNIVERSAL DOCUMENT PREVIEW MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-sidebar text-white flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-mint" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{previewDoc.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{formatBytes(previewDoc.file_size)}</span>
                      {previewDoc.client_name && <span>&bull; Client: {previewDoc.client_name}</span>}
                      {previewDoc.case_title && <span>&bull; Matter: {previewDoc.case_title}</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openAiDraftModal(previewDoc)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold flex items-center gap-1 border border-purple-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    AI Draft / Improve
                  </button>

                  <a
                    href={resolveFullStreamUrl(previewDoc.download_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={previewDoc.name}
                    className="px-3 py-1.5 rounded-xl bg-sidebar text-white hover:bg-sidebar-dark text-xs font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-mint" />
                    Download
                  </a>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 bg-gray-100 overflow-hidden relative">
                {isLoadingPreview ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-sidebar mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Loading document preview...</p>
                    </div>
                  </div>
                ) : previewDoc.name.toLowerCase().endsWith(".pdf") ? (
                  <iframe
                    src={resolveFullStreamUrl(previewDoc.preview_url)}
                    className="w-full h-full border-0"
                    title={previewDoc.name}
                  />
                ) : ["jpg", "jpeg", "png", "webp"].some((ext) => previewDoc.name.toLowerCase().endsWith(ext)) ? (
                  <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                    <img
                      src={resolveFullStreamUrl(previewDoc.preview_url)}
                      alt={previewDoc.name}
                      className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full p-6 overflow-y-auto bg-white font-serif text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {previewContent ? (
                      previewContent
                    ) : (
                      <div className="text-center py-12 text-gray-400 font-sans">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-semibold text-gray-700">Preview not natively supported for this format.</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                          You can download the original file or use AI Draft to extract and edit its content.
                        </p>
                        <a
                          href={resolveFullStreamUrl(previewDoc.download_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={previewDoc.name}
                          className="px-4 py-2 bg-sidebar text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 text-mint" /> Download Original File
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* AI DRAFT / IMPROVE WORKSPACE MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {aiDraftDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-purple-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-mint" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-gray-900">AI Drafting & Improvement Studio</h3>
                      <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded">
                        Fastcase AI
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-lg">
                      Source: {aiDraftDoc.name} &bull; {aiDraftDoc.client_name ? `Client: ${aiDraftDoc.client_name}` : "General Document"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-gray-100 rounded-xl p-0.5 text-xs font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => setAiActiveTab("draft")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-all",
                        aiActiveTab === "draft" ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
                      )}
                    >
                      Proposed Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiActiveTab("compare")}
                      className={cn(
                        "px-3 py-1 rounded-lg transition-all",
                        aiActiveTab === "compare" ? "bg-white text-gray-900 shadow-sm" : "hover:text-gray-900"
                      )}
                    >
                      Original vs Revised
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAiDraftDoc(null)}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Safeguard Alert */}
              <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2 text-xs text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>Strict Safeguard Active:</strong> Original imported document is protected and will never be overwritten. All revisions are kept in a separate workspace.
                </span>
              </div>

              {/* Workspace Body */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Controller Pane */}
                <div className="w-80 border-r border-gray-100 p-4 space-y-4 overflow-y-auto bg-gray-50/40">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Select AI Operation
                    </label>
                    <div className="space-y-1.5">
                      {AI_OPERATIONS.map((op) => (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => setAiOperation(op.id)}
                          className={cn(
                            "w-full text-left p-2.5 rounded-xl border text-xs transition-all",
                            aiOperation === op.id
                              ? "bg-purple-600 text-white border-purple-600 shadow-sm font-semibold"
                              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                          )}
                        >
                          <div>{op.label}</div>
                          <div className={cn("text-[10px] mt-0.5", aiOperation === op.id ? "text-purple-200" : "text-gray-400")}>
                            {op.desc}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom instructions input */}
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Advocate Instructions (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={aiInstructions}
                      onChange={(e) => setAiInstructions(e.target.value)}
                      placeholder="e.g., Emphasize lack of evidence under section 138, highlight the 15-day notice window..."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isAiProcessing}
                    onClick={handleRunAiOperation}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isAiProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-mint" />
                        Generating Draft...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5 text-mint" />
                        Execute AI Operation
                      </>
                    )}
                  </button>
                </div>

                {/* Right Editor / Compare Pane */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                  {aiActiveTab === "draft" ? (
                    <div className="flex-1 flex flex-col p-4 overflow-hidden">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 text-xs">
                        <span className="font-bold text-gray-700">Editable Proposed Draft</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-gray-400">
                            {aiProposedDraft ? `${aiProposedDraft.split(/\s+/).filter(Boolean).length} words` : "0 words"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(aiProposedDraft);
                              toast.success("Draft copied to clipboard!");
                            }}
                            className="px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-600 flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={aiProposedDraft}
                        onChange={(e) => setAiProposedDraft(e.target.value)}
                        placeholder="Click 'Execute AI Operation' above or edit the draft content directly here..."
                        className="flex-1 w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-400 font-serif text-sm leading-relaxed text-gray-800 resize-none"
                      />
                    </div>
                  ) : (
                    /* Side-by-side original vs revised */
                    <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200 overflow-hidden">
                      <div className="p-4 flex flex-col overflow-hidden">
                        <div className="font-bold text-xs text-gray-600 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                          <span>Original Document Text</span>
                          <span className="text-[10px] text-gray-400">Read-Only Source</span>
                        </div>
                        <div className="flex-1 overflow-y-auto font-serif text-xs leading-relaxed text-gray-700 whitespace-pre-wrap pr-2">
                          {aiOriginalText}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col overflow-hidden bg-purple-50/20">
                        <div className="font-bold text-xs text-purple-900 pb-2 mb-2 border-b border-purple-100 flex items-center justify-between">
                          <span>Proposed AI Draft</span>
                          <span className="text-[10px] text-purple-600 font-semibold">Editable</span>
                        </div>
                        <textarea
                          value={aiProposedDraft}
                          onChange={(e) => setAiProposedDraft(e.target.value)}
                          className="flex-1 w-full p-3 border border-purple-200 rounded-xl outline-none focus:ring-1 focus:ring-purple-400 font-serif text-xs leading-relaxed text-gray-800 resize-none bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      User review and explicit approval required before saving.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={!aiProposedDraft.trim()}
                        onClick={handleDownloadDraftDocx}
                        className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-sidebar" /> Download Word (.docx)
                      </button>

                      <button
                        type="button"
                        disabled={!aiProposedDraft.trim() || isSavingDraft}
                        onClick={handleSaveAsDraft}
                        className="px-5 py-2 rounded-xl bg-sidebar text-white hover:bg-sidebar-dark text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        {isSavingDraft ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-mint" />
                            Saving to Library...
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5 text-mint" />
                            Approve & Save as Draft
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* RENAME / REASSIGN MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900">Edit / Reassign Document</h3>
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Document Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Client</label>
                  <select
                    value={editClientId}
                    onChange={(e) => {
                      setEditClientId(e.target.value);
                      setEditCaseId("");
                    }}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint bg-white"
                  >
                    <option value="">-- No Client (Unassigned) --</option>
                    {clients.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Matter / Case</label>
                  <select
                    value={editCaseId}
                    onChange={(e) => setEditCaseId(e.target.value)}
                    disabled={!editClientId}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint bg-white disabled:bg-gray-50"
                  >
                    <option value="">-- No Specific Case --</option>
                    {cases
                      .filter((c: any) => !editClientId || c.client_id === editClientId)
                      .map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.case_no} — {c.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Document Type</label>
                  <select
                    value={editDocType}
                    onChange={(e) => setEditDocType(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint bg-white"
                  >
                    {DOC_TYPES.map((dt) => (
                      <option key={dt.value} value={dt.value}>
                        {dt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUpdatingDoc}
                  onClick={handleSaveDocumentEdit}
                  className="px-4 py-2 rounded-xl bg-sidebar text-white text-xs font-bold hover:bg-sidebar-dark flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isUpdatingDoc ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
