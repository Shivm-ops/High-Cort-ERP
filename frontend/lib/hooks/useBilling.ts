import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

// --- Types ---

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
  fee_ids?: string[];
  expense_ids?: string[];
  gst_rate?: number;
  due_date?: string;
  notes?: string;
  terms?: string;
  place_of_supply?: string;
}

export interface LedgerEntry {
  id: string;
  type: "fee" | "expense" | "advance" | "invoice";
  date: string;
  category?: string;
  description?: string;
  amount?: number;
  amount_received?: number;
  amount_utilized?: number;
  balance?: number;
  is_billed?: boolean;
  invoice_no?: string;
  total?: number;
  status?: string;
  amount_paid?: number;
  payment_method?: string;
}

export interface LedgerSummary {
  total_fees: number;
  total_expenses: number;
  advance_balance: number;
  total_invoiced: number;
  total_paid: number;
}

// --- Keys ---

const KEYS = {
  all: ["billing"] as const,
  invoices: (p?: Record<string, unknown>) => ["billing", "invoices", p] as const,
  invoice: (id: string) => ["billing", "invoice", id] as const,
  stats: () => ["billing", "stats"] as const,
  ledger: (case_id: string) => ["billing", "ledger", case_id] as const,
  unbilled_fees: (case_id?: string) => ["billing", "unbilled_fees", case_id] as const,
  unbilled_expenses: (case_id?: string) => ["billing", "unbilled_expenses", case_id] as const,
};

// --- Queries ---

export function useInvoices(params?: { status?: string; client_id?: string; case_id?: string }) {
  return useQuery({
    queryKey: KEYS.invoices(params),
    queryFn: async () => {
      const { data } = await api.get("/billing/", { params });
      return data as { total: number; invoices: Invoice[] };
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: KEYS.invoice(id),
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
      return data as { 
        total_billed: number; 
        total_received: number; 
        outstanding: number; 
        overdue_count: number; 
        pending_count: number;
        unbilled_fees: number;
        unbilled_expenses: number;
        advance_balance: number;
      };
    },
  });
}

export function useLedger(case_id: string) {
  return useQuery({
    queryKey: KEYS.ledger(case_id),
    queryFn: async () => {
      const { data } = await api.get(`/billing/ledger/${case_id}`);
      return data as { ledger: LedgerEntry[], summary: LedgerSummary };
    },
    enabled: !!case_id,
  });
}

export function useUnbilledFees(case_id?: string) {
  return useQuery({
    queryKey: KEYS.unbilled_fees(case_id),
    queryFn: async () => {
      const params = case_id ? { case_id } : {};
      const { data } = await api.get("/billing/fees/unbilled", { params });
      return data as any[];
    },
  });
}

export function useUnbilledExpenses(case_id?: string) {
  return useQuery({
    queryKey: KEYS.unbilled_expenses(case_id),
    queryFn: async () => {
      const params = case_id ? { case_id } : {};
      const { data } = await api.get("/billing/expenses/unbilled", { params });
      return data as any[];
    },
  });
}

// --- Mutations ---

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

export function useSendReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "whatsapp" | "email" }) => {
      const { data } = await api.post(`/billing/${id}/remind?type=${type}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Reminder sent");
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

export function useRecordFee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/billing/fees", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Fee recorded successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRecordExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/billing/expenses", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Expense recorded successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRecordAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/billing/advances", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success("Advance payment recorded successfully");
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
