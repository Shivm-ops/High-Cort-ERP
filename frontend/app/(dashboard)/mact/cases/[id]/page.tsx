"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { useMactCase } from "@/lib/hooks/useMact";
import { useParams, useRouter } from "next/navigation";
import { Car, Users, ShieldAlert, FileText, CheckCircle, ArrowLeft, Calculator } from "lucide-react";
import MactCalculator from "@/components/mact/MactCalculator";

export default function MactCaseDetail() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  
  const { data: caseData, isLoading } = useMactCase(caseId);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) return <div className="p-10 text-center text-gray-500">Loading MACT Case...</div>;
  if (!caseData) return <div className="p-10 text-center text-red-500">Case not found</div>;

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header 
        title={`MACT Case: ${caseData.mact_case_number || 'Draft'}`} 
        subtitle={caseData.tribunal_name} 
      />

      <div className="px-6 pt-4 bg-white border-b border-gray-100 flex gap-6">
        <button onClick={() => router.push("/mact/cases")} className="pb-4 text-gray-400 hover:text-gray-900 mt-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {[
          { id: "overview", label: "Overview", icon: Car },
          { id: "claimants", label: "Claimants", icon: Users },
          { id: "insurance", label: "Insurance", icon: ShieldAlert },
          { id: "documents", label: "Documents", icon: FileText },
          { id: "calculator", label: "Calculator", icon: Calculator },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-4 px-2 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === t.id 
                ? "border-sidebar text-sidebar" 
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">FIR & Accident Details</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <div className="text-gray-500 mb-1">Accident Date</div>
                    <div className="font-medium text-gray-900">{caseData.accident_date || "—"}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">Police Station</div>
                    <div className="font-medium text-gray-900">{caseData.police_station}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-500 mb-1">FIR Number</div>
                    <div className="font-medium text-gray-900">{caseData.fir_number}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center text-center">
                <div className="text-sm text-gray-500 mb-2">Current Stage</div>
                <div className="text-xl font-bold text-sidebar capitalize bg-sidebar/5 rounded-xl py-3 border border-sidebar/10">
                  {caseData.current_stage?.replace("_", " ")}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Offending Vehicle</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl min-h-[80px]">
                  {caseData.vehicle_details || "Not specified"}
                </p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Driver & Owner Details</h3>
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl min-h-[80px] flex flex-col gap-2">
                  <div><strong>Driver:</strong> {caseData.driver_details || "—"}</div>
                  <div><strong>Owner:</strong> {caseData.owner_details || "—"}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "claimants" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex justify-between items-center">
              Registered Claimants
              <button className="text-sm bg-sidebar text-white px-4 py-2 rounded-xl font-medium hover:bg-sidebar-dark">Add Claimant</button>
            </h3>
            {caseData.claimants?.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Name</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3">Income</th>
                    <th className="px-4 py-3">Dependency</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {caseData.claimants.map((c: any) => (
                    <tr key={c.id}>
                      <td className="px-4 py-4 font-medium">{c.name}</td>
                      <td className="px-4 py-4">{c.age || "—"}</td>
                      <td className="px-4 py-4">₹{c.monthly_income}</td>
                      <td className="px-4 py-4 text-gray-500">{c.dependency_details || "—"}</td>
                      <td className="px-4 py-4 text-right text-mint font-medium cursor-pointer">Edit</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-10 text-gray-400">No claimants added yet.</div>
            )}
          </div>
        )}

        {activeTab === "insurance" && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm max-w-3xl">
            <h3 className="font-bold text-gray-900 mb-6 flex justify-between items-center">
              Insurance Company Details
              <button className="text-sm bg-sidebar text-white px-4 py-2 rounded-xl font-medium hover:bg-sidebar-dark">Edit Details</button>
            </h3>
            {caseData.insurance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl">
                  <div>
                    <div className="text-xs text-gray-500">Company Name</div>
                    <div className="font-semibold text-gray-900">{caseData.insurance.company_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Claim Ref No.</div>
                    <div className="font-semibold text-gray-900">{caseData.insurance.claim_reference_number || "—"}</div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="text-xs text-gray-500">Policy Details</div>
                  <div className="font-medium text-gray-900 mt-1">{caseData.insurance.policy_details || "—"}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">Insurance tracking not configured for this case.</div>
            )}
          </div>
        )}

        {activeTab === "calculator" && (
          <MactCalculator />
        )}
        
        {activeTab === "documents" && (
          <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100 border-dashed">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Document management for MACT module is active.</p>
            <p className="text-sm mt-1">Upload Charge Sheets, FIRs, and Medical Reports here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
