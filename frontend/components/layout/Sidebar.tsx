"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  ListChecks,
  Wand2,
  Library,
  ScrollText,
  Gavel,
  Search,
  Scale,
  Building2,
  Mail,
  FolderOpen,
  Receipt,
  Users2,
  Globe,
  ShieldCheck,
  Settings,
  Bot,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Bell,
  LogOut,
  ChevronDown,
  ClipboardList,
  Calculator,
  Layers,
  CheckCircle,
  Car,
  FileText,
  X
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { useThemeStore, PREDEFINED_THEMES } from "@/lib/store/themeStore";
import { useTranslation } from "react-i18next";
import { useSidebarStore } from "@/lib/store/sidebarStore";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  requiredFeature?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "My Tasks", href: "/tasks", icon: CheckCircle, badge: "Upcoming", badgeColor: "mint" },
    ],
  },
  {
    label: "Client & Litigation",
    items: [
      { label: "Client Intake", href: "/intakes", icon: ClipboardList, badge: "New", badgeColor: "coral" },
      { label: "Clients CRM", href: "/clients", icon: Users },
      { label: "Case Management", href: "/cases", icon: Briefcase, badge: "12", badgeColor: "mint" },
      { label: "MACT Management", href: "/mact", icon: Car, badge: "New", badgeColor: "blue", requiredFeature: "mact_management" },
      { label: "Hearings & Calendar", href: "/hearings", icon: CalendarDays, badge: "3", badgeColor: "orange" },
      { label: "Cause List", href: "/cause-list", icon: ListChecks },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Draft Workspace", href: "/draft-workspace", icon: Wand2 },
      { label: "AI Draft Studio", href: "/ai-draft-studio", icon: Sparkles, badge: "✨", badgeColor: "purple" },
      { label: "Legal Research & Case Laws", href: "/legal-research", icon: Search },
      { label: "Court Order Analyzer", href: "/ai-tools/analyzer", icon: FileText, badge: "AI", badgeColor: "purple", requiredFeature: "ai_tools" },
      { label: "Case Assistant", href: "/ai-assistant", icon: Layers, requiredFeature: "ai_tools" },
    ],
  },
  {
    label: "Knowledge Base",
    items: [
      { label: "Templates & Drafts", href: "/draft-library", icon: Library },
      { label: "Case Law Management", href: "/case-laws", icon: Scale },
    ],
  },
  {
    label: "Court & Practice",
    items: [
      { label: "Practice Areas", href: "/practice-areas", icon: Scale },
      { label: "Court Management", href: "/court-management", icon: Building2 },
      { label: "Notices & Replies", href: "/notices", icon: Mail },
      { label: "Evidence & Docs", href: "/evidence", icon: FolderOpen },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Billing & Invoices", href: "/billing", icon: Receipt, requiredFeature: "billing" },
      { label: "Team", href: "/team", icon: Users2 },
      { label: "Drafting", href: "/draft-workspace", icon: Wand2 },
      { label: "Limitation & Deadlines", href: "/compliance", icon: ShieldCheck },
      { label: "Tools & Calculators", href: "/tools", icon: Calculator },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];



// Translation key map for nav labels
const NAV_LABEL_KEYS: Record<string, string> = {
  "/": "nav.dashboard",
  "/tasks": "nav.myTasks",
  "/intakes": "nav.clientIntake",
  "/clients": "nav.clientsCRM",
  "/cases": "nav.caseManagement",
  "/hearings": "nav.hearings",
  "/cause-list": "nav.causeList",
  "/draft-workspace": "nav.draftWorkspace",
  "/legal-research": "nav.legalResearch",
  "/ai-assistant": "nav.caseAssistant",
  "/draft-library": "nav.templates",
  "/case-laws": "nav.caseLaws",
  "/practice-areas": "nav.practiceAreas",
  "/court-management": "nav.courtManagement",
  "/notices": "nav.notices",
  "/evidence": "nav.evidence",
  "/billing": "nav.billing",
  "/team": "nav.team",
  "/compliance": "nav.limitation",
  "/tools": "nav.tools",
  "/settings": "nav.settings",
};

const SECTION_KEY_MAP: Record<string, string> = {
  "Overview": "nav.sections.overview",
  "Client & Litigation": "nav.sections.clientLitigation",
  "Workspace": "nav.sections.workspace",
  "Knowledge Base": "nav.sections.knowledgeBase",
  "Court & Practice": "nav.sections.courtPractice",
  "Operations": "nav.sections.operations",
  "System": "nav.sections.system",
};

// Helper to darken a hex color by a given amount
function adjustColor(hex: string, amount: number): string {
  try {
    const r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return hex;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const { t } = useTranslation();

  // Mobile drawer state
  const mobileOpen = useSidebarStore((state) => state.isOpen);
  const setMobileOpen = useSidebarStore((state) => state.setIsOpen);

  // Read theme from store
  const { activeThemeId, customColors } = useThemeStore();
  const currentTheme = activeThemeId === "custom"
    ? customColors
    : PREDEFINED_THEMES.find(t => t.id === activeThemeId) || PREDEFINED_THEMES[0];
  const primaryColor = currentTheme.primary;
  const accentColor = currentTheme.accent;
  // For text on accent-colored elements, we need contrast
  // For text on accent-colored elements, we need contrast
  const accentTextColor = activeThemeId === "minimal" ? "#FFFFFF" : primaryColor;

  // Filter navigation groups based on subscription
  const subscriptionFeatures = user?.subscription?.features || [];
  const filteredNavGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.requiredFeature) return true;
      if (user?.is_superadmin) return true;
      return subscriptionFeatures.includes(item.requiredFeature);
    })
  })).filter(group => group.items.length > 0);

  const renderSidebarBody = (isMobile: boolean) => {
    return (
      <>
        {/* Ambient background orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-20 -left-20 w-64 h-64 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
          />
          <div
            className="absolute bottom-40 -right-10 w-48 h-48 rounded-full opacity-[0.08]"
            style={{ background: `radial-gradient(circle, ${accentColor} 0%, transparent 70%)` }}
          />
        </div>

        {/* Logo */}
        <div className="relative px-4 py-5 flex items-center gap-3 border-b border-white/[0.07]">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`, boxShadow: `0 4px 16px ${accentColor}55` }}
          >
            <Scale className="w-5 h-5" strokeWidth={2.5} style={{ color: accentTextColor }} />
          </div>
          <AnimatePresence mode="wait">
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="text-white font-bold text-[15px] leading-tight tracking-tight">
                  Fast<span style={{ color: accentColor }}>case</span>
                </div>
                <div className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
                  Fastcase Platform
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse toggle or close icon */}
          {isMobile ? (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-white/45 hover:text-white/80 hover:bg-white/[0.08] transition-all duration-200 flex-shrink-0"
            >
              <X className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          ) : (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all duration-200 flex-shrink-0"
            >
              {collapsed ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 sidebar-scroll">
          {filteredNavGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 py-1.5 mb-0.5"
                  >
                    <span className="text-white/40 text-[9.5px] font-semibold tracking-[0.12em] uppercase">
                      {t(SECTION_KEY_MAP[group.label] || group.label)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <div key={item.href} className="px-2 mb-0.5">
                    <Link href={item.href} onClick={() => isMobile && setMobileOpen(false)}>
                      <motion.div
                        onMouseEnter={() => setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                        className={cn(
                          "relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200",
                          "group",
                          isActive ? "nav-active" : "hover:bg-white/[0.05]"
                        )}
                      >
                        {/* Active indicator line */}
                        {isActive && (
                          <motion.div
                            layoutId={isMobile ? "mobileActiveIndicator" : "activeIndicator"}
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                            style={{ background: accentColor }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}

                        {/* Icon */}
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                          style={{
                            background: isActive
                              ? `${accentColor}25`
                              : hoveredItem === item.href ? "rgba(255,255,255,0.08)" : "transparent"
                          }}
                        >
                          <Icon
                            className="w-4 h-4 flex-shrink-0 transition-colors duration-200"
                            style={{
                              color: isActive
                                ? accentColor
                                : hoveredItem === item.href
                                ? "rgba(255,255,255,0.90)"
                                : "rgba(255,255,255,0.65)",
                            }}
                            strokeWidth={isActive ? 2 : 1.75}
                          />
                        </div>

                        {/* Label */}
                        <AnimatePresence>
                          {(!collapsed || isMobile) && (
                            <motion.span
                              initial={{ opacity: 0, x: -6 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -6 }}
                              transition={{ duration: 0.15 }}
                              className={cn(
                                "text-[13px] font-medium leading-none flex-1 truncate",
                                isActive
                                  ? "text-white"
                                  : "text-white/75 group-hover:text-white"
                              )}
                            >
                              {t(NAV_LABEL_KEYS[item.href] || item.label)}
                            </motion.span>
                          )}
                        </AnimatePresence>

                        {/* Badge */}
                        {(!collapsed || isMobile) && item.badge && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 min-w-[18px] text-center",
                              item.badgeColor === "mint" && "bg-mint/20 text-mint",
                              item.badgeColor === "orange" && "bg-premium-orange/20 text-premium-orange",
                              item.badgeColor === "coral" && "bg-premium-coral/20 text-premium-coral"
                            )}
                          >
                            {item.badge}
                          </motion.span>
                        )}

                        {/* Collapsed tooltip */}
                        {collapsed && !isMobile && hoveredItem === item.href && (
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap z-50 pointer-events-none"
                            style={{
                              background: primaryColor,
                              border: `1px solid ${accentColor}35`,
                              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                            }}
                          >
                            {item.label}
                            {item.badge && (
                              <span className="ml-1.5" style={{ color: accentColor }}>{item.badge}</span>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    </Link>
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom user profile */}
        <div className="border-t border-white/[0.07] p-3">
          <div
            className={cn(
              "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/[0.06]",
              collapsed && !isMobile && "justify-center"
            )}
          >
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
              style={{
                background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}bb 100%)`,
                color: accentTextColor,
              }}
            >
              {getInitials(user?.full_name || "Advocate")}
            </div>

            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex-1 min-w-0"
                >
                  <div className="text-white text-[12px] font-semibold truncate leading-tight">
                    {user?.full_name || "Advocate"}
                  </div>
                  <div className="text-white/35 text-[10px] truncate">{user?.role || "Partner"}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.button
                  onClick={() => {
                    isMobile && setMobileOpen(false);
                    logout();
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-white/25 hover:text-white/60 transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden md:flex relative flex-shrink-0 h-screen flex flex-col overflow-hidden z-40 print:hidden"
        style={{
          background: primaryColor === "#FFFFFF"
            ? "#1F2937"
            : `linear-gradient(160deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
        }}
      >
        {renderSidebarBody(false)}
      </motion.aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Sidebar content container */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-[260px] h-full flex flex-col overflow-hidden shadow-2xl z-50"
              style={{
                background: primaryColor === "#FFFFFF"
                  ? "#1F2937"
                  : `linear-gradient(160deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -20)} 100%)`,
              }}
            >
              {renderSidebarBody(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
