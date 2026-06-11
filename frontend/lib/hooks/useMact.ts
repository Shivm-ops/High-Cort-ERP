import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface MactClaimant {
  id?: string;
  name: string;
  age?: number;
  occupation?: string;
  monthly_income?: number;
  dependency_details?: string;
  contact_information?: string;
  aadhaar_pan?: string;
}

export interface MactInsurance {
  company_name: string;
  policy_details?: string;
  claim_reference_number?: string;
}

export interface MactCaseCreate {
  mact_case_number?: string;
  tribunal_name: string;
  filing_date?: string;
  accident_date?: string;
  police_station: string;
  fir_number: string;
  vehicle_details?: string;
  driver_details?: string;
  owner_details?: string;
  claimants?: MactClaimant[];
}

export interface CompensationCalcRequest {
  age: number;
  monthly_income: number;
  future_prospects_pct: number;
  personal_expense_deduction_pct: number;
  multiplier: number;
  medical_expenses: number;
  loss_of_estate: number;
  consortium: number;
  funeral_expenses: number;
  interest_rate_pct: number;
  years_since_filing: number;
}

const KEYS = {
  all: ["mact_cases"] as const,
  list: () => ["mact_cases", "list"] as const,
  detail: (id: string) => ["mact_cases", id] as const,
  dashboard: () => ["mact_dashboard"] as const,
};

export function useMactDashboard() {
  return useQuery({
    queryKey: KEYS.dashboard(),
    queryFn: async () => {
      const { data } = await api.get("/mact/dashboard");
      return data;
    },
  });
}

export function useMactCases() {
  return useQuery({
    queryKey: KEYS.list(),
    queryFn: async () => {
      const { data } = await api.get("/mact/cases");
      return data;
    },
  });
}

export function useMactCase(id: string) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: async () => {
      const { data } = await api.get(`/mact/cases/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMactCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MactCaseCreate) => {
      const { data } = await api.post("/mact/cases", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.dashboard() });
      toast.success("MACT case created successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateMactInsurance(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: MactInsurance) => {
      const { data } = await api.post(`/mact/cases/${caseId}/insurance`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.detail(caseId) });
      toast.success("Insurance updated successfully");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useMactCalculator() {
  return useMutation({
    mutationFn: async (payload: CompensationCalcRequest) => {
      const { data } = await api.post("/mact/calculator", payload);
      return data;
    },
    onError: (e) => toast.error("Calculation failed"),
  });
}
