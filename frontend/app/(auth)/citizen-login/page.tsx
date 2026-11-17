"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";
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

  // Mode: "login" vs "register"
  const [view, setView] = useState<"login" | "register">("login");
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

            {/* ── VIEW 1: SIGN IN ── */}
            {view === "login" && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
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
                  className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-xs sm:text-sm font-black text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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

                {/* Switch to Registration */}
                <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
                  नवीन नागरिक आहात?{" "}
                  <button
                    type="button"
                    onClick={() => setView("register")}
                    className="font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    नवीन नोंदणी करा (Create Citizen Account)
                  </button>
                </div>
              </form>
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
                  className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 py-3 text-xs sm:text-sm font-black text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
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

                {/* Switch to Sign In */}
                <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
                  आधीच खाते आहे?{" "}
                  <button
                    type="button"
                    onClick={() => setView("login")}
                    className="font-bold text-emerald-800 hover:underline cursor-pointer"
                  >
                    लॉगिन करा (Sign In)
                  </button>
                </div>
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
              पासवर्ड रीसेट करण्यासाठी कृपया आपल्या नोंदणीकृत ईमेल पत्त्यावरून <strong>support@fastcase.in</strong> शी संपर्क साधा किंवा आपल्या ॲडमिनिस्ट्रेटरला विनंती करा.
            </p>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 transition cursor-pointer"
            >
              बंद करा (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
