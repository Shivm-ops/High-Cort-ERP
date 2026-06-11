"use client";

import React, { useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, User, Briefcase, FileCheck, 
  ChevronRight, Save, Download, Gavel, FileSignature, BookOpen, AlertCircle
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import { useTemplates, useAutoFill } from "@/lib/hooks/useDrafts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useMyLetterhead } from "@/lib/hooks/useLetterhead";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import Modal from "@/components/ui/Modal";
import { generateDocx } from "@/lib/exportDocx";
import { useLanguageStore } from "@/lib/store/languageStore";

const DRAFT_CATEGORIES = [
  "Applications", "Affidavits", "Petitions", "Complaints", 
  "Replies", "Written Statements", "Notices", "Agreements", 
  "Appeals", "Vakalatnama", "Motions"
];

const LANGUAGES = ["English", "Hindi", "Marathi", "Gujarati"];

export default function DraftWorkspacePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading workspace...</div>}>
      <DraftWorkspaceContent />
    </Suspense>
  );
}

function DraftWorkspaceContent() {
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("templateId");
  
  // State for flow
  const [step, setStep] = useState<number>(1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedMatter, setSelectedMatter] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(templateIdParam ? { id: templateIdParam, title: "Pre-selected Template" } : null);
  
  React.useEffect(() => {
    if (templateIdParam && (!selectedTemplate || selectedTemplate.id !== templateIdParam)) {
      setSelectedTemplate({ id: templateIdParam, title: "Pre-selected Template" });
      setStep(1); // Reset to step 1 to force client selection
    }
  }, [templateIdParam]);

  // Editor State
  const [editorContent, setEditorContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { data: myLetterhead } = useMyLetterhead();
  const { documentLanguage } = useLanguageStore();

  const { data: clientsData, isLoading: isLoadingClients } = useClients();
  let clients = clientsData?.clients || [];

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearchQuery.replace(/[^0-9]/g, "")))
  );
  
  const { data: casesData } = useCases(selectedClient ? { client_id: selectedClient.id } : undefined);
  const cases = casesData?.cases || [];

  const { data: templatesData } = useTemplates(selectedCategory ? selectedCategory.toLowerCase().replace(" ", "_") : undefined);
  let templates = templatesData?.templates || [];
  
  const { mutate: autoFill } = useAutoFill();

  // Handle template selection and autofill
  const handleExport = () => {
    const blob = new Blob([editorContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate?.title || "Draft"}_${selectedClient?.name || "Client"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Draft exported successfully");
  };

  const handleExportDocx = async () => {
    try {
      toast.info("Generating DOCX...");
      const blob = await generateDocx(editorContent, myLetterhead || null, documentLanguage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTemplate?.title || "Draft"}_${selectedClient?.name || "Client"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("DOCX Export completed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate DOCX file");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSelectTemplate = (template: any, client?: any, matter?: any) => {
    setSelectedTemplate(template);
    
    // Simulate fetching template content from storage_url, with language localization
    let defaultContent = `BEFORE THE HON'BLE COURT\n\nCase No: {{case_number}}\n\n{{client_name}} ... Petitioner\nVs\n{{opponent_name}} ... Respondent\n\n[DRAFT CONTENT HERE]`;
    if (selectedLanguage === "Marathi") {
      defaultContent = `मा. न्यायालयासमोर\n\nप्रकरण क्रमांक: {{case_number}}\n\n{{client_name}} ... अर्जदार\nविरुद्ध\n{{opponent_name}} ... सामनेवाले\n\n[मसुद्याचा मजकूर येथे]`;
    } else if (selectedLanguage === "Hindi") {
      defaultContent = `माननीय न्यायालय के समक्ष\n\nप्रकरण संख्या: {{case_number}}\n\n{{client_name}} ... याचिकाकर्ता\nबनाम\n{{opponent_name}} ... प्रतिवादी\n\n[प्रारूप सामग्री यहाँ]`;
    } else if (selectedLanguage === "Gujarati") {
      defaultContent = `માનનીય કોર્ટ સમક્ષ\n\nકેસ નંબર: {{case_number}}\n\n{{client_name}} ... અરજદાર\nવિરુદ્ધ\n{{opponent_name}} ... સામાવાળા\n\n[ડ્રાફ્ટ સામગ્રી અહીં]`;
    }
    
    const templateContent = template.content || defaultContent;
    const activeClient = client || selectedClient;
    const activeMatter = matter !== undefined ? matter : selectedMatter;
    
    if (activeClient?.id?.startsWith("00000000")) {
      // Mock autofill
      let filled = templateContent.replace("{{client_name}}", activeClient.name || "");
      filled = filled.replace("{{case_number}}", activeMatter?.case_no || "UNFILED");
      filled = filled.replace("{{opponent_name}}", "State");
      setEditorContent(filled);
      setStep(6);
      return;
    }

    if (!activeClient) {
      toast.error("Please select a client first");
      setStep(1);
      return;
    }

    autoFill({
      template_content: templateContent,
      client_id: activeClient.id,
      case_id: activeMatter?.id
    }, {
      onSuccess: (res) => {
        setEditorContent(res.filled_content);
        setStep(6); // Editor view
      }
    });
  };

  const filteredTemplates = templates.filter(t => 
    !searchQuery || 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-workspace-bg pb-12 flex flex-col">
      <div className={cn("flex flex-col flex-1", showPrintPreview && "print:hidden")}>
        <Header title="Draft Workspace" subtitle="Matter-based document assembly and professional template library" />
        
        <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Stepper Header */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-wrap items-center gap-2 md:gap-4 text-[13px] font-medium text-gray-500">
            <div className={cn("flex items-center gap-1.5", step >= 1 ? "text-indigo-600" : "")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 1 ? "bg-indigo-600" : "bg-gray-300")}>1</span>
              Client
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <div className={cn("flex items-center gap-1.5", step >= 2 ? "text-indigo-600" : "")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 2 ? "bg-indigo-600" : "bg-gray-300")}>2</span>
              Matter
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <div className={cn("flex items-center gap-1.5", step >= 3 ? "text-indigo-600" : "")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 3 ? "bg-indigo-600" : "bg-gray-300")}>3</span>
              Category
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
            <div className={cn("flex items-center gap-1.5", step >= 5 ? "text-indigo-600" : "")}>
              <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 5 ? "bg-indigo-600" : "bg-gray-300")}>4</span>
              Template
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {step === 1 && (
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-6 h-6 text-indigo-600"/> Select Client
                  </h2>
                  <div className="relative w-full md:w-72">
                    <input
                      type="text"
                      placeholder="Search name or contact number..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl">
                      <User className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No clients found</h3>
                      <p className="text-sm text-gray-500 mb-4">No matching clients in list.</p>
                      <button onClick={() => window.location.href='/clients'} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                        Add Client
                      </button>
                    </div>
                  ) : (
                    filteredClients.map((c: any) => (
                      <button key={c.id} onClick={() => { setSelectedClient(c); setStep(2); }} className="text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors">
                        <div className="font-semibold text-gray-800">{c.name}</div>
                        <div className="text-[12px] text-gray-500 mt-1">{c.phone} | {c.city}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-900">← Back</button>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Briefcase className="w-6 h-6 text-indigo-600"/> Select Matter</h2>
                </div>
                {cases.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No matters found for this client. 
                    <button onClick={() => {
                      setSelectedMatter(null);
                      if (selectedTemplate) {
                        handleSelectTemplate(selectedTemplate, selectedClient, null);
                      } else {
                        setStep(3);
                      }
                    }} className="text-indigo-600 font-medium ml-1 hover:underline">Draft without matter →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cases.map((c: any) => (
                      <button key={c.id} onClick={() => { 
                        setSelectedMatter(c); 
                        if (selectedTemplate) {
                          handleSelectTemplate(selectedTemplate, selectedClient, c);
                        } else {
                          setStep(3); 
                        }
                      }} className="text-left p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{c.case_no || "Unfiled"}</span>
                          <span className="text-[11px] text-gray-500">{c.court || "Any Court"}</span>
                        </div>
                        <div className="font-semibold text-gray-800">{c.title}</div>
                        <div className="text-[12px] text-gray-500 mt-1">{c.practice_area}</div>
                      </button>
                    ))}
                    <button onClick={() => { 
                      setSelectedMatter(null); 
                      if (selectedTemplate) {
                        handleSelectTemplate(selectedTemplate, selectedClient, null);
                      } else {
                        setStep(3); 
                      }
                    }} className="text-left p-4 rounded-xl border border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors flex items-center justify-center text-gray-500 font-medium">
                      Proceed without specific matter
                    </button>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep(2)} className="text-sm font-medium text-gray-500 hover:text-gray-900">← Back</button>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><FileText className="w-6 h-6 text-indigo-600"/> Select Draft Category</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {DRAFT_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => { setSelectedCategory(cat); setStep(4); }} className="p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center font-medium text-gray-700">
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep(3)} className="text-sm font-medium text-gray-500 hover:text-gray-900">← Back</button>
                  <h2 className="text-xl font-bold text-gray-800">Select Language</h2>
                </div>
                <div className="flex flex-wrap gap-4">
                  {LANGUAGES.map(lang => (
                    <button key={lang} onClick={() => { setSelectedLanguage(lang); setStep(5); }} className={cn("px-6 py-3 rounded-xl border font-medium transition-colors", selectedLanguage === lang ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300")}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep(4)} className="text-sm font-medium text-gray-500 hover:text-gray-900">← Back</button>
                    <h2 className="text-xl font-bold text-gray-800">Select Draft Template</h2>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search templates..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-indigo-500 w-64"
                    />
                  </div>
                </div>
                
                {filteredTemplates.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No templates found for {selectedCategory} in {selectedLanguage}.</p>
                    <button onClick={() => handleSelectTemplate({ title: `Blank ${selectedCategory}`, content: "" })} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded-lg">Start from blank</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTemplates.map((t: any) => (
                      <div key={t.id} className="p-4 rounded-xl border border-gray-200 hover:border-indigo-300 bg-white transition-colors flex flex-col">
                        <div className="font-bold text-gray-800 mb-1">{t.title}</div>
                        <div className="flex gap-2 mb-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 font-medium">{t.language || selectedLanguage}</span>
                          <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-600 font-medium">{t.practice_area || "General"}</span>
                        </div>
                        <div className="mt-auto flex justify-end">
                          <button onClick={() => handleSelectTemplate(t)} className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium rounded-lg transition-colors">
                            Use Template
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 6 && (
              <div className="flex flex-col h-full bg-gray-50">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-800">{selectedTemplate?.title || "New Draft"}</span>
                    <span className="text-[12px] text-gray-500">Matter: {selectedMatter?.title || "None"} • Client: {selectedClient?.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => {toast.success("Draft Saved to Matter"); setStep(1);}} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                      <Save className="w-4 h-4" /> Save to Matter
                    </button>
                    <div className="relative group">
                      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                        <Download className="w-4 h-4" /> Export
                      </button>
                      <div className="absolute right-0 top-10 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 hidden group-hover:block z-10 text-left">
                        <button onClick={handleExport} className="w-full text-left px-4 py-2 text-[12px] text-charcoal hover:bg-gray-50 flex items-center gap-2">Export as Plain Text</button>
                        <button onClick={handleExportDocx} className="w-full text-left px-4 py-2 text-[12px] text-charcoal hover:bg-gray-50 flex items-center gap-2">Export as DOCX</button>
                      </div>
                    </div>
                    <button onClick={() => setShowPrintPreview(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                      <FileCheck className="w-4 h-4" /> Preview & Print
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-6 flex justify-center overflow-y-auto">
                  <div className="w-full max-w-[800px] bg-white border border-gray-200 shadow-sm min-h-[800px] p-12">
                    <textarea 
                      className="w-full h-full resize-none outline-none font-serif text-gray-800 leading-relaxed text-[15px]" 
                      value={editorContent}
                      onChange={(e) => setEditorContent(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Panels (Only show during workflow or editor) */}
        <AnimatePresence>
          {step >= 2 && step <= 6 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full xl:w-80 flex flex-col gap-6"
            >
              {/* Context Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Workspace Context</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <User className="w-4 h-4 text-indigo-500" /> {selectedClient?.name || "-"}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <Briefcase className="w-4 h-4 text-emerald-500" /> {selectedMatter?.case_no || "Unfiled Matter"}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <FileSignature className="w-4 h-4 text-amber-500" /> {selectedCategory || "-"}
                  </div>
                </div>
              </div>

              {/* Required Documents Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> Required Documents
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Aadhaar Copy
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> PAN Card
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Opponent Notice
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Previous Order
                  </label>
                </div>
                <div className="mt-3 text-[11px] text-amber-600 bg-amber-50 p-2 rounded flex gap-1.5 items-start">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Ensures complete filing based on {selectedCategory || "this"} requirements.
                </div>
              </div>

              {/* Applicable Sections Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Gavel className="w-4 h-4 text-indigo-600" /> Applicable Sections
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[12px] font-medium border border-gray-200">NI Act S.138</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[12px] font-medium border border-gray-200">NI Act S.142</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[12px] font-medium border border-gray-200">BNS S.316</span>
                </div>
              </div>

              {/* Suggested Drafts */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-blue-600" /> Suggested Next Drafts
                </h3>
                <div className="flex flex-col gap-2">
                  <button className="text-left text-[13px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-between group">
                    Vakalatnama <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="text-left text-[13px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-between group">
                    List of Documents <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button className="text-left text-[13px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-between group">
                    Affidavit in Evidence <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </div>

      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex bg-gray-500/80 items-center justify-center p-6 print:p-0 print:bg-white print:block">
          <div className="bg-gray-100 rounded-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:w-full print:max-h-none print:shadow-none print:bg-white print:rounded-none">
            
            {/* Modal Header (Hidden when printing) */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center print:hidden">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Letterhead Print Preview
              </h2>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowSettingsModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 shadow-sm">
                  Configure Letterhead
                </button>
                <button onClick={handlePrint} className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
                  <Download className="w-4 h-4"/> Print / Save PDF
                </button>
                <button onClick={() => setShowPrintPreview(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500">
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible relative">
              <LetterheadPreview 
                letterhead={myLetterhead || null} 
                content={editorContent} 
                onConfigure={() => setShowSettingsModal(true)}
              />
            </div>
            
          </div>
        </div>
      )}

      {/* Inline Letterhead Settings Modal */}
      <Modal open={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Configure Letterhead" size="lg">
        <LetterheadSettings />
      </Modal>

    </div>
  );
}
