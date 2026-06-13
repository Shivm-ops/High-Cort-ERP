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
      router.push("/");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #013B36 0%, #014D46 50%, #0B3D2E 100%)" }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6EE7B7 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-[-60px] w-72 h-72 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #72D6C9 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-mint/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-mint" />
            </div>
            <div>
              <div className="text-white font-bold text-xl">Fastcase</div>
              <div className="text-white/40 text-xs uppercase tracking-widest">Legal Platform</div>
            </div>
          </div>
          <h1 className="text-white text-3xl font-bold leading-tight mb-4">
            India's Complete Legal<br />Operating System
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Manage cases, draft documents, track hearings, and run your practice — all in one platform.
          </p>
        </div>
        <div className="relative z-10 space-y-4">
          {[
            { icon: Brain, label: "Smart Legal Drafting", desc: "Generate bail applications, writs, notices in seconds" },
            { icon: Gavel, label: "Smart Case Management", desc: "Track every case stage with real-time updates" },
            { icon: FileText, label: "Document Intelligence", desc: "OCR, search, and analyze any legal document" },
            { icon: ShieldCheck, label: "Secure & Private", desc: "Bank-grade encryption for all client data" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-mint" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">{label}</div>
                <div className="text-white/50 text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F8F6] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-sidebar flex items-center justify-center">
              <Scale className="w-4 h-4 text-mint" />
            </div>
            <span className="text-sidebar font-bold text-lg">Fastcase</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-1">Sign in to your Fastcase account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="advocate@lawfirm.in"
                  autoComplete="email"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors
                    placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                    ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors pr-11
                      placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                      ${errors.password ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-sidebar py-3 text-sm font-semibold text-white transition-all
                  hover:bg-sidebar-dark active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
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
    </div>
  );
}
