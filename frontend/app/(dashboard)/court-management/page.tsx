"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Building2, Calendar, User, MapPin, BarChart2, Plus, Upload, Gavel, Scale, FileText, ChevronRight, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";

import { useRouter } from "next/navigation";

import { useCourts } from "@/lib/hooks/useCourts";
import CourtFormModal from "@/components/courts/CourtFormModal";
import Modal from "@/components/ui/Modal";
import { api } from "@/lib/api";
import { toast } from "sonner";

const getCourtColor = (type: string) => {
  if (type?.toLowerCase().includes("high court")) return "#EF4444";
  if (type?.toLowerCase().includes("sessions")) return "#3B82F6";
  if (type?.toLowerCase().includes("family")) return "#F59E0B";
  if (type?.toLowerCase().includes("tribunal")) return "#10B981";
  if (type?.toLowerCase().includes("forum")) return "#F97316";
  return "#8B5CF6";
};

export default function CourtManagementPage() {
  const router = useRouter();
  const { courts, isLoading, mutate } = useCourts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [courtToDelete, setCourtToDelete] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!courtToDelete) return;
    try {
      await api.delete(`/courts/${courtToDelete}`);
      toast.success("Court deleted successfully!");
      mutate();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete court");
    } finally {
      setCourtToDelete(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, courtId: string) => {
    e.stopPropagation();
    setCourtToDelete(courtId);
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <div className="flex items-center justify-between">
        <Header title="Court Dashboard" subtitle="Manage and track court-wise cases, cause lists, and schedules" />
        <div className="pr-6 pt-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#013B36] text-white rounded-xl text-sm font-semibold hover:bg-[#013B36]/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Court
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* Global Court Analytics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center"><Building2 className="w-6 h-6 text-indigo-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Active Cases across Courts</div></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center"><Calendar className="w-6 h-6 text-amber-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Matters Listed Today</div></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center"><Scale className="w-6 h-6 text-emerald-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Pending Orders</div></div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center"><FileText className="w-6 h-6 text-blue-600"/></div>
            <div><div className="text-2xl font-bold text-gray-900">0</div><div className="text-xs font-semibold text-gray-500 uppercase">Pending Filings</div></div>
          </div>
        </div>

        {/* Court Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courts.map((court, i) => {
            const color = getCourtColor(court.type);
            return (
              <motion.div key={court.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col group relative overflow-hidden shadow-sm hover:shadow-md transition-all"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-[0.03] transition-opacity group-hover:opacity-[0.06]" style={{ backgroundColor: color }} />
                
                <div className="flex items-start justify-between mb-5 relative z-10 cursor-pointer" onClick={() => router.push(`/court-management/${court.id}`)}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                      <Building2 className="w-6 h-6" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-[16px] font-bold text-gray-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1">{court.name} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" /></h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 uppercase tracking-wider">{court.type}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteClick(e, court.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors z-20"
                    title="Delete Court"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5 relative z-10" onClick={() => router.push(`/court-management/${court.id}`)}>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Jurisdiction</span>
                    <span className="text-[12px] font-bold text-gray-900 truncate">{court.jurisdiction || "N/A"}</span>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-100 flex flex-col">
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Presiding</span>
                    <span className="text-[12px] font-bold text-amber-700 truncate">{court.presiding_officer || "N/A"}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Room No</span>
                    <span className="text-[13px] font-bold text-gray-900 mt-1">{court.room_number || "N/A"}</span>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 border border-red-100 flex flex-col">
                    <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">Address</span>
                    <span className="text-[11px] font-bold text-red-700 mt-1 truncate">{court.address || "N/A"}</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-auto relative z-10 grid grid-cols-2 gap-2">
                  <button onClick={() => router.push(`/court-management/${court.id}`)} className="py-2 bg-indigo-50 text-indigo-700 font-bold text-[12px] rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" /> View Cases
                  </button>
                  <button onClick={() => router.push(`/court-management/${court.id}`)} className="py-2 bg-amber-50 text-amber-700 font-bold text-[12px] rounded-lg hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Cause List
                  </button>
                  <button onClick={() => router.push('/hearings')} className="py-2 bg-gray-50 border border-gray-200 text-gray-600 font-bold text-[12px] rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Hearing
                  </button>
                  <button onClick={() => router.push('/evidence')} className="py-2 bg-gray-50 border border-gray-200 text-gray-600 font-bold text-[12px] rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> Upload Order
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>
      <CourtFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => mutate()} 
      />

      <Modal
        open={!!courtToDelete}
        onClose={() => setCourtToDelete(null)}
        title="Delete Court"
        description="Are you sure you want to delete this court? This action cannot be undone."
        size="sm"
      >
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
          <button
            onClick={() => setCourtToDelete(null)}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Delete Court
          </button>
        </div>
      </Modal>
    </div>
  );
}
