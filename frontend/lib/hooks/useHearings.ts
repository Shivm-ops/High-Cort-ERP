import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface Hearing {
  id: string;
  case_id: string;
  case_no?: string;
  case_title?: string;
  client_name?: string;
  client_mobile?: string;
  hearing_date: string;
  hearing_time?: string;
  court?: string;
  courtroom?: string;
  judge?: string;
  purpose?: string;
  status: string;
  notes?: string;
  next_date?: string;
  next_purpose?: string;
  order_passed?: string;
  attended_by?: string;
  readiness_status?: "Ready" | "Needs Preparation" | "Urgent" | string;
  preparation_checklist?: {
    documents_ready?: boolean;
    evidence_ready?: boolean;
    arguments_ready?: boolean;
    case_laws_ready?: boolean;
    filing_pending?: boolean;
    carry_original_documents?: boolean;
    carry_affidavit?: boolean;
    carry_evidence?: boolean;
    carry_court_fees?: boolean;
    carry_other_records?: boolean;
  };
  created_at?: string;
}

export interface HearingCreate {
  case_id: string;
  hearing_date: string;
  hearing_time?: string;
  court?: string;
  courtroom?: string;
  judge?: string;
  purpose?: string;
  notes?: string;
  attended_by?: string;
}

const KEYS = {
  all: ["hearings"] as const,
  list: (p?: Record<string, unknown>) => ["hearings", "list", p] as const,
  today: () => ["hearings", "today"] as const,
  detail: (id: string) => ["hearings", id] as const,
};

export function useHearings(params?: {
  date_from?: string;
  date_to?: string;
  case_id?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/hearings/", { params });
      return data as { total: number; hearings: Hearing[] };
    },
  });
}

export function useTodayHearings() {
  return useQuery({
    queryKey: KEYS.today(),
    queryFn: async () => {
      const { data } = await api.get("/hearings/today");
      return data as { date: string; count: number; hearings: Hearing[] };
    },
  });
}

export function useCreateHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: HearingCreate) => {
      const { data } = await api.post("/hearings/", payload);
      return data as Hearing;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Hearing scheduled");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<HearingCreate> & { id: string; status?: string; order_passed?: string; next_date?: string; next_purpose?: string; readiness_status?: string; preparation_checklist?: Record<string, boolean> }) => {
      const { data } = await api.put(`/hearings/${id}`, payload);
      return data as Hearing;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success("Hearing updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteHearing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/hearings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Hearing removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
