"use client";

import React from "react";
import { Globe, Check, Type, FileText, BookOpen } from "lucide-react";
import { useLanguageStore, SupportedLanguage } from "@/lib/store/languageStore";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SAMPLE_TEXT: Record<string, { heading: string; body: string }> = {
  en: {
    heading: "Legal ERP Platform",
    body: "Before the Hon'ble Court — Application for interim relief under CPC Order 39.",
  },
  mr: {
    heading: "कायदेशीर ERP प्लॅटफॉर्म",
    body: "माननीय न्यायालयासमोर — CPC ऑर्डर ३९ अंतर्गत तात्पुरता दिलासा मिळवण्याचा अर्ज.",
  },
  hi: {
    heading: "कानूनी ERP प्लेटफार्म",
    body: "माननीय न्यायालय के समक्ष — CPC आदेश ३९ के अंतर्गत अंतरिम राहत हेतु आवेदन।",
  },
  gu: {
    heading: "કાનૂની ERP પ્લેટફૉર્મ",
    body: "માનનીય ન્યાયાલય સમક્ષ — CPC ઓર્ડર ૩૯ હેઠળ અંતરિમ રાહત માટે અરજ.",
  },
};

interface LangCardProps {
  lang: (typeof SUPPORTED_LANGUAGES)[0];
  active: boolean;
  label: string;
  currentValue: string;
  onSelect: () => void;
}

function LangCard({ lang, active, label, currentValue, onSelect }: LangCardProps) {
  const sample = SAMPLE_TEXT[lang.code];
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative w-full text-left p-4 rounded-2xl border transition-all duration-200",
        active
          ? "border-[#013B36] ring-1 ring-[#013B36] bg-[#013B36]/[0.03]"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{lang.flag}</span>
          <div>
            <div className="text-[14px] font-bold text-charcoal">{lang.nativeName}</div>
            {lang.nativeName !== lang.name && (
              <div className="text-[11px] text-muted">{lang.name}</div>
            )}
          </div>
        </div>
        {active && (
          <div className="w-5 h-5 rounded-full bg-[#013B36] flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      {/* Sample text preview */}
      <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
        <div
          className={cn(
            "text-[13px] font-bold text-charcoal mb-1",
            (lang.code === "mr" || lang.code === "hi") && "font-[\'Noto_Sans_Devanagari\',sans-serif]",
            lang.code === "gu" && "font-[\'Noto_Sans_Gujarati\',sans-serif]"
          )}
        >
          {sample.heading}
        </div>
        <div
          className={cn(
            "text-[11px] text-muted leading-relaxed",
            (lang.code === "mr" || lang.code === "hi") && "font-[\'Noto_Sans_Devanagari\',sans-serif]",
            lang.code === "gu" && "font-[\'Noto_Sans_Gujarati\',sans-serif]"
          )}
        >
          {sample.body}
        </div>
      </div>
    </button>
  );
}

export default function MultilingualSettings() {
  const {
    uiLanguage, draftLanguage, documentLanguage,
    setUILanguage, setDraftLanguage, setDocumentLanguage
  } = useLanguageStore();

  const handleSave = () => {
    toast.success("Language preferences saved! / भाषा प्राधान्ये जतन केली!");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-[#013B36]/10 flex items-center justify-center">
            <Globe className="w-4 h-4 text-[#013B36]" />
          </div>
          <h2 className="text-[16px] font-bold text-charcoal">Multilingual Settings</h2>
        </div>
        <p className="text-[13px] text-muted ml-11">
          Configure UI language, draft language, and document generation language independently.
        </p>
      </div>

      {/* UI Language */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <Type className="w-4 h-4 text-[#013B36]" />
          <h3 className="text-[14px] font-semibold text-charcoal">UI Language</h3>
          <span className="ml-auto text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 font-medium">
            Interface
          </span>
        </div>
        <p className="text-[12px] text-muted mb-5">
          Changes menus, buttons, labels, and all navigation text across the entire platform.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <LangCard
              key={lang.code}
              lang={lang}
              active={uiLanguage === lang.code}
              label="UI Language"
              currentValue={uiLanguage}
              onSelect={() => setUILanguage(lang.code as SupportedLanguage)}
            />
          ))}
        </div>
      </div>

      {/* Draft Language */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <FileText className="w-4 h-4 text-purple-600" />
          <h3 className="text-[14px] font-semibold text-charcoal">Draft Language</h3>
          <span className="ml-auto text-[11px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-100 font-medium">
            Content
          </span>
        </div>
        <p className="text-[12px] text-muted mb-5">
          Default language for new drafts, notices, petitions, and legal documents. Different from UI language.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setDraftLanguage(lang.code as SupportedLanguage)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-150 text-left",
                draftLanguage === lang.code
                  ? "border-purple-300 bg-purple-50 text-purple-700"
                  : "border-gray-100 bg-white hover:border-gray-200 text-charcoal"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <div>
                <div className="text-[12px] font-semibold leading-tight">{lang.nativeName}</div>
                {lang.nativeName !== lang.name && (
                  <div className="text-[10px] text-muted">{lang.name}</div>
                )}
              </div>
              {draftLanguage === lang.code && <Check className="w-3.5 h-3.5 ml-auto text-purple-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Document Language */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div className="flex items-center gap-2.5 mb-1">
          <BookOpen className="w-4 h-4 text-amber-600" />
          <h3 className="text-[14px] font-semibold text-charcoal">Document & PDF Language</h3>
          <span className="ml-auto text-[11px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
            Output
          </span>
        </div>
        <p className="text-[12px] text-muted mb-5">
          Language used when generating PDFs, printing invoices, letterheads, and court-ready documents.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setDocumentLanguage(lang.code as SupportedLanguage)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl border transition-all duration-150 text-left",
                documentLanguage === lang.code
                  ? "border-amber-300 bg-amber-50 text-amber-700"
                  : "border-gray-100 bg-white hover:border-gray-200 text-charcoal"
              )}
            >
              <span className="text-lg">{lang.flag}</span>
              <div>
                <div className="text-[12px] font-semibold leading-tight">{lang.nativeName}</div>
                {lang.nativeName !== lang.name && (
                  <div className="text-[10px] text-muted">{lang.name}</div>
                )}
              </div>
              {documentLanguage === lang.code && <Check className="w-3.5 h-3.5 ml-auto text-amber-600" />}
            </button>
          ))}
        </div>
      </div>

      {/* Unicode info box */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex gap-3">
          <Globe className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[13px] font-semibold text-blue-800 mb-1">Unicode & Font Support</div>
            <ul className="text-[12px] text-blue-700 space-y-1 list-disc ml-4">
              <li>Marathi & Hindi use <strong>Noto Sans Devanagari</strong> font (Unicode-compliant)</li>
              <li>Gujarati uses <strong>Noto Sans Gujarati</strong> font (Unicode-compliant)</li>
              <li>All PDFs and printed documents use embedded fonts for correct script rendering</li>
              <li>File names and folder names support all four languages</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="h-10 px-6 rounded-xl text-[13px] font-semibold text-white transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #013B36, #014D46)", boxShadow: "0 4px 14px rgba(1,59,54,0.25)" }}
        >
          Save Language Preferences
        </button>
      </div>
    </div>
  );
}
