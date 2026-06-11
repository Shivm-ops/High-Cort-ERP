"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Calendar,
  FileText,
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  ImageIcon,
  Video,
  Music,
  StickyNote,
  FolderOpen,
  Gavel,
  Pin,
  Trash2,
  Send,
  Users,
  GitBranch,
  Activity,
  UserPlus,
  UserMinus,
  ChevronRight,
  Award,
  Briefcase,
  X,
  Printer,
  Phone,
  Mail,
  MapPin,
  Scale,
  Stamp,
  Hash,
  Download,
  FileCheck
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import CaseForm from "@/components/forms/CaseForm";
import HearingForm from "@/components/forms/HearingForm";
import EFilingWorkspace from "@/components/cases/EFilingWorkspace";
import FilingForm from "@/components/forms/FilingForm";
import MatterLedger from "@/components/billing/MatterLedger";
import InvoiceForm from "@/components/forms/InvoiceForm";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useCase, useUpdateCase, useSyncECourts, useAddParty, useDeleteParty, useAddOrder, useDeleteOrder } from "@/lib/hooks/useCases";
import { useUploadDocument, useRequestESign } from "@/lib/hooks/useDocuments";
import { useCreateDraft, useDraft } from "@/lib/hooks/useDrafts";
import { useMyLetterhead } from "@/lib/hooks/useLetterhead";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import {
  useFilings,
  useCreateFiling,
  useUpdateFiling,
  useDeleteFiling,
  useCaseNotes,
  useCreateNote,
  useDeleteNote,
} from "@/lib/hooks/useFilings";
import {
  useAdvocates,
  useCaseTeam,
  useAssignAdvocate,
  useRemoveAdvocate,
  useCaseTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useCaseTimeline,
  useCaseFamily,
  useCreateAppeal,
} from "@/lib/hooks/useCaseTeam";
import { useClient } from "@/lib/hooks/useClients";
import { useEvidenceTimeline, useEvidenceChecklist, useGenerateFilingPackage, EvidenceDocument, ChecklistItem } from "@/lib/hooks/useEvidence";
import { useWitnesses, useCreateWitness, useDeleteWitness, Witness } from "@/lib/hooks/useWitnesses";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TabType =
  | "overview"
  | "hearings"
  | "timeline"
  | "parties"
  | "appeals"
  | "orders"
  | "documents"
  | "evidence"
  | "drafts"
  | "notices"
  | "case_laws"
  | "arguments"
  | "sections"
  | "filings"
  | "billing"
  | "notes"
  | "invoices"
  | "team";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  urgent: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  stayed: "bg-blue-50 text-blue-700",
  closed: "bg-gray-100 text-gray-600",
};

const HEARING_STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  scheduled: <Clock className="w-4 h-4 text-amber-500" />,
  adjourned: <AlertCircle className="w-4 h-4 text-orange-500" />,
  cancelled: <AlertCircle className="w-4 h-4 text-red-400" />,
};

const FILING_STATUS_COLORS: Record<string, string> = {
  not_ready: "bg-gray-100 text-gray-500",
  ready: "bg-blue-50 text-blue-700",
  filed: "bg-green-50 text-green-700",
  defect_raised: "bg-red-50 text-red-700",
  defect_resolved: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
};

const FILING_STATUS_LABELS: Record<string, string> = {
  not_ready: "Not Ready",
  ready: "Ready to File",
  filed: "Filed",
  defect_raised: "Defect Raised",
  defect_resolved: "Defect Resolved",
  accepted: "Accepted",
};

function DocIcon({ type }: { type: string }) {
  if (type === "photo") return <ImageIcon className="w-4 h-4 text-blue-500" />;
  if (type === "video") return <Video className="w-4 h-4 text-purple-500" />;
  if (type === "audio") return <Music className="w-4 h-4 text-green-500" />;
  return <FileText className="w-4 h-4 text-gray-400" />;
}

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: caseData, isLoading, error } = useCase(id);
  const { data: clientData } = useClient(caseData?.client_id || "");
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showEdit, setShowEdit] = useState(false);
  const [showAddHearing, setShowAddHearing] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddFiling, setShowAddFiling] = useState(false);
  const [deleteFiling, setDeleteFiling] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("general");
  const [deleteNote, setDeleteNote] = useState<string | null>(null);

  const { data: filingsData } = useFilings({ case_id: id });
  const { data: notesData } = useCaseNotes(id);
  const createFiling = useCreateFiling();
  const updateFiling = useUpdateFiling();
  const deletingFiling = useDeleteFiling();
  const createNote = useCreateNote();
  const deletingNote = useDeleteNote();

  const [printDraftId, setPrintDraftId] = useState("");
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const { data: printDraftData } = useDraft(printDraftId);
  const { data: myLetterhead } = useMyLetterhead();

  const [printContent, setPrintContent] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab as TabType);
    }
  }, [searchParams]);

  useEffect(() => {
    if (printDraftData) {
      setPrintContent(printDraftData.content || "");
    }
  }, [printDraftData]);

  const handleDownloadDocument = async (docId: string) => {
    try {
      const response = await api.get(`/documents/${docId}/download`);
      if (response.data && response.data.download_url) {
        window.open(response.data.download_url, "_blank");
      } else {
        toast.error("Failed to retrieve document download link");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error retrieving document download link");
    }
  };

  const handlePrintTab = () => {
    if (!caseData) return;
    let content = `CASE REPORT: ${activeTab.toUpperCase()}\n`;
    content += `========================================\n`;
    content += `Case Title: ${caseData.title}\n`;
    content += `Case No: ${caseData.case_no}\n`;
    content += `Court: ${caseData.court}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n\n`;

    if (activeTab === "overview") {
      content += `CASE OVERVIEW:\n`;
      content += `----------------------------------------\n`;
      content += `Status: ${caseData.status}\n`;
      content += `Stage: ${caseData.stage || "N/A"}\n`;
      content += `Description: ${caseData.description || "N/A"}\n`;
      content += `Filing Date: ${caseData.filing_date || "N/A"}\n`;
      content += `Petitioner: ${caseData.petitioner || "N/A"}\n`;
      content += `Respondent: ${caseData.respondent || "N/A"}\n`;
      content += `Opposing Counsel: ${caseData.opposing_counsel || "N/A"}\n`;
    } else if (activeTab === "hearings") {
      content += `HEARINGS LIST:\n`;
      content += `----------------------------------------\n`;
      if (!caseData.hearings || caseData.hearings.length === 0) {
        content += `No hearings scheduled.\n`;
      } else {
        caseData.hearings.forEach((h: any, i: number) => {
          content += `${i + 1}. Date: ${h.hearing_date} ${h.hearing_time || ""}\n`;
          content += `   Purpose: ${h.purpose || "N/A"}\n`;
          content += `   Court/Room: ${h.court || "N/A"} - Room ${h.courtroom || "N/A"}\n`;
          if (h.order_passed) content += `   Order Passed: ${h.order_passed}\n`;
          if (h.notes) content += `   Notes: ${h.notes}\n`;
          content += `\n`;
        });
      }
    } else if (activeTab === "case_laws") {
      content += `CASE LAWS DATABASE:\n`;
      content += `----------------------------------------\n`;
      const caseLaws = caseData.case_laws || [];
      if (caseLaws.length === 0) {
        content += `No case laws linked.\n`;
      } else {
        caseLaws.forEach((cl: any, i: number) => {
          content += `${i + 1}. Title: ${cl.title}\n`;
          content += `   Citation: ${cl.citation}\n`;
          if (cl.court) content += `   Court: ${cl.court}\n`;
          if (cl.notes) content += `   Notes: ${cl.notes}\n`;
          content += `\n`;
        });
      }
    } else if (activeTab === "arguments") {
      content += `ARGUMENTS & STRATEGY:\n`;
      content += `----------------------------------------\n`;
      const args = caseData.arguments || [];
      if (args.length === 0) {
        content += `No arguments recorded.\n`;
      } else {
        args.forEach((arg: any, i: number) => {
          content += `${i + 1}. Issue: ${arg.issue}\n`;
          if (arg.sections) content += `   Sections: ${arg.sections}\n`;
          if (arg.case_laws) content += `   Case Laws: ${arg.case_laws}\n`;
          if (arg.evidence) content += `   Evidence: ${arg.evidence}\n`;
          if (arg.strategy) content += `   Strategy: ${arg.strategy}\n`;
          content += `\n`;
        });
      }
    } else if (activeTab === "orders") {
      content += `COURT ORDERS & COMPLIANCE:\n`;
      content += `----------------------------------------\n`;
      const orders = caseData.orders || [];
      if (orders.length === 0) {
        content += `No court orders recorded.\n`;
      } else {
        orders.forEach((o: any, i: number) => {
          content += `${i + 1}. Title: ${o.title}\n`;
          content += `   Order Date: ${o.order_date}\n`;
          content += `   Type: ${o.order_type}\n`;
          content += `   Compliance Due: ${o.compliance_due_date || "N/A"}\n`;
          content += `   Status: ${o.compliance_status}\n`;
          if (o.notes) content += `   Notes: ${o.notes}\n`;
          content += `\n`;
        });
      }
    } else if (activeTab === "billing") {
      content += `BILLING & ACCOUNT LEDGER:\n`;
      content += `----------------------------------------\n`;
      content += `Total Agreed Fees: INR ${caseData.fees_agreed || 0}\n`;
      content += `Total Received Fees: INR ${caseData.fees_received || 0}\n`;
      content += `Balance Outstanding: INR ${(caseData.fees_agreed || 0) - (caseData.fees_received || 0)}\n\n`;
      content += `Invoices / Payments:\n`;
      const invoices = caseData.invoices || [];
      if (invoices.length === 0) {
        content += `No invoices found.\n`;
      } else {
        invoices.forEach((inv: any, i: number) => {
          content += `${i + 1}. Invoice No: ${inv.invoice_number}\n`;
          content += `   Amount: INR ${inv.amount}\n`;
          content += `   Status: ${inv.status}\n`;
          content += `   Due Date: ${inv.due_date}\n`;
          content += `\n`;
        });
      }
    } else {
      content += `Display handler not configured for active section.\n`;
    }

    setPrintContent(content);
    setPrintDraftId("");
    setShowPrintPreview(true);
  };

  // Team, Tasks, Timeline, Appeals hooks
  const { data: teamData } = useCaseTeam(id);
  const { data: tasksData } = useCaseTasks(id);
  const { data: timelineData } = useCaseTimeline(id);
  const { data: familyData } = useCaseFamily(id);
  const { data: advocatesData } = useAdvocates();
  const assignAdvocate = useAssignAdvocate(id);
  const removeAdvocate = useRemoveAdvocate(id);
  const createTask = useCreateTask(id);
  const updateTask = useUpdateTask(id);
  const deleteTask = useDeleteTask(id);
  const createAppeal = useCreateAppeal(id);

  // Team UI state
  const [showAssignAdvocate, setShowAssignAdvocate] = useState(false);
  const [assignAdvocateId, setAssignAdvocateId] = useState("");
  const [assignRole, setAssignRole] = useState("junior");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [partyForm, setPartyForm] = useState({ name: "", party_type: "Respondent", advocate_name: "", mobile: "", email: "", address: "" });
  const [taskType, setTaskType] = useState("other");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [taskDesc, setTaskDesc] = useState("");
  const [removeAdvocateId, setRemoveAdvocateId] = useState<string | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [showCreateAppeal, setShowCreateAppeal] = useState(false);
  const [appealCaseNo, setAppealCaseNo] = useState("");
  const [appealTitle, setAppealTitle] = useState("");
  const [appealCourt, setAppealCourt] = useState("");
  const [appealForum, setAppealForum] = useState("");
  const [appealType, setAppealType] = useState("appeal");
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // New filing form state
  const [filingTitle, setFilingTitle] = useState("");
  const [filingType, setFilingType] = useState("");
  const [courtFee, setCourtFee] = useState("");
  const [stampDuty, setStampDuty] = useState("");
  const [eStampRef, setEStampRef] = useState("");

  const updateCase = useUpdateCase();
  const syncECourts = useSyncECourts();

  // Case Law Form State
  const [showAddCaseLaw, setShowAddCaseLaw] = useState(false);
  const [caseLawTitle, setCaseLawTitle] = useState("");
  const [caseLawCitation, setCaseLawCitation] = useState("");
  const [caseLawCourt, setCaseLawCourt] = useState("");
  const [caseLawNotes, setCaseLawNotes] = useState("");

  // Argument Form State
  const [showAddArgument, setShowAddArgument] = useState(false);
  const [argIssue, setArgIssue] = useState("");
  const [argSections, setArgSections] = useState("");
  const [argCaseLaws, setArgCaseLaws] = useState("");
  const [argEvidence, setArgEvidence] = useState("");
  const [argStrategy, setArgStrategy] = useState("");

  // Document & Evidence Form State
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [uploadType, setUploadType] = useState<"document" | "evidence">("document");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docDescription, setDocDescription] = useState("");
  const uploadDocMutation = useUploadDocument();
  const requestESignMutation = useRequestESign();

  // Draft Form State
  const [showAddDraft, setShowAddDraft] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftCategory, setDraftCategory] = useState("Notice");
  const createDraftMutation = useCreateDraft();

  // Evidence & Witness Hooks
  const { data: evidenceTimelineData } = useEvidenceTimeline(id as string);
  const { data: checklistData } = useEvidenceChecklist(id as string);
  const { data: witnessesData } = useWitnesses(id as string);
  const generatePackageMutation = useGenerateFilingPackage(id as string);
  const createWitnessMutation = useCreateWitness(id as string);
  const deleteWitnessMutation = useDeleteWitness(id as string);
  const addPartyMutation = useAddParty(id as string);
  const deletePartyMutation = useDeleteParty(id as string);
  const addOrderMutation = useAddOrder(id as string);
  const deleteOrderMutation = useDeleteOrder(id as string);

  const [showAddWitness, setShowAddWitness] = useState(false);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [witnessName, setWitnessName] = useState("");
  const [witnessAddress, setWitnessAddress] = useState("");
  const [witnessMobile, setWitnessMobile] = useState("");
  const [witnessStatement, setWitnessStatement] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceDocument | null>(null);

  if (isLoading)
    return (
      <div className="flex flex-col h-full bg-[#F7F8F6]">
        <Header title="Loading..." subtitle="" />
        <div className="p-6">
          <FormSkeleton />
        </div>
      </div>
    );

  if (error || !caseData)
    return (
      <div className="flex flex-col h-full bg-[#F7F8F6]">
        <Header title="Case not found" subtitle="" />
        <div className="p-6 text-center">
          <p className="text-gray-500 text-sm">Could not load case.</p>
          <button
            onClick={() => router.back()}
            className="mt-3 text-sidebar text-sm font-medium hover:underline"
          >
            ← Go back
          </button>
        </div>
      </div>
    );

  const feePct =
    caseData.fees_agreed > 0
      ? Math.min(
          100,
          Math.round((caseData.fees_received / caseData.fees_agreed) * 100),
        )
      : 0;

  const allDocs = caseData.documents || [];
  const documents = allDocs.filter((d) => !d.is_evidence);
  const evidence = allDocs.filter((d) => d.is_evidence);
  const orders = (caseData.hearings || []).filter((h) => h.order_passed);
  const filings = filingsData?.filings || [];
  const notes = notesData?.notes || [];
  const teamActive = teamData?.active || [];
  const tasks = tasksData?.tasks || [];
  const advocates = advocatesData?.advocates || [];

  const notices = caseData.drafts?.filter((d) => d.category === "Notice") || [];

  const TAB_GROUPS = [
    {
      group: "CASE MANAGEMENT",
      items: [
        { key: "overview", label: "Overview" },
        {
          key: "hearings",
          label: "Hearings",
          count: caseData.hearings?.length || 0,
        },
        { key: "timeline", label: "Timeline" },
        { key: "parties", label: "Parties", count: caseData.parties?.length || 0 },
        { key: "appeals", label: "Appeals" },
        { key: "orders", label: "Court Orders", count: caseData.orders?.length || 0 },
      ],
    },
    {
      group: "DOCUMENTS",
      items: [
        { key: "documents", label: "Documents", count: documents.length },
        { key: "evidence", label: "Evidence", count: evidence.length },
        { key: "drafts", label: "Drafts", count: caseData.drafts?.length || 0 },
        { key: "notices", label: "Notices", count: notices.length },
      ],
    },
    {
      group: "LEGAL WORK",
      items: [
        {
          key: "case_laws",
          label: "Case Laws",
          count: caseData.case_laws?.length || 0,
        },
        {
          key: "arguments",
          label: "Arguments",
          count: caseData.arguments?.length || 0,
        },
        {
          key: "sections",
          label: "Sections",
          count: caseData.sections_involved?.length || 0,
        },
      ],
    },
    {
      group: "FILING",
      items: [
        { key: "filings", label: "E-Filing" },
        { key: "orders", label: "Orders", count: orders.length },
        {
          key: "billing",
          label: "Billing & Ledger",
        },
      ],
    },
  ];

  const handleAssignAdvocate = async () => {
    if (!assignAdvocateId) return;
    await assignAdvocate.mutateAsync({
      advocate_id: assignAdvocateId,
      role: assignRole,
    });
    setAssignAdvocateId("");
    setShowAssignAdvocate(false);
  };

  const handleAddParty = async () => {
    if (!partyForm.name) {
      toast.error("Party name is required");
      return;
    }
    await addPartyMutation.mutateAsync(partyForm as any);
    setShowPartyModal(false);
    setPartyForm({ name: "", party_type: "Respondent", advocate_name: "", mobile: "", email: "", address: "" });
  };

  const handleCreateTask = async () => {
    if (!taskTitle) return;
    await createTask.mutateAsync({
      title: taskTitle,
      task_type: taskType,
      assignee_id: taskAssigneeId || undefined,
      deadline: taskDeadline || undefined,
      priority: taskPriority,
      description: taskDesc || undefined,
    });
    setTaskTitle("");
    setTaskType("other");
    setTaskAssigneeId("");
    setTaskDeadline("");
    setTaskDesc("");
    setShowCreateTask(false);
  };

  const handleCreateAppeal = async () => {
    if (!appealCaseNo || !appealTitle || !appealCourt) return;
    const result = await createAppeal.mutateAsync({
      case_no: appealCaseNo,
      title: appealTitle,
      court: appealCourt,
      forum: appealForum || undefined,
      appeal_type: appealType,
    });
    router.push(`/cases/${result.id}`);
  };

  const handleCreateFiling = async () => {
    if (!filingTitle) return;
    await createFiling.mutateAsync({
      case_id: id,
      title: filingTitle,
      filing_type: filingType || undefined,
      court_fee: courtFee ? parseFloat(courtFee) : 0,
      stamp_duty: stampDuty ? parseFloat(stampDuty) : 0,
      estamp_reference: eStampRef || undefined,
    });
    setFilingTitle("");
    setFilingType("");
    setCourtFee("");
    setStampDuty("");
    setEStampRef("");
    setShowAddFiling(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await createNote.mutateAsync({
      case_id: id,
      content: newNote.trim(),
      note_type: noteType,
    });
    setNewNote("");
  };

  const handleAddCaseLaw = async () => {
    if (!caseLawTitle || !caseLawCitation) return;
    const currentCaseLaws = caseData?.case_laws || [];
    const newCaseLaw = {
      title: caseLawTitle,
      citation: caseLawCitation,
      court: caseLawCourt,
      notes: caseLawNotes,
    };
    await updateCase.mutateAsync({
      id,
      case_laws: [newCaseLaw, ...currentCaseLaws],
    });
    setCaseLawTitle("");
    setCaseLawCitation("");
    setCaseLawCourt("");
    setCaseLawNotes("");
    setShowAddCaseLaw(false);
  };

  const handleAddArgument = async () => {
    if (!argIssue) return;
    const currentArgs = caseData?.arguments || [];
    const newArg = {
      issue: argIssue,
      sections: argSections,
      case_laws: argCaseLaws,
      evidence: argEvidence,
      strategy: argStrategy,
    };
    await updateCase.mutateAsync({ id, arguments: [newArg, ...currentArgs] });
    setArgIssue("");
    setArgSections("");
    setArgCaseLaws("");
    setArgEvidence("");
    setArgStrategy("");
    setShowAddArgument(false);
  };

  const handleUploadDoc = async () => {
    if (!docFile) return;
    try {
      await uploadDocMutation.mutateAsync({
        file: docFile,
        case_id: id as string,
        client_id: caseData.client_id,
        doc_type: uploadType === "evidence" ? "evidence" : "other",
        description: docDescription,
      });
      setShowUploadDoc(false);
      setDocFile(null);
      setDocDescription("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDraft = async () => {
    if (!draftTitle || !draftContent) return;
    try {
      await createDraftMutation.mutateAsync({
        title: draftTitle,
        content: draftContent,
        category: draftCategory,
        case_id: id as string,
        client_id: caseData.client_id,
      });
      setShowAddDraft(false);
      setDraftTitle("");
      setDraftContent("");
      setDraftCategory("Notice");
      // Trigger a refetch of the case to update drafts list
      // refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6] print:bg-white">
      <div className={cn("flex flex-col flex-1", showPrintPreview && "print:hidden")}>
        <div className="print:hidden">
          <Header title={caseData.case_no} subtitle={caseData.title} />

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-2 border-b border-gray-100 overflow-x-auto bg-white print:hidden">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2">
            Quick Actions:
          </span>
          <button
            onClick={() => setShowAddDraft(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
          >
            <FileText className="w-3.5 h-3.5" /> Create Draft
          </button>
          <button
            onClick={() => {
              setUploadType("document");
              setShowUploadDoc(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Upload Doc
          </button>
          <button
            onClick={() => {
              setUploadType("evidence");
              setShowUploadDoc(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
          >
            <Video className="w-3.5 h-3.5" /> Upload Evidence
          </button>
          <button
            onClick={() => setShowAddCaseLaw(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
          >
            <Gavel className="w-3.5 h-3.5" /> Add Case Law
          </button>
          <button
            onClick={() => setShowAddArgument(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" /> Add Argument
          </button>
          <button
            onClick={() => setShowAddHearing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" /> Add Hearing
          </button>
          <button
            onClick={() => setShowAddFiling(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Prepare Filing
          </button>
          {caseData.ecourts_cnr && (
            <button
              onClick={() => syncECourts.mutate(id as string)}
              disabled={syncECourts.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ml-auto"
            >
              <Activity className={`w-3.5 h-3.5 ${syncECourts.isPending ? 'animate-spin' : ''}`} /> 
              {syncECourts.isPending ? "Syncing..." : "Sync with e-Courts"}
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 print:p-0 print:overflow-visible">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 print:hidden"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cases
        </button>

        <div className="grid grid-cols-3 print:flex print:flex-col gap-5 print:gap-0">
          {/* Left: Case info */}
          <div className="col-span-1 space-y-4 print:hidden">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between mb-4">
                <span
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-semibold",
                    STATUS_COLORS[caseData.status] ||
                      "bg-gray-100 text-gray-600",
                  )}
                >
                  {caseData.status.toUpperCase()}
                </span>
                <button
                  onClick={() => setShowEdit(true)}
                  className="p-2 rounded-lg text-gray-400 hover:text-sidebar hover:bg-sidebar/5"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <h2 className="font-semibold text-gray-900 text-sm mb-3">
                {caseData.title}
              </h2>
              {caseData.description && (
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  {caseData.description}
                </p>
              )}
              <div className="space-y-2.5 text-sm">
                <InfoRow
                  label="Case No."
                  value={
                    <span className="font-mono text-xs">
                      {caseData.case_no}
                    </span>
                  }
                />
                <InfoRow label="Court" value={caseData.court} />
                {caseData.judge && (
                  <InfoRow label="Judge" value={caseData.judge} />
                )}
                {caseData.bench && (
                  <InfoRow label="Bench" value={caseData.bench} />
                )}
                <InfoRow label="Practice Area" value={caseData.practice_area} />
                <InfoRow label="Stage" value={caseData.stage} />
                <InfoRow label="Priority" value={caseData.priority} />
                {caseData.petitioner && (
                  <InfoRow label="Petitioner" value={caseData.petitioner} />
                )}
                {caseData.respondent && (
                  <InfoRow label="Respondent" value={caseData.respondent} />
                )}
                {caseData.opposing_counsel && (
                  <InfoRow
                    label="Opp. Counsel"
                    value={caseData.opposing_counsel}
                  />
                )}
                {caseData.case_type && (
                  <InfoRow label="Case Type" value={caseData.case_type} />
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Key Dates
              </h3>
              <div className="space-y-2 text-sm">
                {caseData.filing_date && (
                  <InfoRow label="Filing Date" value={caseData.filing_date} />
                )}
                {caseData.next_hearing_date && (
                  <InfoRow
                    label="Next Hearing"
                    value={
                      <span className="text-amber-600 font-medium">
                        {caseData.next_hearing_date}
                      </span>
                    }
                  />
                )}
                {caseData.limitation_date && (
                  <InfoRow
                    label="Limitation"
                    value={
                      <span className="text-red-600 font-medium">
                        {caseData.limitation_date}
                      </span>
                    }
                  />
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Fees
                </h3>
                <button
                  onClick={() => setShowEdit(true)}
                  className="text-xs text-sidebar hover:underline"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <InfoRow
                  label="Agreed"
                  value={`₹${caseData.fees_agreed.toLocaleString("en-IN")}`}
                />
                <InfoRow
                  label="Received"
                  value={
                    <span className="text-green-600 font-medium">
                      ₹{caseData.fees_received.toLocaleString("en-IN")}
                    </span>
                  }
                />
                <InfoRow
                  label="Balance"
                  value={
                    <span className="text-amber-600 font-medium">
                      ₹
                      {(
                        caseData.fees_agreed - caseData.fees_received
                      ).toLocaleString("en-IN")}
                    </span>
                  }
                />
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Collection</span>
                  <span>{feePct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-mint rounded-full"
                    style={{ width: `${feePct}%` }}
                  />
                </div>
              </div>
            </div>

            {caseData.client_name && (
              <button
                onClick={() => router.push(`/clients/${caseData.client_id}`)}
                className="w-full flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 hover:border-sidebar/30 group"
              >
                <div>
                  <div className="text-xs text-gray-500">Client</div>
                  <div className="font-medium text-gray-900 text-sm">
                    {caseData.client_name}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-sidebar" />
              </button>
            )}
          </div>

          {/* Right: 8 tabs */}
          <div className="col-span-2 print:col-span-3 space-y-4 print:space-y-0">
            {/* Tab bar grouped */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-4 print:hidden">
              {TAB_GROUPS.map((group) => (
                <div key={group.group}>
                  <div className="text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                    {group.group}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as TabType)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-sm font-medium transition-colors",
                          activeTab === tab.key
                            ? "bg-sidebar text-white shadow-sm"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
                        )}
                      >
                        {tab.label}
                        {tab.count !== undefined && (
                          <span
                            className={cn(
                              "ml-1.5 text-[10px] rounded-full px-1.5 py-0.5",
                              activeTab === tab.key
                                ? "bg-white/20 text-white"
                                : "bg-gray-100 text-gray-500",
                            )}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={handlePrintTab}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-sidebar transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Tab
                </button>
                {/* Action button per tab */}
                {activeTab === "hearings" && (
                  <button
                    onClick={() => setShowAddHearing(true)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-mint/10 px-3 py-2 text-sm font-medium text-sidebar hover:bg-mint/20"
                  >
                    <Plus className="w-4 h-4" /> Schedule
                  </button>
                )}
                {activeTab === "billing" && (
                  <button
                    onClick={() => setShowAddInvoice(true)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-mint/10 px-3 py-2 text-sm font-medium text-sidebar hover:bg-mint/20"
                  >
                    <Plus className="w-4 h-4" /> Create Invoice
                  </button>
                )}
                {activeTab === "team" && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => setShowCreateTask(true)}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="w-4 h-4" /> Task
                    </button>
                    <button
                      onClick={() => setShowAssignAdvocate(true)}
                      className="flex items-center gap-1.5 rounded-xl bg-mint/10 px-3 py-2 text-sm font-medium text-sidebar hover:bg-mint/20"
                    >
                      <UserPlus className="w-4 h-4" /> Assign Advocate
                    </button>
                  </div>
                )}
                {activeTab === "appeals" && (
                  <button
                    onClick={() => setShowCreateAppeal(true)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-mint/10 px-3 py-2 text-sm font-medium text-sidebar hover:bg-mint/20"
                  >
                    <GitBranch className="w-4 h-4" /> File Appeal
                  </button>
                )}
                {activeTab === "documents" && (
                  <button
                    onClick={() => {
                      setUploadType("document");
                      setShowUploadDoc(true);
                    }}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-sidebar px-3 py-2 text-sm font-medium text-white hover:bg-sidebar-dark shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Upload Document
                  </button>
                )}
                {activeTab === "evidence" && (
                  <button
                    onClick={() => {
                      setUploadType("evidence");
                      setShowUploadDoc(true);
                    }}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-sidebar px-3 py-2 text-sm font-medium text-white hover:bg-sidebar-dark shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Upload Evidence
                  </button>
                )}
                {activeTab === "drafts" && (
                  <button
                    onClick={() => setShowAddDraft(true)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-sidebar px-3 py-2 text-sm font-medium text-white hover:bg-sidebar-dark shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Draft
                  </button>
                )}
                {activeTab === "notices" && (
                  <button
                    onClick={() => {
                      setDraftCategory("Notice");
                      setShowAddDraft(true);
                    }}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-sidebar px-3 py-2 text-sm font-medium text-white hover:bg-sidebar-dark shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Create Notice
                  </button>
                )}
                {activeTab === "orders" && (
                  <button
                    onClick={() => setShowAddHearing(true)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl bg-sidebar px-3 py-2 text-sm font-medium text-white hover:bg-sidebar-dark shadow-sm transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Record Order
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden min-h-[400px]">
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div className="p-5 space-y-6 bg-gray-50/50">
                  {/* CLIENT SUMMARY CARD */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-sidebar" /> Client
                        Summary
                      </h3>
                      {clientData && (
                        <button
                          onClick={() =>
                            router.push(`/clients/${clientData.id}`)
                          }
                          className="text-xs font-semibold text-sidebar hover:underline"
                        >
                          View Full Profile
                        </button>
                      )}
                    </div>
                    {clientData ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                            Name
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {clientData.name}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                            Phone
                          </div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />{" "}
                            {clientData.phone || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                            Email
                          </div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />{" "}
                            {clientData.email || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1">
                            Identity
                          </div>
                          <div className="text-xs text-gray-700 flex flex-col gap-1">
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-gray-400" /> PAN:{" "}
                              {(clientData as any).pan_number || "—"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-gray-400" />{" "}
                              Aadhaar: {(clientData as any).aadhaar_number || "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">
                        Loading client data...
                      </div>
                    )}
                  </div>

                  {/* MATTER PROGRESS & FILING READINESS */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-mint" /> Matter
                        Progress
                      </h3>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">
                            {documents.length}
                          </div>
                          <div className="text-xs font-semibold text-gray-500">
                            Documents Uploaded
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">
                            {evidence.length}
                          </div>
                          <div className="text-xs font-semibold text-gray-500">
                            Evidence Uploaded
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">
                            {caseData.drafts?.length || 0}
                          </div>
                          <div className="text-xs font-semibold text-gray-500">
                            Drafts Completed
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xl font-bold text-gray-900">
                            {caseData.hearings?.length || 0}
                          </div>
                          <div className="text-xs font-semibold text-gray-500">
                            Hearings Scheduled
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4 text-blue-500" /> Filing
                          Readiness
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">
                          Based on critical documents and drafts present.
                        </p>

                        {(() => {
                          let score = 20; // Base score
                          const hasVakalatnama = caseData.drafts?.some(
                            (d) =>
                              d.title?.toLowerCase().includes("vakalatnama") ||
                              d.category?.toLowerCase() === "vakalatnama",
                          );
                          const hasAffidavit = caseData.drafts?.some((d) =>
                            d.title?.toLowerCase().includes("affidavit"),
                          );
                          const hasEvidence = evidence.length > 0;
                          const hasIdentity = documents.some(
                            (d) =>
                              d.name?.toLowerCase().includes("aadhaar") ||
                              d.name?.toLowerCase().includes("pan"),
                          );

                          if (hasVakalatnama) score += 30;
                          if (hasAffidavit) score += 20;
                          if (hasEvidence) score += 15;
                          if (hasIdentity) score += 15;

                          return (
                            <>
                              <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-black text-gray-900">
                                  {score}%
                                </span>
                                <span className="text-xs font-semibold text-gray-500 uppercase">
                                  Ready
                                </span>
                              </div>
                              <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    score > 80
                                      ? "bg-green-500"
                                      : score > 50
                                        ? "bg-amber-400"
                                        : "bg-red-400",
                                  )}
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>

                              <div className="space-y-1.5">
                                {!hasVakalatnama && (
                                  <div className="text-xs text-red-600 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3" /> Missing
                                    Vakalatnama
                                  </div>
                                )}
                                {!hasAffidavit && (
                                  <div className="text-xs text-red-600 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3" /> Missing
                                    Affidavit
                                  </div>
                                )}
                                {!hasIdentity && (
                                  <div className="text-xs text-amber-600 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3" /> Missing
                                    Client ID Proof
                                  </div>
                                )}
                                {!hasEvidence && (
                                  <div className="text-xs text-amber-600 flex items-center gap-1.5">
                                    <AlertCircle className="w-3 h-3" /> No
                                    Evidence Uploaded
                                  </div>
                                )}
                                {score === 100 && (
                                  <div className="text-xs text-green-600 flex items-center gap-1.5">
                                    <CheckCircle className="w-3 h-3" /> Ready
                                    for filing
                                  </div>
                                )}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* EVIDENCE SUMMARY & LEGAL WORK SUMMARY */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-purple-500" />{" "}
                        Evidence Summary
                      </h3>
                      {(() => {
                        const photos = evidence.filter(
                          (e) => e.doc_type === "photo",
                        ).length;
                        const videos = evidence.filter(
                          (e) => e.doc_type === "video",
                        ).length;
                        const audio = evidence.filter(
                          (e) => e.doc_type === "audio",
                        ).length;
                        const pdfs = evidence.filter(
                          (e) => e.doc_type === "document",
                        ).length;
                        return (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <ImageIcon className="w-5 h-5 text-blue-500" />
                              <div>
                                <div className="text-sm font-bold">
                                  {photos}
                                </div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                                  Photos
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Video className="w-5 h-5 text-purple-500" />
                              <div>
                                <div className="text-sm font-bold">
                                  {videos}
                                </div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                                  Videos
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <FileText className="w-5 h-5 text-red-500" />
                              <div>
                                <div className="text-sm font-bold">{pdfs}</div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                                  PDFs/Docs
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Music className="w-5 h-5 text-green-500" />
                              <div>
                                <div className="text-sm font-bold">{audio}</div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase">
                                  Audio
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                      <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-amber-600" /> Legal Work
                        Summary
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {caseData.case_laws?.length || 0}
                            </div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase">
                              Case Laws Added
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("case_laws")}
                            className="text-xs text-sidebar font-semibold hover:underline"
                          >
                            View
                          </button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-bold text-gray-900">
                              {caseData.arguments?.length || 0}
                            </div>
                            <div className="text-[10px] font-semibold text-gray-500 uppercase">
                              Arguments Drafted
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("arguments")}
                            className="text-xs text-sidebar font-semibold hover:underline"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* APPLICABLE SECTIONS PANEL */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-gray-700" /> Applicable
                      Acts & Sections
                    </h3>
                    {caseData.acts_involved?.length ||
                    caseData.sections_involved?.length ? (
                      <div className="space-y-4">
                        {caseData.acts_involved?.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                              Acts
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {caseData.acts_involved.map((a) => (
                                <span
                                  key={a}
                                  className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {caseData.sections_involved?.length > 0 && (
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
                              Sections
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {caseData.sections_involved.map((s) => (
                                <span
                                  key={s}
                                  className="text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1"
                                >
                                  Section {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 py-4 text-center border border-dashed border-gray-200 rounded-lg">
                        No acts or sections added yet.
                      </div>
                    )}
                  </div>

                  {/* EXISTING CASE INFO DETAILS (Moved to bottom of overview) */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4">
                      Matter Details
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Case Number", value: caseData.case_no },
                        { label: "Court Name", value: caseData.court },
                        { label: "Judge Name", value: caseData.judge || "—" },
                        {
                          label: "Practice Area",
                          value: caseData.practice_area,
                        },
                        { label: "Current Status", value: caseData.status },
                        { label: "Current Stage", value: caseData.stage },
                        {
                          label: "Petitioner",
                          value: caseData.petitioner || "—",
                        },
                        {
                          label: "Respondent",
                          value: caseData.respondent || "—",
                        },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-lg p-3">
                          <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">
                            {label}
                          </div>
                          <div className="font-medium text-gray-900 text-sm">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* HEARINGS */}
              {activeTab === "hearings" &&
                (!caseData.hearings?.length ? (
                  <EmptyTab
                    icon={Calendar}
                    label="No hearings scheduled"
                    action="Schedule first hearing"
                    onAction={() => setShowAddHearing(true)}
                  />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {caseData.hearings.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-start gap-3 px-5 py-4 group hover:bg-gray-50 transition-colors"
                      >
                        <div className="mt-0.5">
                          {HEARING_STATUS_ICON[h.status] || (
                            <Clock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-gray-900">
                              {h.hearing_date}
                            </span>
                            {h.hearing_time && (
                              <span className="text-xs text-gray-500">
                                {h.hearing_time}
                              </span>
                            )}
                            {h.purpose && (
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                                {h.purpose}
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full ml-auto font-medium",
                                h.status === "completed"
                                  ? "bg-green-50 text-green-700"
                                  : h.status === "adjourned"
                                    ? "bg-orange-50 text-orange-700"
                                    : "bg-amber-50 text-amber-700",
                              )}
                            >
                              {h.status}
                            </span>
                          </div>
                          {h.court && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {h.court}
                              {h.courtroom ? ` · ${h.courtroom}` : ""}
                            </p>
                          )}
                          {h.judge && (
                            <p className="text-xs text-gray-500">{h.judge}</p>
                          )}
                          {h.notes && (
                            <p className="text-xs text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">
                              {h.notes}
                            </p>
                          )}
                          {h.order_passed && (
                            <p className="text-xs text-sidebar mt-1 bg-sidebar/5 rounded-lg px-3 py-2">
                              <span className="font-medium">Order: </span>
                              {h.order_passed}
                            </p>
                          )}
                          {h.next_date && (
                            <p className="text-xs text-amber-600 mt-1">
                              Next date: {h.next_date}
                              {h.next_purpose ? ` (${h.next_purpose})` : ""}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            let text = `HEARING DETAIL REPORT\n`;
                            text += `========================================\n`;
                            text += `Case Title: ${caseData.title}\n`;
                            text += `Case No: ${caseData.case_no}\n\n`;
                            text += `Hearing Date: ${h.hearing_date}\n`;
                            if (h.hearing_time) text += `Hearing Time: ${h.hearing_time}\n`;
                            if (h.purpose) text += `Purpose: ${h.purpose}\n`;
                            if (h.court) text += `Court: ${h.court}\n`;
                            if (h.courtroom) text += `Courtroom: ${h.courtroom}\n`;
                            if (h.judge) text += `Judge: ${h.judge}\n`;
                            if (h.attended_by) text += `Attended By: ${h.attended_by}\n`;
                            if (h.notes) text += `\nHearing Notes:\n${h.notes}\n`;
                            if (h.order_passed) text += `\nOrder Passed:\n${h.order_passed}\n`;
                            setPrintContent(text);
                            setPrintDraftId("");
                            setShowPrintPreview(true);
                          }}
                          title="Print Hearing"
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-sidebar rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              {/* DOCUMENTS */}
              {activeTab === "documents" &&
                (!documents.length ? (
                  <EmptyTab icon={FileText} label="No documents uploaded" />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {documents.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group transition-colors"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {d.name}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {d.doc_type.replace(/_/g, " ")}{" "}
                            {d.file_size
                              ? `· ${(d.file_size / 1024).toFixed(0)}KB`
                              : ""}
                          </div>
                        </div>
                        {d.description && (
                          <span className="text-xs text-gray-400">
                            {d.description}
                          </span>
                        )}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.signature_status === "pending" ? (
                            <span className="text-[11px] font-medium px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-100">
                              e-Sign Pending
                            </span>
                          ) : d.signature_status === "completed" ? (
                            <span className="text-[11px] font-medium px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100">
                              e-Signed
                            </span>
                          ) : (
                            <button
                              onClick={() => requestESignMutation.mutate(d.id)}
                              disabled={requestESignMutation.isPending}
                              title="Request e-Sign"
                              className="text-xs font-medium px-2 py-1.5 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded"
                            >
                              Request e-Sign
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadDocument(d.id)}
                            title="Download/Print Document"
                            className="p-2 text-gray-400 hover:text-sidebar rounded-lg hover:bg-white shadow-sm border border-transparent hover:border-gray-200"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {/* EVIDENCE MANAGEMENT DASHBOARD */}
              {activeTab === "evidence" && (
                <div className="flex flex-col gap-6">
                  {/* Top Actions */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-gray-900">Evidence Management</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowAddWitness(true)}
                        className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" /> Add Witness
                      </button>
                      <button
                        onClick={() => generatePackageMutation.mutate()}
                        className="bg-sidebar text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-sidebar/90 flex items-center gap-2"
                      >
                        <FolderOpen className="w-4 h-4" /> Generate Filing Package
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Timeline & Checklist */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Required Documents Checklist */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" /> Required Documents Checklist
                          </h4>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {checklistData?.checklist?.map((item) => {
                            const isUploaded = evidenceTimelineData?.timeline?.some(d => d.type === item.type);
                            return (
                              <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                  {isUploaded ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200 border-dashed" />
                                  )}
                                  <div>
                                    <span className={cn("text-sm font-medium", isUploaded ? "text-gray-900" : "text-gray-600")}>
                                      {item.name}
                                    </span>
                                    {item.required && <span className="ml-2 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase font-semibold">Required</span>}
                                  </div>
                                </div>
                                {!isUploaded && (
                                  <button
                                    onClick={() => {
                                      // Trigger file upload for this specific type (mock)
                                      const input = document.getElementById("file-upload") as HTMLInputElement;
                                      if(input) input.click();
                                    }}
                                    className="text-sidebar hover:bg-sidebar/10 p-1.5 rounded-lg transition-colors text-xs font-medium"
                                  >
                                    Upload
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Evidence Timeline */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-sidebar" /> Evidence Timeline
                          </h4>
                        </div>
                        <div className="p-5">
                          {!evidenceTimelineData?.timeline?.length ? (
                            <EmptyTab icon={ImageIcon} label="No evidence uploaded yet" />
                          ) : (
                            <div className="relative border-l-2 border-gray-100 ml-3 space-y-8">
                              {evidenceTimelineData.timeline.map((doc, idx) => (
                                <div key={doc.id} className="relative pl-6">
                                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-sidebar" />
                                  
                                  <div 
                                    className={cn(
                                      "bg-white border rounded-xl p-4 transition-all cursor-pointer hover:shadow-md",
                                      selectedEvidence?.id === doc.id ? "border-sidebar ring-1 ring-sidebar" : "border-gray-200 hover:border-gray-300"
                                    )}
                                    onClick={() => setSelectedEvidence(doc)}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{doc.date.split("T")[0]}</span>
                                        {doc.exhibit && (
                                          <span className="text-xs bg-sidebar/10 text-sidebar font-semibold px-2 py-0.5 rounded-full">
                                            {doc.exhibit}
                                          </span>
                                        )}
                                      </div>
                                      <span className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                                        doc.status === "marked_exhibit" ? "bg-green-100 text-green-700" :
                                        doc.status === "verified" ? "bg-blue-100 text-blue-700" :
                                        "bg-gray-100 text-gray-700"
                                      )}>
                                        {doc.status.replace("_", " ")}
                                      </span>
                                    </div>
                                    <h5 className="font-semibold text-gray-900 mb-1">{doc.name}</h5>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      <span className="capitalize flex items-center gap-1"><FileText className="w-3 h-3"/> {doc.type.replace(/_/g, " ")}</span>
                                      {doc.metadata && Object.keys(doc.metadata).length > 0 && (
                                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                                          <CheckCircle className="w-3 h-3" /> OCR Data
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* Right Column: OCR Metadata & Witnesses */}
                    <div className="space-y-6">
                      
                      {/* OCR Metadata Preview */}
                      {selectedEvidence ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
                          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h4 className="font-semibold text-gray-900">Extracted Metadata</h4>
                            <button onClick={() => setSelectedEvidence(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
                          </div>
                          <div className="p-5">
                            <h5 className="font-medium text-sm text-gray-900 mb-4">{selectedEvidence.name}</h5>
                            
                            {selectedEvidence.metadata && Object.keys(selectedEvidence.metadata).length > 0 ? (
                              <div className="space-y-4">
                                {Object.entries(selectedEvidence.metadata).map(([key, value]) => (
                                  <div key={key}>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">{key}</div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {Array.isArray(value) ? value.join(", ") : String(value)}
                                    </div>
                                  </div>
                                ))}
                                <div className="pt-4 mt-4 border-t border-gray-100">
                                  <button className="w-full text-center text-sm text-sidebar font-medium hover:text-sidebar/80">
                                    Edit Metadata
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-sm text-gray-500">
                                <CheckCircle className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                No OCR data extracted for this document.
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-xl border border-gray-200 border-dashed p-6 text-center text-sm text-gray-500 flex flex-col items-center justify-center">
                          <Pin className="w-8 h-8 text-gray-300 mb-2" />
                          Select an evidence document to view extracted metadata
                        </div>
                      )}

                      {/* Witnesses */}
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" /> Witnesses
                          </h4>
                          <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                            {witnessesData?.witnesses?.length || 0}
                          </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {!witnessesData?.witnesses?.length ? (
                            <div className="p-5 text-center text-sm text-gray-500">No witnesses added</div>
                          ) : (
                            witnessesData.witnesses.map(w => (
                              <div key={w.id} className="p-4 hover:bg-gray-50 group">
                                <div className="flex justify-between items-start mb-1">
                                  <h5 className="font-medium text-sm text-gray-900">{w.name}</h5>
                                  <button 
                                    onClick={() => {
                                      if(confirm("Delete witness?")) deleteWitnessMutation.mutate(w.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <div className="text-xs text-gray-500 mb-2 flex items-center gap-3">
                                  {w.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3"/> {w.mobile}</span>}
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {w.address || "No address"}</span>
                                </div>
                                {w.statement && (
                                  <div className="bg-yellow-50/50 border border-yellow-100 text-yellow-800 text-xs p-2 rounded mt-2">
                                    "{w.statement}"
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* DRAFTS */}
              {activeTab === "drafts" &&
                (!caseData.drafts?.length ? (
                  <EmptyTab icon={FileText} label="No drafts for this case" />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {caseData.drafts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group transition-colors"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {d.title}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {d.category} · {d.language}
                          </div>
                        </div>
                        {d.ai_generated && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                            AI
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setPrintDraftId(d.id);
                            setShowPrintPreview(true);
                          }}
                          title="Print Draft"
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-sidebar rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              {/* NOTICES */}
              {activeTab === "notices" &&
                (!notices.length ? (
                  <EmptyTab icon={FileText} label="No notices for this case" />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notices.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 group transition-colors"
                      >
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {d.title}
                          </div>
                          <div className="text-xs text-gray-400 capitalize">
                            {d.category} · {d.language}
                          </div>
                        </div>
                        {d.ai_generated && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                            AI
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setPrintDraftId(d.id);
                            setShowPrintPreview(true);
                          }}
                          title="Print Notice"
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-sidebar rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              {/* FILINGS */}
              {activeTab === "filings" && (
                <div className="p-6">
                  <EFilingWorkspace caseData={caseData} />
                </div>
              )}

              {/* ORDERS */}
              {activeTab === "orders" &&
                (!orders.length ? (
                  <EmptyTab icon={Gavel} label="No orders recorded" />
                ) : (
                  <div className="divide-y divide-gray-50">
                    {orders.map((h) => (
                      <div
                        key={h.id}
                        className="px-5 py-4 group hover:bg-gray-50 transition-colors flex items-start gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Gavel className="w-4 h-4 text-sidebar" />
                            <span className="font-medium text-sm text-gray-900">
                              {h.hearing_date}
                            </span>
                            {h.hearing_time && (
                              <span className="text-xs text-gray-500">
                                {h.hearing_time}
                              </span>
                            )}
                            {h.purpose && (
                              <span className="text-xs bg-sidebar/10 text-sidebar px-2 py-0.5 rounded-full">
                                {h.purpose}
                              </span>
                            )}
                          </div>
                          <div className="bg-sidebar/5 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
                            {h.order_passed}
                          </div>
                          {h.next_date && (
                            <p className="text-xs text-amber-600 mt-2">
                              Next date: {h.next_date}
                              {h.next_purpose ? ` — ${h.next_purpose}` : ""}
                            </p>
                          )}
                          {h.judge && (
                            <p className="text-xs text-gray-400 mt-1">
                              Before: {h.judge}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            let text = `COURT ORDER REPORT\n`;
                            text += `========================================\n`;
                            text += `Case Title: ${caseData.title}\n`;
                            text += `Case No: ${caseData.case_no}\n\n`;
                            text += `Hearing Date: ${h.hearing_date}\n`;
                            if (h.purpose) text += `Purpose: ${h.purpose}\n`;
                            if (h.judge) text += `Judge: ${h.judge}\n`;
                            text += `\nCourt Order:\n${h.order_passed}\n`;
                            setPrintContent(text);
                            setPrintDraftId("");
                            setShowPrintPreview(true);
                          }}
                          title="Print Order"
                          className="opacity-0 group-hover:opacity-100 p-2 mt-2 text-gray-400 hover:text-sidebar rounded-lg hover:bg-white transition-all shadow-sm border border-transparent hover:border-gray-200"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

              {/* NOTES */}
              {activeTab === "notes" && (
                <div className="p-5 space-y-4">
                  {/* Add note */}
                  <div className="space-y-2">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note, instruction, or observation about this case..."
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value)}
                        className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white outline-none text-gray-700"
                      >
                        <option value="general">General</option>
                        <option value="instruction">Instruction</option>
                        <option value="reminder">Reminder</option>
                        <option value="observation">Observation</option>
                      </select>
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim() || createNote.isPending}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sidebar text-white text-sm font-medium hover:bg-sidebar-dark disabled:opacity-50 transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Add Note
                      </button>
                    </div>
                  </div>

                  {/* Notes list */}
                  {notes.length === 0 ? (
                    <div className="text-center py-8">
                      <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No notes yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notes.map((n) => (
                        <div
                          key={n.id}
                          className={cn(
                            "rounded-xl p-4 border group",
                            n.is_pinned
                              ? "border-amber-200 bg-amber-50"
                              : "border-gray-100 bg-gray-50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {n.is_pinned && (
                                <Pin className="w-3.5 h-3.5 text-amber-500" />
                              )}
                              <span
                                className={cn(
                                  "text-xs rounded-full px-2 py-0.5 font-medium capitalize",
                                  n.note_type === "instruction"
                                    ? "bg-blue-100 text-blue-700"
                                    : n.note_type === "reminder"
                                      ? "bg-red-100 text-red-700"
                                      : n.note_type === "observation"
                                        ? "bg-purple-100 text-purple-700"
                                        : "bg-gray-200 text-gray-600",
                                )}
                              >
                                {n.note_type}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(n.created_at).toLocaleDateString(
                                  "en-IN",
                                )}
                              </span>
                            </div>
                            <button
                              onClick={() => setDeleteNote(n.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">
                            {n.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "billing" && (
                <MatterLedger caseId={id as string} />
              )}

              {/* ── PARTIES TAB ── */}
              {activeTab === "parties" && (
                <div className="p-5 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Parties & Advocates
                    </h3>
                    <button
                      onClick={() => setShowPartyModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-sidebar text-white rounded-lg text-sm hover:bg-sidebar/90 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Party
                    </button>
                  </div>
                  {!caseData.parties?.length ? (
                    <div className="text-center py-8 bg-gray-50 rounded-xl">
                      <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No parties added yet
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {caseData.parties.map((p: any) => (
                        <div key={p.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex items-start gap-4 group">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0 uppercase">
                            {p.name.slice(0, 2)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-medium text-gray-900">{p.name}</h4>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                                {p.party_type}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {p.advocate_name ? `Adv. ${p.advocate_name}` : "No Advocate Assigned"}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2">
                              {p.mobile && (
                                <div className="flex items-center gap-1">
                                  <Phone className="w-3.5 h-3.5" />
                                  {p.mobile}
                                </div>
                              )}
                              {p.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="w-3.5 h-3.5" />
                                  {p.email}
                                </div>
                              )}
                              {p.address && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {p.address}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (confirm("Remove this party?")) {
                                deletePartyMutation.mutateAsync(p.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── TEAM TAB ── */}
              {activeTab === "team" && (
                <div className="p-5 space-y-6">
                  {/* Active Team */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                      Active Team
                    </h3>
                    {!teamActive.length ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl">
                        <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No advocates assigned yet
                        </p>
                        <button
                          onClick={() => setShowAssignAdvocate(true)}
                          className="mt-2 text-sm text-sidebar hover:underline"
                        >
                          Assign first advocate
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {teamActive.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl group"
                          >
                            <div className="w-10 h-10 rounded-xl bg-sidebar/10 flex items-center justify-center text-sm font-bold text-sidebar flex-shrink-0">
                              {a.advocate?.full_name
                                ?.slice(0, 2)
                                .toUpperCase() || "??"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm">
                                {a.advocate?.full_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {a.advocate?.email} · Since {a.start_date}
                              </div>
                            </div>
                            <span
                              className={cn(
                                "text-xs px-2.5 py-1 rounded-full font-medium",
                                a.role === "senior"
                                  ? "bg-purple-50 text-purple-700"
                                  : a.role === "external"
                                    ? "bg-orange-50 text-orange-700"
                                    : a.role === "associate"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-green-50 text-green-700",
                              )}
                            >
                              {a.role}
                            </span>
                            <button
                              onClick={() => setRemoveAdvocateId(a.advocate_id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tasks */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Tasks
                      </h3>
                      <span className="text-xs text-gray-400">
                        {tasks.length} total
                      </span>
                    </div>
                    {!tasks.length ? (
                      <div className="text-center py-6 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">No tasks yet</p>
                        <button
                          onClick={() => setShowCreateTask(true)}
                          className="mt-2 text-sm text-sidebar hover:underline"
                        >
                          Create first task
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 group"
                          >
                            <button
                              onClick={() =>
                                updateTask.mutate({
                                  id: t.id,
                                  status:
                                    t.status === "pending"
                                      ? "in_progress"
                                      : t.status === "in_progress"
                                        ? "completed"
                                        : t.status,
                                })
                              }
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors",
                                t.status === "completed" ||
                                  t.status === "reviewed"
                                  ? "border-green-500 bg-green-500"
                                  : "border-gray-300 hover:border-sidebar",
                              )}
                            >
                              {(t.status === "completed" ||
                                t.status === "reviewed") && (
                                <CheckCircle className="w-3.5 h-3.5 text-white" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  "text-sm font-medium",
                                  t.status === "completed" ||
                                    t.status === "reviewed"
                                    ? "line-through text-gray-400"
                                    : "text-gray-900",
                                )}
                              >
                                {t.title}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                                <span className="capitalize">
                                  {t.task_type.replace("_", " ")}
                                </span>
                                {t.assignee && (
                                  <>
                                    <span>·</span>
                                    <span>{t.assignee.full_name}</span>
                                  </>
                                )}
                                {t.deadline && (
                                  <>
                                    <span>·</span>
                                    <span className="text-amber-600">
                                      Due {t.deadline}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span
                              className={cn(
                                "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                                t.status === "completed"
                                  ? "bg-green-50 text-green-700"
                                  : t.status === "in_progress"
                                    ? "bg-blue-50 text-blue-700"
                                    : t.status === "reviewed"
                                      ? "bg-purple-50 text-purple-700"
                                      : "bg-gray-100 text-gray-500",
                              )}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                            <button
                              onClick={() => setDeleteTaskId(t.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* History */}
                  {(teamData?.history?.length || 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Transfer History
                      </h3>
                      <div className="space-y-2">
                        {(teamData?.history || []).map((a) => (
                          <div
                            key={a.id}
                            className="flex items-start gap-3 p-3.5 bg-red-50/30 rounded-xl border border-red-100"
                          >
                            <UserMinus className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-700">
                                {a.advocate?.full_name}
                              </div>
                              <div className="text-xs text-gray-400">
                                {a.start_date} → {a.end_date} ·{" "}
                                <span className="capitalize">{a.role}</span>
                              </div>
                              {a.transfer_reason && (
                                <div className="text-xs text-red-600 mt-0.5">
                                  Reason: {a.transfer_reason}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── TIMELINE TAB ── */}
              {activeTab === "timeline" && (
                <div className="p-5">
                  {!timelineData?.events?.length ? (
                    <div className="text-center py-12">
                      <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No timeline events yet
                      </p>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-100" />
                      <div className="space-y-0">
                        {timelineData.events.map((event, i) => {
                          const colorMap: Record<string, string> = {
                            blue: "bg-blue-100 text-blue-600",
                            amber: "bg-amber-100 text-amber-600",
                            green: "bg-green-100 text-green-600",
                            red: "bg-red-100 text-red-600",
                            purple: "bg-purple-100 text-purple-600",
                            orange: "bg-orange-100 text-orange-600",
                            indigo: "bg-indigo-100 text-indigo-600",
                          };
                          const EventIcon =
                            event.type.includes("hearing") ||
                            event.type.includes("order")
                              ? Gavel
                              : event.type.includes("advocate")
                                ? Users
                                : event.type.includes("task")
                                  ? CheckCircle
                                  : event.type.includes("filing")
                                    ? FolderOpen
                                    : event.type.includes("appeal")
                                      ? GitBranch
                                      : Briefcase;
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-4 pb-6 relative"
                            >
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10",
                                  colorMap[event.color] ||
                                    "bg-gray-100 text-gray-500",
                                )}
                              >
                                <EventIcon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 pt-1.5">
                                <div className="flex items-baseline gap-2 flex-wrap">
                                  <span className="font-medium text-sm text-gray-900">
                                    {event.title}
                                  </span>
                                  {event.date && (
                                    <span className="text-xs text-gray-400">
                                      {event.date}
                                    </span>
                                  )}
                                </div>
                                {event.detail && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {event.detail}
                                  </p>
                                )}
                                {event.extra && (
                                  <p className="text-xs text-sidebar mt-1 bg-sidebar/5 rounded-lg px-3 py-1.5">
                                    {event.extra}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── APPEALS TAB ── */}
              {activeTab === "appeals" && (
                <div className="p-5 space-y-5">
                  {/* Parent case link */}
                  {caseData.parent_case_id && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <div className="text-xs font-semibold text-blue-600 mb-2 flex items-center gap-1.5">
                        <ArrowLeft className="w-3.5 h-3.5" /> Lower Court Matter
                      </div>
                      <button
                        onClick={() =>
                          router.push(`/cases/${caseData.parent_case_id}`)
                        }
                        className="flex items-center gap-2 text-sm text-blue-800 hover:underline font-medium"
                      >
                        View original matter{" "}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Family tree */}
                  {familyData?.tree && (
                    <div>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Litigation Family Tree
                      </h3>
                      <FamilyTreeNode
                        node={familyData.tree}
                        onNavigate={(caseId) => router.push(`/cases/${caseId}`)}
                      />
                    </div>
                  )}

                  {/* Appeal level info */}
                  {caseData.appeal_level !== undefined &&
                    caseData.appeal_level > 0 && (
                      <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <Award className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-amber-800 capitalize">
                            {caseData.appeal_type || "Appeal"} · Level{" "}
                            {caseData.appeal_level}
                          </div>
                          {caseData.forum && (
                            <div className="text-xs text-amber-600">
                              {caseData.forum}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* Current case has no appeal yet */}
                  {!familyData?.tree?.children?.length &&
                    !caseData.parent_case_id && (
                      <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <GitBranch className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">
                          No appeals filed yet
                        </p>
                        <p className="text-xs text-gray-400">
                          Use "File Appeal" to create a linked higher-forum case
                        </p>
                        <button
                          onClick={() => setShowCreateAppeal(true)}
                          className="mt-3 text-sm text-sidebar hover:underline font-medium"
                        >
                          Create first appeal →
                        </button>
                      </div>
                    )}
                </div>
              )}

              {/* ── SECTIONS TAB ── */}
              {activeTab === "sections" && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Acts & Sections Involved</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Manage applicable acts and legal sections for this matter</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Acts Panel */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                          <Scale className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Acts Involved</h4>
                          <p className="text-xs text-gray-500">{caseData.acts_involved?.length || 0} acts added</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4 min-h-[60px] bg-gray-50 rounded-xl p-3 border border-dashed border-gray-200">
                        {caseData.acts_involved?.length > 0 ? (
                          caseData.acts_involved.map((act: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg px-2.5 py-1.5">
                              {act}
                              <button
                                onClick={async () => {
                                  const updated = caseData.acts_involved.filter((_: string, idx: number) => idx !== i);
                                  await updateCase.mutateAsync({ id: caseData.id, acts_involved: updated });
                                }}
                                className="text-blue-400 hover:text-red-500 transition-colors ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 py-1">No acts added yet. Add one below.</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          id="add-act-input"
                          type="text"
                          placeholder="e.g. NI Act, IPC, CPC..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (!val) return;
                              const updated = [...(caseData.acts_involved || []), val];
                              await updateCase.mutateAsync({ id: caseData.id, acts_involved: updated });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <button
                          onClick={async () => {
                            const input = document.getElementById("add-act-input") as HTMLInputElement;
                            const val = input?.value.trim();
                            if (!val) return;
                            const updated = [...(caseData.acts_involved || []), val];
                            await updateCase.mutateAsync({ id: caseData.id, acts_involved: updated });
                            if (input) input.value = "";
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Sections Panel */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-sidebar/10 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-sidebar" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">Sections Involved</h4>
                          <p className="text-xs text-gray-500">{caseData.sections_involved?.length || 0} sections added</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4 min-h-[60px] bg-gray-50 rounded-xl p-3 border border-dashed border-gray-200">
                        {caseData.sections_involved?.length > 0 ? (
                          caseData.sections_involved.map((sec: string, i: number) => (
                            <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200 rounded-lg px-2.5 py-1.5">
                              Section {sec}
                              <button
                                onClick={async () => {
                                  const updated = caseData.sections_involved.filter((_: string, idx: number) => idx !== i);
                                  await updateCase.mutateAsync({ id: caseData.id, sections_involved: updated });
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors ml-0.5"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 py-1">No sections added yet. Add one below.</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <input
                          id="add-section-input"
                          type="text"
                          placeholder="e.g. 138, 302, 420..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar"
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (!val) return;
                              const updated = [...(caseData.sections_involved || []), val];
                              await updateCase.mutateAsync({ id: caseData.id, sections_involved: updated });
                              (e.target as HTMLInputElement).value = "";
                            }
                          }}
                        />
                        <button
                          onClick={async () => {
                            const input = document.getElementById("add-section-input") as HTMLInputElement;
                            const val = input?.value.trim();
                            if (!val) return;
                            const updated = [...(caseData.sections_involved || []), val];
                            await updateCase.mutateAsync({ id: caseData.id, sections_involved: updated });
                            if (input) input.value = "";
                          }}
                          className="px-4 py-2 bg-sidebar text-white text-sm font-medium rounded-xl hover:bg-sidebar-dark transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick-add common sections by practice area */}
                  {caseData.practice_area && (
                    <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                      <h4 className="text-sm font-semibold text-amber-800 mb-3">
                        Quick Add — Common Sections for {caseData.practice_area}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(caseData.practice_area === "MACT" ? ["163A", "166", "140"] :
                          caseData.practice_area === "Consumer" ? ["12", "13", "14", "17", "19", "21"] :
                          caseData.practice_area === "Criminal Law" ? ["302", "307", "354", "420", "498A"] :
                          caseData.practice_area === "NI Act" || caseData.practice_area?.includes("Cheque") ? ["138", "139", "140", "141", "142"] :
                          caseData.practice_area === "Civil" ? ["9", "15", "16", "20"] :
                          caseData.practice_area === "Family Law" ? ["13", "13B", "24", "25", "125"] :
                          ["9", "10", "11", "12"]
                        ).map((sec: string) => (
                          <button
                            key={sec}
                            onClick={async () => {
                              if (caseData.sections_involved?.includes(sec)) return;
                              const updated = [...(caseData.sections_involved || []), sec];
                              await updateCase.mutateAsync({ id: caseData.id, sections_involved: updated });
                            }}
                            className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                              caseData.sections_involved?.includes(sec)
                                ? "bg-sidebar/10 text-sidebar border-sidebar/20 cursor-default"
                                : "bg-white text-amber-700 border-amber-300 hover:bg-amber-100"
                            }`}
                          >
                            {caseData.sections_involved?.includes(sec) ? "✓ " : "+ "}Sec {sec}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── CASE LAWS TAB ── */}
              {activeTab === "case_laws" && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Case Laws Database
                    </h3>
                    <button
                      onClick={() => setShowAddCaseLaw(true)}
                      className="px-4 py-2 bg-sidebar text-white text-sm font-medium rounded-xl hover:bg-sidebar-dark transition-colors"
                    >
                      + Add Case Law
                    </button>
                  </div>

                  {!caseData.case_laws || caseData.case_laws.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 mt-4">
                      <div className="w-12 h-12 bg-sidebar/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-6 h-6 text-sidebar"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                      </div>
                      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                        No Case Laws Added
                      </h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Link relevant case laws, citations, and legal principles
                        to this matter.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {caseData.case_laws.map((law: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-sidebar/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-xs font-semibold text-sidebar mb-1 uppercase tracking-wider">
                                {law.citation}
                              </div>
                              <h4 className="text-base font-semibold text-gray-900 mb-1">
                                {law.title}
                              </h4>
                              <div className="text-sm text-gray-500">
                                {law.court}
                              </div>
                            </div>
                          </div>
                          {law.notes && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Key Principles / Notes
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {law.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ARGUMENTS TAB ── */}
              {activeTab === "arguments" && (
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Argument Builder
                    </h3>
                    <button
                      onClick={() => setShowAddArgument(true)}
                      className="px-4 py-2 bg-sidebar text-white text-sm font-medium rounded-xl hover:bg-sidebar-dark transition-colors"
                    >
                      + Build Argument
                    </button>
                  </div>

                  {!caseData.arguments || caseData.arguments.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100 mt-4">
                      <div className="w-12 h-12 bg-mint/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-6 h-6 text-sidebar"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                          />
                        </svg>
                      </div>
                      <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                        No Arguments Built
                      </h3>
                      <p className="text-sm text-gray-500 mb-4 max-w-sm mx-auto">
                        Link Issues → Sections → Case Laws → Evidence to build
                        strong arguments.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6 mt-4">
                      {caseData.arguments.map((arg: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-sidebar/30 transition-colors shadow-sm"
                        >
                          <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                            <div className="text-xs font-semibold text-sidebar mb-1 uppercase tracking-wider">
                              Issue / Ground
                            </div>
                            <h4 className="text-base font-semibold text-gray-900">
                              {arg.issue}
                            </h4>
                          </div>
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {arg.sections && (
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Relevant Sections
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {arg.sections}
                                </p>
                              </div>
                            )}
                            {arg.case_laws && (
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Supporting Case Laws
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {arg.case_laws}
                                </p>
                              </div>
                            )}
                            {arg.evidence && (
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Linked Evidence / Exhibits
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {arg.evidence}
                                </p>
                              </div>
                            )}
                            {arg.strategy && (
                              <div>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Argument Strategy
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {arg.strategy}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Modals */}



      {/* Add Order Modal */}
      <Modal open={showAddOrder} onClose={() => setShowAddOrder(false)} title="Record Court Order">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addOrderMutation.mutate(
              {
                order_type: fd.get("order_type") as string,
                order_date: fd.get("order_date") as string,
                summary: fd.get("summary") as string,
                compliance_required: fd.get("compliance_required") === "on",
                compliance_due_date: fd.get("compliance_due_date") ? fd.get("compliance_due_date") as string : undefined,
                compliance_status: fd.get("compliance_status") as string,
                next_action: fd.get("next_action") as string,
              },
              { onSuccess: () => setShowAddOrder(false) }
            );
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Order Type</label>
              <select name="order_type" className="w-full border-gray-200 rounded-lg p-2">
                <option value="Interim Order">Interim Order</option>
                <option value="Final Order">Final Order</option>
                <option value="Judgment">Judgment</option>
                <option value="Decree">Decree</option>
                <option value="Daily Order">Daily Order</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Order Date</label>
              <input type="date" name="order_date" required className="w-full border-gray-200 rounded-lg p-2" defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Summary / Directions</label>
            <textarea name="summary" rows={3} className="w-full border-gray-200 rounded-lg p-2"></textarea>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="compliance_required" className="rounded text-sidebar" />
              <span className="text-sm font-semibold text-gray-900">Compliance / Follow-up Required</span>
            </label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Due Date</label>
                <input type="date" name="compliance_due_date" className="w-full border-gray-200 rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                <select name="compliance_status" className="w-full border-gray-200 rounded-lg p-2">
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Next Action Required</label>
              <input type="text" name="next_action" className="w-full border-gray-200 rounded-lg p-2" placeholder="e.g. File reply, Pay cost, etc." />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setShowAddOrder(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={addOrderMutation.isPending} className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium">Record Order</button>
          </div>
        </form>
      </Modal>

      {/* Add Party Modal */}
      <Modal open={showAddParty} onClose={() => setShowAddParty(false)} title="Add Opposing Party">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            addPartyMutation.mutate(
              {
                name: fd.get("name") as string,
                party_type: fd.get("party_type") as string,
                advocate_name: fd.get("advocate_name") as string,
                mobile: fd.get("mobile") as string,
                email: fd.get("email") as string,
              },
              { onSuccess: () => setShowAddParty(false) }
            );
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Party Name</label>
            <input name="name" required className="w-full border-gray-200 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Party Role</label>
            <select name="party_type" className="w-full border-gray-200 rounded-lg p-2">
              <option value="respondent">Respondent / Defendant</option>
              <option value="petitioner">Petitioner / Plaintiff</option>
              <option value="co-respondent">Co-Respondent</option>
              <option value="third-party">Third Party</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Opposing Counsel (Advocate)</label>
            <input name="advocate_name" className="w-full border-gray-200 rounded-lg p-2" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Mobile</label>
              <input name="mobile" className="w-full border-gray-200 rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
              <input name="email" className="w-full border-gray-200 rounded-lg p-2" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setShowAddParty(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm font-medium">Cancel</button>
            <button type="submit" disabled={addPartyMutation.isPending} className="px-4 py-2 bg-sidebar text-white rounded-lg text-sm font-medium">Add Party</button>
          </div>
        </form>
      </Modal>

      {/* Add Witness Modal */}
      {showAddWitness && (
        <Modal
          open={showAddWitness}
          onClose={() => setShowAddWitness(false)}
          title="Add Witness"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Witness Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input
                type="text"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar"
                value={witnessMobile}
                onChange={(e) => setWitnessMobile(e.target.value)}
                placeholder="+91 "
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar h-20"
                value={witnessAddress}
                onChange={(e) => setWitnessAddress(e.target.value)}
                placeholder="Complete Address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Statement / Remarks</label>
              <textarea
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sidebar/20 focus:border-sidebar h-32"
                value={witnessStatement}
                onChange={(e) => setWitnessStatement(e.target.value)}
                placeholder="Brief summary of what the witness will testify..."
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddWitness(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={createWitnessMutation.isPending || !witnessName.trim()}
                onClick={() => {
                  createWitnessMutation.mutate({
                    name: witnessName,
                    mobile: witnessMobile,
                    address: witnessAddress,
                    statement: witnessStatement,
                    status: "Pending"
                  });
                  setShowAddWitness(false);
                  setWitnessName("");
                  setWitnessMobile("");
                  setWitnessAddress("");
                  setWitnessStatement("");
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-sidebar rounded-lg hover:bg-sidebar/90 disabled:opacity-50"
              >
                {createWitnessMutation.isPending ? "Adding..." : "Add Witness"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Case"
        size="xl"
      >
        <CaseForm caseData={caseData} onSuccess={() => setShowEdit(false)} />
      </Modal>
      <Modal
        open={showAddHearing}
        onClose={() => setShowAddHearing(false)}
        title="Schedule Hearing"
        size="md"
      >
        <HearingForm
          defaultCaseId={id}
          onSuccess={() => setShowAddHearing(false)}
        />
      </Modal>
      <Modal
        open={showAddInvoice}
        onClose={() => setShowAddInvoice(false)}
        title="Create Invoice"
        size="lg"
      >
        <InvoiceForm
          defaultCaseId={id}
          defaultClientId={caseData.client_id}
          onSuccess={() => setShowAddInvoice(false)}
        />
      </Modal>
      <Modal
        open={showAddFiling}
        onClose={() => setShowAddFiling(false)}
        title="New Filing Workspace"
        size="lg"
      >
        <FilingForm
          caseId={id}
          drafts={caseData.drafts || []}
          createFiling={createFiling}
          onSuccess={() => setShowAddFiling(false)}
          onClose={() => setShowAddFiling(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteFiling}
        onClose={() => setDeleteFiling(null)}
        onConfirm={async () => {
          if (deleteFiling) {
            await deletingFiling.mutateAsync(deleteFiling);
            setDeleteFiling(null);
          }
        }}
        title="Delete Filing"
        message="Delete this filing record?"
        confirmLabel="Delete"
        danger
        loading={deletingFiling.isPending}
      />
      <ConfirmDialog
        open={!!deleteNote}
        onClose={() => setDeleteNote(null)}
        onConfirm={async () => {
          if (deleteNote) {
            await deletingNote.mutateAsync({ id: deleteNote, case_id: id });
            setDeleteNote(null);
          }
        }}
        title="Delete Note"
        message="Delete this note?"
        confirmLabel="Delete"
        danger
        loading={deletingNote.isPending}
      />

      <Modal
        open={showPartyModal}
        onClose={() => setShowPartyModal(false)}
        title="Add Party"
      >
        <div className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Name</label>
              <input
                type="text"
                value={partyForm.name}
                onChange={(e) => setPartyForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Name or Company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Party Type</label>
              <select
                value={partyForm.party_type}
                onChange={(e) => setPartyForm(prev => ({ ...prev, party_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="Petitioner">Petitioner / Plaintiff / Complainant</option>
                <option value="Respondent">Respondent / Defendant</option>
                <option value="Proforma Respondent">Proforma Respondent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opposite Advocate Name</label>
              <input
                type="text"
                value={partyForm.advocate_name}
                onChange={(e) => setPartyForm(prev => ({ ...prev, advocate_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Advocate Name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="text"
                  value={partyForm.mobile}
                  onChange={(e) => setPartyForm(prev => ({ ...prev, mobile: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={partyForm.email}
                  onChange={(e) => setPartyForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={partyForm.address}
                onChange={(e) => setPartyForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="Complete address"
                rows={2}
              />
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              onClick={() => setShowPartyModal(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddParty}
              disabled={addPartyMutation.isPending || !partyForm.name}
              className="px-4 py-2 text-sm bg-sidebar text-white rounded-lg hover:bg-sidebar/90 transition-colors disabled:opacity-50"
            >
              {addPartyMutation.isPending ? "Adding..." : "Add Party"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assign Advocate Modal */}
      <Modal
        open={showAssignAdvocate}
        onClose={() => setShowAssignAdvocate(false)}
        title="Assign Advocate"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Select Advocate
            </label>
            <select
              value={assignAdvocateId}
              onChange={(e) => setAssignAdvocateId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            >
              <option value="">Choose advocate...</option>
              {advocates.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name} ({a.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Role in this matter
            </label>
            <select
              value={assignRole}
              onChange={(e) => setAssignRole(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            >
              <option value="senior">Senior Advocate</option>
              <option value="junior">Junior Advocate</option>
              <option value="associate">Associate Advocate</option>
              <option value="external">External Counsel</option>
              <option value="standby">Standby</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowAssignAdvocate(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignAdvocate}
              disabled={!assignAdvocateId || assignAdvocate.isPending}
              className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark disabled:opacity-60"
            >
              {assignAdvocate.isPending ? "Assigning..." : "Assign"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Remove Advocate Modal */}
      <Modal
        open={!!removeAdvocateId}
        onClose={() => {
          setRemoveAdvocateId(null);
          setRemoveReason("");
        }}
        title="Remove Advocate"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will end the advocate's assignment and preserve the history
            record.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Transfer Reason
            </label>
            <select
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            >
              <option value="">Select reason...</option>
              <option value="Client Decision">Client Decision</option>
              <option value="Advocate Resigned">Advocate Resigned</option>
              <option value="Matter Transferred">Matter Transferred</option>
              <option value="Office Transfer">Office Transfer</option>
              <option value="Conflict of Interest">Conflict of Interest</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setRemoveAdvocateId(null);
                setRemoveReason("");
              }}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (removeAdvocateId) {
                  await removeAdvocate.mutateAsync({
                    advocate_id: removeAdvocateId,
                    transfer_reason: removeReason || undefined,
                  });
                  setRemoveAdvocateId(null);
                  setRemoveReason("");
                }
              }}
              disabled={removeAdvocate.isPending}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {removeAdvocate.isPending ? "Removing..." : "Remove & Log"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Task Modal */}
      <Modal
        open={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        title="Create Task"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Task Title *
            </label>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g. Draft bail application"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Type
              </label>
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              >
                {[
                  "drafting",
                  "filing",
                  "research",
                  "evidence_collection",
                  "client_meeting",
                  "hearing_preparation",
                  "review",
                  "other",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Priority
              </label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Assign To
              </label>
              <select
                value={taskAssigneeId}
                onChange={(e) => setTaskAssigneeId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              >
                <option value="">Unassigned</option>
                {advocates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Deadline
              </label>
              <input
                type="date"
                value={taskDeadline}
                onChange={(e) => setTaskDeadline(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Description
            </label>
            <textarea
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
              rows={2}
              placeholder="Optional details..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateTask(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!taskTitle || createTask.isPending}
              className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark disabled:opacity-60"
            >
              {createTask.isPending ? "Creating..." : "Create Task"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Task Confirm */}
      <ConfirmDialog
        open={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={async () => {
          if (deleteTaskId) {
            await deleteTask.mutateAsync(deleteTaskId);
            setDeleteTaskId(null);
          }
        }}
        title="Delete Task"
        message="Delete this task permanently?"
        confirmLabel="Delete"
        danger
        loading={deleteTask.isPending}
      />

      {/* Create Appeal Modal */}
      <Modal
        open={showCreateAppeal}
        onClose={() => setShowCreateAppeal(false)}
        title="File Appeal / Higher Forum"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            This will create a new linked case at the higher forum and mark the
            current case as "Appealed". All client details, documents and
            evidence are automatically carried forward.
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                New Case Number *
              </label>
              <input
                value={appealCaseNo}
                onChange={(e) => setAppealCaseNo(e.target.value)}
                placeholder="e.g. RCA No. 50/2026"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Appeal Type *
              </label>
              <select
                value={appealType}
                onChange={(e) => setAppealType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              >
                {[
                  "appeal",
                  "revision",
                  "writ",
                  "slp",
                  "execution",
                  "review",
                  "reference",
                  "other",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Title *
            </label>
            <input
              value={appealTitle}
              onChange={(e) => setAppealTitle(e.target.value)}
              placeholder={caseData?.title || "Case title"}
              defaultValue={caseData?.title}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Higher Court *
              </label>
              <input
                value={appealCourt}
                onChange={(e) => setAppealCourt(e.target.value)}
                placeholder="e.g. Bombay High Court"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Forum Level
              </label>
              <select
                value={appealForum}
                onChange={(e) => setAppealForum(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              >
                <option value="">Select forum...</option>
                {[
                  "District Court",
                  "Sessions Court",
                  "High Court",
                  "Supreme Court",
                  "Tribunal",
                  "NCLAT",
                  "NCDRC",
                  "CESTAT",
                ].map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowCreateAppeal(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateAppeal}
              disabled={
                !appealCaseNo ||
                !appealTitle ||
                !appealCourt ||
                createAppeal.isPending
              }
              className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark disabled:opacity-60"
            >
              {createAppeal.isPending ? "Creating..." : "Create Appeal Case →"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Case Law Modal */}
      <Modal
        open={showAddCaseLaw}
        onClose={() => setShowAddCaseLaw(false)}
        title="Link Case Law"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Citation *
            </label>
            <input
              value={caseLawCitation}
              onChange={(e) => setCaseLawCitation(e.target.value)}
              placeholder="e.g. 2024 SCC 123"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Case Title / Parties *
            </label>
            <input
              value={caseLawTitle}
              onChange={(e) => setCaseLawTitle(e.target.value)}
              placeholder="e.g. State of Maharashtra vs XYZ"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Court
            </label>
            <input
              value={caseLawCourt}
              onChange={(e) => setCaseLawCourt(e.target.value)}
              placeholder="e.g. Supreme Court of India"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Key Principles / Notes
            </label>
            <textarea
              value={caseLawNotes}
              onChange={(e) => setCaseLawNotes(e.target.value)}
              placeholder="Why is this relevant? Which paragraphs to quote?"
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => setShowAddCaseLaw(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCaseLaw}
              disabled={
                !caseLawTitle || !caseLawCitation || updateCase.isPending
              }
              className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark disabled:opacity-60"
            >
              {updateCase.isPending ? "Saving..." : "Add Case Law"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Argument Modal */}
      <Modal
        open={showAddArgument}
        onClose={() => setShowAddArgument(false)}
        title="Build Argument"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Issue / Ground *
            </label>
            <input
              value={argIssue}
              onChange={(e) => setArgIssue(e.target.value)}
              placeholder="e.g. Lack of mens rea"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Relevant Sections
              </label>
              <textarea
                value={argSections}
                onChange={(e) => setArgSections(e.target.value)}
                placeholder="e.g. Sec 302 IPC"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Supporting Case Laws
              </label>
              <textarea
                value={argCaseLaws}
                onChange={(e) => setArgCaseLaws(e.target.value)}
                placeholder="e.g. State vs XYZ, 2024 SCC 123"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Linked Evidence / Exhibits
              </label>
              <textarea
                value={argEvidence}
                onChange={(e) => setArgEvidence(e.target.value)}
                placeholder="e.g. Exhibit A (CCTV Footage)"
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Argument Strategy / Notes
              </label>
              <textarea
                value={argStrategy}
                onChange={(e) => setArgStrategy(e.target.value)}
                placeholder="How this ties the case together..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddArgument(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddArgument}
              disabled={!argIssue || updateCase.isPending}
              className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark disabled:opacity-60"
            >
              {updateCase.isPending ? "Saving..." : "Save Argument"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Document / Evidence Modal */}
      <Modal
        open={showUploadDoc}
        onClose={() => setShowUploadDoc(false)}
        title={`Upload ${uploadType === "evidence" ? "Evidence" : "Document"}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Select File *
            </label>
            <input
              type="file"
              onChange={(e) =>
                setDocFile(e.target.files ? e.target.files[0] : null)
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-mint/10 file:text-sidebar hover:file:bg-mint/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={docDescription}
              onChange={(e) => setDocDescription(e.target.value)}
              placeholder="What is this file?"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => setShowUploadDoc(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUploadDoc}
              disabled={!docFile || uploadDocMutation.isPending}
              className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark disabled:opacity-60"
            >
              {uploadDocMutation.isPending ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Create Draft Modal */}
      <Modal
        open={showAddDraft}
        onClose={() => setShowAddDraft(false)}
        title="Create Draft"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Draft Title *
              </label>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="e.g. Legal Notice"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Category
              </label>
              <select
                value={draftCategory}
                onChange={(e) => setDraftCategory(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
              >
                <option value="Notice">Notice</option>
                <option value="Affidavit">Affidavit</option>
                <option value="Application">Application</option>
                <option value="Agreement">Agreement</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Content *
            </label>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Draft content..."
              rows={8}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint resize-none font-serif"
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowAddDraft(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddDraft}
              disabled={
                !draftTitle || !draftContent || createDraftMutation.isPending
              }
              className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark disabled:opacity-60"
            >
              {createDraftMutation.isPending ? "Saving..." : "Save Draft"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Letterhead Print Preview Overlay */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex bg-gray-500/80 items-center justify-center p-6 print:p-0 print:bg-white print:block">
          <div className="bg-gray-100 rounded-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:w-full print:max-h-none print:shadow-none print:bg-white print:rounded-none">
            {/* Modal Header */}
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center print:hidden">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-sidebar" />
                Letterhead Print Preview
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 bg-sidebar/10 text-sidebar text-sm font-bold rounded-lg hover:bg-sidebar/20 transition-colors flex items-center gap-2 shadow-sm"
                >
                  Configure Letterhead
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm"
                  disabled={printDraftId ? !printDraftData : !printContent}
                >
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible relative">
              {printDraftId && !printDraftData ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Loading Draft Content...
                </div>
              ) : (
                <LetterheadPreview
                  letterhead={myLetterhead || null}
                  content={printContent}
                  onConfigure={() => setShowSettingsModal(true)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline Letterhead Settings Modal */}
      <Modal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Configure Letterhead"
        size="lg"
      >
        <LetterheadSettings />
      </Modal>

    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-gray-500 text-xs shrink-0">{label}</span>
      <span className="text-gray-900 text-xs font-medium text-right">
        {value}
      </span>
    </div>
  );
}

function EmptyTab({
  icon: Icon,
  label,
  action,
  onAction,
}: {
  icon: React.ElementType;
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-16 text-center">
      <Icon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
      <p className="text-gray-500 text-sm">{label}</p>
      {action && onAction && (
        <button
          onClick={onAction}
          className="mt-2 text-sm text-sidebar hover:underline"
        >
          {action}
        </button>
      )}
    </div>
  );
}

interface FamilyNode {
  id: string;
  case_no: string;
  title: string;
  court: string;
  status: string;
  appeal_type?: string;
  appeal_level: number;
  forum?: string;
  next_hearing_date?: string;
  is_current: boolean;
  depth: number;
  children: FamilyNode[];
}

function FamilyTreeNode({
  node,
  onNavigate,
  isRoot = true,
}: {
  node: FamilyNode;
  onNavigate: (id: string) => void;
  isRoot?: boolean;
}) {
  const APPEAL_FORUMS = [
    "District Court",
    "Sessions Court",
    "High Court",
    "Supreme Court",
    "Tribunal",
  ];
  return (
    <div className={cn("relative", !isRoot && "ml-6 mt-2")}>
      {!isRoot && (
        <div className="absolute -left-4 top-4 w-4 border-t-2 border-l-2 border-gray-200 h-4 rounded-bl-lg" />
      )}
      <button
        onClick={() => onNavigate(node.id)}
        className={cn(
          "w-full text-left flex items-center gap-3 p-3.5 rounded-xl border transition-colors",
          node.is_current
            ? "border-sidebar bg-sidebar/5 cursor-default"
            : "border-gray-200 hover:border-sidebar/30 hover:bg-gray-50",
        )}
      >
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
            node.appeal_level === 0
              ? "bg-blue-100 text-blue-700"
              : node.appeal_level === 1
                ? "bg-amber-100 text-amber-700"
                : node.appeal_level === 2
                  ? "bg-purple-100 text-purple-700"
                  : "bg-red-100 text-red-700",
          )}
        >
          L{node.appeal_level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-gray-500">
              {node.case_no}
            </span>
            {node.appeal_type && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded uppercase">
                {node.appeal_type}
              </span>
            )}
            {node.is_current && (
              <span className="text-xs bg-sidebar text-white px-1.5 py-0.5 rounded">
                Current
              </span>
            )}
          </div>
          <div className="text-sm font-medium text-gray-800 truncate mt-0.5">
            {node.title}
          </div>
          <div className="text-xs text-gray-400">
            {node.forum || node.court}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              node.status === "active"
                ? "bg-green-50 text-green-700"
                : node.status === "appealed"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-gray-100 text-gray-500",
            )}
          >
            {node.status}
          </span>
          {!node.is_current && (
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          )}
        </div>
      </button>
      {node.children?.length > 0 && (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />
          {node.children.map((child) => (
            <FamilyTreeNode
              key={child.id}
              node={child}
              onNavigate={onNavigate}
              isRoot={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
