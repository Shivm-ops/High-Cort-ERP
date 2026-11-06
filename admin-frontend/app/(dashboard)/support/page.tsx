"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import {
  LifeBuoy,
  Search,
  Filter,
  MessageSquare,
  Clock,
  CheckCircle2,
  User,
  Building2,
  Send,
  X,
  Paperclip,
  Phone,
  Mail,
  Lock,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupportDeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ticket detail view
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [activeTab]);

  useEffect(() => {
    if (selectedTicketId) {
      fetchTicketDetails(selectedTicketId);
    }
  }, [selectedTicketId]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let url = `/admin/support?status=${activeTab}`;
      if (searchQuery.trim()) {
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await api.get(url);
      setTickets(res.data);
    } catch (err) {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (id: string) => {
    try {
      const res = await api.get(`/admin/support/${id}`);
      setTicketDetails(res.data);
    } catch (err) {
      toast.error("Failed to load ticket details");
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicketId) return;
    setReplying(true);
    try {
      await api.post(`/admin/support/${selectedTicketId}/reply`, {
        message: replyMessage,
        is_internal: isInternalNote,
      });
      toast.success(isInternalNote ? "Internal note saved" : "Reply sent & email notification dispatched to advocate");
      setReplyMessage("");
      setIsInternalNote(false);
      fetchTicketDetails(selectedTicketId);
      fetchTickets();
    } catch (err) {
      toast.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedTicketId) return;
    try {
      await api.put(`/admin/support/${selectedTicketId}/status`, { status });
      toast.success(`Ticket marked as ${status.replace('_', ' ')} (Advocate notified)`);
      fetchTicketDetails(selectedTicketId);
      fetchTickets();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'waiting_for_user': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-gray-100 text-gray-700';
      case 'closed': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col space-y-4">
      <Toaster position="top-right" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advocate Support Desk</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage, review attachments, assign, and respond to law firm support inquiries.</p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket #, advocate, or firm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <button
            onClick={fetchTickets}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        {[
          { id: "all", label: "All Tickets" },
          { id: "open", label: "Open" },
          { id: "in_progress", label: "In Progress" },
          { id: "waiting_for_user", label: "Waiting for Advocate" },
          { id: "resolved", label: "Resolved" },
          { id: "closed", label: "Closed" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex min-h-[600px]">
        {/* Ticket List */}
        <div className={cn(
          "flex-col border-r border-gray-200 overflow-y-auto bg-gray-50/30",
          selectedTicketId ? "w-1/3 hidden lg:flex" : "w-full flex"
        )}>
          {tickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className={cn(
                "w-full text-left p-4 border-b border-gray-200 transition-colors hover:bg-gray-50",
                selectedTicketId === ticket.id ? "bg-indigo-50/50 border-l-4 border-l-indigo-600" : "border-l-4 border-l-transparent"
              )}
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {ticket.ticket_number || `FC-${ticket.id.slice(0, 5).toUpperCase()}`}
                  </span>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", getPriorityColor(ticket.priority))}>
                    {ticket.priority}
                  </span>
                </div>
                <span className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>

              <h3 className="font-bold text-gray-900 mb-1 text-sm truncate">{ticket.subject}</h3>
              
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="truncate max-w-[130px]">{ticket.user_name}</span>
                </div>
                <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-md", getStatusColor(ticket.status))}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            </button>
          ))}
          {tickets.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">No Tickets Found</p>
              <p className="text-sm">There are no inquiries under this filter.</p>
            </div>
          )}
        </div>

        {/* Ticket Detail View */}
        {selectedTicketId && ticketDetails && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded">
                    {ticketDetails.ticket_number}
                  </span>
                  <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", getPriorityColor(ticketDetails.priority))}>
                    {ticketDetails.priority}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                    {ticketDetails.category.replace('_', ' ')}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">{ticketDetails.subject}</h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 font-medium"><User className="w-3.5 h-3.5 text-gray-400" /> {ticketDetails.user_name}</div>
                  {ticketDetails.user_email && (
                    <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {ticketDetails.user_email}</div>
                  )}
                  {ticketDetails.user_phone && (
                    <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {ticketDetails.user_phone}</div>
                  )}
                  <div className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-gray-400" /> {ticketDetails.firm_name}</div>
                </div>

                {/* Primary Attachment */}
                {ticketDetails.attachment_url && (
                  <div className="mt-3">
                    <a
                      href={ticketDetails.attachment_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition"
                    >
                      <Paperclip className="w-3.5 h-3.5" /> View Ticket Attachment (Screenshot / PDF)
                    </a>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-2.5">
                <button onClick={() => setSelectedTicketId(null)} className="lg:hidden p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => updateStatus('in_progress')} className={cn("px-2.5 py-1 text-xs font-bold rounded-md transition-colors", ticketDetails.status === 'in_progress' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>In Progress</button>
                  <button onClick={() => updateStatus('waiting_for_user')} className={cn("px-2.5 py-1 text-xs font-bold rounded-md transition-colors", ticketDetails.status === 'waiting_for_user' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>Waiting</button>
                  <button onClick={() => updateStatus('resolved')} className={cn("px-2.5 py-1 text-xs font-bold rounded-md transition-colors", ticketDetails.status === 'resolved' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>Resolved</button>
                  <button onClick={() => updateStatus('closed')} className={cn("px-2.5 py-1 text-xs font-bold rounded-md transition-colors", ticketDetails.status === 'closed' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>Closed</button>
                </div>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
              {ticketDetails.messages.map((msg: any) => (
                <div key={msg.id} className={cn("flex", msg.is_admin ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl p-4 shadow-sm",
                    msg.is_internal
                      ? "bg-amber-50 border border-amber-200 text-amber-900"
                      : msg.is_admin
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-white border border-gray-200 text-gray-900 rounded-tl-sm"
                  )}>
                    <div className="flex justify-between items-center mb-1.5 gap-4">
                      <span className={cn(
                        "text-xs font-bold flex items-center gap-1",
                        msg.is_internal ? "text-amber-800" : msg.is_admin ? "text-indigo-200" : "text-gray-500"
                      )}>
                        {msg.is_internal && <Lock className="w-3 h-3 text-amber-600" />}
                        {msg.sender_name} {msg.is_admin && !msg.is_internal && "(Staff)"} {msg.is_internal && "(Internal Staff Note)"}
                      </span>
                      <span className={cn("text-[10px]", msg.is_internal ? "text-amber-700" : msg.is_admin ? "text-indigo-300" : "text-gray-400")}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">{msg.message}</p>
                    {msg.attachment_url && (
                      <div className="mt-2 pt-2 border-t border-gray-200/40">
                        <a
                          href={msg.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold underline"
                        >
                          <Paperclip className="w-3 h-3" /> Attached File
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply / Internal Note Input */}
            <div className="p-4 bg-white border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Post as <strong>Internal Note</strong> (hidden from advocate)</span>
                </label>
                <span className="text-[11px] text-gray-400">
                  {isInternalNote ? "Staff visible only" : "Sends email alert to advocate"}
                </span>
              </div>

              <div className="relative">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={isInternalNote ? "Type internal staff note..." : "Type reply to advocate (will trigger email notification)..."}
                  className={cn(
                    "w-full pl-4 pr-16 py-3 border rounded-xl focus:outline-none focus:ring-2 resize-none text-xs md:text-sm",
                    isInternalNote
                      ? "bg-amber-50/50 border-amber-300 focus:ring-amber-500"
                      : "bg-gray-50 border-gray-200 focus:ring-indigo-500 focus:bg-white"
                  )}
                  rows={3}
                  disabled={ticketDetails.status === 'closed'}
                />
                <button
                  onClick={handleReply}
                  disabled={replying || !replyMessage.trim() || ticketDetails.status === 'closed'}
                  className={cn(
                    "absolute bottom-3 right-3 p-2 text-white rounded-lg transition-colors disabled:bg-gray-300",
                    isInternalNote ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {ticketDetails.status === 'closed' && (
                <p className="text-xs text-red-500 font-medium mt-1 text-center">This ticket is closed. Reopen to reply.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
