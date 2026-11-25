"use client";

import React, { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  CreditCard,
  Users,
  Building2,
  ChevronRight,
  FileText,
  Scale,
  Library,
  Languages,
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";

import AdvocateProfile from "@/components/settings/AdvocateProfile";
import FirmProfile from "@/components/settings/FirmProfile";
import KYCProfile from "@/components/settings/KYCProfile";
import SubscriptionProfile from "@/components/settings/SubscriptionProfile";
import LetterheadSettings from "@/components/settings/LetterheadSettings";
import EFilingSettings from "@/components/settings/EFilingSettings";
import IntegrationsSettings from "@/components/settings/IntegrationsSettings";
import MultilingualSettings from "@/components/settings/MultilingualSettings";
import {
  DraftLibrarySettings,
  NotificationSettings,
  BillingSettings,
  TeamSettings,
  PreferenceSettings,
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
] as const;

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const validIds = new Set<string>(SECTIONS.map((s) => s.id));
  const [activeSection, setActiveSection] = useState<string>(
    tabParam && validIds.has(tabParam) ? tabParam : "profile"
  );

  useEffect(() => {
    if (tabParam && validIds.has(tabParam)) {
      setActiveSection(tabParam);
    }
  }, [tabParam]);

  const handleSelectSection = (id: string) => {
    setActiveSection(id);
    router.replace(`/settings?tab=${id}`, { scroll: false });
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "profile":
        return <AdvocateProfile />;
      case "firm":
        return <FirmProfile />;
      case "subscription":
        return <SubscriptionProfile />;
      case "kyc":
        return <KYCProfile />;
      case "letterhead":
        return <LetterheadSettings />;
      case "efiling":
        return <EFilingSettings />;
      case "drafts":
        return <DraftLibrarySettings />;
      case "notifications":
        return <NotificationSettings />;
      case "billing":
        return <BillingSettings />;
      case "team":
        return <TeamSettings />;
      case "integrations":
        return <IntegrationsSettings />;
      case "language":
        return <MultilingualSettings />;
      case "preferences":
        return <PreferenceSettings />;
      case "theme":
        return <ThemeSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="page-enter min-h-screen bg-workspace-bg">
      <Header
        title="Legal ERP Configuration Center"
        subtitle="Manage your profile, firm, workflows, and platform preferences"
      />

      <div className="p-6 flex flex-col lg:flex-row gap-5">
        {/* Sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            {SECTIONS.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => handleSelectSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-gray-50 last:border-0",
                  activeSection === s.id
                    ? "text-[#013B36]"
                    : "text-muted hover:bg-gray-50 hover:text-charcoal"
                )}
                style={activeSection === s.id ? { background: "rgba(110,231,183,0.08)" } : {}}
              >
                <s.icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-[13px] font-medium">{s.label}</span>
                {activeSection === s.id && (
                  <ChevronRight className="w-3.5 h-3.5 ml-auto" style={{ color: "#10B981" }} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {renderActiveSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="page-enter min-h-screen bg-workspace-bg p-6">
          <div className="bg-white rounded-2xl border border-gray-100 h-64 animate-pulse" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
