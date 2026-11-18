"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";
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

  // Modern Login Channel: "email" vs "mobile"
  const [authChannel, setAuthChannel] = useState<"email" | "mobile">("email");

  // Email Sub-method: "otp" vs "password"
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // OTP Step: "input" (enter email/phone) vs "code" (enter 6 digits)
  const [otpStep, setOtpStep] = useState<"input" | "code">("input");
  const [emailInput, setEmailInput] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");

  // OTP 6 digits input state
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpTimer, setOtpTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  // ── Dispatch OTP (Email or Mobile) ─────────────────────────────────────────
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

  // ── Verify 6-digit OTP & Sign In ───────────────────────────────────────────
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
      window.location.href = "/citizen-portal";
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-gray-900 font-sans antialiased flex flex-col justify-between">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      {/* ── Top Navigation Bar ── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-gray-900 leading-none">
                  Fastcase
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase">
                  विधी कक्ष
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Legal OS & Grievance Portal
              </p>
            </div>
          </div>

          <a
            href="https://fastcase.in"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
            <span>Back to fastcase.in</span>
          </a>
        </div>
      </header>

      {/* ── Main Centered Container Matching Exact Mockup ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200/90 p-6 sm:p-8"
          >
            {/* ═══════════════════════════════════════════════════════════════
                VIEW 1: SIGN IN (PIXEL-PERFECT MATCH TO ATTACHED IMAGE)
            ════════════════════════════════════════════════════════════════ */}
            {view === "login" ? (
              <div className="space-y-4">
                {/* 1. Top Pill Badge */}
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200/90 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
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
                        ? "bg-white text-emerald-950 font-black shadow-xs border border-gray-200/80"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                    )}
                  >
                    <Mail className="w-4 h-4 text-emerald-700" />
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
                        ? "bg-white text-emerald-950 font-black shadow-xs border border-gray-200/80"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
                    )}
                  >
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <span>Mobile OTP</span>
                  </button>
                </div>

                {/* 6. Sub-selector (When channel is Email): OTP vs Password */}
                {authChannel === "email" && otpStep === "input" && (
                  <div className="flex items-center justify-center gap-4 text-xs pt-1 pb-2 border-b border-gray-100">
                    <button
                      type="button"
                      onClick={() => setAuthMethod("otp")}
                      className={cn(
                        "pb-1 transition font-bold cursor-pointer relative",
                        authMethod === "otp"
                          ? "text-emerald-900 font-black border-b-2 border-emerald-700"
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
                          ? "text-emerald-900 font-black border-b-2 border-emerald-700"
                          : "text-gray-500 hover:text-gray-800"
                      )}
                    >
                      Password Sign-In
                    </button>
                  </div>
                )}

                {/* 7. Input Forms Based on Selected Mode */}

                {/* MODE A: Email OTP - Step 1 (Input Email) */}
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
                          onClick={() => toast.info("Please contact support@fastcase.in for account recovery.")}
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-500/10 transition"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-1.5">
                        We will dispatch a 6-digit verification code to your registered email address.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                          className="w-11 h-12 text-center text-lg font-black bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition"
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
                          className="font-bold text-emerald-800 hover:underline cursor-pointer"
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
                      className="w-full py-3.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

                {/* MODE C: Email Password Sign-In */}
                {authChannel === "email" && authMethod === "password" && otpStep === "input" && (
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
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-500/10 transition"
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
                          className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
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
                          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-500/10 transition"
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
                      className="w-full py-3.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700">
                          REGISTERED MOBILE NUMBER
                        </label>
                      </div>

                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          placeholder="+91 98765 43210"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200/90 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-500/10 transition"
                        />
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-1.5">
                        We will dispatch a 6-digit verification code to your registered mobile number.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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

                {/* 8. Footer: Switch to Registration */}
                <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
                  New to Fastcase?{" "}
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="font-bold text-emerald-800 hover:underline cursor-pointer"
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-extrabold border border-emerald-200/90 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-emerald-700 focus:outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-emerald-700 focus:outline-none"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-emerald-700 focus:outline-none"
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
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-emerald-700 focus:outline-none"
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:border-emerald-700 focus:outline-none"
                    />
                    {citizenErrors.password && (
                      <p className="text-[10px] text-red-500 mt-0.5">{citizenErrors.password.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-900 hover:bg-emerald-950 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                  >
                    {loading ? "Creating Account..." : "Create Account →"}
                  </button>

                  <div className="pt-3 border-t border-gray-100 text-center text-xs text-gray-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setView("login")}
                      className="font-bold text-emerald-800 hover:underline cursor-pointer"
                    >
                      Sign In →
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Forgot Password / Account Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-gray-100 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Scale className="w-5 h-5 text-emerald-700" />
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
              className="w-full py-2.5 bg-emerald-900 text-white font-bold text-xs rounded-xl hover:bg-emerald-950 transition cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
