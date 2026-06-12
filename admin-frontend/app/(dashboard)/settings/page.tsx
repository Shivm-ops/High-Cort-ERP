"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Save, ShieldAlert, Globe, Server, Bell, Key, CreditCard } from "lucide-react";
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
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
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
              <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-600" /> Razorpay Integration</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Razorpay Key ID</label>
                    <input 
                      type="text" 
                      value={settings.razorpay_key_id || ''}
                      onChange={(e) => handleChange("razorpay_key_id", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm"
                      placeholder="rzp_live_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Razorpay Key Secret</label>
                    <input 
                      type="password" 
                      value={settings.razorpay_key_secret || ''}
                      onChange={(e) => handleChange("razorpay_key_secret", e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono text-sm"
                      placeholder="••••••••••••••••"
                    />
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
