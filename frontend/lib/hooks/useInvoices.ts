import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoice_no: string;
  client_id: string;
  client_name?: string;
  case_id?: string;
  case_no?: string;
  case_title?: string;
  items: InvoiceItem[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  status: string;
  due_date?: string;
  paid_date?: string;
  payment_method?: string;
  payment_reference?: string;
  notes?: string;
  terms?: string;
  place_of_supply?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceCreate {
  client_id: string;
  case_id?: string;
  items: InvoiceItem[];
  gst_rate?: number;
  due_date?: string;
  notes?: string;
  terms?: string;
  place_of_supply?: string;
}

const KEYS = {
  all: ["invoices"] as const,
  list: (p?: Record<string, unknown>) => ["invoices", "list", p] as const,
  detail: (id: string) => ["invoices", id] as const,
  stats: () => ["invoices", "stats"] as const,
};

export function useInvoices(params?: { status?: string; client_id?: string; case_id?: string }) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: async () => {
      const { data } = await api.get("/billing/", { params });
      return data as { total: number; invoices: Invoice[] };
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/billing/${id}`);
      return data as Invoice;
    },
    enabled: !!id,
  });
}

export function useBillingStats() {
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: async () => {
      const { data } = await api.get("/billing/stats/summary");
      return data as { total_billed: number; total_received: number; outstanding: number; overdue_count: number; pending_count: number };
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: InvoiceCreate) => {
      const { data } = await api.post("/billing/", payload);
      return data as Invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Invoice created successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSendInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/billing/${id}/send`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Invoice marked as sent");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      amount,
      payment_method,
      payment_reference,
    }: {
      id: string;
      amount: number;
      payment_method: string;
      payment_reference?: string;
    }) => {
      const { data } = await api.post(`/billing/${id}/record-payment`, {
        amount,
        payment_method,
        payment_reference,
      });
      return data as Invoice;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Payment recorded");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useCancelInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/billing/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Invoice cancelled");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
