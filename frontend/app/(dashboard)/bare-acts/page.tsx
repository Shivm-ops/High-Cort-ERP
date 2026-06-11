"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollText, Search, ChevronRight, ChevronDown, Bookmark, Share2, Sparkles, Hash, BookOpen, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const ACTS = [
  { id: "bns", name: "Bharatiya Nyaya Sanhita (BNS) 2023", year: 2023, sections: 358, category: "Criminal", description: "Replaces Indian Penal Code 1860" },
  { id: "bnss", name: "Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023", year: 2023, sections: 531, category: "Procedural", description: "Replaces Code of Criminal Procedure 1973" },
  { id: "bsa", name: "Bharatiya Sakshya Adhiniyam (BSA) 2023", year: 2023, sections: 170, category: "Evidence", description: "Replaces Indian Evidence Act 1872" },
  { id: "cpc", name: "Code of Civil Procedure (CPC) 1908", year: 1908, sections: 158, category: "Civil", description: "Civil procedural law" },
  { id: "evidence", name: "Indian Evidence Act 1872", year: 1872, sections: 167, category: "Evidence", description: "Rules of evidence in legal proceedings" },
  { id: "ni", name: "Negotiable Instruments Act 1881", year: 1881, sections: 145, category: "Banking", description: "Law relating to cheques, bills, promissory notes" },
  { id: "gst", name: "Central Goods & Services Tax Act 2017", year: 2017, sections: 174, category: "Tax", description: "Central GST law and procedures" },
  { id: "companies", name: "Companies Act 2013", year: 2013, sections: 470, category: "Corporate", description: "Law governing companies in India" },
  { id: "rera", name: "Real Estate (Regulation) Act 2016", year: 2016, sections: 92, category: "Property", description: "Regulation of real estate sector" },
  { id: "sarfaesi", name: "SARFAESI Act 2002", year: 2002, sections: 41, category: "Banking", description: "Securitisation and enforcement of security interest" },
  { id: "ibc", name: "Insolvency & Bankruptcy Code 2016", year: 2016, sections: 255, category: "Corporate", description: "Insolvency resolution framework" },
  { id: "it", name: "Income Tax Act 1961", year: 1961, sections: 298, category: "Tax", description: "Direct taxation law" },
];

const BNS_SECTIONS = [
  { no: "1", title: "Short title, extent and commencement", content: "This Act may be called the Bharatiya Nyaya Sanhita, 2023. It extends to the whole of India, except the State of Jammu and Kashmir." },
  { no: "103", title: "Murder", content: "(1) Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine." },
  { no: "109", title: "Attempt to murder", content: "Whoever does any act with such intention or knowledge, and under such circumstances that, if he by that act caused death, he would be guilty of murder, shall be punished..." },
  { no: "131", title: "Grievous hurt", content: "The following kinds of hurt only are designated as 'grievous': Emasculation; Permanent privation of the sight of either eye; Permanent privation of the hearing of either ear..." },
  { no: "316", title: "Cheating", content: "Whoever, by deceiving any person, fraudulently or dishonestly induces the person so deceived to deliver any property to any person, or to consent that any person shall retain any property, or intentionally induces the person so deceived to do or omit to do anything..." },
];

const CATEGORIES = ["All", "Criminal", "Civil", "Procedural", "Evidence", "Banking", "Tax", "Corporate", "Property"];

export default function BareActsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedAct, setSelectedAct] = useState<typeof ACTS[0] | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sectionSearch, setSectionSearch] = useState("");

  const filtered = ACTS.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q);
    const matchCat = selectedCategory === "All" || a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const CAT_COLORS: Record<string, string> = {
    Criminal: "#EF4444", Civil: "#3B82F6", Procedural: "#8B5CF6",
    Evidence: "#F59E0B", Banking: "#10B981", Tax: "#F97316",
    Corporate: "#6366F1", Property: "#EC4899",
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Bare Acts & Legislation" subtitle="Complete Indian statutory law database" />

      <div className="p-6 flex gap-5">
        {/* Acts List */}
        <div className={cn("flex-shrink-0 transition-all duration-300", selectedAct ? "w-72" : "w-full")}>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input type="text" placeholder="Search acts…" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl text-[13px] bg-white border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal placeholder:text-muted"
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setSelectedCategory(c)}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all", selectedCategory === c ? "text-[#013B36]" : "text-muted hover:text-charcoal bg-white border border-gray-100")}
                  style={selectedCategory === c ? { background: "rgba(110,231,183,0.1)", border: "1px solid rgba(110,231,183,0.3)" } : {}}
                >{c}</button>
              ))}
            </div>
          </div>

          <div className={cn("grid gap-3", selectedAct ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3")}>
            {filtered.map((act, i) => (
              <motion.div key={act.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedAct(selectedAct?.id === act.id ? null : act)}
                className={cn(
                  "bg-white rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md",
                  selectedAct?.id === act.id ? "border-mint/40 shadow-md" : "border-gray-100"
                )}
                style={selectedAct?.id === act.id ? { boxShadow: "0 4px 20px rgba(110,231,183,0.15)" } : { boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${CAT_COLORS[act.category] ?? "#6B7280"}18` }}>
                    <ScrollText className="w-4 h-4" style={{ color: CAT_COLORS[act.category] ?? "#6B7280" }} />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${CAT_COLORS[act.category] ?? "#6B7280"}15`, color: CAT_COLORS[act.category] ?? "#6B7280" }}>
                    {act.category}
                  </span>
                </div>
                <div className="text-[13px] font-semibold text-charcoal leading-snug mb-1">{act.name}</div>
                <div className="text-[11px] text-muted mb-3">{act.description}</div>
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>{act.sections} sections</span>
                  <span>Year: {act.year}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Section viewer */}
        <AnimatePresence>
          {selectedAct && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="flex-1 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-[15px] font-semibold text-charcoal">{selectedAct.name}</div>
                    <div className="text-[12px] text-muted">{selectedAct.sections} sections · {selectedAct.year}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="h-8 px-3 rounded-lg text-[12px] font-medium flex items-center gap-1.5" style={{ background: "rgba(110,231,183,0.1)", color: "#065F46" }}>
                      <Sparkles className="w-3 h-3" /> AI Summary
                    </button>
                    <button className="h-8 px-3 rounded-lg text-[12px] font-medium text-muted bg-gray-50 border border-gray-100">
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                  <input type="text" placeholder="Search sections…" value={sectionSearch} onChange={e => setSectionSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none text-charcoal placeholder:text-muted"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {BNS_SECTIONS.filter(s => !sectionSearch || s.title.toLowerCase().includes(sectionSearch.toLowerCase()) || s.no.includes(sectionSearch)).map(section => (
                  <div key={section.no} className={cn("rounded-xl border transition-all cursor-pointer", expandedSection === section.no ? "border-mint/30 bg-emerald-50/30" : "border-gray-100 bg-white hover:border-gray-200")}>
                    <div className="flex items-center gap-3 p-4" onClick={() => setExpandedSection(expandedSection === section.no ? null : section.no)}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold" style={{ background: "rgba(110,231,183,0.1)", color: "#065F46" }}>
                        {section.no}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-charcoal">Section {section.no} — {section.title}</div>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 text-muted transition-transform", expandedSection === section.no && "rotate-180")} />
                    </div>
                    <AnimatePresence>
                      {expandedSection === section.no && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-gray-100">
                            <p className="text-[13px] text-charcoal leading-relaxed mt-3">{section.content}</p>
                            <div className="flex items-center gap-2 mt-3">
                              <button className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1" style={{ background: "rgba(110,231,183,0.1)", color: "#065F46" }}>
                                <Sparkles className="w-3 h-3" /> AI Explain
                              </button>
                              <button className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 bg-gray-50 text-muted border border-gray-100">
                                <BookOpen className="w-3 h-3" /> Case Laws
                              </button>
                              <button className="text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 bg-gray-50 text-muted border border-gray-100">
                                <Bookmark className="w-3 h-3" /> Save
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
