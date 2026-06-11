"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wand2, Save, FileText, CheckCircle, Copy, RefreshCw, Eye, Download, FileType, Search } from "lucide-react";
import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import Header from "@/components/layout/Header";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import { useTemplates, useAutoFill, useCreateDraft } from "@/lib/hooks/useDrafts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Built-in templates for common legal documents
const BUILTIN_TEMPLATES = [
  {
    id: "__bail__",
    title: "Bail Application",
    category: "bail",
    content: `IN THE COURT OF {{court_name}}

CRIMINAL MISC. APPLICATION NO. ____/____

IN THE MATTER OF:

{{petitioner}}                                          ...APPLICANT/ACCUSED

VERSUS

STATE OF MAHARASHTRA                                    ...RESPONDENT

APPLICATION FOR BAIL UNDER SECTION 437/439 CR.P.C.

MOST RESPECTFULLY SHOWETH:

1. That the Applicant {{client_name}}, Age: {{client_age}} years, Occupation: {{client_occupation}}, R/o {{client_address}}, Aadhaar No.: {{aadhaar}}, PAN: {{pan}}, is falsely implicated in the above-mentioned case.

2. That the matter is pending before the Hon'ble Court of {{judge_name}}.

3. That the Case No. is {{case_number}}.

4. The Applicant is ready to abide by any conditions that this Hon'ble Court may impose.

PRAYER:

It is, therefore, most respectfully prayed that this Hon'ble Court may graciously be pleased to:

(a) Grant bail to the Applicant in the above-mentioned case;
(b) Pass such other and further orders as this Hon'ble Court may deem fit and proper in the interest of justice.

                                        Filed By:
                                        {{advocate_name}}
                                        Advocate
Date:
Place:`,
  },
  {
    id: "__notice__",
    title: "Legal Notice",
    category: "notice",
    content: `LEGAL NOTICE

Date: ____________________

To,
{{opponent_name}}
[Address]

NOTICE UNDER SECTION ____

Dear Sir/Madam,

Under instructions from and on behalf of my client {{client_name}}, R/o {{client_address}}, PAN: {{pan}}, I hereby serve upon you this Legal Notice as under:

1. My client {{client_name}} is aggrieved by your acts, omissions, commissions and/or inactions which have caused my client loss and injury.

2. The matter is currently pending before {{court_name}} vide Case No. {{case_number}}.

3. You are hereby called upon to [state demand] within 15 days of receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you before the competent court of law, entirely at your risk, cost and consequence.

Please take this as a final notice before legal action.

Yours faithfully,

{{advocate_name}}
Advocate
[Bar Council No.]`,
  },
  {
    id: "__vakalatnama__",
    title: "Vakalatnama",
    category: "other",
    content: `VAKALATNAMA

IN THE COURT OF {{court_name}}

CASE NO.: {{case_number}}

I, {{client_name}}, Age: {{client_age}} years, Occupation: {{client_occupation}}, R/o {{client_address}}, Aadhaar No.: {{aadhaar}}, PAN: {{pan}}, do hereby appoint, retain and authorise {{advocate_name}}, Advocate, to act, appear and plead in the above-mentioned case and in all proceedings arising therefrom including re-hearing, review and execution proceedings.

I hereby authorise the said Advocate to:
1. Act, appear and plead for me in all courts.
2. File pleadings, affidavits and other documents.
3. Accept service of all processes.
4. Withdraw or compromise any suit or proceedings.
5. Receive any money or property due to me in any suit or proceedings.

Dated: ____________________
Place: ____________________

                                        CLIENT'S SIGNATURE
                                        {{client_name}}

Accepted:
{{advocate_name}}
Advocate`,
  },
  {
    id: "__affidavit__",
    title: "Affidavit",
    category: "affidavit",
    content: `AFFIDAVIT

I, {{client_name}}, Age: {{client_age}} years, Occupation: {{client_occupation}}, R/o {{client_address}}, Aadhaar No.: {{aadhaar}}, PAN: {{pan}}, do hereby solemnly affirm and state as under:

1. That I am the Deponent herein and I am fully conversant with the facts of the case.

2. That the matter is pending before {{court_name}} in Case No. {{case_number}}.

3. [Add facts here]

DEPONENT

VERIFICATION:

I, the above-named Deponent, do hereby verify that the contents of the above Affidavit are true and correct to my knowledge and belief and nothing material has been concealed therefrom.

Verified at _____________ on this _____ day of ______________, 20___.

DEPONENT

Before Me,
[Notary/Oath Commissioner]`,
  },
];

const MERGE_FIELDS = [
  "{{client_name}}", "{{client_address}}", "{{client_age}}", "{{client_occupation}}",
  "{{aadhaar}}", "{{pan}}", "{{case_number}}", "{{court_name}}", "{{judge_name}}",
  "{{opponent_name}}", "{{advocate_name}}", "{{petitioner}}", "{{respondent}}",
];

export default function NewDraftPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client_id") || "";
  const preselectedCaseId = searchParams.get("case_id") || "";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId);
  const [selectedCaseId, setSelectedCaseId] = useState(preselectedCaseId);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [filledContent, setFilledContent] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [mergeMap, setMergeMap] = useState<Record<string, string>>({});
  const [showMergeMap, setShowMergeMap] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  const { data: clientsData } = useClients({ limit: 200 });

  const filteredClients = (clientsData?.clients || []).filter(c =>
    c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    (c.phone && c.phone.replace(/[^0-9]/g, "").includes(clientSearchQuery.replace(/[^0-9]/g, "")))
  );

  const { data: casesData } = useCases({ client_id: selectedClientId || undefined, limit: 200 });
  const { data: templatesData } = useTemplates();
  const autoFill = useAutoFill();
  const createDraft = useCreateDraft();

  const allTemplates = [
    ...BUILTIN_TEMPLATES,
    ...(templatesData?.templates || []),
  ];

  // Pre-fill template content when template is selected
  useEffect(() => {
    if (!selectedTemplateId) return;
    const tmpl = allTemplates.find((t) => t.id === selectedTemplateId);
    if (tmpl) {
      setTemplateContent(tmpl.content);
      setDraftTitle(tmpl.title);
      setFilledContent("");
    }
  }, [selectedTemplateId]);

  const handleAutoFill = async () => {
    if (!selectedClientId || !templateContent) return;
    const result = await autoFill.mutateAsync({
      template_content: templateContent,
      client_id: selectedClientId,
      case_id: selectedCaseId || undefined,
    });
    setFilledContent(result.filled_content);
    setMergeMap(result.merge_map);
    setStep(3);
  };

  const handleSave = async (asTemplate = false) => {
    const content = filledContent || templateContent;
    if (!draftTitle || !content) return;
    await createDraft.mutateAsync({
      title: draftTitle,
      content,
      category: allTemplates.find((t) => t.id === selectedTemplateId)?.category || "other",
      case_id: selectedCaseId || undefined,
      client_id: selectedClientId || undefined,
      is_template: asTemplate,
    });
    setIsSaved(true);
  };

  const handleExportPDF = () => {
    if (!filledContent) return;
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(filledContent, 180);
    doc.text(splitText, 15, 15);
    doc.save(`${draftTitle || "Draft"}.pdf`);
    toast.success("PDF exported successfully");
  };

  const handleExportDOCX = async () => {
    if (!filledContent) return;
    const paragraphs = filledContent.split("\n").map(text => new Paragraph({
      children: [new TextRun(text)],
    }));
    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${draftTitle || "Draft"}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("DOCX exported successfully");
  };

  const insertMergeField = (field: string) => {
    setTemplateContent((prev) => prev + field);
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header title="Auto-Fill Draft" subtitle="Select client → matter → template → generate" />

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "Select Client & Matter" },
            { n: 2, label: "Select Template" },
            { n: 3, label: "Review & Save" },
          ].map(({ n, label }, i, arr) => (
            <div key={n} className="flex items-center gap-2">
              <button onClick={() => n < step && setStep(n as 1|2|3)}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                  step === n ? "bg-sidebar text-white" :
                  step > n ? "bg-green-50 text-green-700 hover:bg-green-100" :
                  "bg-white border border-gray-200 text-gray-400 cursor-default")}>
                {step > n ? <CheckCircle className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">{n}</span>}
                {label}
              </button>
              {i < arr.length - 1 && <div className="w-6 h-px bg-gray-200" />}
            </div>
          ))}
        </div>

        {/* STEP 1: Select Client & Matter */}
         {step === 1 && (
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Select Client</h3>
                <div className="relative w-48">
                  <input
                    type="text"
                    placeholder="Search client..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint bg-gray-50/50"
                  />
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button key={c.id} onClick={() => { setSelectedClientId(c.id); setSelectedCaseId(""); }}
                    className={cn("w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors",
                      selectedClientId === c.id ? "border-sidebar bg-sidebar/5" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50")}>
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0",
                      c.type === "corporate" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700")}>
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{c.name}</div>
                      <div className="text-xs text-gray-400 capitalize">{c.type} · {c.phone}</div>
                    </div>
                    {selectedClientId === c.id && <CheckCircle className="w-4 h-4 text-sidebar ml-auto" />}
                  </button>
                ))}
                {!filteredClients.length && <p className="text-sm text-gray-400 text-center py-4">No matching clients found.</p>}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Select Matter (Optional)</h3>
              {!selectedClientId ? (
                <p className="text-sm text-gray-400 text-center py-8">Select a client first</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  <button onClick={() => setSelectedCaseId("")}
                    className={cn("w-full text-left p-3 rounded-xl border text-sm transition-colors",
                      !selectedCaseId ? "border-sidebar bg-sidebar/5 text-sidebar font-medium" : "border-gray-100 text-gray-500 hover:border-gray-200")}>
                    No matter (client-level document)
                  </button>
                  {(casesData?.cases || []).map((c) => (
                    <button key={c.id} onClick={() => setSelectedCaseId(c.id)}
                      className={cn("w-full text-left p-3 rounded-xl border transition-colors",
                        selectedCaseId === c.id ? "border-sidebar bg-sidebar/5" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50")}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900 text-sm font-mono text-xs">{c.case_no}</div>
                          <div className="text-sm text-gray-700 mt-0.5">{c.title}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{c.court}</div>
                        </div>
                        {selectedCaseId === c.id && <CheckCircle className="w-4 h-4 text-sidebar" />}
                      </div>
                    </button>
                  ))}
                  {!casesData?.cases?.length && <p className="text-xs text-gray-400 text-center py-4">No cases for this client</p>}
                </div>
              )}
            </div>

            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedClientId}
                className="px-6 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-sidebar-dark disabled:opacity-50 transition-colors">
                Next: Select Template →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Template & Edit */}
        {step === 2 && (
          <div className="grid grid-cols-3 gap-5">
            {/* Template picker */}
            <div className="col-span-1 bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Templates</h3>
              <div className="space-y-2">
                {allTemplates.map((t) => (
                  <button key={t.id} onClick={() => setSelectedTemplateId(t.id)}
                    className={cn("w-full text-left p-3 rounded-xl border text-sm transition-colors",
                      selectedTemplateId === t.id ? "border-sidebar bg-sidebar/5" : "border-gray-100 hover:border-gray-200 hover:bg-gray-50")}>
                    <div className="flex items-center gap-2">
                      <FileText className={cn("w-4 h-4 flex-shrink-0", selectedTemplateId === t.id ? "text-sidebar" : "text-gray-400")} />
                      <div>
                        <div className="font-medium text-gray-900">{t.title}</div>
                        <div className="text-xs text-gray-400 capitalize">{t.category}</div>
                      </div>
                    </div>
                  </button>
                ))}
                <button onClick={() => { setSelectedTemplateId("__custom__"); setTemplateContent(""); setDraftTitle("New Draft"); }}
                  className={cn("w-full text-left p-3 rounded-xl border text-sm transition-colors",
                    selectedTemplateId === "__custom__" ? "border-sidebar bg-sidebar/5" : "border-dashed border-gray-300 hover:border-sidebar/30 text-gray-500")}>
                  + Start from scratch
                </button>
              </div>
            </div>

            {/* Template editor */}
            <div className="col-span-2 space-y-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Edit Template</h3>
                  <div className="text-xs text-gray-400">Use <code className="bg-gray-100 px-1 rounded">{"{{field}}"}</code> for merge fields</div>
                </div>
                <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Document title..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint mb-3" />
                <textarea
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  placeholder="Type or paste your template here. Use {{client_name}}, {{court_name}}, etc. for auto-fill..."
                  rows={16}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
                />
                {/* Merge field quick-insert */}
                <div className="mt-3">
                  <div className="text-xs text-gray-500 mb-2 font-medium">Insert merge field:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {MERGE_FIELDS.map((f) => (
                      <button key={f} onClick={() => insertMergeField(f)}
                        className="text-xs bg-mint/10 text-sidebar px-2.5 py-1 rounded-lg hover:bg-mint/20 transition-colors font-mono">
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  ← Back
                </button>
                <button
                  onClick={handleAutoFill}
                  disabled={!templateContent || !selectedClientId || autoFill.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-sidebar-dark disabled:opacity-50 transition-colors">
                  <Wand2 className="w-4 h-4" />
                  {autoFill.isPending ? "Filling..." : "Auto-Fill Fields →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Review & Save */}
        {step === 3 && (
          <div className="grid grid-cols-3 gap-5">
            {/* Merge map */}
            <div className="col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Fields Used</h3>
                  <button onClick={() => setShowMergeMap((v) => !v)} className="text-xs text-gray-400 hover:text-gray-600">
                    {showMergeMap ? "Hide" : "Show all"}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {Object.entries(mergeMap).filter(([, v]) => showMergeMap || v).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-2">
                      <span className="text-xs font-mono text-gray-400 flex-shrink-0">{`{{${key}}}`}</span>
                      <span className="text-xs text-gray-700 font-medium text-right truncate max-w-[140px]" title={value}>
                        {value || <span className="text-gray-300 italic">empty</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Save Document</h3>
                <input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint" />
                <button onClick={() => handleSave(false)} disabled={createDraft.isPending || isSaved}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sidebar text-white text-sm font-semibold hover:bg-sidebar-dark disabled:opacity-60 transition-colors">
                  {isSaved ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> {createDraft.isPending ? "Saving..." : "Save Draft"}</>}
                </button>
                <button onClick={() => handleSave(true)} disabled={createDraft.isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4" /> Save as Template
                </button>
                <button onClick={() => { navigator.clipboard.writeText(filledContent); toast.success("Copied to clipboard"); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <Copy className="w-4 h-4" /> Copy Text
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors">
                    <Download className="w-4 h-4" /> PDF
                  </button>
                  <button onClick={handleExportDOCX}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors">
                    <FileType className="w-4 h-4" /> DOCX
                  </button>
                </div>
                <button onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  <RefreshCw className="w-4 h-4" /> Edit Template
                </button>
              </div>

              {isSaved && selectedCaseId && (
                <button onClick={() => router.push(`/cases/${selectedCaseId}`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 border border-green-200">
                  <Eye className="w-4 h-4" /> View in Case →
                </button>
              )}
            </div>

            {/* Filled document editor */}
            <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Generated Document — Editable</h3>
                <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">Auto-filled</span>
              </div>
              <textarea
                value={filledContent}
                onChange={(e) => setFilledContent(e.target.value)}
                rows={28}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
              />
              <p className="text-xs text-gray-400 mt-2">
                ✏️ All auto-filled content is editable. Modify before saving or filing.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
