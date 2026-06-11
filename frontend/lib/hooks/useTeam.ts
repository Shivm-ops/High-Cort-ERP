import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  barNo: string | null;
  activeCases: number;
  pendingCases: number;
  todayHearings: number;
  pendingDrafts: number;
  pendingFilings: number;
  activeTasks: number;
  workingStatus: string;
  specializations: string[];
}

export interface TeamStats {
  cases_assigned: number;
  cases_closed: number;
  hearings_attended: number;
  drafts_prepared: number;
  revenue_generated: number;
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data } = await api.get<{ team: TeamMember[] }>("/team/");
      return data;
    },
  });
}

export function useTeamMemberStats(id: string | null) {
  return useQuery({
    queryKey: ["team_member_stats", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get<TeamStats>(`/team/${id}/stats`);
      return data;
    },
    enabled: !!id,
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Mock API call to delete team member, in reality this would be api.delete(`/team/${id}`)
      return new Promise((resolve) => setTimeout(resolve, 500));
    },
    onSuccess: (_, deletedId) => {
      // Since there is no backend endpoint yet, we update the cache directly instead of invalidating
      qc.setQueryData(["team_members"], (old: any) => {
        if (!old || !old.team) return old;
        return {
          ...old,
          team: old.team.filter((m: any) => m.id !== deletedId),
          total: old.total - 1
        };
      });
    },
  });
}
