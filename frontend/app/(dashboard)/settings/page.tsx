"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Shield, Palette, Globe, CreditCard, Users, Building2, Save, Check, ChevronRight, FileText, Scale, Library, Languages
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";

import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import AdvocateProfile from "@/components/settings/AdvocateProfile";
import FirmProfile from "@/components/settings/FirmProfile";
import KYCProfile from "@/components/settings/KYCProfile";
import SubscriptionProfile from "@/components/settings/SubscriptionProfile";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import EFilingSettings from "@/components/settings/EFilingSettings";
import IntegrationsSettings from "@/components/settings/IntegrationsSettings";

import {
  DraftLibrarySettings,
  NotificationSettings,
  BillingSettings,
  TeamSettings,
  MultilingualSettings,
  PreferenceSettings
} from "@/components/settings/MiscSettings";

import ThemeSettings from "@/components/settings/ThemeSettings";

const SECTIONS = [
  { id: "profile", label: "Advocate Profile", icon: User },
  { id: "firm", label: "Law Firm Profile", icon: Building2 },
  { id: "subscription", label: "Subscription Plan", icon: CreditCard },
  { id: "kyc", label: "KYC & Compliance", icon: Shield },
  { id: "letterhead", label: "Letterhead Management", icon: FileText },
  { id: "efiling", label: "Court & E-Filing", icon: Scale },
  { id: "drafts", label: "Draft Library", icon: Library },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "team", label: "Team & Permissions", icon: Users },
  { id: "integrations", label: "Third-Party Integrations", icon: Globe },
  { id: "language", label: "Multilingual", icon: Languages },
  { id: "preferences", label: "Personal Preferences", icon: Palette },
  { id: "theme", label: "Theme & Branding", icon: Palette },
];

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || "",
    phone: user?.phone || "",
  });

  const handleSave = async () => {
    try {
      if (activeSection === "profile") {
        const res = await api.patch("/users/me", {
          full_name: profileData.full_name,
          phone: profileData.phone,
        });
        if (res.data) {
          setUser(res.data);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error("Failed to save", e);
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "profile": return <AdvocateProfile profileData={profileData} setProfileData={setProfileData} />;
      case "firm": return <FirmProfile />;
      case "subscription": return <SubscriptionProfile />;
      case "kyc": return <KYCProfile />;
      case "letterhead": return <LetterheadSettings />;
      case "efiling": return <EFilingSettings />;
      case "drafts": return <DraftLibrarySettings />;
      case "notifications": return <NotificationSettings />;
      case "billing": return <BillingSettings />;
      case "team": return <TeamSettings />;
      case "integrations": return <IntegrationsSettings />;
      case "language": return <MultilingualSettings />;
      case "preferences": return <PreferenceSettings />;
      case "theme": return <ThemeSettings />;
      default: return null;
    }
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header title="Legal ERP Configuration Center" subtitle="Manage your profile, firm, workflows, and platform preferences" />

      <div className="p-6 flex gap-5">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-gray-50 last:border-0",
                  activeSection === s.id ? "text-[#013B36]" : "text-muted hover:bg-gray-50 hover:text-charcoal"
                )}
                style={activeSection === s.id ? { background: "rgba(110,231,183,0.06)" } : {}}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[13px] font-medium">{s.label}</span>
                {activeSection === s.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "#6EE7B7" }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderActiveSection()}
          </motion.div>

          <div className="flex justify-end pt-4">
            <button onClick={handleSave} className="h-10 px-6 rounded-xl text-[13px] font-semibold flex items-center gap-2 transition-all" style={{ background: "linear-gradient(135deg,#6EE7B7,#72D6C9)", color: "#013B36", boxShadow: "0 4px 14px rgba(110,231,183,0.35)" }}>
              {saved ? <><Check className="w-4 h-4" />Saved Successfully</> : <><Save className="w-4 h-4" />Save All Configurations</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
