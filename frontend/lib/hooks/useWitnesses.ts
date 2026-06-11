import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { toast } from "sonner";

export interface Witness {
  id: string;
  case_id: string;
  name: string;
  address: string | null;
  mobile: string | null;
  statement: string | null;
  status: string;
}

export function useWitnesses(caseId: string) {
  return useQuery({
    queryKey: ["witnesses", caseId],
    queryFn: async () => {
      const { data } = await api.get<{ witnesses: Witness[] }>(`/witnesses/case/${caseId}`);
      return data;
    },
    enabled: !!caseId,
  });
}

export function useCreateWitness(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (witness: Partial<Witness>) => {
      const { data } = await api.post<Witness>(`/witnesses/case/${caseId}`, witness);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["witnesses", caseId] });
      toast.success("Witness added successfully");
    },
    onError: () => {
      toast.error("Failed to add witness");
    },
  });
}

export function useDeleteWitness(caseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (witnessId: string) => {
      const { data } = await api.delete(`/witnesses/${witnessId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["witnesses", caseId] });
      toast.success("Witness removed");
    },
    onError: () => {
      toast.error("Failed to remove witness");
    },
  });
}
