"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Languages, ArrowRight, Loader2, Copy, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧", native: "English" },
  { code: "hi", label: "Hindi", flag: "🇮🇳", native: "हिंदी" },
  { code: "mr", label: "Marathi", flag: "🇮🇳", native: "मराठी" },
  { code: "gu", label: "Gujarati", flag: "🇮🇳", native: "ગુજરાતી" },
];

const SAMPLE_TRANSLATIONS: Record<string, string> = {
  hi: "माननीय न्यायालय में आवेदन। यह आवेदन धारा 439 दण्ड प्रक्रिया संहिता के अंतर्गत जमानत के लिए किया जा रहा है।",
  mr: "माननीय न्यायालयात अर्ज. हा अर्ज कलम 439 दंड प्रक्रिया संहितेनुसार जामिनासाठी केला जात आहे.",
  gu: "માનનીય ન્યાયાલયમાં અરજી. આ અરજી કલમ 439 ફોજદારી કાર્યવાહી સંહિતા હેઠળ જામીન માટે કરવામાં આવે છે.",
  en: "Application before the Hon'ble Court. This application is being made for bail under Section 439 of the Code of Criminal Procedure.",
};

export default function MultilingualPage() {
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [sourceText, setSourceText] = useState("");
  const [translated, setTranslated] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTranslate = () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    setTimeout(() => {
      setTranslated(SAMPLE_TRANSLATIONS[targetLang]);
      setIsTranslating(false);
    }, 1500);
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Multilingual Drafts" subtitle="AI-powered legal document translation" />
      <div className="p-6">
        <div className="flex items-center gap-4 mb-5">
          {["en", "hi", "mr", "gu"].map(code => {
            const lang = LANGUAGES.find(l => l.code === code)!;
            return (
              <div key={code} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-100 cursor-pointer hover:border-mint/30 transition-colors">
                <span>{lang.flag}</span>
                <span className="text-[13px] font-medium text-charcoal">{lang.label}</span>
                <span className="text-[11px] text-muted">({lang.native})</span>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <select value={sourceLang} onChange={e => setSourceLang(e.target.value)} className="text-[13px] font-semibold text-charcoal bg-transparent focus:outline-none">
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select>
            </div>
            <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} placeholder="Enter legal text to translate…" rows={12}
              className="w-full p-4 text-[13px] text-charcoal placeholder:text-muted focus:outline-none resize-none leading-relaxed"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <select value={targetLang} onChange={e => setTargetLang(e.target.value)} className="text-[13px] font-semibold text-charcoal bg-transparent focus:outline-none">
                {LANGUAGES.filter(l => l.code !== sourceLang).map(l => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select>
              {translated && (
                <button onClick={() => { navigator.clipboard.writeText(translated); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-charcoal transition-colors"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div className="p-4 min-h-48">
              {isTranslating ? (
                <div className="flex items-center gap-2 text-muted"><Loader2 className="w-4 h-4 animate-spin" style={{ color: "#6EE7B7" }} /><span className="text-[13px]">Translating…</span></div>
              ) : translated ? (
                <p className="text-[13px] text-charcoal leading-relaxed">{translated}</p>
              ) : (
                <p className="text-[13px] text-muted">Translation will appear here…</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <button onClick={handleTranslate} disabled={!sourceText.trim() || isTranslating}
            className="h-11 px-8 rounded-xl font-semibold text-[14px] flex items-center gap-2 transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36", boxShadow: "0 4px 14px rgba(110,231,183,0.35)" }}
          >
            {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
            Translate with AI
          </button>
        </div>
      </div>
    </div>
  );
}
