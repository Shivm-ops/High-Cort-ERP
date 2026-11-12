"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  ShieldAlert,
  FileText,
  Clock,
  Printer,
  Copy,
  PlusCircle,
  ExternalLink,
  PhoneCall,
  User,
  LogOut,
  Globe,
  CheckCircle2,
  AlertCircle,
  Search,
  BookOpen,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Building2,
  Shield,
  AlertTriangle,
  Lock,
  MapPin,
  UserCheck,
  ShoppingBag,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import CitizenHelpPage from "@/app/(dashboard)/citizen-help/page";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  EMERGENCY_SCENARIOS,
  GOLDEN_RULES,
  LAW_COMPARISON_TABLE,
  GUIDE_CHAPTERS,
  EmergencyScenario,
  ChapterSection,
} from "./guideData";

type PortalTab = "draft" | "emergency" | "guide" | "rights" | "portals" | "saved";
type Language = "mr" | "hi" | "en";

interface SavedGrievance {
  id: string;
  category: string;
  language: string;
  applicant_name: string;
  applicant_phone?: string;
  opposite_party?: string;
  incident_date?: string;
  target_authority?: string;
  facts_summary?: string;
  generated_application?: string;
  created_at: string;
  status: string;
}

const PORTAL_STRINGS: Record<Language, Record<string, string>> = {
  mr: {
    portalTitle: "फास्टकेस नागरिक विधी सहाय्य कक्ष",
    portalSubtitle: "महाराष्ट्र नागरिक कायदेविषयक मार्गदर्शिका व १-क्लिक अधिकृत तक्रार निवारण पोर्टल",
    tabDraft: "तक्रार अर्ज तयार करा",
    tabEmergency: "पहिली ६० मिनिटे (आपत्कालीन)",
    tabGuide: "१० सविस्तर कायदे प्रकरणे",
    tabRights: "मूलभूत हक्क व ८ सुवर्ण नियम",
    tabPortals: "शासकीय पोर्टल्स व हेल्पलाईन",
    tabSaved: "माझे जतन केलेले अर्ज",
    citizenBadge: "नोंदणीकृत नागरिक",
    guestBadge: "अतिथी नागरिक",
    logoutBtn: "लॉगआउट",
    loginBtn: "नागरिक लॉगिन / नोंदणी",
    emergencyAlert: "तातडीची मदत (२४x७): पोलीस ११२ | महिला १०९१/१८१ | सायबर १९३० | मोफत विधी सेवा १५१००",
    noSavedTitle: "अद्याप कोणताही अर्ज जतन केलेला नाही",
    noSavedDesc: "'तक्रार अर्ज तयार करा' टॅबमधून आपली समस्या सांगून १-क्लिकमध्ये अधिकृत अर्ज तयार करा.",
    startDraftBtn: "आत्ताच तक्रार अर्ज तयार करा →",
    printBtn: "A4 प्रिंट / पीडीएफ",
    copyBtn: "मजकूर कॉपी करा",
    createdOn: "तारीख:",
    authorityLabel: "सक्षम प्राधिकारी:",
  },
  hi: {
    portalTitle: "फास्टकेस नागरिक विधिक सहायता पोर्टल",
    portalSubtitle: "महाराष्ट्र नागरिक कानूनी मार्गदर्शिका एवं १-क्लिक आधिकारिक शिकायत निवारण पोर्टल",
    tabDraft: "शिकायत आवेदन तैयार करें",
    tabEmergency: "पहले ६० मिनट (आपातकालीन)",
    tabGuide: "१० विस्तृत कानूनी अध्याय",
    tabRights: "मूल अधिकार एवं ८ स्वर्णिम नियम",
    tabPortals: "सरकारी पोर्टल एवं हेल्पलाइन",
    tabSaved: "मेरे सुरक्षित आवेदन",
    citizenBadge: "पंजीकृत नागरिक",
    guestBadge: "अतिथि नागरिक",
    logoutBtn: "लॉगआउट",
    loginBtn: "नागरिक लॉगिन / पंजीकरण",
    emergencyAlert: "आपातकालीन हेल्पलाइन (२४x७): पुलिस ११२ | महिला १०९१/१८१ | साइबर फ्रॉड १९३० | विधिक सेवा १५१००",
    noSavedTitle: "अभी तक कोई आवेदन सुरक्षित नहीं है",
    noSavedDesc: "'शिकायत आवेदन तैयार करें' टॅब से अपनी समस्या लिखकर पेशेवर आवेदन तैयार करें।",
    startDraftBtn: "शिकायत पत्र तैयार करें →",
    printBtn: "A4 प्रिंट / पीडीएफ",
    copyBtn: "टेक्स्ट कॉपी करें",
    createdOn: "दिनांक:",
    authorityLabel: "सक्षम अधिकारी:",
  },
  en: {
    portalTitle: "FastCase Citizen Legal Assistance Portal",
    portalSubtitle: "Maharashtra Citizen Legal Guidebook & 1-Click Statutory Grievance Redressal Portal",
    tabDraft: "Draft Complaint Application",
    tabEmergency: "First 60 Mins (Emergency)",
    tabGuide: "10 Detailed Legal Chapters",
    tabRights: "Rights & 8 Golden Rules",
    tabPortals: "Govt Portals & Helplines",
    tabSaved: "My Saved Applications",
    citizenBadge: "Registered Citizen",
    guestBadge: "Guest User",
    logoutBtn: "Logout",
    loginBtn: "Citizen Login / Sign Up",
    emergencyAlert: "24x7 Emergency Helplines: Police 112 | Women 1091/181 | Cyber 1930 | Free Legal Aid 15100",
    noSavedTitle: "No Saved Applications Yet",
    noSavedDesc: "Use the 'Draft Complaint Application' tab to generate a court-ready legal grievance in 1 click.",
    startDraftBtn: "Start Drafting Now →",
    printBtn: "A4 Print / Save PDF",
    copyBtn: "Copy Text",
    createdOn: "Created:",
    authorityLabel: "Target Authority:",
  },
};

const OFFICIAL_GOVT_PORTALS = [
  {
    name: "National Cyber Crime Reporting Portal",
    name_mr: "राष्ट्रीय सायबर गुन्हे तक्रार पोर्टल (१९३०)",
    url: "https://cybercrime.gov.in",
    helpline: "1930 (Golden Hour)",
    desc: "Report UPI fraud, fake links, financial cyber cheating, and social media abuse.",
    badge: "Cybercrime",
  },
  {
    name: "Maharashtra Police Citizen Portal",
    name_mr: "महाराष्ट्र पोलीस सिटिझन पोर्टल (CCTNS)",
    url: "https://citizen.mahapolice.gov.in",
    helpline: "112 (Statewide)",
    desc: "Online complaints, lost & found document reporting, FIR status tracking, and tenant verification.",
    badge: "Police / CCTNS",
  },
  {
    name: "National Consumer Helpline & e-Daakhil",
    name_mr: "राष्ट्रीय ग्राहक हेल्पलाईन व ई-दाखील मंच",
    url: "https://consumerhelpline.gov.in",
    helpline: "1915 / 1800-11-4000",
    desc: "File complaints against defective products, builder fraud, misleading ads, and warranty refusals.",
    badge: "Consumer",
  },
  {
    name: "RTI Online (Right to Information Portal)",
    name_mr: "आरटीआय ऑनलाईन (माहिती अधिकार पोर्टल)",
    url: "https://rtionline.gov.in",
    helpline: "1800 11 0031",
    desc: "Submit online RTI applications and first appeals to Central and State Government departments.",
    badge: "RTI",
  },
  {
    name: "National Legal Services Authority (NALSA)",
    name_mr: "राष्ट्रीय विधी सेवा प्राधिकरण (मोफत सरकारी वकील)",
    url: "https://nalsa.gov.in",
    helpline: "15100 (Toll-Free)",
    desc: "Free legal services for women, children, SC/ST, and individuals earning below ₹3 Lakhs.",
    badge: "Legal Aid",
  },
  {
    name: "Centralized Public Grievance Portal (CPGRAMS)",
    name_mr: "केंद्रीकृत सार्वजनिक तक्रार निवारण पोर्टल (CPGRAMS)",
    url: "https://pgportal.gov.in",
    helpline: "1800 11 1968",
    desc: "Lodge grievances directly against any Central Government or State Government department.",
    badge: "Public Grievance",
  },
  {
    name: "National Commission for Women (NCW Online)",
    name_mr: "राष्ट्रीय महिला आयोग ऑनलाईन तक्रार कक्ष",
    url: "http://ncwapps.nic.in/onlinecomplaintsv2",
    helpline: "7827170170 / 1091",
    desc: "Domestic violence, workplace sexual harassment (POSH), and dowry harassment complaints.",
    badge: "Women Safety",
  },
  {
    name: "eCourts Services Portal",
    name_mr: "ई-कोर्ट्स सिटिझन पोर्टल (केस स्टेटस व निकाल)",
    url: "https://ecourts.gov.in",
    helpline: "eCourts App",
    desc: "Track case status, cause lists, daily orders, and certified copies of judgments across India.",
    badge: "Courts",
  },
];

export default function CitizenPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<PortalTab>("draft");
  const [lang, setLang] = useState<Language>("mr");
  const [savedRecords, setSavedRecords] = useState<SavedGrievance[]>([]);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false);

  // Guide Chapter Filter & Expansion
  const [selectedChapterId, setSelectedChapterId] = useState<string>("police_complaint");
  const [guideSearch, setGuideSearch] = useState<string>("");
  const [activeDraftModal, setActiveDraftModal] = useState<{ title: string; content: string } | null>(null);

  const t = PORTAL_STRINGS[lang];

  const loadSavedHistory = async () => {
    if (!isAuthenticated) return;
    setLoadingSaved(true);
    try {
      const res = await api.get("/citizen-help/history");
      setSavedRecords(res.data || []);
    } catch {
      // User may be guest
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    loadSavedHistory();
  }, [isAuthenticated]);

  const activeChapter = GUIDE_CHAPTERS.find((c) => c.id === selectedChapterId) || GUIDE_CHAPTERS[0];

  const filteredChapters = GUIDE_CHAPTERS.filter((c) => {
    if (!guideSearch.trim()) return true;
    const q = guideSearch.toLowerCase();
    return (
      c.title_mr.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.summary_mr.toLowerCase().includes(q) ||
      c.sections.applicableLaws.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#F4F6F3] text-gray-900 flex flex-col font-sans">
      {/* ── Emergency SOS Top Bar ── */}
      <div className="bg-[#B91C1C] text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>{t.emergencyAlert}</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="tel:112" className="underline hover:text-red-200">📞 Police: 112</a>
          <a href="tel:1091" className="underline hover:text-red-200">👩 Women: 1091</a>
          <a href="tel:1930" className="underline hover:text-red-200">💳 Cyber: 1930</a>
          <a href="tel:15100" className="underline hover:text-red-200">⚖ Legal Aid: 15100</a>
        </div>
      </div>

      {/* ── Main Citizen Header ── */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-md">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-gray-900">
                  {t.portalTitle}
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  {isAuthenticated ? t.citizenBadge : t.guestBadge}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">
                {t.portalSubtitle}
              </p>
            </div>
          </div>

          {/* User Controls & Language */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Language Switch */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <Globe className="w-3.5 h-3.5 text-gray-500 ml-1.5" />
              {(["mr", "hi", "en"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition",
                    lang === l
                      ? "bg-white text-emerald-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {l === "mr" ? "मराठी" : l === "hi" ? "हिंदी" : "EN"}
                </button>
              ))}
            </div>

            {/* Auth Button */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl">
                <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <div className="text-left hidden md:block">
                  <span className="block text-xs font-bold text-gray-900 leading-tight">
                    {user?.full_name || "Citizen"}
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-medium">
                    {user?.email}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="ml-1 text-gray-400 hover:text-red-600 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/citizen-login"
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t.loginBtn}</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-gray-100 flex items-center gap-2 overflow-x-auto py-2">
          {/* Tab 1: Complaint Generator */}
          <button
            onClick={() => setActiveTab("draft")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap",
              activeTab === "draft"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.tabDraft}</span>
          </button>

          {/* Tab 2: First 60 Minutes Emergency */}
          <button
            onClick={() => setActiveTab("emergency")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap",
              activeTab === "emergency"
                ? "bg-red-700 text-white shadow-sm"
                : "text-red-700 bg-red-50 hover:bg-red-100 font-extrabold"
            )}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t.tabEmergency}</span>
          </button>

          {/* Tab 3: 10 Chapters Guide */}
          <button
            onClick={() => setActiveTab("guide")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap",
              activeTab === "guide"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.tabGuide}</span>
          </button>

          {/* Tab 4: Rights & Golden Rules */}
          <button
            onClick={() => setActiveTab("rights")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap",
              activeTab === "rights"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Scale className="w-4 h-4" />
            <span>{t.tabRights}</span>
          </button>

          {/* Tab 5: Portals & Helplines */}
          <button
            onClick={() => setActiveTab("portals")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap",
              activeTab === "portals"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>{t.tabPortals}</span>
          </button>

          {/* Tab 6: Saved Applications */}
          <button
            onClick={() => {
              setActiveTab("saved");
              loadSavedHistory();
            }}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap relative",
              activeTab === "saved"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <FileText className="w-4 h-4" />
            <span>{t.tabSaved}</span>
            {savedRecords.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold ml-1">
                {savedRecords.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Tab Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ── TAB 1: DRAFT COMPLAINT APPLICATION ── */}
        {activeTab === "draft" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-2 sm:p-6">
            <CitizenHelpPage />
          </div>
        )}

        {/* ── TAB 2: FIRST 60 MINUTES EMERGENCY GUIDE ── */}
        {activeTab === "emergency" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 text-white rounded-3xl p-6 sm:p-8 shadow-md">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full bg-red-500/40 border border-red-400 text-xs font-black uppercase tracking-wider">
                  पहिली ६० मिनिटे – आपत्कालीन मार्गदर्शक
                </span>
                <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                  ८ गंभीर प्रसंग
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black">
                घटनेनंतरच्या पहिल्या एका तासात काय करावे व काय टाळावे?
              </h2>
              <p className="text-xs sm:text-sm text-red-100 mt-2 max-w-3xl leading-relaxed">
                गुन्हा घडल्यानंतर पहिली ६० ते १२० मिनिटे अत्यंत निर्णायक असतात. या काळात घेतलेला योग्य कायदेशीर निर्णय, डिजिटल पुराव्यांचे जतन आणि योग्य हेल्पलाईनवर नोंद आपल्याला १००% न्याय मिळवून देते.
              </p>
            </div>

            {/* 8 Emergency Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EMERGENCY_SCENARIOS.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-red-100 text-red-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-600" />
                        {s.timeWindow}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                        {s.helpline}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 leading-snug">
                      {lang === "mr" ? s.title_mr : lang === "hi" ? s.title_hi : s.title_en}
                    </h3>

                    {/* Immediate Actions */}
                    <div className="space-y-1.5 pt-2">
                      <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        तातडीने करावयाची कृती (Immediate Actions):
                      </p>
                      <ul className="text-xs text-gray-700 space-y-1 pl-5 list-disc leading-relaxed">
                        {s.immediateActions_mr.map((act, idx) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Evidence Checklist */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <p className="text-xs font-bold text-blue-900 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5 text-blue-700" />
                        आवश्यक पुरावे (Evidence Checklist):
                      </p>
                      <ul className="text-xs text-gray-600 space-y-0.5 pl-5 list-disc leading-relaxed">
                        {s.evidenceChecklist_mr.map((ev, idx) => (
                          <li key={idx}>{ev}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Mistakes to Avoid */}
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 space-y-1">
                      <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        काय टाळावे? (Mistakes to Avoid):
                      </p>
                      <ul className="text-[11px] text-amber-800 space-y-0.5 pl-4 list-disc leading-snug">
                        {s.mistakesToAvoid_mr.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Legal Provision Tag */}
                  <div className="pt-3 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
                    <span className="font-bold text-gray-700">कायदेशीर तरतूद: </span>
                    {s.legalProvisions_mr}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: 10 DETAILED CHAPTERS GUIDE (12-SECTION ARCHITECTURE) ── */}
        {activeTab === "guide" && (
          <div className="space-y-6">
            {/* Header & Search */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  महाराष्ट्र नागरिक कायदेविषयक मार्गदर्शिका (१० सविस्तर प्रकरणे)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  नवीन फौजदारी कायदे (BNS, BNSS, BSA २०२३), सर्वोच्च न्यायालयाचे निकाल व कोर्ट-मान्य अर्जांच्या नमुन्यांसह.
                </p>
              </div>

              {/* Search box */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={guideSearch}
                  onChange={(e) => setGuideSearch(e.target.value)}
                  placeholder="प्रकरण, कलम किंवा विषय शोधा..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            </div>

            {/* 2-Column Layout: Left Chapters List, Right 12-Section Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Chapters Navigation (4 cols) */}
              <div className="lg:col-span-4 space-y-2">
                {filteredChapters.map((ch) => {
                  const isSelected = ch.id === selectedChapterId;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setSelectedChapterId(ch.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 shadow-xs",
                        isSelected
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-md"
                          : "bg-white text-gray-800 border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40"
                      )}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span
                          className={cn(
                            "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5",
                            isSelected
                              ? "bg-white text-emerald-900"
                              : "bg-emerald-100 text-emerald-900"
                          )}
                        >
                          {ch.chapterNumber}
                        </span>
                        <div className="min-w-0">
                          <span
                            className={cn(
                              "text-[10px] font-extrabold uppercase tracking-wider block",
                              isSelected ? "text-emerald-200" : "text-emerald-700"
                            )}
                          >
                            {ch.category}
                          </span>
                          <p className="text-xs font-bold leading-tight line-clamp-2 mt-0.5">
                            {ch.title_mr}
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 flex-shrink-0",
                          isSelected ? "text-white" : "text-gray-400"
                        )}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Active Chapter 12-Section Architecture (8 cols) */}
              <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
                {/* Chapter Banner */}
                <div className="border-b border-gray-100 pb-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black uppercase">
                      प्रकरण {activeChapter.chapterNumber} &bull; {activeChapter.category}
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                    {activeChapter.title_mr}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    {activeChapter.summary_mr}
                  </p>
                </div>

                {/* 12-Section Uniform Grid */}
                <div className="space-y-5 text-xs text-gray-700">
                  {/* 1. Understand Problem */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px]">१</span>
                      समस्या समजून घ्या (Understand the Problem)
                    </h4>
                    <p className="leading-relaxed pl-7 text-gray-700">
                      {activeChapter.sections.understandProblem}
                    </p>
                  </div>

                  {/* 2. First Action */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                    <h4 className="font-bold text-amber-950 flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">२</span>
                      सर्वप्रथम काय करावे? (Immediate First Action)
                    </h4>
                    <p className="leading-relaxed pl-7 text-amber-900">
                      {activeChapter.sections.firstAction}
                    </p>
                  </div>

                  {/* 3. Competent Office */}
                  <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
                    <h4 className="font-bold text-blue-950 flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px]">३</span>
                      कोणत्या कार्यालयात / अधिकाऱ्याकडे जावे? (Competent Authority)
                    </h4>
                    <p className="leading-relaxed pl-7 text-blue-900 font-semibold">
                      {activeChapter.sections.competentAuthority}
                    </p>
                  </div>

                  {/* 4. Required Documents */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                    <h4 className="font-bold text-emerald-950 flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px]">४</span>
                      आवश्यक कागदपत्रांची यादी (Required Documents Checklist)
                    </h4>
                    <ul className="pl-7 list-disc space-y-1 text-emerald-900">
                      {activeChapter.sections.requiredDocuments.map((doc, idx) => (
                        <li key={idx}>{doc}</li>
                      ))}
                    </ul>
                  </div>

                  {/* 5. Step-by-step Filing Procedure */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px]">५</span>
                      तक्रार दाखल करण्याची टप्प्याटप्प्याने प्रक्रिया (Step-by-Step Procedure)
                    </h4>
                    <ol className="pl-7 list-decimal space-y-1.5 text-gray-700 leading-relaxed">
                      {activeChapter.sections.filingProcedure.map((stp, idx) => (
                        <li key={idx}>{stp}</li>
                      ))}
                    </ol>
                  </div>

                  {/* 6. Statutory Deadlines & 7. Refusal Remedies */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                      <h4 className="font-bold text-purple-950 flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-[10px]">६</span>
                        कायदेशीर मुदती (Statutory Deadlines)
                      </h4>
                      <p className="leading-relaxed text-purple-900 font-medium">
                        {activeChapter.sections.statutoryDeadlines}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-red-50/70 border border-red-200 space-y-1">
                      <h4 className="font-bold text-red-950 flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-red-700 text-white flex items-center justify-center text-[10px]">७</span>
                        तक्रार नाकारल्यास काय करावे? (Refusal Remedies)
                      </h4>
                      <p className="leading-relaxed text-red-900 font-medium">
                        {activeChapter.sections.refusalRemedies}
                      </p>
                    </div>
                  </div>

                  {/* 8. Applicable Laws & 9. Landmark Precedents */}
                  <div className="p-4 rounded-2xl bg-emerald-900 text-white space-y-2">
                    <h4 className="font-bold text-emerald-200 flex items-center gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px]">८</span>
                      संबंधित कायदे व कलमे (BNS, BNSS, BSA २०२३)
                    </h4>
                    <p className="leading-relaxed text-emerald-100 pl-7">
                      {activeChapter.sections.applicableLaws}
                    </p>
                    <div className="pt-2 border-t border-emerald-800/80 mt-2 pl-7">
                      <span className="font-bold text-emerald-300">महत्त्वाचे न्यायालयीन निकाल: </span>
                      <span className="text-emerald-100">{activeChapter.sections.landmarkJudgments}</span>
                    </div>
                  </div>

                  {/* 11. Sample Application Draft */}
                  <div className="bg-gradient-to-br from-gray-900 to-slate-900 text-white p-5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-xs text-white">
                          तयार अर्जाचा कोर्ट-मान्य नमुना (Ready Application Draft)
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(activeChapter.sampleDraft.content);
                            toast.success("अर्जाचा नमुना कॉपी झाला!");
                          }}
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Copy className="w-3.5 h-3.5" /> कॉपी करा
                        </button>
                        <button
                          onClick={() => setActiveDraftModal(activeChapter.sampleDraft)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                        >
                          <Printer className="w-3.5 h-3.5" /> संपूर्ण नमुना पहा
                        </button>
                      </div>
                    </div>
                    <pre className="text-[11px] font-mono bg-black/40 p-4 rounded-xl max-h-40 overflow-y-auto whitespace-pre-wrap text-gray-200 border border-white/10">
                      {activeChapter.sampleDraft.content}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: CONSTITUTIONAL RIGHTS & 8 PRACTICAL RULES ── */}
        {activeTab === "rights" && (
          <div className="space-y-8">
            {/* 8 Golden Rules Banner */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase">
                  नागरिकांचे ८ सुवर्ण नियम (8 Practical Citizen Rules)
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                कोणत्याही सरकारी कार्यालयात किंवा पोलीस ठाण्यात जाताना पाळावयाचे नियम
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                कायदा सर्वांसाठी समान असला तरी कायदेशीर प्रक्रिया कशी वापरावी हे माहित असल्यासच नागरिकांचे हक्क अबाधित राहतात.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {GOLDEN_RULES.map((r) => (
                  <div
                    key={r.number}
                    className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 hover:border-amber-400 transition space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-sm">
                        {r.number}
                      </div>
                      <h4 className="font-bold text-sm text-amber-950 leading-snug">
                        {r.title_mr}
                      </h4>
                      <p className="text-xs text-amber-900/80 leading-relaxed">
                        {r.desc_mr}
                      </p>
                    </div>
                    <p className="text-[11px] font-bold text-amber-800 bg-amber-100/60 p-2 rounded-xl mt-2">
                      💡 {r.action_mr}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* New Criminal Laws 2023 Comparison Table */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase">
                  नवीन फौजदारी कायदे २०२३ तुलना तक्ता
                </span>
              </div>
              <h3 className="text-xl font-black text-gray-900">
                BNS, BNSS व BSA २०२३ विरुद्ध जुने कायदे (IPC, CrPC, पुरावा कायदा)
              </h3>
              <p className="text-xs text-gray-500">
                १ जुलै २०२४ पासून संपूर्ण भारतात लागू झालेल्या नवीन कायदेशीर तरतुदींचा नागरिकांसाठी सुलभ तक्ता.
              </p>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-emerald-900 text-white text-[11px] uppercase tracking-wider">
                      <th className="p-3.5 rounded-tl-xl font-bold">विषय / हक्क</th>
                      <th className="p-3.5 font-bold">नवीन कायदा (BNS / BNSS / BSA २०२३)</th>
                      <th className="p-3.5 font-bold">जुना कायदा (IPC / CrPC)</th>
                      <th className="p-3.5 rounded-tr-xl font-bold">नागरिकांसाठी मुख्य बदल</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {LAW_COMPARISON_TABLE.map((row, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/40 transition">
                        <td className="p-3.5 font-bold text-gray-900">{row.subject}</td>
                        <td className="p-3.5 font-bold text-emerald-800">{row.bns_bnss}</td>
                        <td className="p-3.5 text-gray-500 line-through">{row.old_law}</td>
                        <td className="p-3.5 text-gray-700 leading-relaxed">{row.key_change}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 5: GOVERNMENT PORTALS & HELPLINES ── */}
        {activeTab === "portals" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t.tabPortals}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                महाराष्ट्र शासन व भारत सरकारची अधिकृत तक्रार पोर्टल्स आणि २४x७ टोल-फ्री हेल्पलाईन क्रमांक.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {OFFICIAL_GOVT_PORTALS.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-600 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 uppercase">
                        {p.badge}
                      </span>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        {p.helpline}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900">
                      {lang === "mr" ? p.name_mr : p.name}
                    </h4>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>

                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition"
                  >
                    <span>अधिकृत पोर्टल उघडा</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: MY SAVED APPLICATIONS ── */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.tabSaved}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  आपण तयार केलेले सर्व अधिकृत तक्रार अर्ज, प्रिंट व्ह्यू व डाउनलोड हिस्टरी.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("draft")}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>नवीन अर्ज तयार करा</span>
              </button>
            </div>

            {loadingSaved ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-500 font-semibold">अर्जांची माहिती लोड होत आहे...</p>
              </div>
            ) : savedRecords.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8 opacity-80" />
                </div>
                <h4 className="text-base font-bold text-gray-900">{t.noSavedTitle}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{t.noSavedDesc}</p>
                <button
                  onClick={() => setActiveTab("draft")}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow transition"
                >
                  {t.startDraftBtn}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedRecords.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-500 p-5 shadow-sm hover:shadow-md transition space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase">
                        {r.category}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {r.applicant_name} {r.opposite_party ? `vs. ${r.opposite_party}` : ""}
                      </h4>
                      <p className="text-xs text-emerald-800 font-semibold mt-1">
                        {t.authorityLabel} {r.target_authority || "सक्षम कार्यालय"}
                      </p>
                      {r.facts_summary && (
                        <p className="text-xs text-gray-600 line-clamp-2 mt-1.5 leading-relaxed bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          {r.facts_summary}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          if (r.generated_application) {
                            navigator.clipboard.writeText(r.generated_application);
                            toast.success("अर्जाचा मजकूर कॉपी झाला!");
                          }
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
                      >
                        <Copy className="w-3.5 h-3.5" /> {t.copyBtn}
                      </button>

                      <a
                        href={`/api/v1/citizen-help/applications/${r.id}/print-view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5" /> {t.printBtn}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Sample Draft Full Modal ── */}
      {activeDraftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                {activeDraftModal.title}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeDraftModal.content);
                    toast.success("अर्जाचा मजकूर कॉपी झाला!");
                  }}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> कॉपी करा
                </button>
                <button
                  onClick={() => setActiveDraftModal(null)}
                  className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed bg-[#FCFDFB]">
              {activeDraftModal.content}
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
              <span>A4 कोर्ट-मान्य नमुना &bull; भारतीय नागरिक सुरक्षा संहिता २०२३</span>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> प्रिंट करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">
          FastCase &bull; One-Click Citizen Legal Help & Grievance Assistance Portal
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          Designed for Ordinary Citizens &bull; No Prior Legal Knowledge Required &bull; Free Statutory Enactments
        </p>
      </footer>
    </div>
  );
}
