import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface ClientDocument {
  id: string;
  name: string;
  doc_type: string;
  file_size?: number;
  mime_type?: string;
  is_evidence: boolean;
  description?: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  type: "individual" | "corporate" | "government";
  phone: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  pan?: string;
  gstin?: string;
  aadhaar_number?: string;
  occupation?: string;
  date_of_birth?: string;
  photograph_url?: string;
  company_name?: string;
  contact_person?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  kyc_verified: boolean;
  fees_outstanding: number;
  active_cases_count?: number;
  closed_cases_count?: number;
  total_cases_count?: number;
  upcoming_hearings_count?: number;
  cases?: ClientCase[];
  invoices?: ClientInvoice[];
  documents?: ClientDocument[];
  created_at: string;
  updated_at: string;
}

export interface ClientCase {
  id: string;
  case_no: string;
  title: string;
  court: string;
  practice_area: string;
  status: string;
  stage: string;
  next_hearing_date?: string;
  fees_agreed: number;
  fees_received: number;
}

export interface ClientInvoice {
  id: string;
  invoice_no: string;
  total: number;
  status: string;
  due_date?: string;
}

export interface ClientCreate {
  name: string;
  type: string;
  phone: string;
  alternate_phone?: string;
  email?: string;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  pan?: string;
  gstin?: string;
  aadhaar_number?: string;
  occupation?: string;
  date_of_birth?: string;
  photograph_url?: string;
  company_name?: string;
  contact_person?: string;
  notes?: string;
  tags?: string[];
}

const KEYS = {
  all: ["clients"] as const,
  list: (params?: Record<string, unknown>) => ["clients", "list", params] as const,
  detail: (id: string) => ["clients", id] as const,
  stats: () => ["clients", "stats"] as const,
};

export function useClients(params?: { search?: string; type?: string; skip?: number; limit?: number }) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/clients/", { params });
      return data as { total: number; clients: Client[] };
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/clients/${id}`);
      return data as Client;
    },
    enabled: !!id,
  });
}

export function useClientStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: async () => {
      const { data } = await api.get("/clients/stats");
      return data as { total: number; individual: number; corporate: number; fees_outstanding: number };
    },
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClientCreate) => {
      const { data } = await api.post("/clients/", payload);
      return data as Client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Client created successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<ClientCreate> & { id: string }) => {
      const { data } = await api.put(`/clients/${id}`, payload);
      return data as Client;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(vars.id) });
      toast.success("Client updated successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Client removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
