"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Download, Users, Building2, CreditCard, FileSpreadsheet, FileOutput } from "lucide-react";

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReport = async (endpoint: string, filename: string) => {
    setDownloading(endpoint);
    try {
      const res = await api.get(`/admin/reports/${endpoint}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Report downloaded successfully");
    } catch (err) {
      toast.error("Failed to download report");
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      id: "users/csv",
      title: "Global User Report",
      description: "Download a full list of all registered advocates, admins, and support staff.",
      icon: Users,
      filename: "lagalos_users_export.csv",
      color: "text-blue-600 bg-blue-50 border-blue-100"
    },
    {
      id: "firms/csv",
      title: "Law Firm Directory",
      description: "Export all tenant law firms, including their registration numbers and statuses.",
      icon: Building2,
      filename: "lagalos_firms_export.csv",
      color: "text-emerald-600 bg-emerald-50 border-emerald-100"
    },
    {
      id: "revenue/csv",
      title: "Revenue Ledger",
      description: "Detailed export of all SaaS subscription payments, renewals, and refunds.",
      icon: CreditCard,
      filename: "lagalos_revenue_export.csv",
      color: "text-indigo-600 bg-indigo-50 border-indigo-100"
    }
  ];

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto w-full">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Report Center</h1>
        <p className="text-gray-500 mt-1">Export platform-wide analytics and raw data into spreadsheet formats.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-5 ${report.color}`}>
              <report.icon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1">{report.description}</p>
            
            <button
              onClick={() => downloadReport(report.id, report.filename)}
              disabled={downloading === report.id}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {downloading === report.id ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
              ) : (
                <>
                  <FileOutput className="w-5 h-5" /> Download CSV
                </>
              )}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-12 bg-indigo-50 border border-indigo-100 rounded-2xl p-8 flex items-center gap-6">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-indigo-600">
          <FileSpreadsheet className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-indigo-900 mb-1">Need a Custom Report?</h3>
          <p className="text-indigo-700 text-sm max-w-2xl leading-relaxed">
            These are the standard exports. For deep analytics, use the API directly or connect LegalOS database read replicas to BI tools like Tableau or PowerBI.
          </p>
        </div>
      </div>
    </div>
  );
}
