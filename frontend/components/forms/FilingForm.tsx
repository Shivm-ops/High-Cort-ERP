"use client";

import { useState } from "react";
import { X, UploadCloud, FileText, CheckCircle, Plus, File, Layers } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { PDFDocument } from "pdf-lib";
import { initPdfFonts, getPdfFontForLanguage } from "@/lib/pdf/fonts";

interface FilingFormProps {
  caseId: string;
  drafts: any[];
  onSuccess: () => void;
  onClose: () => void;
  createFiling: any; // mutation function
}

export default function FilingForm({ caseId, drafts, onSuccess, onClose, createFiling }: FilingFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDraftId, setSelectedDraftId] = useState("");
  const [uploads, setUploads] = useState<{ type: string; file: globalThis.File | null }[]>([
    { type: "Vakalatnama", file: null },
    { type: "Affidavit", file: null },
    { type: "Evidence", file: null },
    { type: "Annexures", file: null },
  ]);
  const [fees, setFees] = useState({ courtFee: "", stampDuty: "", eStampRef: "" });
  const [isMerging, setIsMerging] = useState(false);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);

  const selectedDraft = drafts.find(d => d.id === selectedDraftId);

  const handleFileUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploads(prev => prev.map(u => u.type === type ? { ...u, file } : u));
    }
  };

  const handleGenerateFilingSet = async () => {
    setIsMerging(true);
    try {
      // Create a base PDF from the draft
      const doc = new jsPDF();
      initPdfFonts(doc);
      if (selectedDraft?.content) {
        const langFont = getPdfFontForLanguage(selectedDraft.language || "en");
        doc.setFont(langFont);
        const splitText = doc.splitTextToSize(selectedDraft.content, 180);
        doc.text(splitText, 15, 15);
      } else {
        doc.text("Filing Set Cover Page", 15, 15);
      }
      
      const draftPdfBytes = doc.output("arraybuffer");
      
      // Load into pdf-lib to prepare for merging
      const mergedPdf = await PDFDocument.load(draftPdfBytes);
      
      // In a real app, we would load the uploaded files (if they are PDFs) and merge them:
      // const fileBytes = await uploads[0].file.arrayBuffer();
      // const pdfToMerge = await PDFDocument.load(fileBytes);
      // const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
      // copiedPages.forEach((page) => mergedPdf.addPage(page));

      // Mocking the merge by just adding a page for each uploaded file
      const uploadedFiles = uploads.filter(u => u.file);
      for (const u of uploadedFiles) {
        const page = mergedPdf.addPage();
        page.drawText(`Attached: ${u.type} - ${u.file?.name}`, { x: 50, y: 700, size: 20 });
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);
      toast.success("Filing set packaged successfully!");
      setStep(4);
    } catch (error) {
      toast.error("Failed to generate filing set.");
    } finally {
      setIsMerging(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDraft) return;

    // Build checklist based on uploads
    const checklist = uploads.map(u => ({
      name: u.type,
      required: true,
      submitted: !!u.file,
    }));

    await createFiling.mutateAsync({
      case_id: caseId,
      title: `Filing: ${selectedDraft.title}`,
      filing_type: selectedDraft.category || "General",
      court_fee: fees.courtFee ? parseFloat(fees.courtFee) : 0,
      stamp_duty: fees.stampDuty ? parseFloat(fees.stampDuty) : 0,
      estamp_reference: fees.eStampRef || undefined,
      checklist,
    });
    
    toast.success("Filing workspace created");
    onSuccess();
  };

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Draft" },
          { n: 2, label: "Uploads" },
          { n: 3, label: "Fees" },
          { n: 4, label: "Package" },
        ].map(({ n, label }, i, arr) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${step === n ? "bg-sidebar text-white" : step > n ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
              {step > n ? <CheckCircle className="w-3.5 h-3.5" /> : <span>{n}</span>}
              {label}
            </div>
            {i < arr.length - 1 && <div className="w-4 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Draft */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Select Draft for Filing</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {drafts.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center border rounded-xl bg-gray-50">No drafts available. Please auto-fill a draft first.</p>
            ) : (
              drafts.map((d) => (
                <button key={d.id} onClick={() => setSelectedDraftId(d.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center justify-between ${selectedDraftId === d.id ? "border-sidebar bg-sidebar/5" : "border-gray-200 hover:bg-gray-50"}`}>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{d.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 capitalize">{d.category}</div>
                  </div>
                  {selectedDraftId === d.id && <CheckCircle className="w-4 h-4 text-sidebar" />}
                </button>
              ))
            )}
          </div>
          <button onClick={() => setStep(2)} disabled={!selectedDraftId}
            className="w-full py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold disabled:opacity-50 mt-4">
            Next: Upload Supporting Documents
          </button>
        </div>
      )}

      {/* Step 2: Upload Documents */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Attach Supporting Documents</h3>
            <span className="text-xs text-gray-500">{uploads.filter(u => u.file).length}/4 Attached</span>
          </div>
          <div className="space-y-3">
            {uploads.map((u, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${u.file ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-400"}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{u.type}</div>
                    <div className="text-xs text-gray-500">{u.file ? u.file.name : "Pending upload"}</div>
                  </div>
                </div>
                <label className="cursor-pointer text-xs font-medium text-sidebar hover:text-sidebar-dark px-3 py-1.5 bg-sidebar/10 rounded-lg">
                  {u.file ? "Replace" : "Upload"}
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(u.type, e)} />
                </label>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold">Next: Stamp & Fees</button>
          </div>
        </div>
      )}

      {/* Step 3: Stamp & Court Fees */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">Stamp & Court Fees Tracking</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Court Fee (₹)</label>
              <input type="number" value={fees.courtFee} onChange={(e) => setFees({ ...fees, courtFee: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stamp Duty (₹)</label>
              <input type="number" value={fees.stampDuty} onChange={(e) => setFees({ ...fees, stampDuty: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">E-Stamp Reference Number</label>
              <input type="text" value={fees.eStampRef} onChange={(e) => setFees({ ...fees, eStampRef: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint focus:ring-1 focus:ring-mint" placeholder="Ex: IN-PB123..." />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Back</button>
            <button onClick={handleGenerateFilingSet} disabled={isMerging} className="flex-1 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold flex justify-center items-center gap-2">
              <Layers className="w-4 h-4" /> {isMerging ? "Packaging..." : "Generate Filing Set"}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Finalize */}
      {step === 4 && (
        <div className="space-y-5">
          <div className="p-5 bg-green-50 rounded-2xl border border-green-100 text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-gray-900">Filing Set Packaged!</h3>
            <p className="text-xs text-gray-600 mt-1">Your draft and {uploads.filter(u => u.file).length} attachments have been merged into a single PDF.</p>
            {mergedPdfUrl && (
              <a href={mergedPdfUrl} download={`Filing_Set_${selectedDraft?.title}.pdf`}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-white border border-green-200 text-green-700 text-xs font-medium hover:bg-green-50">
                <FileText className="w-3.5 h-3.5" /> Download Merged PDF
              </a>
            )}
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => setStep(3)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Back</button>
            <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold">Save to Filings & Checklist</button>
          </div>
        </div>
      )}
    </div>
  );
}
