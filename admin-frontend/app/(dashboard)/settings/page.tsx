"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Save, ShieldAlert, Globe, Server, Bell, Key, CreditCard, ExternalLink, CheckCircle2, ShieldCheck, Building2, Search, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      setSettings(res.data);
    } catch (err) {
      toast.error("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", settings);
      toast.success("Settings saved successfully");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-500 mt-1">Manage global platform configurations and security protocols.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-md shadow-[#059669]/25 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="space-y-6 pb-12 overflow-y-auto">
        
        {/* General Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-800">General Configuration</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Platform Name</label>
                <p className="text-xs text-gray-500 mb-3">The public name of your SaaS platform.</p>
                <input 
                  type="text" 
                  value={settings.platform_name || ''}
                  onChange={(e) => handleChange("platform_name", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Max Upload Size (MB)</label>
                <p className="text-xs text-gray-500 mb-3">Global file size limit for tenant uploads.</p>
                <input 
                  type="number" 
                  value={settings.max_upload_size_mb || ''}
                  onChange={(e) => handleChange("max_upload_size_mb", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Settings */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-800">Support & Communications</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Support Email</label>
                <p className="text-xs text-gray-500 mb-3">Email address for tenant support inquiries.</p>
                <input 
                  type="email" 
                  value={settings.support_email || ''}
                  onChange={(e) => handleChange("support_email", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Support Phone</label>
                <p className="text-xs text-gray-500 mb-3">Hotline number displayed in the portal.</p>
                <input 
                  type="text" 
                  value={settings.support_phone || ''}
                  onChange={(e) => handleChange("support_phone", e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Integration Hub */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
            <Key className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-gray-800">Integration Hub (API Keys)</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-6">
              <div className="p-5 border border-gray-200 rounded-xl bg-gray-50/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Razorpay Payment Gateway</h3>
                      <p className="text-xs text-gray-500">Live advocate subscription checkout & automatic billing</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {settings.razorpay_key_id?.startsWith("rzp_live_") ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Live Mode Active
                      </span>
                    ) : settings.razorpay_key_id?.startsWith("rzp_test_") ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                        Test / Sandbox Mode
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                        Simulation Mode
                      </span>
                    )}
                    <a
                      href="https://dashboard.razorpay.com/app/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      <span>Razorpay Dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Razorpay Key ID
                    </label>
                    <input 
                      type="text" 
                      value={settings.razorpay_key_id || ''}
                      onChange={(e) => handleChange("razorpay_key_id", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-xs"
                      placeholder="rzp_live_... or rzp_test_..."
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Found in Razorpay ➔ Settings ➔ API Keys</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Razorpay Key Secret
                    </label>
                    <input 
                      type="password" 
                      value={settings.razorpay_key_secret || ''}
                      onChange={(e) => handleChange("razorpay_key_secret", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-xs"
                      placeholder="••••••••••••••••"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">Kept encrypted & never exposed to frontend</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Webhook Secret (Optional)
                    </label>
                    <input 
                      type="password" 
                      value={settings.razorpay_webhook_secret || ''}
                      onChange={(e) => handleChange("razorpay_webhook_secret", e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-xs"
                      placeholder="Secret key for webhooks"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">For payment.captured background verification</p>
                  </div>
                </div>

                <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg p-3 text-xs text-indigo-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="font-bold">Webhook Endpoint for Razorpay Dashboard:</p>
                    <code className="bg-white px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 text-[11px] select-all">
                      https://api.fastcase.in/api/v1/subscriptions/webhook/razorpay
                    </code>
                  </div>
                  <div className="text-[11px] text-indigo-700">
                    Events: <strong>payment.captured</strong>, <strong>order.paid</strong>
                  </div>
                </div>
              </div>

              {/* Property & Court Search API Gateways */}
              <div className="p-5 border border-emerald-200 rounded-xl bg-emerald-50/30 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Property Legal Check & Court Search Engine</h3>
                      <p className="text-xs text-gray-500">Live API adapters for eCourtsIndia, Landeed/MahaBhumi, and CERSAI</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {settings.ecourts_api_key && settings.landeed_api_key ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Gateways Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                        Awaiting Keys
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* eCourtsIndia Partner API */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-emerald-700" />
                        eCourtsIndia Partner API
                      </span>
                      <a href="https://ecourtsindia.com/api/docs" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
                        API Docs <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">eCourts API Key</label>
                      <input 
                        type="password" 
                        value={settings.ecourts_api_key || ''}
                        onChange={(e) => handleChange("ecourts_api_key", e.target.value)}
                        placeholder="Bearer api_key_..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">API Base URL</label>
                      <input 
                        type="text" 
                        value={settings.ecourts_base_url || 'https://ecourtsindia.com/api'}
                        onChange={(e) => handleChange("ecourts_base_url", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Landeed / MahaBhumi Land Records */}
                  <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                        <Search className="w-4 h-4 text-emerald-700" />
                        MahaBhumi / Landeed Engine
                      </span>
                      <a href="https://www.landeed.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1">
                        Portal <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">Landeed API Key (7/12 & Index II)</label>
                      <input 
                        type="password" 
                        value={settings.landeed_api_key || ''}
                        onChange={(e) => handleChange("landeed_api_key", e.target.value)}
                        placeholder="ld_live_..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">API Base URL</label>
                      <input 
                        type="text" 
                        value={settings.landeed_base_url || 'https://api.landeed.com/v1'}
                        onChange={(e) => handleChange("landeed_base_url", e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Service Pricing & Tier Configuration */}
                <div className="p-4 bg-white border border-gray-200 rounded-xl">
                  <h4 className="text-xs font-bold uppercase text-gray-800 mb-3">Consumer Portal Service Pricing (INR)</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Basic Court Search (₹)</label>
                      <input 
                        type="number" 
                        value={settings.price_basic_court_search || '49'}
                        onChange={(e) => handleChange("price_basic_court_search", e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Basic Property Check (₹)</label>
                      <input 
                        type="number" 
                        value={settings.price_basic_property_check || '199'}
                        onChange={(e) => handleChange("price_basic_property_check", e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Detailed Property Check (₹)</label>
                      <input 
                        type="number" 
                        value={settings.price_detailed_property_check || '499'}
                        onChange={(e) => handleChange("price_detailed_property_check", e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-gray-600 mb-1">Advocate Title Search (₹)</label>
                      <input 
                        type="number" 
                        value={settings.price_advocate_title_search || '1499'}
                        onChange={(e) => handleChange("price_advocate_title_search", e.target.value)}
                        className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Server className="w-4 h-4 text-amber-600" /> AWS S3 Storage (Evidence & Drafts)</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Bucket Name</label>
                    <input 
                      type="text" 
                      value={settings.aws_s3_bucket || ''}
                      onChange={(e) => handleChange("aws_s3_bucket", e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">AWS Access Key</label>
                    <input 
                      type="password" 
                      value={settings.aws_access_key || ''}
                      onChange={(e) => handleChange("aws_access_key", e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">AWS Secret Key</label>
                    <input 
                      type="password" 
                      value={settings.aws_secret_key || ''}
                      onChange={(e) => handleChange("aws_secret_key", e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h2 className="font-bold text-red-800">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 border border-red-100 rounded-xl bg-red-50/50">
              <div>
                <h3 className="font-bold text-gray-900">Maintenance Mode</h3>
                <p className="text-sm text-gray-600 mt-1">If enabled, all tenants will be locked out of the platform and will see a maintenance screen.</p>
              </div>
              <button 
                onClick={() => handleChange("maintenance_mode", settings.maintenance_mode === "true" ? "false" : "true")}
                className={cn(
                  "relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none",
                  settings.maintenance_mode === "true" ? "bg-red-600" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-6 w-6 transform rounded-full bg-white transition-transform",
                    settings.maintenance_mode === "true" ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
