"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { LifeBuoy, Search, Filter, MessageSquare, Clock, CheckCircle2, User, Building2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SupportDeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  
  // Ticket detail view
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [ticketDetails, setTicketDetails] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
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
      const res = await api.get(`/admin/support?status=${activeTab}`);
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
      await api.post(`/admin/support/${selectedTicketId}/reply`, { message: replyMessage });
      toast.success("Reply sent");
      setReplyMessage("");
      fetchTicketDetails(selectedTicketId);
      fetchTickets(); // Refresh list to update status if it changed
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
      toast.success(`Ticket marked as ${status.replace('_', ' ')}`);
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
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-gray-100 text-gray-700';
      case 'closed': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <Toaster position="top-right" />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Desk</h1>
          <p className="text-gray-500 mt-1">Manage and resolve tenant support tickets.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-4">
        {[
          { id: "all", label: "All Tickets" },
          { id: "open", label: "Open" },
          { id: "in_progress", label: "In Progress" },
          { id: "resolved", label: "Resolved" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex">
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
                "w-full text-left p-5 border-b border-gray-200 transition-colors hover:bg-gray-50",
                selectedTicketId === ticket.id ? "bg-indigo-50/50 border-l-4 border-l-indigo-600" : "border-l-4 border-l-transparent"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", getPriorityColor(ticket.priority))}>
                  {ticket.priority}
                </span>
                <span className="text-xs text-gray-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-1 truncate">{ticket.subject}</h3>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{ticket.user_name}</span>
                </div>
                <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded-md", getStatusColor(ticket.status))}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            </button>
          ))}
          {tickets.length === 0 && !loading && (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 text-gray-300 mb-3" />
              <p className="font-medium text-gray-900">Inbox Zero!</p>
              <p className="text-sm">No tickets found in this view.</p>
            </div>
          )}
        </div>

        {/* Ticket Detail View */}
        {selectedTicketId && ticketDetails && (
          <div className="flex-1 flex flex-col bg-white">
            <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={cn("text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border", getPriorityColor(ticketDetails.priority))}>
                    {ticketDetails.priority} Priority
                  </span>
                  <span className="text-sm font-bold text-gray-400 capitalize">&bull; {ticketDetails.category}</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">{ticketDetails.subject}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1.5"><User className="w-4 h-4 text-gray-400" /> {ticketDetails.user_name}</div>
                  <div className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> {ticketDetails.firm_name}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> {new Date(ticketDetails.created_at).toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <button onClick={() => setSelectedTicketId(null)} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => updateStatus('in_progress')} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", ticketDetails.status === 'in_progress' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>In Progress</button>
                  <button onClick={() => updateStatus('resolved')} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", ticketDetails.status === 'resolved' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>Resolved</button>
                  <button onClick={() => updateStatus('closed')} className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", ticketDetails.status === 'closed' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}>Closed</button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {ticketDetails.messages.map((msg: any) => (
                <div key={msg.id} className={cn("flex", msg.is_admin ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl p-5 shadow-sm",
                    msg.is_admin ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white border border-gray-200 text-gray-900 rounded-tl-sm"
                  )}>
                    <div className="flex justify-between items-center mb-2 gap-4">
                      <span className={cn("text-xs font-bold", msg.is_admin ? "text-indigo-200" : "text-gray-500")}>
                        {msg.sender_name} {msg.is_admin && "(Staff)"}
                      </span>
                      <span className={cn("text-[10px]", msg.is_admin ? "text-indigo-300" : "text-gray-400")}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <div className="relative">
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply to the tenant..."
                  className="w-full pl-4 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none text-sm"
                  rows={3}
                  disabled={ticketDetails.status === 'closed'}
                />
                <button
                  onClick={handleReply}
                  disabled={replying || !replyMessage.trim() || ticketDetails.status === 'closed'}
                  className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {ticketDetails.status === 'closed' && (
                <p className="text-xs text-red-500 font-medium mt-2 text-center">This ticket is closed. You cannot reply.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
