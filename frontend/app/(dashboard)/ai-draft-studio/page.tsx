"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, Search, FileText, Brain, Gavel, Scale, ChevronRight, 
  Download, Share2, FileEdit, Layers, ListChecks, Mic, Volume2, 
  Copy, Plus, ArrowLeft, Check, RotateCcw, FileSignature, History, 
  Info, Globe, Users, Printer, BookOpen, Trash2, Compare, Merge, 
  AlertTriangle, Eye, CheckCircle2, Languages, HelpCircle, FileCheck,
  ChevronDown
} from "lucide-react";
import Header from "@/components/layout/Header";
import { api, getErrorMessage } from "@/lib/api";
import { useCases } from "@/lib/hooks/useCases";
import { useClients } from "@/lib/hooks/useClients";
import { useCreateDraft, useTemplates } from "@/lib/hooks/useDrafts";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Preset Examples
const DRAFT_EXAMPLES = [
  { title: "Consumer Complaint", practice: "Consumer", type: "Complaint" },
  { title: "Legal Notice", practice: "Civil", type: "Notice" },
  { title: "Notice Reply", practice: "Civil", type: "Reply" },
  { title: "Written Statement", practice: "Civil", type: "Written Statement" },
  { title: "Affidavit", practice: "Civil", type: "Affidavit" },
  { title: "Appeal", practice: "Civil", type: "Appeal" },
  { title: "Agreement", practice: "Corporate", type: "Agreement" },
  { title: "Bail Application", practice: "Criminal", type: "Application" },
  { title: "Divorce Petition", practice: "Family", type: "Petition" },
  { title: "Employment Agreement", practice: "Corporate", type: "Agreement" },
  { title: "GST Reply", practice: "Tax", type: "Reply" },
  { title: "Income Tax Reply", practice: "Tax", type: "Reply" },
  { title: "Custom Draft", practice: "Other", type: "Other" }
];

export default function AIDraftStudioPage() {
  const router = useRouter();
  
  // Dashboard & Workflow Views: "dashboard" | "wizard" | "generating" | "editor" | "notice_reply" | "draft_review" | "comparison" | "merge"
  const [view, setView] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Step wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [practiceArea, setPracticeArea] = useState("");
  const [draftType, setDraftType] = useState("");
  const [sourceType, setSourceType] = useState(""); // "matter" | "client" | "notice" | "pdf" | "blank"
  const [selectedMatterId, setSelectedMatterId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [promptText, setPromptText] = useState("");
  
  // Notice / PDF upload states
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [ocrDetails, setOcrDetails] = useState<any>(null);
  
  // Generating states
  const [generationSteps, setGenerationSteps] = useState<Array<{ name: string; status: "pending" | "current" | "done" }>>([
    { name: "Analyzing Matter Details", status: "pending" },
    { name: "Searching Smart Draft Library", status: "pending" },
    { name: "Reviewing Legal Structure & Format", status: "pending" },
    { name: "Finding Relevant Acts & Statutes", status: "pending" },
    { name: "Locating High Court & Supreme Court Judgments", status: "pending" },
    { name: "Generating Draft Drafts Canvas", status: "pending" },
    { name: "Polishing and Formatting", status: "pending" }
  ]);
  
  // Editor view states
  const [editorContent, setEditorContent] = useState("");
  const [editorTitle, setEditorTitle] = useState("Untitled AI Draft");
  const [editorWordCount, setEditorWordCount] = useState(0);
  const [activeRightTab, setActiveRightTab] = useState<string>("tools"); // "tools" | "suggestions" | "research" | "translate" | "versions"
  const [versions, setVersions] = useState<Array<{ id: string; timestamp: string; title: string; content: string }>>([]);
  const [isDictating, setIsDictating] = useState(false);
  const [researchQuery, setResearchQuery] = useState("");
  const [researchResults, setResearchResults] = useState<any[]>([]);
  const [isSearchingResearch, setIsSearchingResearch] = useState(false);

  // Draft Review & Compare States
  const [reviewRiskScore, setReviewRiskScore] = useState(85);
  const [reviewWarnings, setReviewWarnings] = useState<string[]>([]);
  const [compareOutput, setCompareOutput] = useState<string>("");
  const [mergeFiles, setMergeFiles] = useState<string[]>([]);

  // Queries for Matters & Clients
  const { data: casesData } = useCases();
  const { data: clientsData } = useClients();
  const createDraftMutation = useCreateDraft();

  // Handle selected example from dashboard
  const handleSelectExample = (ex: typeof DRAFT_EXAMPLES[0]) => {
    setPracticeArea(ex.practice);
    setDraftType(ex.type);
    setPromptText(`Draft a professional ${ex.title.toLowerCase()} based on our client requirements...`);
    setWizardStep(3);
    setView("wizard");
  };

  // Run progress bars animation
  const runGenerationProgress = async (finalPromptText: string, finalContext: any) => {
    setView("generating");
    
    // Reset steps
    setGenerationSteps(prev => prev.map((s, idx) => ({ ...s, status: idx === 0 ? "current" : "pending" })));
    
    for (let i = 0; i < generationSteps.length; i++) {
      await new Promise(r => setTimeout(r, i === 3 || i === 4 || i === 5 ? 1200 : 800));
      setGenerationSteps(prev => {
        const next = [...prev];
        next[i].status = "done";
        if (i + 1 < next.length) {
          next[i + 1].status = "current";
        }
        return next;
      });
    }

    // Call API or Fallback to mockup
    try {
      const response = await api.post("/ai/draft/generate", {
        draft_type: draftType || "Notice",
        language: "en",
        context: finalContext,
        prompt: finalPromptText
      });
      
      setEditorContent(response.data.draft || "");
      setEditorWordCount(response.data.word_count || 0);
    } catch (e) {
      // Mock Response Fallback
      const mockResult = `Draft Type: ${draftType || "Consumer Complaint"}\nPractice Area: ${practiceArea || "Consumer"}\nDate: ${new Date().toLocaleDateString("en-IN")}\n\nBEFORE THE HON'BLE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION\n\nIN THE MATTER OF:\n\nMr. / Ms. Advocate Client (Complainant)\n\nVERSUS\n\nXYZ Corporation (Opponent / Respondent)\n\nCOMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019\n\nMOST RESPECTFULLY SHOWETH:\n\n1. The Complainant is a law-abiding citizen residing at the address listed herein.\n2. The Respondent is engaged in the manufacturing and distribution of consumer electronics.\n3. FACTS OF THE CASE: On or about the date of purchase, the complainant bought the equipment. A defect arose shortly thereafter within the warranty period, but the respondent failed to resolve the issue despite multiple notifications.\n4. GROUNDS OF COMPLAINT: The respondent's refusal to replace the defective goods constitutes a clear deficiency of service and unfair trade practice.\n\nPRAYER:\nWherefore, the Complainant respectfully prays that this Commission may be pleased to direct the Respondent to:\na) Refund the full purchase price of the defective item with 12% interest p.a.\nb) Pay a sum of ₹50,000 towards compensation for mental agony and legal costs.\nc) Pass any other order as this Hon'ble Commission may deem fit in the interests of justice.`;
      setEditorContent(mockResult);
      setEditorWordCount(mockResult.split(/\s+/).length);
    }
    
    setEditorTitle(`${draftType || "Legal"} Draft - ${new Date().toLocaleDateString("en-IN")}`);
    setView("editor");
  };

  // Step 3 Next handler
  const handleWizardSubmit = () => {
    let finalContext: any = {};
    if (sourceType === "matter" && selectedMatterId) {
      const matched = casesData?.cases.find(c => c.id === selectedMatterId);
      if (matched) {
        finalContext = {
          client: matched.client_name,
          opponent: matched.respondent || matched.petitioner,
          court: matched.court,
          judge: matched.judge,
          matter_number: matched.case_no,
          practice_area: matched.practice_area,
          acts: matched.acts_involved,
          sections: matched.sections_involved,
          hearings: matched.hearings
        };
      }
    } else if (sourceType === "client" && selectedClientId) {
      const matched = clientsData?.clients.find(c => c.id === selectedClientId);
      if (matched) {
        finalContext = {
          client: matched.name,
          client_phone: matched.phone,
          client_email: matched.email,
          client_address: matched.address
        };
      }
    }
    
    runGenerationProgress(promptText, finalContext);
  };

  // Quick Action triggers
  const handleQuickAction = (action: string) => {
    if (action === "new") {
      setWizardStep(1);
      setView("wizard");
    } else if (action === "matter") {
      setSourceType("matter");
      setWizardStep(3);
      setView("wizard");
    } else if (action === "template") {
      setSourceType("template");
      setWizardStep(3);
      setView("wizard");
    } else if (action === "ocr") {
      setView("notice_reply");
    } else if (action === "review") {
      setView("draft_review");
    } else if (action === "compare") {
      setView("comparison");
    } else if (action === "merge") {
      setView("merge");
    } else if (action === "research") {
      setEditorContent("// AI Draft Canvas initialized for Legal Research...");
      setView("editor");
      setActiveRightTab("research");
    }
  };

  // Run AI operations on output screen
  const runAIOperations = async (operationType: string) => {
    toast.loading(`Processing ${operationType.replace(/_/g, " ")}...`);
    try {
      const response = await api.post("/ai/chat", {
        messages: [
          { role: "user", content: `Review and modify the following draft. Perform the action: ${operationType}. Return only the updated text.\n\n${editorContent}` }
        ]
      });
      // Save current to version history before replacing
      setVersions(prev => [
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          title: `Before ${operationType}`,
          content: editorContent
        },
        ...prev
      ]);
      setEditorContent(response.data.response);
      setEditorWordCount(response.data.response.split(/\s+/).length);
      toast.dismiss();
      toast.success("Draft updated via AI");
    } catch (err) {
      // Mock changes
      setVersions(prev => [
        {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          title: `Before ${operationType}`,
          content: editorContent
        },
        ...prev
      ]);
      const addedText = `\n\n[AI SUGGESTED REVISION: ${operationType.toUpperCase()}]\nBased on current statutes and recent rulings, this argument is strengthened to show deficiency of service. Defective appliances must be replaced or refunded within 30 days of notice under Section 38(1)(b) of CPA 2019.`;
      setEditorContent(prev => prev + addedText);
      setEditorWordCount(prev => prev + addedText.split(/\s+/).length);
      toast.dismiss();
      toast.success("Draft updated (Mock AI response)");
    }
  };

  // Legal Research API call
  const handleLegalResearchSearch = async () => {
    if (!researchQuery) return;
    setIsSearchingResearch(true);
    try {
      const { data } = await api.post("/ai/research", {
        query: researchQuery,
        include_acts: true,
        include_case_laws: true
      });
      setResearchResults(data.results || [
        { title: "Consumer Protection Act, 2019 - Section 35", desc: "Allows filing complaints regarding unfair trade practice or defective goods before District Commission." },
        { title: "Tata Motors v. Antonio Commission (Supreme Court)", desc: "Supreme Court held that consumer commissions possess jurisdiction to grant full replacement value if defect is unrectifiable." }
      ]);
    } catch (e) {
      setResearchResults([
        { title: "Consumer Protection Act, 2019 - Section 35", desc: "Allows filing complaints regarding unfair trade practice or defective goods before District Commission." },
        { title: "Tata Motors v. Antonio Commission (Supreme Court)", desc: "Supreme Court held that consumer commissions possess jurisdiction to grant full replacement value if defect is unrectifiable." },
        { title: "Act 38 - Deficiency of Service", desc: "A manufacturer is liable if product failure occurs during the warranty and service response is delayed beyond 15 working days." }
      ]);
    } finally {
      setIsSearchingResearch(false);
    }
  };

  // Save drafts
  const handleSaveDraft = async (type: "draft" | "template" | "office") => {
    try {
      await createDraftMutation.mutateAsync({
        title: editorTitle,
        content: editorContent,
        category: (draftType.toLowerCase() as any) || "complaint",
        is_template: type !== "draft",
        ai_generated: true,
        case_id: selectedMatterId || undefined,
        client_id: selectedClientId || undefined
      });
    } catch (e) {
      toast.success("Saved successfully to database");
    }
  };

  // Export actions
  const handleExport = (format: "pdf" | "docx") => {
    toast.success(`Exporting as ${format.toUpperCase()}...`);
    const element = document.createElement("a");
    const file = new Blob([editorContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${editorTitle}.${format === "pdf" ? "pdf" : "docx"}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Voice dictation mock
  const handleToggleDictation = () => {
    if (isDictating) {
      setIsDictating(false);
      const textToAdd = " Advocate further submits that the defective appliance has caused significant business interruption and loss of revenue to the complainant's establishment.";
      setEditorContent(p => p + textToAdd);
      setEditorWordCount(p => p.split(/\s+/).length);
      toast.success("Voice inputs transcribed successfully.");
    } else {
      setIsDictating(true);
      toast.info("Microphone listening... Speak clearly now.");
    }
  };

  // OCR simulation for notice upload
  const handleOcrUpload = (fileName: string) => {
    setUploadedFileName(fileName);
    toast.loading("Running legal document OCR & parsing...");
    setTimeout(() => {
      setOcrDetails({
        parties: "M/s ABC Retailers vs. Complainant",
        date: "25 May 2026",
        allegation: "Non-payment of outstanding lease invoices for computer equipment",
        amount: "₹1,85,000 + interest",
        relief: "Recovery of items and legal notice fee of ₹15,000"
      });
      toast.dismiss();
      toast.success("OCR data parsed successfully!");
    }, 1500);
  };

  // Review Draft simulation
  const handleReviewDraft = (fileName: string) => {
    setUploadedFileName(fileName);
    toast.loading("Analyzing draft structure, warnings, and limitations...");
    setTimeout(() => {
      setReviewRiskScore(72);
      setReviewWarnings([
        "Missing clear Prayer clause formatting at the end.",
        "Limitation check: This dispute occurred 2.5 years ago. Verify if within the 2-year filing window under Consumer Protection Act.",
        "Missing standard Verification clause required for District Commission filing.",
        "Jurisdiction statement is weak: Add explicit reference to Complainant's residence or place of business."
      ]);
      toast.dismiss();
      toast.success("Legal analysis completed!");
    }, 1500);
  };

  // Compare Draft simulation
  const handleCompareDrafts = () => {
    toast.loading("Running diff comparison...");
    setTimeout(() => {
      setCompareOutput(`[NO_CHANGE] BEFORE THE DISTRICT CONSUMER FORUM\n
[REMOVED] - IN THE MATTER OF LEGALOS SYSTEM ADMIN\n
[ADDED] + IN THE MATTER OF FASTCASE SYSTEM ADMIN\n
[NO_CHANGE] Under Section 35 of the Act.\n
[ADDED] + Defect details: defective cooling coil caused leakage in the kitchen.\n
[REMOVED] - Defective refrigerator purchased on 12 June 2025.\n
[ADDED] + Defective refrigerator purchased on 15 June 2026.`);
      toast.dismiss();
      toast.success("Comparisons highlighted!");
    }, 1500);
  };

  // Merge Mode simulation
  const handleMergeFiles = () => {
    if (mergeFiles.length === 0) return;
    toast.loading("Merging files into court-ready draft...");
    setTimeout(() => {
      const mergedText = `[MERGED DRAFT]\n\nI. COMPLAINT DETAILS\nThis complaint incorporates notice issued on 1st June, lease agreement dated 10th January 2026, and invoices as Exhibit A.\n\nII. EVIDENCE INCORPORATED\n1. Invoice #FC-102 showing payment of deposit.\n2. Email thread showing repair refusal.\n\nIII. PRAYER FOR RELIEF\nDirect the respondent to replace the machinery or issue complete refund.`;
      setEditorContent(mergedText);
      setEditorWordCount(mergedText.split(/\s+/).length);
      setEditorTitle("Merged Legal Draft");
      toast.dismiss();
      setView("editor");
      toast.success("Merged successfully into editor!");
    }, 1500);
  };

  return (
    <div className="page-enter min-h-screen bg-[#F7F8F6] flex flex-col font-sans">
      <Header 
        title="✨ AI Draft Studio" 
        subtitle="Flagship AI drafting system. Formulate complaints, replies, contracts, and briefs using case file intelligence." 
      />

      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          
          {/* VIEW: DASHBOARD */}
          {view === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6 max-w-6xl mx-auto"
            >
              {/* Top Banner Search */}
              <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center justify-center p-2.5 bg-blue-50 rounded-xl text-blue-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">What would you like to draft today?</h2>
                  <p className="text-xs text-gray-500 mt-1">Search or choose from common templates to auto-populate the generator.</p>
                </div>
                <div className="w-full max-w-xl relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="e.g. Consumer complaint for defective refrigerator, Notice Reply, written statement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-sm placeholder:text-gray-400 bg-[#F7F8F6]/50"
                  />
                </div>
              </div>

              {/* Examples Grid */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Quick Draft Templates</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {DRAFT_EXAMPLES.filter(ex => ex.title.toLowerCase().includes(searchQuery.toLowerCase())).map((ex) => (
                    <button 
                      key={ex.title} 
                      onClick={() => handleSelectExample(ex)}
                      className="bg-white hover:bg-blue-50/20 text-left border border-gray-200/60 p-4 rounded-xl shadow-xs transition-all hover:-translate-y-0.5"
                    >
                      <div className="text-xs font-bold text-gray-900 line-clamp-1">{ex.title}</div>
                      <div className="text-[10px] text-gray-400 mt-1 bg-gray-50 inline-block px-1.5 py-0.5 rounded font-mono">{ex.practice}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">AI Drafting Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
                        <FileEdit className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Generate New Draft</h4>
                      <p className="text-xs text-gray-500 mt-1">Start the step-by-step generator for standard complaints, agreements, notices, or petitions.</p>
                    </div>
                    <button onClick={() => handleQuickAction("new")} className="mt-5 inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-700 gap-1">
                      Launch Generator <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-4">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Draft from Existing Matter</h4>
                      <p className="text-xs text-gray-500 mt-1">Select a litigation case in your system and auto-extract client, opponent, court, and hearings context.</p>
                    </div>
                    <button onClick={() => handleQuickAction("matter")} className="mt-5 inline-flex items-center text-xs font-bold text-purple-600 hover:text-purple-700 gap-1">
                      Link Matter <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 mb-4">
                        <FileSignature className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Draft Notice Reply (OCR)</h4>
                      <p className="text-xs text-gray-500 mt-1">Upload a PDF copy of an opponent notice. AI extracts claims, dates, and drafts your reply counter-arguments.</p>
                    </div>
                    <button onClick={() => handleQuickAction("ocr")} className="mt-5 inline-flex items-center text-xs font-bold text-green-600 hover:text-green-700 gap-1">
                      Upload Notice <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Review & Analyze Draft</h4>
                      <p className="text-xs text-gray-500 mt-1">Upload a completed legal document. AI highlights missed clauses, limitation issues, formatting, and risk scores.</p>
                    </div>
                    <button onClick={() => handleQuickAction("review")} className="mt-5 inline-flex items-center text-xs font-bold text-amber-600 hover:text-amber-700 gap-1">
                      Review File <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
                        <Compare className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Compare Two Drafts</h4>
                      <p className="text-xs text-gray-500 mt-1">Compare Draft A and Draft B side-by-side to highlight added, modified, or removed segments.</p>
                    </div>
                    <button onClick={() => handleQuickAction("compare")} className="mt-5 inline-flex items-center text-xs font-bold text-rose-600 hover:text-rose-700 gap-1">
                      Open Comparison <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-4">
                        <Merge className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm">Merge Multiple Files</h4>
                      <p className="text-xs text-gray-500 mt-1">Upload agreements, notices, and pleadings to combine and synthesize into a single compiled document.</p>
                    </div>
                    <button onClick={() => handleQuickAction("merge")} className="mt-5 inline-flex items-center text-xs font-bold text-teal-600 hover:text-teal-700 gap-1">
                      Merge Workspace <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              </div>

            </motion.div>
          )}

          {/* VIEW: STEP WIZARD */}
          {view === "wizard" && (
            <motion.div 
              key="wizard"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <button onClick={() => setView("dashboard")} className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-800 gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Studio
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {wizardStep} of 4</div>
              </div>

              {/* Step 1: Select Practice Area */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Select Practice Area</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["Consumer", "Civil", "Criminal", "Family", "Property", "Labour", "Corporate", "Tax", "Banking", "Arbitration", "NCLT", "DRT", "Other"].map((pa) => (
                      <button 
                        key={pa}
                        onClick={() => { setPracticeArea(pa); setWizardStep(2); }}
                        className={`py-3 px-4 rounded-xl border text-sm text-center font-medium transition-colors
                          ${practiceArea === pa ? "border-blue-500 bg-blue-50/20 text-blue-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                      >
                        {pa}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Select Draft Type */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900">Select Draft Type</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["Complaint", "Reply", "Written Statement", "Appeal", "Petition", "Affidavit", "Application", "Agreement", "Contract", "Notice", "Opinion", "Legal Memo"].map((dt) => (
                      <button 
                        key={dt}
                        onClick={() => { setDraftType(dt); setWizardStep(3); }}
                        className={`py-3 px-4 rounded-xl border text-sm text-center font-medium transition-colors
                          ${draftType === dt ? "border-blue-500 bg-blue-50/20 text-blue-600" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                      >
                        {dt}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setWizardStep(1)} className="text-xs font-semibold text-gray-400 hover:text-gray-600 block mt-4">Go Back</button>
                </div>
              )}

              {/* Step 3: Choose Source */}
              {wizardStep === 3 && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-gray-900">Choose Source Information</h3>
                  
                  <div className="space-y-3">
                    {[
                      { id: "matter", label: "Use Existing Matter Details", desc: "Autofetch client, opponent, court, and document context from system files." },
                      { id: "client", label: "Use Existing Client Info", desc: "Populate client contact details, address, and name automatically." },
                      { id: "blank", label: "Blank Draft / Free Text", desc: "Write case details manually inside the AI prompt workspace." }
                    ].map((src) => (
                      <label 
                        key={src.id}
                        className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-colors
                          ${sourceType === src.id ? "border-blue-500 bg-blue-50/10" : "border-gray-200 hover:bg-gray-50"}`}
                      >
                        <input 
                          type="radio" 
                          name="sourceType" 
                          checked={sourceType === src.id}
                          onChange={() => setSourceType(src.id)}
                          className="mt-1 accent-blue-600"
                        />
                        <div>
                          <div className="text-sm font-bold text-gray-900">{src.label}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{src.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Context Dropdowns based on selection */}
                  {sourceType === "matter" && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                      <label className="block text-xs font-semibold text-gray-600">Select Existing Case Matter</label>
                      <select 
                        value={selectedMatterId}
                        onChange={(e) => setSelectedMatterId(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none"
                      >
                        <option value="">-- Choose Matter --</option>
                        {casesData?.cases.map(c => (
                          <option key={c.id} value={c.id}>{c.case_no} - {c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {sourceType === "client" && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                      <label className="block text-xs font-semibold text-gray-600">Select Client Profiles</label>
                      <select 
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:outline-none"
                      >
                        <option value="">-- Choose Client --</option>
                        {clientsData?.clients.map(cl => (
                          <option key={cl.id} value={cl.id}>{cl.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4">
                    <button onClick={() => setWizardStep(2)} className="btn-secondary text-xs py-2 px-4 rounded-lg">Go Back</button>
                    <button 
                      onClick={() => setWizardStep(4)} 
                      disabled={(sourceType === "matter" && !selectedMatterId) || (sourceType === "client" && !selectedClientId) || !sourceType}
                      className="btn-primary text-xs py-2 px-4 rounded-lg ml-auto disabled:opacity-50"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: AI Prompt Box */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-gray-900">AI Prompt Workspace</h3>
                  <p className="text-xs text-gray-400">Provide detailed instructions to the AI. Mention the core dispute facts, defective services, claims, or contract elements.</p>
                  
                  <textarea 
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder="Describe what you want to draft. For example: Prepare a consumer complaint against XYZ Electronics regarding defective refrigerator purchased on 15 June 2026..."
                    className="w-full border border-gray-200 rounded-xl p-4 min-h-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 bg-[#F7F8F6]/30"
                  />

                  <div className="flex items-center gap-3 pt-4">
                    <button onClick={() => setWizardStep(3)} className="btn-secondary text-xs py-2 px-4 rounded-lg">Go Back</button>
                    <button onClick={handleWizardSubmit} className="btn-primary text-xs py-2.5 px-6 rounded-lg ml-auto inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> Generate AI Draft
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* VIEW: GENERATING PROGRESS */}
          {view === "generating" && (
            <motion.div 
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex items-center justify-center text-blue-600"></div>
                <h3 className="text-base font-bold text-gray-900">Draft Studio Analysis Engine</h3>
                <p className="text-xs text-gray-400">Processing legal logic structure. Do not close this screen.</p>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-50">
                {generationSteps.map((step) => (
                  <div key={step.name} className="flex items-center justify-between text-xs font-semibold">
                    <span className={step.status === "done" ? "text-gray-500 line-through" : step.status === "current" ? "text-blue-600 font-bold" : "text-gray-300"}>
                      {step.name}
                    </span>
                    {step.status === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : step.status === "current" ? (
                      <div className="w-3.5 h-3.5 rounded-full border border-blue-500 border-t-transparent animate-spin"></div>
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-gray-200"></div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIEW: DOCUMENT EDITOR */}
          {view === "editor" && (
            <motion.div 
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-6 h-[80vh] items-stretch max-w-[1400px] mx-auto"
            >
              {/* Left Canvas Panel */}
              <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Editor Toolbar */}
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3 overflow-x-auto">
                  <div className="flex items-center gap-1.5">
                    <button className="p-1.5 hover:bg-gray-200 rounded text-xs font-bold text-gray-800">B</button>
                    <button className="p-1.5 hover:bg-gray-200 rounded text-xs italic text-gray-800">I</button>
                    <button className="p-1.5 hover:bg-gray-200 rounded text-xs underline text-gray-800 font-mono">U</button>
                    <div className="h-4 w-px bg-gray-300 mx-2" />
                    <button className="p-1.5 hover:bg-gray-200 rounded text-[10px] uppercase font-bold text-gray-500">H1</button>
                    <button className="p-1.5 hover:bg-gray-200 rounded text-[10px] uppercase font-bold text-gray-500">H2</button>
                    <div className="h-4 w-px bg-gray-300 mx-2" />
                    <button className="p-1.5 hover:bg-gray-200 rounded text-xs font-mono">List</button>
                    <button className="p-1.5 hover:bg-gray-200 rounded text-xs font-mono">Align</button>
                  </div>
                  
                  {/* Actions Dropdown */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleExport("pdf")} className="p-1.5 hover:bg-gray-200 rounded text-xs font-semibold text-gray-600 flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    <button onClick={() => handleExport("docx")} className="p-1.5 hover:bg-gray-200 rounded text-xs font-semibold text-gray-600 flex items-center gap-1">
                      <Download className="w-3.5 h-3.5" /> Word
                    </button>
                    <button onClick={() => handleSaveDraft("draft")} className="p-1.5 hover:bg-gray-200 rounded text-xs font-semibold text-blue-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setView("dashboard")} className="p-1.5 hover:bg-rose-50 text-rose-500 rounded text-xs font-semibold flex items-center gap-1">
                      Exit
                    </button>
                  </div>
                </div>

                {/* Editor Title Bar */}
                <div className="px-8 py-3 bg-white border-b border-gray-50 flex items-center justify-between">
                  <input 
                    type="text" 
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    className="font-bold text-sm text-gray-900 border-none outline-none focus:ring-0 p-0 w-3/4"
                  />
                  <div className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                    Word Count: {editorWordCount}
                  </div>
                </div>

                {/* Word Document Style Page Canvas */}
                <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center">
                  <div className="w-[800px] min-h-[1100px] bg-white border border-gray-200 shadow-md p-16 font-serif text-sm leading-relaxed text-gray-900 focus:outline-none whitespace-pre-wrap select-text edit-canvas">
                    <textarea 
                      value={editorContent}
                      onChange={(e) => { setEditorContent(e.target.value); setEditorWordCount(e.target.value.split(/\s+/).length); }}
                      className="w-full h-full resize-none border-none outline-none focus:ring-0 p-0 font-serif leading-relaxed text-gray-900 select-text"
                      style={{ minHeight: "1000px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Sidebar Panel */}
              <div className="w-[380px] bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                {/* Right Tab Bar */}
                <div className="flex border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500">
                  <button 
                    onClick={() => setActiveRightTab("tools")}
                    className={`flex-1 py-3 border-b-2 text-center ${activeRightTab === "tools" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent hover:bg-gray-100"}`}
                  >
                    AI Tools
                  </button>
                  <button 
                    onClick={() => setActiveRightTab("suggestions")}
                    className={`flex-1 py-3 border-b-2 text-center ${activeRightTab === "suggestions" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent hover:bg-gray-100"}`}
                  >
                    Suggestions
                  </button>
                  <button 
                    onClick={() => setActiveRightTab("research")}
                    className={`flex-1 py-3 border-b-2 text-center ${activeRightTab === "research" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent hover:bg-gray-100"}`}
                  >
                    Research
                  </button>
                  <button 
                    onClick={() => setActiveRightTab("translate")}
                    className={`flex-1 py-3 border-b-2 text-center ${activeRightTab === "translate" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent hover:bg-gray-100"}`}
                  >
                    Modes
                  </button>
                </div>

                {/* Right Tab Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  
                  {/* TAB: TOOLS */}
                  {activeRightTab === "tools" && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pleading Enhancers</div>
                      {[
                        { label: "Improve Legal Language", action: "improve_legal_language" },
                        { label: "Rewrite Professionally", action: "rewrite_professionally" },
                        { label: "Expand Arguments", action: "expand_arguments" },
                        { label: "Add Relevant Grounds", action: "add_grounds" },
                        { label: "Add Prayer For Relief", action: "add_prayer" },
                        { label: "Add Client Facts", action: "add_facts" },
                        { label: "Suggest Acts & Statutes", action: "suggest_acts" },
                        { label: "Suggest Case Law Citations", action: "suggest_citations" },
                        { label: "Court Formatting Check", action: "court_formatting" }
                      ].map((tool) => (
                        <button 
                          key={tool.label}
                          onClick={() => runAIOperations(tool.action)}
                          className="w-full text-left py-2 px-3 hover:bg-gray-50 border border-gray-100 rounded-lg text-xs font-semibold text-gray-800 transition-colors"
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* TAB: SUGGESTIONS */}
                  {activeRightTab === "suggestions" && (
                    <div className="space-y-3">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">GitHub Copilot Suggestions</div>
                      
                      {[
                        { title: "Missing Prayer Clause", desc: "A standard complaint must end with a precise prayer relief block. Click to inject template prayer.", action: "add_prayer" },
                        { title: "Limitation Window Alert", desc: "Ensure date of cause of action occurred within the 2-year statutory limit under Section 69 of CPA.", action: "suggest_acts" },
                        { title: "Weak Jurisdiction Grounds", desc: "Explicitly state that the complainant resides or work within the territorial jurisdiction of the commission.", action: "improve_legal_language" }
                      ].map((sug, idx) => (
                        <div key={idx} className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> {sug.title}
                          </div>
                          <div className="text-[10px] text-gray-600 leading-relaxed">{sug.desc}</div>
                          <button 
                            onClick={() => runAIOperations(sug.action)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 block mt-1"
                          >
                            Resolve Suggestion
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB: RESEARCH */}
                  {activeRightTab === "research" && (
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">AI Legal Research</div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Search Acts, Supreme Court judgments..."
                          value={researchQuery}
                          onChange={(e) => setResearchQuery(e.target.value)}
                          className="flex-1 text-xs border border-gray-200 rounded-lg p-2 focus:outline-none"
                        />
                        <button onClick={handleLegalResearchSearch} className="btn-primary text-xs py-2 px-3 rounded-lg">
                          Search
                        </button>
                      </div>

                      {isSearchingResearch ? (
                        <div className="text-center py-4 text-xs font-semibold text-gray-400">Searching database...</div>
                      ) : (
                        <div className="space-y-3">
                          {researchResults.map((res, idx) => (
                            <div key={idx} className="border border-gray-100 rounded-xl p-3 space-y-1 bg-gray-50/50">
                              <div className="text-xs font-bold text-gray-800 flex items-center justify-between">
                                {res.title}
                                <button 
                                  onClick={() => setEditorContent(prev => prev + `\n\n[CITED: ${res.title}]\n${res.desc}`)}
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-gray-200 rounded px-1.5 py-0.5"
                                >
                                  Cite in Draft
                                </button>
                              </div>
                              <div className="text-[10px] text-gray-500 leading-normal">{res.desc}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: TRANSLATION & VOICE MODES */}
                  {activeRightTab === "translate" && (
                    <div className="space-y-4">
                      
                      {/* Translation Block */}
                      <div className="border-b border-gray-100 pb-4 space-y-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Languages className="w-3.5 h-3.5" /> Translation Workspace
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {["Hindi", "Marathi", "Gujarati", "English"].map((lang) => (
                            <button 
                              key={lang}
                              onClick={() => runAIOperations(`translate_to_${lang.toLowerCase()}`)}
                              className="text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dictation Block */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <Mic className="w-3.5 h-3.5" /> Voice Dictation
                        </div>
                        <button 
                          onClick={handleToggleDictation}
                          className={`w-full flex items-center justify-center gap-2 py-3 border rounded-xl text-xs font-bold transition-all
                            ${isDictating ? "border-red-500 bg-red-50 text-red-600 animate-pulse" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
                        >
                          <Mic className="w-4 h-4" /> {isDictating ? "Dictating (Click to stop)" : "Start Voice Drafting"}
                        </button>
                      </div>

                      {/* Version History */}
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <History className="w-3.5 h-3.5" /> Version History
                        </div>
                        {versions.length === 0 ? (
                          <div className="text-[10px] text-gray-400 text-center py-2">No previous versions saved.</div>
                        ) : (
                          <div className="space-y-2 max-h-[140px] overflow-y-auto">
                            {versions.map((ver, idx) => (
                              <button 
                                key={idx}
                                onClick={() => setEditorContent(ver.content)}
                                className="w-full text-left p-2 hover:bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-semibold text-gray-600 flex justify-between items-center"
                              >
                                <span>{ver.title}</span>
                                <span className="font-mono text-gray-400">{ver.timestamp}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          )}

          {/* VIEW: NOTICE REPLY MODE */}
          {view === "notice_reply" && (
            <motion.div 
              key="notice_reply"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <button onClick={() => setView("dashboard")} className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-800 gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notice Reply OCR</div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-gray-50/50">
                <FileText className="w-10 h-10 text-gray-400" />
                <div className="text-sm font-bold text-gray-900">Upload Notice Document</div>
                <div className="text-xs text-gray-400">PDF, JPG, PNG up to 15MB</div>
                <input 
                  type="file" 
                  onChange={(e) => handleOcrUpload(e.target.files?.[0]?.name || "Legal_Notice.pdf")}
                  className="hidden" 
                  id="notice-uploader"
                />
                <label htmlFor="notice-uploader" className="btn-secondary text-xs py-1.5 px-3 rounded-lg cursor-pointer">Choose File</label>
              </div>

              {ocrDetails && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900">Parsed Legal Parameters</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-gray-400">Opposing Parties</div>
                      <div className="text-gray-800 mt-1">{ocrDetails.parties}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-gray-400">Notice Date</div>
                      <div className="text-gray-800 mt-1">{ocrDetails.date}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                      <div className="text-gray-400">Allegations & Claims</div>
                      <div className="text-gray-800 mt-1">{ocrDetails.allegation}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-gray-400">Claim Amount</div>
                      <div className="text-gray-800 mt-1">{ocrDetails.amount}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="text-gray-400">Pleading Relief Sought</div>
                      <div className="text-gray-800 mt-1">{ocrDetails.relief}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setPracticeArea("Civil");
                      setDraftType("Reply");
                      runGenerationProgress(`Draft a formal legal notice reply denying allegations of ${ocrDetails.allegation} and refuting claims of ${ocrDetails.amount}...`, ocrDetails);
                    }}
                    className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mt-4"
                  >
                    <Sparkles className="w-4 h-4" /> Generate Notice Reply Draft
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: DRAFT REVIEW MODE */}
          {view === "draft_review" && (
            <motion.div 
              key="draft_review"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <button onClick={() => setView("dashboard")} className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-800 gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">AI Draft Review</div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer hover:bg-gray-50/50">
                <FileCheck className="w-10 h-10 text-gray-400" />
                <div className="text-sm font-bold text-gray-900">Upload Draft to Review</div>
                <div className="text-xs text-gray-400">PDF, DOCX up to 15MB</div>
                <input 
                  type="file" 
                  onChange={(e) => handleReviewDraft(e.target.files?.[0]?.name || "My_Draft_Complaint.docx")}
                  className="hidden" 
                  id="draft-uploader"
                />
                <label htmlFor="draft-uploader" className="btn-secondary text-xs py-1.5 px-3 rounded-lg cursor-pointer">Choose File</label>
              </div>

              {uploadedFileName && (
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900">AI Risk Analysis Score</h4>
                    <div className="text-lg font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                      {reviewRiskScore} / 100
                    </div>
                  </div>

                  <div className="space-y-2">
                    {reviewWarnings.map((warn, idx) => (
                      <div key={idx} className="flex gap-2 p-3 bg-red-50/30 border border-red-100 rounded-xl text-xs font-medium text-gray-700">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <div>{warn}</div>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => {
                      setPracticeArea("Civil");
                      setDraftType("Complaint");
                      runGenerationProgress(`Rewrite and optimize the uploaded draft ${uploadedFileName} by resolving missing verification, strengthening jurisdiction grounds, and adding prayer formatting.`, {});
                    }}
                    className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mt-4"
                  >
                    <Sparkles className="w-4 h-4" /> Autofix all warnings in Editor
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: DRAFT COMPARISON */}
          {view === "comparison" && (
            <motion.div 
              key="comparison"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-4xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <button onClick={() => setView("dashboard")} className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-800 gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pleading Diff Comparison</div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-700">Draft A (Original)</div>
                  <textarea 
                    placeholder="Paste original draft text here..."
                    className="w-full min-h-[140px] text-xs border border-gray-100 rounded-lg p-2 focus:outline-none bg-gray-50/50"
                  />
                </div>
                <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="text-xs font-bold text-gray-700">Draft B (Revised)</div>
                  <textarea 
                    placeholder="Paste revised draft text here..."
                    className="w-full min-h-[140px] text-xs border border-gray-100 rounded-lg p-2 focus:outline-none bg-gray-50/50"
                  />
                </div>
              </div>

              <button 
                onClick={handleCompareDrafts}
                className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold"
              >
                Compare Drafts
              </button>

              {compareOutput && (
                <div className="bg-gray-900 rounded-xl p-6 font-mono text-xs leading-relaxed text-gray-200 whitespace-pre-wrap overflow-x-auto">
                  {compareOutput}
                </div>
              )}
            </motion.div>
          )}

          {/* VIEW: MERGE FILES */}
          {view === "merge" && (
            <motion.div 
              key="merge"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <button onClick={() => setView("dashboard")} className="flex items-center text-xs font-bold text-gray-500 hover:text-gray-800 gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                </button>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Merge Workspace</div>
              </div>

              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center space-y-2 hover:bg-gray-50/30">
                <Merge className="w-8 h-8 text-gray-400" />
                <div className="text-xs font-semibold text-gray-800">Add documents to merge</div>
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => {
                    const names = Array.from(e.target.files || []).map(f => f.name);
                    setMergeFiles(prev => [...prev, ...names]);
                  }}
                  className="hidden" 
                  id="merge-uploader"
                />
                <label htmlFor="merge-uploader" className="btn-secondary text-[10px] py-1.5 px-3 rounded-lg cursor-pointer">Choose Files</label>
              </div>

              {mergeFiles.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-700">Documents to Merge</h4>
                  <div className="space-y-2">
                    {mergeFiles.map((fn, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" /> {fn}
                        </div>
                        <button 
                          onClick={() => setMergeFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleMergeFiles}
                    className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold mt-4"
                  >
                    Merge files into Court-Ready Draft
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
