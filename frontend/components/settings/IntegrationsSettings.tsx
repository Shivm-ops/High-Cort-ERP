import React, { useState } from "react";
import { MessageCircle, Link as LinkIcon, Info } from "lucide-react";

export default function IntegrationsSettings() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Third-Party Integrations</h2>
        <p className="text-[13px] text-gray-500">Connect LegalOS with external platforms.</p>
      </div>

      {/* WhatsApp Integration */}
      <div className="border border-gray-100 rounded-xl p-5 hover:border-blue-100 transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-[15px]">WhatsApp Business API</h3>
              <p className="text-[13px] text-gray-500 mt-1 leading-relaxed max-w-lg">
                Automatically send automated updates to your clients regarding upcoming hearings, invoice generation, and case progress.
              </p>
              
              {whatsappEnabled && (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1">API Key / Token</label>
                    <input type="password" placeholder="Enter Twilio or Meta Cloud API Token" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-green-400" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-gray-600 mb-1">Phone Number ID</label>
                    <input type="text" placeholder="Enter Phone Number ID" className="w-full h-9 px-3 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-green-400" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={whatsappEnabled} onChange={(e) => setWhatsappEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
            {whatsappEnabled && (
              <span className="text-[11px] font-medium px-2 py-1 bg-green-50 text-green-700 rounded border border-green-100">
                Active
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
