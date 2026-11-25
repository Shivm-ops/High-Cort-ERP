import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface LegalNotice {
  id: string;
  firm_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_address?: string | null;
  case_id?: string | null;
  case_no?: string | null;
  case_title?: string | null;
  document_id?: string | null;
  document_name?: string | null;
  document_mime_type?: string | null;
  document_ocr_text?: string | null;
  reply_draft_id?: string | null;
  reply_draft_title?: string | null;
  reply_draft_content?: string | null;
  direction: "received" | "sent";
  subject: string;
  notice_type: string;
  reference_no?: string | null;
  opponent_name: string;
  opponent_advocate?: string | null;
  opponent_address?: string | null;
  notice_date?: string | null;
  received_date?: string | null;
  reply_deadline?: string | null;
  replied_date?: string | null;
  delivery_mode: string;
  tracking_number?: string | null;
  status: "pending_reply" | "replied" | "sent" | "draft" | "closed";
  is_overdue: boolean;
  days_until_deadline?: number | null;
  summary?: string | null;
  language: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface NoticeSummary {
  total: number;
  pending_reply: number;
  overdue: number;
  due_soon: number;
  replied: number;
  sent: number;
}

export interface NoticeListResponse {
  total: number;
  summary: NoticeSummary;
  notices: LegalNotice[];
}

export interface NoticeCreatePayload {
  direction?: "received" | "sent";
  subject: string;
  notice_type?: string;
  reference_no?: string | null;
  opponent_name: string;
  opponent_advocate?: string | null;
  opponent_address?: string | null;
  notice_date?: string | null;
  received_date?: string | null;
  reply_deadline?: string | null;
  replied_date?: string | null;
  delivery_mode?: string;
  tracking_number?: string | null;
  status?: string;
  summary?: string | null;
  language?: string;
  client_id?: string | null;
  case_id?: string | null;
  document_id?: string | null;
  reply_draft_id?: string | null;
}

export type NoticeUpdatePayload = Partial<NoticeCreatePayload>;

export interface NoticeUploadResult {
  document_id: string;
  filename: string;
  ocr_processed: boolean;
  extracted_text: string;
  detected: {
    notice_type: string;
    language: string;
    notice_date?: string | null;
    reference_no?: string | null;
  };
}

const KEYS = {
  all: ["notices"] as const,
  list: (params?: Record<string, unknown>) => ["notices", "list", params] as const,
  detail: (id: string) => ["notices", "detail", id] as const,
};

export function useNotices(params?: {
  search?: string;
  direction?: string;
  status?: string;
  client_id?: string;
  case_id?: string;
}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/notices/", { params });
      return data as NoticeListResponse;
    },
  });
}

export function useNotice(id?: string) {
  return useQuery({
    queryKey: KEYS.detail(id || ""),
    queryFn: async () => {
      const { data } = await api.get(`/notices/${id}`);
      return data as LegalNotice;
    },
    enabled: !!id,
  });
}

export function useCreateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NoticeCreatePayload) => {
      const { data } = await api.post("/notices/", payload);
      return data as LegalNotice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Legal notice recorded");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: NoticeUpdatePayload & { id: string }) => {
      const { data } = await api.put(`/notices/${id}`, payload);
      return data as LegalNotice;
    },
    onSuccess: (notice) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(notice.id) });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Notice updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteNotice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/notices/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Notice deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUploadNoticeFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      file: File;
      case_id?: string;
      client_id?: string;
      notice_id?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", payload.file);
      if (payload.case_id) formData.append("case_id", payload.case_id);
      if (payload.client_id) formData.append("client_id", payload.client_id);
      if (payload.notice_id) formData.append("notice_id", payload.notice_id);

      const { data } = await api.post("/notices/extract-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as NoticeUploadResult;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
