import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export interface LimitationMatter {
  id: string;
  case_no: string;
  title: string;
  court: string;
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
  };
  matters: LimitationMatter[];
}

export function useLimitationsDashboard(court_filter: string) {
  return useQuery({
    queryKey: ["limitations_dashboard", court_filter],
    queryFn: async () => {
      const { data } = await api.get<LimitationsDashboard>("/limitations", {
        params: { court_filter: court_filter !== "All" ? court_filter : undefined }
      });
      return data;
    },
  });
}
