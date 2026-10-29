"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Scale, ShieldCheck, FileText, Brain, Gavel } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      // Sync token to cookie for SSR middleware (reads from localStorage set by authStore.login)
      const token = localStorage.getItem("access_token");
      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      toast.success("Welcome back!");
      window.location.href = "/dashboard";
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, text: "Smart Legal Drafting", desc: "Generate bail applications, writs, notices in seconds" },
    { icon: Gavel, text: "Smart Case Management", desc: "Track every case stage with real-time updates" },
    { icon: FileText, text: "Document Intelligence", desc: "OCR, search, and analyze any legal document" },
    { icon: ShieldCheck, text: "Secure & Private", desc: "Bank-grade encryption for all client data" }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 bg-sidebar flex-col justify-between p-10 lg:p-14 xl:p-18 2xl:p-24 text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-mint/10 blur-[100px]" />
        
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-mint/15 border border-mint/25 flex items-center justify-center shadow-lg shadow-mint/10">
            <Scale className="w-6 h-6 lg:w-7 lg:h-7 text-mint" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl lg:text-2xl tracking-tight leading-none">Fastcase</h1>
            <span className="text-[11px] lg:text-xs text-mint uppercase tracking-widest font-bold">Legal Platform</span>
          </div>
        </div>

        <div className="max-w-xl xl:max-w-2xl relative z-10 my-auto py-8">
          <h2 className="text-3xl lg:text-4xl xl:text-5xl 2xl:text-[52px] font-extrabold tracking-tight mb-5 lg:mb-6 leading-[1.18]">
            India's Complete Legal<br />Operating System
          </h2>
          <p className="text-white/80 text-base lg:text-lg xl:text-xl leading-relaxed font-normal max-w-xl">
            Manage cases, draft documents, track hearings, and run your practice — all in one platform.
          </p>
        </div>

        <div className="space-y-4 lg:space-y-5 xl:space-y-6 relative z-10">
          {features.map((f, i) => (
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

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F8F6] px-6 sm:px-10 lg:px-12 xl:px-16 2xl:px-20 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md lg:max-w-lg xl:max-w-[500px] 2xl:max-w-[540px]"
        >
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sidebar flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-mint" />
            </div>
            <span className="text-sidebar font-extrabold text-2xl tracking-tight">Fastcase</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/80 p-8 sm:p-10 lg:p-12 xl:p-14">
            <div className="mb-8 lg:mb-10">
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
              <p className="text-sm lg:text-base text-gray-500 mt-2">Sign in to your Fastcase account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 lg:space-y-6">
              <div>
                <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="advocate@lawfirm.in"
                  autoComplete="email"
                  className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all
                    placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                    ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                />
                {errors.email && <p className="text-xs lg:text-sm text-red-500 mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs lg:text-sm font-semibold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs lg:text-sm font-semibold text-sidebar hover:text-sidebar-dark transition-colors"
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
                    className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all pr-12
                      placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                      ${errors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs lg:text-sm text-red-500 mt-1.5">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sidebar py-3.5 lg:py-4 text-sm lg:text-base font-semibold text-white transition-all
                  hover:bg-sidebar-dark active:scale-[0.99] shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-8 text-center text-sm lg:text-base text-gray-500">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="font-semibold text-sidebar hover:text-sidebar-dark transition-colors"
              >
                Create one
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
              className="w-full rounded-xl bg-sidebar py-2.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
