"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Sparkles, Paperclip, Mic, 
  Copy, ThumbsUp, ThumbsDown, Scale, Gavel, FileText,
  Calculator, Globe, Zap, ChevronRight, Star, Loader2,
  Briefcase, Users, AlertCircle, Calendar, CheckCircle,
  Clock, FileSearch, Library, MessageSquare, ClipboardList,
  ChevronDown
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";
import { useClients } from "@/lib/hooks/useClients";
import { useCases } from "@/lib/hooks/useCases";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: string[];
}

// Removed hardcoded CLIENTS and MATTERS

const QUICK_ACTIONS = [
  { icon: FileText, label: "Generate Notice Reply", id: "generate_notice" },
  { icon: Scale, label: "Find Relevant Case Laws", id: "find_cases" },
  { icon: Library, label: "Search Similar Drafts", id: "search_drafts" },
  { icon: MessageSquare, label: "Prepare Arguments", id: "prepare_args" },
  { icon: CheckCircle, label: "Generate Evidence Index", id: "gen_evidence" },
  { icon: ClipboardList, label: "Create Filing Checklist", id: "create_checklist" },
  { icon: AlertCircle, label: "Check Limitation", id: "check_limitation" }
];

const MATTER_INSIGHTS: Record<string, any> = {
  "M-101": {
    drafts: ["Reply to SEBI Show Cause Notice", "Appeal Memo to SAT"],
    cases: ["SEBI vs Sahara (2012)", "RIL vs SEBI (2004)"],
    sections: ["Section 15G SEBI Act", "PIT Regulations 2015"],
    evidence: ["Board Resolution 12/2025", "Email Trails (Annexure A)"],
    notices: ["SEBI SCN dated 10-04-2026"]
  },
  "M-102": {
    drafts: ["Bail Application u/s 439 CrPC", "Application for Medical Exam"],
    cases: ["Sanjay Chandra vs CBI (2012)", "Union of India vs Ram Samujh (1999)"],
    sections: ["Section 37 NDPS Act", "Section 439 CrPC"],
    evidence: ["Seizure Memo", "FSL Report (Pending)"],
    notices: []
  }
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: `I am your Fastcase Case Assistant. Select a client and matter above to load context. I can help execute specific legal workflows like drafting replies, finding case laws, or calculating limitation periods.`,
    timestamp: new Date(),
  },
];

export default function CaseAssistantPage() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [selectedMatter, setSelectedMatter] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: clientsData } = useClients({ limit: 100 });
  const { data: casesData } = useCases({ limit: 500 });
  
  const clientsList = clientsData?.clients || [];
  const allCasesList = casesData?.cases || [];

  const availableMatters = selectedClient ? allCasesList.filter((c: any) => c.client_id === selectedClient) : [];
  const activeMatterDetails = selectedMatter ? availableMatters.find((m: any) => m.id === selectedMatter) : null;
  
  // Use mock insights or fallback for any matter
  const activeInsights = selectedMatter ? (MATTER_INSIGHTS[selectedMatter] || {
    drafts: ["Draft Reply", "Application for Exemption"],
    cases: ["State vs Relevant Citation (2020)"],
    sections: ["Section 123", "Section 456"],
    evidence: ["Annexure A", "Annexure B"],
    notices: []
  }) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset matter when client changes
  useEffect(() => {
    setSelectedMatter("");
  }, [selectedClient]);

  const sendMessage = (text: string = input) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Based on the context of **${activeMatterDetails?.title || 'the general legal query'}**, here is the analysis:\n\nThe relevant provisions require strict compliance. For matter-specific drafting, I recommend reviewing the latest Supreme Court precedents on this exact issue.\n\nWould you like me to prepare a draft outline for this?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickAction = (actionLabel: string) => {
    sendMessage(`Please ${actionLabel.toLowerCase()} for this matter.`);
  };

  function renderContent(content: string) {
    return content
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/^• /gm, '&bull; ');
  }

  return (
    <div className="page-enter flex" style={{ height: "calc(100vh)" }}>
      {/* Active Matter Sidebar */}
      <div className="w-72 bg-white border-r border-gray-100 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(110,231,183,0.12)" }}>
              <Briefcase className="w-3.5 h-3.5" style={{ color: "#013B36" }} />
            </div>
            <span className="text-[13px] font-semibold text-charcoal">Case Assistant</span>
          </div>

          {/* Context Selectors */}
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Client Context</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                  className="w-full bg-white border border-gray-200 text-charcoal text-[13px] font-medium py-2 px-3 rounded-lg outline-none focus:border-[#6EE7B7] text-left flex justify-between items-center"
                >
                  <span className="truncate">
                    {selectedClient ? clientsList.find(c => c.id === selectedClient)?.name : "-- Select Client --"}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                </button>

                {isClientDropdownOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden flex flex-col max-h-60">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-1.5 shrink-0">
                      <input
                        type="text"
                        placeholder="Search name or phone..."
                        value={clientSearchQuery}
                        onChange={(e) => setClientSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 text-[12px] py-1 px-2.5 rounded-md outline-none focus:border-[#6EE7B7]"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto flex-1 py-1">
                      <button
                        onClick={() => {
                          setSelectedClient("");
                          setIsClientDropdownOpen(false);
                          setClientSearchQuery("");
                        }}
                        className="w-full text-left px-3 py-1.5 text-[12px] text-gray-500 hover:bg-gray-50 font-medium"
                      >
                        -- Clear Selection --
                      </button>
                      {clientsList.filter((c: any) =>
                        c.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
                        (c.phone && c.phone.includes(clientSearchQuery))
                      ).map((c: any) => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClient(c.id);
                            setIsClientDropdownOpen(false);
                            setClientSearchQuery("");
                          }}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors flex flex-col",
                            selectedClient === c.id ? "bg-emerald-50/50 text-[#013B36] font-semibold" : "text-charcoal"
                          )}
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-[10px] text-muted">{c.phone || "No phone"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1 block">Matter / Case</label>
              <div className="relative">
                <select 
                  value={selectedMatter} 
                  onChange={(e) => setSelectedMatter(e.target.value)}
                  disabled={!selectedClient}
                  className="w-full appearance-none bg-white border border-gray-200 text-charcoal text-[13px] font-medium py-2 px-3 rounded-lg outline-none focus:border-[#6EE7B7] disabled:bg-gray-50 disabled:opacity-50"
                >
                  <option value="">-- Select Matter --</option>
                  {availableMatters.map((m: any) => <option key={m.id} value={m.id}>{m.title}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Matter Details */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeMatterDetails ? (
            <div className="space-y-6">
              <div>
                <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Matter Status</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted leading-tight">Type</div>
                      <div className="text-[12px] font-semibold text-charcoal">{activeMatterDetails.practice_area || "General"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted leading-tight">Current Status</div>
                      <div className="text-[12px] font-semibold text-charcoal">{activeMatterDetails.status}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted leading-tight">Next Hearing</div>
                      <div className="text-[12px] font-semibold text-charcoal">{activeMatterDetails.next_hearing_date || "Not Scheduled"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3 h-3 text-rose-600" />
                    </div>
                    <div>
                      <div className="text-[10px] text-muted leading-tight">Limitation</div>
                      <div className="text-[12px] font-semibold text-charcoal">{activeMatterDetails.limitation_date || "N/A"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {activeInsights && (
                <>
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Key Sections</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {activeInsights.sections.map((sec: string) => (
                        <span key={sec} className="text-[10px] font-medium px-2 py-1 bg-gray-100 text-charcoal rounded-md">{sec}</span>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="text-[11px] font-bold text-muted uppercase tracking-wider mb-3">Evidence & Docs</h4>
                    <div className="space-y-2">
                      {activeInsights.evidence.map((ev: string) => (
                        <div key={ev} className="flex items-center gap-2 text-[11px] text-charcoal">
                          <FileText className="w-3 h-3 text-muted flex-shrink-0" />
                          <span className="truncate">{ev}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Briefcase className="w-5 h-5 text-muted" />
              </div>
              <p className="text-[12px] text-muted font-medium px-4">Select a client and matter to view case details</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        <Header title="Legal Workspace" subtitle="Matter-Centric Intelligence" />

        {!selectedMatter ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-[#6EE7B7]" />
              </div>
              <h2 className="text-lg font-bold text-charcoal mb-2">Select a Matter to Begin</h2>
              <p className="text-[13px] text-muted">The Case Assistant requires an active matter context to provide accurate drafting, research, and analysis workflows.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Top Area: Actions & Insights (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              {/* Quick Actions Grid */}
              <div>
                <h3 className="text-[14px] font-bold text-charcoal mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-500" /> Quick Legal Actions
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.label)}
                      className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-200 text-left hover:border-[#6EE7B7] hover:shadow-sm transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-50 group-hover:bg-[#6EE7B7]/10 transition-colors">
                        <action.icon className="w-4 h-4 text-muted group-hover:text-[#013B36]" />
                      </div>
                      <div>
                        <div className="text-[12px] font-semibold text-charcoal group-hover:text-[#013B36] leading-tight">{action.label}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Matter Insights Panels */}
              {activeInsights && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Suggested Drafts */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-[12px] font-bold text-[#013B36] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileSearch className="w-3.5 h-3.5" /> Suggested Drafts
                    </h4>
                    <div className="space-y-2">
                      {activeInsights.drafts.map((draft: string, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                          <span className="text-[12px] font-medium text-charcoal truncate">{draft}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Relevant Case Laws */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h4 className="text-[12px] font-bold text-[#013B36] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" /> Relevant Case Laws
                    </h4>
                    <div className="space-y-2">
                      {activeInsights.cases.map((caseLaw: string, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors border border-transparent hover:border-gray-200">
                          <span className="text-[12px] font-medium text-charcoal truncate">{caseLaw}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Area: Secondary Chat Utility */}
            <div className="h-[40%] min-h-[300px] border-t border-gray-200 bg-white flex flex-col shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
              <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <Bot className="w-4 h-4 text-[#013B36]" />
                <span className="text-[13px] font-bold text-charcoal">Matter Chat & Analysis</span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "linear-gradient(135deg,#013B36,#014D46)" }}>
                        <Sparkles className="w-3.5 h-3.5" style={{ color: "#6EE7B7" }} />
                      </div>
                    )}
                    <div className={cn("max-w-[75%]", msg.role === "user" ? "order-first" : "")}>
                      <div
                        className={cn(
                          "rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed",
                          msg.role === "user"
                            ? "text-white rounded-br-sm"
                            : "bg-gray-50 border border-gray-100 text-charcoal rounded-bl-sm"
                        )}
                        style={msg.role === "user" ? {
                          background: "linear-gradient(135deg,#013B36,#014D46)",
                        } : {}}
                        dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                      />
                      {msg.role === "assistant" && msg.id !== "welcome" && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <button className="flex items-center gap-1 text-[10px] text-muted hover:text-charcoal transition-colors">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#013B36,#014D46)" }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "#6EE7B7" }} />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#6EE7B7" }} />
                      <span className="text-[12px] text-muted">Working on matter…</span>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white">
                <div className="flex items-end gap-3 p-2 rounded-2xl border border-gray-200 bg-gray-50 focus-within:border-[#6EE7B7] focus-within:bg-white transition-all">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={`Ask something specific about ${activeMatterDetails?.title || 'this matter'}...`}
                    rows={1}
                    className="flex-1 bg-transparent text-[13px] text-charcoal placeholder:text-muted focus:outline-none resize-none leading-relaxed min-h-[20px] max-h-[100px] overflow-y-auto py-1.5 px-2"
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                    }}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isTyping}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)" }}
                  >
                    <Send className="w-4 h-4 text-[#013B36]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
