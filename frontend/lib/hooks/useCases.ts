import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface Case {
  id: string;
  case_no: string;
  title: string;
  description?: string;
  court: string;
  bench?: string;
  judge?: string;
  court_complex?: string;
  court_state?: string;
  ecourts_cnr?: string;
  client_id: string;
  client_name?: string;
  client_phone?: string;
  petitioner?: string;
  respondent?: string;
  opposing_counsel?: string;
  practice_area: string;
  case_type?: string;
  acts_involved: string[];
  sections_involved: string[];
  case_laws: Array<{ title: string; citation: string; court: string; notes?: string }>;
  arguments: Array<{ issue: string; sections: string; case_laws: string; evidence: string; strategy: string }>;
  tags: string[];
  status: string;
  stage: string;
  priority: string;
  filing_date?: string;
  disposal_date?: string;
  limitation_date?: string;
  next_hearing_date?: string;
  fees_agreed: number;
  fees_received: number;
  hearings?: CaseHearing[];
  documents?: CaseDocument[];
  drafts?: CaseDraft[];
  invoices?: CaseInvoice[];
  filings?: CaseFiling[];
  notes?: CaseNote[];
  parties?: CaseParty[];
  orders?: CaseOrder[];
  // Appeal hierarchy
  parent_case_id?: string;
  appeal_type?: string;
  appeal_level?: number;
  forum?: string;
  created_at: string;
  updated_at: string;
}

export interface CaseHearing {
  id: string;
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
}

export interface CaseDocument {
  id: string;
  name: string;
  doc_type: string;
  file_size?: number;
  mime_type?: string;
  is_evidence?: boolean;
  description?: string;
  signature_status?: string;
  signature_request_id?: string;
  created_at: string;
}

export interface CaseFiling {
  id: string;
  title: string;
  filing_type?: string;
  status: string;
  filing_date?: string;
  court_fee: number;
  stamp_duty: number;
  estamp_reference?: string;
  checklist: Array<{ name: string; required: boolean; submitted: boolean }>;
}

export interface CaseNote {
  id: string;
  content: string;
  note_type: string;
  is_pinned: boolean;
  created_at: string;
}

export interface CaseParty {
  id: string;
  name: string;
  party_type: string;
  advocate_name?: string;
  mobile?: string;
  email?: string;
  address?: string;
}

export interface CaseOrder {
  id: string;
  hearing_id?: string;
  order_type: string;
  order_date: string;
  summary?: string;
  compliance_required: boolean;
  compliance_due_date?: string;
  compliance_status: string;
  next_action?: string;
}

export interface CaseDraft {
  id: string;
  title: string;
  category: string;
  language: string;
  ai_generated: boolean;
  created_at: string;
}

export interface CaseInvoice {
  id: string;
  invoice_no: string;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  due_date?: string;
}

export interface CaseCreate {
  case_no: string;
  title: string;
  court: string;
  client_id: string;
  practice_area: string;
  status?: string;
  stage?: string;
  priority?: string;
  filing_date?: string;
  limitation_date?: string;
  judge?: string;
  bench?: string;
  court_complex?: string;
  court_state?: string;
  case_type?: string;
  petitioner?: string;
  respondent?: string;
  opposing_counsel?: string;
  description?: string;
  fees_agreed?: number;
  acts_involved?: string[];
  sections_involved?: string[];
  case_laws?: Array<{ title: string; citation: string; court: string; notes?: string }>;
  arguments?: Array<{ issue: string; sections: string; case_laws: string; evidence: string; strategy: string }>;
  tags?: string[];
}

const KEYS = {
  all: ["cases"] as const,
  list: (p?: Record<string, unknown>) => ["cases", "list", p] as const,
  detail: (id: string) => ["cases", id] as const,
  stats: () => ["cases", "stats"] as const,
};

export function useCases(params?: {
  search?: string;
  status?: string;
  stage?: string;
  practice_area?: string;
  client_id?: string;
  court?: string;
  skip?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/cases/", { params });
      return data as { total: number; cases: Case[] };
    },
  });
}

export function useCase(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/cases/${id}`);
      return data as Case;
    },
    enabled: !!id,
  });
}

export function useCaseStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: async () => {
      const { data } = await api.get("/cases/stats/summary");
      return data as { total: number; active: number; urgent: number; pending: number; upcoming_hearings: number };
    },
  });
}

export function useCreateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CaseCreate) => {
      const { data } = await api.post("/cases/", payload);
      return data as Case;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Case created successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CaseCreate> & { id: string }) => {
      const { data } = await api.put(`/cases/${id}`, payload);
      return data as Case;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
      toast.success("Case updated successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCloseCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cases/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Case closed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSyncECourts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/cases/${id}/ecourts-sync`);
      return data as Case;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Case synced with e-Courts successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useAddParty(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CaseParty, "id">) => {
      const { data } = await api.post(`/cases/${caseId}/parties`, payload);
      return data as CaseParty;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(caseId) });
      toast.success("Party added successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteParty(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (partyId: string) => {
      await api.delete(`/cases/parties/${partyId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(caseId) });
      toast.success("Party removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}


export function useAddOrder(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CaseOrder, "id">) => {
      const { data } = await api.post(`/cases/${caseId}/orders`, payload);
      return data as CaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(caseId) });
      toast.success("Order added successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateOrder(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, ...payload }: Partial<CaseOrder> & { orderId: string }) => {
      const { data } = await api.patch(`/cases/orders/${orderId}`, payload);
      return data as CaseOrder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(caseId) });
      toast.success("Order updated successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteOrder(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      await api.delete(`/cases/orders/${orderId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(caseId) });
      toast.success("Order removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
