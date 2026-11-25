import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "../api";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
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

export interface TeamListResponse {
  team: TeamMember[];
  total: number;
  seat_limit: number | null;
  can_manage_team: boolean;
}

export interface TeamStats {
  cases_assigned: number;
  cases_closed: number;
  hearings_attended: number;
  drafts_prepared: number;
  revenue_generated: number;
}

export interface CreateTeamMemberPayload {
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  bar_council_no?: string;
  specializations?: string[];
  password?: string;
}

export interface CreateTeamMemberResponse {
  member: TeamMember;
  temporary_password: string;
  message: string;
}

export interface UpdateTeamMemberPayload {
  id: string;
  full_name?: string;
  role?: string;
  phone?: string;
  bar_council_no?: string;
  specializations?: string[];
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data } = await api.get<TeamListResponse>("/team/");
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

export function useCreateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTeamMemberPayload) => {
      const { data } = await api.post<CreateTeamMemberResponse>(
        "/team/members",
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_members"] });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: UpdateTeamMemberPayload) => {
      const { data } = await api.put<TeamMember>(`/team/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member updated");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/team/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member removed");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
