import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TaskUserBrief {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string | null;
}

export interface DashboardTask {
  id: string;
  firm_id?: string | null;
  case_id: string | null;
  case_title?: string | null;
  case_no?: string | null;
  title: string;
  description?: string | null;
  task_type: string;
  status: string;
  priority: string;
  assignee_id?: string | null;
  assignee?: TaskUserBrief | null;
  assigned_by_id?: string | null;
  assigned_by?: TaskUserBrief | null;
  deadline?: string | null;
  completed_at?: string | null;
  estimated_minutes?: number;
  actual_minutes?: number;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type TaskScope = "mine" | "assigned_by_me" | "firm";

export interface TaskCreatePayload {
  title: string;
  description?: string | null;
  case_id?: string | null;
  task_type?: string;
  priority?: string;
  status?: string;
  assignee_id?: string | null;
  deadline?: string | null;
  estimated_minutes?: number;
  notes?: string | null;
}

export interface TaskUpdatePayload extends Partial<TaskCreatePayload> {
  actual_minutes?: number;
  clear_deadline?: boolean;
}

export function useUpcomingTasks() {
  return useQuery({
    queryKey: ["tasks", "upcoming"],
    queryFn: async () => {
      const { data } = await api.get("/tasks/upcoming");
      return data as { total: number; tasks: DashboardTask[] };
    },
  });
}

export function useAllTasks(scope: TaskScope = "mine") {
  return useQuery({
    queryKey: ["tasks", "all", scope],
    queryFn: async () => {
      const { data } = await api.get("/tasks/all", { params: { scope } });
      return data.tasks as DashboardTask[];
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TaskCreatePayload) => {
      const res = await api.post("/tasks/", payload);
      return res.data as DashboardTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TaskUpdatePayload }) => {
      const res = await api.patch(`/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
}
