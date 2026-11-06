"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  FileQuestion,
  MessageSquare,
  PlusCircle,
  Paperclip,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  ThumbsUp,
  Send,
  Loader2,
  X,
  FileText,
  Shield,
  CreditCard,
  Briefcase,
  Users,
  Settings,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  article_count: number;
}

interface ArticleSummary {
  id: string;
  category_id: string;
  category_name?: string;
  title: string;
  slug: string;
  summary: string;
  tags?: string;
  views_count: number;
  helpful_count: number;
}

interface ArticleDetail extends ArticleSummary {
  content: string;
  created_at: string;
  updated_at: string;
}

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  order: number;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: {
    message: string;
    created_at: string;
    is_support: boolean;
  };
}

interface TicketMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  is_support: boolean;
  message: string;
  attachment_url?: string;
  created_at: string;
}

interface TicketDetail extends Ticket {
  user_name: string;
  user_email: string;
  messages: TicketMessage[];
}

const FAQ_CATEGORIES = [
  { key: "all", label: "All Topics" },
  { key: "account_setup", label: "Account & Chambers" },
  { key: "clients", label: "Clients & CRM" },
  { key: "cases", label: "Cases & Hearings" },
  { key: "documents", label: "Legal Docs & AI" },
  { key: "billing", label: "Billing & Plans" },
  { key: "general", label: "General Queries" },
];

const TICKET_CATEGORIES = [
  { value: "technical", label: "Technical Issue" },
  { value: "payment", label: "Payment Issue" },
  { value: "account", label: "Account Issue" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general", label: "General Query" },
];

const TICKET_PRIORITIES = [
  { value: "low", label: "Low", color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "medium", label: "Medium", color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "high", label: "High", color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "critical", label: "Critical", color: "text-red-600 bg-red-50 border-red-200" },
];

export default function SupportPage() {
  const [activeTab, setActiveTab] = useState<"knowledge" | "faqs" | "tickets">("knowledge");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [voted, setVoted] = useState(false);

  // FAQs State
  const [faqCategory, setFaqCategory] = useState("all");
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(null);
  const [loadingTicketDetail, setLoadingTicketDetail] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Ticket Form State
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketCategory, setTicketCategory] = useState("general");
  const [ticketPriority, setTicketPriority] = useState("medium");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketAttachment, setTicketAttachment] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccessMsg, setTicketSuccessMsg] = useState("");

  // Reply State
  const [replyText, setReplyText] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load Categories & Initial FAQs
  useEffect(() => {
    fetchCategories();
    fetchArticles();
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (activeTab === "tickets") {
      fetchUserTickets();
    }
  }, [activeTab]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/support/categories");
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const fetchArticles = async (catSlug?: string, query?: string) => {
    try {
      const params: Record<string, string> = {};
      if (catSlug) params.category = catSlug;
      if (query && query.trim()) params.q = query.trim();
      const res = await api.get("/support/articles", { params });
      setArticles(res.data);
    } catch (err) {
      console.error("Failed to load articles", err);
    }
  };

  const fetchFaqs = async (cat?: string, query?: string) => {
    try {
      const params: Record<string, string> = {};
      if (cat && cat !== "all") params.category = cat;
      if (query && query.trim()) params.q = query.trim();
      const res = await api.get("/support/faqs", { params });
      setFaqs(res.data.faqs || []);
    } catch (err) {
      console.error("Failed to load FAQs", err);
    }
  };

  const fetchUserTickets = async () => {
    try {
      const res = await api.get("/support/tickets");
      setTickets(res.data);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  const openArticle = async (slug: string) => {
    setLoadingArticle(true);
    setVoted(false);
    try {
      const res = await api.get(`/support/articles/${slug}`);
      setSelectedArticle(res.data);
    } catch (err) {
      console.error("Failed to load article detail", err);
    } finally {
      setLoadingArticle(false);
    }
  };

  const handleVoteArticle = async (slug: string) => {
    if (voted || !selectedArticle) return;
    try {
      await api.post(`/support/articles/${slug}/vote?helpful=true`);
      setVoted(true);
      setSelectedArticle({
        ...selectedArticle,
        helpful_count: selectedArticle.helpful_count + 1,
      });
    } catch (err) {
      console.error("Failed to vote", err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "knowledge") {
      fetchArticles(selectedCategory || undefined, searchQuery);
    } else if (activeTab === "faqs") {
      fetchFaqs(faqCategory, searchQuery);
    }
  };

  const openTicketDetail = async (ticketId: string) => {
    setLoadingTicketDetail(true);
    try {
      const res = await api.get(`/support/tickets/${ticketId}`);
      setSelectedTicket(res.data);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Failed to load ticket detail", err);
    } finally {
      setLoadingTicketDetail(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    setSubmittingTicket(true);
    setTicketSuccessMsg("");

    try {
      let attachmentUrl: string | undefined = undefined;

      // Upload attachment if present
      if (ticketAttachment) {
        setUploadingAttachment(true);
        const formData = new FormData();
        formData.append("file", ticketAttachment);
        const uploadRes = await api.post("/support/upload", formData);
        attachmentUrl = uploadRes.data.url;
        setUploadingAttachment(false);
      }

      const res = await api.post("/support/tickets", {
        subject: ticketSubject.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        description: ticketDescription.trim(),
        attachment_url: attachmentUrl,
      });

      setTicketSuccessMsg(res.data.message || `Ticket #${res.data.ticket_number} created successfully.`);
      // Reset form
      setTicketSubject("");
      setTicketDescription("");
      setTicketAttachment(null);
      fetchUserTickets();

      setTimeout(() => {
        setIsCreateModalOpen(false);
        setTicketSuccessMsg("");
        setActiveTab("tickets");
      }, 1800);
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      alert(err.response?.data?.detail || "Failed to create support ticket. Please try again.");
    } finally {
      setSubmittingTicket(false);
      setUploadingAttachment(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!replyText.trim() && !replyAttachment)) return;

    setSubmittingReply(true);
    try {
      let attachmentUrl: string | undefined = undefined;

      if (replyAttachment) {
        const formData = new FormData();
        formData.append("file", replyAttachment);
        const uploadRes = await api.post("/support/upload", formData);
        attachmentUrl = uploadRes.data.url;
      }

      await api.post(`/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText.trim() || "Sent an attachment.",
        attachment_url: attachmentUrl,
      });

      setReplyText("");
      setReplyAttachment(null);
      // Reload ticket detail
      await openTicketDetail(selectedTicket.id);
      fetchUserTickets();
    } catch (err: any) {
      console.error("Failed to post reply:", err);
      alert(err.response?.data?.detail || "Failed to send message.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Open</span>;
      case "in_progress":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">In Progress</span>;
      case "waiting_for_user":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Waiting for User</span>;
      case "resolved":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Resolved</span>;
      case "closed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-600">Closed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case "Settings": return <Settings className="w-5 h-5 text-emerald-600" />;
      case "Users": return <Users className="w-5 h-5 text-blue-600" />;
      case "Briefcase": return <Briefcase className="w-5 h-5 text-amber-600" />;
      case "FileText": return <FileText className="w-5 h-5 text-purple-600" />;
      case "CreditCard": return <CreditCard className="w-5 h-5 text-teal-600" />;
      case "ShieldCheck": return <Shield className="w-5 h-5 text-emerald-700" />;
      default: return <BookOpen className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 md:p-8 space-y-6">
      {/* ── Top Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 md:p-10 text-white shadow-xl">
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-medium backdrop-blur-sm border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Fastcase Support Desk & Knowledge Base
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">How can we assist your Chambers today?</h1>
          <p className="text-emerald-100/80 text-sm md:text-base leading-relaxed">
            Search our comprehensive knowledge base, explore practical step-by-step guides, check FAQs, or raise a dedicated support ticket directly to our legal tech engineering team.
          </p>

          {/* Instant Search Bar */}
          <form onSubmit={handleSearchSubmit} className="pt-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search guides, court boards, GST billing, bail drafts, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    fetchArticles(selectedCategory || undefined, "");
                    fetchFaqs(faqCategory, "");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm rounded-xl transition shadow-md"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Navigation Tabs & Quick Action ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab("knowledge"); setSelectedArticle(null); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "knowledge"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Knowledge Base & Guides
          </button>
          <button
            onClick={() => { setActiveTab("faqs"); setSelectedArticle(null); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "faqs"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileQuestion className="w-4 h-4" /> Frequently Asked Questions
          </button>
          <button
            onClick={() => { setActiveTab("tickets"); setSelectedArticle(null); }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === "tickets"
                ? "bg-emerald-800 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> My Support Tickets
            {tickets.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-600 text-white">
                {tickets.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow transition"
        >
          <PlusCircle className="w-4 h-4" /> Raise Support Ticket
        </button>
      </div>

      {/* ════════════════ TAB 1: KNOWLEDGE BASE ════════════════ */}
      {activeTab === "knowledge" && (
        <div className="space-y-6">
          {selectedArticle ? (
            /* Single Article Detailed View */
            <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="inline-flex items-center gap-2 text-sm text-emerald-700 font-medium hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Knowledge Base
                </button>
                <div className="text-xs text-slate-400">
                  Updated {new Date(selectedArticle.updated_at).toLocaleDateString()}
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">
                  {selectedArticle.category_name || "Guide"}
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2">
                  {selectedArticle.title}
                </h2>
                {selectedArticle.summary && (
                  <p className="text-slate-500 text-base mt-2">{selectedArticle.summary}</p>
                )}
              </div>

              {/* Markdown Content Renderer */}
              <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h3:text-lg prose-h4:text-base prose-p:text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-xl border border-slate-100">
                {selectedArticle.content}
              </div>

              {/* Was this helpful vote */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <div className="text-sm text-slate-500">
                  {selectedArticle.views_count} views &bull; {selectedArticle.helpful_count} found this helpful
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">Was this article helpful?</span>
                  <button
                    onClick={() => handleVoteArticle(selectedArticle.slug)}
                    disabled={voted}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      voted
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600"
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {voted ? "Thank you!" : "Yes, Helpful"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Category Cards Grid */}
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-3">Browse by Department</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => { setSelectedCategory(null); fetchArticles(undefined, searchQuery); }}
                    className={`p-4 rounded-xl border text-left transition flex items-start gap-3.5 ${
                      selectedCategory === null
                        ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                    }`}
                  >
                    <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900">All Categories</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Explore all step-by-step guides & tutorials</p>
                    </div>
                  </button>

                  {categories.map((c) => {
                    const isSelected = selectedCategory === c.slug;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          const nextCat = isSelected ? null : c.slug;
                          setSelectedCategory(nextCat);
                          fetchArticles(nextCat || undefined, searchQuery);
                        }}
                        className={`p-4 rounded-xl border text-left transition flex items-start gap-3.5 ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                        }`}
                      >
                        <div className="p-2.5 rounded-lg bg-slate-100">
                          {getCategoryIcon(c.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-slate-900 truncate">{c.name}</h4>
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              {c.article_count}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{c.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Articles List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedCategory
                      ? `Articles in ${categories.find(c => c.slug === selectedCategory)?.name || "Selected Topic"}`
                      : "Recommended Guides & Tutorials"}
                  </h3>
                  <span className="text-xs text-slate-500">{articles.length} article(s)</span>
                </div>

                {articles.length === 0 ? (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
                    No articles found matching your criteria. Try adjusting your search query or clear the filter.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {articles.map((art) => (
                      <div
                        key={art.id}
                        onClick={() => openArticle(art.slug)}
                        className="p-5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {art.category_name || "Guide"}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3 text-slate-400" /> {art.helpful_count}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 text-sm transition">
                            {art.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {art.summary}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 mt-3">
                          <span>Read Full Guide</span>
                          <ChevronRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ════════════════ TAB 2: FREQUENTLY ASKED QUESTIONS ════════════════ */}
      {activeTab === "faqs" && (
        <div className="space-y-6">
          {/* FAQ Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setFaqCategory(cat.key);
                  fetchFaqs(cat.key, searchQuery);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  faqCategory === cat.key
                    ? "bg-emerald-800 text-white shadow-sm"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accordion FAQ items */}
          <div className="space-y-3">
            {faqs.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
                No FAQs found for this section.
              </div>
            ) : (
              faqs.map((faq) => {
                const isOpen = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-xl border border-slate-200 overflow-hidden transition shadow-sm"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                      className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                    >
                      <span className="font-semibold text-sm text-slate-900">{faq.question}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isOpen ? "rotate-90 text-emerald-600" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs md:text-sm text-slate-600 border-t border-slate-100 pt-3 leading-relaxed whitespace-pre-wrap bg-slate-50/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ════════════════ TAB 3: SUPPORT TICKETS ════════════════ */}
      {activeTab === "tickets" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tickets List Column */}
          <div className={`${selectedTicket ? "lg:col-span-5 hidden lg:block" : "lg:col-span-12"} space-y-3`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Your Communication Threads</h3>
              <span className="text-xs text-slate-500">{tickets.length} ticket(s)</span>
            </div>

            {tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-semibold text-slate-800 text-sm">No Support Tickets Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Need help resolving an issue, requesting a feature, or asking a billing question? Our team responds quickly.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Create First Ticket
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => openTicketDetail(t.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {t.ticket_number}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 uppercase">
                            {t.category.replace("_", " ")}
                          </span>
                        </div>
                        {getStatusBadge(t.status)}
                      </div>

                      <h4 className="font-semibold text-sm text-slate-900 truncate">{t.subject}</h4>

                      {t.last_message && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          <span className="font-medium text-slate-600">
                            {t.last_message.is_support ? "Support: " : "You: "}
                          </span>
                          {t.last_message.message}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-100">
                        <span>Updated {new Date(t.updated_at).toLocaleDateString()}</span>
                        <span className="font-medium text-slate-600">
                          {t.message_count} message(s)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Ticket Conversation Thread Detail */}
          {selectedTicket && (
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[700px] overflow-hidden">
              {/* Thread Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-200 lg:hidden"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {selectedTicket.ticket_number}
                      </span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5 truncate max-w-md">
                      {selectedTicket.subject}
                    </h3>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Priority: </span>
                  <span className="font-semibold uppercase text-slate-700">{selectedTicket.priority}</span>
                </div>
              </div>

              {/* Thread Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                {selectedTicket.messages.map((m) => {
                  const isMe = !m.is_support;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400 px-1">
                        <span className="font-semibold text-slate-600">
                          {isMe ? "You" : m.sender_name || "Fastcase Support"}
                        </span>
                        <span>&bull;</span>
                        <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                          isMe
                            ? "bg-emerald-800 text-white rounded-tr-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        {m.message}

                        {m.attachment_url && (
                          <div className="mt-2.5 pt-2 border-t border-white/20">
                            <a
                              href={m.attachment_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold underline ${
                                isMe ? "text-emerald-200" : "text-emerald-700"
                              }`}
                            >
                              <Paperclip className="w-3.5 h-3.5" /> View Attached File
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="p-3 border-t border-slate-200 bg-white space-y-2">
                {replyAttachment && (
                  <div className="flex items-center justify-between text-xs bg-slate-100 p-2 rounded-lg">
                    <span className="truncate flex items-center gap-1 text-slate-700 font-medium">
                      <Paperclip className="w-3 h-3" /> {replyAttachment.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyAttachment(null)}
                      className="text-slate-400 hover:text-slate-600 ml-2"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={replyFileInputRef}
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReplyAttachment(e.target.files[0]);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => replyFileInputRef.current?.click()}
                    title="Attach screenshot or PDF"
                    className="p-2.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response or add clarification..."
                    className="flex-1 px-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <button
                    type="submit"
                    disabled={submittingReply || (!replyText.trim() && !replyAttachment)}
                    className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl shadow transition"
                  >
                    {submittingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ════════════════ MODAL: RAISE SUPPORT TICKET ════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Raise Support Ticket</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {ticketSuccessMsg ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">Ticket Submitted!</h4>
                <p className="text-xs text-slate-600">{ticketSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject / Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Issue generating high court bail draft"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {TICKET_CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(e) => setTicketPriority(e.target.value)}
                      className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      {TICKET_PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description & Steps to Reproduce <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Please provide details of the issue or your inquiry so our engineers can assist quickly..."
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* File Attachment Dropzone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Attach Screenshot or PDF (optional, max 10MB)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setTicketAttachment(e.target.files[0]);
                      }
                    }}
                  />
                  {ticketAttachment ? (
                    <div className="flex items-center justify-between p-2.5 border border-slate-200 bg-slate-50 rounded-lg text-xs">
                      <span className="truncate flex items-center gap-1.5 font-medium text-slate-700">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                        {ticketAttachment.name} ({(ticketAttachment.size / 1024).toFixed(0)} KB)
                      </span>
                      <button
                        type="button"
                        onClick={() => setTicketAttachment(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-3 px-4 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-emerald-500 hover:text-emerald-700 flex items-center justify-center gap-2 transition"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      Click to choose screenshot or PDF
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingTicket || !ticketSubject.trim() || !ticketDescription.trim()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow transition flex items-center gap-2"
                  >
                    {submittingTicket ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {uploadingAttachment ? "Uploading Attachment..." : "Creating Ticket..."}
                      </>
                    ) : (
                      "Submit Support Ticket"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

