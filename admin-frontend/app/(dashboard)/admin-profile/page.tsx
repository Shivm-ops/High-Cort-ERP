"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Shield, Plus, X, User, Lock, Mail, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminProfilePage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // My Profile Edit States
  const [myName, setMyName] = useState("");
  const [myEmail, setMyEmail] = useState("");
  const [myPassword, setMyPassword] = useState("");
  const [savingMe, setSavingMe] = useState(false);

  // New Admin States
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPermissions, setNewPermissions] = useState<string[]>([]);
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const meRes = await api.get("/auth/me");
      setMyName(meRes.data.full_name);
      setMyEmail(meRes.data.email);

      const adminsRes = await api.get("/admin/superadmins");
      setAdmins(adminsRes.data);
    } catch (err) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingMe(true);
    try {
      const payload: any = { full_name: myName, email: myEmail };
      if (myPassword) payload.password = myPassword;
      await api.put("/admin/superadmins/me", payload);
      toast.success("Your profile has been updated successfully.");
      setMyPassword("");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSavingMe(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!newName || !newEmail || !newPassword) {
      toast.error("All fields are required");
      return;
    }
    setAddingAdmin(true);
    try {
      await api.post("/admin/superadmins", {
        full_name: newName,
        email: newEmail,
        password: newPassword,
        permissions: newPermissions
      });
      toast.success("New Super Admin created successfully!");
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewPermissions([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to add new admin");
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke superadmin access for this user?")) return;
    try {
      await api.delete(`/admin/superadmins/${id}`);
      toast.success("Admin access revoked.");
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to revoke access");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col max-w-5xl mx-auto w-full">
      <Toaster position="top-right" />
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile & Access</h1>
        <p className="text-gray-500 mt-1">Manage your super admin credentials and delegate portal access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* My Profile */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 self-start">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <User className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">My Profile</h2>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={myName}
                onChange={(e) => setMyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={myEmail}
                onChange={(e) => setMyEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Change Password (Optional)</label>
              <input 
                type="password" 
                value={myPassword}
                onChange={(e) => setMyPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <button 
              onClick={handleSaveProfile}
              disabled={savingMe}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {savingMe ? "Saving..." : "Save My Profile"}
            </button>
          </div>
        </div>

        {/* Other Admins */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col max-h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-gray-900">Portal Administrators</h2>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Admin
            </button>
          </div>
          
          <div className="overflow-y-auto pr-2 space-y-3 flex-1">
            {admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center font-bold text-indigo-600 shadow-sm">
                    {admin.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{admin.full_name}</p>
                    <p className="text-xs text-gray-500">{admin.email}</p>
                    {admin.admin_permissions && admin.admin_permissions.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {admin.admin_permissions.map((perm: string) => (
                          <span key={perm} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded border border-indigo-100">
                            {perm}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleRevoke(admin.id)}
                  title="Revoke Superadmin Access"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Delegate Portal Access</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" value={newName} onChange={e => setNewName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Temporary Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Access Rights</label>
                <div className="flex flex-wrap gap-3">
                  {['edit', 'delete', 'approve'].map((perm) => (
                    <label key={perm} className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={newPermissions.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) setNewPermissions([...newPermissions, perm]);
                          else setNewPermissions(newPermissions.filter(p => p !== perm));
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm font-bold text-gray-700 capitalize">Can {perm}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <button 
              onClick={handleAddAdmin} disabled={addingAdmin}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {addingAdmin ? "Creating..." : "Grant Super Admin Access"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
