"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Search,
  Plus,
  ChevronDown,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle2,
  X,
  Clock,
  Sparkles,
  LogOut,
  User,
  Settings,
  Menu
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "@/lib/store/authStore";
import ClientForm from "@/components/forms/ClientForm";
import { useThemeStore, PREDEFINED_THEMES } from "@/lib/store/themeStore";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useSidebarStore } from "@/lib/store/sidebarStore";

interface Notification {
  id: string;
  type: "hearing" | "limitation" | "payment" | "document";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "hearing",
    title: "Hearing Tomorrow",
    message: "Sharma vs State — Bombay HC at 10:30 AM",
    time: "2h ago",
    isRead: false,
    priority: "high",
  },
  {
    id: "2",
    type: "limitation",
    title: "Limitation Alert",
    message: "Patel vs Union of India — 3 days remaining",
    time: "4h ago",
    isRead: false,
    priority: "high",
  },
  {
    id: "3",
    type: "payment",
    title: "Invoice Overdue",
    message: "INV-2024-089 — ₹45,000 overdue by 7 days",
    time: "1d ago",
    isRead: false,
    priority: "medium",
  },
  {
    id: "4",
    type: "document",
    title: "Document Uploaded",
    message: "Mehta Corporation — Annual report added",
    time: "2d ago",
    isRead: true,
    priority: "low",
  },
];

const NOTIFICATION_ICONS = {
  hearing: { icon: Calendar, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
  limitation: { icon: AlertTriangle, color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
  payment: { icon: CheckCircle2, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
  document: { icon: FileText, color: "#6EE7B7", bg: "rgba(110, 231, 183, 0.1)" },
};

const TODAY_HEARINGS = [
  { case: "Sharma vs State", court: "Bombay HC", time: "10:30 AM" },
  { case: "Patel Industries vs CGST", court: "CESTAT", time: "2:00 PM" },
  { case: "Mehta vs Mehta", court: "Family Court", time: "3:30 PM" },
];

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function Header({ title, subtitle, rightContent }: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHearings, setShowHearings] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Mobile sidebar trigger
  const toggleSidebar = useSidebarStore((state) => state.toggle);

  // Read theme
  const { activeThemeId, customColors } = useThemeStore();
  const { t } = useTranslation();
  const currentTheme = activeThemeId === "custom"
    ? customColors
    : PREDEFINED_THEMES.find(t => t.id === activeThemeId) || PREDEFINED_THEMES[0];
  const primaryColor = currentTheme.primary;
  const accentColor = currentTheme.accent;
  const accentTextColor = activeThemeId === "minimal" ? "#FFFFFF" : primaryColor;

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 active:scale-95 transition-all mr-1 flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-[17px] font-semibold text-charcoal truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[12px] text-muted leading-tight">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-2">
        {rightContent}

        {/* AI Search */}
        <div className="relative">
          <motion.div
            animate={{ width: searchFocused ? 280 : 200 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative"
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted"
              strokeWidth={1.75}
            />
            <input
              type="text"
              placeholder={t("common.searchPlaceholder")}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "w-full h-9 pl-9 pr-9 rounded-xl text-[13px] bg-gray-50 border transition-all duration-200",
                "placeholder:text-muted text-charcoal focus:outline-none",
                searchFocused
                  ? "border-mint/50 bg-white shadow-[0_0_0_3px_rgba(110,231,183,0.12)]"
                  : "border-gray-100 hover:border-gray-200"
              )}
            />
            <Sparkles
              className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors"
              style={{ color: searchFocused ? "var(--color-accent)" : "#9CA3AF" }}
            />
          </motion.div>
        </div>

        {/* Today's hearings */}
        <div className="relative">
          <button
            onClick={() => {
              setShowHearings(!showHearings);
              setShowNotifications(false);
            }}
            className={cn(
              "h-9 px-3 rounded-xl flex items-center gap-2 text-[13px] font-medium transition-all duration-200 border",
              showHearings
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-gray-50 border-gray-100 text-muted hover:bg-gray-100 hover:text-charcoal"
            )}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Today</span>
            <span
              className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: "rgba(59, 130, 246, 0.12)",
                color: "#2563EB",
              }}
            >
              {TODAY_HEARINGS.length}
            </span>
          </button>

          <AnimatePresence>
            {showHearings && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-charcoal">Today's Hearings</span>
                    <span className="text-[11px] text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <div className="p-2">
                  {TODAY_HEARINGS.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-medium text-charcoal truncate">{h.case}</div>
                        <div className="text-[11px] text-muted">{h.court}</div>
                      </div>
                      <span className="text-[11px] font-semibold text-blue-600 whitespace-nowrap">{h.time}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowHearings(false);
            }}
            className={cn(
              "relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border",
              showNotifications
                ? "bg-orange-50 border-orange-200 text-orange-600"
                : "bg-gray-50 border-gray-100 text-muted hover:bg-gray-100 hover:text-charcoal"
            )}
          >
            <Bell className="w-4 h-4" strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                style={{ background: "#EF4444" }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-3 border-b border-gray-50 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-charcoal">Notifications</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                      style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}
                    >
                      {unreadCount} new
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-muted hover:text-charcoal transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {MOCK_NOTIFICATIONS.map((notif) => {
                    const config = NOTIFICATION_ICONS[notif.type];
                    const Icon = config.icon;
                    return (
                      <div
                        key={notif.id}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors mb-1",
                          notif.isRead ? "hover:bg-gray-50" : "bg-orange-50/40 hover:bg-orange-50/70"
                        )}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: config.bg }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-charcoal truncate">
                              {notif.title}
                            </span>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="text-[11px] text-muted mt-0.5 leading-relaxed">
                            {notif.message}
                          </div>
                          <div className="text-[10px] text-muted/70 mt-1">{notif.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="p-2 border-t border-gray-50">
                  <button className="w-full text-center text-[12px] font-medium text-mint hover:text-mint/80 transition-colors py-1">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Quick Add */}
        <button
          onClick={() => setShowNewClientModal(true)}
          className="h-9 px-4 rounded-xl flex items-center gap-2 text-[13px] font-semibold transition-all duration-200 active:scale-95"
          style={{
            background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
            boxShadow: `0 4px 14px ${accentColor}55`,
            color: accentTextColor,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${accentColor}88`)
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.boxShadow = `0 4px 14px ${accentColor}55`)
          }
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="hidden sm:block">{t("common.newClient")}</span>
        </button>

        {/* User Profile */}
        <div className="relative ml-2">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
              setShowHearings(false);
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-bold transition-all duration-200 border border-gray-100 hover:border-gray-200 shadow-sm uppercase"
            style={{
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}cc 100%)`,
              color: accentTextColor,
            }}
          >
            {user?.full_name ? getInitials(user.full_name) : "U"}
          </button>

          <AnimatePresence>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden z-50"
              >
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <div className="text-[14px] font-bold text-charcoal">{user?.full_name || "User"}</div>
                  <div className="text-[12px] text-muted mt-0.5">{user?.email || ""}</div>
                </div>
                <div className="p-2 space-y-0.5">
                  <button 
                    onClick={() => { setShowProfileMenu(false); router.push("/settings"); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-gray-600 hover:text-charcoal hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    My Profile
                  </button>
                  <button 
                    onClick={() => { setShowProfileMenu(false); router.push("/settings"); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-gray-600 hover:text-charcoal hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Account Settings
                  </button>
                </div>
                <div className="p-2 border-t border-gray-50">
                  <button 
                    onClick={() => { setShowProfileMenu(false); logout(); }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-[13px] font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Modal open={showNewClientModal} onClose={() => setShowNewClientModal(false)} title="Add New Client" size="lg">
        <ClientForm onSuccess={() => setShowNewClientModal(false)} />
      </Modal>
    </header>
  );
}
