import useSWR from "swr";
import { api } from "../api";

export interface Act {
  id: string;
  name: string;
  short_name: string;
  category: string;
  sections: number;
}

export function useActs(search?: string, category?: string) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category && category !== "All") params.append("category", category);
  
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  
  const { data, error, isLoading } = useSWR<{total: number, items: Act[]}>(
    `/acts${queryStr}`,
    (url: string) => api.get(url).then(res => res.data)
  );

  return {
    acts: data?.items || [],
    total: data?.total || 0,
    isLoading,
    isError: error
  };
}
