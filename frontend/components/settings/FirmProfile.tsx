import React, { useState, useEffect } from "react";
import { Building2, FileImage, CreditCard, Mail, Phone, MapPin, Globe, Banknote, Save, Check, Key } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function FirmProfile() {
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firmData, setFirmData] = useState({
    name: "",
    gst_no: "",
    pan_no: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    ai_provider: "platform",
    ai_api_key: "",
    ai_api_base: "",
    ai_model: "",
    has_api_key: false
  });

  useEffect(() => {
    const fetchFirm = async () => {
      try {
        const res = await api.get("/users/me/firm");
        if (res.data) {
          setFirmData({
            name: res.data.name || "",
            gst_no: res.data.gst_no || "",
            pan_no: res.data.pan_no || "",
            website: res.data.website || "",
            email: res.data.email || "",
            phone: res.data.phone || "",
            address: res.data.address || "",
            ai_provider: res.data.ai_provider || "platform",
            ai_api_key: res.data.has_api_key ? "****************" : "",
            ai_api_base: res.data.ai_api_base || "",
            ai_model: res.data.ai_model || "",
            has_api_key: res.data.has_api_key || false
          });
        }
      } catch (e) {
        console.error("Failed to load firm configuration", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFirm();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        name: firmData.name,
        gst_no: firmData.gst_no,
        pan_no: firmData.pan_no,
        website: firmData.website,
        email: firmData.email,
        phone: firmData.phone,
        address: firmData.address,
        ai_provider: firmData.ai_provider,
        ai_api_base: firmData.ai_api_base,
        ai_model: firmData.ai_model
      };

      // Only send key if changed and not just the mask
      if (firmData.ai_api_key && firmData.ai_api_key !== "****************") {
        payload.ai_api_key = firmData.ai_api_key;
      } else if (firmData.ai_api_key === "") {
        payload.ai_api_key = ""; // clear key
      }

      const res = await api.patch("/users/me/firm", payload);
      if (res.data) {
        toast.success("Law Firm profile updated successfully!");
        setFirmData(prev => ({
          ...prev,
          has_api_key: res.data.has_api_key,
          ai_api_key: res.data.has_api_key ? "****************" : ""
        }));
      }
    } catch (e) {
      console.error("Failed to save firm configuration", e);
      toast.error("Failed to update law firm profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLogo(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex justify-center items-center h-64">
        <span className="text-[13px] text-muted animate-pulse">Loading Law Firm configurations...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div>
        <h2 className="text-[15px] font-semibold text-charcoal mb-1">Law Firm Profile</h2>
        <p className="text-[12px] text-muted">Firm details are used in invoices, professional correspondence, and system configuration.</p>
      </div>

      <div className="flex gap-6">
        <div className="w-32 flex-shrink-0">
          <div className="border border-dashed border-gray-200 rounded-xl p-2 h-32 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative overflow-hidden">
            {logo ? (
              <div className="relative group w-full h-full flex items-center justify-center">
                 <img src={logo} alt="Firm Logo" className="max-h-full max-w-full object-contain" />
                 <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[11px] font-bold text-red-600 cursor-pointer" onClick={() => setLogo(null)}>Remove</div>
              </div>
            ) : (
              <>
                <FileImage className="w-8 h-8 text-gray-300 mb-2" />
                <span className="text-[11px] font-semibold text-gray-700">Firm Logo</span>
              </>
            )}
            <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Firm Name</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={firmData.name}
                onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                placeholder="e.g. Sharma & Associates"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">GST Number</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={firmData.gst_no}
                onChange={(e) => setFirmData({ ...firmData, gst_no: e.target.value })}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">PAN Number</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={firmData.pan_no}
                onChange={(e) => setFirmData({ ...firmData, pan_no: e.target.value })}
                placeholder="e.g. ABCDE1234F"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={firmData.website}
                onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                placeholder="www.sharma-law.in"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={firmData.email}
                onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                placeholder="contact@sharma-law.in"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">Mobile Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input 
                value={firmData.phone}
                onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-semibold text-muted block mb-1.5">Office Address</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 text-muted" />
          <textarea 
            value={firmData.address}
            onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
            placeholder="Complete office address"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal h-20 resize-none"
          />
        </div>
      </div>

      {/* Bring Your Own Key (BYOK) AI Settings Panel */}
      <div className="border-t border-gray-100 pt-5 space-y-4">
        <div>
          <h3 className="text-[13px] font-semibold text-charcoal flex items-center gap-1.5">
            <span className="text-emerald-500">✨</span> Bring Your Own Key (BYOK) AI Settings
          </h3>
          <p className="text-[11.5px] text-muted mt-0.5">
            Configure your law firm's custom AI providers. Keys are stored securely with AES-256 backend database encryption.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">AI Provider</label>
            <select
              value={firmData.ai_provider}
              onChange={(e) => setFirmData({ ...firmData, ai_provider: e.target.value })}
              className="w-full h-10 px-3 rounded-xl text-[13px] bg-workspace-bg border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal font-medium"
            >
              <option value="platform">Platform Default (Mock/Shared Key)</option>
              <option value="openai">OpenAI API (Custom Key)</option>
            </select>
          </div>

          {firmData.ai_provider === "openai" && (
            <>
              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">OpenAI API Key</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                  <input
                    type="password"
                    value={firmData.ai_api_key}
                    onChange={(e) => setFirmData({ ...firmData, ai_api_key: e.target.value })}
                    placeholder={firmData.has_api_key ? "****************" : "sk-proj-..."}
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-workspace-bg border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">API Base URL (Optional)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                  <input
                    value={firmData.ai_api_base}
                    onChange={(e) => setFirmData({ ...firmData, ai_api_base: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-workspace-bg border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted block mb-1.5">Custom Model (Optional)</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                  <input
                    value={firmData.ai_model}
                    onChange={(e) => setFirmData({ ...firmData, ai_model: e.target.value })}
                    placeholder="gpt-4o"
                    className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-workspace-bg border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="h-10 px-6 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all hover:opacity-90" 
          style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36", boxShadow: "0 4px 12px rgba(110,231,183,0.25)" }}
        >
          {saving ? "Saving..." : <><Save className="w-4 h-4" />Save Law Firm Profile</>}
        </button>
      </div>
    </div>
  );
}
