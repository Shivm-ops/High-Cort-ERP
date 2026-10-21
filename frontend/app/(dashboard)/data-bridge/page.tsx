"use client";

import React, { useState, useRef, useEffect } from "react";
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
  AlertTriangle
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, API_URL, getErrorMessage } from "@/lib/api";
import { useCases } from "@/lib/hooks/useCases";
import { useClients } from "@/lib/hooks/useClients";
import {
  BridgeUploadItem,
  useDataBridgeHistory,
  uploadBridgeFile,
  analyzeBridgeFile,
  previewMigrationFile,
  validateMigrationData,
  executeMigration,
  MigrationPreviewResult,
  MigrationValidationResult,
  MigrationExecutionResult
} from "@/lib/hooks/useDataBridge";

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
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

export default function DataBridgePage() {
  const [activeTab, setActiveTab] = useState<"import" | "migrate" | "export" | "history">("import");

  const { data: casesData } = useCases({ limit: 300 });
  const { data: clientsData } = useClients({ limit: 300 });
  const cases = casesData?.cases || [];
  const clients = clientsData?.clients || [];

  const { data: historyItems, refetch: refetchHistory } = useDataBridgeHistory();

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 1: LOCAL FILE & FOLDER IMPORT STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [uploadQueue, setUploadQueue] = useState<BridgeUploadItem[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [enableOcr, setEnableOcr] = useState<boolean>(true);
  const [autoClassify, setAutoClassify] = useState<boolean>(true);
  const [isProcessingQueue, setIsProcessingQueue] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = async (files: FileList | File[], isFolder = false) => {
    const newItems: BridgeUploadItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const relPath = (file as any).webkitRelativePath || file.name;
      const ext = file.name.split(".").pop()?.toLowerCase() || "";

      // Quick client-side filter
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
      });
    }

    if (newItems.length === 0) return;
    setUploadQueue((prev) => [...prev, ...newItems]);
    toast.info(`Added ${newItems.length} file(s) to import queue`);

    // Perform background classification hints for pending items
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
                    caseId: q.caseId || res.hints?.suggested_case_id,
                    caseTitle: res.hints?.suggested_case_title,
                    clientId: q.clientId || res.hints?.suggested_client_id,
                    clientName: res.hints?.suggested_client_name,
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
      toast.info("No pending files to upload");
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
  // TAB 2: LEGACY DATA MIGRATION WIZARD STATE
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

  const downloadSampleTemplate = (type: "client" | "case") => {
    let csvContent = "";
    let filename = "";
    if (type === "client") {
      filename = "Fastcase_Client_Import_Template.csv";
      csvContent =
        "Name,Phone,Email,Type,Address,City,State,Pincode,PAN,Company Name,Notes\n" +
        "Ramesh Kumar,9876543210,ramesh@example.com,individual,Flat 4B Bandra West,Mumbai,Maharashtra,400050,ABCDE1234F,,Important client\n" +
        "TechCorp India Pvt Ltd,9822334455,legal@techcorp.in,corporate,Plot 12 MIDC Hinjawadi,Pune,Maharashtra,411057,AAACT9999K,TechCorp India,Corporate retainer\n";
    } else {
      filename = "Fastcase_Case_Import_Template.csv";
      csvContent =
        "Case No,Title,Court,Practice Area,Judge,Petitioner,Respondent,Opposing Counsel,Filing Date,Next Hearing Date\n" +
        "WP-1042/2026,Sharma vs State of Maharashtra,High Court of Bombay,Civil,Justice R. K. Deshmukh,Rajesh Sharma,State of Maharashtra,Adv. M. P. Rao,2026-01-15,2026-11-20\n" +
        "CC-450/2025,Tata Motors vs AutoSpares Ltd,Sessions Court Mumbai,Commercial,Chief Metropolitan Magistrate,Tata Motors,AutoSpares Ltd,Adv. S. K. Gupta,2025-08-10,2026-12-05\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TAB 3: EXPORT & BACKUP STATE
  // ─────────────────────────────────────────────────────────────────────────────
  const [exportCaseId, setExportCaseId] = useState<string>("");
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const downloadExport = async (endpoint: string, fallbackName: string) => {
    setIsExporting(true);
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
      setIsExporting(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header
        title="Data Bridge"
        subtitle="Import local legal records, migrate legacy CSV/Excel data, and securely export practice archives."
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-2 overflow-x-auto pb-1">
          {[
            { id: "import", label: "Local Files & Folders Import", icon: HardDriveUpload },
            { id: "migrate", label: "Legacy Data Migration (CSV / Excel)", icon: FileSpreadsheet },
            { id: "export", label: "Export & Practice Recovery", icon: Download },
            { id: "history", label: "Audit & Migration History", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-all shrink-0 border-b-2",
                  isActive
                    ? "border-sidebar text-sidebar bg-white shadow-sm"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-sidebar" : "text-gray-400")} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: LOCAL FILES & FOLDERS IMPORT */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "import" && (
          <div className="space-y-6">
            {/* Top configuration panel */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Target Case / Matter (Optional)
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white"
                >
                  <option value="">Auto-Detect or Select Case...</option>
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.case_no} — {c.title}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">If blank, AI will auto-detect case from filename/CNR</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Target Client (Optional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white"
                >
                  <option value="">Auto-Detect or Select Client...</option>
                  {clients.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.name} ({cl.phone})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">Associates documents with this client's profile</p>
              </div>

              <div className="flex flex-col justify-center space-y-2 pt-1">
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
                  <span>Intelligent Type Classification & Provenance</span>
                </label>
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

            {/* Queue List */}
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

                <div className="divide-y divide-gray-100 max-h-[450px] overflow-y-auto">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors gap-4">
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
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>{formatBytes(item.size)}</span>
                            {item.caseTitle && (
                              <span className="text-sidebar font-medium">Matter: {item.caseTitle}</span>
                            )}
                            {item.clientName && (
                              <span className="text-gray-600">Client: {item.clientName}</span>
                            )}
                            {item.docType && item.docType !== "other" && (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                                {DOC_TYPES.find((t) => t.value === item.docType)?.label || item.docType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
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
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Imported
                          </span>
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
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: LEGACY DATA MIGRATION (CSV / EXCEL WIZARD) */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "migrate" && (
          <div className="space-y-6">
            {/* Stepper Header */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
              {[
                { step: 1, label: "Upload File" },
                { step: 2, label: "Map Columns" },
                { step: 3, label: "Validation & Duplicates" },
                { step: 4, label: "Import Execution" },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2 flex-1 justify-center">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      migrationStep >= s.step
                        ? "bg-sidebar text-white"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {s.step}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-semibold hidden md:inline",
                      migrationStep >= s.step ? "text-gray-900" : "text-gray-400"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* STEP 1: UPLOAD */}
            {migrationStep === 1 && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm space-y-6">
                <div className="text-center max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-sidebar flex items-center justify-center mx-auto mb-3">
                    <FileSpreadsheet className="w-7 h-7 text-sidebar" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Upload Legacy Spreadsheet</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Migrate existing clients or matter registries from CSV or Excel (.xlsx) files.
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate("client")}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-sidebar" />
                    Download Client Template CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadSampleTemplate("case")}
                    className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-sidebar" />
                    Download Case Template CSV
                  </button>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-sidebar/40 transition-colors max-w-xl mx-auto">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    id="migFileSelect"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleMigrationFileSelected(e.target.files[0])}
                  />
                  <label htmlFor="migFileSelect" className="cursor-pointer block">
                    <FileUp className="w-8 h-8 text-sidebar mx-auto mb-2" />
                    <span className="text-sm font-semibold text-sidebar">Click to choose CSV or Excel file</span>
                    <span className="block text-xs text-gray-400 mt-1">.csv, .xlsx, .xls up to 50 MB</span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 2: COLUMN MAPPING */}
            {migrationStep === 2 && previewData && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Map Columns to Fastcase Fields</h3>
                    <p className="text-xs text-gray-500">
                      File: {previewData.filename} ({previewData.total_rows} rows detected)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600">Import As:</span>
                    <select
                      value={migrationEntity}
                      onChange={(e) => setMigrationEntity(e.target.value as any)}
                      className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                    >
                      <option value="client">Client Records</option>
                      <option value="case">Cases / Matters</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(migrationEntity === "client"
                    ? [
                        { key: "name", label: "Client Full Name *", required: true },
                        { key: "phone", label: "Phone / Mobile *", required: true },
                        { key: "email", label: "Email Address" },
                        { key: "company_name", label: "Company / Firm Name" },
                        { key: "address", label: "Address" },
                        { key: "city", label: "City" },
                        { key: "state", label: "State" },
                        { key: "pincode", label: "Pincode" },
                        { key: "pan", label: "PAN Card Number" },
                        { key: "notes", label: "Notes / Remarks" },
                      ]
                    : [
                        { key: "case_no", label: "Case / Petition Number *", required: true },
                        { key: "title", label: "Case Title *", required: true },
                        { key: "court", label: "Court / Forum Name *", required: true },
                        { key: "practice_area", label: "Practice Area", required: true },
                        { key: "client_name", label: "Client Name" },
                        { key: "judge", label: "Judge / Bench" },
                        { key: "petitioner", label: "Petitioner / Appellant" },
                        { key: "respondent", label: "Respondent / Defendant" },
                        { key: "opposing_counsel", label: "Opposing Counsel" },
                        { key: "filing_date", label: "Filing Date (YYYY-MM-DD or DD/MM/YYYY)" },
                        { key: "next_hearing_date", label: "Next Hearing Date" },
                      ]
                  ).map((field) => (
                    <div key={field.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 border border-gray-100">
                      <div>
                        <span className="text-xs font-semibold text-gray-900">{field.label}</span>
                        {field.required && <span className="text-red-500 ml-1 text-xs">*</span>}
                      </div>
                      <select
                        value={columnMapping[field.key] || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                        className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none bg-white font-medium max-w-[200px]"
                      >
                        <option value="">(Ignore Column)</option>
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
                    Validate & Check Duplicates <ArrowRight className="w-3.5 h-3.5 text-mint" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: VALIDATION & DUPLICATE RESOLUTION */}
            {migrationStep === 3 && validationResult && (
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-base font-bold text-gray-900">Validation & Duplicate Resolution</h3>
                  <p className="text-xs text-gray-500">
                    Review validation results before committing records to the database.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <span className="text-xs font-medium text-blue-600">Total Rows</span>
                    <p className="text-2xl font-bold text-blue-900 mt-1">{validationResult.total_evaluated}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <span className="text-xs font-medium text-emerald-600">Valid & Ready</span>
                    <p className="text-2xl font-bold text-emerald-900 mt-1">{validationResult.valid_count}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                    <span className="text-xs font-medium text-amber-600">Duplicates Detected</span>
                    <p className="text-2xl font-bold text-amber-900 mt-1">{validationResult.duplicate_count}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                    <span className="text-xs font-medium text-red-600">Invalid / Missing Req</span>
                    <p className="text-2xl font-bold text-red-900 mt-1">{validationResult.invalid_count}</p>
                  </div>
                </div>

                {/* Duplicate strategy picker */}
                {validationResult.duplicate_count > 0 && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Duplicate Handling Strategy:
                    </div>
                    <div className="flex flex-wrap gap-3 pt-1">
                      {[
                        { id: "skip", label: "Skip Duplicates (Keep existing record untouched)" },
                        { id: "update", label: "Update Existing (Overwrite empty fields with import data)" },
                        { id: "create_new", label: "Create As New (Allow separate parallel record)" },
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

            {/* STEP 4: COMPLETION REPORT */}
            {migrationStep === 4 && migrationResult && (
              <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Migration Completed Successfully!</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Your legacy records have been processed and integrated with Fastcase.
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
        {/* TAB 3: EXPORT & PRACTICE RECOVERY */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "export" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Case Documents Export */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-mint/10 text-sidebar flex items-center justify-center mb-3">
                  <FileArchive className="w-5 h-5 text-sidebar" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Case Documents Bundle (ZIP)</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Export all authorized filings, pleadings, orders, and evidence for a specific case into an organized ZIP archive with SHA-256 MANIFEST.
                </p>
                <div className="mt-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Select Case</label>
                  <select
                    value={exportCaseId}
                    onChange={(e) => setExportCaseId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white"
                  >
                    <option value="">Choose Case / Matter...</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.case_no} — {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={!exportCaseId || isExporting}
                onClick={() => downloadExport(`/data-bridge/export/case/${exportCaseId}`, "Case_Documents.zip")}
                className="w-full py-2.5 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-mint" />
                Download Case ZIP Archive
              </button>
            </div>

            {/* 2. Structured Data CSV */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Structured Data Export (CSV)</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Export your client directory or active cases to standard CSV spreadsheets with formula-injection defenses for offline reporting.
                </p>
              </div>

              <div className="space-y-2 pt-4">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => downloadExport("/data-bridge/export/clients", "Fastcase_Clients.csv")}
                  className="w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-sidebar" />
                  Export All Clients (CSV)
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => downloadExport("/data-bridge/export/cases", "Fastcase_Cases.csv")}
                  className="w-full py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-sidebar" />
                  Export All Cases (CSV)
                </button>
              </div>
            </div>

            {/* 3. Full Practice Disaster Recovery Backup */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-3">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Full Practice Backup Package</h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Download a complete firm archive package containing clients, cases, document manifests, and backup metadata for disaster recovery.
                </p>
              </div>

              <button
                type="button"
                disabled={isExporting}
                onClick={() => downloadExport("/data-bridge/export/practice-backup", "Fastcase_Practice_Backup.zip")}
                className="w-full py-2.5 rounded-xl bg-sidebar text-white text-xs font-semibold hover:bg-sidebar-dark disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-mint" />
                Generate Complete Backup (ZIP)
              </button>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* TAB 4: AUDIT & MIGRATION HISTORY */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Data Bridge Activity Log</h3>
                <p className="text-xs text-gray-500">Immutable firm audit trail for imports, migrations, and exports.</p>
              </div>
              <button
                type="button"
                onClick={() => refetchHistory()}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="divide-y divide-gray-100">
              {(!historyItems || historyItems.length === 0) ? (
                <div className="p-8 text-center text-gray-400 text-xs">
                  No Data Bridge operations recorded yet. Upload files or export data to see activity here.
                </div>
              ) : (
                historyItems.map((item) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sidebar">
                        <History className="w-4 h-4 text-sidebar" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">
                            {item.action.replace("DATA_BRIDGE_", "").replace("_", " ")}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded uppercase font-semibold bg-gray-100 text-gray-600">
                            {item.resource_type}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {typeof item.details === "object"
                            ? item.details.filename ||
                              (item.details.imported !== undefined && `Imported: ${item.details.imported}, Updated: ${item.details.updated}`) ||
                              JSON.stringify(item.details)
                            : item.details}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
