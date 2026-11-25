// Shared product data for the Fastcase marketing website.
// Everything here mirrors what actually exists inside the two products:
//   • Advocate ERP     → frontend/app/(dashboard)/*  (sidebar modules)
//   • Consumer Portal  → frontend/app/citizen-portal/* (guideData.ts, PropertyLegalCheck.tsx)
// Keep this file in sync with the products. Do not add unverified numbers or claims.

import {
  Users, Briefcase, CalendarDays, FileText, Search, UsersRound,
  ClipboardList, Building2, Car, Mail, FolderOpen,
  Scale, BookOpen, ScanText, MessageSquareText,
  CheckSquare, ShieldCheck, Calculator, HardDriveUpload, BarChart3, Languages,
  CreditCard, Siren, FileWarning, Ban, MapPinned, UserCheck, Gavel,
  Wallet, ShoppingBag, Home as HomeIcon, HeartHandshake, FileQuestion, FileSearch,
  Lightbulb, FileSignature, FolderCheck, Landmark,
} from 'lucide-react';

/* ── Links into the application (Next.js app) ─────────────────────────── */
export const getErpUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const rootDomain = host.replace(/^(app|admin|landing|www)\./, '');
      return `${window.location.protocol}//app.${rootDomain}`;
    }
  }
  return import.meta.env.VITE_ERP_APP_URL || 'http://localhost:3000';
};

export const appLinks = {
  advocateLogin: () => `${getErpUrl()}/login`,
  advocateRegister: () => `${getErpUrl()}/register`,
  consumerPortal: () => `${getErpUrl()}/citizen-portal`,
  consumerLogin: () => `${getErpUrl()}/citizen-login`,
};

/* ── ADVOCATE ERP ─────────────────────────────────────────────────────── */
// Grouped exactly like the ERP sidebar.
export const erpModuleGroups = [
  {
    id: 'clients',
    title: 'Clients & Cases',
    summary: 'Keep every client, matter and court date organised in one place.',
    modules: [
      { icon: ClipboardList, name: 'Client Intake', desc: 'Capture new enquiries and convert them into clients and matters.' },
      { icon: Users, name: 'Clients CRM', desc: 'Client profiles, contact details, documents and complete matter history.' },
      { icon: Briefcase, name: 'Case Management', desc: 'Track every matter by case number, court, parties and stage.' },
      { icon: CalendarDays, name: 'Hearings & Calendar', desc: 'Hearing diary, monthly calendar, daily prep checklists and client reminders.' },
      { icon: Car, name: 'MACT Management', desc: 'Dedicated workflow and compensation tools for motor accident claims.' },
    ],
  },
  {
    id: 'drafting',
    title: 'Drafting & Research',
    summary: 'Prepare drafts faster and find the law you need without leaving the matter.',
    modules: [
      { icon: FileText, name: 'Draft Workspace', desc: 'Assemble pleadings, notices and affidavits from templates or AI-assisted first drafts, compare revisions, and export with letterhead.' },
      { icon: Search, name: 'Legal Research & Case Laws', desc: 'Store firm judgments with citations, browse Bare Acts, save research notes and prepare arguments.' },
      { icon: BookOpen, name: 'Bare Acts', desc: 'Read statutes and sections while you draft.' },
      { icon: ScanText, name: 'Court Order Analyzer', desc: 'Upload an order and get a structured summary of directions and dates.' },
      { icon: MessageSquareText, name: 'Case Assistant', desc: 'Ask questions about a matter and its documents.' },
    ],
  },
  {
    id: 'practice',
    title: 'Practice & Court',
    summary: 'Run day-to-day litigation work with the right structure for each court.',
    modules: [
      { icon: Scale, name: 'Practice Areas', desc: 'Organise matters by area — civil, criminal, family, MACT and more.' },
      { icon: Building2, name: 'Court Management', desc: 'Maintain the courts, benches and forums you appear before.' },
      { icon: Mail, name: 'Notices & Replies', desc: 'Record notices received and prepare replies on time.' },
      { icon: FolderOpen, name: 'Evidence & Documents', desc: 'Store evidence and case documents against each matter.' },
      { icon: ShieldCheck, name: 'Limitation & Deadlines', desc: 'Track limitation periods and filing deadlines.' },
    ],
  },
  {
    id: 'office',
    title: 'Chamber & Team',
    summary: 'Coordinate your associates and staff with clear roles and tasks.',
    modules: [
      { icon: UsersRound, name: 'Team & Roles', desc: 'Add associates and staff with role-based access.' },
      { icon: CheckSquare, name: 'Tasks', desc: 'Assign and follow up on work across the chamber.' },
      { icon: BarChart3, name: 'Reports', desc: 'Overview of matters, hearings and workload.' },
      { icon: Calculator, name: 'Tools & Calculators', desc: 'Court fee, stamp duty and other everyday legal calculators.' },
      { icon: HardDriveUpload, name: 'Import & Export', desc: 'Bring in existing records and export your data.' },
      { icon: Languages, name: 'Multilingual Interface', desc: 'Use the workspace in English, Marathi, Hindi or Gujarati.' },
    ],
  },
];

// Short list used on the home page and ERP page.
export const erpHighlights = [
  { icon: Users, title: 'Clients & Intake', desc: 'Client profiles, enquiries and complete matter history.' },
  { icon: Briefcase, title: 'Case Management', desc: 'Every matter tracked by court, parties and stage.' },
  { icon: CalendarDays, title: 'Hearings & Calendar', desc: 'Hearing diary, monthly calendar, daily prep checklists and next dates.' },
  { icon: FileText, title: 'Drafting', desc: 'Draft workspace, template library and AI-assisted drafts.' },
  { icon: Search, title: 'Legal Research', desc: 'Case laws, bare acts and court order analysis.' },
  { icon: UsersRound, title: 'Team & Deadlines', desc: 'Roles, tasks, limitation tracking and reports.' },
];

/* ── CONSUMER PORTAL ──────────────────────────────────────────────────── */
// The four tabs that exist inside the portal.
export const consumerTools = [
  {
    icon: Lightbulb,
    name: 'Problem & Legal Remedy',
    tag: 'Free to read',
    desc: 'Describe your problem or pick a category. The portal explains your rights, the time limit, which office to approach, step-by-step actions, documents to carry, the helpline, and what to do if the authority refuses.',
  },
  {
    icon: FileSignature,
    name: 'Application Generator',
    tag: '₹30 per document',
    desc: 'Enter your details and the portal prepares a formal complaint or application, addressed to the correct authority with the relevant legal provisions. Preview, edit and download it as a print-ready A4 PDF.',
  },
  {
    icon: FolderCheck,
    name: 'My Applications',
    tag: 'Saved to your account',
    desc: 'Every document you generate is saved in your account so you can open and download it again whenever you need it.',
  },
  {
    icon: Landmark,
    name: 'Property Legal Check',
    tag: 'Before you buy',
    desc: 'Check land, plot or flat records before a purchase — 7/12 extract and mutation entries, pending court cases, and a cross-check of your sale deed or Index II — and download a property check report.',
  },
];

// The 13 problem categories available in the portal (guideData.ts).
export const consumerCategories = [
  { id: 'cyber_fraud', group: 'Cyber & Banking', icon: CreditCard, title: 'Online banking, UPI or OTP fraud', desc: 'Money taken through fake calls, links, OTP or UPI scams.', authority: 'Cyber police station & bank branch', helpline: '1930' },
  { id: 'police_complaint', group: 'Police', icon: FileText, title: 'Written complaint at a police station', desc: 'How to give a proper written complaint and get an acknowledgement.', authority: 'Police Inspector, local police station', helpline: '112' },
  { id: 'fir_registration', group: 'Police', icon: Siren, title: 'Registering an FIR', desc: 'What an FIR is and how to get one registered under the BNSS.', authority: 'Police Inspector, local police station', helpline: '112' },
  { id: 'police_refusal', group: 'Police', icon: Ban, title: 'Police refused to register an FIR', desc: 'Escalation when the police station will not register your complaint.', authority: 'Superintendent of Police / DCP', helpline: '112' },
  { id: 'zero_fir', group: 'Police', icon: MapPinned, title: 'Zero FIR at any police station', desc: 'Register an FIR at the nearest station, wherever the incident happened.', authority: 'Officer in charge, any police station', helpline: '112' },
  { id: 'arrest_rights', group: 'Police', icon: UserCheck, title: 'Rights during arrest', desc: 'Rights of the arrested person and family members.', authority: 'Police Inspector / Judicial Magistrate', helpline: '15100' },
  { id: 'bail_procedure', group: 'Police', icon: Gavel, title: 'Bail procedure', desc: 'Bail provisions and the procedure under the BNSS, 2023.', authority: 'Judicial Magistrate / Sessions Court', helpline: '15100' },
  { id: 'unpaid_salary', group: 'Work', icon: Wallet, title: 'Unpaid salary or illegal termination', desc: 'Salary withheld, dues unpaid or termination without due process.', authority: 'Assistant Labour Commissioner', helpline: null },
  { id: 'consumer_fraud', group: 'Consumer', icon: ShoppingBag, title: 'Defective product, warranty refusal or builder cheating', desc: 'Faulty goods, refused warranty, poor service or builder default.', authority: 'District Consumer Commission', helpline: '1915' },
  { id: 'property_land', group: 'Property', icon: HomeIcon, title: 'Property encroachment or land trespass', desc: 'Someone occupying or trespassing on your land or property.', authority: 'Tahsildar / Police Inspector', helpline: '112' },
  { id: 'women_safety', group: 'Women', icon: HeartHandshake, title: 'Women’s safety, domestic violence & harassment', desc: 'Protection under domestic violence and harassment laws.', authority: 'Police Inspector / Protection Officer', helpline: '181' },
  { id: 'lost_document', group: 'Documents', icon: FileSearch, title: 'Lost documents or missing mobile phone', desc: 'Report lost documents or a missing phone and get a record of it.', authority: 'Police Inspector, local police station', helpline: '112' },
  { id: 'rti_portal', group: 'Government', icon: FileQuestion, title: 'Right to Information (RTI) application', desc: 'Ask a government office for information under the RTI Act, 2005.', authority: 'Public Information Officer', helpline: null },
];

export const consumerSteps = [
  { title: 'Choose your problem', desc: 'Type what happened in your own words or select one of the 13 categories.' },
  { title: 'Read the legal remedy', desc: 'See your rights, deadlines, where to go and the documents you need — free.' },
  { title: 'Generate your application', desc: 'Sign in, fill in your details and preview the formatted complaint or application.' },
  { title: 'Pay ₹30 & download', desc: 'Pay by UPI and download a print-ready A4 PDF to sign and submit.' },
];
