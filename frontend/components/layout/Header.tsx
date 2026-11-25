"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Users,
  Briefcase,
  Settings,
  Menu
} from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatDate, getInitials } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "@/lib/store/authStore";
import ClientForm from "@/components/forms/ClientForm";
import { useThemeStore, PREDEFINED_THEMES } from "@/lib/store/themeStore";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import { useSidebarStore } from "@/lib/store/sidebarStore";
import { useTodayHearings } from "@/lib/hooks/useHearings";

interface Notification {
  id: string;
  type: "hearing" | "limitation" | "payment" | "document";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  priority: "high" | "medium" | "low";
}

const MOCK_NOTIFICATIONS: Notification[] = [];

const NOTIFICATION_ICONS = {
  hearing: { icon: Calendar, color: "#3B82F6", bg: "rgba(59, 130, 246, 0.1)" },
  limitation: { icon: AlertTriangle, color: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
  payment: { icon: CheckCircle2, color: "#F59E0B", bg: "rgba(245, 158, 11, 0.1)" },
  document: { icon: FileText, color: "#6EE7B7", bg: "rgba(110, 231, 183, 0.1)" },
};

function formatTime12h(t?: string) {
  if (!t) return "Scheduled";
  const [hStr, mStr] = t.split(":");
  const hr = parseInt(hStr, 10);
  if (Number.isNaN(hr)) return t;
  const hr12 = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
  return `${hr12}:${mStr || "00"} ${hr >= 12 ? "PM" : "AM"}`;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
}

export default function Header({ title, subtitle, rightContent }: HeaderProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { data: todayHearingsData } = useTodayHearings();
  const todayHearings = todayHearingsData?.hearings || [];
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHearings, setShowHearings] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ clients: any[]; cases: any[] }>({ clients: [], cases: [] });
  const [isSearching, setIsSearching] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults({ clients: [], cases: [] });
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const [clientsRes, casesRes] = await Promise.allSettled([
          api.get("/clients/", { params: { search: q, limit: 5 } }),
          api.get("/cases/", { params: { search: q, limit: 5 } }),
        ]);
        if (cancelled) return;
        setSearchResults({
          clients: clientsRes.status === "fulfilled" ? (clientsRes.value.data?.clients || []) : [],
          cases: casesRes.status === "fulfilled" ? (casesRes.value.data?.cases || []) : [],
        });
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
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
  const isAccentLight = accentColor.toLowerCase() === "#ffffff" || accentColor.toLowerCase() === "#fffff0" || accentColor.toLowerCase() === "#c0c0c0";
  const accentTextColor = isAccentLight ? (primaryColor === "#FFFFFF" ? "#1F2937" : primaryColor) : "#FFFFFF";

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;

  return (
    <header className="h-16 bg-white/90 backdrop-blur-sm border-b border-gray-100 flex items-center px-3 sm:px-6 gap-2 sm:gap-4 sticky top-0 z-30">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 active:scale-95 transition-all mr-1 flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0 pr-1">
        {title && (
          <div>
            <h1 className="text-[15px] sm:text-[17px] font-semibold text-charcoal truncate leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-[12px] text-muted truncate leading-tight hidden sm:block">{subtitle}</p>
            )}
          </div>
        )}
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {rightContent}

        {/* Global Search */}
        <div ref={searchBoxRef} className="relative hidden md:block">
          <motion.div
            animate={{ width: searchFocused ? 280 : 190 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative"
          >
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted"
              strokeWidth={1.75}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("common.searchPlaceholder")}
              onFocus={() => setSearchFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchFocused(false);
                } else if (e.key === "Enter") {
                  if (searchResults.cases[0]) {
                    setSearchFocused(false);
                    setSearchQuery("");
                    router.push(`/cases/${searchResults.cases[0].id}`);
                  } else if (searchResults.clients[0]) {
                    setSearchFocused(false);
                    setSearchQuery("");
                    router.push(`/clients/${searchResults.clients[0].id}`);
                  }
                }
              }}
              className={cn(
                "w-full h-9 pl-9 pr-8 rounded-xl text-[13px] bg-gray-50 border transition-all duration-200",
                "placeholder:text-muted text-charcoal focus:outline-none",
                searchFocused
                  ? "border-mint/50 bg-white shadow-[0_0_0_3px_rgba(110,231,183,0.12)]"
                  : "border-gray-100 hover:border-gray-200"
              )}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSearchResults({ clients: [], cases: [] }); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Sparkles
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 transition-colors pointer-events-none"
                style={{ color: searchFocused ? "var(--color-accent)" : "#9CA3AF" }}
              />
            )}
          </motion.div>

          {searchFocused && searchQuery.trim().length >= 2 && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
              {isSearching ? (
                <div className="px-4 py-4 text-xs text-gray-500">Searching clients & cases...</div>
              ) : searchResults.clients.length === 0 && searchResults.cases.length === 0 ? (
                <div className="px-4 py-4 text-xs text-gray-500">No matching clients or cases found.</div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {searchResults.clients.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Clients</div>
                      {searchResults.clients.map((cl) => (
                        <button
                          key={cl.id}
                          type="button"
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchQuery("");
                            router.push(`/clients/${cl.id}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-900 truncate">{cl.name}</div>
                            <div className="text-[11px] text-gray-400 truncate">{[cl.phone, cl.city].filter(Boolean).join(" · ") || cl.type}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.cases.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cases</div>
                      {searchResults.cases.map((ca) => (
                        <button
                          key={ca.id}
                          type="button"
                          onClick={() => {
                            setSearchFocused(false);
                            setSearchQuery("");
                            router.push(`/cases/${ca.id}`);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-gray-50 text-left transition-colors"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-gray-900 truncate">{ca.title}</div>
                            <div className="text-[11px] text-gray-400 truncate">{ca.case_no}{ca.client_name ? ` · ${ca.client_name}` : ""}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
              {todayHearings.length}
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
                    <span className="text-[13px] font-semibold text-charcoal">Today&apos;s Hearings</span>
                    <span className="text-[11px] text-muted">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</span>
                  </div>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  {todayHearings.length === 0 ? (
                    <div className="px-3 py-5 text-center text-xs text-muted">
                      No hearings scheduled for today.
                    </div>
                  ) : (
                    todayHearings.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => {
                          setShowHearings(false);
                          router.push(`/cases/${h.case_id}`);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium text-charcoal truncate">{h.case_title || h.case_no || "Matter"}</div>
                          <div className="text-[11px] text-muted truncate">{h.court || "Court"}</div>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-600 whitespace-nowrap">{formatTime12h(h.hearing_time)}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-gray-50 bg-gray-50/50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowHearings(false);
                      router.push("/hearings?tab=Today");
                    }}
                    className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50/60 transition-colors"
                  >
                    Open Hearings &amp; Calendar →
                  </button>
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
                    {unreadCount > 0 ? (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626" }}
                      >
                        {unreadCount} new
                      </span>
                    ) : (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium text-gray-500 bg-gray-100"
                      >
                        All caught up
                      </span>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-muted hover:text-charcoal transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto p-2">
                  {MOCK_NOTIFICATIONS.length > 0 ? (
                    MOCK_NOTIFICATIONS.map((notif) => {
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
                    })
                  ) : (
                    <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                      <Bell className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-[12px] text-gray-500 font-medium">No new notifications</p>
                      <p className="text-[10px] text-gray-450 mt-1 max-w-[200px] leading-relaxed">We'll alert you when something needs your attention.</p>
                    </div>
                  )}
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
          className="h-9 px-4 rounded-xl flex items-center gap-2 text-[13px] font-bold text-white transition-all duration-200 active:scale-95 shadow-sm hover:brightness-105"
          style={{
            background: "#013B36",
            boxShadow: "0 2px 10px rgba(1, 59, 54, 0.35)",
            color: "#FFFFFF",
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(1, 59, 54, 0.5)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(1, 59, 54, 0.35)")
          }
        >
          <Plus className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          <span className="hidden sm:block text-white">{t("common.newClient")}</span>
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
