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
  // If user is not authenticated, pops up modal and stores the pending action
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
    toast.success("कायदेशीर उपाय व मार्गदर्शन तयार आहे!");
    setTimeout(() => {
      document.getElementById("solution-card")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSolveProblem = (customQuery?: string) => {
    const query = customQuery !== undefined ? customQuery : problemText;
    setProblemText(query);
    // Pop up sign in modal if user not logged in
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

      setTimeout(() => {
        document.getElementById("document-preview-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, 400);
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
    }, 1200);
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
    if (!authFullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!authEmail.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (authPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
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
      toast.success(`Account created successfully! Welcome, ${u.full_name}.`);
      resumePendingAction();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authEmail.trim()) {
      toast.error("Please enter your email to receive OTP.");
      return;
    }
    setAuthLoading(true);
    try {
      await api.post("/auth/login-otp/send", { email: authEmail.trim().toLowerCase() });
      toast.success("Login OTP sent to your email");
      setAuthOtpStep("code");
      setAuthOtpTimer(60);
      setAuthCanResend(false);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleModalVerifyOtp = async () => {
    const code = authOtpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
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
      toast.success("Welcome back!");
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F6F8F5]">
        <div className="w-9 h-9 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">नागरिक लॉगिन कक्षात पुनर्निर्देशित करत आहे...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8F5] text-gray-900 font-sans flex flex-col antialiased">
      {/* ── 24x7 Emergency SOS Notification Strip ── */}
      <div className="bg-[#B91C1C] text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>आपत्कालीन कायदेशीर मदत (२४x७):</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <a href="tel:112" className="underline hover:text-red-200">📞 पोलीस: ११२</a>
          <a href="tel:1930" className="underline hover:text-red-200">💳 सायबर फ्रॉड: १९३०</a>
          <a href="tel:1915" className="underline hover:text-red-200">🛒 ग्राहक तक्रार: १९१५</a>
          <a href="tel:1091" className="underline hover:text-red-200">👩 महिला: १०९१</a>
          <a href="tel:15100" className="underline hover:text-red-200">⚖ मोफत विधी सेवा: १५१००</a>
        </div>
      </div>

      {/* ── Clean Top Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-mint" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-gray-900 tracking-tight">
                  फास्टकेस ग्राहक व नागरिक विधी कक्ष
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

          {/* User Auth Status Button */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                  <User className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="truncate max-w-[130px]">{user.full_name || user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                  title="Logout"
                >
                  बाहेर पडा
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalTab("login");
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#013B36] hover:bg-[#022A26] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-mint" />
                <span>लॉगिन / नोंदणी</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 3 SMALL ATTRACTIVE TABS ── */}
      <div className="max-w-5xl w-full mx-auto px-4 pt-6 pb-2">
        <div className="flex p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200 shadow-sm max-w-2xl mx-auto gap-1.5">
          {/* Tab 1: समस्या व उपाय */}
          <button
            onClick={() => setActiveTab("solve")}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold cursor-pointer",
              activeTab === "solve"
                ? "bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
            )}
          >
            <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
            <span>१. समस्या व उपाय</span>
          </button>

          {/* Tab 2: अधिकृत अर्ज जनरेटर (₹४९) */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                requireAuth("tab_draft", () => setActiveTab("draft"));
              } else {
                setActiveTab("draft");
              }
            }}
            className={cn(
              "flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold cursor-pointer",
              activeTab === "draft"
                ? "bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
            )}
          >
            <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
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
              "flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold cursor-pointer relative",
              activeTab === "saved"
                ? "bg-gradient-to-r from-emerald-800 to-teal-900 text-white shadow-md"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
            )}
          >
            <FileCheck className="w-4 h-4 shrink-0 text-cyan-300" />
            <span>३. माझे अर्ज</span>
            {savedDocs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                {savedDocs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-5xl w-full mx-auto px-4 py-4 flex-1 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: समस्या व कायदेशीर उपाय (PROBLEM & LEGAL REMEDY)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "solve" && (
          <div className="space-y-6">
            {/* ── Main Input Box & 1-Tap Chips Card ── */}
            <div className="bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-9 shadow-sm space-y-6">
              <div className="space-y-2 text-center max-w-xl mx-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  पायरी १: आपली समस्या सांगा
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  आपल्यासोबत काय घडले आहे?
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  साध्या भाषेत लिहा किंवा खालीलपैकी आपल्या समस्येवर १-क्लिक करा.
                </p>
              </div>

              {/* Textarea Input with Emerald Focus */}
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder="उदा. ऑनलाइन बँकेतून पैसे कापले गेले, कंपनीने पगार दिला नाही, पोलिसांनी तक्रार घेतली नाही, दुकानातील वस्तू खराब निघाली..."
                    className="w-full p-4 text-sm bg-gray-50/80 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-emerald-700 focus:bg-white transition leading-relaxed resize-none font-medium shadow-inner"
                  />
                  {problemText && (
                    <button
                      onClick={() => setProblemText("")}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xs px-2 py-1 rounded-md bg-gray-200/60"
                    >
                      हटवा ✕
                    </button>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => handleSolveProblem()}
                    className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4 text-amber-300" />
                    <span>कायदेशीर उपाय व मार्गदर्शन मिळवा →</span>
                  </button>
                </div>
              </div>

              {/* 1-Tap Quick Issue Chips */}
              <div className="pt-4 border-t border-gray-100 max-w-3xl mx-auto space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">
                  किंवा वारंवार विचारल्या जाणाऱ्या तक्रारींवर क्लिक करा:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {QUICK_PROBLEMS.map((prob) => {
                    const isSelected = activeProblem?.id === prob.id;
                    return (
                      <button
                        key={prob.id}
                        onClick={() => {
                          setProblemText(prob.title_mr);
                          handleSolveProblem(prob.title_mr);
                        }}
                        className={cn(
                          "px-3.5 py-2 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer",
                          isSelected
                            ? "bg-[#013B36] text-white border-[#013B36] shadow-sm scale-102"
                            : "bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 border-gray-200/90"
                        )}
                      >
                        <span>{prob.title_mr}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Problem Solution Breakdown Card ── */}
            {activeProblem && (
              <div id="solution-card" className="space-y-6">
                <div className="bg-gradient-to-br from-[#013B36] via-[#022A26] to-[#011F1C] text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-wider">
                      कायदेशीर उपाय व मार्गदर्शन
                    </span>
                    <span className="text-xs bg-emerald-500 text-slate-950 px-3 py-1 rounded-full font-black">
                      {activeProblem.category_name_mr}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black">
                    {activeProblem.title_mr}
                  </h3>

                  {/* Legal Right Banner */}
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-xs sm:text-sm text-emerald-100 leading-relaxed flex items-start gap-3">
                    <Scale className="w-5 h-5 text-mint shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black mb-1">तुमचा मुख्य कायदेशीर हक्क:</strong>
                      {activeProblem.short_rights_mr}
                    </div>
                  </div>

                  {/* 3 Crisp Answer Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {/* 1. Where to go */}
                    <div className="bg-white/10 rounded-2xl p-4 space-y-2 border border-white/10">
                      <div className="flex items-center gap-2 text-mint font-bold text-xs">
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

                  {/* Helpline & Action Next Step */}
                  <div className="pt-3 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-200">तातडीची मदत:</span>
                      <a
                        href={`tel:${activeProblem.helpline}`}
                        className="px-3.5 py-1.5 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl flex items-center gap-1.5 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-mint" />
                        <span>{activeProblem.helpline_label}</span>
                      </a>
                    </div>

                    {/* Big Button to Tab 2 */}
                    <button
                      onClick={() => {
                        setActiveTab("draft");
                        setTimeout(() => {
                          document.getElementById("drafting-form-card")?.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-mint hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <FileText className="w-4 h-4" />
                      <span>पुढील पायरी: कोर्ट-मान्य अधिकृत अर्ज तयार करा (केवळ ₹४९) →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: अधिकृत तक्रार अर्ज जनरेटर (COURT-READY DRAFTER - ₹49)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "draft" && (
          <div className="space-y-6">
            {/* Selected Problem Context Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0">
                  <Scale className="w-5 h-5 text-mint" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                    निवडलेली तक्रार / समस्या:
                  </span>
                  <h4 className="text-sm font-black text-gray-900">
                    {activeProblem?.title_mr || "तक्रार अर्ज मसुदा"}
                  </h4>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("solve")}
                className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
              >
                समस्या बदला ✎
              </button>
            </div>

            {/* Essential Details Form */}
            <div id="drafting-form-card" className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-5">
              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black uppercase">
                  पायरी २: अर्जासाठी आवश्यक तपशील
                </span>
                <h3 className="text-xl font-black text-gray-900">
                  या समस्येसाठी कोर्ट-मान्य अधिकृत अर्ज तयार करा
                </h3>
                <p className="text-xs text-gray-500">
                  केवळ ४ साध्या गोष्टी भरा — सिस्टीम योग्य कायदेशीर कलमांसह अधिकृत नमुना तयार करेल.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    आपले पूर्ण नाव * (अर्जदार)
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
                    placeholder="उदा. ९८२२००११२२"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ज्यांच्याविरुद्ध तक्रार आहे (विरोधी पक्ष / कंपनी / बँक)
                  </label>
                  <input
                    type="text"
                    value={oppositeParty}
                    onChange={(e) => setOppositeParty(e.target.value)}
                    placeholder="उदा. स्टेट बँक शाखा / एक्स वाय झेड कंपनी"
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
                    placeholder="उदा. कोल्हापूर / शिवाजीनगर पोलीस ठाणे हद्द"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateDocument}
                  disabled={isDrafting}
                  className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-800 to-teal-900 hover:from-emerald-900 hover:to-teal-950 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isDrafting ? "अर्ज तयार होत आहे..." : "कोर्ट-मान्य अधिकृत तक्रार अर्ज तयार करा ✨"}</span>
                </button>
              </div>
            </div>

            {/* Generated Document Preview & ₹49 Checkout */}
            {generatedDoc && (
              <div id="document-preview-section" className="space-y-6">
                {/* Pricing Banner */}
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

                  <div className="shrink-0 text-center sm:text-right">
                    <div className="text-3xl font-black text-amber-300">
                      ₹४९<span className="text-xs text-white font-normal"> / दस्तऐवज</span>
                    </div>
                    <span className="text-[10px] text-emerald-200 block font-medium">१००% कायदेशीर व कोर्ट-मान्य</span>
                  </div>
                </div>

                {/* Preview Box */}
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
                          पेमेंट यशस्वी (पावती #{receiptId})
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
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
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
                          className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> A4 प्रिंट / PDF डाऊनलोड
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowPayModal(true)}
                          className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition animate-pulse cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" /> A4 PDF डाऊनलोड करा (₹४९)
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <textarea
                      rows={16}
                      value={generatedDoc}
                      onChange={(e) => setGeneratedDoc(e.target.value)}
                      className="w-full font-mono text-xs text-gray-800 leading-relaxed bg-[#FCFDFB] border border-gray-100 rounded-xl p-4 focus:outline-none focus:border-emerald-700 resize-y"
                    />
                    <p className="text-[11px] text-gray-400 mt-2">
                      💡 टीप: आपण अर्जातील कोणतीही माहिती आवश्यकतेनुसार प्रत्यक्ष एडिट करू शकता.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 3: माझे जतन केलेले अर्ज (MY SAVED APPLICATIONS)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "saved" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900">माझे डाऊनलोड केलेले अर्ज</h2>
                <p className="text-xs text-gray-500">आपण तयार केलेले सर्व अधिकृत कायदेशीर अर्ज येथे सुरक्षित आहेत.</p>
              </div>
              <button
                onClick={() => setActiveTab("solve")}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                + नवीन तक्रार अर्ज तयार करा
              </button>
            </div>

            {savedDocs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-800 text-sm">कोणताही अर्ज जतन केलेला नाही</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  आपण समस्या सोडवून अर्ज जनरेट केल्यानंतर तो येथे कायमस्वरूपी जतन होईल.
                </p>
                <button
                  onClick={() => setActiveTab("solve")}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  तक्रार अर्ज तयार करा →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedDocs.map((doc) => (
                  <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-xs hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-800">{doc.title}</span>
                      <span className="text-gray-400">{doc.date}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium">
                      पावती क्र: {doc.id} &bull; शुल्क: {doc.fee} (यशस्वी भरणा)
                    </div>
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(doc.content);
                          toast.success("अर्जाचा मजकूर कॉपी झाला!");
                        }}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
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
                        className="px-3 py-1 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" /> प्रिंट / PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── POPUP SIGN IN / CREATE NEW USER MODAL ── */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  setShowAuthModal(false);
                  setPendingAction(null);
                }}
                className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Brand Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white flex items-center justify-center shadow-md">
                  <Scale className="w-5 h-5 text-mint" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-lg leading-tight">
                    नागरिक व ग्राहक विधी कक्ष
                  </h3>
                  <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider">
                    Fastcase Legal Help Portal
                  </p>
                </div>
              </div>

              {/* Tab Switcher: Sign In vs Create New User */}
              <div className="flex p-1 bg-gray-100 rounded-xl mb-5">
                <button
                  type="button"
                  onClick={() => setAuthModalTab("login")}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    authModalTab === "login"
                      ? "bg-white text-emerald-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <KeyRound className="w-3.5 h-3.5" /> Sign In (लॉगिन)
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModalTab("register")}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    authModalTab === "register"
                      ? "bg-white text-emerald-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-900"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" /> Create Account (नवीन नोंदणी)
                </button>
              </div>

              {/* ── SIGN IN VIEW ── */}
              {authModalTab === "login" ? (
                <div className="space-y-4">
                  {/* Mode Pill: Password vs OTP */}
                  <div className="flex p-1 bg-gray-50 border border-gray-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setAuthMode("password")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition",
                        authMode === "password" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      Password
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("otp");
                        setAuthOtpStep("email");
                      }}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded-md transition",
                        authMode === "otp" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      Sign in with OTP
                    </button>
                  </div>

                  {authMode === "password" ? (
                    <form onSubmit={handleModalLogin} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Email Address (ईमेल आयडी)
                        </label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="citizen@example.com"
                          required
                          className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-semibold text-gray-700">
                            Password (पासवर्ड)
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            type={showAuthPass ? "text" : "password"}
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAuthPass(!showAuthPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            {showAuthPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-3 bg-[#013B36] hover:bg-[#022A26] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                      >
                        {authLoading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          "Sign In (लॉगिन करा)"
                        )}
                      </button>
                    </form>
                  ) : (
                    /* OTP Sign In Form */
                    <div className="space-y-3.5">
                      {authOtpStep === "email" ? (
                        <form onSubmit={handleModalSendOtp} className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                              Email Address (ईमेल आयडी)
                            </label>
                            <input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="citizen@example.com"
                              required
                              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-2.5 bg-[#013B36] hover:bg-[#022A26] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {authLoading ? "Sending OTP..." : "Send Login OTP →"}
                          </button>
                        </form>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-500 text-center">
                            Enter the 6-digit code sent to <strong className="text-gray-700">{authEmail}</strong>
                          </p>
                          <div className="flex justify-center gap-2">
                            {authOtpDigits.map((digit, i) => (
                              <input
                                key={i}
                                ref={(el) => {
                                  otpInputRefs.current[i] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                className="w-9 h-11 text-center text-base font-bold rounded-xl border border-gray-200 outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700"
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={handleModalVerifyOtp}
                            disabled={authLoading || authOtpDigits.join("").length !== 6}
                            className="w-full py-2.5 bg-[#013B36] hover:bg-[#022A26] text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {authLoading ? "Verifying..." : "Verify & Continue"}
                          </button>

                          <div className="flex items-center justify-between text-[11px] text-gray-500">
                            <button
                              type="button"
                              onClick={() => {
                                setAuthOtpStep("email");
                                setAuthOtpDigits(["", "", "", "", "", ""]);
                              }}
                              className="hover:underline cursor-pointer"
                            >
                              Change Email
                            </button>
                            <button
                              type="button"
                              onClick={handleModalSendOtp}
                              disabled={!authCanResend || authLoading}
                              className={cn(
                                "font-bold",
                                authCanResend ? "text-emerald-800 hover:underline cursor-pointer" : "text-gray-400"
                              )}
                            >
                              Resend Code {authOtpTimer > 0 && `(${authOtpTimer}s)`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Switch to Register */}
                  <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
                    नवीन नागरिक आहात?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthModalTab("register")}
                      className="font-bold text-emerald-800 hover:underline cursor-pointer"
                    >
                      नवीन खाते तयार करा (Sign Up)
                    </button>
                  </div>
                </div>
              ) : (
                /* ── CREATE NEW USER (REGISTRATION) VIEW ── */
                <form onSubmit={handleModalRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name * (आपले पूर्ण नाव)
                    </label>
                    <input
                      type="text"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="उदा. रमेश शंकर पाटील"
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address * (ईमेल आयडी)
                    </label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="citizen@example.com"
                      required
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Mobile Number (मोबाईल क्रमांक)
                    </label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="उदा. ९८२२००११२२"
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password * (पासवर्ड - किमान ६ अक्षरे)
                    </label>
                    <div className="relative">
                      <input
                        type={showAuthPass ? "text" : "password"}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-700 focus:bg-white font-medium pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAuthPass(!showAuthPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showAuthPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 bg-[#013B36] hover:bg-[#022A26] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {authLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        खाते तयार होत आहे...
                      </>
                    ) : (
                      "Create Account / खाते तयार करा ✨"
                    )}
                  </button>

                  {/* Switch to Sign In */}
                  <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
                    आधीच खाते आहे?{" "}
                    <button
                      type="button"
                      onClick={() => setAuthModalTab("login")}
                      className="font-bold text-emerald-800 hover:underline cursor-pointer"
                    >
                      लॉगिन करा (Sign In)
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer",
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
                    "p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer",
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
                className="w-full py-3.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-2 text-center text-xs text-gray-400 hover:text-gray-600 transition font-medium cursor-pointer"
              >
                रद्द करा
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500 mt-auto">
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
