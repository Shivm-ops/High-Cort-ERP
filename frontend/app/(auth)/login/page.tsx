"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Scale, ShieldCheck, FileText, Brain, Gavel, KeyRound, Mail, ArrowRight, RefreshCw, Clock } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";

const passwordSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // ── OTP Login State ────────────────────────────────────────────────────────
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60); // 60 seconds
  const [canResend, setCanResend] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password form
  const { register, handleSubmit, formState: { errors } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Countdown timer for 3-minute OTP
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

  // 1. Password Login
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
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

  // 2. OTP Initiate (Send 6-digit Code, 3-minute TTL)
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

  // 3. OTP Verify (Verify 6-digit Code, max 3 attempts)
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
      // If remaining attempts mentioned in msg
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

  // OTP inputs handling
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
            <div className="mb-6">
              <h2 className="text-2xl lg:text-3xl xl:text-4xl font-extrabold text-gray-900 tracking-tight">Welcome back</h2>
              <p className="text-sm lg:text-base text-gray-500 mt-2">Sign in to your Fastcase practice</p>
            </div>

            {/* Auth Mode Toggle: Password vs OTP */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setAuthMode("password")}
                className={`flex-1 py-2 text-xs lg:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 py-2 text-xs lg:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authMode === "otp" ? "bg-white text-sidebar shadow-sm" : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> Sign in with OTP
              </button>
            </div>

            {/* Mode 1: Password Login */}
            {authMode === "password" && (
              <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-5 lg:space-y-6">
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
            )}

            {/* Mode 2: Login with Email OTP (3-min expiry, max 3 attempts) */}
            {authMode === "otp" && (
              <div>
                {otpStep === "email" ? (
                  <form onSubmit={onSendLoginOtp} className="space-y-5">
                    <div>
                      <label className="block text-xs lg:text-sm font-semibold text-gray-700 mb-2">Registered Email Address</label>
                      <input
                        type="email"
                        required
                        value={otpEmail}
                        onChange={(e) => setOtpEmail(e.target.value)}
                        placeholder="advocate@lawfirm.in"
                        className="w-full rounded-xl border border-gray-200 hover:border-gray-300 px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-mint/30 focus:border-mint"
                      />
                      <p className="text-xs text-gray-400 mt-1.5">
                        We will dispatch a secure 6-digit code valid for 60 seconds (maximum 3 attempts, 12-hour lockout).
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !otpEmail}
                      className="w-full rounded-xl bg-sidebar py-3.5 text-sm font-semibold text-white transition-all hover:bg-sidebar-dark shadow-md disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? "Sending Code..." : "Send Login Code"} <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Enter 6-digit code sent to <strong className="text-gray-900">{otpEmail}</strong>
                      </p>
                      
                      {/* Timer & Attempts */}
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          timer > 15 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                        }`}>
                          <Clock className="w-3.5 h-3.5" /> Expires in: {formatTimer(timer)}
                        </span>
                        {attemptsRemaining !== null && (
                          <span className="text-xs font-semibold text-gray-500">
                            {attemptsRemaining} attempt(s) left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 6 Digit Inputs */}
                    <div className="flex justify-center gap-2 sm:gap-3">
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
                          className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-sidebar focus:ring-2 focus:ring-sidebar/20 outline-none transition-all"
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={onVerifyLoginOtp}
                      disabled={loading || otpDigits.join("").length < 6}
                      className="w-full rounded-xl bg-sidebar py-3.5 text-sm font-semibold text-white hover:bg-sidebar-dark transition-all shadow-md disabled:opacity-60 cursor-pointer"
                    >
                      {loading ? "Verifying..." : "Verify & Sign In"}
                    </button>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("email");
                          setOtpDigits(["", "", "", "", "", ""]);
                        }}
                        className="hover:text-gray-800"
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
