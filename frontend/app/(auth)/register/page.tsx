"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Scale, ShieldCheck, FileText, Brain, Gavel } from "lucide-react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";

const schema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter a valid phone number"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one digit")
    .regex(/[!@#$%^&*(),.?":{}|<>_\-]/, "Password must contain at least one special character"),
  role: z.enum(["advocate", "associate"]),
  bar_council_no: z.string().optional(),
}).refine((data) => {
  if (data.role === "advocate" && (!data.bar_council_no || data.bar_council_no.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Bar Council Number is required for Advocates",
  path: ["bar_council_no"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "advocate",
    }
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post("/auth/register", data);
      toast.success("Account created successfully! Please log in.");
      router.push("/login");
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
      <div className="flex-1 flex items-center justify-center bg-[#F7F8F6] px-6 py-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md my-auto"
        >
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-sidebar flex items-center justify-center">
              <Scale className="w-4 h-4 text-mint" />
            </div>
            <span className="text-sidebar font-bold text-lg">Fastcase</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
              <p className="text-sm text-gray-500 mt-1">Join Fastcase to manage your legal practice</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Full Name</label>
                <input
                  {...register("full_name")}
                  type="text"
                  placeholder="John Doe"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors
                    placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                    ${errors.full_name ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                />
                {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>}
              </div>

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
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone Number</label>
                <input
                  {...register("phone")}
                  type="tel"
                  placeholder="+91 9876543210"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors
                    placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                    ${errors.phone ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Role</label>
                <select
                  {...register("role")}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors
                    focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white
                    ${errors.role ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                >
                  <option value="advocate">Advocate</option>
                  <option value="associate">Associate</option>
                </select>
                {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
              </div>

              {selectedRole === "advocate" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Bar Council Number</label>
                  <input
                    {...register("bar_council_no")}
                    type="text"
                    placeholder="MAH/1234/2020"
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors
                      placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                      ${errors.bar_council_no ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                  />
                  {errors.bar_council_no && <p className="text-xs text-red-500 mt-1">{errors.bar_council_no.message}</p>}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
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
                  hover:bg-sidebar-dark active:scale-[0.99] disabled:opacity-60 mt-2"
              >
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-sidebar hover:text-sidebar-dark transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
