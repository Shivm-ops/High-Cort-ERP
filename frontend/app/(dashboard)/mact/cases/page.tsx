"use client";

import Header from "@/components/layout/Header";
import { useMactCases } from "@/lib/hooks/useMact";
import { Car, Plus, ExternalLink, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function MactCasesList() {
  const router = useRouter();
  const { data, isLoading } = useMactCases();

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="MACT Cases" subtitle="List of all Motor Accident Claims Tribunal matters" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Case Directory</h2>
          <button 
            onClick={() => router.push("/mact/cases/new")}
            className="flex items-center gap-2 bg-sidebar text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-sidebar-dark transition-colors"
          >
            <Plus className="w-4 h-4" /> Register Case
          </button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : !data || data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
            <Car className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">No MACT Cases Found</h3>
            <p className="text-gray-500 mb-4">You have not registered any motor accident claims yet.</p>
            <button 
              onClick={() => router.push("/mact/cases/new")}
              className="text-mint font-medium hover:underline"
            >
              Register your first case →
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-medium text-gray-500">
                  <th className="px-5 py-3">Case No & Tribunal</th>
                  <th className="px-5 py-3">Accident Date</th>
                  <th className="px-5 py-3">Police Station</th>
                  <th className="px-5 py-3">Insurance Co.</th>
                  <th className="px-5 py-3">Stage</th>
                  <th className="px-5 py-3">Claimed</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">{c.mact_case_number || "Draft"}</div>
                      <div className="text-xs text-gray-500">{c.tribunal_name}</div>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{c.accident_date || "—"}</td>
                    <td className="px-5 py-4 text-gray-600">{c.police_station}</td>
                    <td className="px-5 py-4 text-gray-600">{c.insurance_company}</td>
                    <td className="px-5 py-4">
                      <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium capitalize">
                        {c.current_stage?.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      ₹{c.compensation_claimed ? (c.compensation_claimed / 100000).toFixed(2) + " L" : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button 
                        onClick={() => router.push(`/mact/cases/${c.id}`)}
                        className="text-gray-400 hover:text-sidebar transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
