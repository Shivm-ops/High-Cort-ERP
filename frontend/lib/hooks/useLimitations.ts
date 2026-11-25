import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "../api";
import { toast } from "sonner";

export interface LimitationMatter {
  id: string;
  source: "case" | "notice";
  case_id: string | null;
  notice_id: string | null;
  case_no: string;
  title: string;
  court: string;
  client_name: string | null;
  limitation_date: string;
  incident_date: string | null;
  days_left: number;
  status: "safe" | "upcoming" | "warning" | "critical" | "overdue";
  risk: "Safe" | "Upcoming" | "Warning" | "Critical";
  limitation_act: string;
  limitation_section: string;
  practice_area: string;
}

export interface LimitationsDashboard {
  widgets: {
    today: number;
    tomorrow: number;
    overdue: number;
    within_7_days: number;
    case_count: number;
    notice_count: number;
  };
  matters: LimitationMatter[];
}

export interface SetCaseLimitationPayload {
  case_id: string;
  limitation_date: string;
  incident_date?: string | null;
  limitation_act?: string | null;
  limitation_section?: string | null;
}

export function useLimitationsDashboard(
  court_filter: string,
  source_filter: string = "all"
) {
  return useQuery({
    queryKey: ["limitations_dashboard", court_filter, source_filter],
    queryFn: async () => {
      const { data } = await api.get<LimitationsDashboard>("/limitations/", {
        params: {
          court_filter: court_filter !== "All" ? court_filter : undefined,
          source_filter: source_filter !== "all" ? source_filter : undefined,
        },
      });
      return data;
    },
  });
}

export function useSetCaseLimitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ case_id, ...body }: SetCaseLimitationPayload) => {
      const { data } = await api.put(`/limitations/case/${case_id}`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["limitations_dashboard"] });
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Case limitation deadline saved");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
