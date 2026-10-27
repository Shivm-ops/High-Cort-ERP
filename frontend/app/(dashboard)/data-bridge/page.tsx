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
  Wand2,
  GitMerge,
  Tag,
  User,
  ShieldAlert,
  UserCheck,
  FileEdit,
  Save,
  Type,
  AlignLeft,
  BookOpen
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
  deleteDocument,
  exportClientDocuments,
  ImportedClient,
  ImportedCase,
  ImportedDocument,
  useImportedRecords,
  resolveRecordConflict,
  updateClientRecord,
  updateCaseRecord,
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

  const router = useRouter();

  const { data: casesData, refetch: refetchCases } = useCases({ limit: 500 });
  const { data: clientsData, refetch: refetchClients } = useClients({ limit: 500 });
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

  // Handle client selection change and synchronize pending items in upload queue
  const handleClientSelectChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedCaseId("");
    const clientObj = clients.find((c: any) => c.id === clientId);
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.status === "pending" || item.status === "error") {
          return {
            ...item,
            clientId: clientId || undefined,
            clientName: clientObj?.name,
            caseId: undefined,
            caseTitle: undefined,
          };
        }
        return item;
      })
    );
    if (clientId && clientObj) {
      toast.info(`Queued files assigned to client: ${clientObj.name}`);
    }
  };

  // Allow setting or changing client on an individual queue item
  const handleItemClientChange = (itemId: string, clientId: string) => {
    const clientObj = clients.find((c: any) => c.id === clientId);
    setUploadQueue((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            clientId: clientId || undefined,
            clientName: clientObj?.name,
            caseId: undefined,
            caseTitle: undefined,
          };
        }
        return item;
      })
    );
  };

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
    refetchLib();
    refetchImported();
    refetchClients();
    refetchCases();
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
      refetchClients();
      refetchCases();
      refetchImported();
      refetchLib();
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
      let res;
      try {
        res = await api.get(endpoint, { responseType: "blob" });
      } catch (err: any) {
        if (err?.response?.status === 404 && endpoint.includes("/export/backup")) {
          const fallbackUrl = endpoint.replace("/export/backup", "/export/practice-backup");
          res = await api.get(fallbackUrl, { responseType: "blob" });
        } else if (err?.response?.status === 404 && endpoint.includes("/export/practice-backup")) {
          const fallbackUrl = endpoint.replace("/export/practice-backup", "/export/backup");
          res = await api.get(fallbackUrl, { responseType: "blob" });
        } else {
          throw err;
        }
      }
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

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTHENTICATED DOCUMENT DOWNLOAD HANDLER
  // ─────────────────────────────────────────────────────────────────────────────
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const handleDownloadDocument = async (doc: {
    id?: string;
    docId?: string;
    name?: string;
    original_filename?: string;
    download_url?: string;
    downloadUrl?: string;
  }) => {
    const documentId = doc.id || doc.docId;
    const fileName = doc.name || doc.original_filename || "document";

    if (!documentId) {
      toast.error("Document identifier missing for download");
      return;
    }

    setDownloadingDocId(documentId);
    const toastId = toast.loading(`Downloading ${fileName}...`);
    try {
      // 1. Fetch file as binary blob with JWT Authentication header attached automatically
      const res = await api.get(`/documents/${documentId}/stream?disposition=attachment`, {
        responseType: "blob",
      });

      // Extract accurate filename from response Content-Disposition header if available
      let downloadFilename = fileName;
      const disposition = String(res.headers["content-disposition"] || "");
      const match = disposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
      if (match && match[1]) {
        try {
          const decoded = decodeURIComponent(match[1].trim().replace(/['"]/g, ""));
          if (decoded && decoded.includes(".")) {
            downloadFilename = decoded;
          }
        } catch (e) {}
      }
      if (!downloadFilename.includes(".") && fileName.includes(".")) {
        downloadFilename += "." + fileName.split(".").pop();
      }

      const contentType = String(res.headers["content-type"] || "application/octet-stream");
      const blob = new Blob([res.data], { type: contentType });
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.style.display = "none";
      link.href = blobUrl;
      link.setAttribute("download", downloadFilename);
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();

      // Revoke after delay so browser has full time to read and save file with its actual name
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        if (link.parentNode) {
          document.body.removeChild(link);
        }
      }, 2500);

      toast.success(`Downloaded: ${downloadFilename}`, { id: toastId });
    } catch (err: any) {
      console.warn("Direct blob stream failed, attempting signed download URL fallback:", err);
      try {
        const { data } = await api.get<{ download_url?: string }>(`/documents/${documentId}/download`);
        if (data?.download_url) {
          const streamUrl = resolveFullStreamUrl(data.download_url);
          window.open(streamUrl, "_blank");
          toast.success(`Opening download for ${fileName}`, { id: toastId });
          return;
        }
      } catch (fallbackErr) {}
      toast.error(`Download failed: ${getErrorMessage(err)}`, { id: toastId });
    } finally {
      setDownloadingDocId(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // DELETE DOCUMENT MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [deletingDoc, setDeletingDoc] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState<boolean>(false);

  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsDeletingDoc(true);
    try {
      toast.loading(`Deleting ${deletingDoc.name}...`, { id: "delete-doc" });
      await deleteDocument(deletingDoc.id);
      toast.success(`Deleted: ${deletingDoc.name}`, { id: "delete-doc" });
      setDeletingDoc(null);
      refetchLib();
      refetchImported();
      refetchHistory();
      refetchClients();
      refetchCases();
    } catch (err: any) {
      toast.error(`Delete failed: ${getErrorMessage(err)}`, { id: "delete-doc" });
    } finally {
      setIsDeletingDoc(false);
    }
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
      refetchImported();
      refetchHistory();
      refetchClients();
      refetchCases();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUpdatingDoc(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // WORD & DOCUMENT IN-APP EDITOR MODAL STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [editorDoc, setEditorDoc] = useState<ClientDocument | null>(null);
  const [editorDocName, setEditorDocName] = useState<string>("");
  const [editorText, setEditorText] = useState<string>("");
  const [isLoadingEditorContent, setIsLoadingEditorContent] = useState<boolean>(false);
  const [isSavingEditorText, setIsSavingEditorText] = useState<boolean>(false);
  const [isExportingEditorDocx, setIsExportingEditorDocx] = useState<boolean>(false);
  const [editorFontFamily, setEditorFontFamily] = useState<"times" | "sans" | "mono">("times");
  const [editorFontSize, setEditorFontSize] = useState<number>(14);
  const [editorHasChanges, setEditorHasChanges] = useState<boolean>(false);

  const openFileEditorModal = async (doc: ClientDocument | BridgeUploadItem) => {
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
      client_id: docAny.client_id || docAny.clientId,
      client_name: docAny.client_name || docAny.clientName,
      case_id: docAny.case_id || docAny.caseId,
      case_title: docAny.case_title || docAny.caseTitle,
      created_at: docAny.created_at || new Date().toISOString(),
    };

    setEditorDoc(clientDoc);
    setEditorDocName(clientDoc.name);
    setEditorText("");
    setEditorHasChanges(false);
    setIsLoadingEditorContent(true);

    try {
      const res = await getDocumentContent(docId);
      if (res.text && res.text.trim()) {
        setEditorText(res.text.trim());
      } else {
        const isWord = clientDoc.name.toLowerCase().endsWith(".docx") || clientDoc.name.toLowerCase().endsWith(".doc");
        setEditorText(
          `BEFORE THE HON'BLE COURT\n\n` +
          `IN THE MATTER OF: ${clientDoc.name.replace(/\.[^/.]+$/, "")}\n` +
          (clientDoc.client_name ? `Client: ${clientDoc.client_name}\n` : "") +
          (clientDoc.case_title ? `Matter: ${clientDoc.case_title}\n` : "") +
          `Date: ${new Date().toLocaleDateString("en-IN")}\n\n` +
          `1. That the applicant/deponent abovenamed respectfully submits that...\n\n` +
          (isWord 
            ? `[Word Document ready for editing. Type or paste your document content, legal grounds, or prayer here]`
            : `[Document text canvas ready. Type or paste your clauses, facts, or pleadings here]`)
        );
      }
    } catch {
      toast.error("Could not load document text from storage. Starting new document canvas.");
      setEditorText("");
    } finally {
      setIsLoadingEditorContent(false);
    }
  };

  const handleSaveEditorContent = async () => {
    if (!editorDoc) return;
    setIsSavingEditorText(true);
    try {
      await updateDocument(editorDoc.id, {
        name: editorDocName.trim() || editorDoc.name,
        text: editorText,
      });
      setEditorHasChanges(false);
      toast.success("Document and text content saved successfully!");
      refetchLib();
      refetchImported();
      refetchHistory();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingEditorText(false);
    }
  };

  const handleExportEditorDocx = async () => {
    if (!editorText.trim()) {
      toast.error("Document content is empty.");
      return;
    }
    setIsExportingEditorDocx(true);
    try {
      const blob = await generateDocx(editorText, null, "en");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const baseName = (editorDocName || editorDoc?.name || "Document").replace(/\.[^/.]+$/, "");
      a.download = `${baseName}_Edited.docx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Downloaded Word (.docx) file");
    } catch (err: any) {
      toast.error("Failed to generate Word (.docx): " + err.message);
    } finally {
      setIsExportingEditorDocx(false);
    }
  };

  const handleExportEditorTxt = () => {
    if (!editorText.trim()) return;
    const blob = new Blob([editorText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = (editorDocName || editorDoc?.name || "Document").replace(/\.[^/.]+$/, "");
    a.download = `${baseName}.txt`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Downloaded Text (.txt) file");
  };

  const handleOpenInDraftWorkspace = () => {
    if (!editorDoc) return;
    router.push(`/draft-workspace?documentId=${editorDoc.id}`);
  };

  const insertTextSnippet = (snippet: string) => {
    setEditorText((prev) => (prev ? prev + "\n\n" + snippet : snippet));
    setEditorHasChanges(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 6: AUDIT & RECORD MANAGEMENT STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [auditSubView, setAuditSubView] = useState<"all" | "clients" | "cases" | "documents" | "provenance">("all");
  const [auditSearch, setAuditSearch] = useState<string>("");
  const [auditClientId, setAuditClientId] = useState<string>("");
  const [auditCaseId, setAuditCaseId] = useState<string>("");

  const {
    data: importedData,
    isLoading: isImportedLoading,
    refetch: refetchImported,
  } = useImportedRecords({
    search: auditSearch || undefined,
    type: auditSubView === "provenance" ? "all" : (auditSubView === "all" ? "all" : (auditSubView === "clients" ? "client" : (auditSubView === "cases" ? "case" : "document"))),
    clientId: auditClientId || undefined,
    caseId: auditCaseId || undefined,
  });

  // Client Inline / Modal Editing
  const [editingClient, setEditingClient] = useState<ImportedClient | null>(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    phone: "",
    email: "",
    company_name: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });
  const [isSavingClient, setIsSavingClient] = useState(false);

  const openEditClientModal = (cl: ImportedClient) => {
    setEditingClient(cl);
    setClientForm({
      name: cl.name || "",
      phone: cl.phone || "",
      email: cl.email || "",
      company_name: cl.company_name || "",
      city: cl.city || "",
      state: cl.state || "",
      pincode: cl.pincode || "",
      notes: cl.notes || "",
    });
  };

  const handleSaveClient = async () => {
    if (!editingClient) return;
    if (!clientForm.name.trim() || !clientForm.phone.trim()) {
      toast.error("Name and Phone number are required");
      return;
    }
    setIsSavingClient(true);
    try {
      await updateClientRecord(editingClient.id, {
        name: clientForm.name.trim(),
        phone: clientForm.phone.trim(),
        email: clientForm.email.trim() || undefined,
        company_name: clientForm.company_name.trim() || undefined,
        city: clientForm.city.trim() || undefined,
        state: clientForm.state.trim() || undefined,
        pincode: clientForm.pincode.trim() || undefined,
        notes: clientForm.notes.trim() || undefined,
      });
      toast.success("Client profile updated successfully!");
      setEditingClient(null);
      refetchImported();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingClient(false);
    }
  };

  // Case / Matter Inline / Modal Editing (with CNR Number)
  const [editingCase, setEditingCase] = useState<ImportedCase | null>(null);
  const [caseForm, setCaseForm] = useState({
    case_no: "",
    title: "",
    ecourts_cnr: "",
    court: "",
    practice_area: "",
    judge: "",
    client_id: "",
    status: "active",
  });
  const [isSavingCase, setIsSavingCase] = useState(false);

  const openEditCaseModal = (cs: ImportedCase) => {
    setEditingCase(cs);
    setCaseForm({
      case_no: cs.case_no || "",
      title: cs.title || "",
      ecourts_cnr: cs.ecourts_cnr || "",
      court: cs.court || "",
      practice_area: cs.practice_area || "",
      judge: cs.judge || "",
      client_id: cs.client_id || "",
      status: cs.status || "active",
    });
  };

  const handleSaveCase = async () => {
    if (!editingCase) return;
    if (!caseForm.case_no.trim() || !caseForm.title.trim()) {
      toast.error("Case No and Title are required");
      return;
    }
    setIsSavingCase(true);
    try {
      await updateCaseRecord(editingCase.id, {
        case_no: caseForm.case_no.trim(),
        title: caseForm.title.trim(),
        ecourts_cnr: caseForm.ecourts_cnr.trim() || null,
        court: caseForm.court.trim() || undefined,
        practice_area: caseForm.practice_area.trim() || undefined,
        judge: caseForm.judge.trim() || undefined,
        client_id: caseForm.client_id || undefined,
        status: caseForm.status || undefined,
      });
      toast.success("Matter / CNR details updated successfully!");
      setEditingCase(null);
      refetchImported();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingCase(false);
    }
  };

  // Conflict Resolution Modal ("Update / Merge / Overwrite")
  const [conflictModal, setConflictModal] = useState<{
    isOpen: boolean;
    entityType: "client" | "case";
    targetRecord: any;
    sourceRecord?: any;
    resolution: "update" | "merge" | "overwrite";
  } | null>(null);
  const [isResolvingConflict, setIsResolvingConflict] = useState(false);

  const handleExecuteConflictResolution = async () => {
    if (!conflictModal) return;
    setIsResolvingConflict(true);
    try {
      await resolveRecordConflict({
        entity_type: conflictModal.entityType,
        target_id: conflictModal.targetRecord.id,
        source_id: conflictModal.sourceRecord?.id || undefined,
        resolution: conflictModal.resolution,
      });
      toast.success(`Conflict resolved successfully using strategy: ${conflictModal.resolution.toUpperCase()}`);
      setConflictModal(null);
      refetchImported();
      refetchHistory();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsResolvingConflict(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <Header
        title="Fastcase Data Bridge"
        subtitle="Unified client document management, secure bulk import & export, and AI-assisted drafting."
      />

      <div className="p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Navigation Tabs - Responsive Grid */}
        <div className="bg-white rounded-2xl p-2 border border-gray-100 shadow-sm grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
          {[
            { id: "import", label: "Import Documents", icon: HardDriveUpload, desc: "Bulk & Client Files" },
            { id: "library", label: "Document Library", icon: FolderOpen, desc: "Search & Preview" },
            { id: "export", label: "Client Export", icon: Download, desc: "ZIP & Manifests" },
            { id: "migrate", label: "Data Migration", icon: FileSpreadsheet, desc: "Spreadsheet Wizard" },
            { id: "backup", label: "Backup & Restore", icon: ShieldCheck, desc: "Disaster Recovery" },
            { id: "history", label: "Audit & Records", icon: History, desc: "History & Conflicts" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full py-2.5 px-3 rounded-xl text-left transition-all relative flex items-center gap-2.5",
                  isActive
                    ? "bg-sidebar text-white shadow-md shadow-sidebar/10"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    isActive ? "bg-white/10 text-mint" : "bg-gray-100 text-gray-500"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs leading-snug break-words">{tab.label}</div>
                  <div
                    className={cn(
                      "text-[10px] hidden sm:block truncate mt-0.5",
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
                    onChange={(e) => handleClientSelectChange(e.target.value)}
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
                              <span className="text-gray-700 font-medium flex items-center gap-1.5">
                                <span>Client:</span>
                                {item.status === "pending" || item.status === "error" ? (
                                  <select
                                    value={item.clientId || selectedClientId || ""}
                                    onChange={(e) => handleItemClientChange(item.id, e.target.value)}
                                    className="text-[11px] font-semibold py-0.5 px-2 rounded-lg border border-gray-200 bg-white text-sidebar outline-none focus:ring-1 focus:ring-mint"
                                  >
                                    <option value="">-- Unassigned (No Client) --</option>
                                    {clients.map((cl: any) => (
                                      <option key={cl.id} value={cl.id}>
                                        {cl.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-sidebar font-semibold">{item.clientName || selectedClientObj?.name || "Unassigned"}</span>
                                )}
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

                              {/* EDIT WORD / FILE BUTTON */}
                              <button
                                type="button"
                                onClick={() => openFileEditorModal(item)}
                                className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-all flex items-center gap-1 border border-emerald-200"
                                title="Edit Word Document (.docx) or Text Content"
                              >
                                <FileEdit className="w-3.5 h-3.5 text-emerald-600" />
                                Edit File
                              </button>

                              {/* WORKING DOWNLOAD BUTTON */}
                              {item.downloadUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDocument(item)}
                                  disabled={downloadingDocId === (item.docId || item.id)}
                                  className="px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all flex items-center gap-1 disabled:opacity-50"
                                  title="Download Original File"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  {downloadingDocId === (item.docId || item.id) ? "Downloading..." : "Download"}
                                </button>
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

                {/* Unassigned Toggle */}
                <button
                  type="button"
                  onClick={() => setLibUnassignedOnly(!libUnassignedOnly)}
                  className={cn(
                    "px-3 py-2 text-xs rounded-xl border transition-all font-semibold flex items-center gap-1.5",
                    libUnassignedOnly
                      ? "bg-amber-100 text-amber-900 border-amber-300 shadow-sm"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  )}
                  title="Toggle unassigned documents without client links"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Unassigned ({libData?.unassigned_count || 0})
                </button>
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
                    {libUnassignedOnly
                      ? "No unassigned documents pending client association."
                      : (libData?.unassigned_count || 0) > 0
                      ? `You have ${libData?.unassigned_count} unassigned document(s) imported without a client association.`
                      : "Try adjusting your filters or import files from the Import Documents tab."}
                  </p>
                  {!libUnassignedOnly && (libData?.unassigned_count || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setLibUnassignedOnly(true)}
                      className="mt-3 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 inline-flex items-center gap-1"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      View {libData?.unassigned_count} Unassigned Document(s)
                    </button>
                  )}
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
                              <div className="flex items-center gap-1.5">
                                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                                  Unassigned
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(doc)}
                                  className="text-[10px] font-bold text-sidebar hover:underline"
                                  title="Assign this document to a client"
                                >
                                  + Assign
                                </button>
                              </div>
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

                              {/* EDIT WORD / FILE */}
                              <button
                                type="button"
                                onClick={() => openFileEditorModal(doc)}
                                className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
                                title={
                                  doc.name.toLowerCase().endsWith(".docx") || doc.name.toLowerCase().endsWith(".doc")
                                    ? "Edit Word Document (.docx)"
                                    : "Edit Document / File Content"
                                }
                              >
                                <FileEdit className="w-4 h-4" />
                              </button>

                              {/* DOWNLOAD */}
                              <button
                                type="button"
                                onClick={() => handleDownloadDocument(doc)}
                                disabled={downloadingDocId === doc.id}
                                className="p-1.5 rounded-lg text-gray-600 hover:text-sidebar hover:bg-gray-100 transition-colors disabled:opacity-50"
                                title="Download Original File"
                              >
                                <Download className="w-4 h-4" />
                              </button>

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

                              {/* DELETE */}
                              <button
                                type="button"
                                onClick={() => setDeletingDoc({ id: doc.id, name: doc.name })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete Document"
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
                    `/data-bridge/export/practice-backup?include_documents=${includeDocFiles}&passphrase=${encodeURIComponent(
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
        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 6: AUDIT & RECORD MANAGEMENT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Top Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Client Profiles</div>
                  <div className="text-xl font-bold text-gray-900 mt-0.5">
                    {importedData?.summary.total_clients ?? clients.length}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Matters & Court Cases</div>
                  <div className="text-xl font-bold text-gray-900 mt-0.5">
                    {importedData?.summary.total_cases ?? cases.length}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-400 font-medium">Ingested Documents</div>
                  <div className="text-xl font-bold text-gray-900 mt-0.5">
                    {importedData?.summary.total_documents ?? 0}
                  </div>
                </div>
              </div>

              <div className={cn(
                "rounded-2xl p-4 border shadow-sm flex items-center gap-3 transition-colors",
                (importedData?.summary.unassigned_documents || 0) > 0
                  ? "bg-amber-50/70 border-amber-200"
                  : "bg-white border-gray-100"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  (importedData?.summary.unassigned_documents || 0) > 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-400"
                )}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-gray-500 font-medium">Unassigned Files</div>
                  <div className={cn(
                    "text-xl font-bold mt-0.5",
                    (importedData?.summary.unassigned_documents || 0) > 0 ? "text-amber-700" : "text-gray-900"
                  )}>
                    {importedData?.summary.unassigned_documents ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and View Controls */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[260px]">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    placeholder="Search client name, CNR number, matter title, document or tags..."
                    className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                  />
                  {auditSearch && (
                    <button
                      type="button"
                      onClick={() => setAuditSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Client Filter */}
                <select
                  value={auditClientId}
                  onChange={(e) => {
                    setAuditClientId(e.target.value);
                    setAuditCaseId("");
                  }}
                  className="px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mint/30 bg-white font-medium text-gray-800"
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
                  value={auditCaseId}
                  onChange={(e) => setAuditCaseId(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-mint/30 bg-white font-medium text-gray-800"
                >
                  <option value="">All Matters</option>
                  {cases
                    .filter((cs: any) => !auditClientId || cs.client_id === auditClientId)
                    .map((cs: any) => (
                      <option key={cs.id} value={cs.id}>
                        {cs.case_no} — {cs.title}
                      </option>
                    ))}
                </select>

                {/* Refresh */}
                <button
                  type="button"
                  onClick={() => {
                    refetchImported();
                    refetchHistory();
                  }}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                  title="Refresh Audit Data"
                >
                  <RefreshCw className={cn("w-4 h-4", isImportedLoading && "animate-spin text-sidebar")} />
                </button>
              </div>

              {/* Sub-view switcher tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                {[
                  { id: "all", label: "All Records", count: (importedData?.summary.matched_clients || 0) + (importedData?.summary.matched_cases || 0) + (importedData?.summary.matched_documents || 0) },
                  { id: "clients", label: "Client Profiles", count: importedData?.summary.matched_clients || 0 },
                  { id: "cases", label: "Matters & CNR", count: importedData?.summary.matched_cases || 0 },
                  { id: "documents", label: "Ingested Documents", count: importedData?.summary.matched_documents || 0 },
                  { id: "provenance", label: "Provenance Audit Log", count: historyItems?.length || 0 },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setAuditSubView(st.id as any)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all",
                      auditSubView === st.id
                        ? "bg-sidebar text-white shadow-sm"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <span>{st.label}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                      auditSubView === st.id ? "bg-white/20 text-mint" : "bg-gray-200 text-gray-700"
                    )}>
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB CONTENT: PROVENANCE AUDIT LOG */}
            {auditSubView === "provenance" && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <span className="font-bold text-sm text-gray-900">Provenance & Data Bridge Action Log</span>
                  <span className="text-xs text-gray-400">Total Entries: {historyItems?.length || 0}</span>
                </div>
                {!historyItems || historyItems.length === 0 ? (
                  <div className="p-12 text-center text-gray-400">
                    <History className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No provenance events recorded yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-[550px] overflow-y-auto">
                    {historyItems.map((item) => (
                      <div key={item.id} className="p-4 flex items-start justify-between gap-4 text-xs hover:bg-gray-50/60 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{item.action.replace(/_/g, " ")}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600">
                              {item.resource_type}
                            </span>
                            {item.status && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {item.status.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500 font-mono text-[11px]">
                            ID: {item.resource_id}
                            {item.details?.filename && ` • File: ${item.details.filename}`}
                            {item.details?.imported !== undefined && ` • Imported: ${item.details.imported}`}
                            {item.details?.updated !== undefined && ` • Updated: ${item.details.updated}`}
                            {item.details?.skipped !== undefined && ` • Skipped: ${item.details.skipped}`}
                            {item.details?.strategy && ` • Strategy: ${item.details.strategy}`}
                            {item.details?.resolution && ` • Resolution: ${item.details.resolution}`}
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

            {/* TAB CONTENT: CLIENT PROFILES */}
            {(auditSubView === "all" || auditSubView === "clients") && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-sm text-gray-900">
                      Imported Client Profiles ({importedData?.clients.length || 0})
                    </span>
                  </div>
                </div>

                {!importedData?.clients || importedData.clients.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No matching client profiles found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-4">Client Name & Type</th>
                          <th className="py-3 px-4">Contact Info</th>
                          <th className="py-3 px-4">Location</th>
                          <th className="py-3 px-4">Linked Matters / Files</th>
                          <th className="py-3 px-4">Created / Imported</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importedData.clients.map((cl) => (
                          <tr key={cl.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-gray-900">{cl.name}</div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-blue-50 text-blue-700">
                                  {cl.type}
                                </span>
                                {cl.company_name && (
                                  <span className="text-[10px] text-gray-500 truncate max-w-[150px]">
                                    {cl.company_name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-medium text-gray-800">{cl.phone}</div>
                              {cl.email && <div className="text-[10px] text-gray-400">{cl.email}</div>}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {cl.city ? `${cl.city}${cl.state ? `, ${cl.state}` : ""}` : "—"}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {cl.cases_count} Matter{cl.cases_count !== 1 ? "s" : ""}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                  {cl.docs_count} File{cl.docs_count !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-400 whitespace-nowrap">
                              {cl.created_at ? new Date(cl.created_at).toLocaleDateString() : "—"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditClientModal(cl)}
                                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-sidebar hover:bg-gray-100 text-[11px] font-semibold flex items-center gap-1"
                                  title="Edit Client Information"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConflictModal({
                                    isOpen: true,
                                    entityType: "client",
                                    targetRecord: cl,
                                    resolution: "merge",
                                  })}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-semibold flex items-center gap-1 border border-amber-200"
                                  title="Conflict Resolution / Merge with existing"
                                >
                                  <GitMerge className="w-3.5 h-3.5 text-amber-600" />
                                  Conflict / Merge
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

            {/* TAB CONTENT: MATTERS & CNR NUMBERS */}
            {(auditSubView === "all" || auditSubView === "cases") && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-sm text-gray-900">
                      Imported Matters & CNR Details ({importedData?.cases.length || 0})
                    </span>
                  </div>
                </div>

                {!importedData?.cases || importedData.cases.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No matching court matters found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-4">Case No & Matter</th>
                          <th className="py-3 px-4">eCourts CNR Number</th>
                          <th className="py-3 px-4">Associated Client</th>
                          <th className="py-3 px-4">Court & Judge</th>
                          <th className="py-3 px-4">Files</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importedData.cases.map((cs) => (
                          <tr key={cs.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-gray-900">{cs.case_no}</div>
                              <div className="text-[11px] text-gray-600 truncate max-w-[220px] font-medium">
                                {cs.title}
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-semibold bg-gray-100 text-gray-600 mt-0.5 inline-block">
                                {cs.practice_area || "General"}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {cs.ecourts_cnr ? (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                                  <span>{cs.ecourts_cnr}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(cs.ecourts_cnr || "");
                                      toast.success("CNR copied to clipboard!");
                                    }}
                                    className="hover:text-emerald-950 ml-1"
                                    title="Copy CNR"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                                  CNR Missing
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {cs.client_name ? (
                                <span className="font-semibold text-gray-900">{cs.client_name}</span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-gray-900 font-medium truncate max-w-[160px]">{cs.court}</div>
                              {cs.judge && <div className="text-[10px] text-gray-400">Judge: {cs.judge}</div>}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                                {cs.docs_count} Document{cs.docs_count !== 1 ? "s" : ""}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditCaseModal(cs)}
                                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-sidebar hover:bg-gray-100 text-[11px] font-semibold flex items-center gap-1"
                                  title="Edit Case & CNR Number"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Edit / CNR
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConflictModal({
                                    isOpen: true,
                                    entityType: "case",
                                    targetRecord: cs,
                                    resolution: "merge",
                                  })}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-semibold flex items-center gap-1 border border-amber-200"
                                  title="Conflict Resolution / Overwrite duplicate matter"
                                >
                                  <GitMerge className="w-3.5 h-3.5 text-amber-600" />
                                  Conflict / Merge
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

            {/* TAB CONTENT: INGESTED DOCUMENTS */}
            {(auditSubView === "all" || auditSubView === "documents") && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-sm text-gray-900">
                      Ingested Documents & Files ({importedData?.documents.length || 0})
                    </span>
                  </div>
                </div>

                {!importedData?.documents || importedData.documents.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No matching ingested documents found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                        <tr>
                          <th className="py-3 px-4">Document Details</th>
                          <th className="py-3 px-4">Classification</th>
                          <th className="py-3 px-4">Client Association</th>
                          <th className="py-3 px-4">Matter Association</th>
                          <th className="py-3 px-4">Extraction / Hash</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importedData.documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-gray-50/70 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-gray-900 truncate max-w-[220px]">{doc.name}</div>
                              <div className="text-[10px] text-gray-400 mt-0.5">
                                {formatBytes(doc.file_size)} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-700">
                                {DOC_TYPES.find((t) => t.value === doc.doc_type)?.label || doc.doc_type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {doc.client_name ? (
                                <span className="font-semibold text-gray-900">{doc.client_name}</span>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-bold border border-amber-200">
                                    Unassigned
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(doc as any)}
                                    className="text-[10px] font-bold text-sidebar hover:underline"
                                    title="Assign this document to a client"
                                  >
                                    + Assign
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {doc.case_title ? (
                                <div className="truncate max-w-[180px]">
                                  <span className="font-semibold text-sidebar">{doc.case_no}</span>
                                  <div className="text-[10px] text-gray-400 truncate">{doc.case_title}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[10px] text-gray-400">
                              {doc.ocr_processed && (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold mr-1">
                                  OCR Extracted
                                </span>
                              )}
                              {doc.hash_sha256 ? `${doc.hash_sha256.slice(0, 8)}...` : "—"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openDocumentPreview(doc as any)}
                                  className="p-1.5 rounded-lg text-gray-600 hover:text-sidebar hover:bg-gray-100"
                                  title="Preview Document"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {/* EDIT WORD / FILE */}
                                <button
                                  type="button"
                                  onClick={() => openFileEditorModal(doc as any)}
                                  className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 transition-colors"
                                  title="Edit Word / Document Content"
                                >
                                  <FileEdit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDocument(doc)}
                                  disabled={downloadingDocId === doc.id}
                                  className="p-1.5 rounded-lg text-gray-600 hover:text-sidebar hover:bg-gray-100 transition-colors disabled:opacity-50"
                                  title="Download Original"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(doc as any)}
                                  className="px-2.5 py-1.5 rounded-lg bg-sidebar/5 hover:bg-sidebar/10 text-sidebar text-[11px] font-semibold flex items-center gap-1 border border-sidebar/10"
                                  title="Re-assign Association or Change Classification"
                                >
                                  <CornerDownRight className="w-3.5 h-3.5 text-mint" />
                                  Re-assign
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingDoc({ id: doc.id, name: doc.name })}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Delete Document"
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
                  {/* EDIT WORD / FILE BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      const docToEdit = previewDoc;
                      setPreviewDoc(null);
                      openFileEditorModal(docToEdit);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sidebar text-white hover:bg-sidebar-dark text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                    title="Edit Word / Document Content"
                  >
                    <FileEdit className="w-3.5 h-3.5 text-mint" />
                    Edit Word / File
                  </button>

                  <button
                    type="button"
                    onClick={() => openAiDraftModal(previewDoc)}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold flex items-center gap-1 border border-purple-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    AI Draft / Improve
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadDocument(previewDoc)}
                    disabled={downloadingDocId === previewDoc.id}
                    className="px-3 py-1.5 rounded-xl bg-sidebar text-white hover:bg-sidebar-dark text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    title="Download Document"
                  >
                    <Download className="w-3.5 h-3.5 text-mint" />
                    {downloadingDocId === previewDoc.id ? "Downloading..." : "Download"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const toDel = { id: previewDoc.id, name: previewDoc.name };
                      setPreviewDoc(null);
                      setDeletingDoc(toDel);
                    }}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

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
                      <div>
                        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 text-xs">
                          <span className="font-sans text-gray-500">Extracted Document Text</span>
                          <button
                            type="button"
                            onClick={() => {
                              const docToEdit = previewDoc;
                              setPreviewDoc(null);
                              openFileEditorModal(docToEdit);
                            }}
                            className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-sans font-semibold inline-flex items-center gap-1 border border-emerald-200"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-emerald-600" />
                            Edit Document in Word Editor
                          </button>
                        </div>
                        {previewContent}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-400 font-sans">
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-semibold text-gray-700">Preview not natively supported for this format.</p>
                        <p className="text-xs text-gray-400 mt-1 mb-4">
                          You can edit the document content in the in-app editor, download the original file, or use AI Draft.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const docToEdit = previewDoc;
                              setPreviewDoc(null);
                              openFileEditorModal(docToEdit);
                            }}
                            className="px-4 py-2 bg-sidebar text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-mint" />
                            Edit Word / Document Content
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadDocument(previewDoc)}
                            disabled={downloadingDocId === previewDoc.id}
                            className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                          >
                            <Download className="w-3.5 h-3.5" />
                            {downloadingDocId === previewDoc.id ? "Downloading..." : "Download Original File"}
                          </button>
                        </div>
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
      {/* WORD & DOCUMENT IN-APP EDITOR MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editorDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#fcfdfd] shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                  <div className="w-10 h-10 rounded-xl bg-sidebar text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileEdit className="w-5 h-5 text-mint" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editorDocName}
                        onChange={(e) => {
                          setEditorDocName(e.target.value);
                          setEditorHasChanges(true);
                        }}
                        placeholder="Document Name"
                        className="font-bold text-sm text-gray-900 bg-transparent border-b border-dashed border-gray-300 hover:border-sidebar focus:border-sidebar outline-none px-1 py-0.5 max-w-md w-full transition-colors"
                        title="Click to rename document"
                      />
                      {editorDocName.toLowerCase().endsWith(".docx") || editorDocName.toLowerCase().endsWith(".doc") ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                          WORD (.DOCX)
                        </span>
                      ) : editorDocName.toLowerCase().endsWith(".txt") ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          TEXT (.TXT)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 shrink-0">
                          DOCUMENT
                        </span>
                      )}
                      {editorHasChanges && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      {editorDoc.client_name && (
                        <span className="font-medium text-sidebar">Client: {editorDoc.client_name}</span>
                      )}
                      {editorDoc.case_title && (
                        <span>&bull; Matter: {editorDoc.case_title}</span>
                      )}
                      <span>&bull; {editorText.trim() ? editorText.trim().split(/\s+/).length : 0} words</span>
                      <span>&bull; {editorText.length} characters</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Download DOCX */}
                  <button
                    type="button"
                    onClick={handleExportEditorDocx}
                    disabled={isExportingEditorDocx}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200 shadow-sm disabled:opacity-50"
                    title="Export and download formatted Word (.docx) file"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-700" />
                    {isExportingEditorDocx ? "Exporting..." : "Download Word (.docx)"}
                  </button>

                  {/* Download TXT */}
                  <button
                    type="button"
                    onClick={handleExportEditorTxt}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all flex items-center gap-1 shadow-sm"
                    title="Download Plain Text"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Text (.txt)
                  </button>

                  {/* Open in Legal Draft Workspace */}
                  <button
                    type="button"
                    onClick={handleOpenInDraftWorkspace}
                    className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-all flex items-center gap-1 border border-purple-200 shadow-sm"
                    title="Open in Full Legal Drafting Studio"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Draft Studio
                  </button>

                  {/* Save Changes */}
                  <button
                    type="button"
                    disabled={isSavingEditorText}
                    onClick={handleSaveEditorContent}
                    className="px-4 py-1.5 rounded-xl bg-sidebar text-white hover:bg-sidebar-dark text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isSavingEditorText ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-mint" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-mint" />
                        Save Changes
                      </>
                    )}
                  </button>

                  {/* Close */}
                  <button
                    type="button"
                    onClick={() => {
                      if (editorHasChanges) {
                        if (confirm("You have unsaved changes. Are you sure you want to close?")) {
                          setEditorDoc(null);
                        }
                      } else {
                        setEditorDoc(null);
                      }
                    }}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Legal Toolbar */}
              <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
                {/* Legal Clause Snippets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">Insert Legal Clause:</span>
                  <button
                    type="button"
                    onClick={() =>
                      insertTextSnippet(
                        `BEFORE THE HON'BLE HIGH COURT OF JUDICATURE\n\nIN THE MATTER OF:\n... Petitioner\nVersus\n... Respondent\n\nCase No: `
                      )
                    }
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    + Court Heading
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTextSnippet(
                        `PRAYER\n\nWHEREFORE, in the facts and circumstances of the case, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:\n\n(a) Pass an order granting...\n(b) Grant any other relief deemed fit and proper in the interests of justice.`
                      )
                    }
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    + Prayer / Relief
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTextSnippet(
                        `VERIFICATION\n\nI, the deponent abovenamed, do hereby verify and declare that the contents of the above paragraphs are true and correct to the best of my knowledge and belief, and nothing material has been concealed therefrom.\n\nVerified at Mumbai on this ____ day of ________, 2026.\n\nDEPONENT`
                      )
                    }
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    + Verification Clause
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertTextSnippet(
                        `SYNOPSIS & LIST OF DATES\n\nDate\t\tParticulars\n------------------------------------------------------------\n01.01.2026\tCause of action arose...\n`
                      )
                    }
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    + List of Dates
                  </button>
                </div>

                {/* Typography controls */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Font:</span>
                  <select
                    value={editorFontFamily}
                    onChange={(e) => setEditorFontFamily(e.target.value as any)}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 outline-none"
                  >
                    <option value="times">Court Serif (Times)</option>
                    <option value="sans">Executive (Inter / Sans)</option>
                    <option value="mono">Pleading Mono (Courier)</option>
                  </select>

                  <select
                    value={editorFontSize}
                    onChange={(e) => setEditorFontSize(Number(e.target.value))}
                    className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 outline-none"
                  >
                    <option value={12}>12 pt</option>
                    <option value={14}>14 pt</option>
                    <option value={16}>16 pt</option>
                    <option value={18}>18 pt</option>
                  </select>
                </div>
              </div>

              {/* Editor Canvas */}
              <div className="flex-1 bg-gray-100 p-4 sm:p-6 overflow-y-auto flex justify-center relative">
                {isLoadingEditorContent ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 animate-spin text-sidebar mx-auto mb-2" />
                      <p className="text-xs font-medium text-gray-600">Loading document text...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-4xl bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-6 sm:p-10 min-h-[600px]">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 text-xs text-gray-400">
                      <span>Fastcase In-App Document & Word Editor</span>
                      <span>Format: UTF-8 / Standard Court Margins</span>
                    </div>
                    <textarea
                      value={editorText}
                      onChange={(e) => {
                        setEditorText(e.target.value);
                        setEditorHasChanges(true);
                      }}
                      placeholder="Start typing your legal document or Word content here..."
                      style={{
                        fontFamily:
                          editorFontFamily === "times"
                            ? '"Times New Roman", Times, Georgia, serif'
                            : editorFontFamily === "mono"
                            ? 'Courier, "Courier New", monospace'
                            : "var(--font-sans), system-ui, sans-serif",
                        fontSize: `${editorFontSize}px`,
                        lineHeight: 1.7,
                      }}
                      className="flex-1 w-full border-0 outline-none resize-none text-gray-900 bg-transparent min-h-[500px]"
                    />
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

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT CLIENT PROFILE MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingClient && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-sm text-gray-900">Edit Client Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Client Full Name *</label>
                    <input
                      type="text"
                      value={clientForm.name}
                      onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. Ramesh Kumar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      value={clientForm.phone}
                      onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. ramesh@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={clientForm.company_name}
                      onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. ABC Enterprises"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={clientForm.city}
                      onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                    <input
                      type="text"
                      value={clientForm.state}
                      onChange={(e) => setClientForm({ ...clientForm, state: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="State"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={clientForm.pincode}
                      onChange={(e) => setClientForm({ ...clientForm, pincode: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="Pincode"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Tags</label>
                  <textarea
                    rows={2}
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint resize-none"
                    placeholder="Add client notes or provenance details..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingClient}
                  onClick={handleSaveClient}
                  className="px-4 py-2 rounded-xl bg-sidebar text-white text-xs font-bold hover:bg-sidebar-dark flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSavingClient ? "Saving..." : "Save Client Profile"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EDIT CASE & CNR DETAILS MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingCase && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-sm text-gray-900">Edit Matter & eCourts CNR</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Case Number *</label>
                    <input
                      type="text"
                      value={caseForm.case_no}
                      onChange={(e) => setCaseForm({ ...caseForm, case_no: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. WP/1024/2026"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">eCourts CNR Number</label>
                    <input
                      type="text"
                      value={caseForm.ecourts_cnr}
                      onChange={(e) => setCaseForm({ ...caseForm, ecourts_cnr: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint font-mono font-medium"
                      placeholder="e.g. MHHC010099882026"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Matter Title *</label>
                  <input
                    type="text"
                    value={caseForm.title}
                    onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                    placeholder="e.g. State of Maharashtra vs XYZ Corporation"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Court / Forum</label>
                    <input
                      type="text"
                      value={caseForm.court}
                      onChange={(e) => setCaseForm({ ...caseForm, court: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. Bombay High Court"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Presiding Judge</label>
                    <input
                      type="text"
                      value={caseForm.judge}
                      onChange={(e) => setCaseForm({ ...caseForm, judge: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. Justice A. K. Patel"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Assigned Client</label>
                    <select
                      value={caseForm.client_id}
                      onChange={(e) => setCaseForm({ ...caseForm, client_id: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint bg-white font-medium"
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.phone ? `(${c.phone})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Practice Area</label>
                    <input
                      type="text"
                      value={caseForm.practice_area}
                      onChange={(e) => setCaseForm({ ...caseForm, practice_area: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint"
                      placeholder="e.g. Civil / Corporate / Criminal"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCase(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingCase}
                  onClick={handleSaveCase}
                  className="px-4 py-2 rounded-xl bg-sidebar text-white text-xs font-bold hover:bg-sidebar-dark flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSavingCase ? "Saving..." : "Save Matter & CNR"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* CONFLICT RESOLUTION MODAL ("Update / Merge / Overwrite") */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {conflictModal && conflictModal.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-lg p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-sm text-gray-900">
                    Conflict Resolution: {conflictModal.entityType === "client" ? "Client Record" : "Matter / Case"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setConflictModal(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Target Record to Resolve:
                </div>
                <p className="font-medium">
                  {conflictModal.entityType === "client"
                    ? `${conflictModal.targetRecord.name} (${conflictModal.targetRecord.phone})`
                    : `${conflictModal.targetRecord.case_no} — ${conflictModal.targetRecord.title}`}
                </p>
                {conflictModal.targetRecord.ecourts_cnr && (
                  <p className="text-[11px] font-mono text-emerald-800">
                    CNR: {conflictModal.targetRecord.ecourts_cnr}
                  </p>
                )}
              </div>

              {/* Optional Secondary Record Selection if merging two existing items */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Merge With Duplicate / Secondary Record (Optional):
                </label>
                <select
                  value={conflictModal.sourceRecord?.id || ""}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const found = conflictModal.entityType === "client"
                      ? clients.find((c: any) => c.id === selId)
                      : cases.find((cs: any) => cs.id === selId);
                    setConflictModal({ ...conflictModal, sourceRecord: found || undefined });
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-mint bg-white font-medium"
                >
                  <option value="">-- No secondary record (Apply strategy directly to target) --</option>
                  {conflictModal.entityType === "client"
                    ? clients
                        .filter((c: any) => c.id !== conflictModal.targetRecord.id)
                        .map((c: any) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.phone})
                          </option>
                        ))
                    : cases
                        .filter((cs: any) => cs.id !== conflictModal.targetRecord.id)
                        .map((cs: any) => (
                          <option key={cs.id} value={cs.id}>
                            {cs.case_no} — {cs.title}
                          </option>
                        ))}
                </select>
              </div>

              {/* Resolution Strategy Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Choose Resolution Strategy:</label>
                {[
                  {
                    id: "merge",
                    title: "Update & Merge (Recommended)",
                    desc: "Fills missing fields without overwriting existing data. Reassigns all linked cases and documents to the target record without duplicates.",
                  },
                  {
                    id: "overwrite",
                    title: "Overwrite Existing",
                    desc: "Completely replaces target fields with the incoming or secondary record data, while preserving associations.",
                  },
                ].map((strat) => (
                  <label
                    key={strat.id}
                    className={cn(
                      "block p-3 rounded-xl border cursor-pointer transition-all text-xs",
                      conflictModal.resolution === strat.id
                        ? "border-sidebar bg-sidebar/5 ring-1 ring-sidebar"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="conflict_strat"
                        value={strat.id}
                        checked={conflictModal.resolution === strat.id}
                        onChange={() => setConflictModal({ ...conflictModal, resolution: strat.id as any })}
                        className="text-sidebar focus:ring-mint"
                      />
                      <span className="font-bold text-gray-900">{strat.title}</span>
                    </div>
                    <p className="text-gray-500 text-[11px] mt-1 pl-5">{strat.desc}</p>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setConflictModal(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResolvingConflict}
                  onClick={handleExecuteConflictResolution}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isResolvingConflict ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      Resolving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      Execute {conflictModal.resolution.toUpperCase()} Resolution
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deletingDoc && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Delete Document?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This action will remove the document from your library.</p>
                </div>
              </div>

              <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-xs text-gray-700 space-y-1">
                <span className="text-[11px] text-gray-500 block uppercase tracking-wider font-semibold">Document Name</span>
                <span className="font-semibold text-gray-900 break-all">{deletingDoc.name}</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingDoc(null)}
                  disabled={isDeletingDoc}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeletingDoc}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {isDeletingDoc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete Document
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
