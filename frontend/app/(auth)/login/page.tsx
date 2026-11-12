"use client";

import Link from "next/link";
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
  ShieldCheck,
  FileText,
  Brain,
  Gavel,
  KeyRound,
  Mail,
  ArrowRight,
  RefreshCw,
  Clock,
  ShoppingBag,
  PhoneCall,
  User,
  MapPin,
  Sparkles,
  Globe,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";

type PortalType = "advocate" | "citizen";
type CitizenLang = "mr" | "hi" | "en";

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type PasswordFormData = z.infer<typeof passwordSchema>;

const CITIZEN_TEXT: Record<CitizenLang, Record<string, string>> = {
  mr: {
    portalBadge: "नागरिक व ग्राहक विधी सहाय्य कक्ष",
    mainHeading: "नागरिक व ग्राहक पोर्टल",
    subHeading: "ग्राहक तक्रार (ग्राहक मंच), पोलीस तक्रार, सायबर गुन्हे व मोफत विधी मार्गदर्शन",
    tabLogin: "नागरिक लॉगिन",
    tabRegister: "नवीन नोंदणी (विनामूल्य)",
    fullNameLabel: "आपले पूर्ण नाव",
    fullNamePlaceholder: "उदा. रमेश शंकर पाटील",
    emailLabel: "ईमेल पत्ता",
    emailPlaceholder: "नाव@example.com",
    phoneLabel: "मोबाईल क्रमांक",
    phonePlaceholder: "उदा. ९८२२००११२२",
    cityLabel: "जिल्हा / शहर",
    cityPlaceholder: "उदा. कोल्हापूर, पुणे, मुंबई...",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "किमान ६ अक्षरे",
    loginBtn: "नागरिक कक्षात प्रवेश करा →",
    registerBtn: "विनामूल्य खाते तयार करा ✨",
    hotlineTitle: "तातडीची मदत व आपत्कालीन हेल्पलाईन (२४x७):",
  },
  hi: {
    portalBadge: "नागरिक एवं उपभोक्ता विधिक सहायता पोर्टल",
    mainHeading: "नागरिक व उपभोक्ता पोर्टल",
    subHeading: "उपभोक्ता शिकायत (ग्राहक मंच), पुलिस एफआईआर, साइबर फ्रॉड व निशुल्क कानूनी सलाह",
    tabLogin: "नागरिक लॉगिन",
    tabRegister: "नया पंजीकरण (निशुल्क)",
    fullNameLabel: "पूरा नाम",
    fullNamePlaceholder: "उदा. रमेश शर्मा",
    emailLabel: "ईमेल पता",
    emailPlaceholder: "name@example.com",
    phoneLabel: "मोबाइल नंबर",
    phonePlaceholder: "उदा. ९८२२००११२२",
    cityLabel: "जिला / शहर",
    cityPlaceholder: "उदा. लखनऊ, इंदौर, पटना...",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "न्यूनतम ६ अक्षर",
    loginBtn: "नागरिक पोर्टल में प्रवेश करें →",
    registerBtn: "निःशुल्क खाता बनाएं ✨",
    hotlineTitle: "आपातकालीन सहायता हेल्पलाइन (२४x७):",
  },
  en: {
    portalBadge: "Citizen & Consumer Grievance Portal",
    mainHeading: "Citizen & Consumer Portal",
    subHeading: "Consumer disputes (Consumer Forum), police complaints, cyber fraud recovery & legal drafting",
    tabLogin: "Citizen Login",
    tabRegister: "Free Sign Up",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "e.g. Ramesh Patil",
    emailLabel: "Email Address",
    emailPlaceholder: "name@example.com",
    phoneLabel: "Mobile Number",
    phonePlaceholder: "e.g. 9822001122",
    cityLabel: "District / City",
    cityPlaceholder: "e.g. Kolhapur, Pune, Mumbai...",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimum 6 characters",
    loginBtn: "Sign in to Citizen Portal →",
    registerBtn: "Create Free Citizen Account ✨",
    hotlineTitle: "24x7 Emergency Helplines:",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const citizenLogin = useAuthStore((s) => s.citizenLogin);
  const citizenRegister = useAuthStore((s) => s.citizenRegister);

  // ── Portal Switcher: Advocate vs Citizen & Consumer ────────────────────────
  const [portalType, setPortalType] = useState<PortalType>("advocate");
  const [citizenLang, setCitizenLang] = useState<CitizenLang>("mr");
  const [citizenMode, setCitizenMode] = useState<"login" | "register">("login");

  // Read URL query param ?portal=citizen safely
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("portal");
      if (p === "citizen" || p === "consumer") {
        setPortalType("citizen");
      }
    }
  }, []);

  // ── Advocate Login State ───────────────────────────────────────────────────
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

  // ── Citizen Form State ─────────────────────────────────────────────────────
  const [citizenEmail, setCitizenEmail] = useState("");
  const [citizenPassword, setCitizenPassword] = useState("");
  const [citizenFullName, setCitizenFullName] = useState("");
  const [citizenPhone, setCitizenPhone] = useState("");
  const [citizenCity, setCitizenCity] = useState("");
  const [citizenShowPass, setCitizenShowPass] = useState(false);

  // Advocate Password form
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Countdown timer for Advocate OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (authMode === "otp" && otpStep === "code" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [authMode, otpStep, timer]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  // 1. Advocate Password Login
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      const token = localStorage.getItem("access_token");
      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === "citizen") {
        toast.success("Welcome to Citizen & Consumer Portal!");
        window.location.href = "/citizen-portal";
      } else {
        toast.success("Welcome back to Advocate ERP!");
        window.location.href = "/dashboard";
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // 2. Advocate OTP Initiate
  const onSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail || !otpEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login-otp-initiate", { email: otpEmail.trim().toLowerCase() });
      setOtpStep("code");
      setTimer(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      setAttemptsRemaining(3);
      toast.success(res.data.message || `Login code dispatched to ${otpEmail}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 3. Advocate OTP Verify
  const onVerifyLoginOtp = async () => {
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      toast.error("Please enter all 6 digits of your login code");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/login-otp-verify", {
        email: otpEmail.trim().toLowerCase(),
        otp: fullOtp,
      });

      if (res.data && res.data.access_token) {
        localStorage.setItem("access_token", res.data.access_token);
        localStorage.setItem("refresh_token", res.data.refresh_token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        document.cookie = `access_token=${res.data.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        toast.success("Login verified successfully!");
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      if (msg.includes("remaining")) {
        setAttemptsRemaining((prev) => (prev ? prev - 1 : 2));
      } else if (msg.includes("invalidated") || msg.includes("expired")) {
        setAttemptsRemaining(0);
      }
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted) {
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

  // ── Citizen Login Handler ──────────────────────────────────────────────────
  const handleCitizenLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenEmail || !citizenPassword) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      await citizenLogin(citizenEmail, citizenPassword);
      toast.success(
        citizenLang === "mr"
          ? "नागरिक व ग्राहक कक्षात आपले स्वागत आहे!"
          : citizenLang === "hi"
          ? "नागरिक व उपभोक्ता पोर्टल में आपका स्वागत है!"
          : "Welcome to Citizen & Consumer Portal!"
      );
      window.location.href = "/citizen-portal";
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Citizen Register Handler ───────────────────────────────────────────────
  const handleCitizenRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citizenFullName || !citizenEmail || !citizenPassword) {
      toast.error("Please fill in required fields (Name, Email, Password)");
      return;
    }
    if (citizenPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await citizenRegister({
        full_name: citizenFullName,
        email: citizenEmail,
        password: citizenPassword,
        phone: citizenPhone || undefined,
        city_or_district: citizenCity || undefined,
        preferred_language: citizenLang,
      });
      toast.success(
        citizenLang === "mr"
          ? "नोंदणी यशस्वी! नागरिक कक्षात आपले स्वागत आहे."
          : citizenLang === "hi"
          ? "पंजीकरण सफल! नागरिक पोर्टल में आपका स्वागत है."
          : "Registration successful! Welcome to Citizen Portal."
      );
      window.location.href = "/citizen-portal";
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Features by active portal
  const advocateFeatures = [
    { icon: Brain, text: "Smart Legal Drafting", desc: "Generate bail applications, writs, notices in seconds" },
    { icon: Gavel, text: "Smart Case Management", desc: "Track every case stage with real-time cause list updates" },
    { icon: FileText, text: "Document Intelligence", desc: "OCR, search, and analyze any court record or petition" },
    { icon: ShieldCheck, text: "Secure & Private", desc: "Bank-grade encryption for all advocate client files" },
  ];

  const citizenFeatures = [
    { icon: ShoppingBag, text: "ग्राहक मंच संरक्षण (Consumer Protection)", desc: "त्रुटीयुक्त वस्तू, सेवा फसवणूक, बिल्डर व इन्शुरन्स तक्रार अर्ज" },
    { icon: Scale, text: "पोलीस व एफआयआर (BNSS 2023)", desc: "नवीन कायद्यानुसार अचूक कलमे, पोलीस स्टेशन तक्रार व पाठपुरावा" },
    { icon: ShieldCheck, text: "सायबर गुन्हे व बँक फ्रॉड (1930)", desc: "युपीआय, ऑनलाइन आर्थिक फसवणूक तातडीची मदत व अर्ज" },
    { icon: FileText, text: "A4 कोर्ट व कार्यालय-तयार मसुदा", desc: "मराठी, हिंदी व इंग्रजीत थेट प्रिंट करा अथवा पीडीएफ जतन करा" },
  ];

  const currentFeatures = portalType === "advocate" ? advocateFeatures : citizenFeatures;
  const cText = CITIZEN_TEXT[citizenLang];

  return (
    <div className="min-h-screen flex">
      {/* ── Left Branding Panel (Dynamically adapts to selected portal) ── */}
      <div className="hidden lg:flex flex-1 bg-sidebar flex-col justify-between p-10 lg:p-14 xl:p-18 2xl:p-24 text-white relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-mint/10 blur-[100px]" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-mint/15 border border-mint/25 flex items-center justify-center shadow-lg shadow-mint/10">
            <Scale className="w-6 h-6 lg:w-7 lg:h-7 text-mint" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl lg:text-2xl tracking-tight leading-none">Fastcase</h1>
            <span className="text-[11px] lg:text-xs text-mint uppercase tracking-widest font-bold">
              {portalType === "advocate" ? "Advocate ERP Platform" : "Citizen & Consumer Portal"}
            </span>
          </div>
        </div>

        <div className="max-w-xl xl:max-w-2xl relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-mint mb-5">
            {portalType === "advocate" ? (
              <>
                <Scale className="w-3.5 h-3.5" /> ॲडव्होकेट विधी प्रॅक्टिस कक्ष (Advocate OS)
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" /> नागरिक व ग्राहक तक्रार निवारण कक्ष (Consumer Portal)
              </>
            )}
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-[50px] font-extrabold tracking-tight mb-5 lg:mb-6 leading-[1.18]">
            {portalType === "advocate" ? (
              <>
                India's Complete Legal<br />Operating System
              </>
            ) : (
              <>
                One-Click Citizen &<br />Consumer Legal Help
              </>
            )}
          </h2>

          <p className="text-white/80 text-base lg:text-lg xl:text-xl leading-relaxed font-normal max-w-xl">
            {portalType === "advocate"
              ? "Manage cases, draft court petitions, track hearings, and run your advocate practice — all in one platform."
              : "सामान्य नागरिकांसाठी मोफत कायदेशीर मार्गदर्शन, ग्राहक मंच तक्रारी, पोलीस अर्ज व थेट A4 प्रिंट मसुदा जनरेटर."}
          </p>
        </div>

        <div className="space-y-4 lg:space-y-5 xl:space-y-6 relative z-10">
          {currentFeatures.map((f, i) => (
            <div key={i} className="flex items-center gap-4.5">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-sm">
                <f.icon className="w-5 h-5 text-mint" />
              </div>
              <div>
                <h4 className="text-sm lg:text-base font-semibold text-white tracking-tight">{f.text}</h4>
                <p className="text-xs lg:text-sm text-white/60 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Form Panel (Dual Portal Experience) ── */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F8F6] px-5 sm:px-10 lg:px-12 xl:px-16 2xl:px-20 py-8 lg:py-12">
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
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Legal & Citizen Portal</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/80 p-6 sm:p-9 lg:p-11 xl:p-12">
            
            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* 1. DUAL PORTAL SWITCHER: ADVOCATE vs CITIZEN/CONSUMER          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <div className="mb-6 p-1.5 bg-gray-100/90 rounded-2xl border border-gray-200/80 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setPortalType("advocate")}
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  portalType === "advocate"
                    ? "bg-white text-sidebar shadow-md border border-gray-100"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Scale className={`w-4 h-4 shrink-0 ${portalType === "advocate" ? "text-sidebar" : "text-gray-400"}`} />
                <div className="text-left leading-tight">
                  <span className="block font-extrabold">Advocate Portal</span>
                  <span className="text-[10px] font-normal text-gray-500 hidden sm:block">वकील / लॉ प्रॅक्टिस</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPortalType("citizen")}
                className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  portalType === "citizen"
                    ? "bg-emerald-800 text-white shadow-md shadow-emerald-900/20"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <ShieldCheck className={`w-4 h-4 shrink-0 ${portalType === "citizen" ? "text-emerald-300" : "text-gray-400"}`} />
                <div className="text-left leading-tight">
                  <span className="block font-extrabold">Citizen & Consumer</span>
                  <span className={`text-[10px] font-normal hidden sm:block ${portalType === "citizen" ? "text-emerald-200" : "text-gray-500"}`}>
                    नागरिक व ग्राहक कक्ष
                  </span>
                </div>
              </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VIEW A: ADVOCATE PORTAL LOGIN                                   */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {portalType === "advocate" && (
              <div>
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2">
                    <Scale className="w-3.5 h-3.5" /> For Advocates, Firms & Chambers
                  </div>
                  <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">Advocate Sign In</h2>
                  <p className="text-sm text-gray-500 mt-1">Sign in to your Fastcase Legal ERP practice</p>
                </div>

                {/* Auth Mode Toggle: Password vs OTP */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                  <button
                    type="button"
                    onClick={() => setAuthMode("password")}
                    className={`flex-1 py-2 text-xs lg:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === "password" ? "bg-white text-sidebar shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("otp");
                      setOtpStep("email");
                    }}
                    className={`flex-1 py-2 text-xs lg:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      authMode === "otp" ? "bg-white text-sidebar shadow-sm" : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" /> Sign in with OTP
                  </button>
                </div>

                {/* Advocate Password Form */}
                {authMode === "password" && (
                  <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="advocate@lawfirm.in"
                        autoComplete="email"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all
                          placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                          ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                      />
                      {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-semibold text-gray-700">Password</label>
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
                          {...register("password")}
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all pr-12
                            placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                            ${errors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass(!showPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-sidebar py-3.5 text-sm font-bold text-white transition-all
                        hover:bg-sidebar-dark active:scale-[0.99] shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? "Signing in..." : "Sign In to Advocate Practice"}
                    </button>
                  </form>
                )}

                {/* Advocate OTP Form */}
                {authMode === "otp" && (
                  <div>
                    {otpStep === "email" ? (
                      <form onSubmit={onSendLoginOtp} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registered Email</label>
                          <input
                            type="email"
                            required
                            value={otpEmail}
                            onChange={(e) => setOtpEmail(e.target.value)}
                            placeholder="advocate@lawfirm.in"
                            className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">
                            Dispatches a 6-digit verification code valid for 60 seconds.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={loading || !otpEmail}
                          className="w-full rounded-xl bg-sidebar py-3 text-sm font-semibold text-white transition-all hover:bg-sidebar-dark shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          {loading ? "Sending Code..." : "Send Login Code"} <ArrowRight className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-5">
                        <div className="text-center">
                          <p className="text-xs text-gray-600">
                            Enter 6-digit code sent to <strong className="text-gray-900">{otpEmail}</strong>
                          </p>
                          <div className="flex items-center justify-center gap-3 mt-1.5">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              timer > 15 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                            }`}>
                              <Clock className="w-3 h-3" /> {formatTimer(timer)}
                            </span>
                            {attemptsRemaining !== null && (
                              <span className="text-[11px] text-gray-500 font-medium">
                                {attemptsRemaining} attempt(s) left
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-center gap-2">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => { otpInputRefs.current[idx] = el; }}
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={digit}
                              onChange={(e) => handleOtpChange(idx, e.target.value)}
                              onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                              className="w-10 h-12 text-center text-lg font-mono font-bold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-sidebar focus:ring-2 focus:ring-sidebar/20 outline-none"
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={onVerifyLoginOtp}
                          disabled={loading || otpDigits.join("").length < 6}
                          className="w-full rounded-xl bg-sidebar py-3 text-sm font-bold text-white hover:bg-sidebar-dark transition-all shadow-md disabled:opacity-60 cursor-pointer"
                        >
                          {loading ? "Verifying..." : "Verify & Sign In"}
                        </button>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStep("email");
                              setOtpDigits(["", "", "", "", "", ""]);
                            }}
                            className="hover:underline"
                          >
                            Change Email
                          </button>
                          <button
                            type="button"
                            onClick={onSendLoginOtp}
                            disabled={!canResend || loading}
                            className={`font-bold ${canResend ? "text-sidebar hover:underline" : "text-gray-400 cursor-not-allowed"}`}
                          >
                            Resend Code
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
                  Are you an advocate without an account?{" "}
                  <button
                    type="button"
                    onClick={() => router.push("/register")}
                    className="font-bold text-sidebar hover:underline"
                  >
                    Register Practice
                  </button>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* VIEW B: CITIZEN & CONSUMER PORTAL LOGIN / REGISTRATION         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {portalType === "citizen" && (
              <div>
                {/* Language Switcher */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-emerald-700" /> भाषा / Language:
                  </span>
                  <div className="flex items-center gap-1 bg-emerald-50/80 p-0.5 rounded-lg border border-emerald-200/60">
                    {(["mr", "hi", "en"] as CitizenLang[]).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setCitizenLang(lang)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          citizenLang === lang
                            ? "bg-emerald-800 text-white shadow-sm"
                            : "text-emerald-900 hover:bg-emerald-100/60"
                        }`}
                      >
                        {lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heading */}
                <div className="mb-5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100/70 text-emerald-900 text-[11px] font-bold mb-1.5">
                    <ShoppingBag className="w-3 h-3 text-emerald-700" /> {cText.portalBadge}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                    {cText.mainHeading}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {cText.subHeading}
                  </p>
                </div>

                {/* Sub-tabs: Login vs Register */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-5">
                  <button
                    type="button"
                    onClick={() => setCitizenMode("login")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      citizenMode === "login"
                        ? "bg-white text-emerald-950 shadow-sm border border-gray-100"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> {cText.tabLogin}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCitizenMode("register")}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      citizenMode === "register"
                        ? "bg-white text-emerald-950 shadow-sm border border-gray-100"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> {cText.tabRegister}
                  </button>
                </div>

                {/* Sub-view: Citizen Login */}
                {citizenMode === "login" ? (
                  <form onSubmit={handleCitizenLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{cText.emailLabel}</label>
                      <input
                        type="email"
                        required
                        value={citizenEmail}
                        onChange={(e) => setCitizenEmail(e.target.value)}
                        placeholder={cText.emailPlaceholder}
                        className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-700"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{cText.passwordLabel}</label>
                      <div className="relative">
                        <input
                          type={citizenShowPass ? "text" : "password"}
                          required
                          value={citizenPassword}
                          onChange={(e) => setCitizenPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-700 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setCitizenShowPass(!citizenShowPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {citizenShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-sm font-bold text-white transition-all shadow-md shadow-emerald-900/20 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? "प्रवेश करत आहे..." : cText.loginBtn}
                    </button>
                  </form>
                ) : (
                  /* Sub-view: Citizen Registration */
                  <form onSubmit={handleCitizenRegister} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">{cText.fullNameLabel} *</label>
                      <input
                        type="text"
                        required
                        value={citizenFullName}
                        onChange={(e) => setCitizenFullName(e.target.value)}
                        placeholder={cText.fullNamePlaceholder}
                        className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{cText.emailLabel} *</label>
                        <input
                          type="email"
                          required
                          value={citizenEmail}
                          onChange={(e) => setCitizenEmail(e.target.value)}
                          placeholder={cText.emailPlaceholder}
                          className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{cText.phoneLabel}</label>
                        <input
                          type="tel"
                          value={citizenPhone}
                          onChange={(e) => setCitizenPhone(e.target.value)}
                          placeholder={cText.phonePlaceholder}
                          className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{cText.cityLabel}</label>
                        <input
                          type="text"
                          value={citizenCity}
                          onChange={(e) => setCitizenCity(e.target.value)}
                          placeholder={cText.cityPlaceholder}
                          className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-700"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">{cText.passwordLabel} *</label>
                        <div className="relative">
                          <input
                            type={citizenShowPass ? "text" : "password"}
                            required
                            value={citizenPassword}
                            onChange={(e) => setCitizenPassword(e.target.value)}
                            placeholder={cText.passwordPlaceholder}
                            className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-700 pr-9"
                          />
                          <button
                            type="button"
                            onClick={() => setCitizenShowPass(!citizenShowPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {citizenShowPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-900 hover:to-teal-900 py-3 text-sm font-bold text-white transition-all shadow-md shadow-emerald-900/20 disabled:opacity-60 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {loading ? "नोंदणी होत आहे..." : cText.registerBtn}
                    </button>
                  </form>
                )}

                {/* 24x7 Emergency Hotlines */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="text-[11px] font-bold text-gray-600 mb-2 flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-red-600" /> {cText.hotlineTitle}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <a
                      href="tel:1930"
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition text-[11px] font-bold text-red-700"
                    >
                      📞 1930 <span className="block text-[9px] font-normal text-red-600">सायबर फ्रॉड</span>
                    </a>
                    <a
                      href="tel:112"
                      className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition text-[11px] font-bold text-blue-700"
                    >
                      🚨 112 <span className="block text-[9px] font-normal text-blue-600">पोलीस मदत</span>
                    </a>
                    <a
                      href="tel:1091"
                      className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 transition text-[11px] font-bold text-purple-700"
                    >
                      👩 1091 <span className="block text-[9px] font-normal text-purple-600">महिला मदत</span>
                    </a>
                  </div>
                </div>

                {/* Direct link to standalone citizen page */}
                <div className="mt-4 text-center">
                  <Link
                    href="/citizen-login"
                    className="text-xs text-emerald-800 hover:underline font-semibold"
                  >
                    मोठ्या स्क्रीनवर नागरिक कक्ष उघडा (Open Standalone Citizen Page) →
                  </Link>
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
              For security reasons, password resets must be initiated by your system administrator. Please contact your organization administrator or email <strong className="text-gray-900">support@fastcase.in</strong> to reset your credentials.
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
