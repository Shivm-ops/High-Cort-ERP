"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Plus,
  Search,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  Calendar,
  FileText,
  Edit3,
  Trash2,
  Wand2,
  ExternalLink,
  Loader2,
  Inbox,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import { cn, formatDate } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import {
  useNotices,
  useCreateNotice,
  useUpdateNotice,
  useDeleteNotice,
  useUploadNoticeFile,
  type LegalNotice,
  type NoticeCreatePayload,
} from "@/lib/hooks/useNotices";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";

const NOTICE_TYPES = [
  "Cheque Bounce (u/s 138 NI Act)",
  "Legal Demand / Recovery",
  "Property / Eviction",
  "Consumer Dispute",
  "Family / Matrimonial",
  "GST / Tax Notice",
  "Arbitration / Contract",
  "Defamation",
  "General Legal Notice",
];

const DELIVERY_MODES = [
  "RPAD",
  "Speed Post",
  "Courier",
  "Email",
  "Hand Delivery",
  "WhatsApp",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "mr", label: "Marathi (मराठी)" },
  { value: "hi", label: "Hindi (हिंदी)" },
  { value: "gu", label: "Gujarati (ગુજરાતી)" },
];

type NoticeFormState = {
  direction: "received" | "sent";
  subject: string;
  notice_type: string;
  reference_no: string;
  opponent_name: string;
  opponent_advocate: string;
  opponent_address: string;
  notice_date: string;
  received_date: string;
  reply_deadline: string;
  delivery_mode: string;
  tracking_number: string;
  status: string;
  language: string;
  client_id: string;
  case_id: string;
  document_id: string;
  document_name: string;
  summary: string;
};

const EMPTY_FORM: NoticeFormState = {
  direction: "received",
  subject: "",
  notice_type: "General Legal Notice",
  reference_no: "",
  opponent_name: "",
  opponent_advocate: "",
  opponent_address: "",
  notice_date: "",
  received_date: "",
  reply_deadline: "",
  delivery_mode: "RPAD",
  tracking_number: "",
  status: "pending_reply",
  language: "en",
  client_id: "",
  case_id: "",
  document_id: "",
  document_name: "",
  summary: "",
};

function addDaysIso(baseDateStr: string, days: number): string {
  const base = baseDateStr ? new Date(baseDateStr + "T00:00:00") : new Date();
  if (Number.isNaN(base.getTime())) return "";
  base.setDate(base.getDate() + days);
  return base.toISOString().split("T")[0];
}

export default function NoticesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data, isLoading } = useNotices({
    search: search.trim() || undefined,
    direction: directionFilter !== "all" ? directionFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const { data: clientsData } = useClients({ limit: 100 });
  const { data: casesData } = useCases({ limit: 100 });
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const deleteNotice = useDeleteNotice();
  const uploadNoticeFile = useUploadNoticeFile();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<LegalNotice | null>(null);
  const [form, setForm] = useState<NoticeFormState>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<LegalNotice | null>(null);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);

  const summary = data?.summary ?? {
    total: 0,
    pending_reply: 0,
    overdue: 0,
    due_soon: 0,
    replied: 0,
    sent: 0,
  };
  const notices = data?.notices ?? [];
  const clients = clientsData?.clients ?? [];
  const allCases = casesData?.cases ?? [];

  const filteredCases = useMemo(() => {
    if (!form.client_id) return allCases;
    return allCases.filter((c) => c.client_id === form.client_id);
  }, [allCases, form.client_id]);

  const openCreateModal = () => {
    setEditingNotice(null);
    setForm({
      ...EMPTY_FORM,
      received_date: new Date().toISOString().split("T")[0],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (n: LegalNotice) => {
    setEditingNotice(n);
    setForm({
      direction: n.direction || "received",
      subject: n.subject || "",
      notice_type: n.notice_type || "General Legal Notice",
      reference_no: n.reference_no || "",
      opponent_name: n.opponent_name || "",
      opponent_advocate: n.opponent_advocate || "",
      opponent_address: n.opponent_address || "",
      notice_date: n.notice_date || "",
      received_date: n.received_date || "",
      reply_deadline: n.reply_deadline || "",
      delivery_mode: n.delivery_mode || "RPAD",
      tracking_number: n.tracking_number || "",
      status: n.status || (n.direction === "sent" ? "sent" : "pending_reply"),
      language: n.language || "en",
      client_id: n.client_id || "",
      case_id: n.case_id || "",
      document_id: n.document_id || "",
      document_name: n.document_name || "",
      summary: n.summary || "",
    });
    setIsModalOpen(true);
  };

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadNoticeFile.mutateAsync({
        file,
        client_id: form.client_id || undefined,
        case_id: form.case_id || undefined,
        notice_id: editingNotice?.id,
      });
      setForm((prev) => ({
        ...prev,
        document_id: res.document_id,
        document_name: res.filename,
        notice_type:
          prev.notice_type === "General Legal Notice" && res.detected.notice_type
            ? res.detected.notice_type
            : prev.notice_type,
        language: res.detected.language || prev.language,
        reference_no: prev.reference_no || res.detected.reference_no || "",
        summary: prev.summary || (res.extracted_text ? res.extracted_text.slice(0, 2000) : ""),
      }));
      toast.success(
        res.ocr_processed
          ? "Notice file uploaded and text extracted"
          : "Notice file attached"
      );
    } catch {
      // handled by mutation onError
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.opponent_name.trim()) {
      toast.error("Please enter both Subject and Opponent Name");
      return;
    }

    const payload: NoticeCreatePayload = {
      direction: form.direction,
      subject: form.subject.trim(),
      notice_type: form.notice_type,
      reference_no: form.reference_no.trim() || null,
      opponent_name: form.opponent_name.trim(),
      opponent_advocate: form.opponent_advocate.trim() || null,
      opponent_address: form.opponent_address.trim() || null,
      notice_date: form.notice_date || null,
      received_date: form.received_date || null,
      reply_deadline: form.reply_deadline || null,
      delivery_mode: form.delivery_mode,
      tracking_number: form.tracking_number.trim() || null,
      status: form.status,
      language: form.language,
      client_id: form.client_id || null,
      case_id: form.case_id || null,
      document_id: form.document_id || null,
      summary: form.summary.trim() || null,
    };

    if (editingNotice) {
      await updateNotice.mutateAsync({ id: editingNotice.id, ...payload });
    } else {
      await createNotice.mutateAsync(payload);
    }
    setIsModalOpen(false);
  };

  const handleMarkReplied = async (n: LegalNotice) => {
    await updateNotice.mutateAsync({
      id: n.id,
      status: "replied",
      replied_date: new Date().toISOString().split("T")[0],
    });
  };

  const handleOpenDocument = async (docId: string) => {
    try {
      setOpeningDocId(docId);
      const { data: dl } = await api.get(`/documents/${docId}/download`);
      if (dl?.preview_url) {
        window.open(dl.preview_url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Preview URL unavailable for this document");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setOpeningDocId(null);
    }
  };

  const hasActiveFilters =
    Boolean(search.trim()) || directionFilter !== "all" || statusFilter !== "all";

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header
        title="Notices & Replies"
        subtitle="Track received & sent legal notices, reply deadlines, dispatch details, and saved replies"
        rightContent={
          <div className="flex items-center gap-2.5">
            <Link
              href="/notices/reply-builder"
              className="h-9 px-3.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-charcoal transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5 text-mint-dark" />
              Reply Builder
            </Link>
            <button
              onClick={openCreateModal}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Record Notice
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {summary.total}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Total Notices
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {summary.pending_reply}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Pending Replies
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {summary.overdue}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Overdue ({summary.due_soon} due in 7d)
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {summary.replied + summary.sent}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Replied &amp; Sent ({summary.replied} / {summary.sent})
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[240px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, opponent, advocate, ref no..."
                className="w-full h-9 pl-9 pr-8 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal placeholder:text-muted"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-charcoal"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Direction Pills */}
            <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-100">
              {[
                { key: "all", label: "All" },
                { key: "received", label: "Received" },
                { key: "sent", label: "Sent" },
              ].map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDirectionFilter(d.key)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[12px] font-semibold transition-colors",
                    directionFilter === d.key
                      ? "bg-white text-charcoal shadow-sm"
                      : "text-muted hover:text-charcoal"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: "all", label: "All Status" },
                { key: "pending_reply", label: "Pending Reply" },
                { key: "overdue", label: "Overdue" },
                { key: "replied", label: "Replied" },
                { key: "sent", label: "Sent" },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-colors",
                    statusFilter === st.key
                      ? "bg-mint/15 border-mint/40 text-mint-dark"
                      : "bg-white border-gray-100 text-muted hover:text-charcoal hover:bg-gray-50"
                  )}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notice List / States */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse"
              >
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-mint/10 text-mint-dark flex items-center justify-center mx-auto mb-4">
              {hasActiveFilters ? (
                <Search className="w-6 h-6" />
              ) : (
                <Inbox className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-[16px] font-bold text-charcoal mb-1.5">
              {hasActiveFilters
                ? "No notices match your filters"
                : "No legal notices recorded yet"}
            </h3>
            <p className="text-[13px] text-muted max-w-md mx-auto mb-6">
              {hasActiveFilters
                ? "Try clearing your search or switching status filters to view all tracked notices."
                : "Record received or sent legal notices to track RPAD dispatch dates, reply deadlines, and linked client replies in one place."}
            </p>
            <div className="flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <button
                  onClick={() => {
                    setSearch("");
                    setDirectionFilter("all");
                    setStatusFilter("all");
                  }}
                  className="h-9 px-4 rounded-xl text-[12px] font-semibold bg-gray-100 hover:bg-gray-200 text-charcoal transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <>
                  <button
                    onClick={openCreateModal}
                    className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                      color: "#013B36",
                    }}
                  >
                    <Plus className="w-4 h-4" /> Record Legal Notice
                  </button>
                  <Link
                    href="/notices/reply-builder"
                    className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-charcoal"
                  >
                    <UploadCloud className="w-4 h-4 text-mint-dark" /> Open Reply Builder
                  </Link>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {notices.map((n, i) => {
              const isDueSoon =
                !n.is_overdue &&
                n.direction === "received" &&
                n.status === "pending_reply" &&
                n.days_until_deadline !== null &&
                n.days_until_deadline !== undefined &&
                n.days_until_deadline >= 0 &&
                n.days_until_deadline <= 3;

              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-mint/40 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                          n.is_overdue
                            ? "bg-red-50 text-red-600"
                            : n.status === "replied" || n.status === "sent"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-amber-50 text-amber-600"
                        )}
                      >
                        <FileText className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-[14px] font-bold text-charcoal">
                            {n.subject}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                            {n.notice_type}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded-md",
                              n.direction === "received"
                                ? "bg-blue-50 text-blue-700"
                                : "bg-teal-50 text-teal-700"
                            )}
                          >
                            {n.direction === "received" ? "Received" : "Sent"}
                          </span>
                          {n.reference_no && (
                            <span className="text-[11px] text-muted">
                              Ref: {n.reference_no}
                            </span>
                          )}
                        </div>

                        <div className="text-[12px] text-muted flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            Opponent:{" "}
                            <strong className="text-charcoal font-semibold">
                              {n.opponent_name}
                            </strong>
                            {n.opponent_advocate ? ` (Adv. ${n.opponent_advocate})` : ""}
                          </span>
                          {n.client_name && (
                            <span>
                              Client:{" "}
                              <strong className="text-charcoal font-semibold">
                                {n.client_name}
                              </strong>
                            </span>
                          )}
                          {n.case_id && (
                            <Link
                              href={`/cases/${n.case_id}`}
                              className="text-mint-dark hover:underline font-medium inline-flex items-center gap-1"
                            >
                              {n.case_no || n.case_title || "View Case"}
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        {n.summary && (
                          <p className="text-[12px] text-gray-600 mt-2 line-clamp-2">
                            {n.summary}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-[11px] text-muted">
                          {n.notice_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Notice Date:{" "}
                              <span className="font-semibold text-charcoal">
                                {formatDate(n.notice_date)}
                              </span>
                            </div>
                          )}
                          {n.received_date && (
                            <div className="flex items-center gap-1">
                              <Inbox className="w-3.5 h-3.5" />
                              Received:{" "}
                              <span className="font-semibold text-charcoal">
                                {formatDate(n.received_date)}
                              </span>
                            </div>
                          )}
                          {n.reply_deadline && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Reply Due:{" "}
                              <span
                                className={cn(
                                  "font-semibold",
                                  n.is_overdue
                                    ? "text-red-600"
                                    : isDueSoon
                                    ? "text-amber-600"
                                    : "text-charcoal"
                                )}
                              >
                                {formatDate(n.reply_deadline)}
                              </span>
                            </div>
                          )}
                          {n.replied_date && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Replied:{" "}
                              <span className="font-semibold text-charcoal">
                                {formatDate(n.replied_date)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {n.delivery_mode}
                              {n.tracking_number ? ` · ${n.tracking_number}` : ""}
                            </span>
                          </div>
                        </div>

                        {(n.document_id || n.reply_draft_id) && (
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {n.document_id && (
                              <button
                                onClick={() => handleOpenDocument(n.document_id!)}
                                disabled={openingDocId === n.document_id}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-charcoal transition-colors"
                              >
                                {openingDocId === n.document_id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <FileText className="w-3 h-3 text-muted" />
                                )}
                                {n.document_name || "Attached Notice"}
                              </button>
                            )}
                            {n.reply_draft_id && (
                              <Link
                                href={`/draft-workspace?draftId=${n.reply_draft_id}`}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Saved Reply: {n.reply_draft_title || "Open in Draft Workspace"}
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Status Badge + Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0">
                      <div>
                        {n.is_overdue ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg badge-urgent">
                            Reply Overdue
                          </span>
                        ) : isDueSoon ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800">
                            {n.days_until_deadline === 0
                              ? "Due Today"
                              : `Due in ${n.days_until_deadline}d`}
                          </span>
                        ) : n.status === "replied" ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg badge-active">
                            Replied
                          </span>
                        ) : n.status === "sent" ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg badge-hearing">
                            Sent
                          </span>
                        ) : n.status === "closed" ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700">
                            Closed
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Reply
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() =>
                            router.push(`/notices/reply-builder?noticeId=${n.id}`)
                          }
                          className="h-8 px-3 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 bg-mint/15 hover:bg-mint/25 text-mint-dark transition-colors"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          {n.reply_draft_id ? "Edit Reply" : "Draft Reply"}
                        </button>
                        {n.direction === "received" && n.status === "pending_reply" && (
                          <button
                            onClick={() => handleMarkReplied(n)}
                            disabled={updateNotice.isPending}
                            className="h-8 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                            title="Mark as Replied"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Mark Replied
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(n)}
                          className="w-8 h-8 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"
                          title="Edit Notice"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(n)}
                          className="w-8 h-8 rounded-lg border border-gray-100 bg-white hover:bg-red-50 flex items-center justify-center text-red-500 transition-colors"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Record / Edit Legal Notice Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNotice ? "Edit Legal Notice" : "Record Legal Notice"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
                {(["received", "sent"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        direction: dir,
                        status:
                          !editingNotice
                            ? dir === "sent"
                              ? "sent"
                              : "pending_reply"
                            : prev.status,
                      }))
                    }
                    className={cn(
                      "h-8 rounded-lg text-[12px] font-semibold capitalize transition-colors",
                      form.direction === dir
                        ? "bg-white text-charcoal shadow-sm"
                        : "text-muted hover:text-charcoal"
                    )}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Notice Type
              </label>
              <select
                value={form.notice_type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notice_type: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              >
                {NOTICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              >
                <option value="pending_reply">Pending Reply</option>
                <option value="replied">Replied</option>
                <option value="sent">Sent</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Subject *
              </label>
              <input
                required
                value={form.subject}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, subject: e.target.value }))
                }
                placeholder="e.g., Notice u/s 138 NI Act for Cheque No. 452180"
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Reference No.
              </label>
              <input
                value={form.reference_no}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reference_no: e.target.value }))
                }
                placeholder="e.g., LN/2026/014"
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Opponent / Party Name *
              </label>
              <input
                required
                value={form.opponent_name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, opponent_name: e.target.value }))
                }
                placeholder="Name of sender / recipient party"
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Opponent Advocate
              </label>
              <input
                value={form.opponent_advocate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    opponent_advocate: e.target.value,
                  }))
                }
                placeholder="Advocate name (if applicable)"
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1">
              Opponent / Advocate Address
            </label>
            <input
              value={form.opponent_address}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, opponent_address: e.target.value }))
              }
              placeholder="Postal address for RPAD / Speed Post reply"
              className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Notice Date
              </label>
              <input
                type="date"
                value={form.notice_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notice_date: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                {form.direction === "sent" ? "Dispatch Date" : "Received Date"}
              </label>
              <input
                type="date"
                value={form.received_date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, received_date: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-muted">
                  Reply Deadline
                </label>
                <div className="flex items-center gap-1">
                  {[7, 15, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          reply_deadline: addDaysIso(
                            prev.received_date || prev.notice_date,
                            days
                          ),
                        }))
                      }
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-mint/10 text-mint-dark hover:bg-mint/20"
                    >
                      +{days}d
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="date"
                value={form.reply_deadline}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, reply_deadline: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Delivery Mode
              </label>
              <select
                value={form.delivery_mode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, delivery_mode: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              >
                {DELIVERY_MODES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Tracking / Consignment No.
              </label>
              <input
                value={form.tracking_number}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tracking_number: e.target.value,
                  }))
                }
                placeholder="India Post / Courier ID"
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Language
              </label>
              <select
                value={form.language}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, language: e.target.value }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Link Client (Optional)
              </label>
              <select
                value={form.client_id}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    client_id: e.target.value,
                    case_id: "",
                  }))
                }
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              >
                <option value="">-- No Client Linked --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-muted block mb-1">
                Link Case / Matter (Optional)
              </label>
              <select
                value={form.case_id}
                onChange={(e) => {
                  const chosenCaseId = e.target.value;
                  const caseObj = allCases.find((c) => c.id === chosenCaseId);
                  setForm((prev) => ({
                    ...prev,
                    case_id: chosenCaseId,
                    client_id:
                      prev.client_id || (caseObj ? caseObj.client_id : ""),
                  }));
                }}
                className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
              >
                <option value="">-- Pre-litigation / No Case --</option>
                {filteredCases.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    {cs.case_no ? `${cs.case_no} — ` : ""}
                    {cs.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Attach Document */}
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/70 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[12px]">
              <UploadCloud className="w-4 h-4 text-mint-dark shrink-0" />
              <div>
                <div className="font-semibold text-charcoal">
                  {form.document_name
                    ? `Attached: ${form.document_name}`
                    : "Attach Scanned Notice (PDF, Image, DOCX, TXT)"}
                </div>
                <div className="text-[11px] text-muted">
                  Text is extracted automatically into the summary when available.
                </div>
              </div>
            </div>
            <label className="h-8 px-3 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-charcoal cursor-pointer inline-flex items-center gap-1.5">
              {uploadNoticeFile.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  {form.document_id ? "Replace File" : "Choose File"}
                </>
              )}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.docx"
                onChange={handleFileAttach}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1">
              Summary / Key Allegations &amp; Facts
            </label>
            <textarea
              rows={3}
              value={form.summary}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, summary: e.target.value }))
              }
              placeholder="Paste notice summary, claim amount, cheque details, or key allegations..."
              className="w-full p-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createNotice.isPending || updateNotice.isPending}
              className="h-9 px-5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              {(createNotice.isPending || updateNotice.isPending) && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              {editingNotice ? "Save Changes" : "Save Notice"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Legal Notice"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-gray-600">
            Are you sure you want to remove{" "}
            <strong className="text-charcoal">{deleteTarget?.subject}</strong>?
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!deleteTarget) return;
                await deleteNotice.mutateAsync(deleteTarget.id);
                setDeleteTarget(null);
              }}
              disabled={deleteNotice.isPending}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteNotice.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
