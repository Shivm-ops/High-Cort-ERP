"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { 
  FileText, UploadCloud, CheckCircle2, AlertCircle, Plus, Search, 
  Settings, Loader2, ArrowRight, Printer, Download, Save, Link2, 
  GripVertical, FileCheck, Layers, FileSignature, Trash2
} from "lucide-react";
import { getChecklist, ChecklistItem } from "@/lib/constants/filingChecklists";
import { Case } from "@/lib/hooks/useCases";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EFilingProps {
  caseData: Case;
}

interface UploadedDoc {
  id: string;
  name: string;
  type: string;
  checklistId: string;
  url: string;
  size: string;
}

const STATUSES = ["Draft", "Ready For Filing", "Filed", "Defect Raised", "Accepted"];

export default function EFilingWorkspace({ caseData }: EFilingProps) {
  const [status, setStatus] = useState("Draft");
  
  // Get dynamic checklist based on practice area / case type
  const checklist = getChecklist(caseData.practice_area, caseData.case_type);
  
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"checklist" | "package">("checklist");
  
  // Package builder state
  const [packageSequence, setPackageSequence] = useState<UploadedDoc[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{valid: boolean; missing: string[]} | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState(false);

  // Sync package sequence when new docs uploaded
  useEffect(() => {
    setPackageSequence(uploadedDocs);
  }, [uploadedDocs]);

  const handleSimulateUpload = (item: ChecklistItem) => {
    if (uploadedDocs.find(d => d.checklistId === item.id)) return;
    
    const newDoc: UploadedDoc = {
      id: Math.random().toString(36).substring(7),
      name: `${item.name.replace("/", "_")}_signed.pdf`,
      type: "pdf",
      checklistId: item.id,
      url: "#",
      size: "2.4 MB"
    };
    
    setUploadedDocs(prev => [...prev, newDoc]);
    toast.success(`${item.name} uploaded successfully`);
  };

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      const requiredItems = checklist.filter(c => c.required);
      const uploadedIds = uploadedDocs.map(d => d.checklistId);
      const missing = requiredItems.filter(c => !uploadedIds.includes(c.id)).map(c => c.name);
      
      setValidationResult({ valid: missing.length === 0, missing });
      if (missing.length === 0) {
        setStatus("Ready For Filing");
        toast.success("Validation successful! All mandatory documents are present.");
      } else {
        toast.error("Validation failed. Missing mandatory documents.");
      }
      setIsValidating(false);
    }, 1500);
  };

  const handleGenerate = () => {
    if (!validationResult?.valid) {
      toast.error("Please validate the package first.");
      return;
    }
    
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedPdf(true);
      toast.success("Final Filing Bundle Generated!");
    }, 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 flex flex-col h-[800px] overflow-hidden shadow-sm">
      
      {/* Top Bar - Tracker */}
      <div className="h-16 border-b border-gray-100 px-6 flex items-center justify-between shrink-0 bg-gray-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-charcoal">E-Filing Preparation</h2>
            <div className="text-[11px] text-muted">Assemble, validate, and generate filing bundle</div>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="flex items-center">
          {STATUSES.map((s, i) => {
            const isActive = status === s;
            const isPast = STATUSES.indexOf(status) > i;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center relative z-10">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                    isActive ? "bg-indigo-600 text-white ring-4 ring-indigo-50" : 
                    isPast ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400"
                  )}>
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={cn(
                    "absolute top-8 text-[9px] font-semibold whitespace-nowrap",
                    isActive ? "text-indigo-600" : isPast ? "text-emerald-600" : "text-gray-400"
                  )}>{s}</span>
                </div>
                {i < STATUSES.length - 1 && (
                  <div className={cn(
                    "w-12 h-0.5 mx-1",
                    isPast ? "bg-emerald-500" : "bg-gray-100"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT PANEL - Smart Checklist */}
        <div className="w-[360px] border-r border-gray-100 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
            <h3 className="text-[12px] font-bold text-charcoal uppercase tracking-wider">Required Documents</h3>
            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {uploadedDocs.length} / {checklist.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {checklist.map((item) => {
              const isUploaded = uploadedDocs.some(d => d.checklistId === item.id);
              
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-3 rounded-xl border transition-all relative overflow-hidden",
                    isUploaded ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-gray-100 hover:border-gray-200"
                  )}
                >
                  {isUploaded && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400" />}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-md flex items-center justify-center", isUploaded ? "bg-emerald-100" : "bg-gray-100")}>
                        {isUploaded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <FileText className="w-3.5 h-3.5 text-gray-400" />}
                      </div>
                      <span className={cn("text-[12px] font-semibold", isUploaded ? "text-emerald-800" : "text-charcoal")}>{item.name}</span>
                    </div>
                    {item.required && !isUploaded && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
                    {!item.required && !isUploaded && <span className="text-[9px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">Optional</span>}
                  </div>
                  
                  {isUploaded ? (
                    <div className="flex items-center justify-between mt-3 text-[11px]">
                      <span className="text-emerald-600 font-medium flex items-center gap-1"><FileCheck className="w-3 h-3"/> Uploaded</span>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => window.print()}
                          className="text-gray-500 hover:text-sidebar font-medium flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" /> Print
                        </button>
                        <button 
                          onClick={() => setUploadedDocs(prev => prev.filter(d => d.checklistId !== item.id))}
                          className="text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full mt-2">
                      <button 
                        onClick={() => handleSimulateUpload(item)}
                        className="flex-1 h-8 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors text-[11px] font-semibold flex items-center justify-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Select File
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="w-8 h-8 rounded-lg border border-gray-200 text-gray-400 hover:text-sidebar hover:bg-gray-50 flex items-center justify-center transition-colors shadow-sm"
                        title="Print Form"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL - Package Builder & Validation */}
        <div className="flex-1 flex flex-col bg-gray-50/30">
          
          <div className="h-12 border-b border-gray-100 flex items-center px-2">
            <button 
              onClick={() => setActiveTab("package")} 
              className={cn("h-full px-4 text-[12px] font-bold border-b-2 transition-colors", activeTab === "package" ? "border-indigo-500 text-indigo-700" : "border-transparent text-gray-500 hover:text-gray-700")}
            >
              Filing Package Builder
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "package" && (
              <div className="max-w-3xl mx-auto">
                
                {/* Status Alert */}
                {validationResult && (
                  <div className={cn("p-4 rounded-xl mb-6 flex items-start gap-3", validationResult.valid ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100")}>
                    {validationResult.valid ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
                    <div>
                      <h4 className={cn("text-[13px] font-bold", validationResult.valid ? "text-emerald-800" : "text-red-800")}>
                        {validationResult.valid ? "Validation Successful" : "Validation Failed - Missing Documents"}
                      </h4>
                      {!validationResult.valid && (
                        <ul className="mt-2 space-y-1 text-[12px] text-red-600 list-disc list-inside">
                          {validationResult.missing.map(m => <li key={m}>{m}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[13px] font-bold text-charcoal">Document Sequence</h3>
                  <span className="text-[11px] text-muted">Drag to reorder bundle sequence</span>
                </div>

                {packageSequence.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 text-gray-300">
                      <Layers className="w-8 h-8" />
                    </div>
                    <div className="text-[14px] font-bold text-gray-700 mb-1">No documents uploaded</div>
                    <div className="text-[12px] text-gray-500 max-w-sm">Upload required documents from the checklist to start building the filing package.</div>
                  </div>
                ) : (
                  <Reorder.Group axis="y" values={packageSequence} onReorder={setPackageSequence} className="space-y-2">
                    {packageSequence.map((doc, index) => (
                      <Reorder.Item 
                        key={doc.id} 
                        value={doc} 
                        className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-charcoal truncate">{doc.name}</div>
                          <div className="text-[11px] text-muted">{doc.size}</div>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}

                {generatedPdf && (
                  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="mt-8 border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center px-4 justify-between">
                      <div className="text-[12px] font-bold text-gray-600 flex items-center gap-2">
                        <FileSignature className="w-4 h-4" /> Final_Filing_Bundle.pdf
                      </div>
                      <span className="text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-500 font-mono">14 Pages • 3.2 MB</span>
                    </div>
                    <div className="h-[200px] bg-gray-200 flex items-center justify-center p-4">
                      <div className="bg-white w-[140px] h-full shadow-sm rounded flex flex-col items-center justify-center p-2 text-center border border-gray-300">
                        <div className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-2">INDEX</div>
                        <div className="w-full h-px bg-gray-200 mb-2" />
                        <div className="space-y-1 w-full px-1">
                          {packageSequence.map((d,i) => (
                            <div key={d.id} className="h-1 bg-gray-100 rounded-full w-full opacity-50" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="h-16 border-t border-gray-100 bg-white px-6 flex items-center justify-between shrink-0">
            <div>
              {generatedPdf && <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Ready for e-Filing Portal</span>}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleValidate}
                disabled={isValidating || packageSequence.length === 0}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal flex items-center gap-2 disabled:opacity-50"
              >
                {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5 text-indigo-500" />}
                Validate Package
              </button>
              
              {!generatedPdf ? (
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || packageSequence.length === 0 || !validationResult?.valid}
                  className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-2 disabled:opacity-50 text-white shadow-sm transition-all"
                  style={{ background: "linear-gradient(135deg, #4F46E5, #6366F1)" }}
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Layers className="w-3.5 h-3.5" />}
                  {isGenerating ? "Merging PDFs & Generating Index..." : "Generate Final Bundle"}
                </button>
              ) : (
                <>
                  <button className="h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-2 text-white shadow-sm transition-all"
                    style={{ background: "linear-gradient(135deg,#013B36,#02564F)" }}
                  >
                    <Download className="w-3.5 h-3.5" /> Download Bundle
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
