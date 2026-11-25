import { useQuery, useMutation } from "@tanstack/react-query";
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
  uploaded?: boolean;
  matched_documents?: Array<{ id: string; name: string }>;
}

export interface FilingPackageItem {
  s_no: number;
  id: string;
  exhibit: string;
  name: string;
  doc_type: string;
  status: string;
  date: string;
}

export interface FilingPackageResponse {
  message: string;
  case_no?: string;
  case_title?: string;
  items?: FilingPackageItem[];
  index_html: string;
  download_link: string;
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
      const { data } = await api.post<FilingPackageResponse>(`/evidence/generate-package/${caseId}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Evidence index generated");
    },
    onError: () => {
      toast.error("Failed to generate evidence index");
    },
  });
}
