import useSWR from "swr";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "../api";
import { toast } from "sonner";

export interface Document {
  id: string;
  name: string;
  original_filename?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  doc_type: string;
  case_id?: string;
  case_no?: string;
  case_title?: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  uploaded_by_id?: string;
  signature_status?: string;
  signature_request_id?: string;
  created_at: string;
  tags?: string[];
  description?: string;
  ocr_processed?: boolean;
}

export function useDocuments(caseId?: string, clientId?: string, docType?: string) {
  const params = new URLSearchParams();
  if (caseId) params.append("case_id", caseId);
  if (clientId) params.append("client_id", clientId);
  if (docType) params.append("doc_type", docType);

  const queryStr = params.toString() ? `?${params.toString()}` : "";
  
  const { data, error, isLoading, mutate } = useSWR<{total: number, documents: Document[]}>(
    `/documents${queryStr}`,
    (url: string) => api.get(url).then(res => res.data)
  );

  return {
    documents: data?.documents || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate
  };
}

export function useRequestESign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/documents/${id}/request-esign`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("e-Sign request sent successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export const uploadDocument = async (file: File, caseId?: string, clientId?: string, docType = "other", description?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (caseId) formData.append("case_id", caseId);
  if (clientId) formData.append("client_id", clientId);
  formData.append("doc_type", docType);
  if (description) formData.append("description", description);
  formData.append("enable_ocr", "true");

  const response = await api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export function useUploadDocument() {
  return useMutation({
    mutationFn: async (payload: { file: File; case_id?: string; client_id?: string; doc_type?: string; description?: string }) => {
      return uploadDocument(payload.file, payload.case_id, payload.client_id, payload.doc_type || "other", payload.description);
    }
  });
}
