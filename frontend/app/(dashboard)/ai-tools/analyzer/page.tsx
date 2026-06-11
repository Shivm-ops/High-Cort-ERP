"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import { Upload, FileText, AlertTriangle, Scale, Calendar, CheckCircle, Download, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function CourtOrderAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const { data } = await api.post("/analyzer/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setResult(data);
      toast.success("Analysis complete");
    } catch (error) {
      toast.error("Failed to analyze the document");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="AI Court Order Analyzer" subtitle="Extract intelligence, dates, and compliance actions from orders" />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {!result && (
          <div className="max-w-3xl mx-auto mt-10">
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center hover:border-mint/50 transition-colors">
              <div className="w-20 h-20 bg-mint/10 text-mint rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Upload className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Court Order</h3>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Upload any PDF judgment, daily order, or proceedings. The AI engine will extract key findings, deadlines, and actions.
              </p>
              
              <input type="file" id="order-upload" className="hidden" accept=".pdf" onChange={handleUpload} />
              
              {!file ? (
                <label htmlFor="order-upload" className="cursor-pointer bg-sidebar text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-sidebar-dark transition-colors inline-block">
                  Select PDF Document
                </label>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-gray-50 px-6 py-3 rounded-xl border border-gray-200 flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  </div>
                  <button 
                    onClick={analyzeFile}
                    disabled={isAnalyzing}
                    className="bg-mint text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-mint/90 transition-colors disabled:opacity-70 flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Analyzing via AI Engine...
                      </>
                    ) : (
                      "Start AI Analysis"
                    )}
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-8 grid grid-cols-3 gap-6 text-center">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3"><Scale className="w-5 h-5"/></div>
                <h4 className="font-semibold text-gray-900 text-sm">Key Findings</h4>
                <p className="text-xs text-gray-500 mt-1">Extracts the most critical rulings</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3"><Calendar className="w-5 h-5"/></div>
                <h4 className="font-semibold text-gray-900 text-sm">Dates & Deadlines</h4>
                <p className="text-xs text-gray-500 mt-1">Identifies hearing and limitation dates</p>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mx-auto mb-3"><AlertTriangle className="w-5 h-5"/></div>
                <h4 className="font-semibold text-gray-900 text-sm">Risk Alerts</h4>
                <p className="text-xs text-gray-500 mt-1">Highlights potential compliance risks</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-mint/10 text-mint rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{file?.name}</h2>
                  <p className="text-sm text-gray-500">AI Analysis Completed</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => {setResult(null); setFile(null);}} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                  Analyze Another
                </button>
                <button className="flex items-center gap-2 bg-sidebar text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-sidebar-dark transition-colors">
                  <Download className="w-4 h-4" /> Export PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-6">
                
                {/* Executive Summary */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-sidebar" /> Executive Summary
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nature of Matter</span>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100">{result.executive_summary?.nature_of_matter}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Key Facts</span>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100">{result.executive_summary?.key_facts}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Court Observations</span>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded-xl border border-gray-100">{result.executive_summary?.court_observations}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Final Decision</span>
                      <p className="text-gray-900 mt-1 bg-mint/10 p-3 rounded-xl border border-mint/20 font-medium">{result.executive_summary?.final_decision}</p>
                    </div>
                  </div>
                </div>

                {/* Important Findings */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" /> Key Findings & Sections
                  </h3>
                  <ul className="space-y-3">
                    {result.important_findings?.map((finding: string, i: number) => (
                      <li key={i} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0 text-sm font-bold">{i+1}</div>
                        <span className="text-gray-700 leading-relaxed">{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                
                {/* Hearing Info */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" /> Case Details
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                      <span className="block text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Next Hearing</span>
                      <span className="block text-lg font-bold text-blue-900">{result.hearing_info?.next_hearing_date || "Not Specified"}</span>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-500">Stage</span>
                      <p className="font-medium text-gray-900">{result.hearing_info?.stage_of_matter}</p>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-500">Court</span>
                      <p className="font-medium text-gray-900">{result.hearing_info?.court_name}</p>
                    </div>
                    <div className="border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-500">Judge</span>
                      <p className="font-medium text-gray-900">{result.hearing_info?.judge_name}</p>
                    </div>
                  </div>
                </div>

                {/* Action Items */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-indigo-600" /> Action Items
                  </h3>
                  <ul className="space-y-3">
                    {result.action_items?.map((item: string, i: number) => (
                      <li key={i} className="flex gap-3 bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-indigo-900 text-sm font-medium leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Alerts */}
                <div className="bg-white p-6 rounded-2xl border border-red-200 bg-red-50/50 shadow-sm">
                  <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" /> Risk Alerts
                  </h3>
                  <ul className="space-y-3">
                    {result.risk_alerts?.map((alert: string, i: number) => (
                      <li key={i} className="flex gap-3 text-red-700 text-sm font-medium">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{alert}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
