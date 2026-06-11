import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface Draft {
  id: string;
  title: string;
  content: string;
  category: string;
  language: string;
  practice_area?: string;
  subcategory?: string;
  court_type?: string;
  storage_url?: string;
  status?: string;
  case_id?: string;
  client_id?: string;
  tags: string[];
  is_template: boolean;
  ai_generated: boolean;
  version: number;
  word_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DraftCreate {
  title: string;
  content: string;
  category: string;
  practice_area?: string;
  subcategory?: string;
  court_type?: string;
  storage_url?: string;
  status?: string;
  language?: string;
  case_id?: string;
  client_id?: string;
  tags?: string[];
  is_template?: boolean;
  ai_generated?: boolean;
}

const KEYS = {
  all: ["drafts"] as const,
  list: (p?: Record<string, unknown>) => ["drafts", "list", p] as const,
  templates: (cat?: string) => ["drafts", "templates", cat] as const,
  detail: (id: string) => ["drafts", id] as const,
};

export function useDrafts(params?: { case_id?: string; is_template?: boolean; search?: string; category?: string }) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/drafts/", { params });
      return data as { total: number; drafts: Draft[] };
    },
  });
}

export function useTemplates(category?: string) {
  return useQuery({
    queryKey: KEYS.templates(category),
    queryFn: async () => {
      const { data } = await api.get("/drafts/templates", { params: category ? { category } : undefined });
      return data as { total: number; templates: Draft[] };
    },
  });
}

export function useDraft(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/drafts/${id}`);
      return data as Draft;
    },
    enabled: !!id,
  });
}

export function useAutoFill() {
  return useMutation({
    mutationFn: async (payload: { template_content: string; client_id: string; case_id?: string }) => {
      const { data } = await api.post("/drafts/auto-fill", payload);
      return data as {
        filled_content: string;
        merge_map: Record<string, string>;
        client_name: string;
        case_no?: string;
      };
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCreateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DraftCreate) => {
      const { data } = await api.post("/drafts/", payload);
      return data as Draft;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Draft saved");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<DraftCreate> & { id: string }) => {
      const { data } = await api.put(`/drafts/${id}`, payload);
      return data as Draft;
    },
    onSuccess: (draft) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(draft.id) });
      toast.success("Draft updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/drafts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Draft deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
