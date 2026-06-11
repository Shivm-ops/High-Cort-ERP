"use client";

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Briefcase, Calendar, Clock, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function ClientDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "client") {
      router.push("/client/login");
      return;
    }

    // Mock fetching client cases for the dashboard
    // In reality, this would hit /api/v1/client-portal/cases
    setCases([
      { id: "1", title: "Sharma vs State", case_no: "WP/1024/2025", court: "High Court", status: "Active", next_hearing: "2026-06-15" },
      { id: "2", title: "Property Dispute", case_no: "CS/204/2024", court: "District Court", status: "Pending", next_hearing: "2026-07-02" }
    ] as any);
    setLoading(false);
  }, [isAuthenticated, user, router]);

  if (loading) {
    return <div className="flex h-full items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.full_name}</h1>
        <p className="text-gray-500 mt-1">Here is the latest status of your legal matters.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{cases.length}</div>
            <div className="text-sm font-medium text-gray-500">Active Cases</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">1</div>
            <div className="text-sm font-medium text-gray-500">Upcoming Hearing</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-sm font-medium text-gray-500">Shared Documents</div>
          </div>
        </div>
      </div>

      {/* Active Cases List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Your Cases</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {cases.map((c: any) => (
            <div key={c.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{c.case_no}</span>
                  <span className="text-xs font-medium text-gray-500">{c.court}</span>
                </div>
                <h3 className="font-bold text-gray-900">{c.title}</h3>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 mb-1">Next Hearing</div>
                  <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {new Date(c.next_hearing).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 mb-1">Status</div>
                  <div className="text-sm font-bold text-green-700 flex items-center gap-1.5 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {c.status}
                  </div>
                </div>
                <button className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-semibold text-gray-700 rounded-xl transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
