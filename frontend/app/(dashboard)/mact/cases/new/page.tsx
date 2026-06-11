"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { useCreateMactCase } from "@/lib/hooks/useMact";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";

export default function NewMactCase() {
  const router = useRouter();
  const createMutation = useCreateMactCase();

  const [formData, setFormData] = useState({
    mact_case_number: "",
    tribunal_name: "",
    filing_date: "",
    accident_date: "",
    police_station: "",
    fir_number: "",
    vehicle_details: "",
    driver_details: "",
    owner_details: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData, {
      onSuccess: (data) => {
        router.push(`/mact/cases/${data.id}`);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Register MACT Case" subtitle="Enter primary details of the motor accident claim" />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="text-gray-500 flex items-center gap-2 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Cases
            </button>
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-sidebar text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sidebar-dark transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> 
              {createMutation.isPending ? "Saving..." : "Save & Continue"}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3">Tribunal Details</h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tribunal Name <span className="text-red-500">*</span></label>
                <input required type="text" name="tribunal_name" value={formData.tribunal_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint" placeholder="e.g. MACT, District Court Delhi" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">MACT Case Number</label>
                <input type="text" name="mact_case_number" value={formData.mact_case_number} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint" placeholder="Leave blank if pre-filing stage" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filing Date</label>
                <input type="date" name="filing_date" value={formData.filing_date} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint" />
              </div>
            </div>

            <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3 pt-4">Accident & FIR Details</h3>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accident Date <span className="text-red-500">*</span></label>
                <input required type="date" name="accident_date" value={formData.accident_date} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Police Station <span className="text-red-500">*</span></label>
                <input required type="text" name="police_station" value={formData.police_station} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint" placeholder="Jurisdictional PS" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">FIR Number <span className="text-red-500">*</span></label>
                <input required type="text" name="fir_number" value={formData.fir_number} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint" placeholder="e.g. FIR No. 123/2026 U/s 279, 337 IPC" />
              </div>
            </div>

            <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-3 pt-4">Vehicle & Parties</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offending Vehicle Details</label>
                <textarea name="vehicle_details" value={formData.vehicle_details} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint min-h-[80px]" placeholder="Make, Model, Registration Number" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Details (Respondent 1)</label>
                  <textarea name="driver_details" value={formData.driver_details} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint min-h-[80px]" placeholder="Name, Address, License Info" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Details (Respondent 2)</label>
                  <textarea name="owner_details" value={formData.owner_details} onChange={handleChange} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-mint/20 focus:border-mint min-h-[80px]" placeholder="Name, Address" />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
