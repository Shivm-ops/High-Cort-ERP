import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { toast } from "sonner";

export interface EvidenceDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  exhibit: string | null;
  status: string;
  uploaded_by: string;
  metadata: Record<string, any>;
}

export interface ChecklistItem {
  id: string;
  name: string;
  required: boolean;
  type: string;
}

export function useEvidenceTimeline(caseId: string) {
  return useQuery({
    queryKey: ["evidence_timeline", caseId],
    queryFn: async () => {
      const { data } = await api.get<{ timeline: EvidenceDocument[] }>(`/evidence/timeline/${caseId}`);
      return data;
    },
    enabled: !!caseId,
  });
}

export function useEvidenceChecklist(caseId: string) {
  return useQuery({
    queryKey: ["evidence_checklist", caseId],
    queryFn: async () => {
      const { data } = await api.get<{ checklist: ChecklistItem[] }>(`/evidence/checklist/${caseId}`);
      return data;
    },
    enabled: !!caseId,
  });
}

export function useGenerateFilingPackage(caseId: string) {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ message: string; index_html: string; download_link: string }>(`/evidence/generate-package/${caseId}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Filing package generated");
    },
    onError: () => {
      toast.error("Failed to generate filing package");
    },
  });
}
