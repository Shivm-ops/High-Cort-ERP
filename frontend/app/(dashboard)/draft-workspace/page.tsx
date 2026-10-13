"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Search, User, Briefcase, FileCheck, 
  ChevronRight, Save, Download, Gavel, FileSignature, BookOpen, AlertCircle,
  Copy, Printer, ArrowLeft, Pencil, CheckCircle2, Clock, Loader2, Plus
} from "lucide-react";
import Header from "@/components/layout/Header";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import { 
  useTemplates, 
  useAutoFill, 
  useDraft, 
  useCreateDraft, 
  useUpdateDraft, 
  useCopyDraft 
} from "@/lib/hooks/useDrafts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { useMyLetterhead } from "@/lib/hooks/useLetterhead";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import Modal from "@/components/ui/Modal";
import { generateDocx } from "@/lib/exportDocx";
import { useLanguageStore } from "@/lib/store/languageStore";

const DRAFT_CATEGORIES = [
  { key: "application", label: "Applications" },
  { key: "affidavit", label: "Affidavits" },
  { key: "petition", label: "Petitions" },
  { key: "complaint", label: "Complaints" },
  { key: "reply", label: "Replies" },
  { key: "written_statement", label: "Written Statements" },
  { key: "notice", label: "Notices" },
  { key: "agreement", label: "Agreements" },
  { key: "appeal", label: "Appeals" },
  { key: "vakalatnama", label: "Vakalatnama" },
  { key: "motion", label: "Motions" },
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draftId");
  const templateIdParam = searchParams.get("templateId");
  const clientIdParam = searchParams.get("clientId");
  const matterIdParam = searchParams.get("matterId") || searchParams.get("caseId");

  // Workflow step state (1: Client, 2: Matter, 3: Category, 4: Language, 5: Template, 6: Editor)
  const [step, setStep] = useState<number>(draftIdParam ? 6 : 1);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedMatter, setSelectedMatter] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("application");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  // Editor and Persistence State
  const [activeDraftId, setActiveDraftId] = useState<string | null>(draftIdParam);
  const [draftTitle, setDraftTitle] = useState<string>("New Legal Draft");
  const [draftVersion, setDraftVersion] = useState<number>(1);
  const [editorContent, setEditorContent] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState(false);
  const [saveAsTitle, setSaveAsTitle] = useState("");

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const { data: myLetterhead } = useMyLetterhead();
  const { documentLanguage } = useLanguageStore();

  // Queries & Mutations
  const { data: clientsData, isLoading: isLoadingClients } = useClients();
  const clients = clientsData?.clients || [];

  const filteredClients = clients.filter((c: any) =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearchQuery.replace(/[^0-9]/g, "")))
  );

  const { data: casesData } = useCases(selectedClient ? { client_id: selectedClient.id } : undefined);
  const cases = casesData?.cases || [];

  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({
    category: selectedCategory,
    language: selectedLanguage,
  });
  const templates = templatesData?.templates || [];

  // Existing draft query (when reopening saved draft)
  const { data: loadedDraft, isLoading: isLoadingDraft } = useDraft(draftIdParam || "");

  const { mutate: autoFill, isPending: isAutoFilling } = useAutoFill();
  const createDraftMutation = useCreateDraft();
  const updateDraftMutation = useUpdateDraft();
  const copyDraftMutation = useCopyDraft();

  // Load existing draft if draftId is in query params
  useEffect(() => {
    if (loadedDraft && draftIdParam) {
      setActiveDraftId(loadedDraft.id);
      setDraftTitle(loadedDraft.title);
      setEditorContent(loadedDraft.content || "");
      setDraftVersion(loadedDraft.version || 1);
      setSelectedCategory(loadedDraft.category || "application");
      setSelectedLanguage(loadedDraft.language || "English");
      setSaveStatus("saved");

      if (loadedDraft.client_id) {
        setSelectedClient({
          id: loadedDraft.client_id,
          name: loadedDraft.client_name || "Linked Client",
        });
      }
      if (loadedDraft.case_id) {
        setSelectedMatter({
          id: loadedDraft.case_id,
          case_no: loadedDraft.case_number || "Linked Matter",
          title: loadedDraft.case_title || "Linked Matter",
        });
      }
      setStep(6);
    }
  }, [loadedDraft, draftIdParam]);

  // Handle client pre-selection from URL
  useEffect(() => {
    if (clientIdParam && clients.length > 0 && !selectedClient && !draftIdParam) {
      const match = clients.find((c: any) => c.id === clientIdParam);
      if (match) {
        setSelectedClient(match);
        setStep(2);
      }
    }
  }, [clientIdParam, clients, selectedClient, draftIdParam]);

  // Handle matter pre-selection from URL
  useEffect(() => {
    if (matterIdParam && cases.length > 0 && !selectedMatter && !draftIdParam) {
      const match = cases.find((c: any) => c.id === matterIdParam);
      if (match) {
        setSelectedMatter(match);
        setStep(3);
      }
    }
  }, [matterIdParam, cases, selectedMatter, draftIdParam]);

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (saveStatus === "unsaved") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveStatus]);

  // Content change handler
  const handleContentChange = (val: string) => {
    setEditorContent(val);
    setSaveStatus("unsaved");
  };

  // Handle template selection and autofill
  const handleSelectTemplate = (template: any, client?: any, matter?: any) => {
    setSelectedTemplate(template);
    const activeClient = client || selectedClient;
    const activeMatter = matter !== undefined ? matter : selectedMatter;

    const baseTitle = template.title || `${selectedCategory} Draft`;
    const defaultTitle = activeClient?.name ? `${baseTitle} - ${activeClient.name}` : baseTitle;
    setDraftTitle(defaultTitle);

    let templateContent = template.content;
    if (!templateContent) {
      if (selectedLanguage === "Marathi") {
        templateContent = `मा. न्यायालयासमोर\n\nप्रकरण क्रमांक: {{case_number}}\n\n{{client_name}} ... अर्जदार\nविरुद्ध\n{{opponent_name}} ... सामनेवाले\n\nविषय: ${template.title || "अर्जी"}\n\nसस्नेह जयहिंद,\n\nसदर अर्जीद्वारे खालीलप्रमाणे सविनय सादर करण्यात येत आहे:\n\n१. अर्जदार {{client_name}} हे ...\n२. सदर प्रकरणात ...\n\nम्हणून प्रार्थना आहे की:\n(अ) अर्जदाराची विनंती मान्य करावी.\n\nठिकाण: Kolhapur\nदिनांक: ${new Date().toLocaleDateString("en-IN")}\n\nअर्जदार / वकील`;
      } else if (selectedLanguage === "Hindi") {
        templateContent = `माननीय न्यायालय के समक्ष\n\nप्रकरण संख्या: {{case_number}}\n\n{{client_name}} ... याचिकाकर्ता\nबनाम\n{{opponent_name}} ... प्रतिवादी\n\nविषय: ${template.title || "प्रार्थना पत्र"}\n\nमान्यवर महोदय,\n\nयाचिकाकर्ता की ओर से विनम्र निवेदन निम्नवत है:\n\n१. यह कि प्रार्थी {{client_name}} ...\n२. यह कि ...\n\nअतः श्रीमान जी से विनम्र प्रार्थना है कि:\n(क) प्रार्थी का प्रार्थना पत्र स्वीकार फरमाया जावे।\n\nस्थान:\nदिनांक: ${new Date().toLocaleDateString("en-IN")}\n\nप्रार्थी / अधिवक्ता`;
      } else {
        templateContent = `BEFORE THE HON'BLE COURT\n\nCase No: {{case_number}}\n\n{{client_name}} ... Petitioner/Applicant\nVs\n{{opponent_name}} ... Respondent\n\nAPPLICATION FOR ${template.title?.toUpperCase() || "RELIEF"}\n\nMOST RESPECTFULLY SHOWETH:\n\n1. That the Applicant {{client_name}} is a resident of {{client_address}}.\n2. That the present matter is pending before this Hon'ble Court.\n3. That the Applicant submits that ...\n\nPRAYER:\nWherefore it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:\n(a) Allow the present application;\n(b) Pass such other and further orders as deemed fit and proper.\n\nDate: ${new Date().toLocaleDateString("en-IN")}\nPlace:\n\nFiled by:\nAdvocate for Applicant`;
      }
    }

    if (!activeClient) {
      setEditorContent(templateContent);
      setStep(6);
      setSaveStatus("unsaved");
      return;
    }

    // Call autofill API
    autoFill(
      {
        template_content: templateContent,
        client_id: activeClient.id,
        case_id: activeMatter?.id || undefined,
      },
      {
        onSuccess: (res) => {
          setEditorContent(res.filled_content);
          setStep(6);
          setSaveStatus("unsaved");
          toast.success("Template autofilled with client details");
        },
        onError: () => {
          // Fallback simple replacement if autofill API fails
          let filled = templateContent.replace(/\{\{client_name\}\}/g, activeClient.name || "");
          filled = filled.replace(/\{\{case_number\}\}/g, activeMatter?.case_no || "UNFILED");
          filled = filled.replace(/\{\{opponent_name\}\}/g, activeMatter?.respondent || "State / Opponent");
          setEditorContent(filled);
          setStep(6);
          setSaveStatus("unsaved");
        },
      }
    );
  };

  // Save changes to current draft (or create if new)
  const handleSaveDraft = async () => {
    try {
      setSaveStatus("saving");
      if (activeDraftId) {
        // Update existing draft
        const res = await updateDraftMutation.mutateAsync({
          id: activeDraftId,
          title: draftTitle,
          content: editorContent,
          client_id: selectedClient?.id,
          case_id: selectedMatter?.id,
          category: selectedCategory,
          language: selectedLanguage,
        });
        setDraftVersion(res.version);
        setSaveStatus("saved");
        toast.success("Draft updated successfully");
      } else {
        // Create new draft
        const res = await createDraftMutation.mutateAsync({
          title: draftTitle,
          content: editorContent,
          category: selectedCategory,
          language: selectedLanguage,
          client_id: selectedClient?.id,
          case_id: selectedMatter?.id,
          status: "draft",
        });
        setActiveDraftId(res.id);
        setDraftVersion(res.version);
        setSaveStatus("saved");
        toast.success("Draft created and saved to database");
        // Update URL quietly so subsequent reloads/saves stay on this draft
        window.history.replaceState(null, "", `/draft-workspace?draftId=${res.id}`);
      }
    } catch (error) {
      setSaveStatus("unsaved");
      console.error(error);
      toast.error("Failed to save draft. Please verify connection and try again.");
    }
  };

  // Save As (Duplicate draft)
  const handleSaveAs = async () => {
    const newTitle = saveAsTitle.trim() || `${draftTitle} (Copy)`;
    setShowSaveAsModal(false);
    try {
      setSaveStatus("saving");
      const res = await createDraftMutation.mutateAsync({
        title: newTitle,
        content: editorContent,
        category: selectedCategory,
        language: selectedLanguage,
        client_id: selectedClient?.id,
        case_id: selectedMatter?.id,
        status: "draft",
      });
      setActiveDraftId(res.id);
      setDraftTitle(res.title);
      setDraftVersion(res.version);
      setSaveStatus("saved");
      window.history.replaceState(null, "", `/draft-workspace?draftId=${res.id}`);
      toast.success(`Draft saved as separate copy: "${res.title}"`);
    } catch (error) {
      setSaveStatus("unsaved");
      toast.error("Failed to create copy");
    }
  };

  // Export handlers
  const handleExportText = () => {
    const blob = new Blob([editorContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draftTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Exported as Plain Text");
  };

  const handleExportDocx = async () => {
    try {
      toast.info("Generating professional DOCX file...");
      const blob = await generateDocx(editorContent, myLetterhead || null, documentLanguage);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${draftTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;
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

  // Reset workflow to create a completely new draft
  const handleStartNew = () => {
    if (saveStatus === "unsaved") {
      if (!confirm("You have unsaved changes. Are you sure you want to start a new draft?")) {
        return;
      }
    }
    setActiveDraftId(null);
    setDraftTitle("New Legal Draft");
    setEditorContent("");
    setSelectedClient(null);
    setSelectedMatter(null);
    setSelectedTemplate(null);
    setStep(1);
    window.history.replaceState(null, "", "/draft-workspace");
  };

  const filteredTemplates = templates.filter((t: any) => 
    !searchQuery || 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-workspace-bg pb-12 flex flex-col">
      <div className={cn("flex flex-col flex-1", showPrintPreview && "print:hidden")}>
        <Header 
          title="Draft Workspace" 
          subtitle="Matter-based document assembly and professional template library" 
        />
        
        <div className="flex-1 p-6 flex flex-col xl:flex-row gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col gap-6">
          
          {/* Stepper Header (Only shown when not in editor step, or subtle during editor) */}
          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-[13px] font-medium text-gray-500">
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => setStep(1)} 
                className={cn("flex items-center gap-1.5 transition-colors", step >= 1 ? "text-indigo-600 font-semibold" : "")}
              >
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 1 ? "bg-indigo-600" : "bg-gray-300")}>1</span>
                Client
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <button 
                onClick={() => selectedClient && setStep(2)} 
                disabled={!selectedClient}
                className={cn("flex items-center gap-1.5 transition-colors", step >= 2 ? "text-indigo-600 font-semibold" : "opacity-60")}
              >
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 2 ? "bg-indigo-600" : "bg-gray-300")}>2</span>
                Matter
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <button 
                onClick={() => setStep(3)} 
                className={cn("flex items-center gap-1.5 transition-colors", step >= 3 ? "text-indigo-600 font-semibold" : "opacity-60")}
              >
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 3 ? "bg-indigo-600" : "bg-gray-300")}>3</span>
                Category
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <button 
                onClick={() => setStep(5)} 
                className={cn("flex items-center gap-1.5 transition-colors", step >= 5 ? "text-indigo-600 font-semibold" : "opacity-60")}
              >
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step >= 5 ? "bg-indigo-600" : "bg-gray-300")}>4</span>
                Template
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300" />
              <button 
                onClick={() => (editorContent || activeDraftId) && setStep(6)} 
                className={cn("flex items-center gap-1.5 transition-colors", step === 6 ? "text-indigo-600 font-semibold" : "opacity-60")}
              >
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] text-white", step === 6 ? "bg-indigo-600" : "bg-gray-300")}>5</span>
                Editor
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/draft-library")}
                className="text-xs font-semibold text-gray-600 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" /> All Drafts &amp; Templates
              </button>
              {step === 6 && (
                <button
                  onClick={handleStartNew}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> New Draft Flow
                </button>
              )}
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden min-h-[600px]">
            
            {/* STEP 1: SELECT CLIENT */}
            {step === 1 && (
              <div className="p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <User className="w-6 h-6 text-indigo-600"/> Select Client
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      Choose an existing client or draft without linking to any client.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
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
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Option to draft without client */}
                  <button 
                    onClick={() => { setSelectedClient(null); setSelectedMatter(null); setStep(3); }}
                    className="text-left p-4 rounded-xl border border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors flex flex-col justify-center"
                  >
                    <div className="font-semibold text-indigo-700 flex items-center gap-1.5">
                      Draft without client <ChevronRight className="w-4 h-4" />
                    </div>
                    <div className="text-[12px] text-gray-500 mt-1">Start a standalone pleading or generic contract</div>
                  </button>

                  {filteredClients.length === 0 ? (
                    <div className="col-span-2 py-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                      <User className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">No matching clients</h3>
                      <p className="text-xs text-gray-500 mb-3">Add a client first or draft without linking.</p>
                      <button onClick={() => router.push("/clients")} className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                        Add New Client
                      </button>
                    </div>
                  ) : (
                    filteredClients.map((c: any) => (
                      <button 
                        key={c.id} 
                        onClick={() => { setSelectedClient(c); setStep(2); }} 
                        className={cn(
                          "text-left p-4 rounded-xl border transition-all flex flex-col justify-between group",
                          selectedClient?.id === c.id ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
                        )}
                      >
                        <div className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{c.name}</div>
                        <div className="text-[12px] text-gray-500 mt-1">{c.phone || "No phone"} {c.city ? `• ${c.city}` : ""}</div>
                        <div className="text-[11px] text-gray-400 mt-2 uppercase tracking-wider">{c.type || "Client"}</div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: SELECT MATTER */}
            {step === 2 && (
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Back to Clients
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-indigo-600"/> Select Matter / Case
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Client: <strong className="text-gray-800">{selectedClient?.name}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {cases.length === 0 ? (
                  <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 max-w-xl mx-auto">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 mb-1">No active matters found for this client</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      You can proceed with an unlinked draft now, or create a new matter in Case Management.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button 
                        onClick={() => {
                          setSelectedMatter(null);
                          if (selectedTemplate) {
                            handleSelectTemplate(selectedTemplate, selectedClient, null);
                          } else {
                            setStep(3);
                          }
                        }} 
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Draft without matter →
                      </button>
                      <button 
                        onClick={() => router.push(`/cases?clientId=${selectedClient?.id}`)}
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Create Matter in Case Management
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cases.map((c: any) => (
                      <button 
                        key={c.id} 
                        onClick={() => { 
                          setSelectedMatter(c); 
                          if (selectedTemplate) {
                            handleSelectTemplate(selectedTemplate, selectedClient, c);
                          } else {
                            setStep(3); 
                          }
                        }} 
                        className={cn(
                          "text-left p-4 rounded-xl border transition-all group",
                          selectedMatter?.id === c.id ? "border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            {c.case_no || "Unfiled"}
                          </span>
                          <span className="text-[11px] text-gray-500 font-medium">{c.court || "District Court"}</span>
                        </div>
                        <div className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{c.title}</div>
                        <div className="text-[12px] text-gray-500 mt-1">{c.practice_area || "General Litigation"}</div>
                      </button>
                    ))}
                    
                    <button 
                      onClick={() => { 
                        setSelectedMatter(null); 
                        if (selectedTemplate) {
                          handleSelectTemplate(selectedTemplate, selectedClient, null);
                        } else {
                          setStep(3); 
                        }
                      }} 
                      className="text-left p-4 rounded-xl border border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/40 transition-colors flex flex-col justify-center text-center"
                    >
                      <span className="font-semibold text-indigo-700">Proceed without specific matter →</span>
                      <span className="text-[12px] text-gray-500 mt-1">Save draft under client without linking to a case number</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SELECT CATEGORY */}
            {step === 3 && (
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep(selectedClient ? 2 : 1)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                      <FileText className="w-6 h-6 text-indigo-600"/> Select Draft Category
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Select legal drafting category to browse verified templates
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {DRAFT_CATEGORIES.map(cat => (
                    <button 
                      key={cat.key} 
                      onClick={() => { setSelectedCategory(cat.key); setStep(4); }} 
                      className={cn(
                        "p-5 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-2 group",
                        selectedCategory === cat.key ? "border-indigo-600 bg-indigo-50/70 font-bold text-indigo-700" : "border-gray-200 hover:border-indigo-400 hover:bg-gray-50 text-gray-700"
                      )}
                    >
                      <FileSignature className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-sm">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: SELECT LANGUAGE */}
            {step === 4 && (
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <button onClick={() => setStep(3)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to Categories
                  </button>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Select Document Language</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Category: <strong className="capitalize text-gray-800">{selectedCategory.replace("_", " ")}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                  {LANGUAGES.map(lang => (
                    <button 
                      key={lang} 
                      onClick={() => { setSelectedLanguage(lang); setStep(5); }} 
                      className={cn(
                        "p-5 rounded-2xl border text-center transition-all flex flex-col items-center gap-2",
                        selectedLanguage === lang 
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20" 
                          : "bg-white text-gray-800 border-gray-200 hover:border-indigo-400 hover:bg-gray-50"
                      )}
                    >
                      <span className="text-2xl">{lang === "English" ? "🇬🇧" : "🇮🇳"}</span>
                      <span className="font-bold text-base">{lang}</span>
                      <span className={cn("text-xs", selectedLanguage === lang ? "text-indigo-100" : "text-gray-400")}>
                        {lang === "Marathi" ? "मराठी प्रारूप" : lang === "Hindi" ? "हिन्दी प्रारूप" : lang === "Gujarati" ? "ગુજરાતી ડ્રાફ્ટ" : "Court Pleadings"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: SELECT TEMPLATE */}
            {step === 5 && (
              <div className="p-8 flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setStep(4)} className="text-sm font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Select Draft Template</h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Category: <strong className="capitalize text-gray-700">{selectedCategory.replace("_", " ")}</strong> • Language: <strong className="text-gray-700">{selectedLanguage}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search templates..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                {isLoadingTemplates ? (
                  <div className="py-16 text-center text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-sm font-medium">Loading templates...</p>
                  </div>
                ) : filteredTemplates.length === 0 ? (
                  <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 max-w-lg mx-auto">
                    <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-gray-800 mb-1">
                      No templates found for {selectedCategory.replace("_", " ")} in {selectedLanguage}
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">
                      You can start immediately from a clean blank document, or switch language to see English templates.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button 
                        onClick={() => handleSelectTemplate({ title: `Blank ${selectedCategory.replace("_", " ")}`, content: "" })} 
                        className="px-4 py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Start with Blank Document
                      </button>
                      {selectedLanguage !== "English" && (
                        <button 
                          onClick={() => setSelectedLanguage("English")} 
                          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          View English Templates
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredTemplates.map((t: any) => (
                      <div 
                        key={t.id} 
                        className="p-5 rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md bg-white transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-bold text-gray-900 text-[15px]">{t.title}</span>
                            <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100 shrink-0">
                              {t.language || selectedLanguage}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 text-gray-600 font-medium">
                              {t.practice_area || "General Law"}
                            </span>
                            {t.court_type && (
                              <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-50 text-emerald-700 font-medium">
                                {t.court_type}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] text-gray-400">Verified master template</span>
                          <button 
                            disabled={isAutoFilling}
                            onClick={() => handleSelectTemplate(t)} 
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                          >
                            {isAutoFilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                            Use Template
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: DOCUMENT EDITOR */}
            {step === 6 && (
              <div className="flex flex-col h-full bg-gray-50 flex-1">
                {/* Editor Top Bar */}
                <div className="flex flex-wrap items-center justify-between p-4 border-b border-gray-200 bg-white gap-3">
                  <div className="flex flex-col flex-1 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      {isEditingTitle ? (
                        <input
                          type="text"
                          value={draftTitle}
                          onChange={(e) => { setDraftTitle(e.target.value); setSaveStatus("unsaved"); }}
                          onBlur={() => setIsEditingTitle(false)}
                          onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                          autoFocus
                          className="font-bold text-gray-900 text-base border-b border-indigo-600 outline-none pb-0.5 bg-transparent"
                        />
                      ) : (
                        <span 
                          onClick={() => setIsEditingTitle(true)}
                          className="font-bold text-gray-900 text-base cursor-pointer hover:text-indigo-600 flex items-center gap-1.5 group"
                          title="Click to rename draft"
                        >
                          {draftTitle}
                          <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-600" />
                        </span>
                      )}
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        v{draftVersion}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span>Client: <strong className="text-gray-700">{selectedClient?.name || "Unlinked"}</strong></span>
                      <span>•</span>
                      <span>Matter: <strong className="text-gray-700">{selectedMatter?.case_no || selectedMatter?.title || "Unlinked"}</strong></span>
                      <span>•</span>
                      {saveStatus === "saving" && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                      )}
                      {saveStatus === "unsaved" && (
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Clock className="w-3 h-3" /> Unsaved changes
                        </span>
                      )}
                      {saveStatus === "saved" && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Saved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Primary Save */}
                    <button 
                      onClick={handleSaveDraft} 
                      disabled={saveStatus === "saving"}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-60"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus === "saving" ? "Saving..." : activeDraftId ? "Save Changes" : "Save Draft"}
                    </button>

                    {/* Save As (Create Copy) */}
                    <button 
                      onClick={() => {
                        setSaveAsTitle(`${draftTitle} (Copy)`);
                        setShowSaveAsModal(true);
                      }} 
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5" /> Save As
                    </button>

                    {/* Export Dropdown */}
                    <div className="relative group">
                      <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm">
                        <Download className="w-3.5 h-3.5" /> Export
                      </button>
                      <div className="absolute right-0 top-9 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 hidden group-hover:block z-20 text-left">
                        <button 
                          onClick={handleExportDocx} 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" /> Export as DOCX (Word)
                        </button>
                        <button 
                          onClick={handleExportText} 
                          className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 font-medium flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-400" /> Export as Plain Text
                        </button>
                      </div>
                    </div>

                    {/* Preview & Print */}
                    <button 
                      onClick={() => setShowPrintPreview(true)} 
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" /> Preview &amp; Print
                    </button>
                  </div>
                </div>

                {/* Editor Canvas */}
                <div className="flex-1 p-6 flex flex-col items-center overflow-y-auto">
                  <div className="w-full max-w-[850px] bg-white border border-gray-200 shadow-sm rounded-lg min-h-[900px] p-12 flex flex-col">
                    <textarea 
                      className="w-full flex-1 resize-none outline-none font-serif text-gray-900 leading-relaxed text-[15px] selection:bg-indigo-100" 
                      value={editorContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Type or paste legal pleading content here..."
                    />
                    <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Words: {editorContent.trim() ? editorContent.trim().split(/\s+/).length : 0} • Characters: {editorContent.length}</span>
                      <span>Format: Formal Court Pleading (Times New Roman / Serif)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Panels (Summary and context) */}
        <AnimatePresence>
          {step >= 2 && (
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
                    <User className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span className="truncate">{selectedClient?.name || "Unlinked Client"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <Briefcase className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate">{selectedMatter?.case_no || selectedMatter?.title || "Unlinked Matter"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <FileSignature className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="capitalize">{selectedCategory.replace("_", " ") || "Application"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-gray-700">
                    <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Language: {selectedLanguage}</span>
                  </div>
                </div>
              </div>

              {/* Required Documents Checklist */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <FileCheck className="w-4 h-4 text-emerald-600" /> Required Documents
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Aadhaar Copy
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> PAN Card
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Opponent Notice / Order
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" /> Certified Court Extract
                  </label>
                </div>
                <div className="mt-3 text-[11px] text-amber-600 bg-amber-50 p-2.5 rounded-lg flex gap-1.5 items-start">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Ensures filing compliance for {selectedCategory.replace("_", " ")}.</span>
                </div>
              </div>

              {/* Applicable Sections Panel */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <Gavel className="w-4 h-4 text-indigo-600" /> Applicable Statutes
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[12px] font-medium border border-gray-200">NI Act S.138</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[12px] font-medium border border-gray-200">CrPC S.437/439</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[12px] font-medium border border-gray-200">BNS S.316</span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-[12px] font-medium border border-gray-200">CPC O.39 R.1&amp;2</span>
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
      </div>

      {/* Save As Modal */}
      <Modal 
        open={showSaveAsModal} 
        onClose={() => setShowSaveAsModal(false)} 
        title="Save As Separate Draft" 
        size="md"
      >
        <div className="p-4 space-y-4">
          <p className="text-xs text-gray-500">
            Create a separate working copy of this draft without altering the original document.
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase mb-1">New Draft Title</label>
            <input 
              type="text" 
              value={saveAsTitle} 
              onChange={(e) => setSaveAsTitle(e.target.value)} 
              placeholder="Enter title for copied draft..." 
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button 
              onClick={() => setShowSaveAsModal(false)} 
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveAs} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
            >
              Confirm &amp; Create Copy
            </button>
          </div>
        </div>
      </Modal>

      {/* Print / PDF Letterhead Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex bg-gray-900/70 backdrop-blur-xs items-center justify-center p-6 print:p-0 print:bg-white print:block">
          <div className="bg-gray-100 rounded-2xl w-full max-w-[950px] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:w-full print:max-h-none print:shadow-none print:bg-white print:rounded-none">
            
            {/* Modal Header (Hidden when printing) */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center print:hidden">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Letterhead Print &amp; PDF Preview
              </h2>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowSettingsModal(true)} 
                  className="px-3.5 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
                >
                  Configure Letterhead
                </button>
                <button 
                  onClick={handlePrint} 
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5"/> Print / Save PDF
                </button>
                <button 
                  onClick={() => setShowPrintPreview(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 font-bold"
                >
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
