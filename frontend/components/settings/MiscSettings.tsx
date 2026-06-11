import React, { useState } from "react";
import { Bell, CreditCard, Users, Globe, Palette, MoreVertical, Plus, Trash2, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { useTeamMembers, useRemoveTeamMember } from "@/lib/hooks/useTeam";
import { useThemeStore } from "@/lib/store/themeStore";
import { useTheme } from "next-themes";
import { toast } from "sonner";

export const DraftLibrarySettings = () => {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h2 className="text-[15px] font-semibold text-charcoal mb-5">Draft Library Settings</h2>
      <div className="space-y-4">
        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">Default Language for Drafts</label>
          <select className="w-full md:w-1/2 h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal">
            <option>English</option>
            <option>Marathi</option>
            <option>Hindi</option>
            <option>Gujarati</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted block mb-1.5">Preferred Categories</label>
          <div className="flex flex-wrap gap-2">
            {["Civil", "Criminal", "Corporate", "Family", "Property"].map(cat => (
              <label key={cat} className="flex items-center gap-2 text-[13px] text-charcoal bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                <input type="checkbox" defaultChecked className="accent-[#013B36]" /> {cat}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationSettings = () => {
  const [alerts, setAlerts] = useState({ expiry: true, hearing: true, deadline: true, payment: false, team: true });
  const [channels, setChannels] = useState({ email: true, sms: false, whatsapp: true, inapp: true });

  const toggle = (state: any, setState: any, key: string) => setState({ ...state, [key]: !state[key] });

  const ToggleRow = ({ label, checked, onToggle }: { label: string, checked: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      <span className="text-[13px] font-medium text-charcoal">{label}</span>
      <button onClick={onToggle} className={cn("w-10 h-5 rounded-full transition-colors relative", checked ? "" : "bg-gray-200")} style={checked ? { background: "linear-gradient(135deg,#6EE7B7,#72D6C9)" } : {}}>
        <span className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h2 className="text-[15px] font-semibold text-charcoal mb-5">Notification Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-[13px] font-semibold text-charcoal mb-4">Alert Types</h3>
          <div className="space-y-3">
            <ToggleRow label="Limitation Expiry" checked={alerts.expiry} onToggle={() => toggle(alerts, setAlerts, "expiry")} />
            <ToggleRow label="Hearing Dates" checked={alerts.hearing} onToggle={() => toggle(alerts, setAlerts, "hearing")} />
            <ToggleRow label="Filing & Notice Deadlines" checked={alerts.deadline} onToggle={() => toggle(alerts, setAlerts, "deadline")} />
            <ToggleRow label="Payment Collection" checked={alerts.payment} onToggle={() => toggle(alerts, setAlerts, "payment")} />
            <ToggleRow label="Team Assignments" checked={alerts.team} onToggle={() => toggle(alerts, setAlerts, "team")} />
          </div>
        </div>
        <div>
          <h3 className="text-[13px] font-semibold text-charcoal mb-4">Delivery Channels</h3>
          <div className="space-y-3">
            <ToggleRow label="Email" checked={channels.email} onToggle={() => toggle(channels, setChannels, "email")} />
            <ToggleRow label="SMS" checked={channels.sms} onToggle={() => toggle(channels, setChannels, "sms")} />
            <ToggleRow label="WhatsApp" checked={channels.whatsapp} onToggle={() => toggle(channels, setChannels, "whatsapp")} />
            <ToggleRow label="In-App Notifications" checked={channels.inapp} onToggle={() => toggle(channels, setChannels, "inapp")} />
          </div>
        </div>
      </div>
    </div>
  );
};

export const BillingSettings = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <h2 className="text-[15px] font-semibold text-charcoal mb-5">Billing & Invoicing Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Default GST %</label>
        <select className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal">
          <option>18%</option>
          <option>0% (Exempt)</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Invoice Series Prefix</label>
        <input defaultValue="INV-2026-" className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal" />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Payment Terms</label>
        <input defaultValue="Net 15" className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal" />
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">UPI QR Code</label>
        <div className="border border-dashed border-gray-300 rounded-xl h-10 flex items-center justify-center text-[12px] font-semibold text-charcoal bg-gray-50 cursor-pointer hover:bg-gray-100">
          Upload QR Image
        </div>
      </div>
    </div>
  </div>
);

export const TeamSettings = () => {
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    "Senior Advocate": ["view", "create", "edit", "delete", "approve"],
    "Associate Advocate": ["view", "create", "edit"],
    "Junior Advocate": ["view", "create"],
    "Paralegal": ["view", "create"],
    "Clerk": ["view"],
    "Admin": ["view", "create", "edit", "delete", "approve"]
  });

  const availablePermissions = ["view", "create", "edit", "delete", "approve"];

  const handleTogglePermission = (role: string, perm: string) => {
    setRolePermissions(prev => {
      const current = prev[role] || [];
      if (current.includes(perm)) {
        return { ...prev, [role]: current.filter(p => p !== perm) };
      } else {
        return { ...prev, [role]: [...current, perm] };
      }
    });
  };

  const { data: teamData, isLoading } = useTeamMembers();
  const removeMember = useRemoveTeamMember();

  const confirmRemove = async () => {
    if (!memberToDelete) return;
    try {
      await removeMember.mutateAsync(memberToDelete);
      toast.success("Member removed successfully");
    } catch (err) {
      toast.error("Failed to remove member");
    } finally {
      setMemberToDelete(null);
    }
  };

  return (
  <div className="space-y-6">
  <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <div className="flex justify-between items-center mb-5">
      <h2 className="text-[15px] font-semibold text-charcoal">Active Team Members</h2>
      <button 
        onClick={() => setShowInviteModal(true)}
        className="h-8 px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 bg-[#013B36] text-white hover:bg-[#024a44] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Invite Member
      </button>
    </div>
    
    <div className="space-y-3">
      {isLoading ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#013B36]" /></div>
      ) : !teamData?.team || teamData.team.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-muted">No team members found. Invite someone to get started.</div>
      ) : (
        teamData?.team?.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 overflow-hidden">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-charcoal">{member.name}</div>
                <div className="text-[11px] text-muted">{member.email} • {member.role}</div>
              </div>
            </div>
            <button 
              onClick={() => setMemberToDelete(member.id)}
              disabled={removeMember.isPending}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Remove Member"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))
      )}
    </div>
  </div>

  <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <div className="mb-5">
      <h2 className="text-[15px] font-semibold text-charcoal">Role Permissions</h2>
      <p className="text-[12px] text-muted mt-1">Configure default access rights for different team roles</p>
    </div>
    
    <div className="space-y-4">
      {["Senior Advocate", "Associate Advocate", "Junior Advocate", "Paralegal", "Clerk", "Admin"].map((role, idx) => (
        <div key={idx} className="flex flex-col border border-gray-100 rounded-xl bg-gray-50 hover:bg-white transition-colors shadow-sm hover:shadow overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div>
              <div className="text-[13px] font-bold text-charcoal">{role}</div>
              <div className="text-[11px] text-muted mt-1 capitalize">
                Permissions: {(rolePermissions[role] || []).join(", ") || "None"}
              </div>
            </div>
            <button 
              onClick={() => setEditingRole(editingRole === role ? null : role)}
              className="text-[11px] font-semibold text-mint hover:underline"
            >
              {editingRole === role ? "Done" : "Edit Permissions"}
            </button>
          </div>
          
          {editingRole === role && (
            <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-white">
              <label className="text-[11px] font-semibold text-charcoal block mb-2">Access Rights</label>
              <div className="flex flex-wrap gap-3">
                {availablePermissions.map(perm => (
                  <label key={perm} className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={(rolePermissions[role] || []).includes(perm)}
                      onChange={() => handleTogglePermission(role, perm)}
                      className="w-3.5 h-3.5 text-[#013B36] rounded border-gray-300 focus:ring-[#013B36]"
                    />
                    <span className="text-[11px] font-bold text-charcoal capitalize">Can {perm}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>

    <Modal open={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Team Member" size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
          <input placeholder="colleague@firm.com" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#6EE7B7]/30 focus:border-[#6EE7B7]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
          <select className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm bg-white outline-none focus:ring-2 focus:ring-[#6EE7B7]/30 focus:border-[#6EE7B7]">
            <option>Senior Advocate</option>
            <option>Associate Advocate</option>
            <option>Junior Advocate</option>
            <option>Paralegal</option>
            <option>Clerk</option>
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowInviteModal(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button onClick={() => setShowInviteModal(false)} className="rounded-xl bg-[#013B36] px-4 py-2 text-sm font-semibold text-white hover:bg-[#024a44]">Send Invite</button>
        </div>
      </div>
    </Modal>

    <Modal open={!!memberToDelete} onClose={() => setMemberToDelete(null)} title="Remove Team Member" size="sm">
      <div className="space-y-4">
        <div className="text-center p-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">Remove Team Member?</h3>
          <p className="text-xs text-gray-500">
            Are you sure you want to remove this team member? They will lose access to the workspace immediately.
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <button onClick={() => setMemberToDelete(null)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={confirmRemove} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors">Remove Member</button>
        </div>
      </div>
    </Modal>
  </div>
  </div>
  );
};

export const MultilingualSettings = () => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <h2 className="text-[15px] font-semibold text-charcoal mb-5">Multilingual Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Default UI Language</label>
        <select className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal">
          <option>English</option>
          <option>Hindi</option>
          <option>Marathi</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Default Notice Language</label>
        <select className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal">
          <option>English</option>
          <option>Marathi</option>
          <option>Gujarati</option>
        </select>
      </div>
    </div>
  </div>
);

export const PreferenceSettings = () => {
  const { theme, setTheme } = useTheme();
  const { typography, setTypography } = useThemeStore();
  const [dateFormat, setDateFormat] = useState("DD-MM-YYYY");

  return (
  <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
    <h2 className="text-[15px] font-semibold text-charcoal mb-5">Personal Preferences</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Theme Appearance</label>
        <select 
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
        >
          <option value="system">System Default</option>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Date Format</label>
        <select 
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value)}
          className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
        >
          <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Dashboard Layout</label>
        <select 
          value={typography.layout}
          onChange={(e) => setTypography({ layout: e.target.value as any })}
          className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
        >
          <option value="comfortable">Standard View</option>
          <option value="compact">Compact View</option>
        </select>
      </div>
      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Font Size</label>
        <select 
          value={typography.fontSize}
          onChange={(e) => setTypography({ fontSize: e.target.value })}
          className="w-full h-10 px-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
        >
          <option value="13px">Medium (Default)</option>
          <option value="12px">Small</option>
          <option value="14px">Large</option>
        </select>
      </div>
    </div>
  </div>
  );
};
