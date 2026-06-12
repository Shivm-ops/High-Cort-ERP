"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Building2, Users, Briefcase, Database, RefreshCw, MoreVertical, CreditCard, Ban, CheckCircle2, Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FirmsPage() {
  const [firms, setFirms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<string | null>(null);
  const [firmData, setFirmData] = useState({ name: "", type: "PARTNERSHIP", email: "", phone: "", pan_no: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [firmToDelete, setFirmToDelete] = useState<any>(null);

  useEffect(() => {
    fetchFirms();
  }, []);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/firms");
      setFirms(res.data);
    } catch (err) {
      toast.error("Failed to load firm data");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (firmId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/firms/${firmId}/status?active=${!currentStatus}`);
      toast.success(currentStatus ? "Firm suspended" : "Firm activated");
      fetchFirms();
    } catch (err) {
      toast.error("Failed to update firm status");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleOpenModal = (firm?: any) => {
    if (firm) {
      setEditingFirm(firm.id);
      setFirmData({ 
        name: firm.name, 
        type: firm.type,
        email: firm.email || "",
        phone: firm.phone || "",
        pan_no: firm.pan_no || "",
        address: firm.address || ""
      });
    } else {
      setEditingFirm(null);
      setFirmData({ name: "", type: "PARTNERSHIP", email: "", phone: "", pan_no: "", address: "" });
    }
    setIsModalOpen(true);
  };

  const handleSaveFirm = async () => {
    if (!firmData.name) {
      toast.error("Please enter a firm name.");
      return;
    }
    try {
      setIsSaving(true);
      if (editingFirm) {
        await api.put(`/admin/firms/${editingFirm}`, firmData);
        toast.success("Firm updated successfully.");
      } else {
        await api.post("/admin/firms", firmData);
        toast.success("Firm created successfully.");
      }
      setIsModalOpen(false);
      fetchFirms();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save firm");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteFirm = async () => {
    if (!firmToDelete) return;
    try {
      await api.delete(`/admin/firms/${firmToDelete.id}`);
      toast.success("Firm deleted successfully.");
      setFirmToDelete(null);
      fetchFirms();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete firm");
      setFirmToDelete(null);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenant Management</h1>
          <p className="text-gray-500 mt-1">Monitor and manage all Law Firm tenants on the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchFirms}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Law Firm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 overflow-y-auto pb-4">
        {firms.map((firm) => (
          <div key={firm.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col relative">
            <div className={cn(
              "h-2 w-full absolute top-0 left-0",
              firm.is_active ? "bg-emerald-500" : "bg-red-500"
            )} />
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{firm.name}</h2>
                    <p className="text-xs text-gray-500 uppercase font-semibold mt-0.5 tracking-wider">{firm.type}</p>
                  </div>
                </div>
                
                <div className="relative group cursor-pointer p-1">
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 flex flex-col overflow-hidden">
                    <button 
                      onClick={() => handleOpenModal(firm)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 font-bold transition-colors"
                    >
                      <Pencil className="w-4 h-4" /> Edit Details
                    </button>
                    {firm.is_active ? (
                      <button 
                        onClick={() => toggleStatus(firm.id, true)}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors"
                      >
                        <Ban className="w-4 h-4" /> Suspend Firm
                      </button>
                    ) : (
                      <button 
                        onClick={() => toggleStatus(firm.id, false)}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 font-bold transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Activate Firm
                      </button>
                    )}
                    <button 
                      onClick={() => setFirmToDelete(firm)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-bold transition-colors border-t border-gray-100"
                    >
                      <Trash2 className="w-4 h-4" /> Delete Firm
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <span className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider",
                  firm.subscription.status === 'active' ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"
                )}>
                  {firm.subscription.plan_name} Plan
                </span>
                <span className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider",
                  firm.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                )}>
                  {firm.is_active ? 'Account Active' : 'Suspended'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Users</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{firm.metrics.active_users} <span className="text-gray-400 text-sm font-normal">/ {firm.metrics.total_users}</span></p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Cases</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{firm.metrics.total_cases}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Database className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Storage</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{formatBytes(firm.metrics.storage_bytes)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">Revenue</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">₹{(firm.metrics.total_revenue / 100).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <div className="mt-auto bg-gray-50 px-6 py-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
              <span>Joined {new Date(firm.created_at).toLocaleDateString()}</span>
              <span className="font-mono text-[10px] text-gray-400">{firm.id.split('-')[0]}</span>
            </div>
          </div>
        ))}
        {firms.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white border border-gray-200 rounded-2xl border-dashed">
            No law firms registered yet.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[450px]">
            <h3 className="text-lg font-bold mb-4">{editingFirm ? "Edit Law Firm" : "Register New Law Firm"}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">Firm Name</label>
                <input 
                  type="text" 
                  value={firmData.name}
                  onChange={e => setFirmData({...firmData, name: e.target.value})}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. Apex Legal Partners"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Email Address</label>
                  <input 
                    type="email" 
                    value={firmData.email}
                    onChange={e => setFirmData({...firmData, email: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                    placeholder="contact@firm.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Contact Number</label>
                  <input 
                    type="text" 
                    value={firmData.phone}
                    onChange={e => setFirmData({...firmData, phone: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                    placeholder="+91..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Firm Type</label>
                  <select 
                    value={firmData.type}
                    onChange={e => setFirmData({...firmData, type: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="INDIVIDUAL">Independent Advocate</option>
                    <option value="PARTNERSHIP">Partnership Firm</option>
                    <option value="LLP">LLP</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">PAN Number</label>
                  <input 
                    type="text" 
                    value={firmData.pan_no}
                    onChange={e => setFirmData({...firmData, pan_no: e.target.value.toUpperCase()})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 uppercase" 
                    placeholder="ABCDE1234F"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Registered Address</label>
                <textarea 
                  value={firmData.address}
                  onChange={e => setFirmData({...firmData, address: e.target.value})}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 resize-none h-20" 
                  placeholder="Full office address..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                  onClick={handleSaveFirm} 
                  disabled={isSaving || !firmData.name} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : (editingFirm ? "Save Changes" : "Register Firm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {firmToDelete && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Law Firm?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to delete <span className="font-bold text-gray-900">{firmToDelete.name}</span>? This action cannot be undone. If this firm has active users or cases, the deletion will be blocked.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setFirmToDelete(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteFirm}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm shadow-red-200"
                >
                  Yes, Delete Firm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
