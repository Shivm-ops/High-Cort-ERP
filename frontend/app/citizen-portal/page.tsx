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
  RotateCcw,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import CitizenHelpPage from "@/app/(dashboard)/citizen-help/page";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type PortalTab = "draft" | "saved" | "portals" | "rights";
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
    portalSubtitle: "सामान्य नागरिकांसाठी मोफत कायदेशीर मार्गदर्शन, तक्रार अर्ज व अधिकार माहिती",
    tabDraft: "नवीन तक्रार अर्ज तयार करा",
    tabSaved: "माझे जतन केलेले अर्ज",
    tabPortals: "शासकीय पोर्टल्स व हेल्पलाईन",
    tabRights: "नागरिकांचे कायदेशीर अधिकार",
    citizenBadge: "नोंदणीकृत नागरिक",
    guestBadge: "अतिथी नागरिक",
    logoutBtn: "लॉगआउट",
    loginBtn: "नागरिक लॉगिन / नोंदणी",
    emergencyAlert: "तातडीची मदत (२४x७): पोलीस ११२ | महिला १०९१/१८१ | सायबर १९३० | मोफत विधी सेवा १५१००",
    noSavedTitle: "अद्याप कोणताही अर्ज जतन केलेला नाही",
    noSavedDesc: "'नवीन तक्रार अर्ज तयार करा' टॅबमधून आपली समस्या सांगून १-क्लिकमध्ये अधिकृत अर्ज तयार करा.",
    startDraftBtn: "आत्ताच तक्रार अर्ज तयार करा →",
    printBtn: "A4 प्रिंट / पीडीएफ",
    copyBtn: "मजकूर कॉपी करा",
    createdOn: "तारीख:",
    authorityLabel: "सक्षम प्राधिकारी:",
  },
  hi: {
    portalTitle: "फास्टकेस नागरिक विधिक सहायता पोर्टल",
    portalSubtitle: "आम नागरिकों के लिए निशुल्क कानूनी सलाह, शिकायत आवेदन जनरेटर व अधिकार मार्गदर्शिका",
    tabDraft: "नया शिकायत आवेदन तैयार करें",
    tabSaved: "मेरे सुरक्षित आवेदन",
    tabPortals: "सरकारी पोर्टल एवं हेल्पलाइन",
    tabRights: "नागरिकों के कानूनी अधिकार",
    citizenBadge: "पंजीकृत नागरिक",
    guestBadge: "अतिथि नागरिक",
    logoutBtn: "लॉगआउट",
    loginBtn: "नागरिक लॉगिन / पंजीकरण",
    emergencyAlert: "आपातकालीन हेल्पलाइन (२४x७): पुलिस ११२ | महिला १०९१/१८१ | साइबर फ्रॉड १९३० | विधिक सेवा १५१००",
    noSavedTitle: "अभी तक कोई आवेदन सुरक्षित नहीं है",
    noSavedDesc: "'नया शिकायत आवेदन' टॅब से अपनी समस्या लिखकर पेशेवर आवेदन तैयार करें।",
    startDraftBtn: "शिकायत पत्र तैयार करें →",
    printBtn: "A4 प्रिंट / पीडीएफ",
    copyBtn: "टेक्स्ट कॉपी करें",
    createdOn: "दिनांक:",
    authorityLabel: "सक्षम अधिकारी:",
  },
  en: {
    portalTitle: "FastCase Citizen Legal Assistance Portal",
    portalSubtitle: "Free statutory guidance, court-ready application generator, and citizen rights",
    tabDraft: "Draft New Application",
    tabSaved: "My Saved Applications",
    tabPortals: "Govt Portals & Helplines",
    tabRights: "Know Your Legal Rights",
    citizenBadge: "Registered Citizen",
    guestBadge: "Guest User",
    logoutBtn: "Logout",
    loginBtn: "Citizen Login / Sign Up",
    emergencyAlert: "24x7 Emergency Helplines: Police 112 | Women 1091/181 | Cyber 1930 | Free Legal Aid 15100",
    noSavedTitle: "No Saved Applications Yet",
    noSavedDesc: "Use the 'Draft New Application' tab to generate a court-ready legal grievance in 1 click.",
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
];

export default function CitizenPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<PortalTab>("draft");
  const [lang, setLang] = useState<Language>("mr");
  const [savedRecords, setSavedRecords] = useState<SavedGrievance[]>([]);
  const [loadingSaved, setLoadingSaved] = useState<boolean>(false);

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
          <a href="tel:1930" className="underline hover:text-red-200">💳 Cyber Fraud: 1930</a>
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

          <button
            onClick={() => setActiveTab("rights")}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition whitespace-nowrap",
              activeTab === "rights"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t.tabRights}</span>
          </button>
        </div>
      </header>

      {/* ── Main Tab Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ── TAB 1: DRAFT APPLICATION ── */}
        {activeTab === "draft" && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden p-2 sm:p-6">
            <CitizenHelpPage />
          </div>
        )}

        {/* ── TAB 2: MY SAVED APPLICATIONS ── */}
        {activeTab === "saved" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{t.tabSaved}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  View, edit, and print your formal legal complaint applications.
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

        {/* ── TAB 3: GOVERNMENT PORTALS & HELPLINES ── */}
        {activeTab === "portals" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t.tabPortals}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Verified official Government of India portals and 24x7 toll-free citizen grievance helplines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

        {/* ── TAB 4: CITIZEN RIGHTS GUIDE ── */}
        {activeTab === "rights" && (
          <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 space-y-6 shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{t.tabRights}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                भारतीय संविधानाने व कायद्याने सामान्य नागरिकांना दिलेले महत्त्वाचे मूलभूत हक्क व अधिकार.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">1</span>
                  पोलीस ठाण्यात झिरो एफआयआर (Zero FIR) नोंदवण्याचा हक्क
                </h4>
                <p className="text-xs text-emerald-900/90 leading-relaxed pl-8">
                  कोणताही दखलपात्र गुन्हा घडल्यास गुन्हा कोणत्याही हद्दीत घडला असला तरी भारतातील कोणत्याही पोलीस ठाण्यात BNSS २०२३ चे कलम १७३ अन्वये तात्काळ Zero FIR नोंदवून घेणे पोलिसांवर बंधनकारक आहे. पोलिसांनी नकार दिल्यास कलम १७३(४) अन्वये पोलीस अधीक्षकांकडे (SP) अथवा कलम १७५(३) अन्वये न्यायालयात दाद मागता येते.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">2</span>
                  मोफत सरकारी वकील मिळण्याचा अधिकार (विधी सेवा प्राधिकरण कायदा कलम १२)
                </h4>
                <p className="text-xs text-emerald-900/90 leading-relaxed pl-8">
                  प्रत्येक महिला, बालक, अनुसूचित जाती/जमाती व ₹३ लाखांपेक्षा कमी वार्षिक उत्पन्न असणाऱ्या कोणत्याही नागरिकास न्यायालयात मोफत सरकारी वकील, कोर्ट फी माफी व कागदपत्रांचा खर्च शासनाकडून मिळण्याचा घटनात्मक अधिकार (कलम ३९A) आहे. यासाठी १५१०० वर संपर्क साधावा.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">3</span>
                  सायबर फ्रॉडमध्ये 'गोल्डन अवर' व बँक झिरो लायबिलिटी (Zero Liability)
                </h4>
                <p className="text-xs text-emerald-900/90 leading-relaxed pl-8">
                  ऑनलाइन बँक फसवणूक झाल्यास पहिल्या २-३ तासांत १९३० वर कॉल केल्यास चोरट्याचे बँक खाते गोठवले जाते. तसेच ३ दिवसांच्या आत आपल्या बँकेला लेखी तक्रार दिल्यास RBI नियमांनुसार नागरिकाचे पूर्ण पैसे परत मिळतात व ग्राहकावर कोणतेही दायित्व राहत नाही.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white text-xs font-bold flex items-center justify-center">4</span>
                  माहिती अधिकाराखाली ३० दिवसांत माहिती मिळणे बंधनकारक
                </h4>
                <p className="text-xs text-emerald-900/90 leading-relaxed pl-8">
                  RTI ऍक्ट कलम ७(१) अन्वये सरकारी जन माहिती अधिकाऱ्याने (PIO) अर्ज मिळाल्यापासून ३० दिवसांत माहिती देणे बंधनकारक आहे. जीवित व स्वातंत्र्याचा प्रश्न असल्यास ४८ तासांत माहिती देणे सक्तीचे आहे. वेळेत माहिती न दिल्यास रोज ₹२५० दंड आकारला जातो.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

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

