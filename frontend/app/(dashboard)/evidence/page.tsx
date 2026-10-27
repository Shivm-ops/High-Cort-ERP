"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Upload, Search, File, Image as ImageIcon, FileText, Film, Archive, Plus, Download, Tag, X, Loader2, ExternalLink, Copy } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { useDocuments, uploadDocument } from "@/lib/hooks/useDocuments";
import { useCases } from "@/lib/hooks/useCases";
import { downloadDocumentFile } from "@/lib/utils/download";
import { getDocumentContent } from "@/lib/hooks/useDataBridge";
import { API_URL } from "@/lib/api";

function resolveFullStreamUrl(relativeUrl: string): string {
  if (!relativeUrl) return "";
  if (relativeUrl.startsWith("http://") || relativeUrl.startsWith("https://")) {
    return relativeUrl;
  }
  const root = API_URL.replace("/api/v1", "");
  return `${root}${relativeUrl}`;
}

const TYPE_ICONS: Record<string, React.ElementType> = { 
  pdf: FileText, image: ImageIcon, video: Film, archive: Archive, other: File 
};
const TYPE_COLORS: Record<string, string> = { 
  pdf: "#EF4444", image: "#3B82F6", video: "#A78BFA", archive: "#F59E0B", other: "#6B7280" 
};

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const getExtension = (filename: string, mime: string) => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    const ext = parts.pop()?.toLowerCase() || '';
    if (ext && ext.length <= 4 && /^[a-z0-9]+$/.test(ext)) return ext;
  }
  if (mime) {
    if (mime.includes("pdf")) return "pdf";
    if (mime.includes("image") || mime.includes("png") || mime.includes("jpeg")) return "image";
    if (mime.includes("word") || mime.includes("officedocument")) return "docx";
  }
  return "other";
};

export default function EvidencePage() {
  const [search, setSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCase, setUploadCase] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const openDocPreview = async (doc: any) => {
    setSelectedDoc(doc);
    setIsLoadingPreview(true);
    setPreviewContent("");
    setPreviewUrl("");

    try {
      const data = await getDocumentContent(doc.id);
      if (data.preview_url) {
        setPreviewUrl(resolveFullStreamUrl(data.preview_url));
      } else {
        setPreviewUrl(resolveFullStreamUrl(`/api/v1/documents/${doc.id}/stream?disposition=inline`));
      }
      if (data.text) {
        setPreviewContent(data.text);
      }
    } catch (e) {
      setPreviewUrl(resolveFullStreamUrl(`/api/v1/documents/${doc.id}/stream?disposition=inline`));
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const { documents, isLoading, mutate } = useDocuments();
  const { data: casesData } = useCases({ limit: 200 });

  const selectedDocExt = selectedDoc ? getExtension(selectedDoc.name, selectedDoc.mime_type || "") : "other";
  const selectedDocTypeGroup = ['pdf'].includes(selectedDocExt) ? 'pdf' : ['jpg', 'jpeg', 'png', 'gif', 'image'].includes(selectedDocExt) ? 'image' : 'other';
  const SelectedDocIcon = TYPE_ICONS[selectedDocTypeGroup] || File;
  const selectedDocColor = TYPE_COLORS[selectedDocTypeGroup] || TYPE_COLORS.other;
  const selectedDocCase = selectedDoc ? (selectedDoc.case_no ? `${selectedDoc.case_no} — ${selectedDoc.case_title}` : "Unassigned") : "";
  const selectedDocSize = selectedDoc ? formatBytes(selectedDoc.file_size || 0) : "";
  const selectedDocTags: string[] = selectedDoc ? (selectedDoc.tags || [selectedDoc.doc_type || 'evidence_document']) : [];

  const filteredDocs = documents.filter((doc) => {
    const s = search.toLowerCase();
    const searchPhone = s.replace(/[^0-9]/g, "");
    const matchesSearch = 
      doc.name.toLowerCase().includes(s) ||
      (doc.case_title && doc.case_title.toLowerCase().includes(s)) ||
      (doc.client_name && doc.client_name.toLowerCase().includes(s)) ||
      (doc.client_phone && searchPhone && doc.client_phone.replace(/[^0-9]/g, "").includes(searchPhone));
      
    const matchesCase = !selectedCaseId || doc.case_id === selectedCaseId;
    return matchesSearch && matchesCase;
  });

  const handleUpload = async () => {
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      await uploadDocument(uploadFile, uploadCase || undefined, undefined, "evidence_document");
      toast.success("Document uploaded successfully");
      setShowUploadModal(false);
      setUploadFile(null);
      mutate();
    } catch (e) {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Evidence & Documents" subtitle="Manage case documents, evidence, and files" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input type="text" placeholder="Search by document, case, client name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="w-full h-9 pl-9 pr-3 rounded-xl text-[13px] bg-white border border-gray-100 focus:outline-none text-charcoal placeholder:text-muted" />
          </div>
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="h-9 px-3 rounded-xl text-[12px] text-charcoal bg-white border border-gray-100 focus:outline-none max-w-xs"
          >
            <option value="">All Cases</option>
            {casesData?.cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_no} — {c.title.slice(0, 40)} {c.client_name ? `(${c.client_name})` : ""}
              </option>
            ))}
          </select>
          <a
            href="/data-bridge"
            className="ml-auto h-9 px-3.5 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sidebar" /> Bulk Import via Data Bridge
          </a>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5" style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" }}>
            <Upload className="w-3.5 h-3.5" /> Upload File
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onClick={() => setShowUploadModal(true)}
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
          className="border-2 border-dashed rounded-2xl p-6 text-center mb-5 transition-all cursor-pointer"
          style={{ borderColor: isDragging ? "#6EE7B7" : "#E5E7EB", background: isDragging ? "rgba(110,231,183,0.04)" : "transparent" }}
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: isDragging ? "#6EE7B7" : "#D1D5DB" }} />
          <div className="text-[13px] font-medium text-muted">Drag & drop files here, or click to browse</div>
          <div className="text-[11px] text-muted/60 mt-1">PDF, images, Word documents — OCR processing enabled</div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-sidebar" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDocs.map((doc) => {
              const fileExt = getExtension(doc.name, doc.mime_type || "");
              const typeGroup = ['pdf'].includes(fileExt) ? 'pdf' : ['jpg', 'jpeg', 'png', 'gif', 'image'].includes(fileExt) ? 'image' : 'other';
              const Icon = TYPE_ICONS[typeGroup] || File;
              const color = TYPE_COLORS[typeGroup] || TYPE_COLORS.other;

              return (
                <div key={doc.id} onClick={() => openDocPreview(doc)} className="group bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:border-[#6EE7B7] hover:shadow-sm transition-all relative overflow-hidden flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: color }} />
                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <span className="text-[11px] font-semibold text-muted bg-gray-50 px-2 py-0.5 rounded-md uppercase tracking-wider">{fileExt}</span>
                  </div>
                  
                  <h3 className="text-[13px] font-semibold text-charcoal mb-1.5 truncate" title={doc.name}>{doc.name}</h3>
                  <div className="text-[11px] text-muted truncate mb-1 flex items-center gap-1.5" title={doc.case_no ? `${doc.case_no} — ${doc.case_title}` : "Unassigned"}>
                    <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                    <span>{doc.case_no ? `${doc.case_no} — ${doc.case_title}` : "Unassigned"}</span>
                  </div>
                  {doc.client_name ? (
                    <div className="text-[10px] text-gray-500 font-medium truncate mb-3 pl-5">
                      Client: <span className="font-semibold text-charcoal">{doc.client_name}</span> {doc.client_phone && <span className="text-gray-400 font-normal ml-1">({doc.client_phone})</span>}
                    </div>
                  ) : (
                    <div className="mb-3" />
                  )}

                  <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between text-[11px] text-muted font-medium">
                    <span>{formatBytes(doc.file_size || 0)}</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal open={showUploadModal} onClose={() => setShowUploadModal(false)} title="Upload Evidence Document">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Case / Matter</label>
            <select
              value={uploadCase}
              onChange={(e) => setUploadCase(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar"
            >
              <option value="">Select a case</option>
              {casesData?.cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_no} — {c.title.slice(0, 50)} {c.client_name ? `(${c.client_name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setUploadFile(e.target.files[0]);
                  }
                }}
              />
              <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
              {uploadFile ? (
                <div className="text-sm font-medium text-sidebar">{uploadFile.name}</div>
              ) : (
                <>
                  <div className="text-sm font-medium text-gray-600">Click to browse or drag & drop</div>
                  <div className="text-xs text-gray-400 mt-1">Supported formats: PDF, JPG, PNG</div>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setShowUploadModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200">Cancel</button>
            <button 
              disabled={!uploadFile || !uploadCase || isUploading}
              onClick={handleUpload}
              className="px-4 py-2 text-sm font-medium text-white bg-sidebar hover:bg-sidebar/90 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDoc(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: "92vh", height: "85vh" }}
            >
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${selectedDocColor}15` }}>
                    {React.createElement(SelectedDocIcon, { className: "w-5 h-5", style: { color: selectedDocColor } })}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-charcoal truncate" title={selectedDoc.name}>{selectedDoc.name}</h3>
                    <p className="text-[12px] text-muted truncate">{selectedDocCase} · {selectedDocSize}</p>
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
                  <button onClick={() => setSelectedDoc(null)} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-muted hover:bg-gray-100 hover:text-charcoal transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-gray-50/60 p-3 sm:p-5 flex flex-col items-center justify-center min-h-0 overflow-hidden">
                {isLoadingPreview ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-sidebar mb-3" />
                    <p className="text-xs font-medium text-gray-500">Loading document preview...</p>
                  </div>
                ) : selectedDocExt === "pdf" ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-full rounded-xl border border-gray-200 bg-white shadow-inner"
                    title={selectedDoc.name}
                  />
                ) : ["jpg", "jpeg", "png", "gif", "webp", "image"].includes(selectedDocExt) ? (
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
                      <span className="font-sans font-semibold text-gray-700">Extracted Document Text</span>
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
                    <p className="font-mono text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{previewContent}</p>
                  </div>
                ) : (
                  <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-sm p-10 text-center">
                    {React.createElement(SelectedDocIcon, { className: "w-14 h-14 mx-auto mb-3 opacity-30", style: { color: selectedDocColor } })}
                    <div className="text-[14px] font-semibold text-gray-700">No Inline Preview Available</div>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      This file format cannot be displayed directly in-browser. Click &quot;Download Filing&quot; below to open it locally.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-5 border-t border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex gap-2 flex-wrap">
                  {selectedDocTags.map(t => <span key={t} className="text-[11px] px-2 py-1 rounded-md bg-gray-100 text-muted font-medium">{t}</span>)}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedDoc(null)} className="px-4 py-2 rounded-xl text-[13px] font-medium text-muted hover:bg-gray-50 transition-colors">Close</button>
                  <button 
                    onClick={() => {
                      if (selectedDoc?.id) {
                        downloadDocumentFile(selectedDoc.id, selectedDoc.name);
                      } else {
                        toast.error("Document ID not available for download");
                      }
                      setSelectedDoc(null);
                    }}
                    className="px-5 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all shadow-sm hover:opacity-95" 
                    style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" }}
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
