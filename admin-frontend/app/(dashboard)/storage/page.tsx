"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { HardDrive, Cloud, AlertCircle, Search, RefreshCw, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StoragePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStorage = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/storage");
      setData(res.data);
    } catch (err) {
      toast.error("Failed to fetch storage data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorage();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Storage Management</h1>
          <p className="text-gray-500 mt-1">Monitor S3 bucket usage and track tenant data limits.</p>
        </div>
        <button 
          onClick={fetchStorage}
          className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : data ? (
        <>
          {/* Global KPI Cards */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase">Allocated S3 Limit</p>
                <p className="text-2xl font-bold text-gray-900">{formatBytes(data.global_stats.total_limit_bytes)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500 uppercase">Total Used Storage</p>
                <p className="text-2xl font-bold text-gray-900">{formatBytes(data.global_stats.total_used_bytes)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Server className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="w-full">
                <p className="text-sm font-semibold text-gray-500 uppercase mb-2">Platform Capacity</p>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div 
                    className={cn("h-2.5 rounded-full", data.global_stats.usage_percent > 85 ? "bg-red-500" : "bg-emerald-500")}
                    style={{ width: `${Math.min(data.global_stats.usage_percent, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 font-bold mt-1 text-right">{data.global_stats.usage_percent}% Used</p>
              </div>
            </div>
          </div>

          {/* Tenants Data Table */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Firm Storage Analytics</h2>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Search firms..." 
                  className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                />
              </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">Tenant Name</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Plan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Usage</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.tenants.map((t: any) => (
                    <tr key={t.firm_id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{t.firm_name}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">{t.firm_id}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md uppercase">
                          {t.plan_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatBytes(t.used_bytes)}
                        </p>
                        <p className="text-xs text-gray-500">
                          of {t.limit_gb} GB
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className={cn("h-2 rounded-full", t.usage_percent > 90 ? "bg-red-500" : t.usage_percent > 75 ? "bg-amber-500" : "bg-emerald-500")}
                              style={{ width: `${Math.min(t.usage_percent, 100)}%` }}
                            ></div>
                          </div>
                          <span className={cn("text-xs font-bold min-w-[36px] text-right", t.usage_percent > 90 ? "text-red-600" : "text-gray-600")}>
                            {t.usage_percent}%
                          </span>
                          {t.usage_percent > 90 && (
                            <span title="Approaching Limit">
                              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data.tenants.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                        No active tenants found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
