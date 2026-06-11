"use client";

import Header from "@/components/layout/Header";
import { useMactDashboard } from "@/lib/hooks/useMact";
import { Car, Activity, IndianRupee, Briefcase, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MactDashboard() {
  const router = useRouter();
  const { data, isLoading } = useMactDashboard();

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="MACT Management" subtitle="Motor Accident Claims Tribunal Overview" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        
        {/* Quick Actions */}
        <div className="flex gap-4">
          <button 
            onClick={() => router.push("/mact/cases")}
            className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 hover:border-mint transition-colors flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-mint/10 text-mint rounded-xl flex items-center justify-center group-hover:bg-mint group-hover:text-white transition-colors">
              <Briefcase className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">View All MACT Cases</h3>
              <p className="text-sm text-gray-500">Track and manage tribunals</p>
            </div>
          </button>
          
          <button 
            onClick={() => router.push("/mact/cases/new")}
            className="flex-1 bg-white p-5 rounded-2xl border border-gray-100 hover:border-blue-500 transition-colors flex items-center gap-4 group"
          >
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Car className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">Register New MACT Case</h3>
              <p className="text-sm text-gray-500">Add intake details and FIR</p>
            </div>
          </button>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm mb-1 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Total MACT Cases</div>
            <div className="text-3xl font-bold text-gray-900">{isLoading ? "-" : data?.total_cases || 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm mb-1 flex items-center gap-2"><Activity className="w-4 h-4"/> Active Cases</div>
            <div className="text-3xl font-bold text-blue-600">{isLoading ? "-" : data?.active_cases || 0}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="text-gray-500 text-sm mb-1 flex items-center gap-2"><FileText className="w-4 h-4"/> Pending Award</div>
            <div className="text-3xl font-bold text-amber-600">{isLoading ? "-" : data?.award_pending || 0}</div>
          </div>
        </div>

        {/* Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-1">Total Compensation Claimed</div>
              <div className="text-3xl font-bold text-gray-900">₹{isLoading ? "..." : ((data?.total_claimed || 0) / 100000).toFixed(2)} L</div>
            </div>
            <div className="w-14 h-14 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm mb-1">Total Compensation Awarded</div>
              <div className="text-3xl font-bold text-green-600">₹{isLoading ? "..." : ((data?.total_awarded || 0) / 100000).toFixed(2)} L</div>
            </div>
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
