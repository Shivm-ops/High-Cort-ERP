export type UserRole = "super_admin" | "partner" | "associate" | "paralegal" | "clerk";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  barCouncilNo?: string;
  phone?: string;
  firmName?: string;
}

export type CaseStatus =
  | "active"
  | "pending"
  | "urgent"
  | "completed"
  | "closed"
  | "stayed"
  | "disposed";

export type CaseStage =
  | "filing"
  | "notice"
  | "reply"
  | "evidence"
  | "arguments"
  | "judgment"
  | "execution";

export interface Case {
  id: string;
  caseNo: string;
  title: string;
  clientId: string;
  clientName: string;
  court: string;
  judge?: string;
  practiceArea: string;
  status: CaseStatus;
  stage: CaseStage;
  filingDate: string;
  nextHearing?: string;
  opposingCounsel?: string;
  description?: string;
  assignedTo: string[];
  tags: string[];
  priority: "high" | "medium" | "low";
  feesTotal: number;
  feesReceived: number;
}

export type ClientType = "individual" | "corporate" | "government";

export interface Client {
  id: string;
  name: string;
  type: ClientType;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pan?: string;
  gstin?: string;
  activeCases: number;
  totalCases: number;
  feesOutstanding: number;
  createdAt: string;
  tags: string[];
  assignedAdvocate?: string;
  notes?: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  caseNo: string;
  caseTitle: string;
  date: string;
  time?: string;
  court: string;
  judge?: string;
  purpose: string;
  status: "scheduled" | "completed" | "adjourned" | "cancelled";
  nextDate?: string;
  notes?: string;
}

export type DraftCategory =
  | "bail"
  | "civil"
  | "property"
  | "gst"
  | "family"
  | "corporate"
  | "banking"
  | "arbitration"
  | "mact"
  | "agreement"
  | "notice"
  | "reply"
  | "petition"
  | "affidavit";

export interface Draft {
  id: string;
  title: string;
  category: DraftCategory;
  content: string;
  language: "english" | "hindi" | "marathi" | "gujarati";
  caseId?: string;
  clientId?: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  aiGenerated: boolean;
  versions: number;
}

export interface Act {
  id: string;
  name: string;
  shortName: string;
  year: number;
  category: string;
  totalSections: number;
  description: string;
}

export interface Section {
  id: string;
  actId: string;
  actName: string;
  number: string;
  title: string;
  content: string;
  linkedCaseLaws: string[];
  annotations?: string;
  importance: "high" | "medium" | "low";
}

export interface CaseLaw {
  id: string;
  citation: string;
  title: string;
  court: string;
  judge: string;
  date: string;
  practiceArea: string;
  headnotes: string;
  ratio: string;
  linkedSections: string[];
  importanceScore: number;
  aiSummary?: string;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  clientId: string;
  clientName: string;
  caseId?: string;
  caseNo?: string;
  amount: number;
  gst: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  barCouncilNo?: string;
  activeCases: number;
  joinedAt: string;
  specializations: string[];
  status: "active" | "inactive";
}

export interface Notification {
  id: string;
  type: "hearing" | "limitation" | "payment" | "document" | "ai" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  priority: "high" | "medium" | "low";
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  sources?: string[];
}

export interface DashboardStats {
  activeCases: number;
  pendingHearings: number;
  draftsPending: number;
  feesReceivable: number;
  clientsTotal: number;
  limitationAlerts: number;
  todayHearings: number;
  monthRevenue: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
