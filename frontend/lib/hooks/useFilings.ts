import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface Filing {
  id: string;
  case_id: string;
  draft_id?: string;
  title: string;
  filing_type?: string;
  status: string;
  filing_date?: string;
  acceptance_date?: string;
  defect_raised_date?: string;
  defect_description?: string;
  court_fee: number;
  stamp_duty: number;
  estamp_reference?: string;
  other_costs: number;
  total_cost: number;
  checklist: FilingChecklistItem[];
  document_ids: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FilingChecklistItem {
  name: string;
  required: boolean;
  submitted: boolean;
  document_id?: string;
}

export interface FilingCreate {
  case_id: string;
  title: string;
  filing_type?: string;
  draft_id?: string;
  court_fee?: number;
  stamp_duty?: number;
  estamp_reference?: string;
  other_costs?: number;
  checklist?: FilingChecklistItem[];
  notes?: string;
}

const KEYS = {
  all: ["filings"] as const,
  list: (p?: Record<string, unknown>) => ["filings", "list", p] as const,
  detail: (id: string) => ["filings", id] as const,
};

export function useFilings(params?: { case_id?: string }) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/filings/", { params });
      return data as { total: number; filings: Filing[] };
    },
    enabled: !!params?.case_id,
  });
}

export function useCreateFiling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FilingCreate) => {
      const { data } = await api.post("/filings/", payload);
      return data as Filing;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Filing created");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateFiling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<FilingCreate> & { id: string; status?: string; filing_date?: string; defect_description?: string; checklist?: FilingChecklistItem[]; document_ids?: string[] }) => {
      const { data } = await api.put(`/filings/${id}`, payload);
      return data as Filing;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Filing updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteFiling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/filings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Filing removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ── Case Notes ────────────────────────────────────────────────────────────────

export interface CaseNote {
  id: string;
  case_id: string;
  content: string;
  note_type: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

const NOTE_KEYS = {
  all: ["case_notes"] as const,
  byCase: (caseId: string) => ["case_notes", caseId] as const,
};

export function useCaseNotes(caseId: string) {
  return useQuery({
    queryKey: NOTE_KEYS.byCase(caseId),
    queryFn: async () => {
      const { data } = await api.get(`/filings/notes/by-case/${caseId}`);
      return data as { total: number; notes: CaseNote[] };
    },
    enabled: !!caseId,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { case_id: string; content: string; note_type?: string; is_pinned?: boolean }) => {
      const { data } = await api.post("/filings/notes/", payload);
      return data as CaseNote;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: NOTE_KEYS.byCase(vars.case_id) });
      toast.success("Note saved");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, case_id }: { id: string; case_id: string }) => {
      await api.delete(`/filings/notes/${id}`);
      return case_id;
    },
    onSuccess: (caseId) => {
      qc.invalidateQueries({ queryKey: NOTE_KEYS.byCase(caseId) });
      toast.success("Note deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
