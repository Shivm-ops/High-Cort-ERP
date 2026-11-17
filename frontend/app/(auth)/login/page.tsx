"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Scale,
  Brain,
  Gavel,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function AdvocateLoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  // Advocate Login State
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Advocate Password form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Advocate Password Submit
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back to Fastcase Practice!");
      router.push("/dashboard");
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
    <div className="flex min-h-screen bg-[#07242B] font-sans antialiased">
      {/* ── Left Branding Panel: Exclusively Advocate ERP ── */}
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
              Advocate ERP Platform
            </span>
          </div>
        </div>

        {/* Headline */}
        <div className="max-w-xl xl:max-w-2xl relative z-10 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-mint mb-5">
            <Scale className="w-3.5 h-3.5" /> ॲडव्होकेट विधी प्रॅक्टिस कक्ष (Advocate OS)
          </div>

          <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-[50px] font-extrabold tracking-tight mb-5 lg:mb-6 leading-[1.18]">
            India's Complete Legal<br />Operating System
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

      {/* ── Right Form Panel: Pure Advocate Login ── */}
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
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Advocate ERP Platform</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/80 p-6 sm:p-9 lg:p-11 xl:p-12">
            
            {/* Back to Main Website */}
            <div className="mb-5">
              <a
                href="https://fastcase.in"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-sidebar transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to fastcase.in</span>
              </a>
            </div>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-1">Sign in to your Fastcase practice</p>
            </div>

            {/* Advocate Password Form */}
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
                    className="text-xs font-semibold text-sidebar hover:underline cursor-pointer"
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
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all
                      placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint pr-10
                      ${errors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
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

            {/* Advocate Practice Registration Link */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="font-bold text-sidebar hover:underline cursor-pointer"
              >
                Register Practice
              </button>
            </div>

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
