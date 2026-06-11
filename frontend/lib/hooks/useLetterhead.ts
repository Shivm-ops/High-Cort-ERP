import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

export interface Letterhead {
  id: string;
  user_id: string;
  advocate_name: string | null;
  firm_name: string | null;
  enrollment_number: string | null;
  office_address: string | null;
  mobile_number: string | null;
  email_id: string | null;
  website: string | null;
  gst_number: string | null;
  logo_base64: string | null;
  signature_base64: string | null;
  stamp_base64: string | null;
  template_type: string;
  custom_header_html: string | null;
  custom_footer_html: string | null;
}

const KEYS = {
  myLetterhead: ["letterhead", "me"] as const,
};

export function useMyLetterhead() {
  return useQuery({
    queryKey: KEYS.myLetterhead,
    queryFn: async () => {
      const { data } = await api.get("/letterhead/");
      // The backend returns an empty object {} if no letterhead exists
      return data && Object.keys(data).length > 0 ? (data as Letterhead) : null;
    },
  });
}

export function useSaveLetterhead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Letterhead>) => {
      const { data } = await api.post("/letterhead/", payload);
      return data as Letterhead;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.myLetterhead });
      toast.success("Letterhead settings saved");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
