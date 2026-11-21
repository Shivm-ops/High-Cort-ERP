"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";
import { 
  LayoutDashboard, Users, FileText, Database, Shield, 
  Settings, CreditCard, LogOut, Search, Bell, Building2, Activity, LifeBuoy, BarChart3, Globe, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageProvider, useLanguage } from "@/lib/LanguageContext";

function SidebarContent({ user, router, pathname }: any) {
  const { t, language, setLanguage } = useLanguage();

  const navItems = [
    { icon: LayoutDashboard, label: t("nav.overview") || "Overview", href: "/dashboard" },
    { icon: Users, label: t("nav.users") || "Users", href: "/users" },
    { icon: Shield, label: t("nav.roles") || "Roles", href: "/roles" },
    { icon: Building2, label: t("nav.firms") || "Firms", href: "/firms" },
    { icon: CheckCircle2, label: t("nav.kyc") || "KYC Approvals", href: "/kyc" },
    { icon: CreditCard, label: t("nav.subscriptions") || "Subscriptions", href: "/subscriptions" },
    { icon: Database, label: t("nav.storage") || "Storage", href: "/storage" },
    { icon: FileText, label: t("nav.content") || "Content", href: "/content" },
    { icon: LifeBuoy, label: t("nav.support") || "Support", href: "/support" },
    { icon: BarChart3, label: t("nav.reports") || "Reports", href: "/reports" },
    { icon: Activity, label: t("nav.audit"), href: "/audit" },
    { icon: Settings, label: t("nav.settings"), href: "/settings" },
  ];

  return (
    <div className="w-64 bg-[#021F1B] text-white flex flex-col shadow-2xl z-20 border-r border-[#065F46]/30">
      <div className="p-6 border-b border-[#065F46]/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#059669]/20 border border-[#059669]/40 flex items-center justify-center shadow-lg shadow-[#059669]/15">
            <Shield className="w-6 h-6 text-[#34D399]" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">Fastcase Admin</h1>
            <p className="text-[10px] text-emerald-300/70 uppercase tracking-widest font-bold">Control Center</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mb-3 px-3">Management Modules</div>
        {navItems.map((item) => (
          <button
            key={item.href}
            onClick={() => router.push(item.href)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer",
              pathname === item.href 
                ? "bg-[#059669] text-white shadow-lg shadow-[#059669]/30" 
                : "text-emerald-100/70 hover:bg-white/[0.07] hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", pathname === item.href ? "text-white" : "text-emerald-300/80")} />
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-4 bg-[#011714] border-t border-[#065F46]/30">
        <button 
          onClick={() => router.push('/admin-profile')}
          className="w-full flex items-center gap-3 mb-3 px-2 py-2 hover:bg-white/[0.05] rounded-xl transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-xl bg-[#059669] border border-[#34D399]/40 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
            {user?.full_name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-[11px] text-emerald-300/60 truncate">{user?.email}</p>
          </div>
        </button>

        <div className="mt-2 px-2 flex items-center justify-between border-t border-[#065F46]/20 pt-3">
          <div className="flex items-center gap-2 text-emerald-300/80 w-full">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs focus:outline-none text-emerald-100 font-medium cursor-pointer flex-1"
            >
              <option value="en" className="bg-[#021F1B] text-white">English</option>
              <option value="hi" className="bg-[#021F1B] text-white">हिंदी (Hindi)</option>
              <option value="mr" className="bg-[#021F1B] text-white">मराठी (Marathi)</option>
              <option value="gu" className="bg-[#021F1B] text-white">ગુજરાતી (Gujarati)</option>
            </select>
          </div>
        </div>
        
        <button 
          onClick={async () => { 
            try { await api.post("/auth/logout"); } catch(e) {}
            localStorage.removeItem("access_token"); 
            router.push("/login"); 
          }}
          className="w-full flex items-center justify-center gap-2 py-2 mt-3 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Sanitize input helper (extra layer of protection on top of React's auto-escaping)
  const sanitizeInput = (input: string) => {
    return input.replace(/[<>]/g, ""); // Strip < and >
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowDropdown(true);
    try {
      // Backend handles SQLi via strict ORM parameterization
      const res = await api.get(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    api.get("/auth/me").then(res => {
      if (!res.data.is_superadmin) {
      api.post("/auth/logout").catch(() => {});
      localStorage.removeItem("access_token");
        router.push("/login");
      } else {
        setUser(res.data);
        setLoading(false);
      }
    }).catch(() => {
      api.post("/auth/logout").catch(() => {});
      localStorage.removeItem("access_token");
      router.push("/login");
    });
  }, [router]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading Security Context...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <SidebarContent user={user} router={router} pathname={pathname} />

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800 capitalize">
              {(() => {
                if (pathname.startsWith('/users/')) return "User Profile";
                if (pathname.startsWith('/firms/')) return "Firm Profile";
                return pathname.replace('/', '').replace(/-/g, ' ') || "Dashboard";
              })()}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <form onSubmit={handleSearch}>
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                  onFocus={() => { if(searchQuery) setShowDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  placeholder="Global search..." 
                  className="pl-9 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </form>
              
              {/* Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <ul className="max-h-64 overflow-y-auto">
                      {searchResults.map((res: any) => (
                        <li key={res.id}>
                          <button 
                            onClick={() => router.push(res.url)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex flex-col transition-colors border-b border-gray-50 last:border-0"
                          >
                            <span className="text-sm font-medium text-gray-900">{res.title}</span>
                            <span className="text-xs text-gray-500">{res.subtitle}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">No results found for &quot;{searchQuery}&quot;</div>
                  )}
                </div>
              )}
            </div>
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-100"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <MainLayout>{children}</MainLayout>
    </LanguageProvider>
  );
}
