"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { BookMarked, Search, ChevronDown } from "lucide-react";
import Header from "@/components/layout/Header";

const TERMS = [
  { term: "Ab Initio", category: "Latin", definition: "From the beginning. A contract that is void ab initio is treated as never having existed.", example: "The appointment was declared void ab initio." },
  { term: "Actus Reus", category: "Latin", definition: "The physical element of a crime; the guilty act. One of two elements required to establish criminal liability.", example: "The prosecution must prove both mens rea and actus reus." },
  { term: "Amicus Curiae", category: "Latin", definition: "Friend of the court. A person who is not a party to a case but is allowed to submit a brief.", example: "NALSA appeared as amicus curiae in the matter." },
  { term: "Bail", category: "Criminal", definition: "Temporary release of an accused person awaiting trial, with conditions to ensure court appearance.", example: "The accused was granted bail on furnishing surety of ₹50,000." },
  { term: "Caveat Emptor", category: "Latin", definition: "Let the buyer beware. Principle placing responsibility on buyer to examine before purchase.", example: "The principle of caveat emptor applies in auction sales." },
  { term: "Cognizable Offence", category: "Criminal", definition: "An offence in which police can arrest without warrant and investigate without magistrate permission.", example: "Murder is a cognizable offence under BNS." },
  { term: "Ex Parte", category: "Latin", definition: "Proceeding in the absence of one party. Decision made after hearing only one side.", example: "An ex parte injunction was granted against the builder." },
  { term: "Habeas Corpus", category: "Constitutional", definition: "A writ requiring a person under arrest to be brought before a judge or court.", example: "A habeas corpus petition was filed challenging illegal detention." },
  { term: "Injunction", category: "Civil", definition: "Court order requiring a party to do or refrain from doing certain acts.", example: "A mandatory injunction was issued for status quo." },
  { term: "Locus Standi", category: "Latin", definition: "Right or capacity to bring an action or appear in court. Legal standing.", example: "The petitioner questioned the locus standi of the opposite party." },
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function DictionaryPage() {
  const [search, setSearch] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const filtered = TERMS.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.term.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
    const matchLetter = !selectedLetter || t.term.startsWith(selectedLetter);
    return matchSearch && matchLetter;
  });

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Legal Dictionary" subtitle="750+ legal terms explained in simple language" />
      <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input type="text" placeholder="Search legal terms…" value={search} onChange={e => { setSearch(e.target.value); setSelectedLetter(null); }}
              className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-white border border-gray-100 focus:outline-none focus:border-mint/40 text-charcoal placeholder:text-muted"
            />
          </div>
        </div>

        <div className="flex gap-1 flex-wrap mb-5">
          {ALPHABET.map(l => (
            <button key={l} onClick={() => setSelectedLetter(selectedLetter === l ? null : l)}
              className="w-7 h-7 rounded-lg text-[11px] font-semibold transition-all"
              style={selectedLetter === l ? { background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" } : { background: "white", color: "#6B7280", border: "1px solid #E5E7EB" }}
            >{l}</button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((item, i) => (
            <motion.div key={item.term} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer hover:border-mint/20 transition-colors"
              onClick={() => setExpandedTerm(expandedTerm === item.term ? null : item.term)}
            >
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(110,231,183,0.1)", color: "#065F46" }}>{item.term.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <span className="text-[14px] font-semibold text-charcoal">{item.term}</span>
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-muted font-medium">{item.category}</span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted transition-transform ${expandedTerm === item.term ? "rotate-180" : ""}`} />
              </div>
              {expandedTerm === item.term && (
                <div className="px-5 pb-4 border-t border-gray-50">
                  <div className="text-[13px] text-charcoal leading-relaxed mt-3">{item.definition}</div>
                  {item.example && (
                    <div className="mt-2 p-3 rounded-xl bg-gray-50 border-l-2" style={{ borderColor: "#6EE7B7" }}>
                      <div className="text-[10px] font-semibold text-muted mb-1">EXAMPLE</div>
                      <div className="text-[12px] text-muted italic">{item.example}</div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
