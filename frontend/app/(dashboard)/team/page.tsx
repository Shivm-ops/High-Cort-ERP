"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users2,
  Mail,
  Phone,
  Briefcase,
  Plus,
  Edit3,
  FileText,
  Folder,
  CheckCircle,
  Trash2,
  Search,
  Copy,
  CheckCircle2,
  Loader2,
  CalendarDays,
  ListTodo,
  KeyRound,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { cn, getInitials } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/store/authStore";
import {
  useTeamMembers,
  useTeamMemberStats,
  useCreateTeamMember,
  useUpdateTeamMember,
  useRemoveTeamMember,
  type TeamMember,
  type CreateTeamMemberResponse,
} from "@/lib/hooks/useTeam";

const ROLE_META: Record<
  string,
  { label: string; bg: string; color: string }
> = {
  admin: { label: "Firm Admin", bg: "rgba(110,231,183,0.18)", color: "#065F46" },
  senior_advocate: {
    label: "Senior Advocate",
    bg: "rgba(16,185,129,0.14)",
    color: "#065F46",
  },
  associate_advocate: {
    label: "Associate Advocate",
    bg: "rgba(59,130,246,0.12)",
    color: "#1E40AF",
  },
  junior_advocate: {
    label: "Junior Advocate",
    bg: "rgba(139,92,246,0.12)",
    color: "#5B21B6",
  },
  paralegal: {
    label: "Paralegal",
    bg: "rgba(245,158,11,0.14)",
    color: "#92400E",
  },
  clerk: {
    label: "Clerk",
    bg: "rgba(107,114,128,0.12)",
    color: "#374151",
  },
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Firm Admin" },
  { value: "senior_advocate", label: "Senior Advocate" },
  { value: "associate_advocate", label: "Associate Advocate" },
  { value: "junior_advocate", label: "Junior Advocate" },
  { value: "paralegal", label: "Paralegal" },
  { value: "clerk", label: "Clerk" },
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#6EE7B7,#72D6C9)",
  "linear-gradient(135deg,#60A5FA,#818CF8)",
  "linear-gradient(135deg,#F472B6,#FB7185)",
  "linear-gradient(135deg,#A78BFA,#C084FC)",
  "linear-gradient(135deg,#F59E0B,#FCD34D)",
];

function getRoleMeta(role?: string) {
  const key = (role || "associate_advocate").toLowerCase();
  return (
    ROLE_META[key] || {
      label: key.replace(/_/g, " "),
      bg: "rgba(107,114,128,0.12)",
      color: "#374151",
    }
  );
}

export default function TeamPage() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Invite Modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("associate_advocate");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteBarNo, setInviteBarNo] = useState("");
  const [inviteSpecs, setInviteSpecs] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [createdCredentials, setCreatedCredentials] =
    useState<CreateTeamMemberResponse | null>(null);

  // Edit Modal
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("associate_advocate");
  const [editPhone, setEditPhone] = useState("");
  const [editBarNo, setEditBarNo] = useState("");
  const [editSpecs, setEditSpecs] = useState("");

  // Detail & Delete Modals
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

  const { data: teamData, isLoading } = useTeamMembers();
  const { data: memberStats, isLoading: isLoadingStats } = useTeamMemberStats(
    selectedMember?.id || null
  );
  const createMember = useCreateTeamMember();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();

  const team = teamData?.team ?? [];
  const totalMembers = teamData?.total ?? team.length;
  const seatLimit = teamData?.seat_limit ?? null;
  const canManageTeam = teamData?.can_manage_team ?? true;

  const firmSummary = useMemo(() => {
    return team.reduce(
      (acc, m) => ({
        assigned: acc.assigned + m.activeCases + m.pendingCases,
        hearings: acc.hearings + m.todayHearings,
        tasks: acc.tasks + m.activeTasks,
      }),
      { assigned: 0, hearings: 0, tasks: 0 }
    );
  }, [team]);

  const filteredTeam = useMemo(() => {
    const q = search.trim().toLowerCase();
    return team.filter((m) => {
      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        (m.barNo && m.barNo.toLowerCase().includes(q));
      return matchesRole && matchesSearch;
    });
  }, [team, search, roleFilter]);

  const openInviteModal = () => {
    setCreatedCredentials(null);
    setInviteName("");
    setInviteEmail("");
    setInviteRole("associate_advocate");
    setInvitePhone("");
    setInviteBarNo("");
    setInviteSpecs("");
    setInvitePassword("");
    setShowInviteModal(true);
  };

  const openEditModal = (m: TeamMember) => {
    setEditingMember(m);
    setEditName(m.name);
    setEditRole(m.role || "associate_advocate");
    setEditPhone(m.phone || "");
    setEditBarNo(m.barNo || "");
    setEditSpecs((m.specializations || []).join(", "));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast.error("Please enter both Full Name and Email");
      return;
    }
    const specs = inviteSpecs
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const res = await createMember.mutateAsync({
      full_name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      phone: invitePhone.trim() || undefined,
      bar_council_no: inviteBarNo.trim() || undefined,
      specializations: specs,
      password: invitePassword.trim() || undefined,
    });
    setCreatedCredentials(res);
    toast.success(`${res.member.name} added to your team`);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) {
      toast.error("Full name cannot be empty");
      return;
    }
    const specs = editSpecs
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updated = await updateMember.mutateAsync({
      id: editingMember.id,
      full_name: editName.trim(),
      role: canManageTeam ? editRole : undefined,
      phone: editPhone.trim(),
      bar_council_no: editBarNo.trim(),
      specializations: specs,
    });
    if (selectedMember?.id === editingMember.id) {
      setSelectedMember(updated);
    }
    setEditingMember(null);
  };

  const confirmRemove = async () => {
    if (!memberToDelete) return;
    await removeMember.mutateAsync(memberToDelete.id);
    setMemberToDelete(null);
    setSelectedMember(null);
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header
        title="Team Collaboration"
        subtitle="Manage advocates, clerks, roles, credentials, and firm workload"
        rightContent={
          canManageTeam ? (
            <button
              onClick={openInviteModal}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold flex items-center gap-1.5 shadow-sm transition-transform hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
                color: "#013B36",
              }}
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              Invite Member
            </button>
          ) : null
        }
      />

      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        {/* Firm Workload Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-mint/15 text-mint-dark flex items-center justify-center shrink-0">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {totalMembers}
                {seatLimit ? (
                  <span className="text-[13px] font-semibold text-muted ml-1">
                    / {seatLimit}
                  </span>
                ) : null}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Active {totalMembers === 1 ? "Member" : "Members"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {firmSummary.assigned}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Assigned Cases
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {firmSummary.hearings}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Today&apos;s Hearings
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3.5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[22px] font-bold text-charcoal leading-tight">
                {firmSummary.tasks}
              </div>
              <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                Active Tasks
              </div>
            </div>
          </div>
        </div>

        {/* Search & Role Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone, Bar No..."
              className="w-full h-9 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-mint/50 text-charcoal"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setRoleFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-colors",
                roleFilter === "all"
                  ? "bg-mint/15 border-mint/40 text-mint-dark"
                  : "bg-white border-gray-100 text-muted hover:text-charcoal"
              )}
            >
              All ({team.length})
            </button>
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setRoleFilter(r.value)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition-colors",
                  roleFilter === r.value
                    ? "bg-mint/15 border-mint/40 text-mint-dark"
                    : "bg-white border-gray-100 text-muted hover:text-charcoal"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <FormSkeleton />
        ) : filteredTeam.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <Users2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <div className="text-[15px] font-bold text-charcoal mb-1">
              No matching team members
            </div>
            <p className="text-[13px] text-muted mb-4">
              Adjust your search or role filter, or invite a colleague to join your chambers.
            </p>
            {(search || roleFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setRoleFilter("all");
                }}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold bg-gray-100 hover:bg-gray-200 text-charcoal"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTeam.map((member, i) => {
              const rc = getRoleMeta(member.role);
              const isSelf = authUser?.id === member.id;
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedMember(member)}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-mint/40 transition-all cursor-pointer group flex flex-col"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-[13px] font-bold text-[#013B36] flex-shrink-0"
                        style={{ background: AVATAR_GRADIENTS[i % 5] }}
                      >
                        {getInitials(member.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-semibold text-charcoal truncate">
                            {member.name}
                          </span>
                          {isSelf && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              You
                            </span>
                          )}
                        </div>
                        <span
                          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1"
                          style={{ background: rc.bg, color: rc.color }}
                        >
                          {rc.label}
                        </span>
                      </div>
                    </div>

                    {(canManageTeam || isSelf) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(member);
                        }}
                        className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-charcoal transition-colors shrink-0"
                        title="Edit Member"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3 px-0.5">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        member.workingStatus === "Available"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="text-[11px] font-medium text-gray-600">
                      {member.workingStatus}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3 px-0.5">
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      <Phone className="w-3 h-3 shrink-0" />
                      <span>{member.phone || "No phone added"}</span>
                    </div>
                    {member.barNo && (
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <Briefcase className="w-3 h-3 shrink-0" />
                        <span>Bar No: {member.barNo}</span>
                      </div>
                    )}
                  </div>

                  {member.specializations && member.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {member.specializations.slice(0, 3).map((sp) => (
                        <span
                          key={sp}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-gray-600"
                        >
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-gray-50">
                    <div className="text-center bg-gray-50 rounded-lg py-2">
                      <div className="text-[14px] font-bold text-gray-900">
                        {member.activeCases + member.pendingCases}
                      </div>
                      <div className="text-[9px] text-gray-500 font-medium uppercase mt-0.5">
                        Assigned
                      </div>
                    </div>
                    <div className="text-center bg-amber-50 rounded-lg py-2">
                      <div className="text-[14px] font-bold text-amber-700">
                        {member.todayHearings}
                      </div>
                      <div className="text-[9px] text-amber-600 font-medium uppercase mt-0.5">
                        Hearings
                      </div>
                    </div>
                    <div className="text-center bg-indigo-50 rounded-lg py-2">
                      <div className="text-[14px] font-bold text-indigo-700">
                        {member.activeTasks}
                      </div>
                      <div className="text-[9px] text-indigo-600 font-medium uppercase mt-0.5">
                        Tasks
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Invite Team Member Modal */}
      <Modal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title={
          createdCredentials
            ? "Team Member Account Created"
            : "Invite Team Member"
        }
        size="md"
      >
        {createdCredentials ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[12px] text-emerald-900">
                <div className="font-bold text-[13px] mb-1">
                  {createdCredentials.member.name} has been added!
                </div>
                Share the login credentials below securely so they can sign in right away.
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2 text-[13px]">
              <div className="flex justify-between">
                <span className="text-muted">Email:</span>
                <span className="font-semibold text-charcoal">
                  {createdCredentials.member.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Temporary Password:</span>
                <span className="font-mono font-bold text-charcoal">
                  {createdCredentials.temporary_password}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Role:</span>
                <span className="font-semibold text-charcoal">
                  {getRoleMeta(createdCredentials.member.role).label}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  const text = `Fastcase Chambers Login\nEmail: ${createdCredentials.member.email}\nTemporary Password: ${createdCredentials.temporary_password}`;
                  navigator.clipboard.writeText(text);
                  toast.success("Login credentials copied");
                }}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-charcoal flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Credentials
              </button>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="h-9 px-5 rounded-xl text-[12px] font-semibold bg-sidebar text-white hover:bg-sidebar-dark"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Full Name *
                </label>
                <input
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Adv. Priya Kulkarni"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="priya@firm.in"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] bg-white outline-none focus:border-mint"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Phone Number
                </label>
                <input
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="+91 98XXXXXXXX"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1">
                  Bar Council Enrollment No.
                </label>
                <input
                  value={inviteBarNo}
                  onChange={(e) => setInviteBarNo(e.target.value)}
                  placeholder="MAH/1234/2021"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-muted mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Temporary Password (Optional)
                </label>
                <input
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                  className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Practice Specializations (Comma separated)
              </label>
              <input
                value={inviteSpecs}
                onChange={(e) => setInviteSpecs(e.target.value)}
                placeholder="Civil Litigation, Criminal, RERA"
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="h-9 px-4 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMember.isPending}
                className="h-9 px-5 rounded-xl bg-sidebar text-white text-[12px] font-semibold hover:bg-sidebar-dark disabled:opacity-60 flex items-center gap-1.5"
              >
                {createMember.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Add Member
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Team Member Modal */}
      <Modal
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title="Edit Team Member"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Full Name *
              </label>
              <input
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Role
              </label>
              <select
                value={editRole}
                disabled={!canManageTeam}
                onChange={(e) => setEditRole(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] bg-white outline-none focus:border-mint disabled:bg-gray-50"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Phone Number
              </label>
              <input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-muted mb-1">
                Bar Council Enrollment No.
              </label>
              <input
                value={editBarNo}
                onChange={(e) => setEditBarNo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-muted mb-1">
              Specializations (Comma separated)
            </label>
            <input
              value={editSpecs}
              onChange={(e) => setEditSpecs(e.target.value)}
              placeholder="Civil, Criminal, Family"
              className="w-full h-10 px-3 rounded-xl border border-gray-200 text-[13px] outline-none focus:border-mint"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setEditingMember(null)}
              className="h-9 px-4 rounded-xl border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMember.isPending}
              className="h-9 px-5 rounded-xl bg-sidebar text-white text-[12px] font-semibold hover:bg-sidebar-dark disabled:opacity-60 flex items-center gap-1.5"
            >
              {updateMember.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Advocate Performance Dashboard Modal */}
      <Modal
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMember(null)}
        title="Advocate Performance Dashboard"
        size="xl"
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-[#013B36] flex-shrink-0"
                  style={{ background: "rgba(110,231,183,0.18)" }}
                >
                  {getInitials(selectedMember.name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedMember.name}
                  </h3>
                  <p className="text-sm font-medium text-sidebar">
                    {getRoleMeta(selectedMember.role).label}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        selectedMember.workingStatus === "Available"
                          ? "bg-green-500"
                          : "bg-amber-500"
                      )}
                    />
                    <span className="text-xs text-gray-600">
                      {selectedMember.workingStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(canManageTeam || authUser?.id === selectedMember.id) && (
                  <button
                    onClick={() => openEditModal(selectedMember)}
                    className="px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-charcoal"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Details
                  </button>
                )}
                <button
                  onClick={() => router.push(`/settings?tab=letterhead`)}
                  className="px-3.5 py-2 bg-sidebar/5 text-sidebar hover:bg-sidebar/10 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" /> Letterhead Settings
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Live Work Queue
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-xs font-semibold">Active Cases</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {selectedMember.activeCases}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-semibold">Pending Drafts</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {selectedMember.pendingDrafts}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Folder className="w-4 h-4" />
                    <span className="text-xs font-semibold">
                      Pending Filings
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {selectedMember.pendingFilings}
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold">Active Tasks</span>
                  </div>
                  <div className="text-xl font-bold text-gray-900">
                    {selectedMember.activeTasks}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                Historical Performance
              </h4>
              {isLoadingStats ? (
                <FormSkeleton />
              ) : memberStats ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="text-xs font-semibold text-indigo-700 mb-1">
                      Cases Assigned
                    </div>
                    <div className="text-2xl font-bold text-indigo-900">
                      {memberStats.cases_assigned}
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="text-xs font-semibold text-emerald-700 mb-1">
                      Cases Closed
                    </div>
                    <div className="text-2xl font-bold text-emerald-900">
                      {memberStats.cases_closed}
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="text-xs font-semibold text-amber-700 mb-1">
                      Hearings Attended
                    </div>
                    <div className="text-2xl font-bold text-amber-900">
                      {memberStats.hearings_attended}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="text-xs font-semibold text-green-700 mb-1">
                      Revenue Collected
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      ₹{memberStats.revenue_generated.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-500">
                  Failed to load performance stats
                </div>
              )}
            </div>

            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Contact &amp; Practice Details
              </h4>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Mail className="w-4 h-4 text-gray-400" /> {selectedMember.email}
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <Phone className="w-4 h-4 text-gray-400" />{" "}
                {selectedMember.phone || "N/A"}
              </div>
              {selectedMember.barNo && (
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Briefcase className="w-4 h-4 text-gray-400" /> Bar No:{" "}
                  {selectedMember.barNo}
                </div>
              )}
              {selectedMember.specializations &&
                selectedMember.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedMember.specializations.map((sp) => (
                      <span
                        key={sp}
                        className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700"
                      >
                        {sp}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              {canManageTeam && authUser?.id !== selectedMember.id && (
                <button
                  onClick={() => setMemberToDelete(selectedMember)}
                  disabled={removeMember.isPending}
                  className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  Remove Member
                </button>
              )}
              <button
                onClick={() => setSelectedMember(null)}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Remove Member Confirmation Modal */}
      <Modal
        open={Boolean(memberToDelete)}
        onClose={() => setMemberToDelete(null)}
        title="Remove Team Member"
        size="sm"
      >
        <div className="space-y-4">
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-2">
              Remove {memberToDelete?.name}?
            </h3>
            <p className="text-xs text-gray-500">
              Are you sure you want to remove this team member? They will lose workspace access immediately.
            </p>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              onClick={() => setMemberToDelete(null)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmRemove}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              disabled={removeMember.isPending}
            >
              {removeMember.isPending ? "Removing..." : "Remove Member"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
