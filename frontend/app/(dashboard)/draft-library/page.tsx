"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Library, Search, FileText, Download, Star, Clock, Globe,
  ShieldCheck, CheckCircle2, X, Upload, FileCheck, AlertCircle,
  Languages, ArrowRight, ChevronDown, Filter, Sparkles
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useLanguageStore } from "@/lib/store/languageStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LANGUAGE_NAMES } from "@/lib/i18n";

const LANG_CODES = [
  { code: "all", label: "All Languages", nativeLabel: "All Languages", flag: "🌐", color: "gray" },
  { code: "en",  label: "English",       nativeLabel: "English",        flag: "🇬🇧", color: "blue" },
  { code: "mr",  label: "Marathi",       nativeLabel: "मराठी",          flag: "🇮🇳", color: "orange" },
  { code: "hi",  label: "Hindi",         nativeLabel: "हिन्दी",          flag: "🇮🇳", color: "green" },
  { code: "gu",  label: "Gujarati",      nativeLabel: "ગુજરાતી",        flag: "🇮🇳", color: "purple" },
];

const CATEGORIES = [
  { id: "all",        label: "All Drafts",    count: 10247 },
  { id: "bail",       label: "Bail",          count: 1842 },
  { id: "civil",      label: "Civil",         count: 1520 },
  { id: "property",   label: "Property",      count: 987 },
  { id: "gst",        label: "GST / Taxation",count: 763 },
  { id: "family",     label: "Family / Matrimonial", count: 612 },
  { id: "notice",     label: "Notices",       count: 1934 },
  { id: "agreements", label: "Agreements",    count: 845 },
  { id: "mact",       label: "MACT / Motor",  count: 734 },
  { id: "consumer",   label: "Consumer",      count: 521 },
  { id: "labour",     label: "Labour / Service", count: 489 },
  { id: "criminal",   label: "Criminal",      count: 1000 },
];

// Rich mock data with cross-language mapping
const DRAFTS: Draft[] = [
  {
    id: "1", title: "Anticipatory Bail Application u/s 438 CrPC", category: "bail",
    language: "en", tags: ["Bail", "CrPC"], updatedAt: "2d ago", label: "Verified Draft", starred: true,
    crossLang: [{ lang: "mr", id: "1-mr" }, { lang: "hi", id: "1-hi" }],
  },
  {
    id: "2", title: "Section 138 NI Act Complaint", category: "civil",
    language: "en", tags: ["NI Act", "Cheque"], updatedAt: "5d ago", label: "Court Format", starred: false,
    crossLang: [{ lang: "mr", id: "2-mr" }, { lang: "gu", id: "2-gu" }],
  },
  {
    id: "3", title: "RERA Complaint Draft — Possession Delay", category: "property",
    language: "en", tags: ["RERA", "Property"], updatedAt: "1w ago", label: "Firm Draft", starred: true,
    crossLang: [],
  },
  {
    id: "4", title: "GST Appeal Before Appellate Authority", category: "gst",
    language: "en", tags: ["GST", "Appeal"], updatedAt: "3d ago", label: "Verified Draft", starred: false,
    crossLang: [{ lang: "gu", id: "4-gu" }],
  },
  {
    id: "5", title: "जमानत अर्जी — NDPS Act u/s 37", category: "bail",
    language: "hi", tags: ["Bail", "NDPS"], updatedAt: "1d ago", label: "Standard Format", starred: true,
    crossLang: [{ lang: "en", id: "1" }, { lang: "mr", id: "1-mr" }],
  },
  {
    id: "6", title: "Divorce Petition u/s 13 HMA", category: "family",
    language: "en", tags: ["Family", "Divorce"], updatedAt: "1w ago", label: "Court Format", starred: false,
    crossLang: [{ lang: "mr", id: "6-mr" }, { lang: "hi", id: "6-hi" }],
  },
  {
    id: "7", title: "Legal Notice — Cheque Dishonour u/s 138", category: "notice",
    language: "en", tags: ["Notice", "NI Act"], updatedAt: "4d ago", label: "Verified Draft", starred: true,
    crossLang: [{ lang: "mr", id: "7-mr" }, { lang: "hi", id: "7-hi" }, { lang: "gu", id: "7-gu" }],
  },
  {
    id: "8", title: "MACT Claim Petition — Road Accident", category: "mact",
    language: "en", tags: ["MACT", "Accident"], updatedAt: "6d ago", label: "Template", starred: false,
    crossLang: [{ lang: "mr", id: "8-mr" }],
  },
  {
    id: "9", title: "वकालतनामा (Vakalatnama) — सत्र न्यायालय", category: "all",
    language: "mr", tags: ["Vakalatnama", "Court"], updatedAt: "1d ago", label: "Court Format", starred: true,
    crossLang: [{ lang: "en", id: "9-en" }, { lang: "hi", id: "9-hi" }, { lang: "gu", id: "9-gu" }],
  },
  {
    id: "10", title: "ग्राहक तक्रार — ग्राहक संरक्षण कायदा 2019", category: "consumer",
    language: "mr", tags: ["Consumer", "NCDRC"], updatedAt: "3d ago", label: "Verified Draft", starred: false,
    crossLang: [{ lang: "en", id: "10-en" }, { lang: "hi", id: "10-hi" }],
  },
  {
    id: "11", title: "ગ્રાહક ફરિયાદ — ગ્રાહક સુરક્ષા અધિનિયમ 2019", category: "consumer",
    language: "gu", tags: ["Consumer", "NCDRC"], updatedAt: "2d ago", label: "Verified Draft", starred: true,
    crossLang: [{ lang: "en", id: "10-en" }, { lang: "mr", id: "10" }, { lang: "hi", id: "10-hi" }],
  },
  {
    id: "12", title: "Property Sale Agreement — Residential", category: "agreements",
    language: "en", tags: ["Agreement", "Property"], updatedAt: "1w ago", label: "Standard Format", starred: false,
    crossLang: [{ lang: "mr", id: "12-mr" }, { lang: "hi", id: "12-hi" }, { lang: "gu", id: "12-gu" }],
  },
];

interface CrossLangRef { lang: string; id: string; }
interface Draft {
  id: string; title: string; category: string; language: string;
  tags: string[]; updatedAt: string; label: string; starred: boolean;
  crossLang: CrossLangRef[];
}

const REQUIRED_DOCS_MAP: Record<string, string[]> = {
  bail: ["FIR Copy", "Arrest Memo", "Previous Bail Orders", "Surety Documents", "Identity Proof"],
  civil: ["Aadhaar Copy", "PAN Card", "Original Agreement", "Legal Notice Copy"],
  property: ["Sale Deed", "7/12 Extract", "Property Tax Receipt", "Title Certificate", "Index II"],
  gst: ["GST Registration", "Show Cause Notice", "Assessment Order", "Challans", "Returns"],
  family: ["Marriage Certificate", "Address Proof", "Photographs", "Income Affidavit"],
  notice: ["Agreement Copy", "Cheque Copy (if 138)", "Return Memo (if 138)", "Ledger Extract"],
  agreements: ["Aadhaar Copies of Parties", "Stamp Paper", "Witness IDs", "PAN Cards"],
  mact: ["FIR", "RC Book", "Insurance Policy", "Medical Bills", "Disability Certificate"],
  consumer: ["Purchase Bill / Invoice", "Complaint Notice", "Company Response", "Payment Proof"],
  labour: ["Appointment Letter", "Termination Order", "Salary Slips", "PF Records"],
  criminal: ["FIR", "Charge Sheet", "Witness List", "Seizure Memo"],
  all: ["Aadhaar Copy", "PAN Card"],
};

const LANG_BADGE_COLORS: Record<string, string> = {
  en: "bg-blue-50 text-blue-700 border-blue-100",
  mr: "bg-orange-50 text-orange-700 border-orange-100",
  hi: "bg-green-50 text-green-700 border-green-100",
  gu: "bg-purple-50 text-purple-700 border-purple-100",
};

function LangBadge({ lang }: { lang: string }) {
  const entry = LANG_CODES.find(l => l.code === lang);
  if (!lang || !entry) return null;
  return (
    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", LANG_BADGE_COLORS[lang] || "bg-gray-50 text-gray-600 border-gray-100")}>
      {entry.flag} {entry.nativeLabel}
    </span>
  );
}

export default function DraftLibraryPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { draftLanguage } = useLanguageStore();

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [search, setSearch] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [previewDraft, setPreviewDraft] = useState<Draft | null>(null);
  const [showCrossLang, setShowCrossLang] = useState(true);

  // Smart filter: if user has draft lang preference != all, highlight it
  const activeLangHint = draftLanguage !== "en" ? draftLanguage : null;

  const filtered = useMemo(() => {
    return DRAFTS.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || d.title.toLowerCase().includes(q) || d.tags.some(t => t.toLowerCase().includes(q));
      const matchCat = selectedCategory === "all" || d.category === selectedCategory;
      const matchLang = selectedLanguage === "all" || d.language === selectedLanguage;
      const matchFav = !showFavorites || d.starred;
      return matchSearch && matchCat && matchLang && matchFav;
    });
  }, [search, selectedCategory, selectedLanguage, showFavorites]);

  const mostUsed = DRAFTS.filter(d => ["1", "7", "9", "10"].includes(d.id));

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header
        title={t("drafts.title", "Draft Library")}
        subtitle="10,000+ multilingual legal templates — English, मराठी, हिन्दी, ગુજરાતી"
      />

      <div className="p-6 flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto">

        {/* Left Sidebar Filters */}
        <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">

          {/* Language Filter — Primary Feature */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#013B36]" />
              <span className="text-[12px] font-bold text-charcoal">{t("drafts.filterLanguage", "Filter by Language")}</span>
            </div>
            <div className="p-2 flex flex-col gap-0.5">
              {LANG_CODES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 text-[13px]",
                    selectedLanguage === lang.code
                      ? "bg-[#013B36] text-white font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="flex-1">{lang.nativeLabel}</span>
                  {lang.code !== "all" && (
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      selectedLanguage === lang.code ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                    )}>
                      {DRAFTS.filter(d => d.language === lang.code).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Draft Language Hint */}
            {activeLangHint && (
              <div className="mx-3 mb-3 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-[10px] text-amber-700 font-medium">
                  💡 Your default draft language is <strong>{LANGUAGE_NAMES[activeLangHint]}</strong>.
                  <button onClick={() => setSelectedLanguage(activeLangHint)} className="underline ml-1">Filter to it?</button>
                </p>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-[12px] font-bold text-charcoal">Categories</span>
            </div>
            <div className="p-2 max-h-80 overflow-y-auto flex flex-col gap-0.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-[13px]",
                    selectedCategory === cat.id ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <span>{cat.label}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white border border-gray-100 text-gray-400">
                    {cat.count.toLocaleString("en-IN")}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Favorites */}
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-[13px] font-medium transition-all",
              showFavorites
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-gray-100 text-gray-600 hover:border-gray-200"
            )}
          >
            <Star className={cn("w-4 h-4", showFavorites ? "fill-amber-400 text-amber-400" : "")} />
            My Favorites
            {showFavorites && <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">{DRAFTS.filter(d => d.starred).length}</span>}
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">

          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-wrap items-center gap-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6EE7B7]" />
              <input
                type="text"
                placeholder="Search in English, मराठी, हिन्दी, ગુજરાતી…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-9 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] focus:bg-white transition-all placeholder:text-gray-400 text-charcoal"
              />
            </div>

            {/* Cross-Lang toggle */}
            <button
              onClick={() => setShowCrossLang(!showCrossLang)}
              className={cn(
                "h-10 px-3 rounded-xl flex items-center gap-2 text-[12px] font-medium border transition-all",
                showCrossLang ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-100 text-gray-500"
              )}
            >
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:block">Cross-Language Suggestions</span>
            </button>

            <button className="h-10 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-2 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors border border-gray-100">
              <Upload className="w-3.5 h-3.5" /> Upload Template
            </button>
          </div>

          {/* Most Used (only on fresh view) */}
          {!search && selectedCategory === "all" && selectedLanguage === "all" && !showFavorites && (
            <div>
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Most Used Templates
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {mostUsed.map(draft => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    showCrossLang={showCrossLang}
                    onClick={() => setPreviewDraft(draft)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                {search ? `Results for "${search}"` : showFavorites ? "Favorites" : selectedLanguage !== "all" ? `${LANG_CODES.find(l => l.code === selectedLanguage)?.nativeLabel} Templates` : selectedCategory !== "all" ? CATEGORIES.find(c => c.id === selectedCategory)?.label : "All Templates"}
              </h2>
              <span className="text-[11px] text-gray-400 font-medium">{filtered.length} drafts</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-gray-100" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <Languages className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-[14px] font-semibold text-charcoal mb-1">No drafts found</p>
                <p className="text-[12px] text-muted">Try a different language filter or search term</p>
                {selectedLanguage !== "all" && (
                  <button
                    onClick={() => setSelectedLanguage("all")}
                    className="mt-4 text-[12px] font-semibold text-indigo-600 underline"
                  >
                    Show all languages
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(draft => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    showCrossLang={showCrossLang}
                    onClick={() => setPreviewDraft(draft)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
              onClick={() => setPreviewDraft(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[85vh] max-h-[800px]"
            >
              {/* Left: Document Preview */}
              <div className="flex-1 bg-gray-50 p-6 overflow-y-auto flex justify-center border-r border-gray-100">
                <div className="w-full max-w-[500px] bg-white border border-gray-200 shadow-sm p-10 min-h-full font-serif text-[13px] leading-relaxed text-gray-800 flex flex-col items-center">
                  <div className="w-full text-center mb-8 font-bold text-sm">BEFORE THE HON'BLE COURT / FORUM</div>
                  <div className="w-full text-left mb-6 font-semibold">Case No: {"{{case_number}}"}</div>
                  <div className="w-full text-left mb-8">
                    {"{{client_name}}"}<br /><span className="pl-16">... Petitioner/Applicant</span><br /><br />
                    VERSUS<br /><br />
                    {"{{opponent_name}}"}<br /><span className="pl-16">... Respondent</span>
                  </div>
                  <div className="w-full font-bold text-center mb-6 uppercase">{previewDraft.title}</div>
                  <div className="w-full text-center text-gray-300 border-2 border-dashed border-gray-100 p-8 rounded-xl text-[12px]">
                    Template content loads from storage.<br />Select a matter to auto-fill fields.
                  </div>
                </div>
              </div>

              {/* Right: Info Panel */}
              <div className="w-full md:w-[340px] bg-white p-6 flex flex-col shrink-0 overflow-y-auto">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-[15px] font-bold text-charcoal leading-snug pr-2">{previewDraft.title}</h3>
                  <button onClick={() => setPreviewDraft(null)} className="p-2 text-gray-400 hover:text-charcoal hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="px-2.5 py-1 bg-[#013B36]/10 text-[#013B36] rounded-lg text-[11px] font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> {previewDraft.label}
                  </span>
                  <LangBadge lang={previewDraft.language} />
                </div>

                {/* Cross-Language Available Versions */}
                {previewDraft.crossLang.length > 0 && (
                  <div className="mb-5">
                    <h4 className="text-[12px] font-bold text-charcoal flex items-center gap-2 mb-2">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" /> Available in other languages
                    </h4>
                    <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100 space-y-2">
                      {previewDraft.crossLang.map(ref => {
                        const langEntry = LANG_CODES.find(l => l.code === ref.lang);
                        return (
                          <div key={ref.lang} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{langEntry?.flag}</span>
                              <span className="text-[12px] font-semibold text-charcoal">{langEntry?.nativeLabel}</span>
                            </div>
                            <button className="text-[11px] text-indigo-600 font-semibold flex items-center gap-1 hover:text-indigo-800">
                              Switch <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Required Documents */}
                <div className="mb-5">
                  <h4 className="text-[12px] font-bold text-charcoal flex items-center gap-2 mb-2">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> Required Documents
                  </h4>
                  <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100 space-y-1.5">
                    {(REQUIRED_DOCS_MAP[previewDraft.category] || REQUIRED_DOCS_MAP.all).map((doc, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{doc}</span>
                      </div>
                    ))}
                    <div className="mt-3 pt-2 border-t border-emerald-100 text-[10px] text-emerald-700 font-medium flex items-start gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> Collect these before drafting.
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {previewDraft.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-lg font-medium">{tag}</span>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="mt-auto flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setPreviewDraft(null);
                      router.push(`/draft-workspace?templateId=${previewDraft.id}`);
                    }}
                    className="w-full py-3 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{ background: "linear-gradient(135deg, #013B36, #014D46)", boxShadow: "0 4px 14px rgba(1,59,54,0.25)" }}
                  >
                    <FileText className="w-4 h-4" /> Use This Template
                  </button>
                  <button 
                    onClick={() => {
                      toast.success(`Downloading ${previewDraft.title}.docx`);
                      const a = document.createElement("a");
                      a.href = "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8," + encodeURIComponent("MOCK CONTENT: " + previewDraft.title);
                      a.download = `${previewDraft.title}.docx`;
                      a.click();
                    }}
                    className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-gray-600 bg-gray-50 border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download (.docx)
                  </button>
                  <p className="text-[10px] text-muted text-center mt-1">
                    Opens Draft Workspace to auto-fill client &amp; matter details.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DraftCard({ draft, showCrossLang, onClick }: { draft: Draft; showCrossLang: boolean; onClick: () => void }) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:border-[#013B36]/20 transition-all group flex flex-col"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold text-[#013B36]/60 uppercase tracking-wider">{draft.label}</span>
          <div className="text-[13px] font-bold text-charcoal leading-snug mt-0.5 line-clamp-2 group-hover:text-[#013B36] transition-colors">
            {draft.title}
          </div>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          className={cn("transition-colors p-1.5 -mr-1.5 -mt-1 flex-shrink-0", draft.starred ? "text-amber-400" : "text-gray-200 hover:text-amber-300")}
        >
          <Star className="w-4 h-4" fill={draft.starred ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Cross-Language badges */}
      {showCrossLang && draft.crossLang.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap mb-2">
          <Globe className="w-3 h-3 text-indigo-400 flex-shrink-0" />
          {draft.crossLang.map(ref => {
            const entry = LANG_CODES.find(l => l.code === ref.lang);
            return (
              <span key={ref.lang} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                {entry?.nativeLabel}
              </span>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
        <div className="flex flex-wrap gap-1.5">
          <LangBadge lang={draft.language} />
          {draft.tags.slice(0, 1).map(t => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{t}</span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted whitespace-nowrap">
          <Clock className="w-3 h-3" /> {draft.updatedAt}
        </div>
      </div>
    </motion.div>
  );
}
