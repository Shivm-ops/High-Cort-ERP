"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  Upload,
  Search,
  File,
  Image as ImageIcon,
  FileText,
  Film,
  Archive,
  Download,
  X,
  Loader2,
  ExternalLink,
  Copy,
  ShieldCheck,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ClipboardList,
  Printer,
  Filter,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  useDocuments,
  uploadDocument,
  updateDocumentMeta,
  deleteDocumentById,
  type Document as DocItem,
} from "@/lib/hooks/useDocuments";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import {
  useEvidenceChecklist,
  useGenerateFilingPackage,
  type FilingPackageResponse,
} from "@/lib/hooks/useEvidence";
import { downloadDocumentFile } from "@/lib/utils/download";
import { getDocumentContent } from "@/lib/hooks/useDataBridge";
import { API_URL, getErrorMessage } from "@/lib/api";

function resolveFullStreamUrl(relativeUrl: string): string {
  if (!relativeUrl) return "";
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }
  const root = API_URL.replace("/api/v1", "");
  return `${root}${relativeUrl}`;
}

const DOC_TYPES = [
  { value: "evidence_document", label: "Evidence & Annexures" },
  { value: "court_document", label: "Pleadings & Court Docs" },
  { value: "order", label: "Court Orders" },
  { value: "judgment", label: "Judgments" },
  { value: "notice", label: "Notices" },
  { value: "reply", label: "Replies" },
  { value: "identity_document", label: "Client KYC / ID" },
  { value: "medical_record", label: "Medical Records" },
  { value: "bank_record", label: "Bank Records" },
  { value: "property_record", label: "Property Records" },
  { value: "photo", label: "Photos" },
  { value: "other", label: "Other" },
];

const EVIDENCE_STATUSES = [
  { value: "uploaded", label: "Uploaded" },
  { value: "verified", label: "Verified" },
  { value: "filed", label: "Filed in Court" },
  { value: "marked_exhibit", label: "Marked Exhibit" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const TYPE_COLORS: Record<string, string> = {
  pdf: "#EF4444",
  image: "#3B82F6",
  video: "#A78BFA",
  archive: "#F59E0B",
  other: "#6B7280",
};

function renderDocIcon(typeGroup: string, className: string, color: string) {
  switch (typeGroup) {
    case "pdf":
      return <FileText className={className} style={{ color }} />;
    case "image":
      return <ImageIcon className={className} style={{ color }} />;
    case "video":
      return <Film className={className} style={{ color }} />;
    case "archive":
      return <Archive className={className} style={{ color }} />;
    default:
      return <File className={className} style={{ color }} />;
  }
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const getExtension = (filename: string, mime: string) => {
  const parts = filename.split(".");
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase() || "";
    if (ext && ext.length <= 4 && /^[a-z0-9]+$/.test(ext)) return ext;
  }
  if (mime) {
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("image") || mime.includes("png") || mime.includes("jpeg")) {
      return "image";
    }
    if (mime.includes("word") || mime.includes("officedocument")) return "docx";
  }
  return "other";
};

function getEvidenceStatusBadge(status?: string | null) {
  switch (status) {
    case "accepted":
    case "marked_exhibit":
      return {
        label: status === "marked_exhibit" ? "Marked Exhibit" : "Accepted",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "verified":
    case "filed":
      return {
        label: status === "filed" ? "Filed" : "Verified",
        cls: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "rejected":
      return {
        label: "Rejected",
        cls: "bg-red-50 text-red-700 border-red-200",
      };
    case "uploaded":
    default:
      return {
        label: "Uploaded",
        cls: "bg-amber-50 text-amber-700 border-amber-200",
      };
  }
}

export default function EvidencePage() {
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("all");
  const [evidenceOnly, setEvidenceOnly] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Preview modal
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadClient, setUploadClient] = useState("");
  const [uploadCase, setUploadCase] = useState("");
  const [uploadDocType, setUploadDocType] = useState("evidence_document");
  const [uploadIsEvidence, setUploadIsEvidence] = useState(true);
  const [uploadExhibitNo, setUploadExhibitNo] = useState("");
  const [uploadEvidenceStatus, setUploadEvidenceStatus] = useState("uploaded");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Edit / Mark Exhibit modal
  const [editingDoc, setEditingDoc] = useState<DocItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editClient, setEditClient] = useState("");
  const [editCase, setEditCase] = useState("");
  const [editDocType, setEditDocType] = useState("other");
  const [editIsEvidence, setEditIsEvidence] = useState(false);
  const [editExhibitNo, setEditExhibitNo] = useState("");
  const [editEvidenceStatus, setEditEvidenceStatus] = useState("uploaded");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState<DocItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Printable Evidence Index modal
  const [indexModalData, setIndexModalData] =
    useState<FilingPackageResponse | null>(null);

  const { documents, isLoading, mutate } = useDocuments();
  const { data: clientsData } = useClients({ limit: 200 });
  const { data: casesData } = useCases({ limit: 200 });
  const { data: checklistData, refetch: refetchChecklist } =
    useEvidenceChecklist(selectedCaseId);
  const generatePackage = useGenerateFilingPackage(selectedCaseId);

  const clients = clientsData?.clients ?? [];
  const allCases = casesData?.cases ?? [];

  const filterCases = useMemo(() => {
    if (!selectedClientId) return allCases;
    return allCases.filter((c) => c.client_id === selectedClientId);
  }, [allCases, selectedClientId]);

  const uploadModalCases = useMemo(() => {
    if (!uploadClient) return allCases;
    return allCases.filter((c) => c.client_id === uploadClient);
  }, [allCases, uploadClient]);

  const editModalCases = useMemo(() => {
    if (!editClient) return allCases;
    return allCases.filter((c) => c.client_id === editClient);
  }, [allCases, editClient]);

  const stats = useMemo(() => {
    const total = documents.length;
    const exhibits = documents.filter(
      (d) => d.is_evidence || Boolean(d.exhibit_number)
    ).length;
    const pending = documents.filter(
      (d) =>
        d.is_evidence &&
        (!d.evidence_status || d.evidence_status === "uploaded")
    ).length;
    const verifiedOrFiled = documents.filter((d) =>
      ["verified", "filed", "marked_exhibit", "accepted"].includes(
        d.evidence_status || ""
      )
    ).length;
    return { total, exhibits, pending, verifiedOrFiled };
  }, [documents]);

  const filteredDocs = useMemo(() => {
    const s = search.trim().toLowerCase();
    const searchPhone = s.replace(/[^0-9]/g, "");
    return documents.filter((doc) => {
      const matchesSearch =
        !s ||
        doc.name.toLowerCase().includes(s) ||
        (doc.exhibit_number && doc.exhibit_number.toLowerCase().includes(s)) ||
        (doc.case_no && doc.case_no.toLowerCase().includes(s)) ||
        (doc.case_title && doc.case_title.toLowerCase().includes(s)) ||
        (doc.client_name && doc.client_name.toLowerCase().includes(s)) ||
        (doc.client_phone &&
          searchPhone &&
          doc.client_phone.replace(/[^0-9]/g, "").includes(searchPhone));

      const matchesClient =
        !selectedClientId || doc.client_id === selectedClientId;
      const matchesCase = !selectedCaseId || doc.case_id === selectedCaseId;
      const matchesType =
        selectedDocType === "all" || doc.doc_type === selectedDocType;
      const matchesEvidence =
        !evidenceOnly || doc.is_evidence || Boolean(doc.exhibit_number);

      return (
        matchesSearch &&
        matchesClient &&
        matchesCase &&
        matchesType &&
        matchesEvidence
      );
    });
  }, [
    documents,
    search,
    selectedClientId,
    selectedCaseId,
    selectedDocType,
    evidenceOnly,
  ]);

  const openUploadModal = (opts?: {
    file?: File | null;
    caseId?: string;
    clientId?: string;
    docType?: string;
  }) => {
    setUploadFile(opts?.file ?? null);
    setUploadClient(opts?.clientId ?? selectedClientId ?? "");
    setUploadCase(opts?.caseId ?? selectedCaseId ?? "");
    setUploadDocType(opts?.docType ?? "evidence_document");
    setUploadIsEvidence(
      (opts?.docType ?? "evidence_document") === "evidence_document"
    );
    setUploadExhibitNo("");
    setUploadEvidenceStatus("uploaded");
    setUploadDescription("");
    setShowUploadModal(true);
  };

  const openEditModal = (doc: DocItem) => {
    setEditingDoc(doc);
    setEditName(doc.name || "");
    setEditClient(doc.client_id || "");
    setEditCase(doc.case_id || "");
    setEditDocType(doc.doc_type || "other");
    setEditIsEvidence(Boolean(doc.is_evidence));
    setEditExhibitNo(doc.exhibit_number || "");
    setEditEvidenceStatus(doc.evidence_status || "uploaded");
    setEditDescription(doc.description || "");
  };

  const openDocPreview = async (doc: DocItem) => {
    setSelectedDoc(doc);
    setIsLoadingPreview(true);
    setPreviewContent("");
    setPreviewUrl("");

    try {
      const data = await getDocumentContent(doc.id);
      if (data.preview_url) {
        setPreviewUrl(resolveFullStreamUrl(data.preview_url));
      } else {
        setPreviewUrl(
          resolveFullStreamUrl(
            `/api/v1/documents/${doc.id}/stream?disposition=inline`
          )
        );
      }
      if (data.text) {
        setPreviewContent(data.text);
      }
    } catch {
      setPreviewUrl(
        resolveFullStreamUrl(
          `/api/v1/documents/${doc.id}/stream?disposition=inline`
        )
      );
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast.error("Please select a file to upload");
      return;
    }
    setIsUploading(true);
    try {
      await uploadDocument(
        uploadFile,
        uploadCase || undefined,
        uploadClient || undefined,
        uploadDocType,
        uploadDescription.trim() || undefined,
        {
          is_evidence: uploadIsEvidence,
          exhibit_number: uploadIsEvidence ? uploadExhibitNo.trim() : undefined,
          evidence_status: uploadIsEvidence ? uploadEvidenceStatus : undefined,
        }
      );
      toast.success("Document uploaded successfully");
      setShowUploadModal(false);
      setUploadFile(null);
      await mutate();
      if (selectedCaseId) refetchChecklist();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editName.trim()) {
      toast.error("Document name cannot be empty");
      return;
    }
    setIsSavingEdit(true);
    try {
      await updateDocumentMeta(editingDoc.id, {
        name: editName.trim(),
        doc_type: editDocType,
        client_id: editClient,
        case_id: editCase,
        description: editDescription.trim(),
        is_evidence: editIsEvidence,
        exhibit_number: editIsEvidence ? editExhibitNo.trim() : "",
        evidence_status: editIsEvidence ? editEvidenceStatus : "",
      });
      toast.success("Document & exhibit details updated");
      setEditingDoc(null);
      await mutate();
      if (selectedCaseId) refetchChecklist();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDocumentById(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      if (selectedDoc?.id === deleteTarget.id) {
        setSelectedDoc(null);
      }
      setDeleteTarget(null);
      await mutate();
      if (selectedCaseId) refetchChecklist();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateIndex = async () => {
    if (!selectedCaseId) return;
    const res = await generatePackage.mutateAsync();
    setIndexModalData(res);
  };

  const selectedDocExt = selectedDoc
    ? getExtension(selectedDoc.name, selectedDoc.mime_type || "")
    : "other";
  const selectedDocTypeGroup = ["pdf"].includes(selectedDocExt)
    ? "pdf"
    : ["jpg", "jpeg", "png", "gif", "image"].includes(selectedDocExt)
    ? "image"
    : "other";
  const selectedDocColor =
    TYPE_COLORS[selectedDocTypeGroup] || TYPE_COLORS.other;
  const selectedDocCase = selectedDoc
    ? selectedDoc.case_no
      ? `${selectedDoc.case_no} — ${selectedDoc.case_title}`
      : selectedDoc.client_name
      ? `Client: ${selectedDoc.client_name}`
      : "Unassigned"
    : "";
  const selectedDocSize = selectedDoc
    ? formatBytes(selectedDoc.file_size || 0)
    : "";

  const checklist = checklistData?.checklist ?? [];
  const uploadedChecklistCount = checklist.filter((i) => i.uploaded).length;
  const hasFilters =
    Boolean(search.trim()) ||
    Boolean(selectedClientId) ||
    Boolean(selectedCaseId) ||
    selectedDocType !== "all" ||
    evidenceOnly;

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header
        title="Evidence & Documents"
        subtitle="Courtroom exhibit register, case documents, filing checklists, and evidence index"
        rightContent={
          <div className="flex items-center gap-2.5">
            <Link
              href="/data-bridge?tab=import"
              className="h-9 px-3.5 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white text-charcoal hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FolderOpen className="w-3.5 h-3.5 text-sidebar" />
              Bulk Import
            </Link>
            <button
              onClick={() => openUploadModal()}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              <Upload className="w-3.5 h-3.5" strokeWidth={2.5} />
              Upload Document
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-[1440px] mx-auto space-y-5">
        {/* KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {stats.total}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Total Documents
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-mint/15 text-mint-dark flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {stats.exhibits}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Court Exhibits
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {stats.pending}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Pending Verification
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {stats.verifiedOrFiled}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Verified / Filed / Accepted
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              placeholder="Search doc, exhibit, case, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal placeholder:text-muted"
            />
          </div>

          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              setSelectedCaseId("");
            }}
            className="h-9 px-3 rounded-xl text-[12px] text-charcoal bg-gray-50 border border-gray-100 focus:outline-none max-w-[200px]"
          >
            <option value="">All Clients</option>
            {clients.map((cl) => (
              <option key={cl.id} value={cl.id}>
                {cl.name}
              </option>
            ))}
          </select>

          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="h-9 px-3 rounded-xl text-[12px] text-charcoal bg-gray-50 border border-gray-100 focus:outline-none max-w-[260px]"
          >
            <option value="">All Cases (Select for Checklist)</option>
            {filterCases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_no ? `${c.case_no} — ` : ""}
                {c.title.slice(0, 38)}
              </option>
            ))}
          </select>

          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="h-9 px-3 rounded-xl text-[12px] text-charcoal bg-gray-50 border border-gray-100 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {DOC_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setEvidenceOnly((prev) => !prev)}
            className={cn(
              "h-9 px-3 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 border transition-colors",
              evidenceOnly
                ? "bg-mint/15 border-mint/40 text-mint-dark"
                : "bg-white border-gray-200 text-muted hover:text-charcoal"
            )}
          >
            <Filter className="w-3.5 h-3.5" />
            Evidence Only
          </button>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedClientId("");
                setSelectedCaseId("");
                setSelectedDocType("all");
                setEvidenceOnly(false);
              }}
              className="h-9 px-3 rounded-xl text-[12px] font-semibold text-gray-500 hover:text-charcoal hover:bg-gray-50"
            >
              Reset
            </button>
          )}
        </div>

        {/* Case Checklist + Evidence Index Bar (when a Case is selected) */}
        {selectedCaseId && (
          <div className="bg-white rounded-2xl border border-mint/30 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-mint/15 text-mint-dark flex items-center justify-center">
                  <ClipboardList className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[14px] font-bold text-charcoal flex items-center gap-2">
                    Required Documents Checklist
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                      {uploadedChecklistCount} / {checklist.length} Ready
                    </span>
                  </h2>
                  <p className="text-[11px] text-muted">
                    Practice-area checklist matched automatically against uploaded case documents.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateIndex}
                disabled={generatePackage.isPending}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
              >
                {generatePackage.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Printer className="w-3.5 h-3.5" />
                )}
                Generate Evidence Index
              </button>
            </div>

            {checklist.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border p-3 flex items-center justify-between gap-2",
                      item.uploaded
                        ? "bg-emerald-50/40 border-emerald-100"
                        : "bg-gray-50/70 border-gray-100"
                    )}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {item.uploaded ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle
                          className={cn(
                            "w-4 h-4 shrink-0",
                            item.required ? "text-amber-500" : "text-gray-400"
                          )}
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold text-charcoal truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-muted">
                          {item.uploaded
                            ? item.matched_documents?.[0]?.name || "Uploaded"
                            : item.required
                            ? "Required · Missing"
                            : "Optional"}
                        </div>
                      </div>
                    </div>

                    {!item.uploaded && (
                      <button
                        type="button"
                        onClick={() =>
                          openUploadModal({
                            caseId: selectedCaseId,
                            clientId:
                              allCases.find((c) => c.id === selectedCaseId)
                                ?.client_id || selectedClientId,
                            docType: DOC_TYPES.some((d) => d.value === item.type)
                              ? item.type
                              : "evidence_document",
                          })
                        }
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 text-charcoal shrink-0"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Working Drag & Drop Zone */}
        <div
          onClick={() => openUploadModal()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) {
              openUploadModal({ file: dropped });
            }
          }}
          className="border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer bg-white/60"
          style={{
            borderColor: isDragging ? "#6EE7B7" : "#E5E7EB",
            background: isDragging ? "rgba(110,231,183,0.08)" : undefined,
          }}
        >
          <Upload
            className="w-7 h-7 mx-auto mb-1.5"
            style={{ color: isDragging ? "#059669" : "#9CA3AF" }}
          />
          <div className="text-[13px] font-semibold text-charcoal">
            Drag &amp; drop a document or exhibit here, or click to upload
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            Supports PDF, Images, Word (.docx), and Text — with automatic OCR indexing &amp; Exhibit tagging
          </div>
        </div>

        {/* Documents & Exhibits Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-sidebar" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-mint/10 text-mint-dark flex items-center justify-center mx-auto mb-4">
              {hasFilters ? (
                <Search className="w-6 h-6" />
              ) : (
                <FolderOpen className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-[16px] font-bold text-charcoal mb-1.5">
              {hasFilters
                ? "No documents match your filters"
                : "No evidence or case documents uploaded yet"}
            </h3>
            <p className="text-[13px] text-muted max-w-md mx-auto mb-6">
              {hasFilters
                ? "Clear search or category filters to see all client and case files."
                : "Upload courtroom exhibits, pleadings, client KYC, or orders here — or use Bulk Import in Data Bridge to bring in an entire folder."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {hasFilters ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedClientId("");
                    setSelectedCaseId("");
                    setSelectedDocType("all");
                    setEvidenceOnly(false);
                  }}
                  className="h-9 px-4 rounded-xl text-[12px] font-semibold bg-gray-100 hover:bg-gray-200 text-charcoal"
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={() => openUploadModal()}
                    className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                      color: "#013B36",
                    }}
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload First Document
                  </button>
                  <Link
                    href="/data-bridge?tab=import"
                    className="h-9 px-4 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Bulk Import Folder
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => {
              const fileExt = getExtension(doc.name, doc.mime_type || "");
              const typeGroup = ["pdf"].includes(fileExt)
                ? "pdf"
                : ["jpg", "jpeg", "png", "gif", "image"].includes(fileExt)
                ? "image"
                : "other";
              const color = TYPE_COLORS[typeGroup] || TYPE_COLORS.other;
              const statusBadge = getEvidenceStatusBadge(doc.evidence_status);

              return (
                <div
                  key={doc.id}
                  onClick={() => openDocPreview(doc)}
                  className="group bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-[#6EE7B7] hover:shadow-md transition-all relative overflow-hidden flex flex-col"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex items-start justify-between mb-3 mt-1 gap-2">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      {renderDocIcon(typeGroup, "w-5 h-5", color)}
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      {doc.exhibit_number && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md">
                          {doc.exhibit_number}
                        </span>
                      )}
                      {doc.is_evidence && (
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                            statusBadge.cls
                          )}
                        >
                          {statusBadge.label}
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-muted bg-gray-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {fileExt}
                      </span>
                    </div>
                  </div>

                  <h3
                    className="text-[13px] font-semibold text-charcoal mb-1.5 truncate"
                    title={doc.name}
                  >
                    {doc.name}
                  </h3>

                  <div
                    className="text-[11px] text-muted truncate mb-1 flex items-center gap-1.5"
                    title={
                      doc.case_no
                        ? `${doc.case_no} — ${doc.case_title}`
                        : "Pre-litigation / General Doc"
                    }
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">
                      {doc.case_no
                        ? `${doc.case_no} — ${doc.case_title}`
                        : "General / No Case Linked"}
                    </span>
                  </div>

                  {doc.client_name ? (
                    <div className="text-[10px] text-gray-500 font-medium truncate mb-3 pl-5">
                      Client:{" "}
                      <span className="font-semibold text-charcoal">
                        {doc.client_name}
                      </span>
                      {doc.client_phone && (
                        <span className="text-gray-400 font-normal ml-1">
                          ({doc.client_phone})
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mb-3" />
                  )}

                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-muted font-medium">
                    <span>
                      {formatBytes(doc.file_size || 0)} ·{" "}
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>

                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
                        title="Edit / Mark Exhibit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadDocumentFile(doc.id, doc.name)}
                        className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(doc)}
                        className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-500"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Document / Exhibit Modal */}
      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Document or Evidence"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Client (Optional)
              </label>
              <select
                value={uploadClient}
                onChange={(e) => {
                  setUploadClient(e.target.value);
                  setUploadCase("");
                }}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              >
                <option value="">-- Optional: Select Client --</option>
                {clients.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name} ({cl.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Case / Matter (Optional)
              </label>
              <select
                value={uploadCase}
                onChange={(e) => {
                  const cid = e.target.value;
                  setUploadCase(cid);
                  const found = allCases.find((c) => c.id === cid);
                  if (found && !uploadClient && found.client_id) {
                    setUploadClient(found.client_id);
                  }
                }}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              >
                <option value="">-- General Client / Pre-litigation --</option>
                {uploadModalCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_no ? `${c.case_no} — ` : ""}
                    {c.title.slice(0, 45)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Document Category
              </label>
              <select
                value={uploadDocType}
                onChange={(e) => setUploadDocType(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uploadIsEvidence}
                onChange={(e) => setUploadIsEvidence(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-700"
              />
              <span className="text-[12px] font-semibold text-charcoal">
                Mark as Court Evidence / Exhibit
              </span>
            </label>
          </div>

          {uploadIsEvidence && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Exhibit Number (Optional)
                </label>
                <input
                  value={uploadExhibitNo}
                  onChange={(e) => setUploadExhibitNo(e.target.value)}
                  placeholder="e.g., Ex. P-1, Ex. D-2"
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Evidence Status
                </label>
                <select
                  value={uploadEvidenceStatus}
                  onChange={(e) => setUploadEvidenceStatus(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none"
                >
                  {EVIDENCE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Notes / Description (Optional)
            </label>
            <input
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              placeholder="Brief note about this filing or exhibit..."
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Select File *
            </label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              {uploadFile ? (
                <div className="text-sm font-semibold text-sidebar">
                  {uploadFile.name} ({formatBytes(uploadFile.size)})
                </div>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-600">
                    Click to browse or drop file here
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    PDF, JPG, PNG, DOC, DOCX, TXT
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="h-9 px-4 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!uploadFile || isUploading}
              onClick={handleUpload}
              className="h-9 px-4 text-[12px] font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-sm"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Document & Exhibit Modal */}
      <Modal
        open={Boolean(editingDoc)}
        onClose={() => setEditingDoc(null)}
        title="Edit Document & Exhibit Details"
        size="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Document Name *
            </label>
            <input
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Client
              </label>
              <select
                value={editClient}
                onChange={(e) => {
                  setEditClient(e.target.value);
                  setEditCase("");
                }}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              >
                <option value="">-- No Client Linked --</option>
                {clients.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Case / Matter
              </label>
              <select
                value={editCase}
                onChange={(e) => {
                  const cid = e.target.value;
                  setEditCase(cid);
                  const found = allCases.find((c) => c.id === cid);
                  if (found && !editClient && found.client_id) {
                    setEditClient(found.client_id);
                  }
                }}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              >
                <option value="">-- No Case Linked --</option>
                {editModalCases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.case_no ? `${c.case_no} — ` : ""}
                    {c.title.slice(0, 45)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Category
              </label>
              <select
                value={editDocType}
                onChange={(e) => setEditDocType(e.target.value)}
                className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={editIsEvidence}
                onChange={(e) => setEditIsEvidence(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-700"
              />
              <span className="text-[12px] font-semibold text-charcoal">
                Mark as Court Evidence / Exhibit
              </span>
            </label>
          </div>

          {editIsEvidence && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Exhibit Number
                </label>
                <input
                  value={editExhibitNo}
                  onChange={(e) => setEditExhibitNo(e.target.value)}
                  placeholder="e.g., Ex. P-1, Ex. D-1"
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Evidence Status
                </label>
                <select
                  value={editEvidenceStatus}
                  onChange={(e) => setEditEvidenceStatus(e.target.value)}
                  className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-[12px] focus:outline-none"
                >
                  {EVIDENCE_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Description / Notes
            </label>
            <input
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setEditingDoc(null)}
              className="h-9 px-4 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingEdit}
              className="h-9 px-5 text-[12px] font-semibold rounded-xl flex items-center gap-2 shadow-sm disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Document"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-gray-600">
            Are you sure you want to delete{" "}
            <strong className="text-charcoal">{deleteTarget?.name}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="h-9 px-4 text-[12px] font-semibold border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="h-9 px-4 text-[12px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Printable Courtroom Evidence Index Modal */}
      <Modal
        open={Boolean(indexModalData)}
        onClose={() => setIndexModalData(null)}
        title="Courtroom Evidence Index"
        size="lg"
      >
        {indexModalData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[14px] font-bold text-charcoal">
                  {indexModalData.case_no
                    ? `${indexModalData.case_no} — `
                    : ""}
                  {indexModalData.case_title}
                </div>
                <div className="text-[12px] text-muted">
                  {(indexModalData.items || []).length} marked evidence item(s)
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 print:hidden"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Save PDF
              </button>
            </div>

            {!indexModalData.items || indexModalData.items.length === 0 ? (
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center text-[13px] text-muted">
                No documents in this case are marked as Court Evidence yet. Use{" "}
                <strong className="text-charcoal">Edit / Mark Exhibit</strong>{" "}
                on a document to include it in the court index.
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                    <tr>
                      <th className="px-3 py-2.5">S.No</th>
                      <th className="px-3 py-2.5">Exhibit No.</th>
                      <th className="px-3 py-2.5">Document Name</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {indexModalData.items.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2.5 font-medium">{row.s_no}</td>
                        <td className="px-3 py-2.5 font-semibold text-indigo-700">
                          {row.exhibit}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-charcoal">
                          {row.name}
                        </td>
                        <td className="px-3 py-2.5 capitalize">
                          {row.status.replace("_", " ")}
                        </td>
                        <td className="px-3 py-2.5 text-muted">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: "92vh", height: "85vh" }}
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${selectedDocColor}15` }}
                  >
                    {renderDocIcon(
                      selectedDocTypeGroup,
                      "w-5 h-5",
                      selectedDocColor
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3
                      className="text-[15px] font-semibold text-charcoal truncate"
                      title={selectedDoc.name}
                    >
                      {selectedDoc.name}
                    </h3>
                    <p className="text-[12px] text-muted truncate">
                      {selectedDocCase} · {selectedDocSize}
                      {selectedDoc.exhibit_number
                        ? ` · ${selectedDoc.exhibit_number}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 hover:text-charcoal transition-colors"
                      title="Open full document in new tab"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 hover:text-charcoal transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-gray-50/60 p-3 sm:p-5 flex flex-col items-center justify-center min-h-0 overflow-hidden">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-sidebar mb-3" />
                    <p className="text-xs font-medium text-gray-500">
                      Loading document preview...
                    </p>
                  </div>
                ) : selectedDocExt === "pdf" ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded-xl border border-gray-200 bg-white shadow-inner"
                    title={selectedDoc.name}
                  />
                ) : ["jpg", "jpeg", "png", "gif", "webp", "image"].includes(
                    selectedDocExt
                  ) ? (
                  <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-white rounded-xl border border-gray-200">
                    <img
                      src={previewUrl}
                      alt={selectedDoc.name}
                      className="max-h-full max-w-full object-contain rounded-lg"
                    />
                  </div>
                ) : previewContent ? (
                  <div className="w-full h-full p-6 overflow-y-auto bg-white font-serif text-xs leading-relaxed text-gray-800 whitespace-pre-wrap rounded-xl border border-gray-200 shadow-inner">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 text-xs">
                      <span className="font-sans font-semibold text-gray-700">
                        Extracted Document Text
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(previewContent);
                          toast.success("Text copied to clipboard!");
                        }}
                        className="text-sidebar hover:underline font-sans text-xs flex items-center gap-1 font-semibold"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Text
                      </button>
                    </div>
                    <p className="font-mono text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {previewContent}
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                    {renderDocIcon(
                      selectedDocTypeGroup,
                      "w-14 h-14 mx-auto mb-3 opacity-30",
                      selectedDocColor
                    )}
                    <div className="text-[14px] font-semibold text-gray-700">
                      No Inline Preview Available
                    </div>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      This file format cannot be displayed directly in-browser. Click &quot;Download Filing&quot; below to open it locally.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white flex-shrink-0">
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-gray-100 text-muted font-medium">
                    {DOC_TYPES.find((d) => d.value === selectedDoc.doc_type)
                      ?.label || selectedDoc.doc_type}
                  </span>
                  {selectedDoc.exhibit_number && (
                    <span className="text-[11px] px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
                      {selectedDoc.exhibit_number}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const doc = selectedDoc;
                      setSelectedDoc(null);
                      openEditModal(doc);
                    }}
                    className="px-4 py-2 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit / Mark Exhibit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadDocumentFile(selectedDoc.id, selectedDoc.name);
                    }}
                    className="px-5 py-2 rounded-xl text-[12px] font-semibold flex items-center gap-2 transition-all shadow-sm hover:opacity-95"
                    style={{
                      background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                      color: "#013B36",
                    }}
                  >
                    <Download className="w-4 h-4" /> Download Filing
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
