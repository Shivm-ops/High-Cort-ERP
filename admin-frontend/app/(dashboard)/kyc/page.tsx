"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Check, X, Search, FileText, AlertTriangle, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

export default function KYCPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Modal state
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/kyc?status=${activeTab}`);
      setQueue(res.data);
    } catch (err) {
      toast.error("Failed to fetch KYC queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [activeTab]);

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedRecord) return;
    if (action === "reject" && !rejectionReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    setActionLoading(true);
    try {
      await api.put(`/admin/kyc/${selectedRecord.id}`, {
        action,
        rejection_reason: action === "reject" ? rejectionReason : null
      });
      toast.success(`KYC document ${action}d successfully`);
      setSelectedRecord(null);
      setRejectionReason("");
      fetchQueue();
    } catch (err) {
      toast.error("Failed to process KYC review");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <Toaster position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KYC Approvals Queue</h1>
        <p className="text-gray-500 mt-1">Review and verify law firm credentials and advocate identities.</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors",
              activeTab === tab 
                ? "bg-indigo-600 text-white" 
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document Type</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {queue.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{record.entity_name}</p>
                    <p className="text-xs text-gray-500 uppercase font-medium mt-0.5">{record.entity_type}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <div>
                        <p className="text-sm font-bold text-gray-700 capitalize">{record.document_type.replace('_', ' ')}</p>
                        <p className="text-xs text-gray-500 font-mono">{record.document_number}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">{new Date(record.submitted_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-md uppercase",
                      record.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      record.status === 'approved' ? "bg-emerald-50 text-emerald-600" :
                      "bg-red-50 text-red-600"
                    )}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Review
                    </button>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center mb-3">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <p className="font-medium text-gray-900">All caught up!</p>
                    <p className="text-sm">No {activeTab} KYC records found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex overflow-hidden border border-gray-200">
            
            {/* Left: Document Viewer */}
            <div className="w-1/2 bg-gray-100 border-r border-gray-200 flex flex-col p-4 relative">
              <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs font-mono rounded backdrop-blur-md">
                PREVIEW - {selectedRecord.document_type.toUpperCase()}
              </div>
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center overflow-hidden p-8">
                {/* Simulated Document Preview */}
                <div className="w-full h-full border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400">
                  <FileText className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="font-medium text-gray-500 text-center px-4">
                    [SECURE PDF RENDERER]<br/>
                    URL: {selectedRecord.document_url}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Review Controls */}
            <div className="w-1/2 flex flex-col p-8 bg-white overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Document Review</h2>
                  <p className="text-sm text-gray-500 mt-1">Verify details against the uploaded proof.</p>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Entity</p>
                  <p className="font-bold text-gray-900">{selectedRecord.entity_name} ({selectedRecord.entity_type})</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Document</p>
                  <p className="font-bold text-gray-900 capitalize">{selectedRecord.document_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase">Extracted Number</p>
                  <p className="font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-max mt-1 border border-indigo-100">
                    {selectedRecord.document_number}
                  </p>
                </div>
              </div>

              {selectedRecord.status === "pending" && (
                <div className="mt-auto space-y-4">
                  <div className="border-t border-gray-100 pt-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Rejection Reason (If applicable)</label>
                    <textarea 
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Specify why this document is being rejected..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleReview("reject")}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleReview("approve")}
                      disabled={actionLoading}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                    >
                      Approve & Verify
                    </button>
                  </div>
                </div>
              )}
              {selectedRecord.status !== "pending" && (
                <div className="mt-auto bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                  <p className="font-bold text-gray-900 mb-1">Already Reviewed</p>
                  <p className="text-sm text-gray-500">This document is currently marked as <span className="uppercase font-bold">{selectedRecord.status}</span>.</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
