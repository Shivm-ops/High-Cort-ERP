"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Scale,
  KeyRound,
  Mail,
  ArrowRight,
  ShieldCheck,
  FileText,
  Sparkles,
  PhoneCall,
  User,
  CheckCircle2,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// Citizen Password login schema
const passwordSchema = z.object({
  email: z.string().email("वैध ईमेल आयडी प्रविष्ट करा (Enter valid email)"),
  password: z.string().min(6, "पासवर्ड किमान ६ अक्षरे असावा (Minimum 6 characters)"),
});
type PasswordFormData = z.infer<typeof passwordSchema>;

// Citizen Registration schema
const citizenRegisterSchema = z.object({
  fullName: z.string().min(2, "आपले पूर्ण नाव प्रविष्ट करा (Full name is required)"),
  email: z.string().email("वैध ईमेल आयडी प्रविष्ट करा (Enter valid email)"),
  phone: z.string().min(10, "१० अंकी वैध मोबाईल नंबर प्रविष्ट करा").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "पासवर्ड किमान ६ अक्षरे असावा (Minimum 6 characters)"),
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
      toast.success(`स्वागत आहे, ${u.full_name || "नागरिक"}!`);
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
      toast.success(`नोंदणी यशस्वी! स्वागत आहे, ${u.full_name}.`);
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
      toast.error("कृपया आपला ईमेल आयडी प्रविष्ट करा");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/login-otp/send", { email: otpEmail.trim().toLowerCase() });
      toast.success("आपल्या ईमेलवर ६ अंकी ओटीपी पाठवला आहे");
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
      toast.error("कृपया पूर्ण ६ अंकी ओटीपी प्रविष्ट करा");
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
      toast.success("लॉगिन यशस्वी!");
      window.location.href = "/citizen-portal";
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "object" && detail.attempts_remaining !== undefined) {
        setAttemptsRemaining(detail.attempts_remaining);
        toast.error(`चुकीचा ओटीपी. ${detail.attempts_remaining} प्रयत्न शिल्लक.`);
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
    <div className="min-h-screen bg-gradient-to-b from-[#08201A] via-[#0B2C24] to-[#061814] text-gray-900 font-sans antialiased flex flex-col justify-between">
      {/* ── Top 24x7 Emergency Legal SOS Banner ── */}
      <div className="bg-[#B91C1C] text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-center sm:justify-between gap-3 shadow-md z-20">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <span>आपत्कालीन कायदेशीर मदत (२४x७):</span>
        </div>
        <div className="flex items-center flex-wrap justify-center gap-3 sm:gap-5 text-xs font-bold">
          <a href="tel:112" className="underline hover:text-red-200">📞 पोलीस: ११२</a>
          <a href="tel:1930" className="underline hover:text-red-200">💳 सायबर फ्रॉड: १९३०</a>
          <a href="tel:1915" className="underline hover:text-red-200">🛒 ग्राहक तक्रार: १९१५</a>
          <a href="tel:1091" className="underline hover:text-red-200">👩 महिला: १०९१</a>
          <a href="tel:15100" className="underline hover:text-red-200">⚖ मोफत विधी सेवा: १५१००</a>
        </div>
      </div>

      {/* ── Main Centered Civic Auth Container (Totally Different Design) ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-lg relative z-10 space-y-6">
          {/* Civic Header Title */}
          <div className="text-center space-y-2 text-white">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-sm">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>सामान्य नागरिक व ग्राहक विधी सहाय्य कक्ष</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              नागरिक पोर्टल प्रवेश
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/80 max-w-md mx-auto">
              आपली समस्या सांगा, कायदेशीर मार्गदर्शन मिळवा व कोर्ट-मान्य अधिकृत अर्ज डाऊनलोड करा.
            </p>
          </div>

          {/* ── Dedicated Consumer Auth Card ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 space-y-6"
          >
            {/* Prominent Dual Tabs: Sign In vs Create Account */}
            <div className="grid grid-cols-2 p-1.5 bg-gray-100/90 rounded-2xl gap-1">
              <button
                type="button"
                onClick={() => setView("login")}
                className={cn(
                  "py-2.5 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  view === "login"
                    ? "bg-white text-emerald-950 shadow-md border border-gray-200/60"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <KeyRound className="w-4 h-4 text-emerald-700" />
                <span>लॉगिन (Sign In)</span>
              </button>
              <button
                type="button"
                onClick={() => setView("register")}
                className={cn(
                  "py-2.5 px-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  view === "register"
                    ? "bg-white text-emerald-950 shadow-md border border-gray-200/60"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>नवीन नोंदणी (Register)</span>
              </button>
            </div>

            {/* ── VIEW 1: CITIZEN SIGN IN ── */}
            {view === "login" && (
              <div className="space-y-5">
                {/* Auth Mode Toggle: Password vs OTP */}
                <div className="flex items-center justify-center gap-2 p-1 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs font-bold text-gray-700">
                  <button
                    type="button"
                    onClick={() => setAuthMode("password")}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg transition cursor-pointer text-center",
                      authMode === "password" ? "bg-emerald-800 text-white shadow-xs font-black" : "hover:text-emerald-900"
                    )}
                  >
                    🔑 पासवर्डद्वारे (Password)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setOtpStep("email");
                    }}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg transition cursor-pointer text-center",
                      authMode === "otp" ? "bg-emerald-800 text-white shadow-xs font-black" : "hover:text-emerald-900"
                    )}
                  >
                    ✉️ ओटीपीद्वारे (Sign in with OTP)
                  </button>
                </div>

                {/* Password Form */}
                {authMode === "password" && (
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        ईमेल आयडी (Email Address)
                      </label>
                      <input
                        {...registerPassword("email")}
                        type="email"
                        placeholder="उदा. citizen@example.com"
                        autoComplete="email"
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600",
                          passwordErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                        )}
                      />
                      {passwordErrors.email && (
                        <p className="text-xs text-red-500 mt-1 font-semibold">{passwordErrors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-bold text-gray-700">
                          पासवर्ड (Password)
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                        >
                          पासवर्ड विसरलात?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          {...registerPassword("password")}
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className={cn(
                            "w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 pr-11",
                            passwordErrors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.password && (
                        <p className="text-xs text-red-500 mt-1 font-semibold">{passwordErrors.password.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 py-3.5 text-sm font-black text-white shadow-lg hover:from-emerald-900 hover:to-teal-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>लॉगिन होत आहे...</span>
                        </>
                      ) : (
                        <>
                          <span>लॉगिन करा व कंझ्युमर पोर्टल उघडा</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* OTP Form */}
                {authMode === "otp" && (
                  <div className="space-y-4">
                    {otpStep === "email" ? (
                      <form onSubmit={onSendLoginOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            आपला ईमेल आयडी टाका (Email Address)
                          </label>
                          <input
                            type="email"
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            placeholder="citizen@example.com"
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading || !otpEmail.trim()}
                          className="w-full rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 py-3.5 text-sm font-black text-white shadow-lg hover:from-emerald-900 hover:to-teal-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>ओटीपी पाठवत आहे...</span>
                            </>
                          ) : (
                            <>
                              <span>६ अंकी ओटीपी कोड पाठवा</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4 text-center">
                        <p className="text-xs text-gray-600">
                          <strong className="text-gray-900">{otpEmail}</strong> वर पाठवलेला ६ अंकी कोड प्रविष्ट करा:
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
                              className="w-11 h-12 rounded-xl border-2 border-gray-200 text-center text-lg font-black text-gray-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ))}
                        </div>

                        {attemptsRemaining !== null && (
                          <p className="text-xs text-amber-600 font-bold">
                            {attemptsRemaining} प्रयत्न शिल्लक आहेत
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={onVerifyLoginOtp}
                          disabled={loading || otpDigits.join("").length !== 6}
                          className="w-full rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 py-3.5 text-sm font-black text-white shadow-lg hover:from-emerald-900 hover:to-teal-950 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? "ओटीपी तपासत आहे..." : "ओटीपी तपासा व पोर्टल उघडा →"}
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
                            ईमेल बदला
                          </button>
                          <button
                            type="button"
                            onClick={onSendLoginOtp}
                            disabled={!canResend || loading}
                            className={`font-bold ${canResend ? "text-emerald-800 hover:underline cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                          >
                            {canResend ? "पुन्हा ओटीपी पाठवा" : `पुन्हा पाठवा (${timer}s)`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW 2: CITIZEN REGISTRATION ── */}
            {view === "register" && (
              <form onSubmit={handleCitizenRegisterSubmit(onCitizenRegister)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    आपले पूर्ण नाव <span className="text-red-500">*</span> (Full Name)
                  </label>
                  <input
                    {...registerCitizen("fullName")}
                    type="text"
                    placeholder="उदा. रमेश शंकर पाटील"
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600",
                      citizenErrors.fullName ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  />
                  {citizenErrors.fullName && (
                    <p className="text-xs text-red-500 mt-1 font-semibold">{citizenErrors.fullName.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    ईमेल आयडी <span className="text-red-500">*</span> (Email Address)
                  </label>
                  <input
                    {...registerCitizen("email")}
                    type="email"
                    placeholder="citizen@example.com"
                    autoComplete="email"
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600",
                      citizenErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  />
                  {citizenErrors.email && (
                    <p className="text-xs text-red-500 mt-1 font-semibold">{citizenErrors.email.message}</p>
                  )}
                </div>

                {/* Mobile & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      मोबाईल नंबर (Mobile)
                    </label>
                    <input
                      {...registerCitizen("phone")}
                      type="tel"
                      placeholder="उदा. ९८२२००११२२"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      शहर / जिल्हा (City)
                    </label>
                    <input
                      {...registerCitizen("city")}
                      type="text"
                      placeholder="उदा. पुणे / मुंबई"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 hover:border-gray-300"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    पासवर्ड सेट करा <span className="text-red-500">*</span> (Password - किमान ६ अक्षरे)
                  </label>
                  <div className="relative">
                    <input
                      {...registerCitizen("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 pr-11",
                        citizenErrors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {citizenErrors.password && (
                    <p className="text-xs text-red-500 mt-1 font-semibold">{citizenErrors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 py-3.5 text-sm font-black text-white shadow-lg hover:from-emerald-900 hover:to-teal-950 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>नोंदणी होत आहे...</span>
                    </>
                  ) : (
                    <>
                      <span>नवीन खाते तयार करा व पोर्टल उघडा</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom 3 Trust Badges */}
            <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-[11px] font-bold text-gray-600">
              <div className="p-2 rounded-xl bg-gray-50 flex flex-col items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>१००% मोफत मार्गदर्शन</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 flex flex-col items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>कोर्ट अर्ज (₹४९)</span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 flex flex-col items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>सुरक्षित व गोपनीय</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-extrabold text-gray-900">पासवर्ड रीसेट कसा करावा?</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-5">
              नागरिक सुरक्षिततेसाठी आपण पासवर्ड विसरल्यास <strong>"ओटीपीद्वारे (Sign in with OTP)"</strong> पर्याय निवडून आपल्या ईमेलवर आलेल्या ६ अंकी कोडने थेट लॉगिन करू शकता. किंवा मदतीसाठी <strong>support@fastcase.in</strong> वर संपर्क साधावा.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowForgotModal(false);
                setAuthMode("otp");
              }}
              className="w-full rounded-xl bg-emerald-800 py-3 text-xs font-bold text-white hover:bg-emerald-900 transition cursor-pointer"
            >
              ओटीपीने लॉगिन करा (Sign in with OTP)
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
