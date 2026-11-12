"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Scale,
  Search,
  CheckCircle2,
  FileText,
  Printer,
  Copy,
  Download,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ShieldAlert,
  Building2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock,
  CreditCard,
  QrCode,
  Check,
  RotateCcw,
  User,
  Globe,
  Briefcase,
  ShoppingCart,
  Home,
  HeartHandshake,
  FileQuestion,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QUICK_PROBLEMS, QuickProblem, findMatchingProblem } from "./guideData";
import { useAuthStore } from "@/lib/store/authStore";

type Language = "mr" | "hi" | "en";

export default function SimpleCitizenPortalPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [lang, setLang] = useState<Language>("mr");

  // Step 1: User's Problem Query
  const [problemText, setProblemText] = useState<string>("");
  const [activeProblem, setActiveProblem] = useState<QuickProblem | null>(null);

  // Step 2: Essential Details for Drafting
  const [applicantName, setApplicantName] = useState<string>("");
  const [applicantPhone, setApplicantPhone] = useState<string>("");
  const [oppositeParty, setOppositeParty] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [incidentPlace, setIncidentPlace] = useState<string>("");

  // Step 3: Generated Document
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [isDrafting, setIsDrafting] = useState<boolean>(false);

  // Step 4: ₹49 Payment / Checkout State
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [receiptId, setReceiptId] = useState<string>("");
  const [payMethod, setPayMethod] = useState<"upi" | "qr">("upi");
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);

  // Tab View: "solve" or "saved"
  const [viewTab, setViewTab] = useState<"solve" | "saved">("solve");
  const [savedDocs, setSavedDocs] = useState<any[]>([]);

  // Analyze Problem
  const handleSolveProblem = (customQuery?: string) => {
    const query = customQuery !== undefined ? customQuery : problemText;
    if (!query.trim()) {
      toast.info(lang === "mr" ? "कृपया आपली समस्या थोडक्यात लिहा किंवा खालील बटण निवडा." : "Please enter your problem.");
      return;
    }
    const matched = findMatchingProblem(query);
    setActiveProblem(matched);
    // Smooth scroll down to solution
    setTimeout(() => {
      document.getElementById("solution-card")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Generate Document
  const handleGenerateDocument = () => {
    if (!applicantName.trim()) {
      toast.error(lang === "mr" ? "कृपया आपले नाव प्रविष्ट करा." : "Please enter applicant name.");
      return;
    }
    if (!activeProblem) return;

    setIsDrafting(true);
    setTimeout(() => {
      const template = activeProblem.draft_template;
      const todayFormatted = new Date().toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN");

      const draft = `दिनांक: ${todayFormatted}

प्रति,
${template.recipient_title}

विषय: ${template.subject}

तक्रारदार / अर्जदार:
नाव: ${applicantName}
मोबाईल क्रमांक: ${applicantPhone || "उपलब्ध नाही"}
पत्ता: ${incidentPlace || "स्थानिक रहिवासी"}

ज्यांच्याविरुद्ध तक्रार आहे (विरोधी पक्ष):
नाव: ${oppositeParty || "संबंधित कार्यालय / अज्ञात व्यक्ती"}

महोदय,
मी खालीलप्रमाणे वस्तुस्थिती व कायदेशीर तक्रार सादर करत आहे:

१. ${template.body_facts.replace(/\[तारीख\]/g, incidentDate || todayFormatted).replace(/\[ठिकाण\]/g, incidentPlace || "स्थानिक परिसर")}

२. तक्रारदाराने याबाबत संबंधित व्यक्तीकडे वारंवार विचारणा केली, परंतु त्यांनी कायदेशीर जबाबदारी पार पाडण्यास नकार दिला आहे.

३. सदर कृत्य हे ${template.act_reference} अन्वये कायद्याचे थेट उल्लंघन आहे.

मागणी / दाद:
${template.relief}

सोबत: आवश्यक कागदपत्रांच्या सत्यप्रती.

आपला नम्र,

स्वाक्षरी: ___________________
(${applicantName})`;

      setGeneratedDoc(draft);
      setIsDrafting(false);
      toast.success(lang === "mr" ? "अधिकृत तक्रार अर्ज तयार झाला!" : "Document drafted successfully!");

      // Scroll to document preview
      setTimeout(() => {
        document.getElementById("document-preview-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 400);
  };

  // Complete Payment (Simulated Instant UPI Payment)
  const handleCompletePayment = () => {
    setIsProcessingPay(true);
    setTimeout(() => {
      const rId = `FC-DOC-${Date.now().toString().slice(-6)}`;
      setIsPaid(true);
      setReceiptId(rId);
      setIsProcessingPay(false);
      setShowPayModal(false);
      toast.success(lang === "mr" ? `₹४९ भरणा यशस्वी! पावती क्र. ${rId}` : `Payment of ₹49 successful! Receipt ${rId}`);

      // Save to local storage for "Saved Docs"
      const newDoc = {
        id: rId,
        title: activeProblem?.title_mr || "तक्रार अर्ज",
        date: new Date().toLocaleDateString(),
        content: generatedDoc,
        fee: "₹49",
      };
      const updated = [newDoc, ...savedDocs];
      setSavedDocs(updated);
      try {
        localStorage.setItem("fc_citizen_saved_docs", JSON.stringify(updated));
      } catch (e) {}
    }, 700);
  };

  // Load Saved Docs from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fc_citizen_saved_docs");
      if (saved) {
        setSavedDocs(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F8F5] text-gray-900 font-sans flex flex-col">
      {/* ── 24x7 Emergency SOS Strip ── */}
      <div className="bg-[#B91C1C] text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>तातडीची मदत (२४x७):</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <a href="tel:112" className="underline hover:text-red-200">📞 पोलीस: ११२</a>
          <a href="tel:1930" className="underline hover:text-red-200">💳 सायबर फ्रॉड: १९३०</a>
          <a href="tel:1091" className="underline hover:text-red-200">👩 महिला: १०९१</a>
          <a href="tel:15100" className="underline hover:text-red-200">⚖ मोफत वकील: १५१००</a>
        </div>
      </div>

      {/* ── Top Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-gray-900 tracking-tight">
                  फास्टकेस नागरिक तक्रार कक्ष
                </h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  १-क्लिक विधी सहाय्य
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                समस्या सांगा &bull; काय करावे ते समजून घ्या &bull; अधिकृत अर्ज डाऊनलोड करा (केवळ ₹४९/-)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch between Solve & Saved */}
            <button
              onClick={() => setViewTab("solve")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition",
                viewTab === "solve" ? "bg-emerald-800 text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              तक्रार निवारण
            </button>
            <button
              onClick={() => setViewTab("saved")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition relative",
                viewTab === "saved" ? "bg-emerald-800 text-white" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              माझे अर्ज
              {savedDocs.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px]">
                  {savedDocs.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-1 space-y-8">
        {viewTab === "saved" ? (
          /* ── MY SAVED APPLICATIONS ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-gray-900">माझे डाऊनलोड केलेले अर्ज</h2>
              <button
                onClick={() => setViewTab("solve")}
                className="px-3 py-1.5 bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                + नवीन तक्रार अर्ज तयार करा
              </button>
            </div>

            {savedDocs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500 text-xs">
                अद्याप कोणताही अर्ज जतन केलेला नाही. नवीन अर्ज तयार करण्यासाठी वरील बटणावर क्लिक करा.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedDocs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-800">{doc.title}</span>
                      <span className="text-gray-400">{doc.date}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      पावती क्र: {doc.id} &bull; शुल्क: {doc.fee} (यशस्वी)
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(doc.content);
                          toast.success("अर्जाचा मजकूर कॉपी झाला!");
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> मजकूर कॉपी करा
                      </button>
                      <button
                        onClick={() => {
                          const w = window.open("", "_blank");
                          if (w) {
                            w.document.write(`<pre style="font-family:sans-serif; white-space:pre-wrap; padding:30px;">${doc.content}</pre>`);
                            w.document.close();
                            w.print();
                          }
                        }}
                        className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <Printer className="w-3 h-3" /> प्रिंट / PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── MAIN SOLVE FLOW ── */
          <>
            {/* ── STEP 1: ENTER PROBLEM (SIMPLE & SHORT) ── */}
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="space-y-1.5 text-center max-w-xl mx-auto">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase">
                  पायरी १: आपली समस्या सांगा
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
                  आपल्यासोबत काय घडले आहे?
                </h2>
                <p className="text-xs text-gray-500">
                  साध्या भाषेत लिहा किंवा खालीलपैकी आपल्या समस्येवर १-क्लिक करा.
                </p>
              </div>

              {/* Main Input Box */}
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder="उदा. ऑनलाइन बँकेतून पैसे कापले गेले, मालकाने पगार दिला नाही, पोलिसांनी तक्रार घेतली नाही, दुकानातील वस्तू खराब निघाली..."
                    className="w-full p-4 text-sm bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-700 focus:bg-white transition leading-relaxed resize-none font-medium"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSolveProblem()}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    <span>कायदेशीर उपाय व मार्गदर्शन मिळवा →</span>
                  </button>
                </div>
              </div>

              {/* 1-Tap Quick Issue Chips */}
              <div className="pt-3 border-t border-gray-100 max-w-3xl mx-auto space-y-2">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                  किंवा वारंवार विचारल्या जाणाऱ्या तक्रारींवर क्लिक करा:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {QUICK_PROBLEMS.map((prob) => (
                    <button
                      key={prob.id}
                      onClick={() => {
                        setProblemText(prob.title_mr);
                        handleSolveProblem(prob.title_mr);
                      }}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-bold border transition flex items-center gap-1.5 shadow-2xs",
                        activeProblem?.id === prob.id
                          ? "bg-emerald-800 text-white border-emerald-800"
                          : "bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 border-gray-200"
                      )}
                    >
                      <span>{prob.title_mr}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── STEP 2: INSTANT ACTION ANSWER (WHERE TO GO, HOW TO DO, WHAT DOCUMENTS) ── */}
            {activeProblem && (
              <div id="solution-card" className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase">
                      कायदेशीर उपाय व मार्गदर्शन
                    </span>
                    <span className="text-xs bg-emerald-500 text-white px-3 py-0.5 rounded-full font-bold">
                      {activeProblem.category_name_mr}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black">
                    {activeProblem.title_mr}
                  </h3>

                  {/* Legal Right Banner */}
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-xs sm:text-sm text-emerald-100 leading-relaxed flex items-start gap-3">
                    <Scale className="w-5 h-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black mb-1">तुमचा मुख्य कायदेशीर हक्क:</strong>
                      {activeProblem.short_rights_mr}
                    </div>
                  </div>

                  {/* 3 Crisp Answer Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {/* 1. Where to go */}
                    <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/10">
                      <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                        <Building2 className="w-4 h-4" />
                        <span>कोठे जावे? (Where to Go)</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed font-medium">
                        {activeProblem.where_to_go_mr}
                      </p>
                    </div>

                    {/* 2. How to do it */}
                    <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/10">
                      <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>कसे करावे? (३ सोप्या पायऱ्या)</span>
                      </div>
                      <ul className="text-[11px] text-white/90 space-y-1 pl-3 list-disc leading-relaxed">
                        {activeProblem.simple_steps_mr.map((st, i) => (
                          <li key={i}>{st}</li>
                        ))}
                      </ul>
                    </div>

                    {/* 3. Documents needed */}
                    <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/10">
                      <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
                        <FileCheck className="w-4 h-4" />
                        <span>आवश्यक कागदपत्रे</span>
                      </div>
                      <ul className="text-[11px] text-white/90 space-y-1 pl-3 list-disc leading-relaxed">
                        {activeProblem.required_docs_mr.map((doc, i) => (
                          <li key={i}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Helpline call button */}
                  <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-emerald-200">
                      तातडीच्या संपर्कासाठी अधिकृत हेल्पलाईन:
                    </span>
                    <a
                      href={`tel:${activeProblem.helpline}`}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl flex items-center gap-2 transition shadow-sm"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{activeProblem.helpline_label}</span>
                    </a>
                  </div>
                </div>

                {/* ── STEP 3: ESSENTIAL DETAILS FORM TO DRAFT APPLICATION ── */}
                <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
                  <div className="space-y-1">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase">
                      पायरी २: अर्जासाठी आवश्यक माहिती
                    </span>
                    <h3 className="text-xl font-black text-gray-900">
                      या समस्येसाठी कोर्ट-मान्य अधिकृत अर्ज तयार करा
                    </h3>
                    <p className="text-xs text-gray-500">
                      केवळ ४ साध्या गोष्टी भरा — सिस्टीम योग्य कायदेशीर कलमांसह अधिकृत अर्ज तयार करेल.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        आपले पूर्ण नाव *
                      </label>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="उदा. रमेश विलास शिंदे"
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        मोबाईल नंबर
                      </label>
                      <input
                        type="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="उदा. 98xxxxxxxx"
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        ज्यांच्याविरुद्ध तक्रार आहे ते (विरोधी पक्ष / कंपनीचे नाव)
                      </label>
                      <input
                        type="text"
                        value={oppositeParty}
                        onChange={(e) => setOppositeParty(e.target.value)}
                        placeholder="उदा. बँक शाखा / कंपनीचे नाव / व्यक्तीचे नाव"
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        घटनेचे ठिकाण / आपले शहर किंवा तालुका
                      </label>
                      <input
                        type="text"
                        value={incidentPlace}
                        onChange={(e) => setIncidentPlace(e.target.value)}
                        placeholder="उदा. पुणे / शिवाजीनगर पोलीस ठाणे हद्द"
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleGenerateDocument}
                      disabled={isDrafting}
                      className="w-full sm:w-auto px-8 py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>{isDrafting ? "अर्ज तयार होत आहे..." : "कोर्ट-मान्य अधिकृत तक्रार अर्ज तयार करा ✨"}</span>
                    </button>
                  </div>
                </div>

                {/* ── STEP 4: GENERATED DOCUMENT PREVIEW & ₹49 NOMINAL FEE ── */}
                {generatedDoc && (
                  <div id="document-preview-section" className="space-y-6">
                    {/* Pricing Highlight Banner */}
                    <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 text-[10px] font-black uppercase">
                            नागरिक मदत शुल्क
                          </span>
                          <span className="text-xs text-emerald-200">वकिलांमार्फत ड्राफ्टिंग खर्च: ₹१,५००</span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-black">
                          अधिकृत कोर्ट-मान्य A4 तक्रार अर्ज &bull; फी केवळ ₹४९/-
                        </h4>
                        <p className="text-xs text-emerald-100">
                          कायदेशीर सल्ला व मार्गदर्शन मोफत आहे. अधिकृत A4 PDF व प्रिंट डाऊनलोडसाठी प्रति अर्ज नाममात्र ₹४९/- आकारले जातात.
                        </p>
                      </div>

                      <div className="flex-shrink-0 text-center sm:text-right">
                        <div className="text-3xl font-black text-amber-300">
                          ₹४९<span className="text-xs text-white font-normal"> / दस्तऐवज</span>
                        </div>
                        <span className="text-[10px] text-emerald-200 block">१००% कायदेशीर व कोर्ट-मान्य</span>
                      </div>
                    </div>

                    {/* Document Preview Box */}
                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-emerald-800" />
                          <span className="text-xs font-bold text-gray-800">
                            अधिकृत अर्जाचा मसुदा (Draft Preview)
                          </span>
                          {isPaid && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-700" />
                              पेमेंट यशस्वी (Receipt #{receiptId})
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (!isPaid) {
                                setShowPayModal(true);
                                return;
                              }
                              navigator.clipboard.writeText(generatedDoc);
                              toast.success("अर्जाचा मजकूर कॉपी झाला!");
                            }}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition"
                          >
                            <Copy className="w-3.5 h-3.5" /> मजकूर कॉपी करा
                          </button>

                          {isPaid ? (
                            <button
                              onClick={() => {
                                const printWin = window.open("", "_blank");
                                if (printWin) {
                                  printWin.document.write(`
                                    <html>
                                      <head>
                                        <title>FastCase Official Complaint Application</title>
                                        <style>
                                          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; line-height: 1.6; }
                                          pre { white-space: pre-wrap; font-family: inherit; font-size: 13px; }
                                          .footer { margin-top: 50px; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 8px; }
                                        </style>
                                      </head>
                                      <body>
                                        <pre>${generatedDoc}</pre>
                                        <div class="footer">FastCase Verified Legal Application • Paid Document Receipt #${receiptId} • Date: ${new Date().toLocaleDateString()}</div>
                                      </body>
                                    </html>
                                  `);
                                  printWin.document.close();
                                  printWin.print();
                                }
                              }}
                              className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition"
                            >
                              <Printer className="w-3.5 h-3.5" /> A4 प्रिंट / PDF डाऊनलोड
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowPayModal(true)}
                              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition animate-pulse"
                            >
                              <Lock className="w-3.5 h-3.5" /> A4 PDF डाऊनलोड करा (₹४९)
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Editable Textarea Preview */}
                      <div className="p-6">
                        <textarea
                          rows={16}
                          value={generatedDoc}
                          onChange={(e) => setGeneratedDoc(e.target.value)}
                          className="w-full font-mono text-xs text-gray-800 leading-relaxed bg-[#FCFDFB] border border-gray-100 rounded-xl p-4 focus:outline-none focus:border-emerald-700 resize-y"
                        />
                        <p className="text-[11px] text-gray-400 mt-2">
                          💡 टीप: आपण अर्जातील कोणतीही माहिती प्रत्यक्ष एडिट करू शकता.
                        </p>
                      </div>

                      {/* Download CTA if not paid */}
                      {!isPaid && (
                        <div className="p-4 bg-emerald-50/70 border-t border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                          <div className="text-emerald-900">
                            <strong>अधिकृत कोर्ट-मान्य A4 कॉपी हवी आहे?</strong>
                            <p className="text-[11px] text-emerald-800/80">
                              कोणत्याही सरकारी कार्यालयात किंवा न्यायालयात सादर करण्यासाठी वॉटरमार्क-मुक्त A4 PDF डाऊनलोड करा.
                            </p>
                          </div>
                          <button
                            onClick={() => setShowPayModal(true)}
                            className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow transition flex items-center gap-2 whitespace-nowrap"
                          >
                            <Download className="w-4 h-4" />
                            <span>₹४९ भरा व PDF डाऊनलोड करा</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── ₹49 PAYMENT MODAL (UPI & QR) ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-100">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-emerald-200">
                  अधिकृत अर्ज डाऊनलोड शुल्क
                </span>
                <h3 className="text-base font-black mt-1">फास्टकेस सुरक्षित पेमेंट</h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-amber-300">₹४९</div>
                <span className="text-[10px] text-white/70">सर्व कर समाविष्ट</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                <p className="font-bold text-gray-800">दस्तऐवज तपशील:</p>
                <p>&bull; {activeProblem?.title_mr || "अधिकृत तक्रार अर्ज"}</p>
                <p>&bull; A4 कोर्ट-रेडी फॉरमॅट &bull; अमर्यादित प्रिंट हक्क</p>
              </div>

              {/* Payment Method Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPayMethod("upi")}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition",
                    payMethod === "upi"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-gray-200 hover:bg-gray-50 text-gray-600"
                  )}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>UPI / ॲप्स (GPay/Paytm)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayMethod("qr")}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition",
                    payMethod === "qr"
                      ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                      : "border-gray-200 hover:bg-gray-50 text-gray-600"
                  )}
                >
                  <QrCode className="w-4 h-4" />
                  <span>QR कोड स्कॅन करा</span>
                </button>
              </div>

              {payMethod === "qr" ? (
                /* QR Code Display */
                <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <div className="w-40 h-40 bg-white p-2 mx-auto rounded-xl border border-gray-300 shadow-xs flex items-center justify-center">
                    {/* Visual QR SVG */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-gray-900">
                      <rect width="100" height="100" fill="#fff" />
                      <rect x="10" y="10" width="25" height="25" fill="#000" />
                      <rect x="15" y="15" width="15" height="15" fill="#fff" />
                      <rect x="18" y="18" width="9" height="9" fill="#000" />
                      <rect x="65" y="10" width="25" height="25" fill="#000" />
                      <rect x="70" y="15" width="15" height="15" fill="#fff" />
                      <rect x="73" y="18" width="9" height="9" fill="#000" />
                      <rect x="10" y="65" width="25" height="25" fill="#000" />
                      <rect x="15" y="70" width="15" height="15" fill="#fff" />
                      <rect x="18" y="73" width="9" height="9" fill="#000" />
                      <rect x="42" y="15" width="16" height="6" fill="#000" />
                      <rect x="42" y="27" width="10" height="8" fill="#000" />
                      <rect x="42" y="42" width="16" height="16" fill="#000" />
                      <rect x="65" y="42" width="12" height="8" fill="#000" />
                      <rect x="80" y="42" width="10" height="16" fill="#000" />
                      <rect x="42" y="65" width="12" height="10" fill="#000" />
                      <rect x="65" y="65" width="25" height="25" fill="#000" />
                      <rect x="70" y="70" width="15" height="15" fill="#fff" />
                      <rect x="73" y="73" width="9" height="9" fill="#000" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-bold text-gray-700">
                    PhonePe / GooglePay / Paytm ने स्कॅन करा
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono">
                    UPI ID: fastcase@icici
                  </p>
                </div>
              ) : (
                /* UPI ID Direct */
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">
                    आपला UPI ID प्रविष्ट करा (किंवा थेट पेमेंट करा)
                  </label>
                  <input
                    type="text"
                    defaultValue="citizen@okaxis"
                    placeholder="उदा. 98xxxxxxxx@upi"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 font-medium"
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                    <span>समर्थित: GPay &bull; PhonePe &bull; Paytm &bull; BHIM</span>
                  </div>
                </div>
              )}

              {/* Pay Action Button */}
              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={isProcessingPay}
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isProcessingPay ? (
                  <span>पेमेंट पडताळणी सुरू आहे...</span>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>₹४९/- भरा व PDF त्वरित मिळवा</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600 transition font-medium"
              >
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">
          फास्टकेस &bull; सामान्य नागरिकांसाठी १-क्लिक विधी सहाय्य व अधिकृत तक्रार निवारण मंच
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          कायदेशीर मार्गदर्शन मोफत &bull; अधिकृत कोर्ट-मान्य अर्ज फी: केवळ ₹४९/- &bull; भारत सरकारच्या अधिकृत कायद्यांवर आधारित
        </p>
      </footer>
    </div>
  );
}
