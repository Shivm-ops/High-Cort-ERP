import useSWR from "swr";
import { api } from "../api";

export interface Court {
  id: string;
  name: string;
  type: string;
  jurisdiction?: string;
  address?: string;
  presiding_officer?: string;
  room_number?: string;
  contact_info?: string;
}

export function useCourts(search?: string, courtType?: string) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (courtType && courtType !== "All") params.append("court_type", courtType);
  
  const queryStr = params.toString() ? `?${params.toString()}` : "";
  
  const { data, error, isLoading, mutate } = useSWR<{total: number, items: Court[]}>(
    `/courts${queryStr}`,
    (url: string) => api.get(url).then(res => res.data)
  );

  return {
    courts: data?.items || [],
    total: data?.total || 0,
    isLoading,
    isError: error,
    mutate
  };
}
