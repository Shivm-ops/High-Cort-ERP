"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { CreditCard, Package, Users, Activity, Check, X, Building2, Calendar, FileText, Plus, Trash2, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState("plans");
  const [plans, setPlans] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planData, setPlanData] = useState({ name: "", tier: "", price_monthly: 0, price_yearly: 0, max_users: 0, storage_limit_gb: 0, features: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const fetchData = async (tab: string) => {
    setLoading(true);
    try {
      if (tab === "plans") {
        const res = await api.get("/admin/subscriptions/plans");
        setPlans(res.data);
      } else if (tab === "tenants") {
        const [tenRes, planRes] = await Promise.all([
          api.get("/admin/subscriptions/tenants"),
          api.get("/admin/subscriptions/plans")
        ]);
        setTenants(tenRes.data);
        setPlans(planRes.data);
      } else if (tab === "payments") {
        const [payRes, revRes] = await Promise.all([
          api.get("/admin/payments"),
          api.get("/admin/payments/revenue")
        ]);
        setPayments(payRes.data);
        setRevenue(revRes.data);
      } else if (tab === "requests") {
        const res = await api.get("/admin/subscriptions/upgrade-requests");
        setRequests(res.data);
      }
    } catch (err) {
      toast.error(`Failed to fetch ${tab} data`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    setPlanData({
      name: "",
      tier: "",
      price_monthly: 0,
      price_yearly: 0,
      max_users: 0,
      storage_limit_gb: 0,
      features: ""
    });
    setIsPlanModalOpen(true);
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanData({
      name: plan.name,
      tier: plan.tier,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_users: plan.max_users,
      storage_limit_gb: plan.storage_limit_gb,
      features: plan.features || ""
    });
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async () => {
    try {
      setIsSaving(true);
      if (editingPlan) {
        await api.put(`/admin/subscriptions/plans/${editingPlan.id}`, planData);
        toast.success("Plan updated successfully");
      } else {
        await api.post("/admin/subscriptions/plans", planData);
        toast.success("Plan created successfully");
      }
      setIsPlanModalOpen(false);
      fetchData("plans");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save plan");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await api.delete(`/admin/subscriptions/plans/${planToDelete}`);
      toast.success("Plan deleted successfully");
      fetchData("plans");
    } catch (err) {
      toast.error("Failed to delete plan");
    } finally {
      setPlanToDelete(null);
    }
  };

  const handleChangeTenantPlan = async () => {
    if (!selectedTenant || !selectedPlanId) return;
    try {
      setIsSaving(true);
      await api.post(`/admin/subscriptions/tenant/${selectedTenant.firm_id}/override`, {
        action: 'upgrade',
        plan_id: selectedPlanId
      });
      toast.success("Tenant subscription plan updated successfully");
      setIsChangePlanModalOpen(false);
      fetchData("tenants");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update tenant plan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      await api.post(`/admin/subscriptions/upgrade-requests/${id}/reject`);
      toast.success("Upgrade request rejected");
      fetchData("requests");
    } catch (err) {
      toast.error("Failed to reject request");
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await api.post(`/admin/subscriptions/upgrade-requests/${id}/approve`);
      toast.success("Upgrade request approved and subscription activated!");
      fetchData("requests");
    } catch (err) {
      toast.error("Failed to approve request");
    }
  };

  const renderPlansTab = () => (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleAddPlan}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Plan
        </button>
      </div>
      <div className="grid grid-cols-4 gap-6">
      {plans.map((plan) => (
        <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col relative">
          {!plan.is_active && (
            <div className="absolute top-0 right-0 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-xl">
              DEACTIVATED
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{plan.tier.replace('_', ' ')}</p>
          </div>
          <div className="mb-6 border-b border-gray-100 pb-4">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-indigo-700">₹{plan.price_monthly}</span>
              <span className="text-sm text-gray-500">/mo</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">₹{plan.price_yearly} billed yearly</p>
          </div>
          <div className="space-y-3 mb-6 flex-1">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Users className="w-4 h-4 text-gray-400" />
              <span>Up to <strong>{plan.max_users}</strong> users</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Package className="w-4 h-4 text-gray-400" />
              <span><strong>{plan.storage_limit_gb}GB</strong> secure storage</span>
            </div>

            {plan.features && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Features Included</p>
                <div className="flex flex-col gap-2">
                  {plan.features.split(',').map((feat: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEditPlan(plan)}
              className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm transition-colors"
            >
              Edit Plan
            </button>
            <button 
              onClick={() => setPlanToDelete(plan.id)}
              className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
              title="Delete Plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
    </div>
  );

  const renderTenantsTab = () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant (Firm)</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cycle</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {tenants.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{sub.firm_name}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-bold text-indigo-700">{sub.plan_name}</span>
              </td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-2.5 py-1 text-xs font-bold rounded-md uppercase",
                  sub.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                  sub.status === 'past_due' ? "bg-amber-50 text-amber-600" :
                  "bg-red-50 text-red-600"
                )}>
                  {sub.status.replace('_', ' ')}
                </span>
                <p className="text-[10px] text-gray-400 mt-1 uppercase">
                  {sub.auto_renew ? 'Auto-renews' : 'Manual Renew'}
                </p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{sub.billing_cycle}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Expires: {new Date(sub.end_date).toLocaleDateString()}
                </p>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => {
                      setSelectedTenant(sub);
                      // find the plan ID based on plan name since we don't have plan_id in response directly, 
                      // or just set first available plan
                      setSelectedPlanId("");
                      setIsChangePlanModalOpen(true);
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Change Plan
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await api.post(`/admin/subscriptions/tenant/${sub.firm_id}/override`, { action: 'extend', days: 30 });
                        toast.success("Subscription extended by 30 days");
                        fetchData("tenants");
                      } catch(e) { toast.error("Failed to extend"); }
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Extend +30d
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await api.post(`/admin/subscriptions/tenant/${sub.firm_id}/override`, { action: 'cancel' });
                        toast.success("Subscription cancelled");
                        fetchData("tenants");
                      } catch(e) { toast.error("Failed to cancel"); }
                    }}
                    className="text-xs font-bold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel Plan
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {tenants.length === 0 && !loading && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No active subscriptions found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-6">
      {revenue && (
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Gross Revenue</p>
            <p className="text-3xl font-bold text-emerald-600">₹{(revenue.total_revenue / 100).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Refunded</p>
            <p className="text-3xl font-bold text-red-500">₹{(revenue.total_refunds / 100).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-md bg-indigo-50 flex flex-col justify-center">
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2">Net Revenue</p>
            <p className="text-3xl font-bold text-indigo-900">₹{(revenue.net_revenue / 100).toLocaleString()}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gateway</th>
            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((pay) => (
            <tr key={pay.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600">
                {new Date(pay.created_at).toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-gray-900">
                {pay.firm_name}
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-mono font-bold text-gray-900">{pay.currency} {pay.amount.toLocaleString()}</span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 capitalize">{pay.gateway}</span>
                </div>
                <p className="text-[10px] font-mono text-gray-400 mt-0.5">{pay.reference}</p>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-md uppercase",
                    pay.status === 'success' ? "bg-emerald-50 text-emerald-600" :
                    pay.status === 'pending' ? "bg-amber-50 text-amber-600" :
                    pay.status === 'refunded' ? "bg-purple-50 text-purple-600" :
                    "bg-red-50 text-red-600"
                  )}>
                    {pay.status}
                  </span>
                  {pay.status === 'success' && (
                    <button 
                      onClick={async () => {
                        try {
                          await api.post(`/admin/payments/${pay.id}/refund`);
                          toast.success("Refund initiated");
                          fetchData("payments");
                        } catch(e) { toast.error("Failed to refund"); }
                      }}
                      className="text-[10px] font-bold text-white bg-purple-600 hover:bg-purple-700 px-2 py-1 rounded transition-colors"
                    >
                      Issue Refund
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {payments.length === 0 && !loading && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No payment records found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );

  const renderRequestsTab = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-[15px] font-bold text-gray-900 flex items-center gap-2">
          <ArrowUpRight className="w-4 h-4 text-amber-500" /> Pending Upgrade Requests
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-4 pl-6 font-medium">Firm Name</th>
              <th className="p-4 font-medium">Requested Plan</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date Requested</th>
              <th className="p-4 pr-6 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {requests.map((req: any) => (
              <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="p-4 pl-6">
                  <span className="font-semibold text-gray-900">{req.firm_name}</span>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                    <Package className="w-3 h-3" />
                    {req.requested_plan_name}
                  </span>
                  <div className="text-[11px] text-gray-500 mt-1 capitalize">{req.billing_cycle}</div>
                </td>
                <td className="p-4">
                  <span className="font-semibold text-gray-900">₹{req.requested_plan_price}</span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(req.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 pr-6 text-right">
                  <div className="flex justify-end items-center gap-2">
                    <button 
                      onClick={() => handleRejectRequest(req.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Reject Request"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleApproveRequest(req.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                      title="Approve and Mark Paid"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {requests.length === 0 && !loading && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No pending upgrade requests.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full flex flex-col">
      <Toaster position="top-right" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
        <p className="text-gray-500 mt-1">Manage SaaS pricing tiers, monitor tenant subscriptions, and view payment ledger.</p>
      </div>

      <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-4">
        {[
          { id: "plans", label: "Subscription Plans", icon: Package },
          { id: "tenants", label: "Active Tenants", icon: Building2 },
          { id: "requests", label: "Upgrade Requests", icon: ArrowUpRight },
          { id: "payments", label: "Payment Ledger", icon: Activity }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all",
              activeTab === tab.id 
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
            )}
          >
            <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-indigo-100" : "text-gray-400")} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <>
            {activeTab === "plans" && renderPlansTab()}
            {activeTab === "tenants" && renderTenantsTab()}
            {activeTab === "requests" && renderRequestsTab()}
            {activeTab === "payments" && renderPaymentsTab()}
          </>
        )}
      </div>

      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl w-[500px] my-8">
            <h3 className="text-lg font-bold mb-4">{editingPlan ? `Edit ${editingPlan.name} Plan` : "Create New Plan"}</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Plan Name</label>
                  <input 
                    type="text" 
                    value={planData.name}
                    onChange={e => setPlanData({...planData, name: e.target.value})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                    placeholder="e.g. Basic Plan"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Internal Tier ID</label>
                  <input 
                    type="text" 
                    value={planData.tier}
                    onChange={e => setPlanData({...planData, tier: e.target.value.toLowerCase().replace(/\s+/g, '_')})}
                    disabled={!!editingPlan}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400" 
                    placeholder="e.g. basic"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Monthly Price (₹)</label>
                  <input 
                    type="number" 
                    value={planData.price_monthly}
                    onChange={e => setPlanData({...planData, price_monthly: Number(e.target.value)})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Yearly Price (₹)</label>
                  <input 
                    type="number" 
                    value={planData.price_yearly}
                    onChange={e => setPlanData({...planData, price_yearly: Number(e.target.value)})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500">Max Users Allowed</label>
                  <input 
                    type="number" 
                    value={planData.max_users}
                    onChange={e => setPlanData({...planData, max_users: Number(e.target.value)})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Storage Limit (GB)</label>
                  <input 
                    type="number" 
                    value={planData.storage_limit_gb}
                    onChange={e => setPlanData({...planData, storage_limit_gb: Number(e.target.value)})}
                    className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Included Features</label>
                <input 
                  type="text" 
                  value={planData.features}
                  onChange={e => setPlanData({...planData, features: e.target.value})}
                  className="w-full mt-1 border border-gray-200 rounded-lg p-2 focus:outline-none focus:border-indigo-500" 
                  placeholder="Comma-separated: E.g., Drafts Library, Unlimited Cases, Priority Support"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button onClick={() => setIsPlanModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                  onClick={handleSavePlan} 
                  disabled={isSaving || !planData.name || !planData.tier} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isChangePlanModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl w-[400px] my-8">
            <h3 className="text-lg font-bold mb-2">Change Plan</h3>
            <p className="text-sm text-gray-500 mb-6">Select a new plan for {selectedTenant?.firm_name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Select New Plan</label>
                <select 
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose a Plan --</option>
                  {plans.map((plan: any) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} (₹{plan.price_monthly}/mo)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button onClick={() => setIsChangePlanModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button 
                  onClick={handleChangeTenantPlan} 
                  disabled={isSaving || !selectedPlanId} 
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Update Plan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {planToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl w-[400px] my-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Plan</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 mt-4">
              Are you sure you want to permanently delete this subscription plan? Existing tenants on this plan will not be deleted, but they may need to be migrated manually. This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button 
                onClick={() => setPlanToDelete(null)} 
                className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeletePlan} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
