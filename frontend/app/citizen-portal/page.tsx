"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scale,
  Search,
  CheckCircle2,
  FileText,
  Printer,
  Copy,
  Download,
  PhoneCall,
  ArrowRight,
  ArrowLeft,
  Building2,
  Sparkles,
  Lock,
  CreditCard,
  QrCode,
  Check,
  User,
  FileCheck,
  X,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QUICK_PROBLEMS, QuickProblem, findMatchingProblem } from "./guideData";
import { useAuthStore } from "@/lib/store/authStore";
import { api, getErrorMessage } from "@/lib/api";

type Language = "mr" | "hi" | "en";
type ActiveTab = "solve" | "draft" | "saved";

export default function SimpleCitizenPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, citizenLogin, citizenRegister } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access_token");
    if (!isAuthenticated && !hasToken) {
      router.replace("/citizen-login");
    }
  }, [hydrated, isAuthenticated, router]);

  const [lang, setLang] = useState<Language>("mr");

  // ── 3 Main Navigation Tabs ────────────────────────────────────────────────
  // 1: "solve" (समस्या व उपाय)
  // 2: "draft" (अधिकृत अर्ज जनरेटर - ₹४९)
  // 3: "saved" (माझे जतन केलेले अर्ज)
  const [activeTab, setActiveTab] = useState<ActiveTab>("solve");

  // ── Problem & Solution State ──────────────────────────────────────────────
  const [problemText, setProblemText] = useState<string>("कंपनीने किंवा मालकाने थकीत पगार दिला नाही / कामावरून काढले");
  const [activeProblem, setActiveProblem] = useState<QuickProblem | null>(() => QUICK_PROBLEMS[2] || QUICK_PROBLEMS[0]);

  // ── Drafting Form State ───────────────────────────────────────────────────
  const [applicantName, setApplicantName] = useState<string>("");
  const [applicantPhone, setApplicantPhone] = useState<string>("");
  const [oppositeParty, setOppositeParty] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [incidentPlace, setIncidentPlace] = useState<string>("");
  const [generatedDoc, setGeneratedDoc] = useState<string>("");
  const [isDrafting, setIsDrafting] = useState<boolean>(false);

  // ── ₹49 Payment / Checkout State ──────────────────────────────────────────
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [receiptId, setReceiptId] = useState<string>("");
  const [payMethod, setPayMethod] = useState<"upi" | "qr">("upi");
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);

  // ── Saved Documents State ─────────────────────────────────────────────────
  const [savedDocs, setSavedDocs] = useState<any[]>([]);

  // ── Sign In / Register Popup Modal State ──────────────────────────────────
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [showAuthPass, setShowAuthPass] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<"solve" | "draft" | "pay" | "tab_draft" | "tab_saved" | null>(null);

  // Auth Form Fields
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authFullName, setAuthFullName] = useState<string>("");
  const [authPhone, setAuthPhone] = useState<string>("");

  // OTP Login State inside modal
  const [authOtpStep, setAuthOtpStep] = useState<"email" | "code">("email");
  const [authOtpDigits, setAuthOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [authOtpTimer, setAuthOtpTimer] = useState<number>(60);
  const [authCanResend, setAuthCanResend] = useState<boolean>(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-fill user data if already authenticated
  useEffect(() => {
    if (user) {
      if (user.full_name && !applicantName) setApplicantName(user.full_name);
      if (user.phone && !applicantPhone) setApplicantPhone(user.phone);
    }
  }, [user]);

  // Load saved documents from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fastcase_citizen_docs");
      if (saved) {
        setSavedDocs(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  // OTP timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAuthModal && authMode === "otp" && authOtpStep === "code" && authOtpTimer > 0) {
      interval = setInterval(() => setAuthOtpTimer((t) => t - 1), 1000);
    } else if (authOtpTimer === 0) {
      setAuthCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showAuthModal, authMode, authOtpStep, authOtpTimer]);

  // ── Authentication Protection Trigger ─────────────────────────────────────
  const requireAuth = (action: "solve" | "draft" | "pay" | "tab_draft" | "tab_saved", callback?: () => void) => {
    if (!isAuthenticated) {
      setPendingAction(action);
      setShowAuthModal(true);
      return false;
    }
    if (callback) callback();
    return true;
  };

  // Resume pending action after successful login/registration
  const resumePendingAction = () => {
    setShowAuthModal(false);
    const act = pendingAction;
    setPendingAction(null);

    if (act === "solve") {
      executeSolve();
    } else if (act === "draft" || act === "tab_draft") {
      setActiveTab("draft");
      executeDraft();
    } else if (act === "pay") {
      setShowPayModal(true);
    } else if (act === "tab_saved") {
      setActiveTab("saved");
    }
  };

  // ── Problem Solver ────────────────────────────────────────────────────────
  const executeSolve = (customQuery?: string) => {
    const query = customQuery !== undefined ? customQuery : problemText;
    if (!query.trim()) {
      toast.info("कृपया आपली समस्या थोडक्यात लिहा किंवा खालीलपैकी आपल्या समस्येवर १-क्लिक करा.");
      return;
    }
    const matched = findMatchingProblem(query);
    setActiveProblem(matched);
    toast.success("कायदेशीर उपाय तयार आहे!");
  };

  const handleSolveProblem = (customQuery?: string) => {
    const query = customQuery !== undefined ? customQuery : problemText;
    setProblemText(query);
    if (!isAuthenticated) {
      setPendingAction("solve");
      setShowAuthModal(true);
      return;
    }
    executeSolve(query);
  };

  // ── Document Drafter ──────────────────────────────────────────────────────
  const executeDraft = () => {
    if (!applicantName.trim()) {
      toast.error("कृपया अर्जदाराचे पूर्ण नाव प्रविष्ट करा.");
      return;
    }
    if (!activeProblem) {
      toast.error("कृपया आधी समस्येचा प्रकार निवडा.");
      return;
    }

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
      toast.success("अधिकृत तक्रार अर्ज तयार झाला!");
    }, 350);
  };

  const handleGenerateDocument = () => {
    if (!isAuthenticated) {
      setPendingAction("draft");
      setShowAuthModal(true);
      return;
    }
    executeDraft();
  };

  // ── Simulated ₹49 Payment ─────────────────────────────────────────────────
  const handleCompletePayment = () => {
    setIsProcessingPay(true);
    setTimeout(() => {
      const rId = `FC-DOC-${Date.now().toString().slice(-6)}`;
      setIsPaid(true);
      setReceiptId(rId);
      setIsProcessingPay(false);
      setShowPayModal(false);
      toast.success(`₹४९ भरणा यशस्वी! पावती क्र. ${rId}`);

      const newDoc = {
        id: rId,
        title: activeProblem?.title_mr || "अधिकृत तक्रार अर्ज",
        date: new Date().toLocaleDateString(),
        content: generatedDoc,
        fee: "₹४९",
      };
      const updated = [newDoc, ...savedDocs];
      setSavedDocs(updated);
      try {
        localStorage.setItem("fastcase_citizen_docs", JSON.stringify(updated));
      } catch (e) {}
    }, 1000);
  };

  // ── Modal Auth Submit Handlers ────────────────────────────────────────────
  const handleModalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) {
      toast.error("Please enter email and password.");
      return;
    }
    setAuthLoading(true);
    try {
      const u = await citizenLogin(authEmail, authPassword);
      toast.success(`Welcome ${u.full_name || "Citizen"}!`);
      resumePendingAction();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authFullName.trim() || !authEmail.trim() || !authPassword) {
      toast.error("Please fill all required fields.");
      return;
    }
    setAuthLoading(true);
    try {
      const u = await citizenRegister({
        full_name: authFullName.trim(),
        email: authEmail.trim().toLowerCase(),
        password: authPassword,
        phone: authPhone.trim() || undefined,
        preferred_language: "mr",
      });
      toast.success(`Account created! Welcome, ${u.full_name}.`);
      resumePendingAction();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) {
      toast.error("Enter your email address.");
      return;
    }
    setAuthLoading(true);
    try {
      await api.post("/auth/login-otp/send", { email: authEmail.trim().toLowerCase() });
      toast.success("OTP sent to your email!");
      setAuthOtpStep("code");
      setAuthOtpTimer(60);
      setAuthCanResend(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalVerifyOtp = async () => {
    const code = authOtpDigits.join("");
    if (code.length !== 6) {
      toast.error("Enter complete 6-digit OTP.");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.post("/auth/login-otp/verify", {
        email: authEmail.trim().toLowerCase(),
        otp: code,
        code,
      });
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("refresh_token", res.data.refresh_token);
      if (typeof document !== "undefined") {
        document.cookie = `access_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      toast.success("Login successful!");
      resumePendingAction();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...authOtpDigits];
        for (let i = 0; i < pasted.length; i++) {
          newDigits[i] = pasted[i];
        }
        setAuthOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        otpInputRefs.current[nextIndex]?.focus();
      }
      return;
    }
    const clean = value.replace(/\D/g, "");
    const newDigits = [...authOtpDigits];
    newDigits[index] = clean;
    setAuthOtpDigits(newDigits);
    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access_token");
  if (!hydrated || (!isAuthenticated && !hasToken)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F5]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">नागरिक लॉगिन कक्षात पुनर्निर्देशित करत आहे...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-gray-900 font-sans flex flex-col antialiased">
      {/* ── Compact Top Header ── */}
      <header className="bg-white border-b border-gray-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-gray-900 tracking-tight">
                  फास्टकेस नागरिक विधी कक्ष
                </h1>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                  १-क्लिक सहाय्य
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                समस्या सांगा • कायदेशीर उपाय जाणून घ्या • कोर्ट अर्ज (₹४९)
              </p>
            </div>
          </div>

          {/* User Auth Status Button & Back Link */}
          <div className="flex items-center gap-2">
            <a
              href="https://fastcase.in"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-600 hover:text-emerald-800 hover:bg-emerald-50 transition cursor-pointer border border-gray-200"
              title="मुख्य वेबसाइटवर जा"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden sm:inline">मुख्य वेबसाइट</span>
            </a>

            {isAuthenticated && user && (
              <div className="flex items-center gap-1.5 pl-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-bold">
                  <User className="w-3 h-3 text-emerald-700" />
                  <span className="truncate max-w-[120px]">{user.full_name || user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Logout"
                >
                  बाहेर पडा
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3 SMALL ATTRACTIVE TABS (Compact Segmented Control) ── */}
      <div className="max-w-4xl w-full mx-auto px-4 pt-4 pb-2">
        <div className="flex p-1 bg-white rounded-xl border border-gray-200 shadow-2xs max-w-xl mx-auto gap-1">
          {/* Tab 1: समस्या व उपाय */}
          <button
            onClick={() => setActiveTab("solve")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer",
              activeTab === "solve"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>१. समस्या व उपाय</span>
          </button>

          {/* Tab 2: अर्ज जनरेटर (₹४९) */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                requireAuth("tab_draft", () => setActiveTab("draft"));
              } else {
                setActiveTab("draft");
              }
            }}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer",
              activeTab === "draft"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span>२. अर्ज जनरेटर (₹४९)</span>
          </button>

          {/* Tab 3: माझे अर्ज */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                requireAuth("tab_saved", () => setActiveTab("saved"));
              } else {
                setActiveTab("saved");
              }
            }}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer relative",
              activeTab === "saved"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
            )}
          >
            <FileCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>३. माझे अर्ज</span>
            {savedDocs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[9px] font-black">
                {savedDocs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-4xl w-full mx-auto px-4 py-3 flex-1 space-y-4">

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: समस्या व कायदेशीर उपाय (SMALL, SIMPLE & ATTRACTIVE)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "solve" && (
          <div className="space-y-4">
            {/* ── Compact Search & Problem Box ── */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  आपली कायदेशीर समस्या सांगा:
                </span>
                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                  साध्या भाषेत लिहा किंवा खालीलपैकी निवडा
                </span>
              </div>

              {/* Compact Unified Search Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSolveProblem();
                    }}
                    placeholder="उदा. ऑनलाइन पैसे कापले, पगार दिला नाही, पोलिसांनी FIR नाकारली..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white transition font-medium text-gray-900"
                  />
                  {problemText && (
                    <button
                      onClick={() => setProblemText("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleSolveProblem()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <span>उपाय मिळवा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User-Friendly Quick Category Cards */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 mb-2">
                  किंवा वारंवार विचारल्या जाणाऱ्या विषयावर १-क्लिक करा:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "unpaid_salary", icon: "💼", label: "पगार / नोकरी वाद", desc: "थकीत पगार किंवा नोकरी प्रश्न" },
                    { id: "cyber_fraud", icon: "💳", label: "बँक / UPI फ्रॉड", desc: "पैसे कापले / ऑनलाइन फसवणूक" },
                    { id: "police_refusal", icon: "👮", label: "पोलीस FIR नकार", desc: "तक्रार नोंदवण्यास नकार" },
                    { id: "consumer_fraud", icon: "🛒", label: "ग्राहक तक्रार", desc: "खराब वस्तू / वॉरंटी नाकारली" },
                    { id: "property_land", icon: "🏠", label: "जमीन व घर वाद", desc: "अतिक्रमण / जागा हक्क वाद" },
                    { id: "women_safety", icon: "👩", label: "महिला सुरक्षा", desc: "कौटुंबिक छळ व महिला हक्क" },
                    { id: "rti_portal", icon: "📄", label: "RTI माहिती अधिकार", desc: "सरकारी कामाची माहिती मागवा" },
                    { id: "lost_document", icon: "🔍", label: "कागदपत्रे / फोन गहाळ", desc: "आधार, पॅन किंवा फोन हरवला" },
                  ].map((topic) => {
                    const prob = QUICK_PROBLEMS.find((p) => p.id === topic.id);
                    const isSelected = activeProblem?.id === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          if (prob) {
                            setProblemText(prob.title_mr);
                            handleSolveProblem(prob.title_mr);
                          }
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer",
                          isSelected
                            ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                            : "bg-gray-50/80 hover:bg-emerald-50/60 text-gray-800 border-gray-200/90 hover:border-emerald-300"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{topic.icon}</span>
                          <span className={cn("text-xs font-black truncate", isSelected ? "text-white" : "text-gray-900")}>
                            {topic.label}
                          </span>
                        </div>
                        <span className={cn("text-[10px] line-clamp-1 leading-tight", isSelected ? "text-emerald-100" : "text-gray-500")}>
                          {topic.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Visual, Friendly & Easy-to-Understand Remedy Card ── */}
            {activeProblem && (
              <div className="bg-white rounded-2xl border border-emerald-200/90 p-4 sm:p-5 shadow-xs space-y-4">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                      {activeProblem.category_name_mr}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                      {activeProblem.title_mr}
                    </h3>
                  </div>

                  <a
                    href={`tel:${activeProblem.helpline}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition shadow-2xs"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                    <span>{activeProblem.helpline_label}</span>
                  </a>
                </div>

                {/* Key Legal Right (Clean Emerald Highlight Box) */}
                <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">
                      तुमचा मुख्य कायदेशीर हक्क (Your Legal Right):
                    </span>
                    <p className="text-xs text-emerald-900 font-medium leading-relaxed mt-0.5">
                      {activeProblem.short_rights_mr}
                    </p>
                  </div>
                </div>

                {/* 3 Step-by-Step Clear Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Where to go */}
                  <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-950 font-black text-xs">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center text-xs">🏛️</span>
                      <span>१. कुठे जावे? (Where to Go)</span>
                    </div>
                    <p className="text-xs text-gray-800 font-semibold leading-relaxed">
                      {activeProblem.where_to_go_mr}
                    </p>
                  </div>

                  {/* Card 2: How to do it */}
                  <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
                      <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-900 flex items-center justify-center text-xs">📝</span>
                      <span>२. काय करावे? (३ सोप्या पायऱ्या)</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-800 font-medium">
                      {activeProblem.simple_steps_mr.map((st, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-snug">{st.replace(/^पायरी \d+:\s*/, "")}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 3: Documents needed */}
                  <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-teal-950 font-black text-xs">
                      <span className="w-5 h-5 rounded-md bg-teal-100 text-teal-900 flex items-center justify-center text-xs">📑</span>
                      <span>३. लागणारी कागदपत्रे</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-800 font-medium">
                      {activeProblem.required_docs_mr.map((doc, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span className="leading-snug">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Action Banner: Jump to Tab 2 */}
                <div className="pt-2 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 border border-emerald-200/80 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">
                      अधिकृत कोर्ट अर्ज तयार करू इच्छिता?
                    </span>
                    <p className="text-[11px] text-emerald-800 font-medium">
                      वकिलांशिवाय ५ मिनिटांत कोर्ट-मान्य अधिकृत A4 अर्ज तात्काळ तयार करा.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab("draft");
                      if (!applicantName && user?.full_name) setApplicantName(user.full_name);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-300" />
                    <span>कोर्ट-मान्य अर्ज तयार करा (केवळ ₹४९) →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: अधिकृत तक्रार अर्ज जनरेटर (COMPACT DRAFTER - ₹49)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "draft" && (
          <div className="space-y-4">
            {/* Context Badge */}
            <div className="bg-white rounded-xl border border-gray-200/90 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">निवडलेली तक्रार:</span>
                <strong className="text-emerald-900 font-bold">{activeProblem?.title_mr || "तक्रार अर्ज"}</strong>
              </div>
              <button
                onClick={() => setActiveTab("solve")}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                तक्रार बदला ↻
              </button>
            </div>

            {/* Compact Drafting Form */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-700" />
                  <span>तक्रार अर्जाची माहिती प्रविष्ट करा:</span>
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                  शुल्क: ₹४९/-
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Applicant Name */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    तक्रारदार / अर्जदाराचे पूर्ण नाव <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="उदा. रमेश शंकर पाटील"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    मोबाईल क्रमांक
                  </label>
                  <input
                    type="tel"
                    value={applicantPhone}
                    onChange={(e) => setApplicantPhone(e.target.value)}
                    placeholder="उदा. ९८२२००११२२"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                  />
                </div>

                {/* Opposite Party */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    ज्यांच्याविरुद्ध तक्रार आहे (कंपनी / व्यक्तीचे नाव)
                  </label>
                  <input
                    type="text"
                    value={oppositeParty}
                    onChange={(e) => setOppositeParty(e.target.value)}
                    placeholder="उदा. ABC प्रायव्हेट लि. / बँक शाखा मॅनेजर"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                  />
                </div>

                {/* Place / City */}
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    घटना ठिकाण व शहर
                  </label>
                  <input
                    type="text"
                    value={incidentPlace}
                    onChange={(e) => setIncidentPlace(e.target.value)}
                    placeholder="उदा. शिवाजीनगर, पुणे"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateDocument}
                  disabled={isDrafting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDrafting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>अर्ज तयार होत आहे...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>अधिकृत अर्ज तयार करा</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Document Preview Card */}
            {generatedDoc && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-gray-900">अधिकृत तक्रार अर्ज पूर्वावलोकन (Preview)</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isPaid ? (
                      <>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedDoc);
                            toast.success("अर्जाचा मजकूर कॉपी केला!");
                          }}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-gray-600" />
                          <span>कॉपी</span>
                        </button>
                        <button
                          onClick={() => window.print()}
                          className="px-3 py-1 text-xs font-black rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3 h-3 text-emerald-300" />
                          <span>प्रिंट / PDF</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setShowPayModal(true)}
                        className="px-3.5 py-1.5 text-xs font-black rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white flex items-center gap-1.5 shadow-xs cursor-pointer animate-pulse"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                        <span>₹४९ भरणा करा व डाऊनलोड करा →</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Preformatted Paper View */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 font-mono text-[11px] leading-relaxed text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {generatedDoc}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: माझे अर्ज (SAVED DOCUMENTS)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "saved" && (
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>माझे जतन केलेले अर्ज ({savedDocs.length})</span>
            </h3>

            {savedDocs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-semibold">अद्याप कोणताही अर्ज जतन केलेला नाही.</p>
                <button
                  onClick={() => setActiveTab("solve")}
                  className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  नवीन अर्ज तयार करा →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {savedDocs.map((doc, i) => (
                  <div
                    key={doc.id || i}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <strong className="text-gray-900 font-bold block">{doc.title}</strong>
                      <span className="text-[10px] text-gray-500 font-medium">
                        तारीख: {doc.date} &bull; पावती क्र.: {doc.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(doc.content);
                          toast.success("मजकूर कॉपी केला!");
                        }}
                        className="px-2 py-1 text-xs font-bold rounded-lg border border-gray-200 bg-white hover:bg-gray-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-gray-600" />
                        <span>कॉपी</span>
                      </button>
                      <button
                        onClick={() => {
                          setGeneratedDoc(doc.content);
                          setActiveTab("draft");
                          setIsPaid(true);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-800 text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-emerald-300" />
                        <span>पहा / प्रिंट</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Simulated ₹49 Payment Modal ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <h4 className="text-sm font-black text-gray-900">अधिकृत अर्ज डाऊनलोड शुल्क</h4>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl text-center space-y-1">
              <span className="text-[11px] text-emerald-900 font-bold">एकवेळ अधिकृत ड्राफ्टिंग फी:</span>
              <div className="text-2xl font-black text-emerald-950">₹४९/-</div>
              <p className="text-[10px] text-emerald-800 font-medium">वकिलांचे ₹१,५०० वाचवा • कोर्ट-मान्य अधिकृत A4 PDF</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCompletePayment}
                disabled={isProcessingPay}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPay ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>भरणा होत आहे...</span>
                  </>
                ) : (
                  <>
                    <span>UPI द्वारे ₹४९ भरणा करा (Instant Pay)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-800"
              >
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign In / Register Modal (if session expires or needed) ── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="text-sm font-black text-gray-900">नागरिक लॉगिन / नोंदणी</h4>
              <button onClick={() => setShowAuthModal(false)} className="text-gray-400 hover:text-gray-600 text-xs p-1">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl gap-1 text-xs font-bold">
              <button
                onClick={() => setAuthModalTab("login")}
                className={cn("py-1.5 rounded-lg", authModalTab === "login" ? "bg-white text-emerald-900 shadow-2xs font-black" : "text-gray-600")}
              >
                लॉगिन
              </button>
              <button
                onClick={() => setAuthModalTab("register")}
                className={cn("py-1.5 rounded-lg", authModalTab === "register" ? "bg-white text-emerald-900 shadow-2xs font-black" : "text-gray-600")}
              >
                नवीन नोंदणी
              </button>
            </div>

            {authModalTab === "login" ? (
              <form onSubmit={handleModalLogin} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ईमेल आयडी</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">पासवर्ड</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-emerald-800 text-white font-black text-xs rounded-xl"
                >
                  {authLoading ? "लॉगिन होत आहे..." : "लॉगिन करा →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleModalRegister} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">पूर्ण नाव</label>
                  <input
                    type="text"
                    value={authFullName}
                    onChange={(e) => setAuthFullName(e.target.value)}
                    placeholder="आपले नाव"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ईमेल आयडी</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">पासवर्ड</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-emerald-800 text-white font-black text-xs rounded-xl"
                >
                  {authLoading ? "नोंदणी होत आहे..." : "खाते तयार करा →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
