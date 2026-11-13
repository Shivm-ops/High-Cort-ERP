"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Scale,
  KeyRound,
  Mail,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Sparkles,
  User,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// Citizen Password login schema
const passwordSchema = z.object({
  email: z.string().email("Enter a valid email address (वैध ईमेल प्रविष्ट करा)"),
  password: z.string().min(6, "Password must be at least 6 characters (किमान ६ अक्षरे)"),
});
type PasswordFormData = z.infer<typeof passwordSchema>;

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

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const hasToken = typeof window !== "undefined" && !!localStorage.getItem("access_token");
    if (isAuthenticated && hasToken && user?.role === "citizen") {
      router.replace("/citizen-portal");
    }
  }, [hydrated, isAuthenticated, user, router]);

  // Mode: "login" vs "register"
  const [view, setView] = useState<"login" | "register">("login");
  // In Login: "password" vs "otp"
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // OTP Login State
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Registration form
  const {
    register: registerCitizen,
    handleSubmit: handleCitizenRegisterSubmit,
    formState: { errors: citizenErrors },
  } = useForm<CitizenRegisterFormData>({
    resolver: zodResolver(citizenRegisterSchema),
  });

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authMode === "otp" && otpStep === "code" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [authMode, otpStep, timer]);

  // Citizen Password Submit
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      const u = await citizenLogin(data.email, data.password);
      toast.success(`Welcome back, ${u.full_name || "Citizen"}!`);
      router.push("/citizen-portal");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Citizen Register Submit
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
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Citizen Send OTP
  const onSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpEmail.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/login-otp/send", { email: otpEmail.trim().toLowerCase() });
      toast.success("6-digit verification OTP sent to your email");
      setOtpStep("code");
      setTimer(60);
      setCanResend(false);
      setAttemptsRemaining(null);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Citizen Verify OTP
  const onVerifyLoginOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login-otp/verify", {
        email: otpEmail.trim().toLowerCase(),
        otp: code,
        code,
      });
      localStorage.setItem("access_token", res.data.access_token);
      localStorage.setItem("refresh_token", res.data.refresh_token);
      if (typeof document !== "undefined") {
        document.cookie = `access_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      toast.success("Login successful!");
      window.location.href = "/citizen-portal";
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "object" && detail.attempts_remaining !== undefined) {
        setAttemptsRemaining(detail.attempts_remaining);
        toast.error(`Invalid OTP. ${detail.attempts_remaining} attempts remaining.`);
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < pasted.length; i++) {
          newDigits[i] = pasted[i];
        }
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        otpInputRefs.current[nextIndex]?.focus();
      }
      return;
    }
    const clean = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-gray-900 font-sans antialiased flex flex-col justify-between">
      {/* ── Clean Top Navigation Bar ── */}
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
                  नागरिक विधी कक्ष
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">
                Citizen & Consumer Legal Portal
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

      {/* ── Main Centered Clean Card ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-200/80 p-6 sm:p-8 space-y-6"
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {view === "register" ? "Create Citizen Account" : "Citizen Sign In"}
              </h2>
              <p className="text-xs text-gray-500">
                {view === "register"
                  ? "नोंदणी करा व १-क्लिक कायदेशीर मार्गदर्शन मिळवा"
                  : "नागरिक व ग्राहक विधी सहाय्य कक्षात प्रवेश करा"}
              </p>
            </div>

            {/* Segmented Dual Tabs */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setView("login")}
                className={cn(
                  "py-2 px-3 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer",
                  view === "login"
                    ? "bg-white text-emerald-950 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                <span>लॉगिन (Sign In)</span>
              </button>
              <button
                type="button"
                onClick={() => setView("register")}
                className={cn(
                  "py-2 px-3 text-xs font-black rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer",
                  view === "register"
                    ? "bg-white text-emerald-950 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>नवीन नोंदणी (Register)</span>
              </button>
            </div>

            {/* ── VIEW 1: SIGN IN ── */}
            {view === "login" && (
              <div className="space-y-4">
                {/* Auth Mode Toggle */}
                <div className="flex items-center justify-center gap-2 p-1 bg-gray-50 border border-gray-200/70 rounded-xl text-xs font-bold text-gray-600">
                  <button
                    type="button"
                    onClick={() => setAuthMode("password")}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg transition cursor-pointer text-center",
                      authMode === "password" ? "bg-white text-emerald-950 shadow-2xs font-black border border-gray-200" : "hover:text-gray-900"
                    )}
                  >
                    🔑 Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setOtpStep("email");
                    }}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg transition cursor-pointer text-center",
                      authMode === "otp" ? "bg-white text-emerald-950 shadow-2xs font-black border border-gray-200" : "hover:text-gray-900"
                    )}
                  >
                    ✉️ Sign in with OTP
                  </button>
                </div>

                {/* Password Form */}
                {authMode === "password" && (
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        ईमेल आयडी (Email Address)
                      </label>
                      <input
                        {...registerPassword("email")}
                        type="email"
                        placeholder="citizen@example.com"
                        autoComplete="email"
                        className={cn(
                          "w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium",
                          passwordErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                        )}
                      />
                      {passwordErrors.email && (
                        <p className="text-[11px] text-red-500 mt-1 font-semibold">{passwordErrors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-gray-700">
                          पासवर्ड (Password)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          {...registerPassword("password")}
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className={cn(
                            "w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 pr-10 font-medium",
                            passwordErrors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.password && (
                        <p className="text-[11px] text-red-500 mt-1 font-semibold">{passwordErrors.password.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-xs sm:text-sm font-black text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Citizen Portal</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* OTP Form */}
                {authMode === "otp" && (
                  <div className="space-y-3.5">
                    {otpStep === "email" ? (
                      <form onSubmit={onSendLoginOtp} className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">
                            ईमेल आयडी टाका (Email Address)
                          </label>
                          <input
                            type="email"
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            placeholder="citizen@example.com"
                            className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50/50 focus:bg-white font-medium"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || !otpEmail.trim()}
                          className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-xs sm:text-sm font-black text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Sending OTP...</span>
                            </>
                          ) : (
                            <>
                              <span>Send 6-Digit OTP</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-3.5 text-center">
                        <p className="text-xs text-gray-600">
                          Enter 6-digit OTP sent to <strong className="text-gray-900">{otpEmail}</strong>:
                        </p>
                        <div className="flex justify-center gap-2">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => {
                                otpInputRefs.current[idx] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-10 h-11 rounded-xl border-2 border-gray-200 text-center text-base font-black text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ))}
                        </div>

                        {attemptsRemaining !== null && (
                          <p className="text-[11px] text-amber-600 font-bold">
                            {attemptsRemaining} attempts remaining
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={onVerifyLoginOtp}
                          disabled={loading || otpDigits.join("").length !== 6}
                          className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-xs sm:text-sm font-black text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? "Verifying..." : "Verify & Sign In →"}
                        </button>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStep("email");
                              setOtpDigits(["", "", "", "", "", ""]);
                            }}
                            className="hover:underline cursor-pointer font-bold text-gray-600"
                          >
                            Change Email
                          </button>
                          <button
                            type="button"
                            onClick={onSendLoginOtp}
                            disabled={!canResend || loading}
                            className={`font-bold ${canResend ? "text-emerald-800 hover:underline cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                          >
                            {canResend ? "Resend OTP" : `Resend in ${timer}s`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW 2: REGISTRATION ── */}
            {view === "register" && (
              <form onSubmit={handleCitizenRegisterSubmit(onCitizenRegister)} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    पूर्ण नाव <span className="text-red-500">*</span> (Full Name)
                  </label>
                  <input
                    {...registerCitizen("fullName")}
                    type="text"
                    placeholder="उदा. रमेश शंकर पाटील"
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium",
                      citizenErrors.fullName ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                    )}
                  />
                  {citizenErrors.fullName && (
                    <p className="text-[11px] text-red-500 mt-1 font-semibold">{citizenErrors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ईमेल आयडी <span className="text-red-500">*</span> (Email Address)
                  </label>
                  <input
                    {...registerCitizen("email")}
                    type="email"
                    placeholder="citizen@example.com"
                    autoComplete="email"
                    className={cn(
                      "w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium",
                      citizenErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                    )}
                  />
                  {citizenErrors.email && (
                    <p className="text-[11px] text-red-500 mt-1 font-semibold">{citizenErrors.email.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      मोबाईल (Mobile)
                    </label>
                    <input
                      {...registerCitizen("phone")}
                      type="tel"
                      placeholder="९८२२००११२२"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50/50 focus:bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      शहर (City)
                    </label>
                    <input
                      {...registerCitizen("city")}
                      type="text"
                      placeholder="पुणे / मुंबई"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50/50 focus:bg-white font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    पासवर्ड <span className="text-red-500">*</span> (Password - min 6 chars)
                  </label>
                  <div className="relative">
                    <input
                      {...registerCitizen("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={cn(
                        "w-full rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 pr-10 font-medium",
                        citizenErrors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300 bg-gray-50/50 focus:bg-white"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {citizenErrors.password && (
                    <p className="text-[11px] text-red-500 mt-1 font-semibold">{citizenErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-xs sm:text-sm font-black text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Continue</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Security Note */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] font-semibold text-gray-400">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>256-bit SSL encrypted • Fastcase Verified Citizen Hub</span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* ── Clean Footer ── */}
      <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-200/60 bg-white">
        © Fastcase Legal Operating System &bull; Dedicated Civic & Consumer Legal Assistance
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-extrabold text-gray-900">Reset Password</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you forgot your password, simply select <strong>"Sign in with OTP"</strong> to log in instantly with a 6-digit code sent to your email.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setAuthMode("otp");
              }}
              className="w-full rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 transition cursor-pointer"
            >
              Sign in with OTP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
