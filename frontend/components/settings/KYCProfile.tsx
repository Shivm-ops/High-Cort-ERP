"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { api, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_KYC_BYTES = 10 * 1024 * 1024;

export default function KYCProfile() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [docType, setDocType] = useState("aadhaar");
  const [docNumber, setDocNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchKYC = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/me/kyc");
      setRecords(res.data || []);
    } catch (err) {
      console.error("Failed to fetch KYC records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_KYC_BYTES) {
      toast.error("KYC file must be under 10 MB.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!docType || !docNumber.trim() || !selectedFile) {
      toast.error("Please fill all details and upload a document.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("document_type", docType);
      formData.append("document_number", docNumber.trim());
      formData.append("file", selectedFile);

      await api.post("/users/me/kyc/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("KYC document uploaded and submitted for verification.");
      setDocNumber("");
      setSelectedFile(null);
      await fetchKYC();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleViewDocument = async (record: any) => {
    try {
      const res = await api.get(`/users/me/kyc/${record.id}/download`, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(res.data);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-6"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <h2 className="text-[15px] font-semibold text-charcoal mb-2 flex items-center gap-2">
        <Shield className="w-4 h-4 text-indigo-600" /> KYC & Compliance
      </h2>
      <p className="text-[12px] text-muted mb-6">
        Upload your identity documents (PDF, PNG, JPG, or WEBP up to 10 MB) to verify your profile and law firm.
      </p>

      {/* Upload Form */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8">
        <h3 className="text-[13px] font-bold text-gray-800 mb-4">Submit New Document</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full h-10 px-3 rounded-xl text-[13px] bg-white border border-gray-200 focus:outline-none focus:border-indigo-500 text-charcoal"
            >
              <option value="aadhaar">Aadhaar Card</option>
              <option value="pan">PAN Card</option>
              <option value="bar_council">Bar Council ID</option>
              <option value="gst">GST Certificate</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Document Number
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. 1234 5678 9012"
              className="w-full h-10 px-3 rounded-xl text-[13px] bg-white border border-gray-200 focus:outline-none focus:border-indigo-500 text-charcoal"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Upload File
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div
                className={cn(
                  "w-full h-10 px-3 rounded-xl text-[13px] bg-white border flex items-center justify-center gap-2 transition-colors truncate",
                  selectedFile
                    ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                    : "border-gray-200 text-gray-500 hover:bg-gray-100"
                )}
              >
                {selectedFile ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{selectedFile.name}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 flex-shrink-0" /> Choose File...
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || !selectedFile || !docNumber.trim()}
            className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            Submit for Verification
          </button>
        </div>
      </div>

      {/* Submitted Documents */}
      <h3 className="text-[13px] font-bold text-gray-800 mb-4 border-t border-gray-100 pt-6">
        Your Documents
      </h3>
      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : records.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
          No KYC documents submitted yet.
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div
              key={record.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-gray-900 capitalize">
                    {String(record.document_type || "").replace("_", " ")}
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                    {record.document_number}
                  </p>
                  {record.rejection_reason && (
                    <p className="text-[11px] text-red-600 mt-0.5">
                      Reason: {record.rejection_reason}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                {record.has_file && (
                  <button
                    type="button"
                    onClick={() => handleViewDocument(record)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> View
                  </button>
                )}
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(record.status)}
                  {record.submitted_at && (
                    <span className="text-[10px] text-gray-400">
                      Submitted: {new Date(record.submitted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
