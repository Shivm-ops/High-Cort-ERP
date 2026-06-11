import useSWR from "swr";
import { api } from "../api";

export function useAdvocateWorkload() {
  const { data, error, isLoading } = useSWR("/reports/advocate-workload", (url) => api.get(url).then(res => res.data.data));
  return { workload: data, isLoading, isError: error };
}

export function useTransfers() {
  const { data, error, isLoading } = useSWR("/reports/transfers", (url) => api.get(url).then(res => res.data.data));
  return { transfers: data, isLoading, isError: error };
}

export function useAppealsReport() {
  const { data, error, isLoading } = useSWR("/reports/appeals", (url) => api.get(url).then(res => res.data));
  return { appeals: data, isLoading, isError: error };
}

export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = "";
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(','))
  ];
  
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
