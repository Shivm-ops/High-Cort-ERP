import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface AdvocateBrief {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  bar_council_no?: string;
}

export interface CaseAdvocate {
  id: string;
  case_id: string;
  advocate_id: string;
  advocate: AdvocateBrief;
  assigned_by?: AdvocateBrief;
  role: "senior" | "junior" | "associate" | "external" | "standby";
  start_date: string;
  end_date?: string;
  is_active: boolean;
  transfer_reason?: string;
  notes?: string;
  created_at: string;
}

export interface CaseTask {
  id: string;
  case_id: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  assignee?: AdvocateBrief;
  assigned_by?: AdvocateBrief;
  deadline?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  type: string;
  date: string | null;
  title: string;
  detail?: string;
  extra?: string;
  icon: string;
  color: string;
}

export interface CaseBrief {
  id: string;
  case_no: string;
  title: string;
  court: string;
  status: string;
  stage: string;
  appeal_type?: string;
  appeal_level: number;
  forum?: string;
  next_hearing_date?: string;
  depth: number;
  is_current: boolean;
  children: CaseBrief[];
}

// ── Keys ───────────────────────────────────────────────────────────────────────

const KEYS = {
  team: (caseId: string) => ["case_team", caseId] as const,
  tasks: (caseId: string, params?: Record<string, unknown>) => ["case_tasks", caseId, params] as const,
  timeline: (caseId: string) => ["case_timeline", caseId] as const,
  family: (caseId: string) => ["case_family", caseId] as const,
  advocates: () => ["advocates"] as const,
};

// ── Advocates list ─────────────────────────────────────────────────────────────

export function useAdvocates() {
  return useQuery({
    queryKey: KEYS.advocates(),
    queryFn: async () => {
      const { data } = await api.get("/users/advocates");
      return data as { advocates: AdvocateBrief[] };
    },
  });
}

// ── Team ───────────────────────────────────────────────────────────────────────

export function useCaseTeam(caseId: string) {
  return useQuery({
    queryKey: KEYS.team(caseId),
    queryFn: async () => {
      const { data } = await api.get(`/cases/${caseId}/team`);
      return data as { active: CaseAdvocate[]; history: CaseAdvocate[] };
    },
    enabled: !!caseId,
  });
}

export function useAssignAdvocate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { advocate_id: string; role: string; notes?: string }) => {
      const { data } = await api.post(`/cases/${caseId}/team`, payload);
      return data as CaseAdvocate;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.team(caseId) });
      toast.success("Advocate assigned");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRemoveAdvocate(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { advocate_id: string; transfer_reason?: string; notes?: string }) => {
      await api.delete(`/cases/${caseId}/team/${payload.advocate_id}`, {
        data: { transfer_reason: payload.transfer_reason, notes: payload.notes },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.team(caseId) });
      toast.success("Advocate removed from case");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ── Tasks ──────────────────────────────────────────────────────────────────────

export function useCaseTasks(caseId: string, params?: { status?: string; assignee_id?: string }) {
  return useQuery({
    queryKey: KEYS.tasks(caseId, params),
    queryFn: async () => {
      const { data } = await api.get(`/cases/${caseId}/tasks`, { params });
      return data as { total: number; tasks: CaseTask[] };
    },
    enabled: !!caseId,
  });
}

export function useCreateTask(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      title: string;
      task_type?: string;
      description?: string;
      assignee_id?: string;
      priority?: string;
      deadline?: string;
      notes?: string;
    }) => {
      const { data } = await api.post(`/cases/${caseId}/tasks`, payload);
      return data as CaseTask;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.tasks(caseId) });
      toast.success("Task created");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useUpdateTask(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<CaseTask> & { id: string }) => {
      const { data } = await api.put(`/cases/${caseId}/tasks/${id}`, payload);
      return data as CaseTask;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.tasks(caseId) });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteTask(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/cases/${caseId}/tasks/${taskId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.tasks(caseId) });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

// ── Timeline ───────────────────────────────────────────────────────────────────

export function useCaseTimeline(caseId: string) {
  return useQuery({
    queryKey: KEYS.timeline(caseId),
    queryFn: async () => {
      const { data } = await api.get(`/cases/${caseId}/timeline`);
      return data as { case_id: string; total: number; events: TimelineEvent[] };
    },
    enabled: !!caseId,
  });
}

// ── Family Tree ────────────────────────────────────────────────────────────────

export function useCaseFamily(caseId: string) {
  return useQuery({
    queryKey: KEYS.family(caseId),
    queryFn: async () => {
      const { data } = await api.get(`/cases/${caseId}/family`);
      return data as { root_id: string; tree: CaseBrief };
    },
    enabled: !!caseId,
  });
}

export function useCreateAppeal(caseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      case_no: string;
      title: string;
      court: string;
      forum?: string;
      appeal_type: string;
      judge?: string;
      practice_area?: string;
      description?: string;
      filing_date?: string;
    }) => {
      const { data } = await api.post(`/cases/${caseId}/appeal`, payload);
      return data as { id: string; case_no: string; appeal_level: number };
    },
    onSuccess: (appeal) => {
      qc.invalidateQueries({ queryKey: KEYS.family(caseId) });
      qc.invalidateQueries({ queryKey: ["cases"] });
      toast.success(`Appeal case ${appeal.case_no} created`);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
