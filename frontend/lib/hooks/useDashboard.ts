import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

export interface DashboardMetrics {
  critical_matters: {
    today_hearings: number;
    urgent_filings: number;
    pending_notices: number;
    limitation_alerts: number;
    pending_affidavits: number;
  };
  limitation_alerts: Array<{
    id: string;
    case_no: string;
    title: string;
    limitation_date: string;
    days_left: number;
  }>;
  notice_summary: {
    received: number;
    pending_replies: number;
    overdue_replies: number;
    replies_sent: number;
  };
  matter_status: {
    active: number;
    drafting: number;
    evidence: number;
    argument: number;
    appeal: number;
    closed: number;
  };
  upcoming_hearings: Array<{
    id: string;
    case_id: string;
    case_title: string;
    court: string;
    hearing_date: string;
    hearing_time: string | null;
    assigned_advocate: string;
  }>;
  billing: {
    outstanding: number;
    pending_hearing_fees: number;
    pending_filing_fees: number;
    advance_balance: number;
  };
  team_work: {
    drafting: number;
    research: number;
    filing: number;
    hearing: number;
  };
  recent_activity: Array<{
    type: string;
    title: string;
    date: string | null;
    id: string;
  }>;
}

export function useDashboardMetrics() {
  return useQuery({
    queryKey: ["dashboard_metrics"],
    queryFn: async () => {
      const { data } = await api.get<DashboardMetrics>("/dashboard/metrics");
      return data;
    },
    refetchInterval: 300000, // Refresh every 5 mins
  });
}
