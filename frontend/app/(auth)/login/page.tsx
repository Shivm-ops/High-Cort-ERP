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

  // Auth Channel: "email" vs "mobile"
  const [authChannel, setAuthChannel] = useState<"email" | "mobile">("email");

  // Email Sub-method: "otp" vs "password"
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // OTP Step: "input" vs "code"
  const [otpStep, setOtpStep] = useState<"input" | "code">("input");
  const [emailInput, setEmailInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");

  // OTP 6 digits
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // OTP Countdown Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpStep === "code" && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [otpStep, otpTimer]);

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
                  window.location.href = res.data.user?.role === "citizen" ? "/citizen-portal" : "/dashboard";
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
              const role = res.data.user?.role || res.data.user?.user_type;
              if (role === "citizen") {
                window.location.href = "/citizen-portal";
              } else {
                window.location.href = "/dashboard";
              }
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

  // Dispatch OTP
  const handleSendOtp = async (customEmail?: string) => {
    const targetEmail = (customEmail || (authChannel === "email" ? emailInput : phoneInput)).trim().toLowerCase();
    if (!targetEmail) {
      toast.error(authChannel === "email" ? "Please enter your email address." : "Please enter your mobile number.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login-otp/send", { email: targetEmail });
      if (res.data?.otp_debug) {
        toast.success(`Verification Code: ${res.data.otp_debug} (Valid for 10 mins)`, { duration: 15000 });
        const digits = String(res.data.otp_debug).split("").slice(0, 6);
        setOtpDigits(digits);
      } else {
        toast.success(`6-digit verification code sent to ${targetEmail}!`);
      }
      setOtpStep("code");
      setOtpTimer(600);
      setCanResend(false);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter complete 6-digit code.");
      return;
    }

    const targetEmail = (authChannel === "email" ? emailInput : phoneInput).trim().toLowerCase();
    setLoading(true);
    try {
      const res = await api.post("/auth/login-otp/verify", {
        email: targetEmail,
        otp: code,
        code,
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

      toast.success("Login successful! Welcome back.");
      const role = res.data.user?.role || res.data.user?.user_type;
      if (role === "citizen") {
        window.location.href = "/citizen-portal";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
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
      const role = currentUser?.role || (currentUser as any)?.user_type;
      if (role === "citizen") {
        window.location.href = "/citizen-portal";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    if (val.length > 1) {
      const clean = val.replace(/\D/g, "").slice(0, 6);
      const nextDigits = [...otpDigits];
      for (let i = 0; i < clean.length; i++) nextDigits[i] = clean[i];
      setOtpDigits(nextDigits);
      otpRefs.current[Math.min(clean.length, 5)]?.focus();
      return;
    }
    const cleanDigit = val.replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = cleanDigit;
    setOtpDigits(nextDigits);
    if (cleanDigit && index < 5) {
      otpRefs.current[index + 1]?.focus();
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

            {/* 5. Channel Selector: Email Address vs Mobile OTP */}
            <div className="grid grid-cols-2 p-1.5 bg-gray-50/90 rounded-2xl border border-gray-200/90 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setAuthChannel("email");
                  setOtpStep("input");
                }}
                className={cn(
                  "py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer",
                  authChannel === "email"
                    ? "bg-white text-[#013B36] font-black shadow-xs border border-gray-200/80"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                )}
              >
                <Mail className="w-4 h-4 text-[#059669]" />
                <span>Email Address</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthChannel("mobile");
                  setOtpStep("input");
                }}
                className={cn(
                  "py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer",
                  authChannel === "mobile"
                    ? "bg-white text-[#013B36] font-black shadow-xs border border-gray-200/80"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                )}
              >
                <Smartphone className="w-4 h-4 text-[#059669]" />
                <span>Mobile OTP</span>
              </button>
            </div>

            {/* 6. Sub-selector (When Email is selected) */}
            {authChannel === "email" && otpStep === "input" && (
              <div className="flex items-center justify-center gap-4 text-xs pt-1 pb-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setAuthMethod("otp")}
                  className={cn(
                    "pb-1 transition font-bold cursor-pointer relative",
                    authMethod === "otp"
                      ? "text-[#013B36] font-black border-b-2 border-[#059669]"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  Email OTP Verification
                </button>
                <span className="text-gray-300 font-light">|</span>
                <button
                  type="button"
                  onClick={() => setAuthMethod("password")}
                  className={cn(
                    "pb-1 transition font-bold cursor-pointer relative",
                    authMethod === "password"
                      ? "text-[#013B36] font-black border-b-2 border-[#059669]"
                      : "text-gray-500 hover:text-gray-800"
                  )}
                >
                  Password Sign-In
                </button>
              </div>
            )}

            {/* 7. Input Forms Based on Method */}

            {/* MODE A: Email OTP - Step 1 */}
            {authChannel === "email" && authMethod === "otp" && otpStep === "input" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
                className="space-y-4 pt-1"
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700">
                      REGISTERED EMAIL ADDRESS
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] font-bold text-[#059669] hover:underline cursor-pointer"
                    >
                      Forgot email?
                    </button>
                  </div>

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
                  <p className="text-[11px] text-gray-500 font-medium mt-1.5">
                    We will dispatch a 6-digit verification code to your registered email address.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#013B36] hover:bg-[#024E47] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Email OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODE B: 6-Digit OTP Verification Box */}
            {otpStep === "code" && (
              <div className="space-y-4 pt-1">
                <div className="text-center space-y-1">
                  <h4 className="text-sm font-black text-gray-900">Enter Verification Code</h4>
                  <p className="text-xs text-gray-500">
                    Code sent to{" "}
                    <strong className="text-gray-900 font-bold">
                      {authChannel === "email" ? emailInput : phoneInput}
                    </strong>
                  </p>
                </div>

                <div className="flex justify-between gap-2 max-w-xs mx-auto">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !digit && idx > 0) {
                          otpRefs.current[idx - 1]?.focus();
                        }
                      }}
                      className="w-11 h-12 text-center text-lg font-black bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-[#059669]/20 transition"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-medium px-1">
                  <button
                    type="button"
                    onClick={() => setOtpStep("input")}
                    className="text-gray-500 hover:text-gray-800 underline cursor-pointer"
                  >
                    Change address
                  </button>

                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => handleSendOtp()}
                      className="font-bold text-[#059669] hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  ) : (
                    <span className="text-gray-400">Resend code in {otpTimer}s</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={loading || otpDigits.join("").length !== 6}
                  className="w-full py-3.5 bg-[#013B36] hover:bg-[#024E47] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* MODE C: Password Sign-In */}
            {authChannel === "email" && authMethod === "password" && otpStep === "input" && (
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
            )}

            {/* MODE D: Mobile OTP - Step 1 */}
            {authChannel === "mobile" && otpStep === "input" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
                className="space-y-4 pt-1"
              >
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1.5">
                    REGISTERED MOBILE NUMBER
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 transition"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium mt-1.5">
                    We will dispatch a 6-digit verification code to your registered mobile number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#013B36] hover:bg-[#024E47] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#013B36]/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Mobile OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 8. Footer Link */}
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
