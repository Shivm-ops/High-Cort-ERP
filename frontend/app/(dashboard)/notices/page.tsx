"use client";
import React from "react";
import { motion } from "framer-motion";
import { Mail, Plus, Search, Send, Clock, CheckCircle, AlertTriangle, UploadCloud, Calendar, FileText } from "lucide-react";
import Header from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NOTICES: any[] = [];

export default function NoticesPage() {
  const router = useRouter();
  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Notices & Replies" subtitle="Legal notice tracking and reply management" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" /><input placeholder="Search notices…" className="h-9 pl-9 pr-3 rounded-xl text-[13px] bg-white border border-gray-100 focus:outline-none text-charcoal placeholder:text-muted w-52" /></div>
          </div>
          <button onClick={() => router.push("/notices/reply-builder")} className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-2 shadow-sm transition-transform hover:scale-105" style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" }}>
            <UploadCloud className="w-4 h-4" strokeWidth={2.5} /> Upload & Generate Reply
          </button>
        </div>
        <div className="space-y-3">
          {NOTICES.map((n, i) => (
            <motion.div 
              key={n.id} 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.06 }}
              onClick={() => router.push("/notices/reply-builder")}
              className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-mint/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: n.status === "reply_due" ? "rgba(239,68,68,0.1)" : "rgba(110,231,183,0.1)" }}>
                    <FileText className="w-5 h-5" style={{ color: n.status === "reply_due" ? "#DC2626" : "#6EE7B7" }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-charcoal">{n.subject}</div>
                    <div className="text-[12px] text-muted font-medium mt-0.5">{n.type} · Opponent: {n.opponent}</div>
                    <div className="flex items-center gap-6 mt-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Calendar className="w-3.5 h-3.5" /> Received: <span className="font-medium text-charcoal">{n.receivedDate}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Clock className="w-3.5 h-3.5" /> Due By: <span className={cn("font-medium", n.status === "reply_due" ? "text-red-600" : "text-charcoal")}>{n.replyDeadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        <Send className="w-3.5 h-3.5" /> Status: <span className="font-medium text-charcoal">{n.deliveryStatus}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between h-full py-1">
                  {n.status === "sent" && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg badge-hearing">Sent</span>}
                  {n.status === "reply_due" && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg badge-urgent">Reply Overdue</span>}
                  {n.status === "replied" && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg badge-active">Replied</span>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
