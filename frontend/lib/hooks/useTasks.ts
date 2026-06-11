import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardTask {
  id: string;
  case_id: string;
  case_title?: string;
  case_no?: string;
  title: string;
  description?: string;
  task_type: string;
  status: string;
  priority: string;
  deadline?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
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

export function useAllTasks() {
  return useQuery({
    queryKey: ["tasks", "all"],
    queryFn: async () => {
      const { data } = await api.get("/tasks/all");
      return data.tasks as DashboardTask[];
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DashboardTask> }) => {
      const res = await api.patch(`/tasks/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
