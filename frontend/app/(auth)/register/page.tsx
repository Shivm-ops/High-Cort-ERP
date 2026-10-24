"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Scale, ShieldCheck, FileText, Brain, Gavel, Mail, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
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

  // ── 2-Step OTP Verification State ──────────────────────────────────────────
  const [step, setStep] = useState<"form" | "otp">("form");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resending OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
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
  }, [step, timer]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: "advocate",
    }
  });

  const selectedRole = watch("role");

  // Step 1: Submit Form & Initiate OTP
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await api.post("/auth/register-initiate", data);
      setRegisteredEmail(data.email.toLowerCase().trim());
      setStep("otp");
      setTimer(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      toast.success(`Verification code dispatched to ${data.email}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // Handle individual OTP input changes with auto-focus
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // User pasted multiple characters (e.g. 6-digit code)
      const pasted = value.replace(/\D/g, "").slice(0, 6).split("");
      const newDigits = [...otpDigits];
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify 6-digit OTP & Sign In
  const onVerifyOtp = async () => {
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register-verify-otp", {
        email: registeredEmail,
        otp: fullOtp,
      });

      if (res.data.access_token) {
        localStorage.setItem("access_token", res.data.access_token);
        if (res.data.refresh_token) {
          localStorage.setItem("refresh_token", res.data.refresh_token);
        }
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }
        toast.success("Account successfully verified! Welcome to Fastcase.");
        router.push("/dashboard");
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  // Resend 6-digit OTP
  const onResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    try {
      await api.post("/auth/resend-registration-otp", { email: registeredEmail });
      toast.success("A fresh 6-digit verification code has been dispatched!");
      setTimer(60);
      setCanResend(false);
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between p-10 lg:p-14 xl:p-18 2xl:p-24 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #013B36 0%, #014D46 50%, #0B3D2E 100%)" }}
      >
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6EE7B7 0%, transparent 70%)" }} />
        <div className="absolute bottom-20 right-[-60px] w-72 h-72 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #72D6C9 0%, transparent 70%)" }} />
        
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-mint/15 border border-mint/25 flex items-center justify-center shadow-lg shadow-mint/10">
            <Scale className="w-6 h-6 lg:w-7 lg:h-7 text-mint" />
          </div>
          <div>
            <div className="text-white font-extrabold text-xl lg:text-2xl tracking-tight leading-none">Fastcase</div>
            <div className="text-mint text-[11px] lg:text-xs uppercase tracking-widest font-bold">Legal Platform</div>
          </div>
        </div>

        <div className="max-w-xl xl:max-w-2xl relative z-10 my-auto py-8">
          <h1 className="text-white text-3xl lg:text-4xl xl:text-5xl 2xl:text-[52px] font-extrabold leading-[1.18] mb-5 lg:mb-6 tracking-tight">
            India's Complete Legal<br />Operating System
          </h1>
          <p className="text-white/80 text-base lg:text-lg xl:text-xl leading-relaxed font-normal max-w-xl">
            Manage cases, draft documents, track hearings, and run your practice — all in one platform.
          </p>
        </div>

        <div className="relative z-10 space-y-4 lg:space-y-5 xl:space-y-6">
          {[
            { icon: Brain, label: "Smart Legal Drafting", desc: "Generate bail applications, writs, notices in seconds" },
            { icon: Gavel, label: "Smart Case Management", desc: "Track every case stage with real-time updates" },
            { icon: FileText, label: "Document Intelligence", desc: "OCR, search, and analyze any legal document" },
            { icon: ShieldCheck, label: "Secure & Private", desc: "Bank-grade encryption for all client data" },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-center gap-4.5">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="w-5 h-5 text-mint" />
              </div>
              <div>
                <div className="text-white text-sm lg:text-base font-semibold tracking-tight">{label}</div>
                <div className="text-white/60 text-xs lg:text-sm mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F7F8F6] px-6 sm:px-10 lg:px-12 xl:px-16 2xl:px-20 py-8 lg:py-12 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md lg:max-w-lg xl:max-w-[500px] 2xl:max-w-[540px] my-auto"
        >
          <div className="flex lg:hidden items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-sidebar flex items-center justify-center shadow-md">
              <Scale className="w-5 h-5 text-mint" />
            </div>
            <span className="text-sidebar font-extrabold text-2xl tracking-tight">Fastcase</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/80 p-8 sm:p-10 lg:p-12 xl:p-14">
            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.div
                  key="form-step"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-8 lg:mb-10">
                    <h2 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-gray-900 tracking-tight">Create an account</h2>
                    <p className="text-sm lg:text-base text-gray-500 mt-2">Join Fastcase to manage your legal practice</p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-5">
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                      <input
                        {...register("full_name")}
                        type="text"
                        placeholder="John Doe"
                        className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all
                          placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                          ${errors.full_name ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                      />
                      {errors.full_name && <p className="text-xs lg:text-sm text-red-500 mt-1">{errors.full_name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                      <input
                        {...register("email")}
                        type="email"
                        placeholder="advocate@lawfirm.in"
                        autoComplete="email"
                        className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all
                          placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                          ${errors.email ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                      />
                      {errors.email && <p className="text-xs lg:text-sm text-red-500 mt-1">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                      <input
                        {...register("phone")}
                        type="tel"
                        placeholder="+91 9876543210"
                        className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all
                          placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                          ${errors.phone ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                      />
                      {errors.phone && <p className="text-xs lg:text-sm text-red-500 mt-1">{errors.phone.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                      <select
                        {...register("role")}
                        className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all
                          focus:ring-2 focus:ring-mint/30 focus:border-mint bg-white
                          ${errors.role ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <option value="advocate">Advocate</option>
                        <option value="associate">Associate</option>
                      </select>
                      {errors.role && <p className="text-xs lg:text-sm text-red-500 mt-1">{errors.role.message}</p>}
                    </div>

                    {selectedRole === "advocate" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">Bar Council Number</label>
                        <input
                          {...register("bar_council_no")}
                          type="text"
                          placeholder="MAH/1234/2020"
                          className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all
                            placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                            ${errors.bar_council_no ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                        />
                        {errors.bar_council_no && <p className="text-xs lg:text-sm text-red-500 mt-1">{errors.bar_council_no.message}</p>}
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <input
                          {...register("password")}
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          className={`w-full rounded-xl border px-4 py-3.5 lg:py-4 lg:px-5 text-sm lg:text-base outline-none transition-all pr-12
                            placeholder:text-gray-400 focus:ring-2 focus:ring-mint/30 focus:border-mint
                            ${errors.password ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-gray-300"}`}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                          {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-xs lg:text-sm text-red-500 mt-1">{errors.password.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-sidebar py-3.5 lg:py-4 text-sm lg:text-base font-semibold text-white transition-all
                        hover:bg-sidebar-dark active:scale-[0.99] shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer mt-3"
                    >
                      {loading ? "Sending Verification Code..." : "Create Account & Verify Email"}
                    </button>
                  </form>

                  <div className="mt-8 text-center text-sm lg:text-base text-gray-500">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="font-semibold text-sidebar hover:text-sidebar-dark transition-colors"
                    >
                      Sign in
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="otp-step"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="inline-flex items-center gap-1.5 text-xs lg:text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors mb-6 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to registration</span>
                  </button>

                  <div className="w-14 h-14 rounded-2xl bg-mint/15 border border-mint/30 flex items-center justify-center mb-6 shadow-inner">
                    <KeyRound className="w-7 h-7 text-mint" />
                  </div>

                  <div className="mb-6">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">Verify Your Email</h2>
                    <p className="text-sm lg:text-base text-gray-600 mt-2 leading-relaxed">
                      We sent a 6-digit verification code to{" "}
                      <span className="font-semibold text-gray-900">{registeredEmail}</span>.
                      Enter the code below to activate your chambers.
                    </p>
                  </div>

                  {/* 6-Digit OTP Inputs */}
                  <div className="flex justify-between items-center gap-2 sm:gap-3 my-6">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { otpInputRefs.current[idx] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onFocus={(e) => e.target.select()}
                        className="w-11 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all focus:border-mint focus:bg-white focus:ring-4 focus:ring-mint/20"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={onVerifyOtp}
                    disabled={loading || otpDigits.join("").length < 6}
                    className="w-full rounded-xl bg-sidebar py-3.5 lg:py-4 text-sm lg:text-base font-semibold text-white transition-all
                      hover:bg-sidebar-dark active:scale-[0.99] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-mint" />
                        <span>Verifying & Setting Up Practice...</span>
                      </>
                    ) : (
                      <span>Verify & Enter Practice →</span>
                    )}
                  </button>

                  <div className="mt-6 text-center text-sm text-gray-500">
                    Didn't receive the verification email?{" "}
                    {canResend ? (
                      <button
                        type="button"
                        onClick={onResendOtp}
                        disabled={loading}
                        className="font-semibold text-sidebar hover:text-sidebar-dark inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                      </button>
                    ) : (
                      <span className="text-gray-400 font-medium">
                        Resend in <span className="font-semibold text-gray-700">{timer}s</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldCheck className="w-4 h-4 text-mint" />
                    <span>Section 126 Privileged Digital Chambers Protection</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
