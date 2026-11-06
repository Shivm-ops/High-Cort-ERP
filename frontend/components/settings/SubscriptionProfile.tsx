"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  ArrowUpRight,
  Loader2,
  Star,
  Check,
  Calendar,
  Clock,
  ShieldCheck,
  Receipt,
  Download,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { loadRazorpayScript } from "@/lib/razorpay";

export default function SubscriptionProfile() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "quarterly" | "half_yearly" | "yearly">("monthly");
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [successInvoice, setSuccessInvoice] = useState<any>(null);

  const fetchSubscriptionData = async () => {
    setLoading(true);
    try {
      const [subRes, invRes] = await Promise.all([
        api.get("/subscriptions/me"),
        api.get("/subscriptions/invoices").catch(() => ({ data: [] })),
      ]);
      setData(subRes.data);
      setInvoices(invRes.data || []);
    } catch (err) {
      console.error("Failed to fetch subscription data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const getPlanPrice = (plan: any) => {
    switch (billingCycle) {
      case "quarterly":
        return plan.price_quarterly || Math.round(plan.price_monthly * 3 * 0.9);
      case "half_yearly":
        return plan.price_half_yearly || Math.round(plan.price_monthly * 6 * 0.85);
      case "yearly":
        return plan.price_yearly;
      default:
        return plan.price_monthly;
    }
  };

  const getCycleLabel = () => {
    switch (billingCycle) {
      case "quarterly": return "/ quarter (3 months)";
      case "half_yearly": return "/ half year (6 months)";
      case "yearly": return "/ year (12 months)";
      default: return "/ month";
    }
  };

  const handleRazorpayCheckout = async (plan: any) => {
    if (plan.price_monthly === 0) {
      toast.info("You are already eligible for the free basic tier.");
      return;
    }

    setProcessingPlanId(plan.id);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load Razorpay payment SDK. Please check your internet connection.");
        setProcessingPlanId(null);
        return;
      }

      // 1. Create order on backend
      const orderRes = await api.post("/subscriptions/checkout-order", {
        plan_id: plan.id,
        billing_cycle: billingCycle,
      });

      const { order_id, amount, currency, key_id, prefill, breakdown } = orderRes.data;

      // 2. Open Razorpay Checkout modal
      const options = {
        key: key_id || "rzp_test_placeholder",
        amount: amount,
        currency: currency,
        name: "Fastcase Legal Platform",
        description: `${plan.name} (${billingCycle.replace("_", " ").toUpperCase()})`,
        image: "https://fastcase.in/favicon.ico",
        order_id: order_id,
        prefill: {
          name: prefill.name,
          email: prefill.email,
          contact: prefill.contact,
        },
        theme: {
          color: "#059669", // Fastcase emerald green
        },
        handler: async function (response: any) {
          try {
            toast.loading("Verifying payment and activating your chambers...");
            const verifyRes = await api.post("/subscriptions/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_id: plan.id,
              billing_cycle: billingCycle,
            });

            toast.dismiss();
            toast.success(verifyRes.data.message || "Subscription activated successfully!");
            setSuccessInvoice({
              plan_name: plan.name,
              invoice_number: verifyRes.data.invoice_number,
              valid_until: verifyRes.data.valid_until,
              amount: breakdown.total_amount,
            });
            fetchSubscriptionData();
          } catch (err: any) {
            toast.dismiss();
            toast.error(err.response?.data?.detail || "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanId(null);
          },
        },
      };

      const razorpayInstance = new (window as any).Razorpay(options);
      razorpayInstance.on("payment.failed", function (resp: any) {
        toast.error(`Payment failed: ${resp.error.description}`);
        setProcessingPlanId(null);
      });
      razorpayInstance.open();
    } catch (err: any) {
      console.error("Checkout initiation error:", err);
      toast.error(err.response?.data?.detail || "Failed to initiate payment. Please try again.");
      setProcessingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs text-slate-500">Loading subscription details...</p>
      </div>
    );
  }

  const currentPlan = data?.current_subscription;
  const availablePlans = data?.available_plans || [];

  return (
    <div className="space-y-6">
      {/* ── Active Subscription Header Card ── */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold border border-emerald-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Current Chambers Plan
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold capitalize">{currentPlan?.name || "Free Tier"}</h3>
            <p className="text-emerald-100/80 text-xs md:text-sm">
              Status: <span className="font-semibold uppercase text-emerald-300">{currentPlan?.status}</span>
              {currentPlan?.end_date && (
                <> &bull; Valid until: <span className="font-semibold">{new Date(currentPlan.end_date).toLocaleDateString()}</span></>
              )}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/15">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-200">Days Remaining</p>
              <p className="text-2xl font-black text-white">{currentPlan?.days_remaining ?? "--"}</p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-200">Max Users</p>
              <p className="text-2xl font-black text-white">{currentPlan?.max_users || 1}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Billing Cycle Selector ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div>
          <h4 className="font-bold text-sm text-slate-900">Choose Billing Frequency</h4>
          <p className="text-xs text-slate-500">Save more with quarterly, half-yearly, or annual commitments</p>
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition",
              billingCycle === "monthly" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("quarterly")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1",
              billingCycle === "quarterly" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Quarterly <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-1 py-0.2 rounded">10% OFF</span>
          </button>
          <button
            onClick={() => setBillingCycle("half_yearly")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1",
              billingCycle === "half_yearly" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Half-Yearly <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 px-1 py-0.2 rounded">15% OFF</span>
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1",
              billingCycle === "yearly" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Annual <span className="text-[10px] font-extrabold text-purple-600 bg-purple-100 px-1 py-0.2 rounded">2 Mo Free</span>
          </button>
        </div>
      </div>

      {/* ── Plans Comparison Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {availablePlans.map((plan: any) => {
          const isCurrent = currentPlan?.id === plan.id;
          const price = getPlanPrice(plan);
          const isProcessing = processingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={cn(
                "rounded-2xl p-6 flex flex-col justify-between transition-all border",
                isCurrent
                  ? "border-emerald-600 bg-emerald-50/20 ring-2 ring-emerald-500/20 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 shadow-sm hover:shadow-md"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 text-lg capitalize">{plan.name}</h4>
                  {isCurrent && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Active Plan
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">₹{price.toLocaleString("en-IN")}</span>
                    <span className="text-xs text-slate-500 font-medium">{getCycleLabel()}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">+ 18% GST (Tax Invoice provided)</p>
                </div>

                <ul className="space-y-3 mb-6 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Up to <strong>{plan.max_users} Staff / Advocates</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span><strong>{plan.storage_limit_gb} GB</strong> Privileged Case Storage</span>
                  </li>
                  {plan.features ? (
                    plan.features.split(",").map((feat: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="capitalize">{feat.trim().replace(/_/g, " ")}</span>
                      </li>
                    ))
                  ) : null}
                </ul>
              </div>

              <div>
                <button
                  onClick={() => handleRazorpayCheckout(plan)}
                  disabled={isCurrent || isProcessing}
                  className={cn(
                    "w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm",
                    isCurrent
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
                    </>
                  ) : isCurrent ? (
                    "Current Plan Active"
                  ) : (
                    <>Pay with Razorpay (UPI / Cards / NetBanking) &rarr;</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Transaction & Invoice History ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <h4 className="font-bold text-sm text-slate-900">Payment & Tax Invoice History</h4>
          </div>
          <span className="text-xs text-slate-400">{invoices.length} transaction(s)</span>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No previous billing transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5">Invoice #</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Amount</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Gateway Reference</th>
                  <th className="py-2.5 text-right">Tax Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 font-mono font-bold text-emerald-700">{inv.invoice_number}</td>
                    <td className="py-3">{new Date(inv.created_at).toLocaleDateString()}</td>
                    <td className="py-3 font-semibold">₹{inv.amount.toLocaleString("en-IN")}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-slate-400">{inv.gateway_reference || "Razorpay"}</td>
                    <td className="py-3 text-right">
                      <a
                        href={inv.invoice_url || `/api/v1/subscriptions/invoices/${inv.invoice_number}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Payment Success Modal ── */}
      {successInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl animate-in zoom-in duration-150">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Payment Confirmed!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your <strong>{successInvoice.plan_name}</strong> subscription is now active until <strong>{new Date(successInvoice.valid_until).toLocaleDateString()}</strong>.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono font-bold text-slate-900">{successInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid (incl. GST):</span>
                <span className="font-bold text-emerald-700">₹{successInvoice.amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Receipt Sent To:</span>
                <span className="text-slate-700 font-medium">Your registered email</span>
              </div>
            </div>

            <button
              onClick={() => setSuccessInvoice(null)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Close & Access Chambers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
