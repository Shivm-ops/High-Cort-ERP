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
  ChevronDown,
  ChevronUp,
  Smartphone,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QUICK_PROBLEMS, QuickProblem, findMatchingProblem } from "./guideData";
import { useAuthStore } from "@/lib/store/authStore";
import { api, getErrorMessage } from "@/lib/api";
import PropertyLegalCheck from "./PropertyLegalCheck";

type Language = "mr" | "hi" | "en";
type ActiveTab = "solve" | "draft" | "saved" | "property";

export default function SimpleCitizenPortalPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, citizenLogin, citizenRegister } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const [lang, setLang] = useState<Language>("mr");

  // ── 3 Main Navigation Tabs ────────────────────────────────────────────────
  // 1: "solve" (समस्या व उपाय)
  // 2: "draft" (अधिकृत अर्ज जनरेटर - ₹३०)
  // 3: "saved" (माझे जतन केलेले अर्ज)
  const [activeTab, setActiveTab] = useState<ActiveTab>("solve");

  // ── Problem & Solution State ──────────────────────────────────────────────
  const [problemText, setProblemText] = useState<string>("");
  const [activeProblem, setActiveProblem] = useState<QuickProblem | null>(null);

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

  // ── ₹30 Payment / Checkout State ──────────────────────────────────────────
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [receiptId, setReceiptId] = useState<string>("");
  const [payMethod, setPayMethod] = useState<"upi" | "qr">("upi");
  const [paymentTab, setPaymentTab] = useState<"upi_qr" | "upi_apps" | "card">("upi_qr");
  const [isProcessingPay, setIsProcessingPay] = useState<boolean>(false);
  const [isEditingDetails, setIsEditingDetails] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  // ── Step-by-Step Flow States ──────────────────────────────────────────────
  // Step 1: select case (selectedCategoryId)
  // Step 2: view solution (showSolution)
  // Step 3: open document (showDocument)
  // Step 4: pay & download (isPaid)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [showDocument, setShowDocument] = useState<boolean>(false);
  const solutionRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

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

  // ── Print & PDF Download Functions ─────────────────────────────────────────
  const printOfficialA4Document = (content: string, title: string, receipt: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    const today = new Date().toLocaleDateString("mr-IN");
    printWindow.document.write(`<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>${title} - Fastcase Official Court Application</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700&family=Noto+Serif+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 25mm 20mm 20mm 25mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Mukta', 'Noto Serif Devanagari', 'Times New Roman', serif;
      color: #111827;
      line-height: 1.65;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .container {
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px 48px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
    }
    .no-print-bar {
      max-width: 820px;
      margin: 0 auto 20px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0D3B2E;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
    }
    .print-btn {
      background: #10b981;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    .header-box {
      border-bottom: 2px solid #0D3B2E;
      padding-bottom: 12px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .header-title {
      font-size: 17px;
      font-weight: 800;
      color: #0D3B2E;
      letter-spacing: -0.3px;
    }
    .header-sub {
      font-size: 11px;
      color: #4b5563;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
    }
    .content-box {
      white-space: pre-wrap;
      font-size: 13.5pt;
      line-height: 1.7;
      text-align: justify;
      color: #000000;
    }
    .footer-box {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px dashed #cbd5e1;
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .no-print-bar { display: none !important; }
      .container { box-shadow: none; border: none; padding: 0; max-width: 100%; }
      .content-box { font-size: 13pt; line-height: 1.6; }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>🏛️ फास्टकेस नागरिक विधी कक्ष</strong> &bull; अधिकृत कोर्ट अर्ज</div>
    <button class="print-btn" onclick="window.print()">🖨️ PDF म्हणून सेव्ह करा / प्रिंट करा</button>
  </div>
  <div class="container">
    <div class="header-box">
      <div>
        <div class="header-title">🏛️ कोर्ट-मान्य अधिकृत तक्रार / दाद अर्ज</div>
        <div class="header-sub">भारतीय कायदे व नियमावलीनुसार तयार केलेला अधिकृत मसुदा</div>
      </div>
      <div class="meta-box">
        <div style="font-family: monospace; font-weight: 700; color: #0D3B2E;">पावती क्र: ${receipt}</div>
        <div style="color: #059669; font-weight: 700;">शुल्क भरणा: ₹३० (यशस्वी)</div>
        <div style="color: #6b7280;">दिनांक: ${today}</div>
      </div>
    </div>
    <div class="content-box">${content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
    <div class="footer-box">
      <span>Fastcase Legal ERP &bull; अधिकृत नागरिक विधी सहाय्य प्रणाली</span>
      <span>पावती क्र: ${receipt} &bull; कोर्ट पुरावा प्रत</span>
    </div>
  </div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`);
    printWindow.document.close();
  };

  // ── True High-Resolution A4 Court PDF File Generator & Downloader ─────────
  const downloadPetitionPdf = async (docText?: string, docTitle?: string, customReceipt?: string) => {
    const textToUse = docText || generatedDoc;
    const titleToUse = docTitle || activeProblem?.title_mr || "Court_Petition";
    const receiptToUse = customReceipt || receiptId || `FC-DOC-${Date.now().toString().slice(-6)}`;

    if (!textToUse) {
      toast.error("अर्ज उपलब्ध नाही.");
      return;
    }

    setIsDownloadingPdf(true);
    toast.info("अधिकृत कोर्ट PDF तयार होत आहे...");

    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default;

      // 1. Create temporary offscreen container styled cleanly with Marathi fonts & official court margins
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "794px"; // Standard A4 width at 96 DPI
      container.style.backgroundColor = "#ffffff";
      container.style.padding = "48px 56px";
      container.style.fontFamily = "'Mukta', 'Noto Serif Devanagari', 'Noto Sans Devanagari', 'Times New Roman', serif";
      container.style.color = "#111827";
      container.style.lineHeight = "1.7";
      container.style.boxSizing = "border-box";
      container.style.zIndex = "-1000";

      const today = new Date().toLocaleDateString("mr-IN");
      container.innerHTML = `
        <div style="border-bottom: 2.5px solid #064e3b; padding-bottom: 14px; margin-bottom: 26px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div style="font-size: 20px; font-weight: 800; color: #064e3b; letter-spacing: -0.3px;">
              🏛️ कोर्ट-मान्य अधिकृत तक्रार / दाद अर्ज
            </div>
            <div style="font-size: 11.5px; color: #4b5563; margin-top: 3px; font-weight: 600;">
              फास्टकेस विधी कक्ष &bull; भारतीय कायदे व नियमावलीनुसार तयार केलेला अधिकृत मसुदा
            </div>
          </div>
          <div style="text-align: right; font-size: 11px;">
            <div style="font-family: monospace; font-weight: 800; color: #064e3b; font-size: 12px;">पावती क्र: ${receiptToUse}</div>
            <div style="color: #059669; font-weight: 700; margin-top: 2px;">शुल्क भरणा: ₹३० (यशस्वी)</div>
            <div style="color: #6b7280; margin-top: 2px;">दिनांक: ${today}</div>
          </div>
        </div>
        <div style="white-space: pre-wrap; font-size: 13.5pt; line-height: 1.75; text-align: justify; color: #000000; font-family: 'Mukta', 'Noto Serif Devanagari', sans-serif;">
          ${textToUse.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        </div>
        <div style="margin-top: 55px; padding-top: 15px; border-top: 1px dashed #94a3b8; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; align-items: center;">
          <span>Fastcase Legal ERP &bull; अधिकृत नागरिक विधी सहाय्य प्रणाली</span>
          <span>पावती क्र: ${receiptToUse} &bull; कोर्ट पुरावा अधिकृत प्रत</span>
        </div>
      `;

      document.body.appendChild(container);

      // Render canvas with 2x resolution for ultra-sharp text in PDF
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/jpeg", 0.96);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle multi-page if height exceeds single A4 page (297mm)
      const pageHeight = pdf.internal.pageSize.getHeight();
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${titleToUse.replace(/[\/\s\\:\*\?"<>\|]+/g, "_")}_Fastcase_Petition.pdf`;
      pdf.save(fileName);
      toast.success("अधिकृत PDF फाईल यशस्वीरीत्या डाऊनलोड झाली!");
    } catch (err) {
      console.error("PDF generation error:", err);
      // Fallback: create raw text file as .pdf or call window.print
      try {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("FASTCASE OFFICIAL COURT PETITION", 14, 20);
        doc.setFontSize(10);
        doc.text(`Receipt: ${receiptToUse} | Fee: Rs 30 (PAID)`, 14, 28);
        doc.text(textToUse, 14, 38, { maxWidth: 180 });
        doc.save(`${titleToUse.replace(/[\/\s\\:\*\?"<>\|]+/g, "_")}_Fastcase_Petition.pdf`);
        toast.success("अधिकृत PDF फाईल यशस्वीरीत्या डाऊनलोड झाली!");
      } catch (fallbackErr) {
        toast.error("PDF डाऊनलोड करताना त्रुटी आली. कृपया 'प्रिंट' बटनावर क्लिक करा.");
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // ── Document Drafter Helper ───────────────────────────────────────────────
  const generateDraftForProblem = (
    problem: QuickProblem,
    name?: string,
    phone?: string,
    opp?: string,
    place?: string,
    date?: string
  ) => {
    const applicant = (name || applicantName || user?.full_name || "नागरिक अर्जदार").trim();
    const template = problem.draft_template;
    const todayFormatted = new Date().toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN");

    const draft = `दिनांक: ${todayFormatted}

प्रति,
${template.recipient_title}

विषय: ${template.subject}

तक्रारदार / अर्जदार:
नाव: ${applicant}
मोबाईल क्रमांक: ${phone || applicantPhone || user?.phone || "उपलब्ध नाही"}
पत्ता: ${place || incidentPlace || "स्थानिक रहिवासी"}

ज्यांच्याविरुद्ध तक्रार आहे (विरोधी पक्ष):
नाव: ${opp || oppositeParty || "संबंधित कार्यालय / संबंधित पक्ष"}

महोदय,
मी खालीलप्रमाणे वस्तुस्थिती व कायदेशीर तक्रार सादर करत आहे:

१. ${template.body_facts.replace(/\[तारीख\]/g, date || incidentDate || todayFormatted).replace(/\[ठिकाण\]/g, place || incidentPlace || "स्थानिक परिसर")}

२. तक्रारदाराने याबाबत संबंधित व्यक्तीकडे वारंवार विचारणा केली, परंतु त्यांनी कायदेशीर जबाबदारी पार पाडण्यास नकार दिला आहे.

३. सदर कृत्य हे ${template.act_reference} अन्वये कायद्याचे थेट उल्लंघन आहे.

मागणी / दाद:
${template.relief}

सोबत: आवश्यक कागदपत्रांच्या सत्यप्रती.

आपला नम्र,

स्वाक्षरी: ___________________
(${applicant})`;

    setGeneratedDoc(draft);
    return draft;
  };

  // ── Problem Solver (Step 2: Opens Solution Card) ──────────────────────────
  const executeSolve = (customQuery?: string) => {
    const query = customQuery !== undefined ? customQuery : problemText;
    if (!query.trim()) {
      toast.info("कृपया आधी आपली कायदेशीर समस्या निवडा किंवा वर शोधा.");
      return;
    }
    const matched = findMatchingProblem(query);
    setActiveProblem(matched);
    setSelectedCategoryId(matched.id);
    setShowSolution(true);
    setShowDocument(false); // Keeps document closed until user clicks to view/open it
    // Prepare document template in background
    generateDraftForProblem(matched);
    toast.success("कायदेशीर उपाय तयार आहे!");
    setTimeout(() => {
      solutionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
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

  // ── Manual Draft Trigger (e.g. from tab 2 or detail form) ──────────────────
  const executeDraft = () => {
    if (!activeProblem) {
      toast.error("कृपया आधी समस्येचा प्रकार निवडा.");
      return;
    }

    setIsDrafting(true);
    setTimeout(() => {
      generateDraftForProblem(activeProblem, applicantName, applicantPhone, oppositeParty, incidentPlace, incidentDate);
      setIsDrafting(false);
      toast.success("अधिकृत तक्रार अर्ज अपडेट झाला!");
    }, 250);
  };

  const handleGenerateDocument = () => {
    if (!isAuthenticated) {
      setPendingAction("draft");
      setShowAuthModal(true);
      return;
    }
    executeDraft();
  };

  // ── ₹30 Payment Completion & Automatic PDF Download ────────────────────────
  const handleCompletePayment = () => {
    setIsProcessingPay(true);
    setTimeout(() => {
      const rId = `FC-DOC-${Date.now().toString().slice(-6)}`;
      setIsPaid(true);
      setReceiptId(rId);
      setIsProcessingPay(false);
      setShowPayModal(false);
      toast.success(`₹३० भरणा यशस्वी! पावती क्र. ${rId}`);

      const newDoc = {
        id: rId,
        title: activeProblem?.title_mr || "अधिकृत तक्रार अर्ज",
        date: new Date().toLocaleDateString(),
        content: generatedDoc,
        fee: "₹३०",
      };
      const updated = [newDoc, ...savedDocs];
      setSavedDocs(updated);
      try {
        localStorage.setItem("fastcase_citizen_docs", JSON.stringify(updated));
      } catch (e) {}

      // Automatically trigger document download and print dialog!
      downloadPetitionPdf(generatedDoc, activeProblem?.title_mr, rId);
    }, 850);
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
  const isGuest = !isAuthenticated && !hasToken;

  if (!hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F6F5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#013B36] border-t-[#34D399] animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">नागरिक विधी कक्ष लोड होत आहे...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-gray-900 font-sans flex flex-col antialiased">
      {/* ── Compact Top Header ── */}
      <header className="bg-white border-b border-gray-200/90 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#013B36] text-white flex items-center justify-center shadow-xs">
              <Scale className="w-4 h-4 text-[#059669]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold text-[#013B36] tracking-tight">
                  फास्टकेस नागरिक विधी कक्ष
                </h1>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#ECFDF5] text-[#013B36] uppercase border border-[#A7F3D0]">
                  १-क्लिक सहाय्य
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">
                समस्या सांगा • कायदेशीर उपाय जाणून घ्या • कोर्ट अर्ज (₹३०)
              </p>
            </div>
          </div>

          {/* User Auth Status Button & Back Link */}
          <div className="flex items-center gap-2">
            <a
              href="https://fastcase.in"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-gray-700 hover:text-[#013B36] hover:bg-[#ECFDF5] transition cursor-pointer border border-gray-200"
              title="मुख्य वेबसाइटवर जा"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#013B36]" />
              <span className="hidden sm:inline">मुख्य वेबसाइट</span>
            </a>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 pl-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#013B36] border border-[#A7F3D0] text-xs font-bold">
                  <User className="w-3 h-3 text-[#059669]" />
                  <span className="truncate max-w-[120px]">{user.full_name || user.email}</span>
                </div>
                <button
                  onClick={logout}
                  className="px-2 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:text-[#059669] hover:bg-red-50 transition cursor-pointer"
                  title="Logout"
                >
                  बाहेर पडा
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 pl-2">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#013B36] hover:bg-[#024E47] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <User className="w-3 h-3" />
                  <span>लॉगिन / नोंदणी</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Guest Awareness Notification Strip ── */}
      {isGuest && (
        <div className="bg-gradient-to-r from-[#021F1B] via-[#03362E] to-[#02201D] text-white px-4 py-2 border-b border-[#03362E]/60 shadow-2xs">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#059669] text-white font-black text-[10px] uppercase tracking-wider">
                अतिथी कक्ष
              </span>
              <span className="text-[#6EE7B7] font-medium text-[11px] sm:text-xs">
                आपण मोफत कायदेशीर उपाय व मार्गदर्शन वाचू शकता. कोर्ट अर्ज तयार व डाऊनलोड करण्यासाठी लॉगिन करा.
              </span>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-[11px] sm:text-xs font-bold text-[#059669] hover:text-[#6EE7B7] transition cursor-pointer flex items-center gap-1 underline underline-offset-2"
            >
              <span>येथे लॉगिन करा</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── 4 SMALL ATTRACTIVE TABS (Compact Segmented Control - Option 2: Navy/Cream/Coral) ── */}
      <div className="max-w-4xl w-full mx-auto px-4 pt-4 pb-2">
        <div className="flex p-1 bg-white rounded-xl border border-gray-200 shadow-2xs max-w-2xl mx-auto gap-1">
          {/* Tab 1: समस्या व उपाय */}
          <button
            onClick={() => setActiveTab("solve")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer",
              activeTab === "solve"
                ? "bg-[#013B36] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
            <span>१. समस्या व उपाय</span>
          </button>

          {/* Tab 2: अर्ज जनरेटर (₹३०) */}
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
                ? "bg-[#013B36] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
            )}
          >
            <FileText className="w-3.5 h-3.5 text-[#059669]" />
            <span>२. अर्ज जनरेटर (₹३०)</span>
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
                ? "bg-[#013B36] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
            )}
          >
            <FileCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>३. माझे अर्ज</span>
            {savedDocs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#059669] text-white text-[9px] font-black">
                {savedDocs.length}
              </span>
            )}
          </button>

          {/* Tab 4: मालमत्ता कायदेशीर तपासणी */}
          <button
            onClick={() => setActiveTab("property")}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-black cursor-pointer",
              activeTab === "property"
                ? "bg-[#013B36] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/60"
            )}
          >
            <Building2 className="w-3.5 h-3.5 text-[#059669]" />
            <span>४. मालमत्ता तपासणी</span>
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="max-w-4xl w-full mx-auto px-4 py-3 flex-1 space-y-4">

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 1: समस्या व कायदेशीर उपाय (4-STEP GUIDED WORKFLOW)
            Step 1: केस निवडा (Select Case)
            Step 2: उपाय पहा (View Solution)
            Step 3: कोर्ट अर्ज उघडा (Open Court Draft)
            Step 4: ₹३० भरणा व PDF डाऊनलोड (Pay ₹30 & Download PDF)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "solve" && (
          <div className="space-y-4">
            {/* ── 4-Step Interactive Visual Stepper ── */}
            <div className="flex items-center justify-between max-w-xl mx-auto px-3 py-2 bg-white rounded-xl border border-gray-200/90 text-[11px] font-bold text-gray-500 shadow-2xs">
              <div className={cn("flex items-center gap-1.5 transition-colors", (selectedCategoryId || problemText) ? "text-[#013B36] font-black" : "text-gray-400")}>
                <span className={cn("w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black transition-colors", (selectedCategoryId || problemText) ? "bg-[#013B36] text-white" : "bg-gray-100 text-gray-500")}>
                  १
                </span>
                <span>१. केस निवडा</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <div className={cn("flex items-center gap-1.5 transition-colors", (showSolution && activeProblem) ? "text-[#013B36] font-black" : "text-gray-400")}>
                <span className={cn("w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black transition-colors", (showSolution && activeProblem) ? "bg-[#013B36] text-white" : "bg-gray-100 text-gray-500")}>
                  २
                </span>
                <span>२. कायदेशीर उपाय</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <div className={cn("flex items-center gap-1.5 transition-colors", (showDocument && activeProblem) ? "text-[#013B36] font-black" : "text-gray-400")}>
                <span className={cn("w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black transition-colors", (showDocument && activeProblem) ? "bg-[#013B36] text-white" : "bg-gray-100 text-gray-500")}>
                  ३
                </span>
                <span>३. कोर्ट अर्ज</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
              <div className={cn("flex items-center gap-1.5 transition-colors", isPaid ? "text-[#013B36] font-black" : "text-gray-400")}>
                <span className={cn("w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black transition-colors", isPaid ? "bg-[#013B36] text-white" : "bg-gray-100 text-gray-500")}>
                  ४
                </span>
                <span>४. ₹३० भरणा व PDF</span>
              </div>
            </div>

            {/* ── Step 1: Compact Search & Problem Selection Box ── */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                  पायरी १: आपली कायदेशीर समस्या निवडा किंवा शोधा:
                </span>
                <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                  विषयावर १-क्लिक करा व नंतर 'उपाय पहा' वर क्लिक करा
                </span>
              </div>

              {/* Compact Unified Search Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={problemText}
                    onChange={(e) => {
                      setProblemText(e.target.value);
                      setShowSolution(false);
                      setShowDocument(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSolveProblem();
                    }}
                    placeholder="उदा. ऑनलाइन पैसे कापले, पगार दिला नाही, पोलिसांनी FIR नाकारली..."
                    className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#013B36] focus:ring-2 focus:ring-[#059669]/20 focus:bg-white transition font-medium text-gray-900"
                  />
                  {problemText && (
                    <button
                      onClick={() => {
                        setProblemText("");
                        setSelectedCategoryId(null);
                        setShowSolution(false);
                        setShowDocument(false);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleSolveProblem()}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#013B36] hover:bg-[#024E47] text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-[#013B36]/25 cursor-pointer"
                >
                  <span>कायदेशीर उपाय पहा (View Solution)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User-Friendly Quick Category Cards (Click to Select Case) */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-500 mb-2">
                  किंवा खालील ८ प्रमुख विषयांमधून आपली केस निवडा:
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
                    const isSelected = selectedCategoryId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          if (prob) {
                            setSelectedCategoryId(topic.id);
                            setProblemText(prob.title_mr);
                            setShowSolution(false);
                            setShowDocument(false);
                          }
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer",
                          isSelected
                            ? "bg-[#013B36] text-white border-[#013B36] shadow-sm ring-2 ring-[#059669]/30"
                            : "bg-gray-50/80 hover:bg-[#ECFDF5] text-gray-800 border-gray-200/90 hover:border-[#013B36]/30"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{topic.icon}</span>
                          <span className={cn("text-xs font-black truncate", isSelected ? "text-[#6EE7B7]" : "text-gray-900")}>
                            {topic.label}
                          </span>
                        </div>
                        <span className={cn("text-[10px] line-clamp-1 leading-tight", isSelected ? "text-[#6EE7B7]" : "text-gray-500")}>
                          {topic.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Step 2: Visual, Friendly & Easy-to-Understand Solution Card ── */}
            {showSolution && activeProblem && (
              <div ref={solutionRef} className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#013B36] border border-[#A7F3D0]">
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

                {/* Key Legal Right (Clean Warm Cream / Navy Highlight Box) */}
                <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3.5 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#013B36] text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#013B36] block">
                      तुमचा मुख्य कायदेशीर हक्क (Your Legal Right):
                    </span>
                    <p className="text-xs text-gray-800 font-medium leading-relaxed mt-0.5">
                      {activeProblem.short_rights_mr}
                    </p>
                  </div>
                </div>

                {/* 3 Step-by-Step Clear Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Card 1: Where to go */}
                  <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs space-y-2">
                    <div className="flex items-center gap-2 text-[#013B36] font-black text-xs">
                      <span className="w-5 h-5 rounded-md bg-[#ECFDF5] text-[#013B36] flex items-center justify-center text-xs">🏛️</span>
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
                    <div className="flex items-center gap-2 text-[#013B36] font-black text-xs">
                      <span className="w-5 h-5 rounded-md bg-[#ECFDF5] text-[#013B36] flex items-center justify-center text-xs">📑</span>
                      <span>३. लागणारी कागदपत्रे</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-gray-800 font-medium">
                      {activeProblem.required_docs_mr.map((doc, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <span className="text-[#059669] font-bold">✓</span>
                          <span className="leading-snug">{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Step 3 Trigger: Open Court Document Action Banner ── */}
                <div className="pt-2 bg-gradient-to-r from-[#021F1B] via-[#03362E] to-[#02201D] border border-[#013B36] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs sm:text-sm font-black text-white">
                        या समस्येचा अधिकृत कोर्ट अर्ज तयार करू इच्छिता?
                      </span>
                      <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-[#059669] text-white">
                        कोर्ट-मान्य A4
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6EE7B7] font-medium">
                      वकिलांशिवाय ५ मिनिटांत कोर्ट-मान्य अधिकृत A4 अर्ज तात्काळ पहा व डाऊनलोड करा.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDocument(true);
                      setTimeout(() => {
                        documentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }, 120);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#013B36] hover:bg-[#024E47] text-white font-black text-xs rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <FileText className="w-3.5 h-3.5 text-white" />
                    <span>अधिकृत कोर्ट अर्ज उघडा (Open Court Draft) →</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3 & 4: Official Court Petition Document & Payment Download Card ── */}
            {showDocument && activeProblem && (
              <div ref={documentRef} className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#013B36] text-white flex items-center justify-center shadow-2xs">
                      <FileText className="w-4 h-4 text-[#059669]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-gray-900">
                          अधिकृत कोर्ट / कार्यालयीन तक्रार अर्ज (Court Petition Draft)
                        </h4>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#013B36] border border-[#A7F3D0]">
                          तयार आहे
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 font-medium">
                        कायदेशीररित्या वैध &bull; A4 कोर्ट फॉरमॅट &bull; वकील फी ₹१,५०० वाचवा
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingDetails(!isEditingDetails)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#013B36] hover:text-black px-2.5 py-1 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#ECFDF5] transition cursor-pointer"
                  >
                    {isEditingDetails ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>तपशील लपवा</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>✏️ अर्जाचे तपशील बदला (नाव / पत्ता)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Optional Expandable Details Form */}
                {isEditingDetails && (
                  <div className="bg-gray-50/90 border border-gray-200 rounded-xl p-3.5 space-y-3 text-xs animate-in fade-in duration-200">
                    <span className="font-bold text-gray-700 block">
                      आपली माहिती प्रविष्ट करा (अर्जात आपोआप अपडेट होईल):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          अर्जदाराचे पूर्ण नाव
                        </label>
                        <input
                          type="text"
                          value={applicantName}
                          onChange={(e) => setApplicantName(e.target.value)}
                          placeholder="उदा. रमेश शंकर पाटील"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          मोबाईल क्रमांक
                        </label>
                        <input
                          type="tel"
                          value={applicantPhone}
                          onChange={(e) => setApplicantPhone(e.target.value)}
                          placeholder="उदा. ९८२२००११२२"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          ज्यांच्याविरुद्ध तक्रार (कंपनी / व्यक्तीचे नाव)
                        </label>
                        <input
                          type="text"
                          value={oppositeParty}
                          onChange={(e) => setOppositeParty(e.target.value)}
                          placeholder="उदा. ABC प्रा. लि. / बँक मॅनेजर"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          घटना ठिकाण व शहर
                        </label>
                        <input
                          type="text"
                          value={incidentPlace}
                          onChange={(e) => setIncidentPlace(e.target.value)}
                          placeholder="उदा. शिवाजीनगर, पुणे"
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (activeProblem) {
                            generateDraftForProblem(activeProblem, applicantName, applicantPhone, oppositeParty, incidentPlace, incidentDate);
                            toast.success("अर्जाचा मजकूर अपडेट झाला!");
                          }
                        }}
                        className="px-4 py-1.5 bg-[#013B36] text-white font-bold text-xs rounded-lg hover:bg-[#182C4E] transition cursor-pointer"
                      >
                        अर्ज अपडेट करा
                      </button>
                    </div>
                  </div>
                )}

                {/* Preformatted Generated Court Application Preview */}
                <div className="relative">
                  <div className="p-4 bg-gray-50/90 rounded-xl border border-gray-200/90 font-mono text-[11.5px] leading-relaxed text-gray-800 whitespace-pre-wrap max-h-80 overflow-y-auto select-all shadow-2xs">
                    {generatedDoc || "अर्ज तयार होत आहे..."}
                  </div>
                </div>

                {/* Action & Payment Bar (Step 4: Pay & Download) */}
                <div>
                  {isPaid ? (
                    <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="text-xs font-black text-[#013B36] block">
                            भरणा यशस्वी झाला आहे (पावती क्र: {receiptId})
                          </span>
                          <span className="text-[10px] text-gray-600 font-medium">
                            आपला कोर्ट-मान्य अधिकृत अर्ज डाऊनलोड किंवा प्रिंटसाठी तयार आहे.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedDoc);
                            toast.success("अर्जाचा मजकूर कॉपी केला!");
                          }}
                          className="flex-1 sm:flex-initial px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-[#013B36] flex items-center justify-center gap-1 cursor-pointer transition shadow-2xs"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-600" />
                          <span>कॉपी करा</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => printOfficialA4Document(generatedDoc, activeProblem.title_mr, receiptId)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-black rounded-xl border border-[#013B36] bg-[#013B36] hover:bg-[#024E47] text-[#6EE7B7] flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#6EE7B7]" />
                          <span>🖨️ प्रिंट / Save as PDF</span>
                        </button>
                        <button
                          type="button"
                          disabled={isDownloadingPdf}
                          onClick={() => downloadPetitionPdf(generatedDoc, activeProblem.title_mr, receiptId)}
                          className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-black rounded-xl bg-[#013B36] hover:bg-[#024E47] text-white flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shadow-[#013B36]/25 disabled:opacity-60"
                        >
                          {isDownloadingPdf ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>PDF डाऊनलोड होत आहे...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 text-white" />
                              <span>📥 अधिकृत PDF डाऊनलोड</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-[#021F1B] via-[#03362E] to-[#02201D] border border-[#013B36] rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                      <div className="space-y-0.5 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2">
                          <span className="text-xs sm:text-sm font-black text-white">
                            हा अधिकृत कोर्ट अर्ज डाऊनलोड करा
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#059669] text-white shadow-2xs">
                            केवळ ₹३०/-
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6EE7B7] font-medium">
                          वकिलांचे ₹१,५०० वाचवा &bull; तात्काळ UPI द्वारे भरणा &bull; कोर्ट-मान्य A4 PDF
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowPayModal(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#013B36] hover:bg-[#024E47] text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
                      >
                        <CreditCard className="w-4 h-4 text-white" />
                        <span>₹३० भरणा करा व अधिकृत PDF डाऊनलोड करा →</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 2: अधिकृत तक्रार अर्ज जनरेटर (COMPACT DRAFTER - ₹30)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "draft" && (
          <div className="space-y-4">
            {/* Context Badge */}
            <div className="bg-white rounded-xl border border-gray-200/90 p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">निवडलेली तक्रार:</span>
                <strong className="text-[#013B36] font-bold">{activeProblem?.title_mr || "तक्रार अर्ज"}</strong>
              </div>
              <button
                onClick={() => setActiveTab("solve")}
                className="text-xs font-bold text-[#059669] hover:underline cursor-pointer"
              >
                तक्रार बदला ↻
              </button>
            </div>

            {/* Compact Drafting Form */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#059669]" />
                  <span>तक्रार अर्जाची माहिती प्रविष्ट करा:</span>
                </h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#ECFDF5] text-[#013B36] border border-[#A7F3D0]">
                  शुल्क: ₹३०/-
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20 focus:bg-white font-medium"
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20 focus:bg-white font-medium"
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20 focus:bg-white font-medium"
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
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20 focus:bg-white font-medium"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleGenerateDocument}
                  disabled={isDrafting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#013B36] hover:bg-[#024E47] text-white font-black text-xs rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDrafting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>अर्ज तयार होत आहे...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white" />
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
                          type="button"
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
                          type="button"
                          onClick={() => printOfficialA4Document(generatedDoc, activeProblem?.title_mr || "तक्रार अर्ज", receiptId)}
                          className="px-3 py-1 text-xs font-black rounded-lg border border-[#013B36] bg-[#013B36] hover:bg-[#024E47] text-[#6EE7B7] flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-3 h-3 text-[#6EE7B7]" />
                          <span>प्रिंट / Save as PDF</span>
                        </button>
                        <button
                          type="button"
                          disabled={isDownloadingPdf}
                          onClick={() => downloadPetitionPdf(generatedDoc, activeProblem?.title_mr || "तक्रार अर्ज", receiptId)}
                          className="px-3 py-1 text-xs font-black rounded-lg bg-[#013B36] hover:bg-[#024E47] text-white flex items-center gap-1 cursor-pointer shadow-md shadow-[#013B36]/25 disabled:opacity-60"
                        >
                          <Download className="w-3 h-3 text-white" />
                          <span>{isDownloadingPdf ? "PDF डाऊनलोड..." : "PDF डाऊनलोड"}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPayModal(true)}
                        className="px-3.5 py-1.5 text-xs font-black rounded-lg bg-[#013B36] hover:bg-[#024E47] text-white flex items-center gap-1.5 shadow-md shadow-[#013B36]/25 cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5 text-white" />
                        <span>₹३० भरणा करा व डाऊनलोड करा →</span>
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
              <FileCheck className="w-4 h-4 text-[#059669]" />
              <span>माझे जतन केलेले अर्ज ({savedDocs.length})</span>
            </h3>

            {savedDocs.length === 0 ? (
              <div className="text-center py-8 text-gray-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs font-semibold">अद्याप कोणताही अर्ज जतन केलेला नाही.</p>
                <button
                  onClick={() => setActiveTab("solve")}
                  className="text-xs font-bold text-[#059669] hover:underline cursor-pointer"
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
                        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[#013B36] bg-[#013B36] hover:bg-[#024E47] text-[#6EE7B7] flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3 text-[#6EE7B7]" />
                        <span>पहा / प्रिंट</span>
                      </button>
                      <button
                        type="button"
                        disabled={isDownloadingPdf}
                        onClick={() => downloadPetitionPdf(doc.content, doc.title, doc.id)}
                        className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[#013B36] hover:bg-[#024E47] text-white flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-60"
                        title="PDF डाऊनलोड करा"
                      >
                        <Download className="w-3 h-3 text-white" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            TAB 4: मालमत्ता कायदेशीर तपासणी (PROPERTY LEGAL CHECK & COURT SEARCH)
        ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "property" && (
          <PropertyLegalCheck lang={lang} />
        )}
      </main>

      {/* ── Integrated ₹30 Payment Modal ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#013B36] flex items-center justify-center border border-[#A7F3D0]">
                  <CreditCard className="w-4 h-4 text-[#059669]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900">अधिकृत कोर्ट अर्ज - सुरक्षित भरणा</h4>
                  <p className="text-[10px] text-gray-500 font-medium">Fastcase Legal ERP &bull; 256-bit SSL Secure</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xs p-1 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Price Banner */}
            <div className="p-3.5 bg-[#ECFDF5] rounded-xl border border-[#A7F3D0] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#013B36] font-bold block">एकवेळ अधिकृत ड्राफ्टिंग शुल्क:</span>
                <span className="text-[10px] text-gray-600">वकिलांचे ₹१,५०० वाचवा &bull; कोर्ट-मान्य A4 PDF</span>
              </div>
              <div className="text-2xl font-black text-[#013B36]">₹३०/-</div>
            </div>

            {/* Payment Method Tabs */}
            <div className="grid grid-cols-3 p-1 bg-gray-100 rounded-xl gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentTab("upi_qr")}
                className={cn(
                  "py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer",
                  paymentTab === "upi_qr"
                    ? "bg-white text-[#013B36] shadow-2xs font-black ring-1 ring-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <QrCode className="w-3.5 h-3.5 text-[#059669]" />
                <span>UPI QR</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("upi_apps")}
                className={cn(
                  "py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer",
                  paymentTab === "upi_apps"
                    ? "bg-white text-[#013B36] shadow-2xs font-black ring-1 ring-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Smartphone className="w-3.5 h-3.5 text-[#059669]" />
                <span>UPI Apps</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("card")}
                className={cn(
                  "py-1.5 px-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer",
                  paymentTab === "card"
                    ? "bg-white text-[#013B36] shadow-2xs font-black ring-1 ring-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <CreditCard className="w-3.5 h-3.5 text-[#059669]" />
                <span>Card / NetBank</span>
              </button>
            </div>

            {/* Tab 1: UPI QR */}
            {paymentTab === "upi_qr" && (
              <div className="space-y-3 text-center">
                <div className="p-3 bg-white rounded-xl border border-gray-200 inline-block shadow-2xs mx-auto">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi%3A%2F%2Fpay%3Fpa%3Dsupport%40fastcase.in%26pn%3DFastcase%2520ERP%26am%3D30%26cu%3DINR%26tn%3DCourt%2520Petition%2520Draft"
                    alt="UPI QR Code"
                    className="w-40 h-40 mx-auto rounded-lg"
                  />
                </div>
                <p className="text-xs font-bold text-gray-700">
                  कोणत्याही UPI अ‍ॅपद्वारे (GPay, PhonePe, Paytm) स्कॅन करून ₹३० पाठवा
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-mono bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-lg max-w-xs mx-auto">
                  <span className="text-gray-600">UPI ID:</span>
                  <span className="font-bold text-[#013B36]">support@fastcase.in</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("support@fastcase.in");
                      toast.success("UPI ID कॉपी केला!");
                    }}
                    className="text-[#059669] hover:text-[#E8523E] font-bold ml-1 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: UPI Apps */}
            {paymentTab === "upi_apps" && (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-gray-600 text-center">
                  आपल्या आवडत्या UPI अ‍ॅपवर १-क्लिक करा:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <a
                    href="upi://pay?pa=support@fastcase.in&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-[#ECFDF5] flex items-center gap-2 font-bold transition"
                  >
                    <span className="text-base">🟢</span>
                    <span>Google Pay</span>
                  </a>
                  <a
                    href="phonepe://pay?pa=support@fastcase.in&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-[#ECFDF5] flex items-center gap-2 font-bold transition"
                  >
                    <span className="text-base">🟣</span>
                    <span>PhonePe</span>
                  </a>
                  <a
                    href="paytmmp://pay?pa=support@fastcase.in&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-[#ECFDF5] flex items-center gap-2 font-bold transition"
                  >
                    <span className="text-base">🔵</span>
                    <span>Paytm</span>
                  </a>
                  <a
                    href="upi://pay?pa=support@fastcase.in&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-[#ECFDF5] flex items-center gap-2 font-bold transition"
                  >
                    <span className="text-base">🟠</span>
                    <span>BHIM UPI</span>
                  </a>
                </div>
              </div>
            )}

            {/* Tab 3: Card / NetBanking */}
            {paymentTab === "card" && (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">कार्ड नंबर (Debit / Credit Card)</label>
                  <input
                    type="text"
                    placeholder="४१११ २२२२ ३३३३ ४४४४"
                    maxLength={19}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">समाप्ती तारीख</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">CVV</label>
                    <input
                      type="password"
                      placeholder="•••"
                      maxLength={3}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs focus:outline-none focus:border-[#013B36] focus:ring-1 focus:ring-[#059669]/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Complete Payment Button */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleCompletePayment}
                disabled={isProcessingPay}
                className="w-full py-3 bg-[#013B36] hover:bg-[#024E47] text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPay ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>भरणा पडताळत आहे व PDF डाऊनलोड होत आहे...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>भरणा पूर्ण झाला (Verify & Download PDF) →</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="w-full py-1.5 text-xs font-bold text-gray-400 hover:text-gray-700 transition cursor-pointer"
              >
                रद्द करा (Cancel)
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
                className={cn("py-1.5 rounded-lg transition", authModalTab === "login" ? "bg-white text-[#013B36] shadow-2xs font-black ring-1 ring-gray-200" : "text-gray-600")}
              >
                लॉगिन
              </button>
              <button
                onClick={() => setAuthModalTab("register")}
                className={cn("py-1.5 rounded-lg transition", authModalTab === "register" ? "bg-white text-[#013B36] shadow-2xs font-black ring-1 ring-gray-200" : "text-gray-600")}
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
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#013B36]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">पासवर्ड</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#013B36]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-[#013B36] hover:bg-[#024E47] text-[#6EE7B7] font-black text-xs rounded-xl shadow-xs transition"
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
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#013B36]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ईमेल आयडी</label>
                  <input
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="citizen@example.com"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#013B36]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">पासवर्ड</label>
                  <input
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:border-[#013B36]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-[#013B36] hover:bg-[#024E47] text-[#6EE7B7] font-black text-xs rounded-xl shadow-xs transition"
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
