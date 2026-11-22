"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Scale,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  FileText,
  Building2,
  FolderCheck,
  Check,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// Citizen Registration schema
const citizenRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required (आपले पूर्ण नाव प्रविष्ट करा)"),
  email: z.string().email("Enter a valid email address (वैध ईमेल प्रविष्ट करा)"),
  phone: z.string().min(10, "Enter valid 10-digit mobile number").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters (किमान ६ अक्षरे)"),
});
type CitizenRegisterFormData = z.infer<typeof citizenRegisterSchema>;

export default function CitizenLoginPage() {
  const router = useRouter();
  const { user, isAuthenticated, citizenLogin, citizenRegister } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  // View: "login" vs "register"
  const [view, setView] = useState<"login" | "register">("login");

  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "register" || params.get("mode") === "register") {
        setView("register");
      }
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access_token");
    if (isAuthenticated && hasToken && user?.role === "citizen") {
      router.replace("/citizen-portal");
    }
  }, [hydrated, isAuthenticated, user, router]);



  // Registration Form Hook
  const {
    register: registerCitizen,
    handleSubmit: handleCitizenRegisterSubmit,
    formState: { errors: citizenErrors },
  } = useForm<CitizenRegisterFormData>({
    resolver: zodResolver(citizenRegisterSchema),
  });

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "46206747574-jed6tspi92c8rt2alfq72cbfd1h0mb9p.apps.googleusercontent.com";

  // ── Google One-Tap & Sign-In Handler ─────────────────────────────────────────
  useEffect(() => {
    if (!googleClientId || typeof window === "undefined") return;
    const checkGis = setInterval(() => {
      if ((window as any).google?.accounts?.id) {
        clearInterval(checkGis);
        try {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response?.credential) {
                setLoading(true);
                try {
                  const res = await api.post("/auth/google", {
                    credential: response.credential,
                    role: "citizen",
                  });
                  localStorage.setItem("access_token", res.data.access_token);
                  localStorage.setItem("refresh_token", res.data.refresh_token);
                  if (typeof document !== "undefined") {
                    document.cookie = `access_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
                  }
                  useAuthStore.setState({
                    user: res.data.user,
                    accessToken: res.data.access_token,
                    refreshToken: res.data.refresh_token,
                    isAuthenticated: true,
                    isLoading: false,
                  });
                  toast.success(`Welcome, ${res.data.user?.full_name || "User"}!`);
                  window.location.href = "/citizen-portal";
                } catch (err: any) {
                  toast.error(getErrorMessage(err));
                } finally {
                  setLoading(false);
                }
              }
            },
          });
          (window as any).google.accounts.id.prompt();
        } catch (e) {
          // ignore prompt errors
        }
      }
    }, 500);
    return () => clearInterval(checkGis);
  }, [googleClientId]);

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      toast.info(
        "Google Client ID is not configured yet. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID in your configuration to enable Google popup.",
        { duration: 8000 }
      );
      return;
    }

    if (typeof window === "undefined" || !(window as any).google?.accounts?.oauth2) {
      toast.error("Google Sign-In is initializing. Please click again in 2 seconds.");
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: "email profile openid",
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.access_token) {
            setLoading(true);
            try {
              const res = await api.post("/auth/google", {
                access_token: tokenResponse.access_token,
                role: "citizen",
              });

              localStorage.setItem("access_token", res.data.access_token);
              localStorage.setItem("refresh_token", res.data.refresh_token);
              if (typeof document !== "undefined") {
                document.cookie = `access_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
              }

              useAuthStore.setState({
                user: res.data.user,
                accessToken: res.data.access_token,
                refreshToken: res.data.refresh_token,
                isAuthenticated: true,
                isLoading: false,
              });

              toast.success(`Welcome, ${res.data.user?.full_name || "User"}!`);
              window.location.href = "/citizen-portal";
            } catch (err: any) {
              toast.error(getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }
        },
      });
      client.requestAccessToken();
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    }
  };



  // ── Password Login Submit ──────────────────────────────────────────────────
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Please enter email address.");
      return;
    }
    if (!passwordInput) {
      toast.error("Please enter password.");
      return;
    }

    setLoading(true);
    try {
      const u = await citizenLogin(emailInput.trim(), passwordInput);
      toast.success(`Welcome back, ${u.full_name || "Citizen"}!`);
      window.location.href = "/citizen-portal";
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Citizen Registration Submit ────────────────────────────────────────────
  const onCitizenRegister = async (data: CitizenRegisterFormData) => {
    setLoading(true);
    try {
      const u = await citizenRegister({
        full_name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone?.trim() || undefined,
        city_or_district: data.city?.trim() || undefined,
        preferred_language: "mr",
      });
      toast.success(`Account created successfully! Welcome, ${u.full_name}.`);
      router.push("/citizen-portal");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };



  const consumerServices = [
    {
      icon: ShieldAlert,
      title: "१. समस्या व कायदेशीर उपाय (Instant Legal Guidance)",
      desc: "बँक/UPI सायबर फ्रॉड, पोलीस FIR नकार, नोकरी-पगार वाद, ग्राहक संरक्षण, जमीन-घर वाद, महिला कौटुंबिक छळ व RTI यावर मोफत कायदेशीर उपाय व पुढची पावले.",
      badge: "मोफत मार्गदर्शन",
      badgeColor: "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]",
    },
    {
      icon: FileText,
      title: "२. अधिकृत कोर्ट व पोलीस अर्ज जनरेटर (₹३०)",
      desc: "वकिलांमार्फत ड्राफ्टिंगचा खर्च ₹१,५०० असतो — फास्टकेसवर कोर्ट-मान्य A4 अधिकृत अर्ज काही सेकंदांत थेट मराठी व इंग्रजीत तयार करा व PDF डाऊनलोड करा.",
      badge: "केवळ ₹३०/-",
      badgeColor: "bg-white/10 text-[#6EE7B7] border-white/20",
    },
    {
      icon: Building2,
      title: "३. मालमत्ता कायदेशीर तपासणी (Property Legal Check)",
      desc: "खरेदीपूर्वी जमीन, प्लॉट, फ्लॅटची कायदेशीर तपासणी — ७/१२, फेरफार, इंडेक्स २ व ई-कोर्ट्स वाद (eCourts Disputes) पडताळणी आणि शीर्षक रिस्क रिपोर्ट.",
      badge: "नवीन सेवा",
      badgeColor: "bg-[#059669] text-white border-transparent",
    },
    {
      icon: FolderCheck,
      title: "४. नागरिक सुरक्षित लॉकर व अर्ज ट्रॅकिंग (Citizen Vault)",
      desc: "आपले तयार केलेले सर्व अर्ज, पावत्या व कायदेशीर कागदपत्रे सुरक्षित क्लाउडमध्ये सेव्ह राहतात आणि कधीही प्रिंट/डाऊनलोड करता येतात.",
      badge: "क्लाउड सुरक्षित",
      badgeColor: "bg-white/10 text-[#6EE7B7] border-white/20",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#02201D] font-sans antialiased">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />

      {/* ── Left Branding & Consumer Portal Services Panel (Desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-gradient-to-br from-[#021F1B] via-[#03362E] to-[#02201D] text-white">

        {/* Top Header inside Left Panel */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Scale className="w-6 h-6 text-[#34D399]" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight leading-none block">Fastcase</span>
              <span className="text-[10px] text-[#6EE7B7] font-semibold uppercase tracking-widest">
                नागरिक विधी कक्ष • Consumer Portal
              </span>
            </div>
          </div>

          <a
            href="https://fastcase.in"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#34D399]" />
            <span>fastcase.in</span>
          </a>
        </div>

        {/* Middle Hero Showcase */}
        <div className="max-w-xl relative z-10 my-auto py-6 space-y-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#6EE7B7]">
              <Scale className="w-3.5 h-3.5 text-[#34D399]" />
              <span>१-क्लिक विधी सहाय्य, कोर्ट अर्ज व मालमत्ता पडताळणी</span>
            </div>

            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-[1.2] text-white">
              सामान्य नागरिकांसाठी<br />
              <span className="text-[#34D399]">कायदेशीर संरक्षण</span> व अधिकृत कोर्ट अर्ज
            </h2>

            <p className="text-white/80 text-sm xl:text-base leading-relaxed">
              आपली समस्या सांगा — कोर्ट-मान्य अधिकृत तक्रार अर्ज, कायदेशीर मार्गदर्शन आणि मालमत्ता तपासणी काही मिनिटांत मिळवा.
            </p>
          </div>

          {/* 4 Core Services Showcase Cards */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-[#6EE7B7]">
              कंझ्युमर पोर्टलवर उपलब्ध प्रमुख सेवा (Services Inside Portal):
            </p>

            <div className="grid gap-2.5">
              {consumerServices.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/15 hover:bg-white/[0.12] transition-colors flex items-start gap-3.5 shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-[#34D399]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                          {service.title}
                        </h4>
                        <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full border shrink-0", service.badgeColor)}>
                          {service.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guest Direct Access Pill */}
          <div className="pt-1">
            <Link
              href="/citizen-portal"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#013B36] hover:bg-[#024E47] border border-[#34D399]/30 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-[#013B36]/30"
            >
              <span>आधी पोर्टल एक्सप्लोर करा (Explore Portal as Guest)</span>
              <ArrowRight className="w-4 h-4 text-[#34D399]" />
            </Link>
          </div>
        </div>

        {/* Bottom Trust Highlights */}
        <div className="pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-[11px] text-white/70 relative z-10">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" /> बार कौन्सिल व विधी नियमांनुसार
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" /> केवळ ₹३०/- कोर्ट अर्ज
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" /> १००% सुरक्षित भारतीय क्लाउड
          </span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-[#F8FAFC] px-4 sm:px-8 lg:px-12 py-8 lg:py-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-4">
          {/* Mobile Header & Portal Services Preview */}
          <div className="lg:hidden space-y-3 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#013B36] text-white flex items-center justify-center shadow-xs">
                  <Scale className="w-4 h-4 text-[#34D399]" />
                </div>
                <div>
                  <span className="font-extrabold text-base text-gray-950 block leading-none">Fastcase</span>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">नागरिक विधी कक्ष</span>
                </div>
              </div>
              <a href="https://fastcase.in" className="text-[11px] font-bold text-gray-600 hover:text-gray-900 border border-gray-200 bg-white px-2.5 py-1 rounded-lg shadow-2xs">
                fastcase.in
              </a>
            </div>

            {/* Mobile Services Overview Card */}
            <div className="p-3.5 rounded-2xl bg-[#02201D] border border-white/10 text-white space-y-2 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-[#6EE7B7]">पोर्टलवर काय उपलब्ध आहे:</span>
                <Link href="/citizen-portal" className="text-[10px] font-bold text-[#34D399] flex items-center gap-1">
                  <span>एक्सप्लोर करा</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-white/90">
                <div className="p-1.5 rounded-lg bg-white/10 flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3 text-[#34D399] shrink-0" />
                  <span className="font-semibold truncate">१. समस्या व उपाय</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/10 flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-[#34D399] shrink-0" />
                  <span className="font-semibold truncate">२. कोर्ट अर्ज (₹३०)</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/10 flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 text-[#34D399] shrink-0" />
                  <span className="font-semibold truncate">३. मालमत्ता तपासणी</span>
                </div>
                <div className="p-1.5 rounded-lg bg-white/10 flex items-center gap-1.5">
                  <FolderCheck className="w-3 h-3 text-[#34D399] shrink-0" />
                  <span className="font-semibold truncate">४. जतन केलेले अर्ज</span>
                </div>
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200/90 p-6 sm:p-8"
          >
            {/* ═══════════════════════════════════════════════════════════════
                VIEW 1: SIGN IN (TRUEPAY AI MATCHING DESIGN)
            ════════════════════════════════════════════════════════════════ */}
            {view === "login" ? (
              <div className="space-y-4">
                {/* 1. Top Pill Badge */}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-[11px] font-extrabold border border-[#A7F3D0] shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="uppercase tracking-wider">ACCOUNT SIGN IN</span>
                  </div>
                </div>

                {/* 2. Heading & Subtitle */}
                <div className="space-y-1">
                  <h2 className="text-3xl font-extrabold text-gray-950 tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium leading-relaxed">
                    Sign in to your Personal Scam Shield or Business Suite workspace.
                  </p>
                </div>

                {/* 3. Google Sign-In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full py-3 px-4 rounded-2xl border border-gray-200/90 bg-white hover:bg-gray-50/80 transition-all flex items-center justify-center gap-3 shadow-2xs cursor-pointer group text-gray-700 font-bold text-xs sm:text-sm"
                >
                  {/* Official Google 4-Color Logo */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* 4. Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200/90" />
                  </div>
                  <span className="relative bg-white px-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    OR CONTINUE WITH
                  </span>
                </div>

                {/* 5. Direct Email & Password Sign-In Form */}
                <form onSubmit={handlePasswordSignIn} className="space-y-4 pt-1">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1.5">
                      REGISTERED EMAIL ADDRESS
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@example.com"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700">
                        PASSWORD
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] font-bold text-[#059669] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPass ? "text" : "password"}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-[#013B36] hover:bg-[#024E47] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* 7. Footer: Switch to Registration */}
                <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
                  New to Fastcase?{" "}
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="font-bold text-[#059669] hover:underline cursor-pointer"
                  >
                    Create free account →
                  </button>
                </div>
              </div>
            ) : (
              /* ═══════════════════════════════════════════════════════════════
                  VIEW 2: REGISTRATION (CLEAN, MATCHING DESIGN)
              ════════════════════════════════════════════════════════════════ */
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-[11px] font-extrabold border border-[#A7F3D0] shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="uppercase tracking-wider">CREATE ACCOUNT</span>
                  </div>
                  <h2 className="text-2xl font-black text-gray-950 tracking-tight">
                    Get Started with Fastcase
                  </h2>
                  <p className="text-xs text-gray-500">
                    नोंदणी करा व १-क्लिक कायदेशीर मार्गदर्शन व कोर्ट अर्ज मिळवा
                  </p>
                </div>

                <form onSubmit={handleCitizenRegisterSubmit(onCitizenRegister)} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                      पूर्ण नाव (Full Name) *
                    </label>
                    <input
                      {...registerCitizen("fullName")}
                      type="text"
                      placeholder="उदा. रमेश शंकर पाटील"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-[#059669] focus:outline-none"
                    />
                    {citizenErrors.fullName && (
                      <p className="text-[10px] text-red-500 mt-0.5">{citizenErrors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                      ईमेल आयडी (Email Address) *
                    </label>
                    <input
                      {...registerCitizen("email")}
                      type="email"
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-[#059669] focus:outline-none"
                    />
                    {citizenErrors.email && (
                      <p className="text-[10px] text-red-500 mt-0.5">{citizenErrors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                        मोबाईल (Mobile)
                      </label>
                      <input
                        {...registerCitizen("phone")}
                        type="tel"
                        placeholder="९८२२००११२२"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-[#059669] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                        शहर (City)
                      </label>
                      <input
                        {...registerCitizen("city")}
                        type="text"
                        placeholder="पुणे / मुंबई"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-[#059669] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                      पासवर्ड (Password) *
                    </label>
                    <input
                      {...registerCitizen("password")}
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-[#059669] focus:outline-none"
                    />
                    {citizenErrors.password && (
                      <p className="text-[10px] text-red-500 mt-0.5">{citizenErrors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-[#013B36] hover:bg-[#024E47] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {loading ? "Creating Account..." : "Create Account →"}
                  </button>

                  <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="font-bold text-[#059669] hover:underline cursor-pointer"
                    >
                      Sign In →
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Forgot Password / Account Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center text-[#065F46] border border-[#A7F3D0]">
                <Scale className="w-5 h-5 text-[#059669]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Reset Credentials</h3>
                <p className="text-xs text-gray-500">Fastcase Security Assistance</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you have forgotten your password or need to recover your email, please use Email OTP sign-in above or email{" "}
              <strong className="text-gray-900">support@fastcase.in</strong>.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-[#013B36] text-white font-bold text-xs rounded-xl hover:bg-[#024E47] transition cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
