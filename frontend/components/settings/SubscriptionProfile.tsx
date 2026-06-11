import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, Zap, ArrowUpRight, Loader2, Star, Check } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SubscriptionProfile() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const [res, reqRes] = await Promise.all([
        api.get("/subscriptions/me"),
        api.get("/subscriptions/me/upgrade-request")
      ]);
      setData(res.data);
      if (reqRes.data.has_pending_request) {
        setPendingRequest(reqRes.data);
      } else {
        setPendingRequest(null);
      }
    } catch (err) {
      console.error("Failed to fetch subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    try {
      await api.post("/subscriptions/me/upgrade", { plan_id: planId, billing_cycle: "monthly" });
      toast.success("Upgrade request submitted! Pending admin approval.");
      fetchSubscriptionData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to upgrade subscription");
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const currentPlan = data?.current_subscription;
  const availablePlans = data?.available_plans || [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <h2 className="text-[15px] font-semibold text-charcoal mb-2 flex items-center gap-2">
        <Star className="w-4 h-4 text-indigo-600" /> Subscription Plan
      </h2>
      <p className="text-[12px] text-muted mb-8">Manage your platform access, billing cycle, and upgrades.</p>

      {pendingRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
          <div className="bg-amber-100 p-2 rounded-lg mt-0.5">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-900">Upgrade Request Pending</h3>
            <p className="text-xs text-amber-700 mt-1">
              Your request to upgrade to the <strong>{pendingRequest.requested_plan_name}</strong> plan is currently pending approval. 
              Please contact the Super Admin or complete your offline payment to activate your new features.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan Overview */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-8 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Current Active Plan</p>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-gray-900 capitalize">{currentPlan?.name || "No Plan"}</h3>
            {currentPlan?.status === 'active' && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            )}
          </div>
          {currentPlan?.end_date && (
            <p className="text-[12px] text-gray-500 mt-2">
              Next billing date: <span className="font-semibold text-gray-700">{new Date(currentPlan.end_date).toLocaleDateString()}</span>
            </p>
          )}

          {currentPlan?.features && currentPlan.features.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Users</p>
                <p className="text-[13px] font-medium text-gray-800">{currentPlan.max_users}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Storage</p>
                <p className="text-[13px] font-medium text-gray-800">{currentPlan.storage_limit_gb} GB</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Unlocked Features</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentPlan.features.split(',').map((feat: string, i: number) => (
                    <span key={i} className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {feat.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="text-right hidden md:block">
          <CreditCard className="w-10 h-10 text-gray-300" />
        </div>
      </div>

      {/* Upgrade Options */}
      <h3 className="text-[13px] font-bold text-gray-800 mb-4 border-t border-gray-100 pt-6">Available Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {availablePlans.map((plan: any) => {
          const isCurrent = currentPlan?.id === plan.id;
          
          return (
            <div 
              key={plan.id} 
              className={cn(
                "border rounded-xl p-5 flex flex-col transition-all",
                isCurrent 
                  ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50/10" 
                  : "border-gray-200 hover:border-indigo-300 hover:shadow-md bg-white"
              )}
            >
              <div className="mb-4">
                <h4 className="text-lg font-bold text-gray-900 capitalize">{plan.name}</h4>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">₹{plan.price_monthly}</span>
                  <span className="text-xs text-gray-500 font-medium">/ month</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-start gap-2 text-[12px] text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Up to <strong className="text-gray-900">{plan.max_users} Users</strong></span>
                </li>
                <li className="flex items-start gap-2 text-[12px] text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span><strong className="text-gray-900">{plan.storage_limit_gb} GB</strong> Storage</span>
                </li>
                {plan.features ? (
                  plan.features.split(',').map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{feat.trim()}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2 text-[12px] text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Unlimited Cases & Clients</span>
                    </li>
                    {plan.price_monthly > 0 && (
                       <li className="flex items-start gap-2 text-[12px] text-gray-600">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Priority Support</span>
                      </li>
                    )}
                  </>
                )}
              </ul>
              
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || upgrading !== null || !!pendingRequest}
                className={cn(
                  "w-full py-2.5 rounded-lg text-[13px] font-bold flex items-center justify-center gap-2 transition-all",
                  (isCurrent || !!pendingRequest)
                    ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                )}
              >
                {upgrading === plan.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isCurrent ? (
                  <>Current Plan</>
                ) : !!pendingRequest ? (
                  <>Upgrade Pending</>
                ) : (
                  <>Upgrade Now <ArrowUpRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
