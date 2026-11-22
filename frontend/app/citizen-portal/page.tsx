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
  const [applicantAddress, setApplicantAddress] = useState<string>("");
  const [oppositeParty, setOppositeParty] = useState<string>("");
  const [opponentAddress, setOpponentAddress] = useState<string>("");
  const [incidentDate, setIncidentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [incidentTime, setIncidentTime] = useState<string>("");
  const [incidentPlace, setIncidentPlace] = useState<string>("");
  const [claimAmount, setClaimAmount] = useState<string>("");
  const [bankOrOrgName, setBankOrOrgName] = useState<string>("");
  const [accountOrUtr, setAccountOrUtr] = useState<string>("");
  const [extraDetails, setExtraDetails] = useState<string>("");
  const [pageFormatPreference, setPageFormatPreference] = useState<"auto" | "1page" | "2page">("auto");
  const [docPreviewTab, setDocPreviewTab] = useState<"court" | "text">("court");
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

  // ── Petition Layout & Content Model (Handbook-Grade Legal Architecture) ───
  const getPetitionModel = (docTitle?: string, customReceipt?: string) => {
    const applicant = (applicantName.trim() || user?.full_name || "नागरिक अर्जदार");
    const phone = (applicantPhone.trim() || user?.phone || "नोंदणीकृत मोबाईल");
    const address = (applicantAddress.trim() || incidentPlace.trim() || "स्थानिक रहिवासी");
    const opp = (oppositeParty.trim() || "संबंधित कार्यालय / संस्था");
    const oppAddress = (opponentAddress.trim() || incidentPlace.trim() || "स्थानिक शाखा / कार्यालय");
    const place = (incidentPlace.trim() || "महाराष्ट्र");
    const date = (incidentDate || new Date().toISOString().split("T")[0]);
    const time = incidentTime.trim();
    const amount = claimAmount.trim();
    const bank = bankOrOrgName.trim();
    const utr = accountOrUtr.trim();
    const extra = extraDetails.trim();
    const today = new Date().toLocaleDateString("mr-IN");
    const receiptToUse = customReceipt || receiptId || `FC-DOC-${Date.now().toString().slice(-6)}`;
    const titleToUse = docTitle || activeProblem?.title_mr || "कोर्ट-मान्य अधिकृत तक्रार / दाद अर्ज";
    const chapterBadge = activeProblem?.chapter_badge || "प्रकरण १ • अधिकृत विधी मसुदा";
    const deadlineToUse = activeProblem?.statutory_deadline_mr || "गुन्हा घडल्याबरोबर अथवा हक्कांचे उल्लंघन झाल्यावर तात्काळ दाद मागावी; विलंबाचे कारण अर्जात स्पष्ट लिहावे.";
    const summaryTable = activeProblem?.quick_summary_table;

    const template = activeProblem?.draft_template || {
      recipient_title: "मा. सक्षम प्राधिकारी / पोलीस निरीक्षक साहेब",
      subject: titleToUse,
      act_reference: "भारतीय नागरिक सुरक्षा संहिता (BNSS) २०२३ / भारतीय न्याय संहिता (BNS) २०२३",
      body_facts: "अर्जदाराने नमूद केलेल्या घटनेनुसार कायदेशीर हक्कांचे थेट व गंभीर उल्लंघन झाले आहे.",
      relief: "सदर प्रकरणी योग्य ती कायदेशीर चौकशी करून अर्जदारास तात्काळ न्याय व नुकसानभरपाई मिळवून द्यावी ही नम्र विनंती.",
    };

    let recipientClean = template.recipient_title
      .replace(/\[बँकेचे नाव\]/g, bank || opp || "संबंधित बँक शाखा")
      .replace(/\[कार्यालयाचे नाव\]/g, opp || "संबंधित कार्यालय")
      .replace(/\[पोलीस ठाण्याचे नाव\]/g, oppAddress || place || "स्थानिक पोलीस ठाणे")
      .replace(/\[जिल्ह्याचे नाव\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[जिल्हा\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[पत्ता\]/g, oppAddress || "स्थानिक पत्ता")
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    let factsClean = template.body_facts
      .replace(/\[आपले नाव\]/g, applicant)
      .replace(/\[मोबाईल\]/g, phone)
      .replace(/\[पत्ता\]/g, address)
      .replace(/\[तारीख\]/g, date)
      .replace(/\[वेळ\]/g, time ? `अंदाजे वेळ ${time}` : "सदर वेळी")
      .replace(/\[ठिकाण\]/g, place)
      .replace(/\[बँकेचे नाव\]/g, bank || opp || "संबंधित बँक शाखा")
      .replace(/\[खाते क्र\.\]/g, utr ? utr : "नोंदणीकृत बँक खाते")
      .replace(/\[रक्कम\]/g, amount ? `रुपये ${amount}/-` : "कापलेली रक्कम")
      .replace(/\[थकीत रक्कम\]/g, amount ? `रुपये ${amount}/-` : "थकीत रक्कम")
      .replace(/\[आयडी\]/g, utr || "बँक स्टेटमेंटनुसार")
      .replace(/\[बिल क्र\.\]/g, utr || "पावतीनुसार")
      .replace(/\[मेसेज\/कॉल\/बनावट लिंक\]/g, extra || "बनावट कॉल / OTP / संशयास्पद लिंक")
      .replace(/\[कंपनीचे नाव\]/g, opp)
      .replace(/\[विरोधी पक्षाचे नाव\]/g, opp)
      .replace(/\[आरोपीचे नाव\]/g, opp)
      .replace(/\[कार्यालयाचे नाव\]/g, opp)
      .replace(/\[पतीचे नाव\]/g, opp)
      .replace(/\[गुन्ह्याचा तपशील - मारहाण\/धमकी\/चोरी\]/g, extra || "दखलपात्र गुन्हा")
      .replace(/\[घटनेचा तपशील\]/g, extra || "कायदेशीर हक्कांचे उल्लंघन")
      .replace(/\[दोषाचे वर्णन\]/g, extra || "वस्तू / सेवेमधील सदोषपणा")
      .replace(/\[पोलीस ठाण्याचे नाव\]/g, oppAddress || place || "स्थानिक पोलीस ठाणे")
      .replace(/\[जिल्ह्याचे नाव\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[जिल्हा\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[तालुका \/ जिल्हा\]/g, place || "स्थानिक तालुका/जिल्हा")
      .replace(/\[गावाचे नाव\]/g, place || "स्थानिक गाव")
      .replace(/\[सर्व्हे क्र\.\]/g, utr || "मिळकत / सर्व्हे क्र.")
      .replace(/\[विवाह तारीख\]/g, date)
      .replace(/\[वस्तूचे नाव\]/g, extra || "खरेदी केलेली वस्तू / सेवा")
      .replace(/\[हुद्दा\]/g, "कर्मचारी / कामगार")
      .replace(/\[महिना\]/g, "संबंधित कालावधी")
      .replace(/\[मुद्दा १\]/g, extra || "संबंधित कामाची अधिकृत नोंद व कागदपत्रांची प्रमाणित प्रत")
      .replace(/\[मुद्दा २\]/g, "सदर प्रकरणातील सक्षम प्राधिकाऱ्यांचे आदेश व टिप्पणी")
      .replace(/\[कार्यालयाचे नाव \/ काम\]/g, opp || "संबंधित कार्यालयीन कामकाज")
      .replace(/\[कागदपत्राचे नाव व क्रमांक[^\]]*\]/g, extra || utr || "महत्त्वाचे अधिकृत मूळ कागदपत्र")
      .replace(/\[[^\]]+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Determine 1-page vs 2-page dynamically based on content volume or user toggle
    const isTwoPage =
      pageFormatPreference === "2page" ? true :
      pageFormatPreference === "1page" ? false :
      (extra.length > 90 || (factsClean.length + template.relief.length > 460) || address.length > 60 || Boolean(summaryTable));

    return {
      applicant, phone, address, opp, oppAddress, place, date, time, amount, bank, utr, extra, today,
      receiptToUse, titleToUse, chapterBadge, deadlineToUse, summaryTable, template,
      recipientClean, factsClean, isTwoPage
    };
  };

  // ── Publication-Grade HTML Section Builders ──────────────────────────────
  const renderPublicationHeaderHtml = (chapterBadge: string, title: string) => `
    <div style="border-bottom: 1.5px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #475569;">
      <div>
        <span style="font-weight: 800; color: #1e3a8a;">${chapterBadge}</span>
        <span style="color: #94a3b8; margin: 0 4px;">•</span>
        <span style="font-weight: 700; color: #1e293b;">${title}</span>
      </div>
      <div style="font-weight: 600; color: #64748b;">
        महाराष्ट्र नागरिक कायदेविषयक मार्गदर्शिका • फास्टकेस विधी कक्ष
      </div>
    </div>

    <!-- Chapter Title Navy Card Banner -->
    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #0f2e6b 100%); padding: 10px 14px; border-radius: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; color: #ffffff;">
      <div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="background: rgba(254, 240, 138, 0.2); color: #fef08a; padding: 2px 7px; border-radius: 4px; font-size: 8pt; font-weight: 800; border: 1px solid rgba(254, 240, 138, 0.4);">
            ${chapterBadge}
          </span>
          <span style="font-size: 8.5pt; color: #bfdbfe; font-weight: 700; letter-spacing: 0.5px;">
            अधिकृत कोर्ट व पोलीस तक्रार मसुदा
          </span>
        </div>
        <div style="font-size: 13.5pt; font-weight: 800; color: #ffffff; margin-top: 3px; letter-spacing: -0.2px;">
          ${title}
        </div>
        <div style="font-size: 8pt; color: #93c5fd; margin-top: 2px;">
          (भारतीय नागरिक सुरक्षा संहिता २०२३ • भारतीय न्याय संहिता २०२३ • भारतीय साक्ष अधिनियम २०२३)
        </div>
      </div>
      <div style="font-size: 26px; line-height: 1; padding-left: 10px;">
        🏛️
      </div>
    </div>
  `;

  const renderEFilingBarHtml = (receipt: string, today: string) => `
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 5px; padding: 6px 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 8.5pt;">
      <div style="color: #166534; font-weight: 800; font-family: monospace;">
        🔖 ई-फायलिंग नोंदणी क्र.: <b>${receipt}</b>
      </div>
      <div style="color: #15803d; font-weight: 700;">
        ✓ मुद्रांक शुल्क: ₹३० (भरणा पूर्ण • अधिकृत प्रत)
      </div>
      <div style="color: #334155; font-weight: 600;">
        📅 दिनांक: ${today} &bull; कोर्ट पुरावा प्रत
      </div>
    </div>
  `;

  const renderSubjectBoxHtml = (recipient: string, subject: string, actRef?: string) => `
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #1e3a8a; padding: 7px 12px; border-radius: 4px; margin-bottom: 10px; font-size: 9.5pt; line-height: 1.4;">
      <div>
        <span style="font-weight: 800; color: #1e3a8a;">प्रति,</span> <span style="font-weight: 700; color: #0f172a;">${recipient}</span>
      </div>
      <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;">
        <span style="font-weight: 800; color: #1e3a8a;">विषय:</span> <span style="font-weight: 700; color: #0f172a;">${subject}</span>
      </div>
      ${actRef ? `
      <div style="margin-top: 2px; font-size: 8.5pt; color: #334155; font-weight: 600;">
        <span style="color: #1e3a8a; font-weight: 700;">कायदेशीर संदर्भ:</span> ${actRef}
      </div>` : ""}
    </div>
  `;

  const renderPartiesTableHtml = (m: ReturnType<typeof getPetitionModel>) => `
    <div style="margin-bottom: 10px;">
      <div style="font-size: 9pt; font-weight: 800; color: #1e3a8a; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center;">
        <span>📋 पक्षकार व तक्रार तपशील तक्ता (Parties & Claim Particulars):</span>
        <span style="font-size: 8pt; font-weight: 600; color: #64748b;">(कोर्ट व पोलीस रेकॉर्डसाठी अधिकृत नोंद)</span>
      </div>
      <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #1e3a8a; font-size: 9pt; line-height: 1.4; font-family: inherit;">
        <thead>
          <tr style="background: #1e3a8a; color: #ffffff;">
            <th style="width: 50%; padding: 4px 8px; text-align: left; font-weight: 700; border-right: 1px solid #ffffff; font-size: 9pt;">
              [१] तक्रारदार / अर्जदार (Complainant)
            </th>
            <th style="width: 50%; padding: 4px 8px; text-align: left; font-weight: 700; font-size: 9pt;">
              [२] विरोधी पक्ष / प्रतिवादी (Opposite Party)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 6px 8px; vertical-align: top; border-right: 1.5px solid #1e3a8a; background: #fbfdfc;">
              <div><b style="color: #1e3a8a;">पूर्ण नाव:</b> ${m.applicant}</div>
              <div><b style="color: #1e3a8a;">मोबाईल:</b> ${m.phone}</div>
              <div><b style="color: #1e3a8a;">पूर्ण पत्ता:</b> ${m.address}</div>
              ${m.bank ? `<div><b style="color: #1e3a8a;">बँक / संस्था:</b> ${m.bank}</div>` : ""}
              ${m.utr ? `<div><b style="color: #1e3a8a;">खाते क्र.:</b> ${m.utr}</div>` : ""}
            </td>
            <td style="padding: 6px 8px; vertical-align: top; background: #fbfdfc;">
              <div><b style="color: #1e3a8a;">नाव / हुद्दा:</b> ${m.opp}</div>
              <div><b style="color: #1e3a8a;">पत्ता / शाखा:</b> ${m.oppAddress}</div>
              <div><b style="color: #1e3a8a;">तारीख व वेळ:</b> ${m.date} ${m.time ? `(${m.time})` : ""}</div>
              ${m.amount ? `<div><b style="color: #1e3a8a;">फसवणूक / दावा:</b> <span style="color: #b91c1c; font-weight: 800;">₹ ${m.amount}/-</span></div>` : ""}
              ${m.utr ? `<div><b style="color: #1e3a8a;">व्यवहार / UTR क्र.:</b> <span style="font-family: monospace; font-weight: 700;">${m.utr}</span></div>` : ""}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  const renderOrangeDeadlineBox = (deadlineToUse: string) => `
    <div style="background: #fff7ed; border-left: 3.5px solid #ea580c; border: 1px solid #fed7aa; border-left-width: 3.5px; border-left-color: #ea580c; padding: 6px 10px; margin-bottom: 9px; border-radius: 0 4px 4px 0; font-size: 8.5pt; color: #9a3412;">
      <b>⏱ वेळ किती महत्त्वाची? (कायदेशीर मुदत मर्यादा):</b> ${deadlineToUse}
    </div>
  `;

  const renderReliefBox = (relief: string) => `
    <div style="background: #f0fdf4; border-left: 3.5px solid #16a34a; border: 1px solid #bbf7d0; border-left-width: 3.5px; border-left-color: #16a34a; padding: 7px 10px; margin-bottom: 9px; border-radius: 0 4px 4px 0;">
      <div style="font-weight: 800; color: #166534; font-size: 9.5pt; margin-bottom: 2px;">विनंती / मागणी व कायदेशीर दाद (Relief & Prayers):</div>
      <div style="font-size: 9pt; line-height: 1.45; color: #14532d;">${relief}</div>
    </div>
  `;

  const renderQuickSummaryTableHtml = (summaryTable?: { problem: string; first_action: string; competent_authority: string; docs: string; statutory_time: string; if_refused: string; }) => {
    if (!summaryTable) return "";
    return `
      <div style="margin-bottom: 10px;">
        <div style="font-size: 9pt; font-weight: 800; color: #1e3a8a; margin-bottom: 3px; display: flex; justify-content: space-between; align-items: center;">
          <span>📊 एका दृष्टिक्षेपात संपूर्ण प्रक्रिया (Quick Action Protocol):</span>
          <span style="font-size: 8pt; font-weight: 600; color: #64748b;">(नागरिक मार्गदर्शिका अधिकृत मार्गदर्शक तक्ता)</span>
        </div>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1; font-size: 8.5pt; line-height: 1.35; font-family: inherit;">
          <tbody>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="width: 25%; padding: 4px 8px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #e2e8f0;">➜ समस्या</td>
              <td style="padding: 4px 8px; color: #0f172a;">${summaryTable.problem}</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #e2e8f0;">➜ पहिली तात्काळ कृती</td>
              <td style="padding: 4px 8px; color: #0f172a;">${summaryTable.first_action}</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #e2e8f0;">➜ सक्षम कार्यालय</td>
              <td style="padding: 4px 8px; color: #0f172a;">${summaryTable.competent_authority}</td>
            </tr>
            <tr style="background: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #e2e8f0;">➜ आवश्यक कागदपत्रे</td>
              <td style="padding: 4px 8px; color: #0f172a;">${summaryTable.docs}</td>
            </tr>
            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 4px 8px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #e2e8f0;">➜ कायदेशीर मुदत</td>
              <td style="padding: 4px 8px; color: #0f172a;">${summaryTable.statutory_time}</td>
            </tr>
            <tr style="background: #ffffff;">
              <td style="padding: 4px 8px; font-weight: 700; color: #1e3a8a; border-right: 1px solid #e2e8f0;">➜ तक्रार न घेतल्यास</td>
              <td style="padding: 4px 8px; color: #0f172a;">${summaryTable.if_refused}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  };

  const renderEnclosuresChecklistHtml = () => `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px 10px; margin-bottom: 8px; font-size: 8.5pt; color: #334155;">
      <b>सोबत जोडलेली अधिकृत कागदपत्रे (Enclosures Checklist):</b><br/>
      ☑ १. तक्रारदाराच्या आधार कार्डची प्रमाणित प्रत &bull;
      ☑ २. बँक पासबुक / स्टेटमेंट / कापलेल्या रकमेची नोंद &bull;
      ☑ ३. व्यवहार UTR पावती / मेसेज स्क्रीनशॉट &bull;
      ☑ ४. विरोधी पक्षाशी केलेल्या पत्रव्यवहाराची सत्यप्रत.
    </div>
  `;

  const renderVerificationHtml = () => `
    <div style="border-top: 1px dashed #cbd5e1; padding-top: 5px; margin-bottom: 10px; font-size: 8pt; color: #475569; text-align: justify;">
      <b>सत्यप्रतिज्ञा (Statutory Verification under BNSS):</b> मी, वरील तक्रारदार सत्यप्रतिज्ञेवर नमूद करतो की, वरील तक्रारीतील सर्व मुद्दे व परिच्छेद माझ्या व्यक्तिगत माहितीनुसार व कागदपत्रांनुसार सत्य व बिनचूक आहेत. मी या अर्जात कोणतीही खोटी माहिती दिलेली नाही.
    </div>
  `;

  const renderSignaturesHtml = (applicant: string, today: string, place: string) => `
    <div style="display: flex; justify-content: space-between; align-items: flex-end; font-size: 9pt; margin-bottom: 14px;">
      <div>
        <div><b>दिनांक:</b> ${today}</div>
        <div><b>ठिकाण:</b> ${place}</div>
      </div>
      <div style="text-align: center;">
        <div style="border-bottom: 1.5px solid #1e293b; width: 180px; margin-bottom: 4px;"></div>
        <div style="font-weight: 800; color: #0f172a;">तक्रारदाराची सही / अंगठा</div>
        <div style="font-size: 8.5pt; color: #475569;">(${applicant})</div>
      </div>
    </div>
  `;

  const renderPublicationFooterHtml = (pageNum: number, totalPages: number, receipt: string) => `
    <div style="position: absolute; bottom: 12px; left: 42px; right: 42px; border-top: 1px solid #e2e8f0; padding-top: 4px; display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; color: #64748b;">
      <span>फास्टकेस लीगल ईआरपी &bull; अधिकृत नागरिक विधी सहाय्य प्रणाली</span>
      <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 9999px; font-weight: 700; color: #1e3a8a; border: 1px solid #cbd5e1;">[ पृष्ठ ${pageNum} पैकी ${totalPages} ]</span>
      <span>कायदेशीर सल्ल्याचा पर्याय नाही &bull; BNSS, BNS, BSA २०२३</span>
    </div>
  `;

  // ── Print Official A4 Document (Direct Browser Print & Save As PDF) ────────
  const printOfficialA4Document = (content: string, title?: string, receiptCustom?: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const m = getPetitionModel(title, receiptCustom);

    let bodyHtml = "";
    if (!m.isTwoPage) {
      bodyHtml = `
        <div class="a4-page">
          ${renderPublicationHeaderHtml(m.chapterBadge, m.titleToUse)}
          ${renderEFilingBarHtml(m.receiptToUse, m.today)}
          ${renderSubjectBoxHtml(m.recipientClean, m.template.subject, m.template.act_reference)}
          ${renderPartiesTableHtml(m)}
          ${renderOrangeDeadlineBox(m.deadlineToUse)}

          <div style="font-size: 9.5pt; line-height: 1.45; color: #0f172a; text-align: justify; margin-bottom: 8px;">
            <div style="font-weight: 700; margin-bottom: 4px; color: #1e3a8a;">महोदय, मी खालीलप्रमाणे वस्तुस्थिती व कायदेशीर तक्रार सादर करत आहे:</div>
            <div style="margin-bottom: 4px;"><b>१. प्राथमिक घटनाक्रम (Facts):</b> ${m.factsClean}</div>
            <div style="margin-bottom: 4px;"><b>२. पाठपुरावा व नकार (Follow-up & Breach):</b> तक्रारदाराने सदर गंभीर घटनेबाबत विरोधी पक्षाकडे वारंवार कायदेशीर विचारणा व पाठपुरावा केला, परंतु त्यांनी कायदेशीर जबाबदारी पार पाडण्यास नकार दिला व टाळाटाळ केली.</div>
            <div><b>३. कायदेशीर उल्लंघन (Statutory Breach):</b> सदर कृत्य हे ${m.template.act_reference || "प्रचलित कायदे व नियमावली"} अन्वये कायद्याचे थेट उल्लंघन आहे.</div>
          </div>

          ${renderReliefBox(m.template.relief)}
          ${renderEnclosuresChecklistHtml()}
          ${renderVerificationHtml()}
          ${renderSignaturesHtml(m.applicant, m.today, m.place)}
          ${renderPublicationFooterHtml(1, 1, m.receiptToUse)}
        </div>
      `;
    } else {
      bodyHtml = `
        <div class="a4-page page-1">
          ${renderPublicationHeaderHtml(m.chapterBadge, m.titleToUse)}
          ${renderEFilingBarHtml(m.receiptToUse, m.today)}
          ${renderSubjectBoxHtml(m.recipientClean, m.template.subject, m.template.act_reference)}
          ${renderPartiesTableHtml(m)}
          ${renderOrangeDeadlineBox(m.deadlineToUse)}

          <div style="font-size: 9.5pt; line-height: 1.5; color: #0f172a; text-align: justify; margin-top: 8px;">
            <div style="font-weight: 700; margin-bottom: 5px; color: #1e3a8a; font-size: 10pt;">महोदय, मी खालीलप्रमाणे सविस्तर वस्तुस्थिती व तक्रार सादर करत आहे:</div>
            <div style="margin-bottom: 6px;"><b>१. प्राथमिक वस्तुस्थिती (Facts of the Case):</b> ${m.factsClean}</div>
            <div style="margin-bottom: 6px;"><b>२. पाठपुरावा व नकार (Follow-up & Refusal):</b> तक्रारदाराने सदर गंभीर घटनेबाबत विरोधी पक्षाकडे वारंवार कायदेशीर विचारणा व पाठपुरावा केला. परंतु विरोधी पक्षाने आपली कायदेशीर जबाबदारी पार पाडण्यास साफ नकार दिला व जाणीवपूर्वक टाळाटाळ केली.</div>
            <div><b>३. कायदेशीर उल्लंघन (Statutory Breach):</b> विरोधी पक्षाचे सदर कृत्य हे ${m.template.act_reference} अन्वये कायद्याचे थेट व गंभीर उल्लंघन असून तक्रारदारास कायदेशीर दाद मिळणे आवश्यक आहे.</div>
          </div>

          <div style="margin-top: 20px; padding: 8px 12px; background: #f8fafc; border: 1.5px dashed #1e3a8a; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 9pt; color: #1e3a8a; font-weight: 700;">
            <span>🏛️ फास्टकेस अधिकृत मसुदा</span>
            <span>(सदर अर्जाचा पुढील भाग, संपूर्ण प्रक्रिया तक्ता, मागण्या व स्वाक्षरी पृष्ठ २ वर चालू...) &rarr;</span>
          </div>

          ${renderPublicationFooterHtml(1, 2, m.receiptToUse)}
        </div>

        <div class="a4-page page-2 page-break">
          <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5pt; color: #1e3a8a; font-weight: 700;">
            <div>
              <span>🏛️ कोर्ट तक्रार अर्ज (पुढे चालू - पृष्ठ २) &bull; विषय: ${m.template.subject.slice(0, 48)}...</span>
            </div>
            <div style="font-family: monospace; font-size: 8.5pt; color: #475569;">
              पावती: ${m.receiptToUse} &bull; ${m.today}
            </div>
          </div>

          <div style="font-size: 9.5pt; line-height: 1.45; color: #0f172a; text-align: justify; margin-bottom: 10px;">
            ${m.extra ? `
            <div style="margin-bottom: 8px; background: #fdfdfe; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px;">
              <b style="color: #1e3a8a;">४. विशेष हकीकत व पुराव्यांचा तपशील:</b><br/>
              <span style="font-size: 9pt; color: #1e293b;">${m.extra}</span>
            </div>` : ""}

            <div style="margin-bottom: 8px;">
              <b>५. नुकसान व मानसिक त्रास:</b> विरोधी पक्षाच्या बेकायदेशीर व निष्काळजी वागणुकीमुळे तक्रारदाराचे गंभीर आर्थिक नुकसान झाले असून प्रचंड मानसिक व आर्थिक त्रास सहन करावा लागला आहे.
            </div>
          </div>

          ${renderQuickSummaryTableHtml(m.summaryTable)}
          ${renderReliefBox(m.template.relief)}
          ${renderEnclosuresChecklistHtml()}
          ${renderVerificationHtml()}
          ${renderSignaturesHtml(m.applicant, m.today, m.place)}
          ${renderPublicationFooterHtml(2, 2, m.receiptToUse)}
        </div>
      `;
    }

    printWindow.document.write(`<!DOCTYPE html>
<html lang="mr">
<head>
  <meta charset="UTF-8">
  <title>${m.titleToUse} - Fastcase Official Court Application</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800&family=Noto+Serif+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 10mm 14mm 10mm 14mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Mukta', 'Noto Serif Devanagari', 'Mangal', serif;
      color: #0f172a;
      line-height: 1.45;
      background: #f1f5f9;
      margin: 0;
      padding: 16px;
    }
    .no-print-bar {
      max-width: 794px;
      margin: 0 auto 14px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e3a8a;
      color: #ffffff;
      padding: 10px 16px;
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
    .a4-page {
      width: 794px;
      min-height: 1123px;
      margin: 0 auto 16px auto;
      background: #ffffff;
      padding: 28px 40px 24px 40px;
      border-radius: 4px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      border: 1px solid #cbd5e1;
      position: relative;
    }
    @media print {
      body { background: #ffffff; padding: 0; margin: 0; }
      .no-print-bar { display: none !important; }
      .a4-page {
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
        min-height: 100% !important;
        margin: 0 !important;
      }
      .page-break {
        page-break-before: always !important;
        break-before: page !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <div><strong>🏛️ फास्टकेस विधी कक्ष</strong> &bull; अधिकृत कोर्ट तक्रार अर्ज (${m.isTwoPage ? "२ पाने" : "१ पान"})</div>
    <button class="print-btn" onclick="window.print()">🖨️ PDF म्हणून सेव्ह करा / प्रिंट करा</button>
  </div>
  ${bodyHtml}
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
    const m = getPetitionModel(docTitle, customReceipt);

    if (!docText && !activeProblem) {
      toast.error("अर्ज उपलब्ध नाही.");
      return;
    }

    setIsDownloadingPdf(true);
    toast.info("अधिकृत कोर्ट PDF तयार होत आहे...");

    try {
      const { jsPDF } = await import("jspdf");
      const html2canvas = (await import("html2canvas")).default as any;

      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.zIndex = "-9999";
      document.body.appendChild(container);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      if (!m.isTwoPage) {
        // ── 1-PAGE DOCUMENT GENERATION (Exact 1-page fit, zero overflow) ──────
        const pageEl = document.createElement("div");
        pageEl.style.width = "794px";
        pageEl.style.height = "1123px";
        pageEl.style.maxHeight = "1123px";
        pageEl.style.boxSizing = "border-box";
        pageEl.style.padding = "26px 40px 22px 40px";
        pageEl.style.backgroundColor = "#ffffff";
        pageEl.style.fontFamily = "'Mukta', 'Noto Serif Devanagari', 'Noto Sans Devanagari', 'Mangal', serif";
        pageEl.style.color = "#0f172a";
        pageEl.style.position = "relative";
        pageEl.style.overflow = "hidden";

        pageEl.innerHTML = `
          ${renderPublicationHeaderHtml(m.chapterBadge, m.titleToUse)}
          ${renderEFilingBarHtml(m.receiptToUse, m.today)}
          ${renderSubjectBoxHtml(m.recipientClean, m.template.subject, m.template.act_reference)}
          ${renderPartiesTableHtml(m)}
          ${renderOrangeDeadlineBox(m.deadlineToUse)}

          <div style="font-size: 9.5pt; line-height: 1.45; color: #0f172a; text-align: justify; margin-bottom: 8px;">
            <div style="font-weight: 700; margin-bottom: 4px; color: #1e3a8a;">महोदय, मी खालीलप्रमाणे वस्तुस्थिती व कायदेशीर तक्रार सादर करत आहे:</div>
            <div style="margin-bottom: 4px;"><b>१. प्राथमिक घटनाक्रम (Facts):</b> ${m.factsClean}</div>
            <div style="margin-bottom: 4px;"><b>२. पाठपुरावा व नकार (Follow-up & Breach):</b> तक्रारदाराने सदर गंभीर घटनेबाबत विरोधी पक्षाकडे वारंवार कायदेशीर विचारणा व पाठपुरावा केला, परंतु त्यांनी कायदेशीर जबाबदारी पार पाडण्यास नकार दिला व टाळाटाळ केली.</div>
            <div><b>३. कायदेशीर उल्लंघन (Statutory Breach):</b> सदर कृत्य हे ${m.template.act_reference || "प्रचलित कायदे व नियमावली"} अन्वये कायद्याचे थेट उल्लंघन आहे.</div>
          </div>

          ${renderReliefBox(m.template.relief)}
          ${renderEnclosuresChecklistHtml()}
          ${renderVerificationHtml()}
          ${renderSignaturesHtml(m.applicant, m.today, m.place)}
          ${renderPublicationFooterHtml(1, 1, m.receiptToUse)}
        `;

        container.appendChild(pageEl);

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      } else {
        // ── 2-PAGE DOCUMENT GENERATION (Exact 2-page pagination, no cut lines) ─
        // Page 1
        const page1El = document.createElement("div");
        page1El.style.width = "794px";
        page1El.style.height = "1123px";
        page1El.style.maxHeight = "1123px";
        page1El.style.boxSizing = "border-box";
        page1El.style.padding = "28px 40px 22px 40px";
        page1El.style.backgroundColor = "#ffffff";
        page1El.style.fontFamily = "'Mukta', 'Noto Serif Devanagari', 'Noto Sans Devanagari', 'Mangal', serif";
        page1El.style.color = "#0f172a";
        page1El.style.position = "relative";
        page1El.style.overflow = "hidden";

        page1El.innerHTML = `
          ${renderPublicationHeaderHtml(m.chapterBadge, m.titleToUse)}
          ${renderEFilingBarHtml(m.receiptToUse, m.today)}
          ${renderSubjectBoxHtml(m.recipientClean, m.template.subject, m.template.act_reference)}
          ${renderPartiesTableHtml(m)}
          ${renderOrangeDeadlineBox(m.deadlineToUse)}

          <div style="font-size: 9.5pt; line-height: 1.5; color: #0f172a; text-align: justify; margin-top: 8px;">
            <div style="font-weight: 700; margin-bottom: 5px; color: #1e3a8a; font-size: 10pt;">महोदय, मी खालीलप्रमाणे सविस्तर वस्तुस्थिती व तक्रार सादर करत आहे:</div>
            <div style="margin-bottom: 6px;"><b>१. प्राथमिक वस्तुस्थिती (Facts of the Case):</b> ${m.factsClean}</div>
            <div style="margin-bottom: 6px;"><b>२. पाठपुरावा व नकार (Follow-up & Refusal):</b> तक्रारदाराने सदर गंभीर घटनेबाबत विरोधी पक्षाकडे वारंवार कायदेशीर विचारणा व पाठपुरावा केला. परंतु विरोधी पक्षाने आपली कायदेशीर जबाबदारी पार पाडण्यास साफ नकार दिला व जाणीवपूर्वक टाळाटाळ केली.</div>
            <div><b>३. कायदेशीर उल्लंघन (Statutory Breach):</b> विरोधी पक्षाचे सदर कृत्य हे ${m.template.act_reference} अन्वये कायद्याचे थेट व गंभीर उल्लंघन असून तक्रारदारास कायदेशीर दाद मिळणे आवश्यक आहे.</div>
          </div>

          <div style="margin-top: 22px; padding: 9px 14px; background: #f8fafc; border: 1.5px dashed #1e3a8a; border-radius: 6px; display: flex; justify-content: space-between; align-items: center; font-size: 9pt; color: #1e3a8a; font-weight: 700;">
            <span>🏛️ फास्टकेस अधिकृत मसुदा</span>
            <span>(सदर अर्जाचा पुढील भाग, संपूर्ण प्रक्रिया तक्ता, मागण्या व स्वाक्षरी पृष्ठ २ वर चालू...) &rarr;</span>
          </div>

          ${renderPublicationFooterHtml(1, 2, m.receiptToUse)}
        `;

        container.appendChild(page1El);

        const canvas1 = await html2canvas(page1El, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData1 = canvas1.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData1, "JPEG", 0, 0, pdfWidth, pdfHeight);

        container.removeChild(page1El);

        // Page 2
        const page2El = document.createElement("div");
        page2El.style.width = "794px";
        page2El.style.height = "1123px";
        page2El.style.maxHeight = "1123px";
        page2El.style.boxSizing = "border-box";
        page2El.style.padding = "28px 40px 22px 40px";
        page2El.style.backgroundColor = "#ffffff";
        page2El.style.fontFamily = "'Mukta', 'Noto Serif Devanagari', 'Noto Sans Devanagari', 'Mangal', serif";
        page2El.style.color = "#0f172a";
        page2El.style.position = "relative";
        page2El.style.overflow = "hidden";

        page2El.innerHTML = `
          <div style="border-bottom: 2px solid #1e3a8a; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5pt; color: #1e3a8a; font-weight: 700;">
            <div>
              <span>🏛️ कोर्ट तक्रार अर्ज (पुढे चालू - पृष्ठ २) &bull; विषय: ${m.template.subject.slice(0, 48)}...</span>
            </div>
            <div style="font-family: monospace; font-size: 8.5pt; color: #475569;">
              पावती: ${m.receiptToUse} &bull; ${m.today}
            </div>
          </div>

          <div style="font-size: 9.5pt; line-height: 1.45; color: #0f172a; text-align: justify; margin-bottom: 10px;">
            ${m.extra ? `
            <div style="margin-bottom: 8px; background: #fdfdfe; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px;">
              <b style="color: #1e3a8a;">४. विशेष हकीकत व पुराव्यांचा तपशील:</b><br/>
              <span style="font-size: 9pt; color: #1e293b;">${m.extra}</span>
            </div>` : ""}

            <div style="margin-bottom: 8px;">
              <b>५. नुकसान व मानसिक त्रास:</b> विरोधी पक्षाच्या बेकायदेशीर व निष्काळजी वागणुकीमुळे तक्रारदाराचे गंभीर आर्थिक नुकसान झाले असून प्रचंड मानसिक व आर्थिक त्रास सहन करावा लागला आहे.
            </div>
          </div>

          ${renderQuickSummaryTableHtml(m.summaryTable)}
          ${renderReliefBox(m.template.relief)}
          ${renderEnclosuresChecklistHtml()}
          ${renderVerificationHtml()}
          ${renderSignaturesHtml(m.applicant, m.today, m.place)}
          ${renderPublicationFooterHtml(2, 2, m.receiptToUse)}
        `;

        container.appendChild(page2El);

        pdf.addPage();
        const canvas2 = await html2canvas(page2El, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData2 = canvas2.toDataURL("image/jpeg", 0.98);
        pdf.addImage(imgData2, "JPEG", 0, 0, pdfWidth, pdfHeight);
      }

      document.body.removeChild(container);

      const fileName = `${m.titleToUse.replace(/[\/\s\\:\*\?"<>\|]+/g, "_")}_Fastcase_Petition.pdf`;
      pdf.save(fileName);
      toast.success(m.isTwoPage ? "अधिकृत २ पानांची कोर्ट PDF डाऊनलोड झाली!" : "अधिकृत १ पानाची कोर्ट PDF डाऊनलोड झाली!");
    } catch (err) {
      console.error("PDF generation error:", err);
      // Fallback
      try {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("FASTCASE OFFICIAL COURT PETITION", 14, 20);
        doc.setFontSize(10);
        doc.text(`Receipt: ${m.receiptToUse} | Fee: Rs 30 (PAID)`, 14, 28);
        doc.text(docText || m.factsClean, 14, 38, { maxWidth: 180 });
        doc.save(`${m.titleToUse.replace(/[\/\s\\:\*\?"<>\|]+/g, "_")}_Fastcase_Petition.pdf`);
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
    problem?: QuickProblem | null,
    overrides?: {
      name?: string;
      phone?: string;
      address?: string;
      opp?: string;
      oppAddress?: string;
      place?: string;
      date?: string;
      time?: string;
      amount?: string;
      bank?: string;
      utr?: string;
      extra?: string;
    } | string,
    posPhone?: string,
    posOpp?: string,
    posPlace?: string,
    posDate?: string
  ) => {
    const prob = problem || activeProblem || QUICK_PROBLEMS[0];
    const opts = typeof overrides === "object" ? overrides : {
      name: typeof overrides === "string" ? overrides : undefined,
      phone: posPhone,
      opp: posOpp,
      place: posPlace,
      date: posDate,
    };

    const applicant = (opts.name ?? applicantName ?? user?.full_name ?? "नागरिक अर्जदार").trim() || "नागरिक अर्जदार";
    const phone = (opts.phone ?? applicantPhone ?? user?.phone ?? "").trim();
    const address = (opts.address ?? applicantAddress ?? incidentPlace ?? "स्थानिक रहिवासी").trim() || "स्थानिक रहिवासी";
    const opp = (opts.opp ?? oppositeParty ?? "संबंधित कार्यालय / संस्था / व्यक्ती").trim() || "संबंधित कार्यालय / संस्था";
    const oppAddress = (opts.oppAddress ?? opponentAddress ?? incidentPlace ?? "").trim();
    const place = (opts.place ?? incidentPlace ?? "स्थानिक परिसर").trim() || "स्थानिक परिसर";
    const date = (opts.date ?? incidentDate ?? new Date().toISOString().split("T")[0]).trim();
    const time = (opts.time ?? incidentTime ?? "").trim();
    const amount = (opts.amount ?? claimAmount ?? "").trim();
    const bank = (opts.bank ?? bankOrOrgName ?? "").trim();
    const utr = (opts.utr ?? accountOrUtr ?? "").trim();
    const extra = (opts.extra ?? extraDetails ?? "").trim();

    const template = prob.draft_template;
    const todayFormatted = new Date().toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN");

    // Replace placeholders in recipient
    let recipient = template.recipient_title
      .replace(/\[बँकेचे नाव\]/g, bank || opp || "संबंधित बँक शाखा")
      .replace(/\[कार्यालयाचे नाव\]/g, opp || "संबंधित कार्यालय")
      .replace(/\[पोलीस ठाण्याचे नाव\]/g, oppAddress || place || "स्थानिक पोलीस ठाणे")
      .replace(/\[जिल्ह्याचे नाव\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[जिल्हा\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[पत्ता\]/g, oppAddress || place || "स्थानिक शाखा");

    // Replace placeholders in body facts
    let facts = template.body_facts
      .replace(/\[आपले नाव\]/g, applicant)
      .replace(/\[मोबाईल\]/g, phone || "नोंदणीकृत मोबाईल")
      .replace(/\[पत्ता\]/g, address)
      .replace(/\[तारीख\]/g, date || todayFormatted)
      .replace(/\[वेळ\]/g, time ? `अंदाजे वेळ ${time}` : "सदर वेळी")
      .replace(/\[ठिकाण\]/g, place)
      .replace(/\[बँकेचे नाव\]/g, bank || opp || "संबंधित बँक शाखा")
      .replace(/\[खाते क्र\.\]/g, utr ? utr : "नोंदणीकृत बँक खाते")
      .replace(/\[रक्कम\]/g, amount ? `रुपये ${amount}/-` : "कापलेली रक्कम")
      .replace(/\[थकीत रक्कम\]/g, amount ? `रुपये ${amount}/-` : "थकीत रक्कम")
      .replace(/\[आयडी\]/g, utr || "बँक स्टेटमेंटनुसार")
      .replace(/\[बिल क्र\.\]/g, utr || "पावतीनुसार")
      .replace(/\[मेसेज\/कॉल\/बनावट लिंक\]/g, extra || "बनावट कॉल / फिशिंग लिंक / OTP द्वारे")
      .replace(/\[कंपनीचे नाव\]/g, opp)
      .replace(/\[विरोधी पक्षाचे नाव\]/g, opp)
      .replace(/\[आरोपीचे नाव\]/g, opp)
      .replace(/\[कार्यालयाचे नाव\]/g, opp)
      .replace(/\[पतीचे नाव\]/g, opp)
      .replace(/\[गुन्ह्याचा तपशील - मारहाण\/धमकी\/चोरी\]/g, extra || "दखलपात्र गुन्हा व कायदेशीर उल्लंघन")
      .replace(/\[घटनेचा तपशील\]/g, extra || "कायदेशीर हक्कांचे उल्लंघन")
      .replace(/\[दोषाचे वर्णन\]/g, extra || "वस्तू / सेवेमधील सदोषपणा")
      .replace(/\[पोलीस ठाण्याचे नाव\]/g, oppAddress || place || "स्थानिक पोलीस ठाणे")
      .replace(/\[जिल्ह्याचे नाव\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[जिल्हा\]/g, place || "स्थानिक जिल्हा")
      .replace(/\[तालुका \/ जिल्हा\]/g, place || "स्थानिक तालुका/जिल्हा")
      .replace(/\[गावाचे नाव\]/g, place || "स्थानिक गाव")
      .replace(/\[सर्व्हे क्र\.\]/g, utr || "मिळकत / सर्व्हे क्र.")
      .replace(/\[विवाह तारीख\]/g, date)
      .replace(/\[वस्तूचे नाव\]/g, extra || "खरेदी केलेली वस्तू / सेवा")
      .replace(/\[हुद्दा\]/g, "कर्मचारी / कामगार")
      .replace(/\[महिना\]/g, "संबंधित कालावधी")
      .replace(/\[मुद्दा १\]/g, extra || "संबंधित कामाची अधिकृत नोंद व कागदपत्रांची प्रमाणित प्रत")
      .replace(/\[मुद्दा २\]/g, "सदर प्रकरणातील सक्षम प्राधिकाऱ्यांचे आदेश व टिप्पणी")
      .replace(/\[कार्यालयाचे नाव \/ काम\]/g, opp || "संबंधित कार्यालयीन कामकाज")
      .replace(/\[कागदपत्राचे नाव व क्रमांक[^\]]*\]/g, extra || utr || "महत्त्वाचे अधिकृत मूळ कागदपत्र");

    // Clean any lingering brackets
    recipient = recipient.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();
    facts = facts.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, " ").trim();

    // Text draft with structured table layout
    const textDraft = `================================================================================
🏛️ फास्टकेस अधिकृत कोर्ट तक्रार / दाद अर्ज (LEGAL PETITION)
पावती क्र.: FC-DOC-${Date.now().toString().slice(-6)} | दिनांक: ${todayFormatted} | मुद्रांक शुल्क: ₹३० (भरणा पूर्ण)
================================================================================

प्रति,
${recipient}

विषय: ${template.subject}
कायदेशीर तरतुदी: ${template.act_reference}

--------------------------------------------------------------------------------
                     पक्षकार व तक्रार तपशील तक्ता (PARTIES TABLE)
--------------------------------------------------------------------------------
[१] तक्रारदार / अर्जदार (Complainant):
    • पूर्ण नाव: ${applicant}
    • मोबाईल क्र.: ${phone || "उपलब्ध नाही"}
    • पूर्ण पत्ता: ${address}
    ${bank ? `• बँक / संस्था: ${bank}\n` : ""}${utr ? `    • खाते / UTR क्र.: ${utr}\n` : ""}
[२] विरोधी पक्ष / प्रतिवादी (Opposite Party):
    • नाव / कंपनी: ${opp}
    • पत्ता / शाखा: ${oppAddress || place}
    • घटनेची तारीख/वेळ: ${date} ${time ? `(${time})` : ""}
    ${amount ? `• दावा / फसवणूक रक्कम: ₹ ${amount}/-\n` : ""}${utr ? `    • संदर्भ / UTR आयडी: ${utr}\n` : ""}--------------------------------------------------------------------------------

महोदय,
मी खालीलप्रमाणे वस्तुस्थिती व कायदेशीर तक्रार सादर करत आहे:

१. प्राथमिक घटनाक्रम:
   ${facts}

२. तक्रारदाराने याबाबत संबंधित व्यक्ती / संस्थेकडे वारंवार पाठपुरावा केला, परंतु त्यांनी कायदेशीर जबाबदारी पार पाडण्यास नकार दिला व टाळाटाळ केली.

३. सदर कृत्य हे ${template.act_reference} अन्वये कायद्याचे थेट उल्लंघन आहे.
${extra ? `\n४. विशेष हकीकत व जास्तीचा तपशील:\n   ${extra}\n` : ""}
मागणी / दाद (Relief & Prayer):
${template.relief}

सोबत जोडलेली कागदपत्रे (Enclosures):
१. तक्रारदाराच्या आधार कार्डची सत्यप्रत.
२. संबंधित व्यवहाराचे बँक पासबुक / स्टेटमेंट / पावती / मेसेज स्क्रीनशॉट.
३. पूर्वी केलेल्या पत्रव्यवहाराची / तक्रारीची प्रत.

सत्यप्रतिज्ञा (Verification):
मी, वरील तक्रारदार सत्यप्रतिज्ञेवर नमूद करतो की, वरील तक्रार अर्जातील सर्व मुद्दे माझ्या व्यक्तिगत माहितीनुसार व उपलब्ध कागदपत्रांनुसार सत्य व बिनचूक आहेत.

दिनांक: ${todayFormatted}
ठिकाण: ${place}

                                            तक्रारदाराची स्वाक्षरी: ________________
                                            नाव: (${applicant})`;

    setGeneratedDoc(textDraft);
    return textDraft;
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

          {/* User Auth Status Button */}
          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 pl-1 sm:pl-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#013B36] border border-[#A7F3D0] text-xs font-bold">
                  <User className="w-3 h-3 text-[#059669]" />
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
                  किंवा खालील प्रमुख कायदेशीर विषयांमधून आपली केस निवडा (महाराष्ट्र नागरिक कायदेविषयक मार्गदर्शिका):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "cyber_fraud", icon: "💳", label: "बँक / UPI फ्रॉड", desc: "पैसे कापले / ऑनलाइन फसवणूक" },
                    { id: "police_refusal", icon: "👮", label: "पोलीस FIR नकार", desc: "तक्रार नोंदवण्यास नकार" },
                    { id: "police_complaint", icon: "📝", label: "पोलीस ठाण्यात तक्रार", desc: "दखलपात्र लेखी तक्रार अर्ज" },
                    { id: "fir_registration", icon: "📋", label: "FIR नोंदणी अधिकार", desc: "BNSS १७३ मोफत FIR प्रत" },
                    { id: "zero_fir", icon: "📍", label: "Zero FIR प्रक्रिया", desc: "कोणत्याही ठाण्यात थेट FIR" },
                    { id: "arrest_rights", icon: "🔒", label: "अटक व नागरिक हक्क", desc: "D.K. Basu मार्गदर्शक तत्त्वे" },
                    { id: "bail_procedure", icon: "🗝️", label: "जामीन (Bail) प्रक्रिया", desc: "BNSS जामीन तरतुदी व हक्क" },
                    { id: "consumer_fraud", icon: "🛒", label: "ग्राहक तक्रार", desc: "खराब वस्तू / वॉरंटी नाकारली" },
                    { id: "property_land", icon: "🏠", label: "जमीन व घर वाद", desc: "अतिक्रमण / जागा हक्क वाद" },
                    { id: "women_safety", icon: "👩", label: "महिला सुरक्षा", desc: "कौटुंबिक छळ व महिला हक्क" },
                    { id: "unpaid_salary", icon: "💼", label: "पगार / नोकरी वाद", desc: "थकीत पगार किंवा नोकरी प्रश्न" },
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
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#013B36] hover:text-black px-3 py-1.5 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition cursor-pointer shadow-2xs"
                  >
                    {isEditingDetails ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>तपशील लपवा</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>✏️ अर्जाचा तपशील तक्ता भरा / बदला (नाव, पत्ता, रक्कम, बँक)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Structured Particulars Form */}
                {isEditingDetails && (
                  <div className="bg-gray-50/95 border border-gray-200 rounded-xl p-4 space-y-3.5 text-xs animate-in fade-in duration-200 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                      <span className="font-extrabold text-[#013B36] flex items-center gap-1.5 text-[12.5px]">
                        <span>📋</span>
                        <span>कोर्ट तक्रार अर्जाचा तपशील तक्ता (Parties & Claim Particulars):</span>
                      </span>
                      <span className="text-[10.5px] font-semibold text-gray-500">
                        खालील माहिती अर्जात आपोआप तक्त्यात भरेल
                      </span>
                    </div>

                    {/* Section 1: तक्रारदार / अर्जदार */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                      <div className="text-[11px] font-black text-[#064e3b] uppercase tracking-wide flex items-center gap-1">
                        <span>१. तक्रारदार / अर्जदाराची माहिती (Complainant):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            पूर्ण नाव <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={applicantName}
                            onChange={(e) => setApplicantName(e.target.value)}
                            placeholder="उदा. रमेश शंकर पाटील"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            मोबाईल क्रमांक
                          </label>
                          <input
                            type="tel"
                            value={applicantPhone}
                            onChange={(e) => setApplicantPhone(e.target.value)}
                            placeholder="उदा. ९८२२००११२२"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            पूर्ण पत्ता
                          </label>
                          <input
                            type="text"
                            value={applicantAddress}
                            onChange={(e) => setApplicantAddress(e.target.value)}
                            placeholder="उदा. फ्लॅट ४०२, गोकुळधाम, पुणे"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            बँकेचे नाव / खाते क्र.
                          </label>
                          <input
                            type="text"
                            value={bankOrOrgName}
                            onChange={(e) => setBankOrOrgName(e.target.value)}
                            placeholder="उदा. SBI बँक / खाते क्र."
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: विरोधी पक्ष */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                      <div className="text-[11px] font-black text-[#064e3b] uppercase tracking-wide flex items-center gap-1">
                        <span>२. विरोधी पक्ष / प्रतिवादीची माहिती (Opposite Party):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            विरोधी पक्ष / कंपनीचे नाव <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={oppositeParty}
                            onChange={(e) => setOppositeParty(e.target.value)}
                            placeholder="उदा. ABC प्रा. लि. / बँक मॅनेजर"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            पत्ता / शाखा / ठिकाण
                          </label>
                          <input
                            type="text"
                            value={opponentAddress}
                            onChange={(e) => setOpponentAddress(e.target.value)}
                            placeholder="उदा. मुख्य शाखा, शिवाजीनगर, पुणे"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            दावा / फसवणूक रक्कम ₹
                          </label>
                          <input
                            type="text"
                            value={claimAmount}
                            onChange={(e) => setClaimAmount(e.target.value)}
                            placeholder="उदा. ५०,०००"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            UTR / खाते / तक्रार क्र.
                          </label>
                          <input
                            type="text"
                            value={accountOrUtr}
                            onChange={(e) => setAccountOrUtr(e.target.value)}
                            placeholder="उदा. UTR9823487123"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: घटना तपशील & जादा माहिती */}
                    <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                      <div className="text-[11px] font-black text-[#064e3b] uppercase tracking-wide flex items-center gap-1">
                        <span>३. घटनेचा दिनांक, ठिकाण व जादा तपशील:</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            घटनेची तारीख
                          </label>
                          <input
                            type="date"
                            value={incidentDate}
                            onChange={(e) => setIncidentDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            अंदाजे वेळ
                          </label>
                          <input
                            type="text"
                            value={incidentTime}
                            onChange={(e) => setIncidentTime(e.target.value)}
                            placeholder="उदा. दुपारी २:३० वाजता"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            घटना ठिकाण व शहर
                          </label>
                          <input
                            type="text"
                            value={incidentPlace}
                            onChange={(e) => setIncidentPlace(e.target.value)}
                            placeholder="उदा. शिवाजीनगर, पुणे"
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          विशेष हकीकत / पुराव्यांचा तपशील (ऐच्छिक - सविस्तर माहितीसाठी)
                        </label>
                        <textarea
                          rows={2}
                          value={extraDetails}
                          onChange={(e) => setExtraDetails(e.target.value)}
                          placeholder="घटनेची जादा माहिती, पुरावे किंवा मागण्या येथे लिहा..."
                          className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36] focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Format Preference & Action */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700 text-[11px]">दस्तऐवज स्वरूप:</span>
                        <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-white">
                          <button
                            type="button"
                            onClick={() => setPageFormatPreference("auto")}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer",
                              pageFormatPreference === "auto" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                            )}
                          >
                            ⚙️ आपोआप
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageFormatPreference("1page")}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer",
                              pageFormatPreference === "1page" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                            )}
                          >
                            📄 १ पान
                          </button>
                          <button
                            type="button"
                            onClick={() => setPageFormatPreference("2page")}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer",
                              pageFormatPreference === "2page" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                            )}
                          >
                            📑 २ पाने
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeProblem) {
                            generateDraftForProblem(activeProblem);
                            toast.success("अर्जाचा तपशील व तक्ता अपडेट झाला!");
                          }
                        }}
                        className="px-5 py-2 bg-[#013B36] text-white font-black text-xs rounded-lg hover:bg-[#024E47] transition cursor-pointer shadow-md shadow-[#013B36]/20 flex items-center gap-1.5"
                      >
                        <span>✓</span>
                        <span>अर्ज व तपशील तक्ता अपडेट करा</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Court Application Interactive Preview */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                  {/* Top Preview Bar with Mode Toggle */}
                  <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#013B36] flex items-center gap-1">
                        <span>🏛️</span>
                        <span>अधिकृत तक्रार अर्ज पूर्वावलोकन</span>
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#064e3b] border border-[#A7F3D0]">
                        {pageFormatPreference === "2page" || (pageFormatPreference === "auto" && extraDetails.trim().length > 120)
                          ? "📑 २ पाने कोर्ट मसुदा"
                          : "📄 १ पान कोर्ट मसुदा"}
                      </span>
                    </div>

                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-white text-[11px]">
                      <button
                        type="button"
                        onClick={() => setDocPreviewTab("court")}
                        className={cn(
                          "px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer",
                          docPreviewTab === "court" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                        )}
                      >
                        🏛️ कोर्ट लेआउट
                      </button>
                      <button
                        type="button"
                        onClick={() => setDocPreviewTab("text")}
                        className={cn(
                          "px-2.5 py-0.5 rounded-md font-bold transition cursor-pointer",
                          docPreviewTab === "text" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                        )}
                      >
                        📝 मजकूर प्रत
                      </button>
                    </div>
                  </div>

                  {/* Body Preview */}
                  {docPreviewTab === "court" ? (
                    <div className="p-4 sm:p-5 max-h-96 overflow-y-auto space-y-3 bg-[#fafcfb] text-gray-800 text-xs">
                      {/* Running Top Header */}
                      <div className="border-b border-gray-300 pb-1 flex justify-between items-center text-[10px] text-gray-500">
                        <div>
                          <span className="font-extrabold text-[#1e3a8a]">{activeProblem?.chapter_badge || "प्रकरण १ • विधी मसुदा"}</span>
                          <span className="mx-1">•</span>
                          <span className="font-bold text-gray-800">{activeProblem?.title_mr}</span>
                        </div>
                        <div className="font-medium text-gray-500 hidden sm:block">
                          महाराष्ट्र नागरिक कायदेविषयक मार्गदर्शिका • फास्टकेस विधी कक्ष
                        </div>
                      </div>

                      {/* Chapter Title Navy Card Banner */}
                      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#0f2e6b] p-3 rounded-lg flex justify-between items-center text-white shadow-xs">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-yellow-300/20 text-yellow-200 border border-yellow-300/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              {activeProblem?.chapter_badge || "प्रकरण १"}
                            </span>
                            <span className="text-[10px] font-bold text-blue-200">
                              अधिकृत कोर्ट व पोलीस तक्रार मसुदा
                            </span>
                          </div>
                          <div className="text-sm sm:text-base font-extrabold text-white mt-1">
                            {activeProblem?.title_mr || "कोर्ट-मान्य अधिकृत तक्रार / दाद अर्ज"}
                          </div>
                          <div className="text-[9.5px] text-blue-200 mt-0.5">
                            (भारतीय नागरिक सुरक्षा संहिता २०२३ • भारतीय न्याय संहिता २०२३ • भारतीय साक्ष अधिनियम २०२३)
                          </div>
                        </div>
                        <div className="text-2xl shrink-0 pl-2">🏛️</div>
                      </div>

                      {/* e-Filing Verification Bar */}
                      <div className="bg-emerald-50 border border-emerald-300 rounded-md p-2 flex flex-wrap justify-between items-center text-[10px] text-emerald-900 font-medium">
                        <div className="font-mono font-bold text-emerald-950">
                          🔖 ई-फायलिंग नोंदणी: <b>{receiptId || "FC-DOC-380622"}</b>
                        </div>
                        <div className="font-bold text-emerald-800">
                          ✓ मुद्रांक शुल्क: ₹३० (भरणा पूर्ण • अधिकृत प्रत)
                        </div>
                        <div className="text-gray-600">
                          📅 दिनांक: {new Date().toLocaleDateString("mr-IN")}
                        </div>
                      </div>

                      {/* Recipient & Subject Box */}
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200 border-l-4 border-l-[#1e3a8a] space-y-1">
                        <div><b>प्रति:</b> {activeProblem?.draft_template.recipient_title.replace(/\[.*?\]/g, bankOrOrgName || oppositeParty || "संबंधित कार्यालय")}</div>
                        <div><b>विषय:</b> {activeProblem?.draft_template.subject}</div>
                        {activeProblem?.draft_template.act_reference && (
                          <div className="text-[11px] text-[#1e3a8a] font-semibold">
                            <b>कायदेशीर संदर्भ:</b> {activeProblem.draft_template.act_reference}
                          </div>
                        )}
                      </div>

                      {/* Structured Parties Table */}
                      <div className="rounded-lg border border-[#1e3a8a] overflow-hidden bg-white">
                        <div className="bg-[#1e3a8a] text-white font-bold text-[11px] px-3 py-1 flex justify-between">
                          <span>📋 पक्षकार व तक्रार तपशील तक्ता (Parties Particulars Table)</span>
                          <span className="text-[10px] opacity-80">अधिकृत कोर्ट नोंद</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-200 p-2.5 text-[11.5px] leading-relaxed">
                          <div className="space-y-1 pr-2">
                            <div className="font-bold text-[#1e3a8a] border-b border-gray-100 pb-0.5">[१] तक्रारदार / अर्जदार (Complainant)</div>
                            <div><b>नाव:</b> {applicantName || user?.full_name || "नागरिक अर्जदार"}</div>
                            <div><b>मोबाईल:</b> {applicantPhone || user?.phone || "उपलब्ध नाही"}</div>
                            <div><b>पत्ता:</b> {applicantAddress || incidentPlace || "स्थानिक रहिवासी"}</div>
                            {bankOrOrgName && <div><b>बँक/संस्था:</b> {bankOrOrgName}</div>}
                            {accountOrUtr && <div><b>खाते क्र.:</b> {accountOrUtr}</div>}
                          </div>
                          <div className="space-y-1 sm:pl-2 pt-2 sm:pt-0">
                            <div className="font-bold text-[#1e3a8a] border-b border-gray-100 pb-0.5">[२] विरोधी पक्ष / प्रतिवादी (Opposite Party)</div>
                            <div><b>नाव:</b> {oppositeParty || "संबंधित कार्यालय / व्यक्ती"}</div>
                            <div><b>पत्ता/शाखा:</b> {opponentAddress || incidentPlace || "स्थानिक शाखा"}</div>
                            <div><b>तारीख/वेळ:</b> {incidentDate} {incidentTime && `(${incidentTime})`}</div>
                            {claimAmount && <div><b>दावा रक्कम:</b> <span className="text-red-600 font-bold">₹{claimAmount}/-</span></div>}
                            {accountOrUtr && <div><b>UTR/खाते क्र.:</b> <span className="font-mono font-semibold">{accountOrUtr}</span></div>}
                          </div>
                        </div>
                      </div>

                      {/* Orange Deadline Callout Box */}
                      {activeProblem?.statutory_deadline_mr && (
                        <div className="bg-orange-50 border-l-4 border-l-orange-500 border border-orange-200 rounded-r-md p-2 text-[10.5px] text-orange-900">
                          <b>⏱ वेळ किती महत्त्वाची? (कायदेशीर मुदत मर्यादा):</b> {activeProblem.statutory_deadline_mr}
                        </div>
                      )}

                      {/* Quick Summary Table if available */}
                      {activeProblem?.quick_summary_table && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white text-[10.5px]">
                          <div className="bg-[#1e3a8a] text-white font-bold px-2.5 py-1 text-[10.5px]">
                            📊 एका दृष्टिक्षेपात संपूर्ण प्रक्रिया (Quick Action Protocol)
                          </div>
                          <div className="divide-y divide-gray-100">
                            <div className="flex px-2 py-1 bg-gray-50/70"><span className="w-28 font-bold text-[#1e3a8a] shrink-0">➜ समस्या:</span><span>{activeProblem.quick_summary_table.problem}</span></div>
                            <div className="flex px-2 py-1"><span className="w-28 font-bold text-[#1e3a8a] shrink-0">➜ पहिली कृती:</span><span>{activeProblem.quick_summary_table.first_action}</span></div>
                            <div className="flex px-2 py-1 bg-gray-50/70"><span className="w-28 font-bold text-[#1e3a8a] shrink-0">➜ सक्षम कार्यालय:</span><span>{activeProblem.quick_summary_table.competent_authority}</span></div>
                            <div className="flex px-2 py-1"><span className="w-28 font-bold text-[#1e3a8a] shrink-0">➜ आवश्यक कागदपत्रे:</span><span>{activeProblem.quick_summary_table.docs}</span></div>
                            <div className="flex px-2 py-1 bg-gray-50/70"><span className="w-28 font-bold text-[#1e3a8a] shrink-0">➜ कायदेशीर मुदत:</span><span>{activeProblem.quick_summary_table.statutory_time}</span></div>
                            <div className="flex px-2 py-1"><span className="w-28 font-bold text-[#1e3a8a] shrink-0">➜ तक्रार न घेतल्यास:</span><span>{activeProblem.quick_summary_table.if_refused}</span></div>
                          </div>
                        </div>
                      )}

                      {/* Facts & Relief preview */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2 text-[11.5px] leading-relaxed text-gray-800">
                        <div className="font-bold text-[#1e3a8a]">तक्रार वस्तुस्थिती व मागण्या:</div>
                        <p className="line-clamp-3 text-gray-700">
                          {activeProblem?.draft_template.body_facts.replace(/\[.*?\]/g, "")}
                        </p>
                        <div className="bg-emerald-50 border-l-4 border-emerald-600 p-2 text-[11px] text-emerald-900 font-medium rounded-r">
                          <b>मागणी / दाद:</b> {activeProblem?.draft_template.relief}
                        </div>
                        <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between items-center text-[10px] text-gray-500">
                          <span>सत्यप्रतिज्ञा (Statutory Verification under BNSS) जोडली आहे</span>
                          <span>तक्रारदाराची अधिकृत स्वाक्षरी ब्लॉक</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50/90 font-mono text-[11.5px] leading-relaxed text-gray-800 whitespace-pre-wrap max-h-80 overflow-y-auto select-all">
                      {generatedDoc || "अर्ज तयार होत आहे..."}
                    </div>
                  )}
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

              <div className="space-y-3.5">
                {/* Section 1: तक्रारदार / अर्जदार */}
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="text-[11px] font-black text-[#064e3b] uppercase tracking-wide flex items-center gap-1">
                    <span>१. तक्रारदार / अर्जदाराची माहिती (Complainant):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        पूर्ण नाव <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicantName}
                        onChange={(e) => setApplicantName(e.target.value)}
                        placeholder="उदा. रमेश शंकर पाटील"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        मोबाईल क्रमांक
                      </label>
                      <input
                        type="tel"
                        value={applicantPhone}
                        onChange={(e) => setApplicantPhone(e.target.value)}
                        placeholder="उदा. ९८२२००११२२"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        पूर्ण पत्ता
                      </label>
                      <input
                        type="text"
                        value={applicantAddress}
                        onChange={(e) => setApplicantAddress(e.target.value)}
                        placeholder="उदा. फ्लॅट ४०२, गोकुळधाम, पुणे"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        बँकेचे नाव / खाते क्र.
                      </label>
                      <input
                        type="text"
                        value={bankOrOrgName}
                        onChange={(e) => setBankOrOrgName(e.target.value)}
                        placeholder="उदा. SBI बँक / खाते क्र."
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: विरोधी पक्ष */}
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="text-[11px] font-black text-[#064e3b] uppercase tracking-wide flex items-center gap-1">
                    <span>२. विरोधी पक्ष / प्रतिवादीची माहिती (Opposite Party):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        विरोधी पक्ष / कंपनीचे नाव <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={oppositeParty}
                        onChange={(e) => setOppositeParty(e.target.value)}
                        placeholder="उदा. ABC प्रा. लि. / बँक मॅनेजर"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        पत्ता / शाखा / ठिकाण
                      </label>
                      <input
                        type="text"
                        value={opponentAddress}
                        onChange={(e) => setOpponentAddress(e.target.value)}
                        placeholder="उदा. मुख्य शाखा, शिवाजीनगर, पुणे"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        दावा / फसवणूक रक्कम ₹
                      </label>
                      <input
                        type="text"
                        value={claimAmount}
                        onChange={(e) => setClaimAmount(e.target.value)}
                        placeholder="उदा. ५०,०००"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        UTR / खाते / तक्रार क्र.
                      </label>
                      <input
                        type="text"
                        value={accountOrUtr}
                        onChange={(e) => setAccountOrUtr(e.target.value)}
                        placeholder="उदा. UTR9823487123"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: घटना तपशील & जादा माहिती */}
                <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-200 space-y-2">
                  <div className="text-[11px] font-black text-[#064e3b] uppercase tracking-wide flex items-center gap-1">
                    <span>३. घटनेचा दिनांक, ठिकाण व जादा तपशील:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        घटनेची तारीख
                      </label>
                      <input
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        अंदाजे वेळ
                      </label>
                      <input
                        type="text"
                        value={incidentTime}
                        onChange={(e) => setIncidentTime(e.target.value)}
                        placeholder="उदा. दुपारी २:३० वाजता"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        घटना ठिकाण व शहर
                      </label>
                      <input
                        type="text"
                        value={incidentPlace}
                        onChange={(e) => setIncidentPlace(e.target.value)}
                        placeholder="उदा. शिवाजीनगर, पुणे"
                        className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      विशेष हकीकत / पुराव्यांचा तपशील (ऐच्छिक)
                    </label>
                    <textarea
                      rows={2}
                      value={extraDetails}
                      onChange={(e) => setExtraDetails(e.target.value)}
                      placeholder="घटनेची जादा माहिती किंवा महत्त्वाचे मुद्दे येथे प्रविष्ट करा..."
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-medium text-xs focus:outline-none focus:border-[#013B36]"
                    />
                  </div>
                </div>

                {/* Format Preference & Action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 text-[11px]">दस्तऐवज स्वरूप:</span>
                    <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-white">
                      <button
                        type="button"
                        onClick={() => setPageFormatPreference("auto")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer",
                          pageFormatPreference === "auto" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                        )}
                      >
                        ⚙️ आपोआप
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageFormatPreference("1page")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer",
                          pageFormatPreference === "1page" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                        )}
                      >
                        📄 १ पान
                      </button>
                      <button
                        type="button"
                        onClick={() => setPageFormatPreference("2page")}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer",
                          pageFormatPreference === "2page" ? "bg-[#013B36] text-white" : "text-gray-600 hover:text-black"
                        )}
                      >
                        📑 २ पाने
                      </button>
                    </div>
                  </div>

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
            </div>

            {/* Generated Document Preview Card */}
            {generatedDoc && (
              <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-black text-gray-900">अधिकृत तक्रार अर्ज पूर्वावलोकन (Preview)</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#064e3b] border border-[#A7F3D0]">
                      {pageFormatPreference === "2page" || (pageFormatPreference === "auto" && extraDetails.trim().length > 120)
                        ? "📑 २ पाने कोर्ट मसुदा"
                        : "📄 १ पान कोर्ट मसुदा"}
                    </span>
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
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi%3A%2F%2Fpay%3Fpa%3D7218834640%40ybl%26pn%3DFastcase%2520ERP%26am%3D30%26cu%3DINR%26tn%3DCourt%2520Petition%2520Draft"
                    alt="UPI QR Code"
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                </div>
                <p className="text-xs font-bold text-gray-700">
                  कोणत्याही UPI अ‍ॅपद्वारे (PhonePe, GPay, Paytm) स्कॅन करून ₹३० पाठवा
                </p>
                <div className="flex items-center justify-center gap-2 text-xs font-mono bg-gray-50 border border-gray-200 py-1.5 px-3 rounded-lg max-w-xs mx-auto">
                  <span className="text-gray-600">UPI ID:</span>
                  <span className="font-bold text-[#013B36]">7218834640@ybl</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText("7218834640@ybl");
                      toast.success("UPI ID कॉपी केला!");
                    }}
                    className="text-[#059669] hover:text-[#013B36] font-bold ml-1 cursor-pointer"
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
                    href="phonepe://pay?pa=7218834640@ybl&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-[#ECFDF5] flex items-center gap-2 font-bold transition"
                  >
                    <span className="text-base">🟣</span>
                    <span>PhonePe</span>
                  </a>
                  <a
                    href="upi://pay?pa=7218834640@ybl&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-[#ECFDF5] flex items-center gap-2 font-bold transition"
                  >
                    <span className="text-base">🟢</span>
                    <span>Google Pay</span>
                  </a>
                  <a
                    href="paytmmp://pay?pa=7218834640@ybl&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#059669] hover:bg-[#ECFDF5] flex items-center gap-2 font-bold transition"
                  >
                    <span className="text-base">🔵</span>
                    <span>Paytm</span>
                  </a>
                  <a
                    href="upi://pay?pa=7218834640@ybl&pn=Fastcase%20ERP&am=30&cu=INR&tn=Court%20Petition%20Draft"
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
