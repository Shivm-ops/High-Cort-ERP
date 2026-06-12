"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Activity, Search, Filter, ShieldAlert, User, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/audit");
      setLogs(res.data);
    } catch (err) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'USER': return <User className="w-4 h-4" />;
      case 'FIRM': return <Building2 className="w-4 h-4" />;
      case 'SETTING': return <Settings className="w-4 h-4" />;
      default: return <ShieldAlert className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <Toaster position="top-right" />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Audit Logs</h1>
          <p className="text-gray-500 mt-1">Immutable ledger of all critical actions performed by Super Admins.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Event</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Resource</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-800">{new Date(log.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-gray-500 font-mono mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold">
                        {log.admin_name.charAt(0)}
                      </div>
                      {log.admin_name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-800">
                      {log.action}
                    </span>
                    <p className="text-xs text-gray-500 mt-1.5 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      {getResourceIcon(log.resource_type)}
                      <span className="font-semibold uppercase text-xs">{log.resource_type}</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">{log.resource_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {log.ip_address}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Activity className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="text-sm font-medium">No audit logs recorded yet.</p>
                      <p className="text-xs mt-1">Actions performed by Super Admins will appear here.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}
