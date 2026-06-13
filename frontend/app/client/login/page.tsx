"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Scale, ShieldCheck, FileText, Gavel, Users } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export default function ClientLoginPage() {
  const router = useRouter();
  const clientLogin = useAuthStore((s) => s.clientLogin);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await clientLogin(data.email, data.password);
      const token = localStorage.getItem("access_token");
      if (token) {
        document.cookie = `access_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
      toast.success("Welcome to your Client Portal!");
      router.push("/client/dashboard");
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8F6]">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1A365D 0%, #2A4365 50%, #2C5282 100%)" }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #90CDF4 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-[-60px] w-72 h-72 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #63B3ED 0%, transparent 70%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-blue-100/20 flex items-center justify-center">
              <Scale className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="text-white font-bold text-xl">Fastcase</div>
              <div className="text-white/40 text-xs uppercase tracking-widest">Client Portal</div>
            </div>
          </div>
          <h1 className="text-white text-3xl font-bold leading-tight mb-4">
            Track your cases<br />securely online
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Stay updated on hearing dates, view important documents, and securely communicate with your legal team.
          </p>
        </div>
        <div className="relative z-10 space-y-4">
          {[
            { icon: Gavel, label: "Case Updates", desc: "Real-time updates on your litigation" },
            { icon: FileText, label: "Document Vault", desc: "Securely view your legal documents" },
            { icon: ShieldCheck, label: "Secure & Private", desc: "Bank-grade encryption for all your data" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-blue-200" />
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
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-900 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-200" />
            </div>
            <span className="text-blue-900 font-bold text-lg">Client Portal</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Client Login</h2>
              <p className="text-sm text-gray-500 mt-1">Access your secure legal portal</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email Address</label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors
                    placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
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
                      placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
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
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all
                  hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Access Portal"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
