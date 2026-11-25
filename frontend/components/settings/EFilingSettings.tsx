"use client";

import React, { useEffect, useState } from "react";
import {
  Scale,
  MapPin,
  Laptop,
  FileCheck,
  Landmark,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/api";
import { useFirmSettings, useUpdateFirmSettings } from "@/lib/hooks/useSettings";

const PORTAL_META = [
  { key: "ecourts", name: "eCourts Services", icon: Scale },
  { key: "hc_efiling", name: "High Court E-Filing", icon: Landmark },
  { key: "consumer", name: "Consumer Commission E-Filing (NCDRC/SCDRC)", icon: FileCheck },
  { key: "mact", name: "MACT E-Filing", icon: Laptop },
] as const;

type PortalKey = (typeof PORTAL_META)[number]["key"];

const INDIAN_STATES = [
  "Maharashtra",
  "Delhi",
  "Karnataka",
  "Gujarat",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Rajasthan",
  "Madhya Pradesh",
  "West Bengal",
  "Kerala",
  "Punjab",
  "Haryana",
  "Bihar",
  "Odisha",
  "Assam",
  "Chhattisgarh",
  "Jharkhand",
  "Uttarakhand",
  "Himachal Pradesh",
  "Goa",
  "Chandigarh",
];

export default function EFilingSettings() {
  const { data: settings, isLoading } = useFirmSettings();
  const updateSettings = useUpdateFirmSettings();

  const [stateVal, setStateVal] = useState("Maharashtra");
  const [districtVal, setDistrictVal] = useState("Mumbai City");
  const [portals, setPortals] = useState<
    Record<PortalKey, { username: string; configured: boolean }>
  >({
    ecourts: { username: "", configured: false },
    hc_efiling: { username: "", configured: false },
    consumer: { username: "", configured: false },
    mact: { username: "", configured: false },
  });

  const [activePortalKey, setActivePortalKey] = useState<PortalKey | null>(null);
  const [portalUsername, setPortalUsername] = useState("");

  useEffect(() => {
    if (!settings?.efiling) return;
    setStateVal(settings.efiling.state || "Maharashtra");
    setDistrictVal(settings.efiling.district || "Mumbai City");
    if (settings.efiling.portals) {
      setPortals({
        ecourts: settings.efiling.portals.ecourts || { username: "", configured: false },
        hc_efiling: settings.efiling.portals.hc_efiling || { username: "", configured: false },
        consumer: settings.efiling.portals.consumer || { username: "", configured: false },
        mact: settings.efiling.portals.mact || { username: "", configured: false },
      });
    }
  }, [settings]);

  const handleSaveJurisdiction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings.mutateAsync({
        efiling: {
          state: stateVal,
          district: districtVal.trim() || "Mumbai City",
          portals,
        },
      });
      toast.success("Default jurisdiction saved");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openPortalModal = (key: PortalKey) => {
    setActivePortalKey(key);
    setPortalUsername(portals[key]?.username || "");
  };

  const handleSavePortal = async () => {
    if (!activePortalKey) return;
    const cleanUser = portalUsername.trim();
    if (!cleanUser) {
      toast.error("Please enter an Advocate Username or Registration Number.");
      return;
    }
    const nextPortals = {
      ...portals,
      [activePortalKey]: { username: cleanUser, configured: true },
    };
    try {
      await updateSettings.mutateAsync({
        efiling: {
          state: stateVal,
          district: districtVal.trim() || "Mumbai City",
          portals: nextPortals,
        },
      });
      setPortals(nextPortals);
      toast.success("Portal reference saved");
      setActivePortalKey(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDisconnectPortal = async () => {
    if (!activePortalKey) return;
    const nextPortals = {
      ...portals,
      [activePortalKey]: { username: "", configured: false },
    };
    try {
      await updateSettings.mutateAsync({
        efiling: {
          state: stateVal,
          district: districtVal.trim() || "Mumbai City",
          portals: nextPortals,
        },
      });
      setPortals(nextPortals);
      toast.success("Portal configuration cleared");
      setActivePortalKey(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-[#013B36]" />
      </div>
    );
  }

  const activePortalMeta = PORTAL_META.find((p) => p.key === activePortalKey);

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
    >
      <div>
        <h2 className="text-[15px] font-semibold text-charcoal mb-1">
          Court & E-Filing Settings
        </h2>
        <p className="text-[12px] text-muted">
          Set your default court jurisdiction and store advocate e-filing usernames for quick form prefill.
        </p>
      </div>

      <form onSubmit={handleSaveJurisdiction} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Primary State
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <select
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-muted block mb-1.5">
              Primary District / Court Complex
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
              <input
                value={districtVal}
                onChange={(e) => setDistrictVal(e.target.value)}
                placeholder="e.g. Mumbai City, Pune, Bengaluru Urban"
                className="w-full h-10 pl-9 pr-3 rounded-xl text-[13px] bg-gray-50 border border-gray-100 focus:outline-none focus:border-[#6EE7B7] text-charcoal"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="h-9 px-4 rounded-xl bg-[#013B36] text-white text-[12px] font-semibold flex items-center gap-1.5 hover:bg-[#014D46] transition-colors disabled:opacity-60"
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Save Jurisdiction
          </button>
        </div>
      </form>

      <div className="border-t border-gray-100 pt-5">
        <div className="mb-4">
          <h3 className="text-[13px] font-semibold text-charcoal">
            E-Filing Portal References
          </h3>
          <p className="text-[11.5px] text-muted mt-0.5">
            Save your official portal advocate IDs here for reference and document headers. Live court portal login and OTP verification happen directly on the government e-Filing portals.
          </p>
        </div>

        <div className="space-y-3">
          {PORTAL_META.map((portal) => {
            const cfg = portals[portal.key] || { username: "", configured: false };
            const isConfigured = Boolean(cfg.configured && cfg.username);
            return (
              <div
                key={portal.key}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50 gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    <portal.icon className="w-4 h-4 text-charcoal" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-charcoal truncate">
                      {portal.name}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                      {isConfigured ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Configured ({cfg.username})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <AlertCircle className="w-3 h-3" /> Not Configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openPortalModal(portal.key)}
                  className={cn(
                    "text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0",
                    isConfigured
                      ? "text-gray-600 border border-gray-300 bg-white hover:bg-gray-50"
                      : "text-white bg-[#013B36] hover:bg-[#014D46]"
                  )}
                >
                  {isConfigured ? "Manage" : "Configure"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Modal
        open={!!activePortalKey}
        onClose={() => setActivePortalKey(null)}
        title={`Configure ${activePortalMeta?.name || "Portal"}`}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Save your advocate username or registration ID for {activePortalMeta?.name}. Passwords are never stored in Fastcase—authenticate with OTP directly on the official portal.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Advocate Username / Registration No.
            </label>
            <input
              value={portalUsername}
              onChange={(e) => setPortalUsername(e.target.value)}
              placeholder="e.g. MAH12342020 or portal username"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#6EE7B7]/30 focus:border-[#6EE7B7]"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {activePortalKey && portals[activePortalKey]?.configured ? (
              <button
                type="button"
                onClick={handleDisconnectPortal}
                disabled={updateSettings.isPending}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Clear Configuration
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActivePortalKey(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePortal}
                disabled={updateSettings.isPending}
                className="rounded-xl bg-[#013B36] px-4 py-2 text-sm font-semibold text-white hover:bg-[#024a44]"
              >
                {updateSettings.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
