"use client";

import Link from "next/link";
import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Scale,
  Brain,
  Gavel,
  KeyRound,
  Mail,
  ArrowRight,
  ShieldCheck,
  FileText,
  User,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

// Advocate password schema
const passwordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type PasswordFormData = z.infer<typeof passwordSchema>;

// Citizen registration schema
const citizenRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name is required (किमान २ अक्षरे)"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter valid 10-digit mobile number").optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters (किमान ६ अक्षरे)"),
});
type CitizenRegisterFormData = z.infer<typeof citizenRegisterSchema>;

interface UnifiedAuthPageProps {
  initialPortal?: "advocate" | "citizen";
}

function UnifiedAuthContent({ initialPortal = "advocate" }: UnifiedAuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPortal = searchParams.get("portal");

  // Portal Selection: Advocate vs Citizen & Consumer
  const [portal, setPortal] = useState<"advocate" | "citizen">(
    urlPortal === "citizen" || initialPortal === "citizen" ? "citizen" : "advocate"
  );

  // Sync portal if URL changes
  useEffect(() => {
    if (urlPortal === "citizen") setPortal("citizen");
    else if (urlPortal === "advocate") setPortal("advocate");
  }, [urlPortal]);

  const handlePortalSwitch = (newPortal: "advocate" | "citizen") => {
    setPortal(newPortal);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("portal", newPortal);
      window.history.replaceState({}, "", url.toString());
    }
  };

  const { login, citizenLogin, citizenRegister } = useAuthStore();

  // Mode: "password" vs "otp"
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  // In Citizen mode: "login" vs "register"
  const [citizenView, setCitizenView] = useState<"login" | "register">("login");

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

  // Advocate / Citizen Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Citizen Registration form
  const {
    register: registerCitizen,
    handleSubmit: handleCitizenRegisterSubmit,
    formState: { errors: citizenErrors },
    reset: resetCitizenForm,
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

  // Submit Password Login (Advocate or Citizen)
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      if (portal === "advocate") {
        await login(data.email, data.password);
        toast.success("Welcome back to Fastcase Practice!");
        router.push("/dashboard");
      } else {
        const user = await citizenLogin(data.email, data.password);
        toast.success(`Welcome back, ${user.full_name || "Citizen"}!`);
        router.push("/citizen-portal");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Submit Citizen Registration
  const onCitizenRegister = async (data: CitizenRegisterFormData) => {
    setLoading(true);
    try {
      const user = await citizenRegister({
        full_name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: data.phone?.trim() || undefined,
        city_or_district: data.city?.trim() || undefined,
        preferred_language: "mr",
      });
      toast.success(`Account created successfully! Welcome, ${user.full_name}.`);
      router.push("/citizen-portal");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Send Login OTP
  const onSendLoginOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/login-otp/send", { email: otpEmail.trim().toLowerCase() });
      toast.success("Login verification code dispatched to your email");
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

  // Verify OTP
  const onVerifyLoginOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit OTP");
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
      toast.success("Welcome back!");
      if (portal === "citizen") {
        window.location.href = "/citizen-portal";
      } else {
        window.location.href = "/dashboard";
      }
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

  const advocateFeatures = [
    { icon: Brain, text: "Smart Legal Drafting", desc: "Generate bail applications, court petitions & notices in seconds" },
    { icon: Gavel, text: "Smart Case Management", desc: "Track every case stage with real-time court cause list sync" },
    { icon: FileText, text: "Document Intelligence", desc: "OCR, search, and analyze any court record or petition instantly" },
  ];

  const citizenFeatures = [
    { icon: Sparkles, text: "१-क्लिक विधी सहाय्य (1-Minute Guidance)", desc: "ग्राहक तक्रार, पोलीस एफआयआर, सायबर फ्रॉड व शासकीय अर्जांवर सोपे मार्गदर्शन" },
    { icon: FileText, text: "कोर्ट-मान्य अर्ज जनरेटर (Court-Ready Drafts)", desc: "नवीन कायद्यांनुसार (BNSS 2023) अधिकृत मराठी, हिंदी व इंग्रजी नमुना अर्ज" },
    { icon: ShieldCheck, text: "जतन केलेले अर्ज (Saved Applications)", desc: "डाऊनलोड केलेले अर्ज कायमस्वरूपी सुरक्षित जतन करा व कधीही पुन्हा प्रिंट करा" },
  ];

  return (
    <div className="flex min-h-screen bg-[#07242B] font-sans antialiased">
      {/* ── Left Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-gradient-to-br from-[#013B36] via-[#022A26] to-[#011F1C] text-white">
        {/* Decorative Grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
            <Scale className="w-6 h-6 text-mint" />
          </div>
          <div>
            <span className="font-extrabold text-2xl tracking-tight leading-none block">Fastcase</span>
            <span className="text-[10px] text-mint font-semibold uppercase tracking-widest">
              {portal === "advocate" ? "Advocate ERP Platform" : "Citizen & Consumer Legal Portal"}
            </span>
          </div>
        </div>

        {/* Dynamic Headline Based on Active Portal */}
        <div className="max-w-xl xl:max-w-2xl relative z-10 my-auto py-8">
          <AnimatePresence mode="wait">
            {portal === "advocate" ? (
              <motion.div
                key="advocate-branding"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-mint mb-5">
                  <Scale className="w-3.5 h-3.5" /> ॲडव्होकेट विधी प्रॅक्टिस कक्ष (Advocate OS)
                </div>

                <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-[50px] font-extrabold tracking-tight mb-5 lg:mb-6 leading-[1.18]">
                  India's Complete Legal<br />Operating System
                </h2>

                <p className="text-white/80 text-base lg:text-lg xl:text-xl leading-relaxed font-normal max-w-xl">
                  Manage cases, draft court petitions, track hearings, and run your advocate practice — all in one platform.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="citizen-branding"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-mint/15 border border-mint/30 text-xs font-semibold text-mint mb-5">
                  <ShieldCheck className="w-3.5 h-3.5" /> नागरिक व ग्राहक विधी सहाय्य कक्ष
                </div>

                <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-[46px] font-extrabold tracking-tight mb-5 lg:mb-6 leading-[1.18]">
                  सामान्य नागरिकांसाठी<br />१-क्लिक विधी सहाय्य व तक्रार कक्ष
                </h2>

                <p className="text-white/85 text-base lg:text-lg leading-relaxed font-normal max-w-xl">
                  ग्राहक तक्रार मंच, पोलीस ठाणे, सायबर सेल किंवा सरकारी कार्यालयात तक्रार नोंदवण्यासाठी अधिकृत कायदेशीर मार्गदर्शन व कोर्ट-मान्य नमुना अर्ज.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-4 lg:space-y-5 xl:space-y-6 relative z-10">
          <AnimatePresence mode="wait">
            {portal === "advocate" ? (
              <motion.div
                key="advocate-features"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {advocateFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-sm">
                      <f.icon className="w-5 h-5 text-mint" />
                    </div>
                    <div>
                      <h4 className="text-sm lg:text-base font-semibold text-white tracking-tight">{f.text}</h4>
                      <p className="text-xs lg:text-sm text-white/60 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="citizen-features"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3.5"
              >
                {citizenFeatures.map((f, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-mint/15 border border-mint/20 flex items-center justify-center shrink-0 shadow-sm">
                      <f.icon className="w-5 h-5 text-mint" />
                    </div>
                    <div>
                      <h4 className="text-sm lg:text-base font-semibold text-white tracking-tight">{f.text}</h4>
                      <p className="text-xs lg:text-sm text-white/70 mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}

                {/* Quick 24x7 Helplines */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4 text-xs font-semibold text-white/80">
                  <span className="text-mint font-bold">हेल्पलाईन (२४x७):</span>
                  <span>पोलीस: <strong className="text-white">११२</strong></span>
                  <span>सायबर फ्रॉड: <strong className="text-white">१९३०</strong></span>
                  <span>ग्राहक हेल्पलाईन: <strong className="text-white">१९१५</strong></span>
                  <span>मोफत विधी सेवा: <strong className="text-white">१५१००</strong></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Right Form Panel (Pixel-Perfect Card Matching Design) ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F8F6] px-5 sm:px-10 lg:px-12 xl:px-16 2xl:px-20 py-8 lg:py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md lg:max-w-lg xl:max-w-[520px] 2xl:max-w-[560px]"
        >
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sidebar flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-mint" />
            </div>
            <div>
              <span className="text-sidebar font-extrabold text-2xl tracking-tight leading-none block">Fastcase</span>
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
                {portal === "advocate" ? "Advocate ERP Platform" : "Citizen & Consumer Portal"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/80 p-6 sm:p-9 lg:p-11 xl:p-12">
            
            {/* ── Dual Portal Switcher: Advocate Portal vs Citizen & Consumer ── */}
            <div className="flex p-1.5 bg-gray-100 rounded-2xl mb-6 gap-1.5">
              {/* Advocate Portal Button */}
              <button
                type="button"
                onClick={() => {
                  handlePortalSwitch("advocate");
                  setCitizenView("login");
                }}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer text-left select-none",
                  portal === "advocate"
                    ? "bg-[#013B36] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
              >
                <Scale className={cn("w-4 h-4 shrink-0", portal === "advocate" ? "text-mint" : "text-gray-400")} />
                <div>
                  <div className={cn("text-xs sm:text-sm font-bold leading-tight", portal === "advocate" ? "text-white" : "text-gray-700")}>
                    Advocate Portal
                  </div>
                  <div className={cn("text-[10px] leading-none mt-0.5", portal === "advocate" ? "text-mint/90" : "text-gray-400")}>
                    वकील / लॉ प्रॅक्टिस
                  </div>
                </div>
              </button>

              {/* Citizen & Consumer Button */}
              <button
                type="button"
                onClick={() => {
                  handlePortalSwitch("citizen");
                }}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer text-left select-none",
                  portal === "citizen"
                    ? "bg-[#013B36] text-white shadow-md"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
                )}
              >
                <ShieldCheck className={cn("w-4 h-4 shrink-0", portal === "citizen" ? "text-mint" : "text-gray-400")} />
                <div>
                  <div className={cn("text-xs sm:text-sm font-bold leading-tight", portal === "citizen" ? "text-white" : "text-gray-700")}>
                    Citizen & Consumer
                  </div>
                  <div className={cn("text-[10px] leading-none mt-0.5", portal === "citizen" ? "text-mint/90" : "text-gray-400")}>
                    नागरिक व ग्राहक कक्ष
                  </div>
                </div>
              </button>
            </div>

            {/* ── Form Card Header ── */}
            <div className="mb-6">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
                {portal === "advocate"
                  ? "Welcome back"
                  : citizenView === "register"
                  ? "Create Citizen Account"
                  : "Welcome back"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {portal === "advocate"
                  ? "Sign in to your Fastcase practice"
                  : citizenView === "register"
                  ? "Free statutory guidance & saved legal applications (नवीन नोंदणी)"
                  : "Sign in to Citizen & Consumer Portal (नागरिक व ग्राहक कक्ष)"}
              </p>
            </div>

            {/* ── CITIZEN REGISTRATION VIEW ── */}
            {portal === "citizen" && citizenView === "register" ? (
              <form onSubmit={handleCitizenRegisterSubmit(onCitizenRegister)} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Full Name <span className="text-red-500">*</span> (आपले पूर्ण नाव)
                  </label>
                  <input
                    {...registerCitizen("fullName")}
                    type="text"
                    placeholder="उदा. रमेश शंकर पाटील"
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint",
                      citizenErrors.fullName ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  />
                  {citizenErrors.fullName && (
                    <p className="text-xs text-red-500 mt-1">{citizenErrors.fullName.message}</p>
                  )}
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span> (ईमेल आयडी)
                  </label>
                  <input
                    {...registerCitizen("email")}
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint",
                      citizenErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                    )}
                  />
                  {citizenErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{citizenErrors.email.message}</p>
                  )}
                </div>

                {/* Mobile Number & City Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Mobile Number (मोबाईल)
                    </label>
                    <input
                      {...registerCitizen("phone")}
                      type="tel"
                      placeholder="उदा. ९८२२००११२२"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint hover:border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      District / City (जिल्हा / शहर)
                    </label>
                    <input
                      {...registerCitizen("city")}
                      type="text"
                      placeholder="उदा. कोल्हापूर, पुणे"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint hover:border-gray-300"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password <span className="text-red-500">*</span> (पासवर्ड - किमान ६ अक्षरे)
                  </label>
                  <div className="relative">
                    <input
                      {...registerCitizen("password")}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className={cn(
                        "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint pr-10",
                        citizenErrors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {citizenErrors.password && (
                    <p className="text-xs text-red-500 mt-1">{citizenErrors.password.message}</p>
                  )}
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-sidebar py-3.5 text-sm font-bold text-white shadow-md hover:bg-sidebar-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Citizen Account...
                    </>
                  ) : (
                    "Create Account / खाते तयार करा ✨"
                  )}
                </button>

                {/* Switch to Sign In */}
                <div className="mt-5 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setCitizenView("login")}
                    className="font-bold text-sidebar hover:underline cursor-pointer"
                  >
                    Sign In (लॉगिन करा)
                  </button>
                </div>
              </form>
            ) : (
              /* ── LOGIN VIEW (Both Advocate & Citizen) ── */
              <div>
                {/* Auth Mode Toggle: Password vs OTP */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setAuthMode("password")}
                    className={cn(
                      "flex-1 py-2 text-xs lg:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      authMode === "password" ? "bg-white text-sidebar shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setOtpStep("email");
                    }}
                    className={cn(
                      "flex-1 py-2 text-xs lg:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      authMode === "otp" ? "bg-white text-sidebar shadow-sm" : "text-gray-500 hover:text-gray-900"
                    )}
                  >
                    <Mail className="w-3.5 h-3.5" /> Sign in with OTP
                  </button>
                </div>

                {/* Password Form */}
                {authMode === "password" && (
                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Email Address {portal === "citizen" && "(ईमेल आयडी)"}
                      </label>
                      <input
                        {...registerPassword("email")}
                        type="email"
                        placeholder={portal === "advocate" ? "advocate@lawfirm.in" : "citizen@example.com"}
                        autoComplete="email"
                        className={cn(
                          "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint",
                          passwordErrors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                        )}
                      />
                      {passwordErrors.email && (
                        <p className="text-xs text-red-500 mt-1">{passwordErrors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-gray-700">
                          Password {portal === "citizen" && "(पासवर्ड)"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowForgotModal(true)}
                          className="text-xs font-semibold text-sidebar hover:underline"
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
                            "w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint pr-10",
                            passwordErrors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.password && (
                        <p className="text-xs text-red-500 mt-1">{passwordErrors.password.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-sidebar py-3.5 text-sm font-bold text-white shadow-md hover:bg-sidebar-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </button>
                  </form>
                )}

                {/* OTP Form */}
                {authMode === "otp" && (
                  <div>
                    {otpStep === "email" ? (
                      <form onSubmit={onSendLoginOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Email Address {portal === "citizen" && "(ईमेल आयडी)"}
                          </label>
                          <input
                            type="email"
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            placeholder={portal === "advocate" ? "advocate@lawfirm.in" : "citizen@example.com"}
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint hover:border-gray-300"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full rounded-xl bg-sidebar py-3.5 text-sm font-bold text-white shadow-md hover:bg-sidebar-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending OTP...
                            </>
                          ) : (
                            <>
                              Send OTP <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-5">
                        <div className="text-center">
                          <p className="text-xs text-gray-500">
                            Enter the 6-digit code sent to <strong className="text-gray-700">{otpEmail}</strong>
                          </p>
                        </div>

                        <div className="flex justify-center gap-2">
                          {otpDigits.map((digit, i) => (
                            <input
                              key={i}
                              ref={(el) => {
                                otpInputRefs.current[i] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              value={digit}
                              onChange={(e) => handleOtpChange(i, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(i, e)}
                              className="w-10 h-12 text-center text-lg font-bold rounded-xl border border-gray-200 outline-none focus:border-mint focus:ring-2 focus:ring-mint/30 transition-all"
                            />
                          ))}
                        </div>

                        {attemptsRemaining !== null && (
                          <p className="text-xs text-center text-amber-600 font-semibold">
                            {attemptsRemaining} attempts remaining
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={onVerifyLoginOtp}
                          disabled={loading || otpDigits.join("").length !== 6}
                          className="w-full rounded-xl bg-sidebar py-3.5 text-sm font-bold text-white shadow-md hover:bg-sidebar-dark transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            "Verify & Sign In"
                          )}
                        </button>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStep("email");
                              setOtpDigits(["", "", "", "", "", ""]);
                            }}
                            className="hover:underline cursor-pointer"
                          >
                            Change Email
                          </button>
                          <button
                            type="button"
                            onClick={onSendLoginOtp}
                            disabled={!canResend || loading}
                            className={`font-bold ${canResend ? "text-sidebar hover:underline cursor-pointer" : "text-gray-400 cursor-not-allowed"}`}
                          >
                            Resend Code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Switcher */}
                <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
                  {portal === "advocate" ? (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => router.push("/register")}
                        className="font-bold text-sidebar hover:underline cursor-pointer"
                      >
                        Register Practice
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setCitizenView("register")}
                        className="font-bold text-sidebar hover:underline cursor-pointer"
                      >
                        Create Citizen Account (नवीन नागरिक नोंदणी)
                      </button>
                    </>
                  )}
                </div>

                {/* Quick Link to Consumer Portal */}
                <div className="mt-4 pt-3 border-t border-gray-100/60 text-center">
                  <p className="text-xs text-gray-400">
                    {portal === "advocate" ? (
                      <>
                        Ordinary citizen filing a grievance or complaint?{" "}
                        <button
                          type="button"
                          onClick={() => handlePortalSwitch("citizen")}
                          className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer"
                        >
                          Citizen & Consumer Portal →
                        </button>
                      </>
                    ) : (
                      <>
                        Are you an Advocate, Law Firm or Chamber?{" "}
                        <button
                          type="button"
                          onClick={() => handlePortalSwitch("advocate")}
                          className="text-emerald-700 hover:text-emerald-900 font-semibold hover:underline cursor-pointer"
                        >
                          Advocate ERP Login →
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-gray-100 mx-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-mint/10 flex items-center justify-center text-sidebar">
                <Scale className="w-5 h-5 text-sidebar" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reset Password</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              For security reasons, password resets must be verified. Please contact system support at{" "}
              <strong className="text-gray-900">support@fastcase.in</strong> or use the <strong>Sign in with OTP</strong> option to access your account immediately with a one-time code.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full rounded-xl bg-sidebar py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default function UnifiedAuthPage({ initialPortal = "advocate" }: UnifiedAuthPageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#07242B]" />}>
      <UnifiedAuthContent initialPortal={initialPortal} />
    </Suspense>
  );
}
