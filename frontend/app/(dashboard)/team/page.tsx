"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users2, Mail, Phone, Briefcase, Plus, MoreHorizontal, Activity, Clock, FileText, Gavel, Folder, CheckCircle, IndianRupee, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { cn, getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTeamMembers, useTeamMemberStats, TeamMember, useRemoveTeamMember } from "@/lib/hooks/useTeam";

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  admin: { bg: "rgba(110,231,183,0.12)", color: "#065F46" },
  senior_advocate: { bg: "rgba(110,231,183,0.12)", color: "#065F46" },
  associate_advocate: { bg: "rgba(96,165,250,0.12)", color: "#1E40AF" },
  junior_advocate: { bg: "rgba(167,139,250,0.12)", color: "#5B21B6" },
  paralegal: { bg: "rgba(245,158,11,0.12)", color: "#92400E" },
  clerk: { bg: "rgba(107,114,128,0.12)", color: "#374151" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6EE7B7,#72D6C9)",
  "linear-gradient(135deg,#60A5FA,#818CF8)",
  "linear-gradient(135deg,#F472B6,#FB7185)",
  "linear-gradient(135deg,#A78BFA,#C084FC)",
  "linear-gradient(135deg,#F59E0B,#FCD34D)",
];

export default function TeamPage() {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const { data: teamData, isLoading } = useTeamMembers();
  const { data: memberStats, isLoading: isLoadingStats } = useTeamMemberStats(selectedMember?.id || null);
  const removeMember = useRemoveTeamMember();

  const confirmRemove = async () => {
    if (!memberToDelete) return;
    try {
      await removeMember.mutateAsync(memberToDelete.id);
      toast.success("Member removed successfully");
      setMemberToDelete(null);
      setSelectedMember(null); // close dashboard too
    } catch (err) {
      toast.error("Failed to remove member");
    }
  };

  const TEAM = teamData?.team || [];

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Team Collaboration" subtitle="Manage your firm's advocates and staff" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[13px] text-muted">{TEAM.length} team members</div>
          <button 
            onClick={() => setShowInviteModal(true)}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5" 
            style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Invite Member
          </button>
        </div>

        {isLoading ? (
          <FormSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {TEAM.map((member, i) => {
              const rc = ROLE_COLORS[member.role] || ROLE_COLORS.clerk;
              return (
                <motion.div key={member.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  onClick={() => setSelectedMember(member)}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold text-[#013B36] flex-shrink-0" style={{ background: AVATAR_GRADIENTS[i % 5] }}>
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-charcoal">{member.name}</div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: rc.bg, color: rc.color }}>{(member.role || 'clerk').replace('_', ' ')}</span>
                      </div>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={cn("w-1.5 h-1.5 rounded-full", member.workingStatus === "Available" ? "bg-emerald-500" : "bg-amber-500")} />
                    <span className="text-[11px] font-medium text-gray-600">{member.workingStatus}</span>
                  </div>

                  <div className="space-y-2 mb-4 px-1">
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <Mail className="w-3 h-3" /><span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <Phone className="w-3 h-3" /><span>{member.phone || "No phone added"}</span>
                    </div>
                    {member.barNo && (
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <Briefcase className="w-3 h-3" /><span>Bar No: {member.barNo}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-50">
                    <div className="text-center bg-gray-50 rounded-lg py-2">
                      <div className="text-[14px] font-bold text-gray-900">{member.activeCases + member.pendingCases}</div>
                      <div className="text-[9px] text-gray-500 font-medium uppercase mt-0.5">Assigned</div>
                    </div>
                    <div className="text-center bg-amber-50 rounded-lg py-2">
                      <div className="text-[14px] font-bold text-amber-700">{member.todayHearings}</div>
                      <div className="text-[9px] text-amber-600 font-medium uppercase mt-0.5">Hearings</div>
                    </div>
                    <div className="text-center bg-indigo-50 rounded-lg py-2">
                      <div className="text-[14px] font-bold text-indigo-700">{member.activeTasks}</div>
                      <div className="text-[9px] text-indigo-600 font-medium uppercase mt-0.5">Tasks</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Team Member" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
            <input placeholder="colleague@firm.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
            <select className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint">
              <option>Partner</option>
              <option>Senior Associate</option>
              <option>Associate</option>
              <option>Paralegal</option>
              <option>Clerk</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowInviteModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            <button onClick={() => setShowInviteModal(false)} className="rounded-xl bg-sidebar px-4 py-2 text-sm font-semibold text-white hover:bg-sidebar-dark">Send Invite</button>
          </div>
        </div>
      </Modal>

      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Advocate Performance Dashboard" size="xl">
        {selectedMember && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-[#013B36] flex-shrink-0" style={{ background: "rgba(110,231,183,0.15)" }}>
                  {getInitials(selectedMember.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedMember.name}</h3>
                  <p className="text-sm font-medium text-sidebar capitalize">{(selectedMember.role || 'clerk').replace('_', ' ')}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn("w-2 h-2 rounded-full", selectedMember.workingStatus === "Available" ? "bg-green-500" : "bg-amber-500")} />
                    <span className="text-xs text-gray-600">{selectedMember.workingStatus}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => router.push(`/settings?tab=letterhead`)}
                className="px-4 py-2 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Letterhead Settings
              </button>
            </div>

            {/* Live Queue */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Live Work Queue</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Briefcase className="w-4 h-4" /> <span className="text-xs font-semibold">Active Cases</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{selectedMember.activeCases}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <FileText className="w-4 h-4" /> <span className="text-xs font-semibold">Pending Drafts</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{selectedMember.pendingDrafts}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Folder className="w-4 h-4" /> <span className="text-xs font-semibold">Pending Filings</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{selectedMember.pendingFilings}</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CheckCircle className="w-4 h-4" /> <span className="text-xs font-semibold">Active Tasks</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">{selectedMember.activeTasks}</div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Historical Performance</h4>
              {isLoadingStats ? (
                <FormSkeleton />
              ) : memberStats ? (
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-xs font-semibold text-indigo-700 mb-1">Cases Assigned</div>
                    <div className="text-2xl font-bold text-indigo-900">{memberStats.cases_assigned}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-xs font-semibold text-emerald-700 mb-1">Cases Closed</div>
                    <div className="text-2xl font-bold text-emerald-900">{memberStats.cases_closed}</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="text-xs font-semibold text-amber-700 mb-1">Hearings Attended</div>
                    <div className="text-2xl font-bold text-amber-900">{memberStats.hearings_attended}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="text-xs font-semibold text-green-700 mb-1">Revenue Generated</div>
                    <div className="text-2xl font-bold text-green-900">₹{memberStats.revenue_generated.toLocaleString("en-IN")}</div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500">Failed to load performance stats</div>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact Details</h4>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" /> {selectedMember.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" /> {selectedMember.phone || "N/A"}
              </div>
              {selectedMember.barNo && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Briefcase className="w-4 h-4 text-gray-400" /> Bar No: {selectedMember.barNo}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setMemberToDelete(selectedMember)}
                disabled={removeMember.isPending}
                className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Remove Member
              </button>
              <button onClick={() => setSelectedMember(null)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Close Dashboard</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!memberToDelete} onClose={() => setMemberToDelete(null)} title="Remove Team Member" size="sm">
        <div className="space-y-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Remove {memberToDelete?.name}?</h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to remove this team member? They will lose access to the workspace immediately.
            </p>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button onClick={() => setMemberToDelete(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={confirmRemove} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors" disabled={removeMember.isPending}>Remove Member</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
