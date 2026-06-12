"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Check, X, Shield, UserX, UserCheck, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firms, setFirms] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ full_name: "", email: "", password: "", user_type: "associate_advocate", phone: "", address: "", firm_id: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [resUsers, resFirms] = await Promise.all([
        api.get("/admin/users"),
        api.get("/admin/firms")
      ]);
      setUsers(resUsers.data);
      setFirms(resFirms.data);
    } catch (err) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${userId}/status?active=${!currentStatus}`);
      toast.success(currentStatus ? "User suspended" : "User activated");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/verify`);
      toast.success("User verified successfully");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to verify user");
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await api.delete(`/admin/users/${userToDelete}`);
      toast.success("User deleted successfully");
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete user");
      setUserToDelete(null);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.full_name || !newUser.email || !newUser.password || !newUser.phone || !newUser.address) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setIsSaving(true);
      const payload = { ...newUser };
      if (!payload.firm_id) delete (payload as any).firm_id; // Let backend handle default if empty
      
      await api.post("/admin/users", payload);
      toast.success("User created successfully.");
      setIsModalOpen(false);
      setNewUser({ full_name: "", email: "", password: "", user_type: "associate_advocate", phone: "", address: "", firm_id: "" });
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Control access, view roles, and manage all users across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchUsers}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <Shield className="w-4 h-4" /> Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform Access</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                      {user.full_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md uppercase">
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.is_verified ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-max">
                      <Shield className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {user.is_active ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <Check className="w-4 h-4" /> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-600">
                      <X className="w-4 h-4" /> Suspended
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {!user.is_verified && (
                      <button
                        onClick={() => handleVerifyUser(user.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      >
                        <Shield className="w-3.5 h-3.5" /> Verify
                      </button>
                    )}
                    <button
                      onClick={() => toggleStatus(user.id, user.is_active)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border",
                        user.is_active 
                          ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                          : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      {user.is_active ? (
                        <><UserX className="w-3.5 h-3.5" /> Suspend</>
                      ) : (
                        <><UserCheck className="w-3.5 h-3.5" /> Activate</>
                      )}
                    </button>
                    <Link 
                      href={`/users/${user.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => setUserToDelete(user.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border bg-white border-red-200 text-red-600 hover:bg-red-50"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                  No users found in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[450px]">
            <h3 className="text-lg font-bold mb-4">Create Platform User</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">Full Name</label>
                <input 
                  type="text" 
                  value={newUser.full_name}
                  onChange={e => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  placeholder="e.g. Adv. Ramesh Sharma"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Email Address</label>
                <input 
                  type="email" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  placeholder="name@firm.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Temporary Password</label>
                <input 
                  type="text" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  placeholder="Enter initial password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Contact Number</label>
                  <input 
                    type="text" 
                    value={newUser.phone}
                    onChange={e => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                    placeholder="+91..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Address</label>
                  <input 
                    type="text" 
                    value={newUser.address}
                    onChange={e => setNewUser({...newUser, address: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                    placeholder="City, State"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Platform Role</label>
                  <select 
                    value={newUser.user_type}
                    onChange={e => setNewUser({...newUser, user_type: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="admin">Super Admin / Firm Admin</option>
                    <option value="senior_advocate">Senior Advocate</option>
                    <option value="associate_advocate">Associate Advocate</option>
                    <option value="junior_advocate">Junior Advocate</option>
                    <option value="paralegal">Paralegal</option>
                    <option value="clerk">Clerk</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Assign to Law Firm</label>
                  <select 
                    value={newUser.firm_id}
                    onChange={e => setNewUser({...newUser, firm_id: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Default (Super Admin Firm)</option>
                    {firms.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                  onClick={handleCreateUser} 
                  disabled={isSaving || !newUser.full_name || !newUser.email || !newUser.password || !newUser.phone || !newUser.address} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Creating..." : "Create User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[400px]">
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <div className="p-3 bg-red-50 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete User</h3>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove their access to the platform.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setUserToDelete(null)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
              <button 
                onClick={confirmDeleteUser} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
