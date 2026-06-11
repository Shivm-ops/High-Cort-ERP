"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, CheckCircle, FileText, Briefcase, AlertCircle, Scale, Milestone, ShieldAlert, Printer } from "lucide-react";
import Header from "@/components/layout/Header";
import { useIntake, useUpdateIntake, Intake } from "@/lib/hooks/useIntakes";
import { useClients } from "@/lib/hooks/useClients";
import { useAutoFill } from "@/lib/hooks/useDrafts";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import CaseForm from "@/components/forms/CaseForm";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/authStore";

const TABS = ["facts", "legal_basis", "chronology", "documents", "assessment", "engagement"] as const;
type Tab = typeof TABS[number];

const DOC_TYPES = ["Aadhaar", "PAN", "Address Proof", "Agreements", "Notice", "FIR", "Court Orders", "Supporting Evidence"];

export default function IntakeDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: intake, isLoading } = useIntake(id);
  const updateIntake = useUpdateIntake();
  const { data: clientsData } = useClients();
  const autofill = useAutoFill();
  const user = useAuthStore((state) => state.user);
  
  const [activeTab, setActiveTab] = useState<Tab>("facts");
  const [formData, setFormData] = useState<Partial<Intake>>({});
  const [isDirty, setIsDirty] = useState(false);

  const selectedClient = clientsData?.clients.find(c => c.id === formData.client_id);
  
  // Builders State
  const [chronoDate, setChronoDate] = useState("");
  const [chronoEvent, setChronoEvent] = useState("");
  const [chronoRemarks, setChronoRemarks] = useState("");

  const [newFact, setNewFact] = useState("");
  const [newEvidence, setNewEvidence] = useState("");

  const [newSection, setNewSection] = useState("");
  
  const [newStrength, setNewStrength] = useState("");
  const [newWeakness, setNewWeakness] = useState("");
  const [newLimitation, setNewLimitation] = useState("");
  const [newJurisdiction, setNewJurisdiction] = useState("");

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [generatedVakalatnama, setGeneratedVakalatnama] = useState("");
  const [vakalatnamaFormat, setVakalatnamaFormat] = useState(
    "BEFORE THE HON'BLE COURT OF [COURT_NAME] AT [COURT_CITY]\n\nCase No: [CASE_NO]\n\n[PETITIONER_NAME] ............................................ Petitioner\n                          VERSUS\n[RESPONDENT_NAME] ............................................ Respondent\n\nVAKALATNAMA\n\nI/We, [CLIENT_NAME], do hereby appoint and retain [ADVOCATE_NAME] to act and appear for me/us in the above suit/appeal/petition and on my/our behalf to conduct and prosecute (or defend) the same and all proceedings that may be taken in respect of any application connected with the same..."
  );

  useEffect(() => {
    if (intake) {
      setFormData(intake);
      setIsDirty(false);
    }
  }, [intake]);

  const handleChange = (field: keyof Intake, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await updateIntake.mutateAsync({ id, ...formData });
    setIsDirty(false);
  };

  // Builders Logic
  const handleAddChrono = () => {
    if (!chronoDate || !chronoEvent) {
      toast.error("Please provide both Date and Event before adding.");
      return;
    }
    const newChrono = [...(formData.chronology || []), { date: chronoDate, event: chronoEvent, remarks: chronoRemarks }];
    handleChange("chronology", newChrono);
    setChronoDate(""); setChronoEvent(""); setChronoRemarks("");
  };

  const handleAddFact = () => {
    if (!newFact) {
      toast.error("Please type a fact in the box first.");
      return;
    }
    const newFacts = [...(formData.facts_list || []), { fact: newFact, evidence_needed: newEvidence }];
    handleChange("facts_list", newFacts);
    setNewFact(""); setNewEvidence("");
  };

  const handleAddSection = () => {
    if (!newSection) {
      toast.error("Please type a section before adding.");
      return;
    }
    const newSections = [...(formData.applicable_sections || []), newSection];
    handleChange("applicable_sections", newSections);
    setNewSection("");
  };

  const handleAddStrength = () => {
    if (!newStrength) {
      toast.error("Please type a strength point first.");
      return;
    }
    const currentAssessment = formData.assessment || {};
    const strengths = [...(currentAssessment.strengths || []), newStrength];
    handleChange("assessment", { ...currentAssessment, strengths });
    setNewStrength("");
  };

  const handleAddWeakness = () => {
    if (!newWeakness) {
      toast.error("Please type a weakness point first.");
      return;
    }
    const currentAssessment = formData.assessment || {};
    const weaknesses = [...(currentAssessment.weaknesses || []), newWeakness];
    handleChange("assessment", { ...currentAssessment, weaknesses });
    setNewWeakness("");
  };

  const handleAddLimitation = () => {
    if (!newLimitation) {
      toast.error("Please type a limitation issue first.");
      return;
    }
    const currentAssessment = formData.assessment || {};
    const limitation = [...(currentAssessment.limitation || []), newLimitation];
    handleChange("assessment", { ...currentAssessment, limitation });
    setNewLimitation("");
  };

  const handleAddJurisdiction = () => {
    if (!newJurisdiction) {
      toast.error("Please type a jurisdiction point first.");
      return;
    }
    const currentAssessment = formData.assessment || {};
    const jurisdiction = [...(currentAssessment.jurisdiction || []), newJurisdiction];
    handleChange("assessment", { ...currentAssessment, jurisdiction });
    setNewJurisdiction("");
  };

  const handleRemoveItem = (field: keyof Intake, index: number, nested?: string) => {
    if (nested && field === "assessment") {
      const current = formData.assessment || {};
      const arr = [...(current[nested as keyof typeof current] as string[] || [])];
      arr.splice(index, 1);
      handleChange("assessment", { ...current, [nested]: arr });
      return;
    }
    const arr = [...((formData[field] as any[]) || [])];
    arr.splice(index, 1);
    handleChange(field, arr);
  };

  const handleDocStatus = (doc: string, status: string) => {
    const newDocs = { ...(formData.document_checklist || {}), [doc]: status };
    handleChange("document_checklist", newDocs);
  };

  const handleGenerateVakalatnama = async () => {
    if (!formData.client_id) return toast.error("Please select a client first.");
    try {
      const res = await autofill.mutateAsync({ 
        template_content: vakalatnamaFormat,
        client_id: formData.client_id 
      });
      setGeneratedVakalatnama(res.filled_content);
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading || !intake) return <div className="flex flex-col h-full bg-[#F7F8F6]"><Header title="Loading..." subtitle="" /></div>;

  return (
    <>
    {/* Screen UI - Hidden on Print */}
    <div className="flex flex-col h-full bg-[#F7F8F6] print:hidden">
      <Header title="Client Intake Workspace" subtitle="Matter Assessment & Pre-Engagement Workflow" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Back to Intakes
          </button>
          
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={handleSave} disabled={!isDirty || updateIntake.isPending}
              className="flex items-center gap-2 bg-sidebar text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-sidebar-dark transition-colors disabled:opacity-50 shadow-sm">
              <Save className="w-4 h-4" /> Save Changes
            </button>
            {formData.status === "accepted" && !formData.case_id && (
              <button onClick={() => setShowCaseModal(true)}
                className="flex items-center gap-2 bg-mint text-sidebar px-4 py-2 rounded-xl text-sm font-bold hover:bg-mint/80 transition-colors shadow-sm">
                <Briefcase className="w-4 h-4" /> Create Matter
              </button>
            )}
            {formData.case_id && (
              <button onClick={() => router.push(`/cases/${formData.case_id}`)}
                className="flex items-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-300 transition-colors">
                View Case
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-5">
          {/* Left Sidebar */}
          <div className="col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Client</label>
                <select value={formData.client_id || ""} onChange={(e) => handleChange("client_id", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint outline-none">
                  <option value="">-- Select Client --</option>
                  {clientsData?.clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <select value={formData.status || "under_review"} onChange={(e) => handleChange("status", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint outline-none">
                  <option value="under_review">Under Review</option>
                  <option value="awaiting_documents">Awaiting Documents</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Urgency</label>
                <select value={formData.urgency_level || "Normal"} onChange={(e) => handleChange("urgency_level", e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint outline-none">
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent / Immediate Action</option>
                </select>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-2xl border border-gray-100 p-2 space-y-1 shadow-sm">
              {TABS.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={cn("w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors capitalize",
                    activeTab === tab ? "bg-sidebar text-white shadow-md" : "text-gray-600 hover:bg-gray-50")}>
                  {tab.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 min-h-[600px] shadow-sm">
              
              {/* FACTS & NARRATIVE */}
              {activeTab === "facts" && (
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Client Narrative</label>
                    <textarea value={formData.narrative || ""} onChange={(e) => handleChange("narrative", e.target.value)}
                      placeholder="Brief summary of the client's story..." rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none outline-none" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-semibold text-gray-900">Distilled Facts</label>
                      <span className="text-xs text-gray-500 font-medium">Build point-wise factual matrix</span>
                    </div>
                    
                    {/* Fact Builder */}
                    <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                      <div className="flex-1">
                        <textarea value={newFact} onChange={e => setNewFact(e.target.value)} placeholder="Type a new fact here first..." rows={2}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint resize-none" />
                      </div>
                      <div className="w-1/3 flex flex-col gap-2">
                        <input type="text" value={newEvidence} onChange={e => setNewEvidence(e.target.value)} placeholder="Required Evidence/Proof"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint" />
                        <button onClick={handleAddFact}
                          className="bg-sidebar text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-dark transition-colors w-full flex justify-center items-center gap-2">
                          <Plus className="w-4 h-4" /> Add Fact
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {(formData.facts_list || []).map((item, i) => (
                        <div key={i} className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl bg-white relative group hover:border-mint/50 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-mint/20 text-mint flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i+1}</div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{item.fact}</div>
                            {item.evidence_needed && (
                              <div className="text-xs font-medium text-sidebar mt-2 flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Evidence: {item.evidence_needed}
                              </div>
                            )}
                          </div>
                          <button onClick={() => handleRemoveItem("facts_list", i)} className="opacity-0 group-hover:opacity-100 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {!(formData.facts_list?.length) && <div className="text-center py-6 text-gray-400 text-sm">No facts added.</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* LEGAL BASIS */}
              {activeTab === "legal_basis" && (
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Scale className="w-4 h-4 text-sidebar" /> Applicable Sections & Acts
                    </label>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 mb-4">
                      <input type="text" value={newSection} onChange={e => setNewSection(e.target.value)} 
                        onKeyDown={e => e.key === "Enter" && handleAddSection()}
                        placeholder="e.g. Sec 138 NI Act, Order 39 CPC..."
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint" />
                      <button onClick={handleAddSection}
                        className="bg-sidebar text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-dark transition-colors">
                        Add Section
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(formData.applicable_sections || []).map((sec, i) => (
                        <div key={i} className="flex items-center gap-2 bg-sidebar/5 border border-sidebar/20 text-sidebar px-3 py-1.5 rounded-lg text-sm font-semibold">
                          {sec}
                          <button onClick={() => handleRemoveItem("applicable_sections", i)} className="text-sidebar/50 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {!(formData.applicable_sections?.length) && <div className="text-gray-400 text-sm italic">No sections tagged yet.</div>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Relief Sought</label>
                    <textarea value={formData.relief_sought || ""} onChange={(e) => handleChange("relief_sought", e.target.value)}
                      placeholder="What exactly is the client seeking from the court? (e.g. Injunction, Recovery of Rs. 10 Lakhs, Bail)" rows={5}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none outline-none" />
                  </div>
                </div>
              )}

              {/* CHRONOLOGY */}
              {activeTab === "chronology" && (
                <div className="space-y-6">
                  <div className="flex items-end gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="w-1/4">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
                      <input type="date" value={chronoDate} onChange={e => setChronoDate(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Event</label>
                      <input type="text" value={chronoEvent} onChange={e => setChronoEvent(e.target.value)} placeholder="e.g. Notice Received"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Remarks</label>
                      <input type="text" value={chronoRemarks} onChange={e => setChronoRemarks(e.target.value)} placeholder="Optional details"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-mint" />
                    </div>
                    <button onClick={handleAddChrono}
                      className="bg-sidebar text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sidebar-dark transition-colors flex items-center gap-2 h-10 mt-5">
                      <Plus className="w-4 h-4" /> Add Event
                    </button>
                  </div>

                  <div className="space-y-0">
                    {(formData.chronology || []).map((item, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 border-l-2 border-mint ml-2 relative group hover:bg-gray-50">
                        <div className="absolute -left-[9px] top-5 w-4 h-4 rounded-full bg-mint border-4 border-white" />
                        <div className="w-24 pt-0.5 text-sm font-bold text-sidebar">{item.date}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{item.event}</div>
                          {item.remarks && <div className="text-sm text-gray-500 mt-1">{item.remarks}</div>}
                        </div>
                        <button onClick={() => handleRemoveItem("chronology", i)} className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {!(formData.chronology?.length) && <div className="text-center py-10 text-gray-400 text-sm">No events added to chronology.</div>}
                  </div>
                </div>
              )}

              {/* DOCUMENTS */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {DOC_TYPES.map(doc => {
                      const status = formData.document_checklist?.[doc] || "Not Available";
                      return (
                        <div key={doc} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-mint/30 transition-colors bg-gray-50/50">
                          <span className="font-medium text-sm text-gray-800">{doc}</span>
                          <select value={status} onChange={(e) => handleDocStatus(doc, e.target.value)}
                            className={cn("text-xs font-semibold rounded-lg px-2 py-1 outline-none border-0 ring-1",
                              status === "Received" ? "bg-green-50 text-green-700 ring-green-200" :
                              status === "Pending" ? "bg-amber-50 text-amber-700 ring-amber-200" :
                              "bg-gray-100 text-gray-500 ring-gray-200"
                            )}>
                            <option value="Not Available">Not Available</option>
                            <option value="Pending">Pending</option>
                            <option value="Received">Received</option>
                          </select>
                        </div>
                      )
                    })}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Documents Required</label>
                    <textarea value={formData.additional_docs_required || ""} onChange={(e) => handleChange("additional_docs_required", e.target.value)} rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none outline-none" />
                  </div>
                </div>
              )}

              {/* ASSESSMENT */}
              {activeTab === "assessment" && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    {/* Strengths Builder */}
                    <div>
                      <label className="block text-sm font-semibold text-green-700 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Legal Strengths</label>
                      <div className="flex items-center gap-2 mb-3">
                        <input type="text" value={newStrength} onChange={e => setNewStrength(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddStrength()}
                          placeholder="Add a strength point..." className="flex-1 rounded-lg border border-green-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400 bg-green-50/30" />
                        <button onClick={handleAddStrength} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4" /> Add</button>
                      </div>
                      <ul className="space-y-2">
                        {(formData.assessment?.strengths || []).map((s, i) => (
                          <li key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg border border-green-100 bg-green-50/50 group">
                            <span className="text-sm text-green-900 font-medium">{s}</span>
                            <button onClick={() => handleRemoveItem("assessment", i, "strengths")} className="text-green-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses Builder */}
                    <div>
                      <label className="block text-sm font-semibold text-red-700 mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Weaknesses & Risks</label>
                      <div className="flex items-center gap-2 mb-3">
                        <input type="text" value={newWeakness} onChange={e => setNewWeakness(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddWeakness()}
                          placeholder="Add a weakness point..." className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 bg-red-50/30" />
                        <button onClick={handleAddWeakness} className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-sm font-medium flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4" /> Add</button>
                      </div>
                      <ul className="space-y-2">
                        {(formData.assessment?.weaknesses || []).map((w, i) => (
                          <li key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg border border-red-100 bg-red-50/50 group">
                            <span className="text-sm text-red-900 font-medium">{w}</span>
                            <button onClick={() => handleRemoveItem("assessment", i, "weaknesses")} className="text-red-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-100">
                    {/* Limitation Builder */}
                    <div>
                      <label className="block text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2"><Milestone className="w-4 h-4" /> Limitation Issues</label>
                      <div className="flex items-center gap-2 mb-3">
                        <input type="text" value={newLimitation} onChange={e => setNewLimitation(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddLimitation()}
                          placeholder="Is the matter within limitation?" className="flex-1 rounded-lg border border-amber-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50/30" />
                        <button onClick={handleAddLimitation} className="bg-amber-600 text-white px-3 py-2 rounded-lg hover:bg-amber-700 text-sm font-medium flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4" /> Add</button>
                      </div>
                      <ul className="space-y-2">
                        {(formData.assessment?.limitation || []).map((l, i) => (
                          <li key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg border border-amber-100 bg-amber-50/50 group">
                            <span className="text-sm text-amber-900 font-medium">{l}</span>
                            <button onClick={() => handleRemoveItem("assessment", i, "limitation")} className="text-amber-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Jurisdiction Builder */}
                    <div>
                      <label className="block text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Jurisdiction</label>
                      <div className="flex items-center gap-2 mb-3">
                        <input type="text" value={newJurisdiction} onChange={e => setNewJurisdiction(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddJurisdiction()}
                          placeholder="Territorial/pecuniary jurisdiction?" className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400 bg-blue-50/30" />
                        <button onClick={handleAddJurisdiction} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2 whitespace-nowrap"><Plus className="w-4 h-4" /> Add</button>
                      </div>
                      <ul className="space-y-2">
                        {(formData.assessment?.jurisdiction || []).map((j, i) => (
                          <li key={i} className="flex items-start justify-between gap-2 p-2 rounded-lg border border-blue-100 bg-blue-50/50 group">
                            <span className="text-sm text-blue-900 font-medium">{j}</span>
                            <button onClick={() => handleRemoveItem("assessment", i, "jurisdiction")} className="text-blue-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ENGAGEMENT */}
              {activeTab === "engagement" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Vakalatnama Generation</h3>
                    
                    <div className="mb-4">
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Vakalatnama Format (Template)</label>
                      <textarea value={vakalatnamaFormat} onChange={(e) => setVakalatnamaFormat(e.target.value)} rows={6}
                        className="w-full rounded-xl border border-gray-200 p-4 text-xs font-mono text-gray-500 focus:ring-2 focus:ring-mint/30 focus:border-mint resize-y outline-none" />
                    </div>

                    <div className="flex items-center gap-4">
                      <button onClick={handleGenerateVakalatnama} disabled={autofill.isPending}
                        className="flex items-center gap-2 bg-sidebar text-white border border-sidebar-dark px-4 py-2 rounded-xl text-sm font-bold hover:bg-sidebar-dark transition-colors shadow-sm">
                        <FileText className="w-4 h-4" /> {autofill.isPending ? "Generating..." : "Generate Vakalatnama"}
                      </button>
                    </div>

                    {generatedVakalatnama && (
                      <div className="mt-4">
                        <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Generated Document</label>
                        <textarea value={generatedVakalatnama} readOnly rows={10}
                          className="w-full rounded-xl border border-gray-200 p-4 text-sm font-serif bg-white outline-none resize-none shadow-inner" />
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Client Consent</h3>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer mb-3">
                      <input type="checkbox" checked={formData.consent_received || false} onChange={e => handleChange("consent_received", e.target.checked)}
                        className="w-4 h-4 rounded text-sidebar focus:ring-sidebar" />
                      Client Consent Received
                    </label>
                    <textarea value={formData.consent_details || ""} onChange={(e) => handleChange("consent_details", e.target.value)} rows={2} placeholder="Record consent details (e.g. Received via Email on 12/04, Digital Signature, Verbal Confirmation in meeting...)"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Fee Agreement</label>
                    <textarea value={formData.fee_agreement || ""} onChange={(e) => handleChange("fee_agreement", e.target.value)} rows={3} placeholder="Record agreed fees, retainer, or billing structure..."
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none outline-none" />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      <Modal open={showCaseModal} onClose={() => setShowCaseModal(false)} title="Create Matter from Intake" size="xl">
        <CaseForm 
          defaultClientId={formData.client_id} 
          defaultDescription={`${formData.narrative || ""}\n\nFacts:\n${(formData.facts_list || []).map(f => f.fact).join("\n")}`}
          onSuccess={(caseId) => { 
            setShowCaseModal(false); 
            updateIntake.mutate({ id, case_id: caseId });
            router.push(`/cases/${caseId}`); 
          }} 
        />
      </Modal>

    </div>

    {/* Print Layout - Visible only on Print */}
    <div className="hidden print:block bg-white p-8 font-serif text-gray-900 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">{user?.full_name || "Advocate"}</h1>
          <p className="text-sm text-gray-600 mt-1">{user?.bar_council_no ? `Bar Council No: ${user.bar_council_no}` : "Legal Practice"}</p>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-semibold uppercase tracking-wider text-gray-800">Client Intake Record</h2>
          <p className="text-sm text-gray-500 mt-1">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Client Details */}
      <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client Details</h3>
          {selectedClient ? (
            <div className="text-sm space-y-1">
              <p><span className="font-semibold">Name:</span> {selectedClient.name}</p>
              <p><span className="font-semibold">Type:</span> <span className="capitalize">{selectedClient.type}</span></p>
              {selectedClient.phone && <p><span className="font-semibold">Phone:</span> {selectedClient.phone}</p>}
              {selectedClient.email && <p><span className="font-semibold">Email:</span> {selectedClient.email}</p>}
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">No Client Selected</p>
          )}
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Matter Meta</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-semibold">Status:</span> <span className="capitalize">{formData.status?.replace("_", " ")}</span></p>
            <p><span className="font-semibold">Urgency:</span> {formData.urgency_level}</p>
            {formData.applicable_sections && formData.applicable_sections.length > 0 && (
              <p><span className="font-semibold">Key Laws:</span> {formData.applicable_sections.join(", ")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Narrative */}
      {formData.narrative && (
        <div>
          <h3 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Client Narrative</h3>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{formData.narrative}</p>
        </div>
      )}

      {/* Facts */}
      {formData.facts_list && formData.facts_list.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Distilled Facts</h3>
          <ul className="list-decimal pl-5 space-y-2 text-sm leading-relaxed">
            {formData.facts_list.map((f, i) => (
              <li key={i}>
                {f.fact}
                {f.evidence_needed && <span className="block text-xs italic text-gray-600 mt-0.5">Required Proof: {f.evidence_needed}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chronology */}
      {formData.chronology && formData.chronology.length > 0 && (
        <div>
          <h3 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Chronology of Events</h3>
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="py-2 font-semibold w-32">Date</th>
                <th className="py-2 font-semibold">Event</th>
                <th className="py-2 font-semibold">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData.chronology.map((c, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-2 align-top font-medium">{c.date}</td>
                  <td className="py-2 align-top pr-4">{c.event}</td>
                  <td className="py-2 align-top text-gray-600">{c.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assessment */}
      {formData.assessment && (
        <div className="break-inside-avoid">
          <h3 className="text-sm font-bold uppercase border-b border-gray-300 pb-1 mb-2">Legal Assessment</h3>
          <div className="grid grid-cols-2 gap-6 text-sm">
            {formData.assessment.strengths && formData.assessment.strengths.length > 0 && (
              <div>
                <p className="font-semibold text-green-800 mb-1">Strengths</p>
                <ul className="list-disc pl-4 space-y-1">
                  {formData.assessment.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
            {formData.assessment.weaknesses && formData.assessment.weaknesses.length > 0 && (
              <div>
                <p className="font-semibold text-red-800 mb-1">Weaknesses/Risks</p>
                <ul className="list-disc pl-4 space-y-1">
                  {formData.assessment.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Signature Line */}
        <div className="mt-10 pt-4 border-t border-gray-200 text-[10px] text-gray-400 text-center uppercase tracking-wider font-sans">
          Generated by LegalOS — India's Complete Legal Operating System
        </div>
    </div>
    </>
  );
}
