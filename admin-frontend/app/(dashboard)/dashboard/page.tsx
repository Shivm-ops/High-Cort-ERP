"use client";

import { useState, useEffect } from "react";
import { Users, Building2, TrendingUp, AlertTriangle, CheckCircle, Clock, Database, Shield, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  const [metrics, setMetrics] = useState<any>(null);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, healthRes] = await Promise.all([
          api.get("/admin/dashboard/metrics"),
          api.get("/admin/dashboard/health")
        ]);
        setMetrics(metricsRes.data);
        setHealth(healthRes.data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        toast.error("Failed to load live dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-8 animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-32 flex flex-col justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  const kpis = [
    { title: "Total Subscribers", value: metrics?.total_subscribers?.toString() || "0", change: "+12%", icon: Users, color: "bg-blue-500" },
    { title: "Active Law Firms", value: metrics?.active_law_firms?.toString() || "0", change: "+5%", icon: Building2, color: "bg-indigo-500" },
    { title: "Active Advocates", value: metrics?.active_advocates?.toString() || "0", change: "+8%", icon: Shield, color: "bg-emerald-500" },
    { title: "Monthly Revenue", value: `₹${metrics?.monthly_revenue?.toLocaleString() || "0"}`, change: "+15%", icon: TrendingUp, color: "bg-green-500" },
    { title: "Pending KYC", value: metrics?.pending_kyc?.toString() || "0", change: "-2", icon: Clock, color: "bg-amber-500" },
    { title: "Pending Approvals", value: metrics?.pending_approvals?.toString() || "0", change: "-1", icon: CheckCircle, color: "bg-orange-500" },
    { title: "Support Tickets", value: metrics?.support_tickets?.toString() || "0", change: "+3", icon: AlertTriangle, color: "bg-red-500" },
    { title: "Storage Usage", value: `${metrics?.storage_usage_mb || 0} MB`, change: "+2%", icon: Database, color: "bg-purple-500" },
  ];

  return (
    <div className="p-8 space-y-8">
      
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time metrics and system health for Fastcase SaaS network.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden group hover:shadow-md transition-all">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-transform group-hover:scale-110 ${kpi.color}`}></div>
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm ${kpi.color}`}>
                <kpi.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{kpi.value}</h3>
              </div>
            </div>
            <div className="mt-auto">
              <span className={`text-xs font-bold px-2 py-1 rounded-md ${kpi.change.startsWith('+') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {kpi.change}
              </span>
              <span className="text-xs text-gray-400 font-medium ml-2">vs last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations / KYC */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900">Pending KYC Approvals</h3>
            <button onClick={() => router.push('/kyc')} className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {metrics?.pending_kyc > 0 ? (
              <div className="p-8 text-center text-indigo-600 text-sm font-medium bg-indigo-50 rounded-xl cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => router.push('/kyc')}>
                You have {metrics.pending_kyc} pending KYC requests awaiting review.
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No pending KYC approvals in the queue.
              </div>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-6">System Health</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">API Server (api.fastcase.in)</span>
                <span className={`font-bold ${health?.api_server?.health === 'excellent' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {health?.api_server?.status || 'Unknown'}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full w-full ${health?.api_server?.health === 'excellent' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">Database Cluster (Primary)</span>
                <span className={`font-bold ${health?.database?.health === 'good' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {health?.database?.status || 'Unknown'}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full w-1/3 ${health?.database?.health === 'good' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">MinIO / S3 Cluster</span>
                <span className={`font-bold ${health?.storage?.health === 'excellent' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {health?.storage?.status || 'Unknown'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-full w-[12%] rounded-full ${health?.storage?.health === 'excellent' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
