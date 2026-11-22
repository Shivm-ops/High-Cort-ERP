"use client";

import Link from "next/link";
import Script from "next/script";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Scale,
  Brain,
  Gavel,
  ArrowRight,
  ArrowLeft,
  FileText,
  Mail,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function AdvocateLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [emailInput, setEmailInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Navigate after login: On Advocate login page, always navigate to /dashboard
  // unless user explicitly passed redirect or portal query parameters.
  const navigateAfterLogin = () => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const redirectParam = params?.get("redirect");
    const portalParam = params?.get("portal");

    if (redirectParam) {
      window.location.href = redirectParam;
    } else if (portalParam === "citizen") {
      window.location.href = "/citizen-portal";
    } else {
      window.location.href = "/dashboard";
    }
  };

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
                    role: "advocate",
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
                  toast.success(`Welcome, ${res.data.user?.full_name || "Advocate"}!`);
                  navigateAfterLogin();
                } catch (err: any) {
                  toast.error(getErrorMessage(err));
                } finally {
                  setLoading(false);
                }
              }
            },
          });
          // Safe prompt with notification handler to prevent uncaught FedCM/GIS rejections
          (window as any).google.accounts.id.prompt((notification: any) => {
            if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
              // Notification skipped or dismissed, ignore silently
            }
          });
        } catch (e) {
          // ignore
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
                role: "advocate",
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

              toast.success(`Welcome, ${res.data.user?.full_name || "Advocate"}!`);
              navigateAfterLogin();
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

  // Password Submit
  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (!passwordInput || passwordInput.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await login(emailInput.trim(), passwordInput);
      const currentUser = useAuthStore.getState().user;
      toast.success("Welcome back to Fastcase Practice!");
      navigateAfterLogin();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const advocateFeatures = [
    { icon: Brain, text: "Smart Legal Drafting", desc: "Generate bail applications, court petitions & notices in seconds" },
    { icon: Gavel, text: "Smart Case Management", desc: "Track every case stage with real-time cause list updates" },
    { icon: FileText, text: "Document Intelligence", desc: "OCR, search, and analyze any court record or petition" },
  ];

  return (
    <div className="flex min-h-screen bg-[#021F1B] font-sans antialiased">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      {/* ── Left Branding Panel (TruePay AI Emerald & Mint) ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-[#021F1B] via-[#03362E] to-[#02201D] text-white">

        {/* Logo & Website button */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <Scale className="w-6 h-6 text-[#34D399]" />
            </div>
            <div>
              <span className="font-extrabold text-2xl tracking-tight leading-none block">Fastcase</span>
              <span className="text-[10px] text-[#6EE7B7] font-semibold uppercase tracking-widest">
                Advocate ERP Platform
              </span>
            </div>
          </div>

          <a
            href="https://fastcase.in"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 text-white/90 text-xs font-bold transition shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Website</span>
          </a>
        </div>

        {/* Headline */}
        <div className="max-w-xl xl:max-w-2xl relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#6EE7B7] mb-5">
            <Lock className="w-3.5 h-3.5 text-[#34D399]" /> PRIVATE & CONFIDENTIAL WORKSPACE
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-[50px] font-extrabold tracking-tight mb-5 lg:mb-6 leading-[1.18]">
            India's Complete Legal<br />
            <span className="text-[#34D399]">Operating System.</span>
          </h2>

          <p className="text-white/80 text-base lg:text-lg xl:text-xl leading-relaxed font-normal max-w-xl">
            Manage cases, draft court petitions, track hearings, and run your advocate practice — all in one platform.
          </p>
        </div>

        {/* 3 Features */}
        <div className="space-y-4 lg:space-y-5 xl:space-y-6 relative z-10">
          {advocateFeatures.map((f, i) => (
            <div key={i} className="flex items-center gap-4.5">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-sm">
                <f.icon className="w-5 h-5 text-[#34D399]" />
              </div>
              <div>
                <h4 className="text-sm lg:text-base font-semibold text-white tracking-tight">{f.text}</h4>
                <p className="text-xs lg:text-sm text-white/60 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel Matching Exact Mockup ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC] px-5 sm:px-10 lg:px-12 xl:px-16 2xl:px-20 py-8 lg:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md lg:max-w-lg xl:max-w-[480px]"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#013B36] flex items-center justify-center shadow-md text-white">
              <Scale className="w-5 h-5 text-[#34D399]" />
            </div>
            <div>
              <span className="text-gray-900 font-extrabold text-2xl tracking-tight leading-none block">Fastcase</span>
              <span className="text-[10px] text-[#013B36] font-bold uppercase tracking-wider">Advocate ERP Platform</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-9 space-y-4">
            {/* Back Link */}
            <div className="mb-2">
              <a
                href="https://fastcase.in"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#013B36] transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to fastcase.in</span>
              </a>
            </div>

            {/* 1. Top Pill Badge (TruePay AI Account Sign In) */}
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
              {/* Google 4-Color Logo */}
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
            <form onSubmit={onPasswordSubmit} className="space-y-4 pt-1">
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

            {/* 7. Footer Link */}
            <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
              New to Fastcase?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="font-bold text-[#059669] hover:underline cursor-pointer"
              >
                Create free account →
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
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
              <h3 className="text-base font-bold text-gray-900">Reset Credentials</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you have forgotten your password or need to recover your email, please use Email OTP sign-in or email{" "}
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
