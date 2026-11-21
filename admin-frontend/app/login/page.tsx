"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast, Toaster } from "sonner";
import { Lock, ShieldAlert } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      // Check if it's a superadmin token
      api.get("/auth/me").then(res => {
        if (res.data.is_superadmin) {
          router.push("/dashboard");
        } else {
          localStorage.removeItem("access_token");
          toast.error("Unauthorized. Admin access only.");
        }
      }).catch(() => {
        localStorage.removeItem("access_token");
      });
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      
      const response = await api.post("/auth/token", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" }
      });
      
      if (!response.data.user.is_superadmin) {
        toast.error("Access Denied: You do not have Super Admin privileges.");
        setLoading(false);
        return;
      }

      localStorage.setItem("access_token", response.data.access_token);
      toast.success("Welcome, Super Admin");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.response?.data?.detail || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#021F1B] flex items-center justify-center p-4 selection:bg-[#059669] selection:text-white">
      <Toaster position="top-center" richColors />
      <div className="bg-[#032A24] p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-[#065F46]/40 backdrop-blur-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#059669]/15 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#059669]/30 shadow-lg shadow-[#059669]/10">
            <ShieldAlert className="w-8 h-8 text-[#34D399]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Fastcase Admin Portal</h1>
          <p className="text-xs text-emerald-200/60 mt-1.5 font-medium">Restricted Area. Authorized personnel only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-100/80 mb-2">Admin Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#021F1B]/90 border border-[#065F46]/50 rounded-xl text-white placeholder-emerald-700/50 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] transition-all text-sm font-medium"
              placeholder="admin@fastcase.in"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-100/80 mb-2">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#021F1B]/90 border border-[#065F46]/50 rounded-xl text-white placeholder-emerald-700/50 focus:outline-none focus:ring-2 focus:ring-[#059669]/50 focus:border-[#059669] transition-all text-sm font-medium"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl shadow-lg shadow-[#059669]/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-3 cursor-pointer"
          >
            {loading ? "Authenticating..." : <><Lock className="w-4 h-4" /> Secure Login</>}
          </button>
        </form>
      </div>
    </div>
  );
}
