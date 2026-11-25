"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  UploadCloud,
  FileText,
  Languages,
  ChevronDown,
  CheckCircle2,
  Loader2,
  Wand2,
  Download,
  Save,
  FileCheck,
  Scale,
  Sparkles,
  Settings,
  AlertCircle,
  Copy,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { api, getErrorMessage } from "@/lib/api";
import { generateDocx } from "@/lib/exportDocx";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/authStore";
import { useMyLetterhead, type Letterhead } from "@/lib/hooks/useLetterhead";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";
import {
  useTemplates,
  useAutoFill,
  useCreateDraft,
  useUpdateDraft,
  type Draft,
} from "@/lib/hooks/useDrafts";
import {
  useNotice,
  useNotices,
  useCreateNotice,
  useUpdateNotice,
  useUploadNoticeFile,
} from "@/lib/hooks/useNotices";
import LetterheadPreview from "@/components/drafts/LetterheadPreview";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import Modal from "@/components/ui/Modal";

type BuiltinStyle = "denial" | "pointwise" | "settlement";

type StrategyResult = {
  summary?: string;
  rebuttal_points?: string[];
  recommended_actions?: string[];
};

const BUILTIN_STYLES: Array<{
  id: BuiltinStyle;
  name: string;
  description: string;
}> = [
  {
    id: "denial",
    name: "Liability Denial & Rebuttal Reply",
    description: "Comprehensive denial of liability with formal counter-notice",
  },
  {
    id: "pointwise",
    name: "Point-by-Point Legal Reply",
    description: "Structured para-wise traverse & rebuttal of notice claims",
  },
  {
    id: "settlement",
    name: "Without-Prejudice Settlement Offer",
    description: "Reserves legal rights while proposing amicable resolution",
  },
];

const LANGUAGE_OPTIONS = [
  { code: "en", label: "English" },
  { code: "mr", label: "Marathi (मराठी)" },
  { code: "hi", label: "Hindi (हिंदी)" },
  { code: "gu", label: "Gujarati (ગુજરાતી)" },
];

function buildSignatureBlock(
  letterhead: Letterhead | null | undefined,
  userFullName?: string | null,
  firmName?: string | null,
  lang: string = "en"
): string {
  const advName =
    letterhead?.advocate_name?.trim() || userFullName?.trim() || "Advocate";
  const orgName = letterhead?.firm_name?.trim() || firmName?.trim() || "";
  const address = letterhead?.office_address?.trim() || "";
  const phone = letterhead?.mobile_number?.trim() || "";
  const lines = [advName];
  if (orgName) lines.push(orgName);
  if (address) lines.push(address);
  if (phone) lines.push(lang === "en" ? `Mob: ${phone}` : phone);
  return lines.join("\n");
}

function buildDynamicReplyText(params: {
  style: BuiltinStyle;
  language: string;
  opponentName: string;
  opponentAdvocate: string;
  opponentAddress: string;
  noticeDate: string;
  noticeType: string;
  subject: string;
  clientName: string;
  noticeSummary: string;
  defences: string[];
  signatureBlock: string;
}): string {
  const oppAdv = params.opponentAdvocate.trim();
  const addresseeLine = oppAdv
    ? oppAdv.toLowerCase().startsWith("adv")
      ? oppAdv
      : `Adv. ${oppAdv}`
    : params.opponentName.trim() || "[Opponent / Counsel Name]";
  const addressBlock =
    params.opponentAddress.trim() || "[Opponent / Counsel Postal Address]";
  const dateText = params.noticeDate
    ? formatDate(params.noticeDate)
    : "[Notice Date]";
  const client = params.clientName.trim() || "[Client Name]";
  const oppParty = params.opponentName.trim() || "[Opponent Name]";
  const subjectText =
    params.subject.trim() || `${params.noticeType} dated ${dateText}`;
  const defencesList =
    params.defences.length > 0
      ? params.defences
      : [
          params.language === "mr"
            ? "माझ्या अशिलावर कोणतेही कायदेशीररीत्या लागू होणारे देणे किंवा दायित्व नाही."
            : params.language === "hi"
            ? "मेरे मुवक्किल पर कोई भी कानूनी रूप से लागू करने योग्य बकाया या दायित्व नहीं है।"
            : params.language === "gu"
            ? "મારા અસીલ પર કોઈપણ કાયદેસર રીતે વસૂલવા પાત્ર દેવું કે જવાબદારી નથી."
            : "My client denies any legally enforceable debt, breach, or liability as alleged in your notice.",
        ];

  if (params.language === "mr") {
    const paraList = defencesList
      .map((pt, idx) => `${idx + 2}. ${pt}`)
      .join("\n\n");
    const closingPara =
      params.style === "settlement"
        ? `${defencesList.length + 2}. माझ्या अशिलाच्या सर्व कायदेशीर हक्कांना बाधा न आणता (Without Prejudice), जर आपल्या अशिलाची सलोख्याने चर्चा करण्याची तयारी असेल तर पत्र मिळाल्यापासून ७ दिवसांत लेखी कळवावे.`
        : `${defencesList.length + 2}. आपण आपल्या अशिलाला सदर कायदेशीर नोटीस ७ दिवसांच्या आत मागे घेण्याचा सल्ला द्यावा; अन्यथा माझे अशील सक्षम न्यायालयात योग्य ती दिवाणी व फौजदारी कारवाई करण्यास व खर्चाची मागणी करण्यास बांधील राहतील.`;

    return `नोंदणीकृत ए.डी. / स्पीड पोस्ट / ई-मेल

प्रति,
${addresseeLine}${oppAdv && oppParty ? ` (तर्फे: ${oppParty})` : ""}
${addressBlock}

विषय: ${subjectText} — आपल्या अशिलाच्या वतीने पाठवलेल्या दिनांक ${dateText} च्या नोटीसला उत्तर.

महोदय/महोदया,

माझे अशील ${client} (यापुढे "माझे अशील" असा उल्लेख) यांच्या सूचनेनुसार आणि त्यांच्या वतीने मी आपल्या दिनांक ${dateText} च्या कायदेशीर नोटीसला खालीलप्रमाणे उत्तर देत आहे:

1. आपल्या नोटीसमधील सर्व आरोप व मजकूर, जो स्पष्टपणे रेकॉर्डवर आधारित व मान्य आहे तो वगळता, पूर्णपणे खोटा, निराधार आणि दिशाभूल करणारा असून माझ्या अशिलास अमान्य आहे.

${paraList}

${closingPara}

सदर उत्तराची एक प्रत माझ्या कार्यालयात भविष्यातील संदर्भासाठी जतन करून ठेवण्यात आली आहे.

आपला विश्वासू,

${params.signatureBlock}`;
  }

  if (params.language === "hi") {
    const paraList = defencesList
      .map((pt, idx) => `${idx + 2}. ${pt}`)
      .join("\n\n");
    const closingPara =
      params.style === "settlement"
        ? `${defencesList.length + 2}. मेरे मुवक्किल के किसी भी कानूनी अधिकार पर प्रतिकूल प्रभाव डाले बिना (Without Prejudice), यदि आपका मुवक्किल सौहार्दपूर्ण समाधान हेतु इच्छुक है तो इस उत्तर की प्राप्ति के 7 दिनों के भीतर संपर्क करें।`
        : `${defencesList.length + 2}. आपको परामर्श दिया जाता है कि अपने मुवक्किल को यह निराधार नोटिस 7 दिनों के भीतर वापस लेने की सलाह दें, अन्यथा मेरे मुवक्किल सक्षम न्यायालय में उचित सिविल एवं आपराधिक कार्यवाही करने हेतु बाध्य होंगे।`;

    return `पंजीकृत ए.डी. / स्पीड पोस्ट / ई-मेल

प्रति,
${addresseeLine}${oppAdv && oppParty ? ` (मार्फत: ${oppParty})` : ""}
${addressBlock}

विषय: ${subjectText} — आपके मुवक्किल की ओर से दिनांक ${dateText} के कानूनी नोटिस का उत्तर।

महोदय/महोदया,

मेरे मुवक्किल ${client} (जिन्हें आगे "मेरे मुवक्किल" कहा जाएगा) के निर्देशानुसार एवं उनकी ओर से, मैं आपके दिनांक ${dateText} के कानूनी नोटिस का निम्नलिखित उत्तर प्रस्तुत करता हूँ:

1. आपके नोटिस के समस्त आरोप एवं कथन, सिवाय उन तथ्यों के जो अभिलेख से प्रमाणित एवं स्पष्ट रूप से स्वीकृत हैं, पूर्णतः असत्य, आधारहीन और अस्वीकार किए जाते हैं।

${paraList}

${closingPara}

भविष्य के संदर्भ हेतु इस उत्तर की एक प्रति मेरे कार्यालय में सुरक्षित रखी गई है।

भवदीय,

${params.signatureBlock}`;
  }

  if (params.language === "gu") {
    const paraList = defencesList
      .map((pt, idx) => `${idx + 2}. ${pt}`)
      .join("\n\n");
    const closingPara =
      params.style === "settlement"
        ? `${defencesList.length + 2}. મારા અસીલના કાયદેસરના અધિકારોને કોઈપણ બાધા વિના (Without Prejudice), જો આપના અસીલ પરસ્પર સમજૂતી માટે તૈયાર હોય તો આ જવાબ મળ્યાના ૭ દિવસમાં જાણ કરવા વિનંતી છે.`
        : `${defencesList.length + 2}. આપને જણાવવામાં આવે છે કે આપના અસીલને સદર નોટિસ ૭ દિવસમાં પાછી ખેંચી લેવા સલાહ આપો, અન્યથા મારા અસીલ સક્ષમ અદાલતમાં યોગ્ય દીવાની તથા ફોજદારી કાર્યવાહી કરવા ફરજ પડશે.`;

    return `રજિસ્ટર્ડ એ.ડી. / સ્પીડ પોસ્ટ / ઈ-મેલ

પ્રતિ,
${addresseeLine}${oppAdv && oppParty ? ` (વતી: ${oppParty})` : ""}
${addressBlock}

વિષય: ${subjectText} — આપના અસીલ વતી તારીખ ${dateText} ની કાનૂની નોટિસનો જવાબ.

મહોદય/મહોદયા,

મારા અસીલ ${client} (જેઓ હવે પછી "મારા અસીલ" તરીકે ઓળખાશે) ની સૂચના મુજબ અને તેમના વતી, હું આપની તારીખ ${dateText} ની કાનૂની નોટિસનો નીચે મુજબ જવાબ આપું છું:

1. આપની નોટિસમાં જણાવેલા તમામ આક્ષેપો અને વિગતો, રેકર્ડની સ્પષ્ટ બાબતો સિવાય, સંપૂર્ણપણે ખોટા, પાયાવિહોણા અને નકારવામાં આવે છે.

${paraList}

${closingPara}

આ જવાબની એક નકલ ભવિષ્યના સંદર્ભ માટે મારી ઓફિસમાં રાખવામાં આવી છે.

આપનો વિશ્વાસુ,

${params.signatureBlock}`;
  }

  // English
  const paraList = defencesList
    .map((pt, idx) => `${idx + 2}. ${pt}`)
    .join("\n\n");

  const introNote =
    params.style === "settlement"
      ? "WITHOUT PREJUDICE\nREGD. A.D. / SPEED POST / EMAIL"
      : "REGD. A.D. / SPEED POST / EMAIL";

  const closingPara =
    params.style === "settlement"
      ? `${defencesList.length + 2}. Without prejudice to all rights, contentions, and remedies available to My Client under law, and strictly in the interest of avoiding unnecessary litigation, My Client is open to an amicable dialogue. Should your client wish to discuss a mutually acceptable closure, you may reach the undersigned within 7 days of receipt of this reply.`
      : `${defencesList.length + 2}. You are hereby called upon to advise your client (${oppParty}) to unconditionally withdraw the said notice within 7 days of receipt of this reply, failing which My Client shall be constrained to defend any proceedings at your client's sole risk as to costs and initiate appropriate civil and criminal proceedings before the competent forum.`;

  return `${introNote}

To,
${addresseeLine}${oppAdv && oppParty ? `\nOn behalf of: ${oppParty}` : ""}
${addressBlock}

Ref: Reply to ${subjectText} (dated ${dateText})

Sir/Madam,

Under instructions from and on behalf of my client, ${client} (hereinafter referred to as "My Client"), I hereby reply to your legal notice dated ${dateText} as under:

1. At the outset, save and except matters that are strictly verified by undisputed written record, every allegation, claim, and insinuation contained in your notice under reply is false, misconceived, and denied in toto. Nothing contained in the notice may be deemed to be admitted for want of specific traverse.

${paraList}

${closingPara}

A signed copy of this reply is retained in my office record for future reference.

Yours faithfully,

${params.signatureBlock}`;
}

function NoticeReplyBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialNoticeId = searchParams.get("noticeId") || "";

  const authUser = useAuthStore((s) => s.user);
  const { data: myLetterhead } = useMyLetterhead();
  const { data: clientsData } = useClients({ limit: 100 });
  const { data: casesData } = useCases({ limit: 100 });
  const { data: noticesListData } = useNotices();
  const { data: templatesData } = useTemplates();

  const [activeNoticeId, setActiveNoticeId] = useState(initialNoticeId);
  const { data: activeNotice } = useNotice(activeNoticeId || undefined);

  const { data: aiStatus } = useQuery({
    queryKey: ["ai", "status"],
    queryFn: async () => {
      const { data } = await api.get("/ai/status");
      return data as { configured: boolean; model?: string; provider?: string };
    },
  });

  const uploadNoticeFile = useUploadNoticeFile();
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();
  const createDraft = useCreateDraft();
  const updateDraft = useUpdateDraft();
  const autoFill = useAutoFill();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Notice metadata / source form
  const [subject, setSubject] = useState("");
  const [noticeType, setNoticeType] = useState("General Legal Notice");
  const [opponentName, setOpponentName] = useState("");
  const [opponentAdvocate, setOpponentAdvocate] = useState("");
  const [opponentAddress, setOpponentAddress] = useState("");
  const [noticeDate, setNoticeDate] = useState("");
  const [noticeText, setNoticeText] = useState("");
  const [uploadedDocId, setUploadedDocId] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  // Context selection
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

  // Generation & Editor
  const [selectedStyle, setSelectedStyle] = useState<string>("denial");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [keyDefencesText, setKeyDefencesText] = useState("");
  const [replyTitle, setReplyTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [savedDraftId, setSavedDraftId] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState(false);
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Modals
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const clients = clientsData?.clients ?? [];
  const allCases = casesData?.cases ?? [];
  const trackedNotices = noticesListData?.notices ?? [];

  const replyTemplates = useMemo(() => {
    const all = templatesData?.templates ?? [];
    const matching = all.filter(
      (t) => t.category === "reply" || t.category === "notice"
    );
    return matching.length > 0 ? matching : all.slice(0, 6);
  }, [templatesData]);

  const filteredCases = useMemo(() => {
    if (!selectedClientId) return allCases;
    return allCases.filter((c) => c.client_id === selectedClientId);
  }, [allCases, selectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || null,
    [clients, selectedClientId]
  );

  const selectedCase = useMemo(
    () => allCases.find((c) => c.id === selectedCaseId) || null,
    [allCases, selectedCaseId]
  );

  // Sync URL noticeId param
  useEffect(() => {
    if (initialNoticeId && initialNoticeId !== activeNoticeId) {
      setActiveNoticeId(initialNoticeId);
    }
  }, [initialNoticeId, activeNoticeId]);

  // Populate state when an existing notice is loaded
  useEffect(() => {
    if (!activeNotice) return;
    setSubject(activeNotice.subject || "");
    setNoticeType(activeNotice.notice_type || "General Legal Notice");
    setOpponentName(activeNotice.opponent_name || "");
    setOpponentAdvocate(activeNotice.opponent_advocate || "");
    setOpponentAddress(activeNotice.opponent_address || "");
    setNoticeDate(activeNotice.notice_date || "");
    setNoticeText(activeNotice.document_ocr_text || activeNotice.summary || "");
    setUploadedDocId(activeNotice.document_id || "");
    setUploadedFileName(activeNotice.document_name || "");
    setSelectedClientId(activeNotice.client_id || "");
    setSelectedCaseId(activeNotice.case_id || "");
    if (
      activeNotice.language &&
      LANGUAGE_OPTIONS.some((l) => l.code === activeNotice.language)
    ) {
      setSelectedLanguage(activeNotice.language);
    }
    setReplyTitle(
      activeNotice.reply_draft_title ||
        `Reply to ${activeNotice.subject || "Legal Notice"}`
    );
    if (activeNotice.reply_draft_id && activeNotice.reply_draft_content) {
      setSavedDraftId(activeNotice.reply_draft_id);
      setDraftContent(activeNotice.reply_draft_content);
    }
  }, [activeNotice]);

  const signatureBlock = useMemo(
    () =>
      buildSignatureBlock(
        myLetterhead,
        authUser?.full_name,
        authUser?.firm_name,
        selectedLanguage
      ),
    [myLetterhead, authUser, selectedLanguage]
  );

  const parsedDefences = useMemo(
    () =>
      keyDefencesText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    [keyDefencesText]
  );

  const handleRealFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadNoticeFile.mutateAsync({
        file,
        client_id: selectedClientId || undefined,
        case_id: selectedCaseId || undefined,
        notice_id: activeNoticeId || undefined,
      });
      setUploadedDocId(res.document_id);
      setUploadedFileName(res.filename);
      if (res.extracted_text) {
        setNoticeText(res.extracted_text);
      }
      if (!subject) {
        setSubject(
          `${res.detected.notice_type || "Legal Notice"} — ${res.filename.replace(/\.[^.]+$/, "")}`
        );
      }
      if (res.detected.notice_type) {
        setNoticeType(res.detected.notice_type);
      }
      if (
        res.detected.language &&
        LANGUAGE_OPTIONS.some((l) => l.code === res.detected.language)
      ) {
        setSelectedLanguage(res.detected.language);
      }
      toast.success(
        res.ocr_processed
          ? "Notice uploaded and text extracted"
          : "Notice file uploaded (add summary below if scanned image has no readable text)"
      );
    } catch {
      // handled in mutation onError
    } finally {
      e.target.value = "";
    }
  };

  const handleGenerateFromTemplate = async () => {
    const chosenTemplate: Draft | undefined = replyTemplates.find(
      (t) => t.id === selectedStyle
    );

    if (chosenTemplate) {
      let baseText = chosenTemplate.content || "";
      if (selectedClientId || selectedCaseId) {
        try {
          const filled = await autoFill.mutateAsync({
            template_content: baseText,
            client_id: selectedClientId || undefined,
            case_id: selectedCaseId || undefined,
          });
          baseText = filled.filled_content;
        } catch {
          // fallback to local replacements below
        }
      }
      const replacements: Array<[RegExp, string]> = [
        [/\[OPPONENT_NAME\]/gi, opponentName || "[Opponent Name]"],
        [/\[OPPONENT_ADVOCATE\]/gi, opponentAdvocate || "[Opponent Advocate]"],
        [/\[OPPONENT_ADDRESS\]/gi, opponentAddress || "[Opponent Address]"],
        [/\[NOTICE_DATE\]/gi, noticeDate ? formatDate(noticeDate) : "[Notice Date]"],
        [/\[CLIENT_NAME\]/gi, selectedClient?.name || "[Client Name]"],
        [/\[ADVOCATE_NAME\]/gi, signatureBlock],
        [
          /\[KEY_DEFENCES\]/gi,
          parsedDefences.length > 0
            ? parsedDefences.map((p, i) => `${i + 1}. ${p}`).join("\n")
            : "[Insert defence points]",
        ],
      ];
      for (const [rx, val] of replacements) {
        baseText = baseText.replace(rx, val);
      }
      setDraftContent(baseText);
      if (!replyTitle) {
        setReplyTitle(`Reply — ${subject || chosenTemplate.title}`);
      }
      toast.success("Reply generated from saved template");
      return;
    }

    const styleKey: BuiltinStyle =
      selectedStyle === "pointwise" || selectedStyle === "settlement"
        ? selectedStyle
        : "denial";

    const generated = buildDynamicReplyText({
      style: styleKey,
      language: selectedLanguage,
      opponentName,
      opponentAdvocate,
      opponentAddress,
      noticeDate,
      noticeType,
      subject,
      clientName: selectedClient?.name || "",
      noticeSummary: noticeText,
      defences: parsedDefences,
      signatureBlock,
    });
    setDraftContent(generated);
    if (!replyTitle) {
      setReplyTitle(
        `Reply to ${subject || opponentName || "Legal Notice"}`
      );
    }
    toast.success("Reply draft generated");
  };

  const handleAnalyzeStrategyAI = async () => {
    if (!noticeText.trim() && !subject.trim()) {
      toast.error("Please upload or paste the notice contents first");
      return;
    }
    setIsAnalyzingStrategy(true);
    try {
      const { data } = await api.post("/ai/notice-reply-strategy", {
        notice_text:
          noticeText.trim() ||
          `Notice Type: ${noticeType}\nSubject: ${subject}\nOpponent: ${opponentName}`,
        key_defences: parsedDefences,
      });
      setStrategy(data as StrategyResult);
      toast.success("AI reply strategy generated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsAnalyzingStrategy(false);
    }
  };

  const handleDraftWithAI = async () => {
    if (!noticeText.trim() && parsedDefences.length === 0 && !subject.trim()) {
      toast.error("Enter notice details or defence points before AI drafting");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      const baseURL = api.defaults.baseURL || "http://localhost:8000/api/v1";
      const promptText = [
        `Draft a formal legal notice reply.`,
        subject ? `Subject: ${subject}` : "",
        noticeType ? `Notice Type: ${noticeType}` : "",
        opponentName ? `Opponent Party: ${opponentName}` : "",
        opponentAdvocate ? `Opponent Advocate: ${opponentAdvocate}` : "",
        opponentAddress ? `Opponent Address: ${opponentAddress}` : "",
        noticeDate ? `Notice Date: ${noticeDate}` : "",
        selectedClient ? `Client: ${selectedClient.name}` : "",
        parsedDefences.length > 0
          ? `Key Defence / Rebuttal Points:\n${parsedDefences.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
          : "",
        noticeText.trim() ? `Original Notice Text / Summary:\n${noticeText.slice(0, 6000)}` : "",
        `Sign off as:\n${signatureBlock}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const resp = await fetch(`${baseURL}/ai/draft/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          draft_type: "reply",
          language: selectedLanguage,
          context: {
            client_name: selectedClient?.name || "",
            case_no: selectedCase?.case_no || "",
            opponent: opponentName,
            notice_type: noticeType,
          },
          prompt: promptText,
          case_id: selectedCaseId || undefined,
          client_id: selectedClientId || undefined,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errText = await resp.text();
        throw new Error(errText || `HTTP ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const ev of events) {
          const line = ev.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.slice(5).trim();
          try {
            const payload = JSON.parse(jsonStr);
            if (payload.error) {
              throw new Error(payload.error);
            }
            if (payload.content) {
              accumulated += payload.content;
              setDraftContent(accumulated);
            }
          } catch (parseErr) {
            if (parseErr instanceof SyntaxError) continue;
            throw parseErr;
          }
        }
      }

      if (!replyTitle) {
        setReplyTitle(`Reply to ${subject || opponentName || "Legal Notice"}`);
      }
      toast.success("AI reply draft generated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleExportDocx = async () => {
    if (!draftContent.trim()) {
      toast.error("Generate or write a reply before exporting");
      return;
    }
    setIsExporting(true);
    try {
      const blob = await generateDocx(
        draftContent,
        myLetterhead || null,
        selectedLanguage
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (
        replyTitle ||
        subject ||
        "legal-notice-reply"
      ).replace(/[^a-z0-9_-]/gi, "_");
      a.download = `${safeTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exported as Word (.docx)");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveReply = async () => {
    if (!draftContent.trim()) {
      toast.error("Please generate or write your reply before saving");
      return;
    }
    const effectiveTitle =
      replyTitle.trim() ||
      `Reply to ${subject.trim() || opponentName.trim() || "Legal Notice"}`;

    let draftId = savedDraftId;
    if (draftId) {
      const updated = await updateDraft.mutateAsync({
        id: draftId,
        title: effectiveTitle,
        content: draftContent,
        category: "reply",
        language: selectedLanguage,
        case_id: selectedCaseId || undefined,
        client_id: selectedClientId || undefined,
      });
      draftId = updated.id;
    } else {
      const created = await createDraft.mutateAsync({
        title: effectiveTitle,
        content: draftContent,
        category: "reply",
        language: selectedLanguage,
        case_id: selectedCaseId || undefined,
        client_id: selectedClientId || undefined,
        is_template: false,
      });
      draftId = created.id;
      setSavedDraftId(created.id);
    }

    const todayIso = new Date().toISOString().split("T")[0];
    if (activeNoticeId) {
      await updateNotice.mutateAsync({
        id: activeNoticeId,
        reply_draft_id: draftId,
        status: "replied",
        replied_date: todayIso,
        document_id: uploadedDocId || undefined,
        client_id: selectedClientId || undefined,
        case_id: selectedCaseId || undefined,
      });
    } else {
      const createdNotice = await createNotice.mutateAsync({
        direction: "received",
        subject: subject.trim() || effectiveTitle,
        notice_type: noticeType,
        opponent_name: opponentName.trim() || "Opponent Party",
        opponent_advocate: opponentAdvocate.trim() || null,
        opponent_address: opponentAddress.trim() || null,
        notice_date: noticeDate || null,
        received_date: todayIso,
        replied_date: todayIso,
        status: "replied",
        language: selectedLanguage,
        summary: noticeText.trim().slice(0, 2000) || null,
        client_id: selectedClientId || null,
        case_id: selectedCaseId || null,
        document_id: uploadedDocId || null,
        reply_draft_id: draftId,
      });
      setActiveNoticeId(createdNotice.id);
    }

    toast.success("Reply saved and linked in Notices & Draft Workspace");
  };

  const wordCount = useMemo(
    () => (draftContent.trim() ? draftContent.trim().split(/\s+/).length : 0),
    [draftContent]
  );

  const isSaving =
    createDraft.isPending ||
    updateDraft.isPending ||
    createNotice.isPending ||
    updateNotice.isPending;

  return (
    <div className="page-enter min-h-screen bg-workspace-bg flex flex-col">
      <div
        className={cn(
          "flex flex-col flex-1 min-h-0",
          showPrintPreview && "print:hidden"
        )}
      >
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => router.push("/notices")}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-charcoal transition-colors"
              title="Back to Notices"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-[15px] font-bold text-charcoal flex items-center gap-2">
                Notice Reply Builder
                <span className="px-2 py-0.5 rounded-md bg-mint/10 text-mint-dark text-[10px] uppercase tracking-wider">
                  {aiStatus?.configured ? "Templates + AI" : "Templates Ready"}
                </span>
              </h1>
              <p className="text-[11px] text-muted">
                {activeNotice
                  ? `Linked Notice: ${activeNotice.subject}`
                  : "Upload a notice or load a tracked notice to draft a reply"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportDocx}
              disabled={isExporting || !draftContent.trim()}
              className="h-8 px-3.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-charcoal disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-muted" />
              )}
              Export (.docx)
            </button>
            <button
              onClick={() => setShowPrintPreview(true)}
              disabled={!draftContent.trim()}
              className="h-8 px-3.5 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 disabled:opacity-50"
            >
              <FileCheck className="w-3.5 h-3.5" />
              Preview &amp; Print
            </button>
            <button
              onClick={handleSaveReply}
              disabled={isSaving || !draftContent.trim()}
              className="h-8 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Save Reply
            </button>
          </div>
        </div>

        {/* Workspace Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel */}
          <div className="w-full lg:w-[440px] bg-white border-r border-gray-100 overflow-y-auto p-6 shrink-0 flex flex-col gap-6">
            {/* Step 1: Source Notice & Upload */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">
                  1
                </span>
                Notice Source &amp; Upload
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Load Tracked Notice (Optional)
                </label>
                <select
                  value={activeNoticeId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setActiveNoticeId(nextId);
                    if (!nextId) {
                      setSavedDraftId("");
                    }
                  }}
                  className="w-full h-9 px-3 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal"
                >
                  <option value="">-- New Notice / Standalone Upload --</option>
                  {trackedNotices.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.subject} ({n.opponent_name})
                    </option>
                  ))}
                </select>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.md,.docx"
                onChange={handleRealFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadNoticeFile.isPending}
                className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-gray-50 hover:border-mint/50 transition-colors cursor-pointer"
              >
                {uploadNoticeFile.isPending ? (
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <Loader2 className="w-6 h-6 text-mint-dark animate-spin" />
                    <span className="text-[12px] font-semibold text-mint-dark">
                      Uploading &amp; Extracting Notice Text...
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-xl bg-mint/10 text-mint-dark flex items-center justify-center shrink-0">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-charcoal truncate">
                        {uploadedFileName
                          ? `Uploaded: ${uploadedFileName}`
                          : "Upload Notice PDF, Image, DOCX, or TXT"}
                      </div>
                      <div className="text-[11px] text-muted">
                        Real file storage + text extraction
                      </div>
                    </div>
                  </div>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-1">
                    Opponent Name
                  </label>
                  <input
                    value={opponentName}
                    onChange={(e) => setOpponentName(e.target.value)}
                    placeholder="Sender / Opponent"
                    className="w-full h-9 px-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-1">
                    Opponent Advocate
                  </label>
                  <input
                    value={opponentAdvocate}
                    onChange={(e) => setOpponentAdvocate(e.target.value)}
                    placeholder="Counsel name"
                    className="w-full h-9 px-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-1">
                    Notice Date
                  </label>
                  <input
                    type="date"
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-1">
                    Notice Subject
                  </label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject / Ref"
                    className="w-full h-9 px-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Opponent Address
                </label>
                <input
                  value={opponentAddress}
                  onChange={(e) => setOpponentAddress(e.target.value)}
                  placeholder="Postal address for RPAD / Speed Post"
                  className="w-full h-9 px-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Received Notice Text / Key Claims
                </label>
                <textarea
                  rows={3}
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  placeholder="Extracted text appears here, or paste the claims made in the notice..."
                  className="w-full p-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal resize-y"
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Step 2: Client, Matter & Signature */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">
                  2
                </span>
                Client, Matter &amp; Signature
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Client (Our Side)
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsClientDropdownOpen(!isClientDropdownOpen)
                    }
                    className="w-full h-9 px-3 rounded-xl text-[12px] bg-gray-50 border border-gray-100 text-charcoal text-left flex justify-between items-center font-medium"
                  >
                    <span className="truncate">
                      {selectedClient
                        ? `${selectedClient.name} (${selectedClient.phone})`
                        : "Select Client..."}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                  </button>

                  {isClientDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-56">
                      <div className="p-2 border-b border-gray-100 bg-gray-50">
                        <input
                          type="text"
                          placeholder="Search name or phone..."
                          value={clientSearchQuery}
                          onChange={(e) => setClientSearchQuery(e.target.value)}
                          className="w-full bg-white border border-gray-200 text-[12px] py-1 px-2.5 rounded-md outline-none"
                          autoFocus
                        />
                      </div>
                      <div className="overflow-y-auto flex-1 py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClientId("");
                            setSelectedCaseId("");
                            setIsClientDropdownOpen(false);
                            setClientSearchQuery("");
                          }}
                          className="w-full text-left px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50"
                        >
                          -- Clear Selection --
                        </button>
                        {clients
                          .filter(
                            (c) =>
                              c.name
                                .toLowerCase()
                                .includes(clientSearchQuery.toLowerCase()) ||
                              (c.phone && c.phone.includes(clientSearchQuery))
                          )
                          .map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClientId(c.id);
                                setSelectedCaseId("");
                                setIsClientDropdownOpen(false);
                                setClientSearchQuery("");
                              }}
                              className={cn(
                                "w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 flex flex-col",
                                selectedClientId === c.id
                                  ? "bg-mint/10 text-mint-dark font-semibold"
                                  : "text-charcoal"
                              )}
                            >
                              <span>{c.name}</span>
                              <span className="text-[10px] text-muted">
                                {c.phone}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Matter / Case (Optional)
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setSelectedCaseId(cid);
                    const cObj = allCases.find((c) => c.id === cid);
                    if (cObj && !selectedClientId && cObj.client_id) {
                      setSelectedClientId(cObj.client_id);
                    }
                  }}
                  className="w-full h-9 px-3 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal"
                >
                  <option value="">-- Pre-litigation / No Case --</option>
                  {filteredCases.map((cs) => (
                    <option key={cs.id} value={cs.id}>
                      {cs.case_no ? `${cs.case_no} — ` : ""}
                      {cs.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex items-start justify-between gap-2">
                <div className="text-[11px] text-gray-600 whitespace-pre-line">
                  <div className="font-bold text-charcoal mb-0.5">
                    Advocate Sign-Off (from Letterhead / Profile):
                  </div>
                  {signatureBlock}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="text-[11px] font-semibold text-mint-dark hover:underline shrink-0"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="h-px bg-gray-100 w-full" />

            {/* Step 3: Format, Defences, Language & Generation */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">
                  3
                </span>
                Format, Defence Points &amp; Draft
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">
                  Reply Style / Saved Template
                </label>
                <div className="space-y-1.5">
                  {BUILTIN_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5",
                        selectedStyle === st.id
                          ? "bg-mint/10 border-mint/40"
                          : "bg-white border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      <FileCheck
                        className={cn(
                          "w-4 h-4 mt-0.5 shrink-0",
                          selectedStyle === st.id
                            ? "text-mint-dark"
                            : "text-gray-400"
                        )}
                      />
                      <div>
                        <div className="text-[12px] font-bold text-charcoal">
                          {st.name}
                        </div>
                        <div className="text-[10px] text-muted">
                          {st.description}
                        </div>
                      </div>
                    </button>
                  ))}

                  {replyTemplates.length > 0 && (
                    <div className="pt-1">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                        Or Pick from Template Library
                      </label>
                      <select
                        value={
                          BUILTIN_STYLES.some((s) => s.id === selectedStyle)
                            ? ""
                            : selectedStyle
                        }
                        onChange={(e) => {
                          if (e.target.value) setSelectedStyle(e.target.value);
                        }}
                        className="w-full h-9 px-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 text-charcoal"
                      >
                        <option value="">-- Choose Firm / Platform Template --</option>
                        {replyTemplates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.language.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Key Defence / Rebuttal Points (one per line)
                </label>
                <textarea
                  rows={3}
                  value={keyDefencesText}
                  onChange={(e) => setKeyDefencesText(e.target.value)}
                  placeholder="e.g. Security cheque was issued under prior agreement&#10;No outstanding balance exists per ledger dated..."
                  className="w-full p-2.5 rounded-xl text-[12px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal resize-y"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1">
                  Reply Language
                </label>
                <div className="relative">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full h-9 pl-9 pr-8 rounded-xl text-[12px] bg-gray-50 border border-gray-100 text-charcoal appearance-none font-medium"
                  >
                    {LANGUAGE_OPTIONS.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateFromTemplate}
                disabled={autoFill.isPending}
                className="w-full h-10 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                style={{
                  background: "linear-gradient(135deg,#013B36,#02564F)",
                  color: "#FFFFFF",
                }}
              >
                {autoFill.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                Generate Reply Draft
              </button>

              {/* AI Tools Box */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-charcoal flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-mint-dark" />
                    AI Legal Strategist
                  </span>
                  {!aiStatus?.configured && (
                    <Link
                      href="/settings"
                      className="text-[10px] font-semibold text-mint-dark hover:underline inline-flex items-center gap-1"
                    >
                      <Settings className="w-3 h-3" /> Configure Key
                    </Link>
                  )}
                </div>

                {aiStatus?.configured ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleAnalyzeStrategyAI}
                      disabled={isAnalyzingStrategy}
                      className="h-8 px-2.5 rounded-lg text-[11px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal flex items-center justify-center gap-1.5"
                    >
                      {isAnalyzingStrategy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-mint-dark" />
                      )}
                      Analyze Strategy
                    </button>
                    <button
                      type="button"
                      onClick={handleDraftWithAI}
                      disabled={isGeneratingAI}
                      className="h-8 px-2.5 rounded-lg text-[11px] font-semibold bg-mint/15 hover:bg-mint/25 text-mint-dark flex items-center justify-center gap-1.5"
                    >
                      {isGeneratingAI ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      Draft with AI
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted leading-relaxed">
                    No AI API key configured in Settings. Dynamic templates above work immediately in English, Marathi, Hindi, and Gujarati.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Live Reply Workspace */}
          <div className="flex-1 bg-gray-50/50 p-6 flex flex-col items-center overflow-y-auto gap-4">
            {strategy && (
              <div className="w-full max-w-3xl bg-white border border-mint/30 rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold text-charcoal flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-mint-dark" />
                    AI Reply Strategy
                  </div>
                  {strategy.rebuttal_points &&
                    strategy.rebuttal_points.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setKeyDefencesText((prev) =>
                            [
                              prev.trim(),
                              ...(strategy.rebuttal_points || []),
                            ]
                              .filter(Boolean)
                              .join("\n")
                          );
                          toast.success(
                            "Rebuttal points added to Defence Points"
                          );
                        }}
                        className="text-[11px] font-semibold text-mint-dark hover:underline inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Add Points to Reply
                      </button>
                    )}
                </div>
                {strategy.summary && (
                  <p className="text-[12px] text-gray-600">
                    {strategy.summary}
                  </p>
                )}
                {strategy.rebuttal_points &&
                  strategy.rebuttal_points.length > 0 && (
                    <div>
                      <div className="text-[11px] font-semibold text-charcoal mb-1">
                        Suggested Rebuttal Points:
                      </div>
                      <ul className="list-disc pl-5 text-[12px] text-gray-600 space-y-0.5">
                        {strategy.rebuttal_points.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!draftContent && !isGeneratingAI ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center flex-1 text-center max-w-md py-16"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mb-4 shadow-sm text-gray-300">
                    <FileText className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-[15px] font-bold text-charcoal mb-2">
                    Ready to Draft Your Notice Reply
                  </h3>
                  <p className="text-[13px] text-muted leading-relaxed mb-5">
                    Load a tracked notice or upload a notice document on the left, enter your client &amp; defence points, and click{" "}
                    <strong className="text-charcoal">
                      Generate Reply Draft
                    </strong>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateFromTemplate}
                    className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm"
                    style={{
                      background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                      color: "#013B36",
                    }}
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Start with Selected Template
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-3xl bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col"
                >
                  <div className="h-12 bg-gray-50 border-b border-gray-200 flex items-center justify-between px-4 gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <Scale className="w-4 h-4 text-muted shrink-0" />
                      <input
                        value={replyTitle}
                        onChange={(e) => setReplyTitle(e.target.value)}
                        placeholder="Reply Draft Title..."
                        className="w-full bg-transparent text-[13px] font-semibold text-charcoal focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {savedDraftId && (
                        <Link
                          href={`/draft-workspace?draftId=${savedDraftId}`}
                          className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Open in Draft Workspace
                        </Link>
                      )}
                      <span className="text-[11px] text-muted font-medium">
                        {wordCount} words
                      </span>
                    </div>
                  </div>
                  <textarea
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    className="w-full min-h-[680px] p-8 text-[14px] leading-relaxed text-charcoal font-medium resize-y focus:outline-none"
                    style={{
                      fontFamily:
                        "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                    }}
                    spellCheck={false}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Print / Letterhead Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 flex bg-gray-500/80 items-center justify-center p-6 print:p-0 print:bg-white print:block">
          <div className="bg-gray-100 rounded-2xl w-full max-w-[900px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden print:w-full print:max-h-none print:shadow-none print:bg-white print:rounded-none">
            <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center print:hidden">
              <h2 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                Reply Letterhead Print Preview
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Configure Letterhead
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible relative">
              <LetterheadPreview
                letterhead={myLetterhead || null}
                content={draftContent}
                onConfigure={() => setShowSettingsModal(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Letterhead Settings Modal */}
      <Modal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Configure Letterhead"
        size="lg"
      >
        <LetterheadSettings />
      </Modal>
    </div>
  );
}

export default function NoticeReplyBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-workspace-bg flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-mint-dark" />
        </div>
      }
    >
      <NoticeReplyBuilderInner />
    </Suspense>
  );
}
