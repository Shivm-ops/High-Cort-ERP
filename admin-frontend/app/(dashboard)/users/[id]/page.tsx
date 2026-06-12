"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { User, Shield, Activity, HardDrive, Key, AlertTriangle, ArrowLeft, CheckCircle2, X, CreditCard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Edit states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [customPassword, setCustomPassword] = useState("");
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [updatingPlan, setUpdatingPlan] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [params.id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const [userRes, plansRes] = await Promise.all([
        api.get(`/admin/users/${params.id}/profile`),
        api.get('/admin/subscriptions/plans')
      ]);
      setUser(userRes.data);
      setPlans(plansRes.data);
      setFullName(userRes.data.full_name);
      setEmail(userRes.data.email);
      setPhone(userRes.data.phone || "");
      if (userRes.data.subscription) {
        setSelectedPlanId(userRes.data.subscription.plan_id);
      }
    } catch (err) {
      toast.error("Failed to load user profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${params.id}`, {
        full_name: fullName,
        email: email,
        phone: phone
      });
      toast.success("Profile updated successfully");
      fetchUser();
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action: string) => {
    try {
      if (action === "force_logout") {
        await api.post(`/admin/users/${params.id}/force-logout`);
        toast.success("User forcefully logged out from all devices");
      } else if (action === "reset_password") {
        await api.post(`/admin/users/${params.id}/reset-password`, { new_password: customPassword || null });
        toast.success(customPassword ? "Password changed successfully. Sessions revoked." : "Password reset to LegalOS@2025. Sessions revoked.");
        setCustomPassword("");
      } else if (action === "suspend") {
        await api.put(`/admin/users/${params.id}/status?active=false`);
        toast.success("User suspended");
        fetchUser();
      } else if (action === "activate") {
        await api.put(`/admin/users/${params.id}/status?active=true`);
        toast.success("User activated");
        fetchUser();
      }
    } catch (err) {
      toast.error(`Action failed`);
    }
  };

  const handleUpdateSubscription = async () => {
    if (!user.subscription?.firm_id || !selectedPlanId) return;
    try {
      setUpdatingPlan(true);
      await api.post(`/admin/subscriptions/tenant/${user.subscription.firm_id}/override`, {
        action: 'upgrade',
        plan_id: selectedPlanId
      });
      toast.success("User's firm subscription plan updated successfully");
      fetchUser();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update plan");
    } finally {
      setUpdatingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8 h-full flex flex-col max-w-6xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/users" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
            <span className={cn(
              "px-2.5 py-0.5 text-xs font-bold rounded-md uppercase",
              user.is_active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
            )}>
              {user.is_active ? 'Active' : 'Suspended'}
            </span>
            {user.is_superadmin && (
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 text-xs font-bold rounded-md uppercase flex items-center gap-1">
                <Shield className="w-3 h-3" /> Super Admin
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">{user.email} • {(user.role || 'User').replace('_', ' ')} at {user.firm_name}</p>
        </div>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 flex-shrink-0 space-y-1">
          {[
            { id: "profile", label: "Edit Profile", icon: User },
            { id: "subscription", label: "Subscription Details", icon: CreditCard },
            { id: "security", label: "Account & Security", icon: Shield },
            { id: "activity", label: "Login History", icon: Activity },
            { id: "storage", label: "Storage Usage", icon: HardDrive }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left",
                activeTab === tab.id 
                  ? "bg-indigo-50 text-indigo-700" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="p-8 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-6">User Profile Information</h2>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                  <input 
                    type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                  <input 
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Mobile Number</label>
                  <input 
                    type="text" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="pt-4">
                  <button 
                    onClick={handleSaveProfile} disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBSCRIPTION TAB */}
          {activeTab === "subscription" && (
            <div className="p-8 max-w-2xl">
              <h2 className="text-lg font-bold text-gray-900 mb-6">User Subscription Profile</h2>
              
              {!user.subscription ? (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl">
                  <p className="text-gray-500">This user is not attached to any active firm subscription.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">Current Active Plan</p>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-bold text-indigo-900 capitalize">{user.subscription.plan_name}</h3>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-white text-indigo-700 border border-indigo-200">
                          {user.subscription.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-sm text-indigo-700">
                        <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {user.subscription.billing_cycle}</span>
                        <span>Expires: {new Date(user.subscription.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <CreditCard className="w-12 h-12 text-indigo-200" />
                  </div>

                  <div className="p-6 border border-gray-200 rounded-2xl">
                    <h3 className="font-bold text-gray-900 mb-4">Change Subscription Plan</h3>
                    <p className="text-sm text-gray-500 mb-4">You can manually move this user to a different plan tier. This updates the billing and limits for their entire firm.</p>
                    
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Select New Plan</label>
                    <select 
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-500/50 mb-4"
                    >
                      <option value="">-- Choose Plan --</option>
                      {plans.map((plan: any) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} (₹{plan.price_monthly}/mo)
                        </option>
                      ))}
                    </select>

                    <button 
                      onClick={handleUpdateSubscription}
                      disabled={updatingPlan || selectedPlanId === user.subscription.plan_id || !selectedPlanId}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-300"
                    >
                      {updatingPlan ? "Updating..." : "Update Plan"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Account Controls & Security</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
                  <Key className="w-8 h-8 text-indigo-500 mb-4" />
                  <h3 className="font-bold text-gray-900">Force Password Reset</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">Set a custom password or reset to a temporary default to revoke all active sessions.</p>
                  <input 
                    type="text" 
                    placeholder="Custom password (optional)" 
                    value={customPassword} 
                    onChange={e => setCustomPassword(e.target.value)}
                    className="w-full px-3 py-2 mb-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button onClick={() => handleAction('reset_password')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition-colors">
                    {customPassword ? "Set New Password" : "Reset Default Password"}
                  </button>
                </div>

                <div className="p-6 border border-gray-200 rounded-2xl bg-gray-50">
                  <Shield className="w-8 h-8 text-amber-500 mb-4" />
                  <h3 className="font-bold text-gray-900">Force Logout</h3>
                  <p className="text-sm text-gray-500 mt-1 mb-4">Invalidate all active JWT sessions across all devices immediately.</p>
                  <button onClick={() => handleAction('force_logout')} className="px-4 py-2 bg-amber-100 text-amber-800 hover:bg-amber-200 text-sm font-bold rounded-lg transition-colors">
                    Log out from all devices
                  </button>
                </div>
              </div>

              <div className="mt-8 p-6 border border-red-200 rounded-2xl bg-red-50/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-900">Account Suspension</h3>
                    <p className="text-sm text-red-700/80 mt-1 mb-4">
                      Suspending a user will immediately revoke their access and active sessions. They will not be able to log in until activated.
                    </p>
                    {user.is_active ? (
                      <button onClick={() => handleAction('suspend')} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors">
                        Suspend User Account
                      </button>
                    ) : (
                      <button onClick={() => handleAction('activate')} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                        Re-Activate Account
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Login Activity</h2>
              <div className="space-y-6">
                {user.logins?.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                      <tr>
                        <th className="p-3 rounded-l-lg">Date & Time</th>
                        <th className="p-3">IP Address</th>
                        <th className="p-3 rounded-r-lg text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {user.logins.map((login: any, i: number) => (
                        <tr key={i}>
                          <td className="p-3 text-sm text-gray-800">{new Date(login.date).toLocaleString()}</td>
                          <td className="p-3 text-sm font-mono text-gray-600">{login.ip}</td>
                          <td className="p-3 text-right">
                            {login.success ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Success
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                                <X className="w-3 h-3" /> Failed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500 text-sm">No login history recorded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* STORAGE TAB */}
          {activeTab === "storage" && (
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6">User Storage Allocation</h2>
              <div className="max-w-sm bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <HardDrive className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Used</p>
                    <p className="text-2xl font-bold text-gray-900">{formatBytes(user.storage_used)}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  This represents the total byte size of all drafts, case files, and evidence uploaded individually by this user account.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
