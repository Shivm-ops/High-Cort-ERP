import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface CaseLaw {
  id: string;
  title: string;
  citation?: string;
  court_name?: string;
  judge_name?: string;
  judgment_date?: string;
  practice_area?: string;
  keywords: string[];
  mapped_sections: string[];
  important_paragraphs: Record<string, any>[];
  arguments: Record<string, any>[];
  summary?: string;
  ratio_decidendi?: string;
  key_findings?: string;
  personal_notes?: string;
  document_url?: string;
  is_favorite: boolean;
  case_id?: string;
}

export interface CaseLawCreate extends Omit<CaseLaw, "id"> {}

const KEYS = {
  all: ["case_laws"] as const,
  list: (p?: Record<string, unknown>) => ["case_laws", "list", p] as const,
  detail: (id: string) => ["case_laws", id] as const,
};

export function useCaseLaws(params?: { search?: string; practice_area?: string; court_name?: string; is_favorite?: boolean; case_id?: string }) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/case-laws/", { params });
      return data as { total: number; items: CaseLaw[] };
    },
  });
}

export function useCaseLaw(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/case-laws/${id}`);
      return data as CaseLaw;
    },
    enabled: !!id,
  });
}

export function useCreateCaseLaw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CaseLawCreate) => {
      const { data } = await api.post("/case-laws/", payload);
      return data as CaseLaw;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Case law added successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateCaseLaw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CaseLawCreate> & { id: string }) => {
      const { data } = await api.put(`/case-laws/${id}`, payload);
      return data as CaseLaw;
    },
    onSuccess: (caseLaw) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(caseLaw.id) });
      toast.success("Case law updated successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteCaseLaw() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/case-laws/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Case law deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
