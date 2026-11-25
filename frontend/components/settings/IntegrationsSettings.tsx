"use client";

import React, { useEffect, useState } from "react";
import { MessageCircle, Save, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { useFirmSettings, useUpdateFirmSettings } from "@/lib/hooks/useSettings";

export default function IntegrationsSettings() {
  const { data: settings, isLoading } = useFirmSettings();
  const updateSettings = useUpdateFirmSettings();

  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [phoneId, setPhoneId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    if (!settings?.integrations) return;
    setWhatsappEnabled(Boolean(settings.integrations.whatsapp_enabled));
    setPhoneId(settings.integrations.whatsapp_phone_id || "");
    setHasToken(Boolean(settings.integrations.has_whatsapp_token));
    setApiToken(settings.integrations.has_whatsapp_token ? "****************" : "");
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        whatsapp_enabled: whatsappEnabled,
        whatsapp_phone_id: phoneId.trim(),
      };
      if (apiToken === "") {
        payload.whatsapp_api_token = "";
      } else if (!apiToken.startsWith("********")) {
        payload.whatsapp_api_token = apiToken.trim();
      }

      const updated = await updateSettings.mutateAsync({ integrations: payload });
      setHasToken(Boolean(updated.integrations?.has_whatsapp_token));
      setApiToken(updated.integrations?.has_whatsapp_token ? "****************" : "");
      toast.success("Integration settings saved successfully!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-[#013B36]" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6"
    >
      <div>
        <h2 className="text-[15px] font-semibold text-charcoal mb-1">
          Third-Party Integrations
        </h2>
        <p className="text-[12px] text-muted">
          Connect Fastcase with external communication channels.
        </p>
      </div>

      {/* WhatsApp Integration */}
      <div className="border border-gray-100 rounded-xl p-5 hover:border-emerald-200 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-[15px]">
                WhatsApp Business API
              </h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed max-w-lg">
                Send client updates regarding upcoming hearings, invoice generation, and case progress.
              </p>

              {whatsappEnabled && (
                <div className="mt-4 space-y-3 max-w-md">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1">
                      API Key / Token {hasToken && <span className="text-emerald-600">(Saved)</span>}
                    </label>
                    <input
                      type="password"
                      value={apiToken}
                      onChange={(e) => setApiToken(e.target.value)}
                      placeholder={hasToken ? "****************" : "Enter Twilio or Meta Cloud API Token"}
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-green-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1">
                      Phone Number ID
                    </label>
                    <input
                      type="text"
                      value={phoneId}
                      onChange={(e) => setPhoneId(e.target.value)}
                      placeholder="Enter Phone Number ID"
                      className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-green-400"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
            </label>
            {whatsappEnabled ? (
              <span className="text-[11px] font-medium px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-100 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Enabled
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded">
                Disabled
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={updateSettings.isPending}
          className="h-10 px-6 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg,#6EE7B7,#72D6C9)",
            color: "#013B36",
            boxShadow: "0 4px 12px rgba(110,231,183,0.25)",
          }}
        >
          {updateSettings.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Integration Settings
            </>
          )}
        </button>
      </div>
    </form>
  );
}
