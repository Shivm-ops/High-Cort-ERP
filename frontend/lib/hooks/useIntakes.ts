import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface Intake {
  id: string;
  firm_id?: string | null;
  client_id?: string | null;
  client_name?: string | null;
  prospect_name?: string | null;
  prospect_phone?: string | null;
  case_id?: string | null;
  case_no?: string | null;
  case_title?: string | null;
  narrative?: string;
  facts?: string;
  facts_list?: Array<{ fact: string; evidence_needed?: string }>;
  applicable_sections?: string[];
  relief_sought?: string;
  assessment?: {
    strengths?: string[];
    weaknesses?: string[];
    limitation?: string[];
    jurisdiction?: string[];
  };
  opponent_details?: string;
  witness_details?: string;
  previous_litigation?: string;
  urgency_level: string;
  chronology: Array<{ date: string; event: string; remarks: string }>;
  document_checklist: Record<string, string>;
  strengths?: string;
  weaknesses?: string;
  risks?: string;
  limitation_issues?: string;
  jurisdiction_issues?: string;
  additional_docs_required?: string;
  status: string;
  date_of_acceptance?: string;
  fee_agreement?: string;
  consent_received: boolean;
  consent_details?: string;
  created_at: string;
  updated_at: string;
}

export interface IntakeSummary {
  total: number;
  under_review: number;
  awaiting_documents: number;
  accepted: number;
  rejected: number;
}

export function useIntakes(params?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: ["intakes", params],
    queryFn: async () => {
      const { data } = await api.get("/intakes/", { params });
      return data as { total: number; summary?: IntakeSummary; intakes: Intake[] };
    },
  });
}

export function useIntake(id: string) {
  return useQuery({
    queryKey: ["intakes", id],
    queryFn: async () => {
      const { data } = await api.get(`/intakes/${id}`);
      return data as Intake;
    },
    enabled: !!id,
  });
}

export function useCreateIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Intake>) => {
      const { data } = await api.post("/intakes/", payload);
      return data as Intake;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intakes"] });
      toast.success("Intake created");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Intake> & { id: string }) => {
      const { data } = await api.put(`/intakes/${id}`, payload);
      return data as Intake;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["intakes"] });
      qc.invalidateQueries({ queryKey: ["intakes", data.id] });
      toast.success("Intake updated successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteIntake() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/intakes/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intakes"] });
      toast.success("Intake deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
