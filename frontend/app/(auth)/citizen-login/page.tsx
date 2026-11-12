"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Scale,
  FileText,
  PhoneCall,
  CheckCircle2,
  Lock,
  Mail,
  User,
  MapPin,
  Eye,
  EyeOff,
  ArrowRight,
  Globe,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

type Lang = "mr" | "hi" | "en";

const STRINGS: Record<Lang, Record<string, string>> = {
  mr: {
    portalBadge: "नागरिक विधी सहाय्य व तक्रार निवारण कक्ष",
    mainHeading: "नागरिक पोर्टल",
    subHeading: "सामान्य नागरिकांसाठी मोफत कायदेशीर मार्गदर्शन, तक्रार अर्ज जनरेटर व शासकीय हेल्पलाईन",
    tabLogin: "नागरिक लॉगिन",
    tabRegister: "नवीन नागरिक नोंदणी (विनामूल्य)",
    fullNameLabel: "आपले पूर्ण नाव",
    fullNamePlaceholder: "उदा. रमेश शंकर पाटील",
    emailLabel: "ईमेल पत्ता",
    emailPlaceholder: "नाव@example.com",
    phoneLabel: "मोबाईल क्रमांक",
    phonePlaceholder: "उदा. ९८२२००११२२",
    cityLabel: "जिल्हा / तालुका / शहर",
    cityPlaceholder: "उदा. कोल्हापूर, पुणे, मुंबई...",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "किमान ६ अक्षरे",
    loginBtn: "नागरिक कक्षात प्रवेश करा →",
    registerBtn: "विनामूल्य खाते तयार करा ✨",
    advocateLink: "तुम्ही वकील अथवा विधी फर्म आहात का? ॲडव्होकेट ईआरपी लॉगिन येथे करा",
    alreadyHaveAccount: "आधीच खाते आहे? लॉगिन करा",
    needAccount: "नवीन नागरिक आहात? येथे मोफत नोंदणी करा",
    emergencyTitle: "तातडीची मदत व आपत्कालीन हेल्पलाईन (२४x७):",
    benefit1: "पोलीस एफआयआर, सायबर फ्रॉड, ग्राहक तक्रार व कौटुंबिक वाद अर्ज एका क्लिकवर",
    benefit2: "नवीन कायदे (BNSS 2023, BNS 2023) नुसार अधिकृत कायदेशीर कलमे व नमुना अर्ज",
    benefit3: "तयार झालेला अर्ज A4 आकारात थेट प्रिंट करा अथवा पीडीएफ जतन करा",
    benefit4: "जतन केलेले अर्ज कधीही पुन्हा पहा व अपडेट करा",
  },
  hi: {
    portalBadge: "नागरिक विधिक सहायता एवं शिकायत निवारण पोर्टल",
    mainHeading: "नागरिक पोर्टल",
    subHeading: "आम नागरिकों के लिए निशुल्क कानूनी सलाह, शिकायत आवेदन जनरेटर व सरकारी हेल्पलाइन",
    tabLogin: "नागरिक लॉगिन",
    tabRegister: "नया नागरिक पंजीकरण (निशुल्क)",
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
    advocateLink: "क्या आप अधिवक्ता अथवा लॉ फर्म हैं? एडवोकेट ईआरपी लॉगिन यहां करें",
    alreadyHaveAccount: "पहले से खाता है? लॉगिन करें",
    needAccount: "नए नागरिक हैं? यहां निशुल्क पंजीकरण करें",
    emergencyTitle: "आपातकालीन सहायता हेल्पलाइन (२४x७):",
    benefit1: "पुलिस एफआईआर, साइबर फ्रॉड, उपभोक्ता एवं श्रम विवाद आवेदन एक क्लिक में",
    benefit2: "नवीनतम कानून (BNSS 2023, BNS 2023) अनुसार कानूनी धाराएं व प्रारूप",
    benefit3: "तैयार आवेदन A4 आकार में सीधे प्रिंट करें अथवा पीडीएफ सेव करें",
    benefit4: "सुरक्षित किए गए आवेदन भविष्य में कभी भी देखें व प्रिंट करें",
  },
  en: {
    portalBadge: "One-Click Citizen Legal Help & Grievance Portal",
    mainHeading: "Citizen Portal",
    subHeading: "Free statutory guidance, court/department-ready complaint applications, and official government helplines",
    tabLogin: "Citizen Login",
    tabRegister: "Free Citizen Sign Up",
    fullNameLabel: "Full Name",
    fullNamePlaceholder: "e.g. Ramesh Patil",
    emailLabel: "Email Address",
    emailPlaceholder: "name@example.com",
    phoneLabel: "Mobile Number",
    phonePlaceholder: "e.g. 9822001122",
    cityLabel: "District / City",
    cityPlaceholder: "e.g. Kolhapur, Pune, Mumbai...",
    passwordLabel: "Password",
    passwordPlaceholder: "At least 6 characters",
    loginBtn: "Enter Citizen Portal →",
    registerBtn: "Create Free Citizen Account ✨",
    advocateLink: "Are you an Advocate or Law Firm? Advocate ERP Login Here",
    alreadyHaveAccount: "Already registered? Login here",
    needAccount: "New user? Create a free citizen account",
    emergencyTitle: "24x7 Emergency Helplines:",
    benefit1: "Police FIR, Cyber Fraud, Consumer Disputes & Labour Claims in 1 click",
    benefit2: "Anchored to BNSS 2023, BNS 2023, and official Indian statutory enactments",
    benefit3: "Instant court & department-ready A4 print output without legal fees",
    benefit4: "Save applications permanently to your account for future reference",
  },
};

export default function CitizenLoginPage() {
  const router = useRouter();
  const { citizenLogin, citizenRegister } = useAuthStore();
  const [lang, setLang] = useState<Lang>("mr");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const t = STRINGS[lang];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const user = await citizenLogin(email, password);
      toast.success(`Welcome ${user.full_name || "Citizen"}!`);
      router.push("/citizen-portal");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const user = await citizenRegister({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim() || undefined,
        city_or_district: city.trim() || undefined,
        preferred_language: lang,
      });
      toast.success(`Account created successfully! Welcome ${user.full_name}.`);
      router.push("/citizen-portal");
    } catch (err: any) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A261D] via-[#0D3B2E] to-slate-950 flex flex-col justify-between text-white relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Bar ── */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-emerald-800/40 backdrop-blur-md relative z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Scale className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight">FastCase</h1>
            <p className="text-[10px] text-emerald-300 font-semibold uppercase tracking-wider">
              {t.portalBadge}
            </p>
          </div>
        </Link>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-700/50 p-1 rounded-xl">
          <Globe className="w-3.5 h-3.5 text-emerald-400 ml-1.5" />
          {(["mr", "hi", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition",
                lang === l
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-emerald-200 hover:text-white"
              )}
            >
              {l === "mr" ? "मराठी" : l === "hi" ? "हिंदी" : "EN"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Citizen Legal Features & Helplines */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>सामान्य नागरिकांसाठी विनामूल्य विधी सहाय्य</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                {t.mainHeading}
              </h2>
              <p className="text-sm md:text-base text-emerald-100/80 leading-relaxed">
                {t.subHeading}
              </p>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 pt-2">
              {[t.benefit1, t.benefit2, t.benefit3, t.benefit4].map((b, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/5 border border-emerald-500/10 p-3 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-100/90 leading-relaxed">{b}</p>
                </div>
              ))}
            </div>

            {/* Emergency Hotline Bar */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                <span>{t.emergencyTitle}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-red-950/60 p-2 rounded-xl border border-red-500/20">
                  <span className="block text-gray-400 text-[10px]">पोलीस (FIR)</span>
                  <strong className="text-white text-sm">112 / 100</strong>
                </div>
                <div className="bg-red-950/60 p-2 rounded-xl border border-red-500/20">
                  <span className="block text-gray-400 text-[10px]">महिला हेल्पलाईन</span>
                  <strong className="text-white text-sm">1091 / 181</strong>
                </div>
                <div className="bg-red-950/60 p-2 rounded-xl border border-red-500/20">
                  <span className="block text-gray-400 text-[10px]">सायबर फ्रॉड</span>
                  <strong className="text-white text-sm">1930</strong>
                </div>
                <div className="bg-red-950/60 p-2 rounded-xl border border-red-500/20">
                  <span className="block text-gray-400 text-[10px]">मोफत विधी सेवा</span>
                  <strong className="text-white text-sm">15100</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Citizen Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-white text-gray-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-emerald-100">
              {/* Tab Selector */}
              <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl transition text-center",
                    mode === "login"
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {t.tabLogin}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl transition text-center",
                    mode === "register"
                      ? "bg-emerald-800 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {t.tabRegister}
                </button>
              </div>

              {/* ── Form: Login Mode ── */}
              {mode === "login" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.emailLabel}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t.emailPlaceholder}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.passwordLabel}
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t.loginBtn
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-xs font-semibold text-emerald-800 hover:underline"
                    >
                      {t.needAccount}
                    </button>
                  </div>
                </form>
              ) : (
                /* ── Form: Register Mode ── */
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.fullNameLabel} *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.fullNamePlaceholder}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t.emailLabel} *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.emailPlaceholder}
                          className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {t.phoneLabel}
                      </label>
                      <div className="relative">
                        <PhoneCall className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t.phonePlaceholder}
                          className="w-full pl-9 pr-3 py-2.5 text-xs border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.cityLabel}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder={t.cityPlaceholder}
                        className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.passwordLabel} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      t.registerBtn
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-xs font-semibold text-emerald-800 hover:underline"
                    >
                      {t.alreadyHaveAccount}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Switch to Advocate ERP Login Link ── */}
              <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                <Link
                  href="/login"
                  className="text-xs font-bold text-gray-500 hover:text-emerald-800 transition flex items-center justify-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{t.advocateLink}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="px-6 py-4 border-t border-emerald-800/40 text-center text-xs text-emerald-300/70 relative z-10">
        FastCase Legal Platform &bull; One-Click Citizen Legal Help & Grievance Portal &bull; Free Statutory Assistance
      </footer>
    </div>
  );
}

