"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  FileText,
  Printer,
  Copy,
  Download,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Scale,
  Building2,
  Users,
  Briefcase,
  HeartHandshake,
  ShoppingCart,
  Home,
  Laptop,
  AlertCircle,
  HelpCircle,
  PhoneCall,
  Globe,
  Sparkles,
  Save,
  Check,
  RotateCcw,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Supported UI Languages
type Language = "en" | "mr" | "hi";

interface LegalCategory {
  id: string;
  icon: string;
  name: string;
  tagline: string;
  target_authority: string;
  is_emergency?: boolean;
  emergency_hotline?: string;
  limitation_period?: string;
  default_laws: Array<{ act: string; section: string; desc: string }>;
  official_portals: Array<{ name: string; url: string; helpline?: string }>;
  evidence_checklist: string[];
  step_by_step: string[];
}

const UI_STRINGS: Record<Language, Record<string, string>> = {
  en: {
    title: "One-Click Citizen Legal Help & Grievance Portal",
    subtitle: "Understand your legal rights, applicable laws, and generate professional court-ready applications.",
    searchPlaceholder: "Describe your problem in everyday words (e.g. unpaid salary, online cyber fraud, police refusing FIR)...",
    searchBtn: "Analyze Problem",
    selectCategory: "Or Select a Common Grievance Category",
    step1: "1. Problem & Category",
    step2: "2. Essential Details",
    step3: "3. Legal Rights & Portals",
    step4: "4. Professional Application",
    applicantDetails: "Applicant (Your Details)",
    oppositePartyDetails: "Opposite Party / Accused / Authority",
    incidentDetails: "Incident Particulars",
    fullName: "Full Name",
    phone: "Mobile Number",
    address: "Postal Address",
    oppName: "Opposite Party / Office Name",
    oppAddress: "Opposite Party Address / Branch",
    incidentDate: "Date of Incident / Delay",
    incidentPlace: "Place of Incident (City / Police Station / District)",
    facts: "What happened? (Describe in simple points without legal jargon)",
    relief: "What action / relief do you request? (Optional - our system auto-drafts this based on law)",
    backBtn: "Back",
    continueBtn: "Review Legal Rights & Guidance →",
    generateBtn: "Generate Professional Legal Application ✨",
    printBtn: "Print / Save as PDF (A4)",
    copyBtn: "Copy Text",
    saveBtn: "Save Application",
    editNotice: "You can click and edit the application text below directly before printing.",
    lawsTitle: "Applicable Laws & Statutory Sections",
    authorityTitle: "Competent Authority to Receive This Application",
    checklistTitle: "Mandatory Evidence & Documents Checklist",
    stepsTitle: "Step-by-Step Complaint Filing Procedure",
    portalsTitle: "Official Government Portals & Helplines",
    purePrintBtn: "Open Official Pure Print View",
    savedTitle: "Previous Saved Applications",
  },
  mr: {
    title: "एक-क्लिक नागरिक विधी सहाय्य व तक्रार निवारण कक्ष",
    subtitle: "आपले कायदेशीर अधिकार व कायदे समजून घ्या आणि सरकारी कार्यालये/पोलीस ठाण्यासाठी अधिकृत तक्रार अर्ज तयार करा.",
    searchPlaceholder: "आपली समस्या साध्या शब्दांत लिहा (उदा. मालकाने पगार दिला नाही, ऑनलाईन पैशांची फसवणूक, पोलिसांनी तक्रार घेतली नाही)...",
    searchBtn: "कायदेशीर विश्लेषण करा",
    selectCategory: "किंवा खालीलपैकी आपल्या समस्येचा मुख्य विभाग निवडा",
    step1: "१. तक्रार प्रकार",
    step2: "२. आवश्यक माहिती",
    step3: "३. कायदेशीर अधिकार व मार्गदर्शन",
    step4: "४. अधिकृत तक्रार अर्ज",
    applicantDetails: "तक्रारदार / अर्जदाराचे तपशील",
    oppositePartyDetails: "गैरअर्जदार / ज्यांच्याविरुद्ध तक्रार आहे ते",
    incidentDetails: "घटनेचा तपशील",
    fullName: "पूर्ण नाव",
    phone: "मोबाईल क्रमांक",
    address: "पूर्ण रहिवासी पत्ता",
    oppName: "संबंधित व्यक्ती / कंपनी / कार्यालयाचे नाव",
    oppAddress: "त्यांचा पत्ता / शाखा",
    incidentDate: "घटनेची तारीख / कालावधी",
    incidentPlace: "घटनेचे ठिकाण (तालुका / जिल्हा / पोलीस ठाणे)",
    facts: "नेमके काय घडले? (सोप्या भाषेत सविस्तर लिहा)",
    relief: "आपली काय मागणी / अपेक्षा आहे? (ऐच्छिक - कायद्यानुसार सिस्टीम स्वतः योग्य मागणी तयार करते)",
    backBtn: "मागे",
    continueBtn: "कायदेशीर अधिकार व पुरावे तपासा →",
    generateBtn: "अधिकृत तक्रार अर्ज तयार करा ✨",
    printBtn: "प्रिंट करा / पीडीएफ जतन करा (A4)",
    copyBtn: "मजकूर कॉपी करा",
    saveBtn: "अर्ज जतन करा",
    editNotice: "प्रिंट करण्यापूर्वी आपण खालील अर्जातील कोणताही मजकूर प्रत्यक्ष बदलू अथवा दुरुस्त करू शकता.",
    lawsTitle: "लागू कायद्यातील वैधानिक कलमे व तरतुदी",
    authorityTitle: "हा अर्ज स्वीकारणारे सक्षम प्राधिकारी / कार्यालय",
    checklistTitle: "आवश्यक कागदपत्रे व पुराव्यांची यादी",
    stepsTitle: "तक्रार दाखल करण्याची प्रत्यक्ष पद्धत व पायऱ्या",
    portalsTitle: "शासकीय अधिकृत पोर्टल व हेल्पलाईन क्रमांक",
    purePrintBtn: "कोर्ट/ऑफिस प्रिंट व्ह्यू उघडा",
    savedTitle: "मागील जतन केलेले अर्ज",
  },
  hi: {
    title: "वन-क्लिक नागरिक विधिक सहायता एवं शिकायत निवारण पोर्टल",
    subtitle: "अपने कानूनी अधिकार समझें, संबंधित कानून जानें और न्यायालय/थाने हेतु पेशेवर शिकायत पत्र तैयार करें।",
    searchPlaceholder: "अपनी समस्या सरल शब्दों में लिखें (जैसे: वेतन नहीं मिला, ऑनलाइन फ्रॉड, पुलिस एफआईआर दर्ज नहीं कर रही)...",
    searchBtn: "कानूनी विश्लेषण करें",
    selectCategory: "अथवा नीचे दी गई श्रेणियों में से अपनी समस्या चुनें",
    step1: "१. समस्या श्रेणी",
    step2: "२. आवश्यक विवरण",
    step3: "३. विधिक अधिकार व प्रक्रिया",
    step4: "४. औपचारिक प्रार्थना पत्र",
    applicantDetails: "आवेदक / शिकायतकर्ता का विवरण",
    oppositePartyDetails: "विपक्षी / संबंधित संस्थान का विवरण",
    incidentDetails: "घटना का विवरण",
    fullName: "पूरा नाम",
    phone: "मोबाइल नंबर",
    address: "स्थायी / वर्तमान पता",
    oppName: "विपक्षी / कंपनी / अधिकारी का नाम",
    oppAddress: "विपक्षी का पता / कार्यालय",
    incidentDate: "घटना का दिनांक",
    incidentPlace: "घटना स्थल (थाना / जिला)",
    facts: "वास्तविक घटना क्या हुई? (बिना कानूनी शब्दों के सरल बिंदु लिखें)",
    relief: "आप क्या राहत / कार्रवाई चाहते हैं? (वैकल्पिक - कानून अनुसार स्वतः तैयार किया जाता है)",
    backBtn: "पीछे",
    continueBtn: "कानूनी अधिकार व साक्ष्य सूची देखें →",
    generateBtn: "पेशेवर शिकायत पत्र तैयार करें ✨",
    printBtn: "प्रिंट करें / पीडीएफ सेव करें (A4)",
    copyBtn: "टेक्स्ट कॉपी करें",
    saveBtn: "आवेदन सुरक्षित करें",
    editNotice: "प्रिंट करने से पूर्व आप नीचे दिए गए पत्र में कोई भी विवरण सीधे संपादित (Edit) कर सकते हैं।",
    lawsTitle: "लागू कानूनी अधिनियम एवं महत्वपूर्ण धाराएं",
    authorityTitle: "यह आवेदन प्राप्त करने वाला सक्षम कार्यालय / प्राधिकारी",
    checklistTitle: "आवश्यक साक्ष्य एवं दस्तावेजों की चेकलिस्ट",
    stepsTitle: "शिकायत दर्ज करने की चरणबद्ध प्रक्रिया",
    portalsTitle: "आधिकारिक सरकारी पोर्टल एवं हेल्पलाइन",
    purePrintBtn: "अदालती प्रिंट दृश्य खोलें",
    savedTitle: "पूर्व में सुरक्षित किए गए प्रार्थना पत्र",
  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  police_fir: ShieldAlert,
  women_child: HeartHandshake,
  labour: Briefcase,
  consumer: ShoppingCart,
  municipal: Building2,
  rti_govt: FileText,
  property: Home,
  cybercrime: Laptop,
  legal_aid: Scale,
};

export default function CitizenHelpPage() {
  const [lang, setLang] = useState<Language>("en");
  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<LegalCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<LegalCategory | null>(null);

  // Form Fields
  const [applicantName, setApplicantName] = useState<string>("");
  const [applicantPhone, setApplicantPhone] = useState<string>("");
  const [applicantAddress, setApplicantAddress] = useState<string>("");
  const [oppositeParty, setOppositeParty] = useState<string>("");
  const [oppositePartyAddress, setOppositePartyAddress] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [incidentPlace, setIncidentPlace] = useState<string>("");
  const [factsSummary, setFactsSummary] = useState<string>("");
  const [reliefSought, setReliefSought] = useState<string>("");

  // Generated Result
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedRecords, setSavedRecords] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const t = UI_STRINGS[lang];

  // Fetch Categories based on language
  const loadCategories = async (selectedLang: Language) => {
    setLoading(true);
    try {
      const res = await api.get(`/citizen-help/categories?language=${selectedLang}`);
      setCategories(res.data.categories || []);
    } catch (err) {
      console.error("Failed to load legal categories", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedHistory = async () => {
    try {
      const res = await api.get("/citizen-help/history");
      setSavedRecords(res.data || []);
    } catch {
      // User might be public/anonymous
    }
  };

  useEffect(() => {
    loadCategories(lang);
    loadSavedHistory();
  }, [lang]);

  // Handle Free-Text Classification
  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) {
      toast.info("Please describe your issue first.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/citizen-help/classify", {
        query: searchQuery,
        language: lang,
      });
      const cat = categories.find((c) => c.id === res.data.category_id);
      if (cat) {
        setSelectedCategory(cat);
      } else {
        setSelectedCategory(res.data);
      }
      setFactsSummary(searchQuery);
      setStep(2);
      toast.success(`Matched to domain: ${res.data.name}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Could not analyze the problem.");
    } finally {
      setLoading(false);
    }
  };

  // Generate Complaint Application
  const handleGenerate = async () => {
    if (!applicantName.trim()) {
      toast.error("Please enter Applicant Name.");
      return;
    }
    if (!factsSummary.trim()) {
      toast.error("Please provide the factual details of what happened.");
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        category_id: selectedCategory?.id || "police_fir",
        language: lang,
        applicant_name: applicantName,
        applicant_phone: applicantPhone,
        applicant_address: applicantAddress,
        opposite_party: oppositeParty,
        opposite_party_address: oppositePartyAddress,
        incident_date: incidentDate,
        incident_place: incidentPlace,
        facts_summary: factsSummary,
        relief_sought: reliefSought || undefined,
      };

      const res = await api.post("/citizen-help/generate-application", payload);
      setGeneratedDoc(res.data.application_text);
      setStep(4);
      toast.success("Professional legal application generated successfully!");

      // Auto-save
      handleSave(res.data.application_text);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate application.");
    } finally {
      setGenerating(false);
    }
  };

  // Save to Database
  const handleSave = async (docText?: string) => {
    try {
      const res = await api.post("/citizen-help/save", {
        category: selectedCategory?.id || "police_fir",
        language: lang,
        applicant_name: applicantName,
        applicant_phone: applicantPhone,
        applicant_address: applicantAddress,
        opposite_party: oppositeParty,
        opposite_party_address: oppositePartyAddress,
        incident_date: incidentDate,
        incident_place: incidentPlace,
        facts_summary: factsSummary,
        relief_sought: reliefSought,
        target_authority: selectedCategory?.target_authority,
        applicable_laws: selectedCategory?.default_laws,
        required_documents: selectedCategory?.evidence_checklist,
        generated_application: docText || generatedDoc,
      });
      setSavedId(res.data.id);
      loadSavedHistory();
    } catch (err) {
      console.warn("Auto-save notice:", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
    toast.success("Application text copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      {/* ── Screen Header (Hidden on Print) ── */}
      <div className="print:hidden">
        <Header title={t.title} subtitle={t.subtitle} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {/* ── Top Bar: Language Switcher & Progress Steps (Hidden on Print) ── */}
        <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          {/* Step Breadcrumbs */}
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            {[
              { num: 1, label: t.step1 },
              { num: 2, label: t.step2 },
              { num: 3, label: t.step3 },
              { num: 4, label: t.step4 },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => (s.num <= step ? setStep(s.num) : null)}
                disabled={s.num > step && !generatedDoc}
                className={cn(
                  "px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap",
                  step === s.num
                    ? "bg-emerald-800 text-white shadow-sm"
                    : s.num < step
                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "text-gray-400 bg-gray-50 cursor-not-allowed"
                )}
              >
                <span>{s.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Saved Applications Trigger */}
            <button
              onClick={() => {
                loadSavedHistory();
                setShowHistory(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:border-emerald-600 rounded-xl text-xs font-bold text-gray-700 hover:text-emerald-800 shadow-sm transition"
              title="View saved complaints & applications"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              <span>{t.savedTitle}</span>
              {savedRecords.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-bold flex items-center justify-center">
                  {savedRecords.length}
                </span>
              )}
            </button>

            {/* Language Switch Buttons */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <span className="text-[11px] font-bold text-gray-500 px-1.5 flex items-center gap-1">
                <Globe className="w-3 h-3" /> Lang:
              </span>
              {(["en", "mr", "hi"] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-lg transition",
                    lang === l
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {l === "en" ? "EN" : l === "mr" ? "मराठी" : "हिंदी"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: Smart Search & Domain Selection                             */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Search Box */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 md:p-10 shadow-lg relative overflow-hidden">
              <div className="max-w-3xl space-y-4 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5" /> One-Click Citizen Legal Assistance
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
                  {lang === "mr"
                    ? "आपली कायदेशीर समस्या साध्या शब्दांत सांगा"
                    : lang === "hi"
                    ? "अपनी समस्या सरल शब्दों में लिखें, कानून हम बताएंगे"
                    : "Describe Your Problem in Everyday Words"}
                </h2>
                <p className="text-emerald-100/80 text-xs md:text-sm">
                  {lang === "mr"
                    ? "कोणत्याही किचकट प्रक्रियेविना आपले अधिकार समजून घ्या व योग्य त्या सरकारी कार्यालयासाठी अधिकृत अर्ज तयार करा."
                    : lang === "hi"
                    ? "बिना किसी कानूनी जटिलता के अपने अधिकार जानें और सही विभाग हेतु शिकायत पत्र तैयार करें।"
                    : "No legal background needed. We analyze the situation, identify the laws, and prepare the formal application."}
                </p>

                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row gap-2 bg-white rounded-2xl p-2 shadow-2xl">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSmartSearch()}
                      placeholder={t.searchPlaceholder}
                      className="flex-1 px-4 py-3 text-sm text-gray-900 outline-none rounded-xl"
                    />
                    <button
                      onClick={handleSmartSearch}
                      disabled={loading}
                      className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Search className="w-4 h-4" /> {t.searchBtn}
                    </button>
                  </div>
                </div>

                {/* Quick Suggestion Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] text-emerald-200">
                  <span className="font-semibold text-white/70">Examples:</span>
                  {[
                    lang === "mr" ? "पगार दिला नाही" : lang === "hi" ? "वेतन नहीं मिला" : "Unpaid salary dues",
                    lang === "mr" ? "सायबर फसवणूक पैसे गेले" : lang === "hi" ? "ऑनलाइन साइबर फ्रॉड" : "Online UPI bank fraud",
                    lang === "mr" ? "बिल्डर फ्लॅट ताबा देत नाही" : lang === "hi" ? "बिल्डर पजेशन नहीं दे रहा" : "Builder delay in flat possession",
                    lang === "mr" ? "पोलिसांनी एफआयआर घेतला नाही" : lang === "hi" ? "पुलिस एफआईआर नहीं ले रही" : "Police refusing FIR registration",
                  ].map((pill, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSearchQuery(pill);
                        setFactsSummary(pill);
                      }}
                      className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg border border-white/10 transition"
                    >
                      {pill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 9 Category Cards */}
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-gray-800">{t.selectCategory}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {categories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.id] || ShieldAlert;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setStep(2);
                      }}
                      className="bg-white hover:border-emerald-600 border border-gray-200 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 group-hover:bg-emerald-800 group-hover:text-white transition-colors flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-emerald-800 text-sm transition-colors">
                            {cat.name}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {cat.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-emerald-800">
                        <span>Get Guidance & Draft</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: Collect Essential Facts Form                                 */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 2 && selectedCategory && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Selected Category Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">{selectedCategory.name}</h4>
                  <p className="text-xs text-emerald-700">{selectedCategory.target_authority}</p>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                Change Category
              </button>
            </div>

            {/* Emergency SOS Banner (Urgent Assistance) */}
            {selectedCategory.is_emergency && (
              <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-red-950 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    🚨
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-red-900">
                      {lang === "mr" ? "तातडीची मदत / आपत्कालीन हेल्पलाईन" : lang === "hi" ? "आपातकालीन सहायता / हेल्पलाइन" : "Urgent / Emergency Helpline"}
                    </h4>
                    <p className="text-xs text-red-800 mt-0.5">
                      {lang === "mr" 
                        ? "आपण किंवा कोणी तात्काळ धोक्यात असल्यास त्वरित संपर्क साधा:"
                        : lang === "hi"
                        ? "यदि आप या कोई व्यक्ति तात्कालिक खतरे में है, तो तुरंत संपर्क करें:"
                        : "If you or someone is in immediate danger or financial distress, contact immediately:"}
                      {" "}
                      <strong className="underline text-red-950 font-extrabold">{selectedCategory.emergency_hotline}</strong>
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${selectedCategory.emergency_hotline?.split(" ")[0] || "112"}`}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition whitespace-nowrap self-end sm:self-auto"
                >
                  <PhoneCall className="w-3.5 h-3.5" /> Call {selectedCategory.emergency_hotline?.split(" ")[0] || "112"}
                </a>
              </div>
            )}

            {/* Form Container */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 space-y-6 shadow-sm">
              {/* Section 1: Applicant Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">1</span>
                  {t.applicantDetails}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.fullName} *</label>
                    <input
                      type="text"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      placeholder="e.g. Ramesh Shankar Patil"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.phone} *</label>
                    <input
                      type="text"
                      value={applicantPhone}
                      onChange={(e) => setApplicantPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.address}</label>
                  <input
                    type="text"
                    value={applicantAddress}
                    onChange={(e) => setApplicantAddress(e.target.value)}
                    placeholder="e.g. Flat 402, Shivneri Society, Near Shivaji Chowk, Pune, Maharashtra"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Section 2: Opposite Party Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">2</span>
                  {t.oppositePartyDetails}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.oppName} *</label>
                    <input
                      type="text"
                      value={oppositeParty}
                      onChange={(e) => setOppositeParty(e.target.value)}
                      placeholder="e.g. ABC Developers Ltd. / Senior Police Inspector"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.oppAddress}</label>
                    <input
                      type="text"
                      value={oppositePartyAddress}
                      onChange={(e) => setOppositePartyAddress(e.target.value)}
                      placeholder="e.g. Plot 12, Industrial Area / Local Office"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Incident Details */}
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">3</span>
                  {t.incidentDetails}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.incidentDate}</label>
                    <input
                      type="text"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                      placeholder="e.g. 15 October 2026 or Continuous"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{t.incidentPlace}</label>
                    <input
                      type="text"
                      value={incidentPlace}
                      onChange={(e) => setIncidentPlace(e.target.value)}
                      placeholder="e.g. Mumbai / Kolhapur / Pune"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.facts} *</label>
                  <textarea
                    rows={4}
                    value={factsSummary}
                    onChange={(e) => setFactsSummary(e.target.value)}
                    placeholder="1. On date XX, I paid...
2. Despite repeated demands, they refused to...
3. On date YY, they threatened..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">{t.relief}</label>
                  <input
                    type="text"
                    value={reliefSought}
                    onChange={(e) => setReliefSought(e.target.value)}
                    placeholder="e.g. Immediate refund of ₹50,000 with 18% interest and criminal investigation"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {t.backBtn}
                </button>
                <button
                  onClick={() => {
                    if (!applicantName.trim()) {
                      toast.error("Please enter applicant name");
                      return;
                    }
                    if (!factsSummary.trim()) {
                      toast.error("Please state what happened");
                      return;
                    }
                    setStep(3);
                  }}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition"
                >
                  {t.continueBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: Legal Rights, Statutory Provisions & Portals                 */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 3 && selectedCategory && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header info */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Legal Guidance</span>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{selectedCategory.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{selectedCategory.tagline}</p>
              </div>

              {/* Competent Authority Box */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                <Building2 className="w-5 h-5 text-emerald-800 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-emerald-950 uppercase">{t.authorityTitle}</h4>
                  <p className="text-sm font-semibold text-emerald-900 mt-0.5">{selectedCategory.target_authority}</p>
                </div>
              </div>

              {/* Statutory Limitation Period Card */}
              {selectedCategory.limitation_period && (
                <div className="p-4 bg-amber-50/80 border border-amber-300 rounded-xl flex items-start gap-3 text-amber-950">
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                      {lang === "mr" ? "कायदेशीर मुदत मर्यादा (Statutory Limitation Period)" : lang === "hi" ? "विधिक समय-सीमा (Statutory Limitation Period)" : "Statutory Limitation Period"}
                    </h4>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed font-medium">
                      {selectedCategory.limitation_period}
                    </p>
                  </div>
                </div>
              )}

              {/* Urgent Emergency Warning in Step 3 */}
              {selectedCategory.is_emergency && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3 text-red-950">
                  <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    🚨
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-red-900">
                      {lang === "mr" ? "तातडीची मदत (Emergency Action)" : lang === "hi" ? "आपातकालीन सूचना" : "Immediate Action Required"}
                    </h4>
                    <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                      {lang === "mr" 
                        ? `तातडीच्या मदतीसाठी किंवा आर्थिक व्यवहार फ्रीझ करण्यासाठी तात्काळ संपर्क साधा: ${selectedCategory.emergency_hotline}`
                        : lang === "hi"
                        ? `आपातकालीन स्थिति में त्वरित कार्रवाई हेतु कॉल करें: ${selectedCategory.emergency_hotline}`
                        : `For immediate help or fund freeze, call the 24x7 emergency helpline immediately: ${selectedCategory.emergency_hotline}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Applicable Statutory Sections */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-xs text-gray-900 uppercase flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-800" /> {t.lawsTitle}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCategory.default_laws.map((law, i) => (
                    <div key={i} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-1">
                      <div className="font-bold text-emerald-800">{law.section}</div>
                      <div className="font-semibold text-gray-800">{law.act}</div>
                      <div className="text-gray-500 text-[11px]">{law.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evidence Checklist */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 uppercase flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-800" /> {t.checklistTitle}
                </h4>
                <ul className="space-y-2 text-xs text-gray-700">
                  {selectedCategory.evidence_checklist.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Official Portals & Helplines */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 uppercase flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-800" /> {t.portalsTitle}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCategory.official_portals.map((p, i) => (
                    <a
                      key={i}
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs flex items-center justify-between group transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {p.name} <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-emerald-700" />
                        </div>
                        {p.helpline && (
                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Helpline: {p.helpline}
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Step by step submission guide */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <h4 className="font-bold text-xs text-gray-900 uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-800" /> {t.stepsTitle}
                </h4>
                <div className="space-y-2 text-xs text-gray-700">
                  {selectedCategory.step_by_step.map((st, i) => (
                    <div key={i} className="p-2.5 bg-amber-50/50 border border-amber-200/50 rounded-xl">
                      {st}
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> {t.backBtn}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  {generating ? "Drafting with Legal Provisions..." : t.generateBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════════════════ */}
        {/* STEP 4: Live Court-Ready Application & Strict A4 Print               */}
        {/* ═════════════════════════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Action Bar (Hidden when printing) */}
            <div className="print:hidden bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-sm text-gray-900">Official Complaint Application Ready</h4>
                <p className="text-xs text-gray-500">{t.editNotice}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setStep(3)}
                  className="px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl"
                >
                  {t.backBtn}
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> {t.copyBtn}
                </button>
                <button
                  onClick={() => handleSave()}
                  className="px-3 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Save className="w-3.5 h-3.5" /> {t.saveBtn}
                </button>
                {savedId && (
                  <a
                    href={`/api/v1/citizen-help/applications/${savedId}/print-view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> {t.purePrintBtn}
                  </a>
                )}
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow flex items-center gap-2 transition"
                >
                  <Printer className="w-4 h-4" /> {t.printBtn}
                </button>
              </div>
            </div>

            {/* ── Document Container (Strict A4 Print CSS) ── */}
            <div className="bg-white rounded-2xl border border-gray-300 p-8 md:p-12 shadow-sm font-serif text-gray-900 text-sm leading-relaxed print:p-0 print:border-none print:shadow-none print:m-0 print:w-full">
              <textarea
                value={generatedDoc}
                onChange={(e) => setGeneratedDoc(e.target.value)}
                rows={35}
                className="w-full h-full font-serif text-[15px] leading-relaxed text-gray-900 bg-transparent resize-y outline-none border-none p-0 focus:ring-0 whitespace-pre-wrap select-text"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Saved Applications History Modal ── */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F7F8F6]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">{t.savedTitle}</h3>
                  <p className="text-xs text-gray-500">Previously drafted citizen legal applications</p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {savedRecords.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No saved applications found yet.</p>
                  <p className="text-xs mt-1">Generated applications will automatically appear here.</p>
                </div>
              ) : (
                savedRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 bg-gray-50 hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-2xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                          {rec.category}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {rec.applicant_name} {rec.opposite_party ? `vs. ${rec.opposite_party}` : ""}
                      </h4>
                      <p className="text-xs text-gray-500 truncate max-w-md">
                        {rec.target_authority || "Formal Grievance"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <a
                        href={`/api/v1/citizen-help/applications/${rec.id}/print-view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-white border border-gray-200 hover:border-emerald-600 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-700" /> Print
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-[#F7F8F6] flex justify-end">
              <button
                onClick={() => setShowHistory(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-bold text-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dedicated CSS for Perfect Court A4 Output on Paper / PDF ── */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 20mm 20mm 20mm 25mm;
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 13pt !important;
            line-height: 1.6 !important;
          }
          nav, aside, header, footer, .sidebar, .print\\:hidden {
            display: none !important;
          }
          textarea {
            border: none !important;
            box-shadow: none !important;
            resize: none !important;
            overflow: visible !important;
            font-size: 13pt !important;
            line-height: 1.65 !important;
          }
        }
      `}</style>
    </div>
  );
}

