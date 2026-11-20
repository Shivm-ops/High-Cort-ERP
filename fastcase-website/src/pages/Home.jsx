import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductShowcase from '../components/ProductShowcase';
import {
  Users, Briefcase, Calendar, FileText, CheckCircle, ArrowRight, Shield,
  Zap, Lock, ChevronDown, Gavel, CreditCard, Sparkles, Scale, Search,
  IndianRupee, Clock, Bell
} from 'lucide-react';

const getErpUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const rootDomain = host.replace(/^(app|admin|landing|www)\./, "");
      return `${window.location.protocol}//app.${rootDomain}`;
    }
  }
  return import.meta.env.VITE_ERP_APP_URL || "http://localhost:3000";
};

/* ─── Enhanced Hero Dashboard Showcase (Clean, Vector, High-Impact) ─────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[620px] mx-auto lg:mr-0 group select-none">
      {/* Ambient Emerald Glow Backdrop */}
      <div className="absolute -inset-3 bg-gradient-to-tr from-[#34D399]/25 via-[#059669]/20 to-[#013B36]/30 rounded-3xl blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Main Browser Card */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-[0_24px_60px_-15px_rgba(1,59,54,0.18)] transition-all duration-300 group-hover:shadow-[0_28px_70px_-12px_rgba(1,59,54,0.25)]">
        {/* Browser Top Window Chrome */}
        <div className="bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/80 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1 flex items-center justify-between text-[11px] text-slate-400 shadow-2xs">
            <span className="flex items-center gap-1.5 font-mono text-slate-600 font-medium truncate">
              <Lock className="w-3 h-3 text-[#059669] shrink-0" />
              https://app.fastcase.in/dashboard
            </span>
            <span className="text-[10px] font-black text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded border border-[#A7F3D0] shrink-0">
              LIVE WORKSPACE
            </span>
          </div>
        </div>

        {/* ── Coded Modern Fastcase Dashboard UI (Crystal Clear, Vector & Crisp) ── */}
        <div className="p-3.5 sm:p-4 bg-[#F8FAFC] text-slate-800 space-y-3">
          
          {/* Top Sub-Bar: Brand, Search & Advocate Profile */}
          <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#013B36] text-[#34D399] flex items-center justify-center shadow-xs">
                <Scale className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[12px] font-extrabold text-slate-900 leading-none">Fastcase</p>
                <p className="text-[9px] text-[#059669] font-bold mt-0.5">High Court Suite</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[10.5px] text-slate-400 w-44">
              <Search className="w-3 h-3 text-slate-400" />
              <span className="truncate">Search CNR / Case...</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#065F46] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                Adv. Rajesh Patil
              </span>
            </div>
          </div>

          {/* 4 Clean Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Active Cases</span>
                <Gavel className="w-3.5 h-3.5 text-[#059669]" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">142</p>
              <p className="text-[9px] text-[#059669] font-bold mt-0.5">+8 this month</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Today's Board</span>
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">4 Listed</p>
              <p className="text-[9px] text-amber-600 font-bold mt-0.5">2 High Court • 2 Dist</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Legal Drafts</span>
                <FileText className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">19 Ready</p>
              <p className="text-[9px] text-blue-600 font-bold mt-0.5">Marathi / Eng A4</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-500">Fee Recovery</span>
                <IndianRupee className="w-3.5 h-3.5 text-[#013B36]" />
              </div>
              <p className="text-base sm:text-lg font-black text-slate-900 leading-tight">₹4.2 Lakh</p>
              <p className="text-[9px] text-[#059669] font-bold mt-0.5">92% Invoiced</p>
            </div>
          </div>

          {/* 2-Column Split: Daily Court Cause List & Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
            
            {/* Left: Today's Cause List (7 cols) */}
            <div className="sm:col-span-7 bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#059669] animate-ping" />
                  <span className="text-[10.5px] font-extrabold text-slate-900">Today's Court Board</span>
                </div>
                <span className="text-[9px] font-bold text-slate-400">eCourts CNR Live</span>
              </div>

              <div className="space-y-1.5">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold text-slate-900">WP/8912/2026</span>
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Item #11</span>
                    </div>
                    <p className="text-[9px] text-slate-500 truncate max-w-[170px]">Deshmukh vs State of Maharashtra</p>
                    <p className="text-[8.5px] text-slate-400">Court 4 • Justice R. K. Shinde (10:30 AM)</p>
                  </div>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                    Next in Line
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-bold text-slate-900">BAIL/412/2026</span>
                      <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">Item #07</span>
                    </div>
                    <p className="text-[9px] text-slate-500 truncate max-w-[170px]">State vs Sachin Kadam (Sec 438)</p>
                    <p className="text-[8.5px] text-slate-400">Sessions Court 2 • 11:45 AM</p>
                  </div>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                    Arguments
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Smart Drafting & Automation (5 cols) */}
            <div className="sm:col-span-5 bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-2xs space-y-2">
              <p className="text-[10.5px] font-extrabold text-slate-900 pb-1 border-b border-slate-100 flex items-center justify-between">
                <span>Advocate Workspace</span>
                <Sparkles className="w-3 h-3 text-[#059669]" />
              </p>

              <div className="p-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]/80">
                <p className="text-[9.5px] font-bold text-[#065F46] flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#059669]" />
                  1-Click Legal Drafter
                </p>
                <p className="text-[8.5px] text-slate-600 mt-0.5">Bail petition generated in 3s (Marathi/Eng)</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                <p className="text-[9.5px] font-bold text-slate-800 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  Client WhatsApp Sync
                </p>
                <p className="text-[8.5px] text-slate-500 mt-0.5">4 Hearing alerts dispatched at 09:00 AM</p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Floating Badge 1: Top Right - Live Court Sync */}
      <div className="absolute -top-3.5 -right-3.5 sm:-right-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 hidden sm:flex items-center gap-2.5 z-20">
        <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] shrink-0">
          <Scale className="w-4 h-4" />
        </div>
        <div className="text-left pr-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-900">eCourts CNR Sync</span>
            <span className="inline-flex items-center gap-1 text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Daily Cause List Automated</p>
        </div>
      </div>

      {/* Floating Badge 2: Bottom Left - Vernacular Drafting */}
      <div className="absolute -bottom-3.5 -left-3.5 sm:-left-4 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 sm:p-3 shadow-xl shadow-slate-900/10 hidden sm:flex items-center gap-2.5 z-20">
        <div className="w-8 h-8 rounded-xl bg-[#013B36] text-[#34D399] flex items-center justify-center shrink-0 shadow-xs">
          <FileText className="w-4 h-4" />
        </div>
        <div className="text-left pr-1.5">
          <p className="text-[11px] font-extrabold text-slate-900">500+ Legal Drafts</p>
          <p className="text-[10px] text-slate-500 font-medium">Marathi • Hindi • English A4</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Compact FAQ Item ───────────────────────────────────────────────── */
function HomeFAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-slate-200 rounded-xl overflow-hidden transition-all duration-200 ${open ? 'shadow-xs border-primary/30' : 'bg-white'}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-white hover:bg-slate-50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-slate-900 leading-snug">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-white border-t border-slate-100">
          <p className="text-[13.5px] text-slate-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Compact Home Page ──────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="bg-[#F8FAFC]">

      {/* ── HERO (Compact, Attractive & High-Impact) ─────────────────────────────────── */}
      <section className="relative pt-20 pb-12 lg:pt-24 lg:pb-16 overflow-hidden border-b border-slate-200/80 bg-white">
        {/* Subtle Ambient Mesh Texture */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Radial Top Glow in TruePay Emerald */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.18),rgba(1,59,54,0.06)_45%,transparent_75%)] opacity-80" />
        </div>

        <div className="section-container relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Top Announcement Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-bold text-[#065F46] shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34D399] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]" />
                </span>
                <span className="tracking-wide uppercase text-[10.5px]">Legal Operating System for Indian Advocates</span>
                <span className="text-[10px] bg-[#059669] text-white px-1.5 py-0.2 rounded font-black">v2.0</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-heading font-[900] text-3xl sm:text-4xl lg:text-[44px] text-slate-950 leading-[1.25] tracking-tight text-balance">
                Everything Your Legal Practice Needs,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#013B36] via-[#059669] to-[#10B981]">
                  Unified.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-[17px] text-slate-600 leading-relaxed max-w-xl font-normal">
                Automate case lifecycles, court cause lists, 500+ vernacular drafts, and GST-compliant fee billing from one secure platform.
              </p>

              {/* CTAs Row */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={`${getErpUrl()}/register`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#013B36] hover:bg-[#024E47] text-white font-bold text-sm shadow-md shadow-[#013B36]/25 hover:shadow-lg transition-all group"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4 text-[#34D399] transition-transform group-hover:translate-x-1" />
                </a>

                <a
                  href={`${getErpUrl()}/login`}
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm border border-slate-200/90 shadow-2xs transition"
                >
                  Advocate Login
                </a>

                <a
                  href={`${getErpUrl()}/citizen-login`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 transition"
                >
                  <span>Consumer Portal</span>
                  <span className="text-[9px] font-black bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-1.5 py-0.5 rounded-full">
                    ₹३० Drafts
                  </span>
                </a>
              </div>

              {/* Trust Checkmarks & Rating Strip */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#059669]" /> 14-Day Free Trial
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#059669]" /> 100% Indian Cloud Data
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-[#059669]" /> Bar Council Compliant
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="text-amber-500 text-xs">★★★★★</span>
                  <span>Trusted by <strong>2,500+ Indian Advocates</strong> across Maharashtra & India</span>
                </div>
              </div>
            </div>

            {/* Right Dashboard Mockup (5 cols on lg) */}
            <div className="lg:col-span-5 relative mt-4 lg:mt-0">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST HIGHLIGHTS (Single Clean Strip) ───────────────────── */}
      <section className="bg-slate-50/90 border-b border-slate-200 py-6">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Briefcase, title: 'Case Lifecycle', desc: 'CNR sync & cause lists' },
              { icon: FileText, title: '500+ Drafts', desc: 'English, Marathi, Hindi' },
              { icon: CreditCard, title: 'GST Invoicing', desc: 'SAC 9982 legal tax bills' },
              { icon: Shield, title: 'Sec 126 Privilege', desc: 'Encrypted client vaults' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs hover:border-[#059669]/30 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] group-hover:bg-[#013B36] group-hover:text-[#34D399] flex items-center justify-center flex-shrink-0 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-[800] text-[13.5px] text-slate-900 leading-tight truncate">{title}</p>
                  <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE (Interactive Tabbed Screens) ───────────── */}
      <ProductShowcase />

      {/* ── ESSENTIAL PILLARS (Clean 4-Card Grid) ───────────────────── */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="section-container">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Core Pillars
            </span>
            <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900 mt-3">
              Built for Every Day of Court Practice
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Replace physical diary registers with an automated digital command center.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Calendar,
                title: 'Hearing Diary & Sync',
                desc: 'Automatic cause list updates, daily court board tracking, and limitation countdown alerts.',
                tag: 'Court Diary',
                color: 'text-amber-800 bg-amber-50 border-amber-200/60',
              },
              {
                icon: FileText,
                title: 'Vernacular Legal Drafts',
                desc: '500+ court-verified templates with 1-click matter auto-fill in English, Marathi, Hindi, and Gujarati.',
                tag: 'Templates',
                color: 'text-primary bg-primary/10 border-primary/20',
              },
              {
                icon: CreditCard,
                title: 'GST Billing & Ledger',
                desc: 'Compliant legal fee invoices, trust account retainers, and automated WhatsApp receipts.',
                tag: 'Billing',
                color: 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]',
              },
              {
                icon: Shield,
                title: 'Privileged Evidence Vault',
                desc: 'Section 126 Evidence Act compliant encryption isolating client files in Indian cloud datacenters.',
                tag: 'Security',
                color: 'text-primary bg-primary/10 border-primary/20',
              },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="card p-5 bg-white border border-slate-200/90 hover:shadow-card-hover hover:-translate-y-0.5 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                        {p.tag}
                      </span>
                    </div>
                    <h3 className="font-heading font-[700] text-[15px] text-slate-900 mb-2 leading-snug">
                      {p.title}
                    </h3>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── COMPACT FAQ (3 Essential Questions) ─────────────────────── */}
      <section className="py-12 bg-slate-50 border-b border-slate-200">
        <div className="section-container max-w-2xl">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-200">
              Quick Answers
            </span>
            <h2 className="font-heading font-[800] text-2xl text-slate-900 mt-2.5">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-2.5">
            {[
              {
                q: 'What is Fastcase?',
                a: 'Fastcase is an enterprise Practice Management System developed by SOSM Services Private Limited specifically for Indian advocates, chambers, and law firms to automate case tracking, cause lists, drafting, and billing.'
              },
              {
                q: 'What core features does the Fastcase application provide?',
                a: 'Fastcase includes end-to-end legal practice tools: CNR-based Case Tracking & Daily Cause Lists, 500+ Vernacular Legal Drafts (English, Marathi, Hindi, Gujarati), Hearing Calendars with automated reminders, Document OCR Intelligence, GST-compliant Legal Invoicing (SAC 9982), and Client Intake Portals.'
              },
              {
                q: 'Can multiple advocates and chamber team members collaborate on cases?',
                a: 'Yes. Fastcase offers multi-user chamber management with role-based access for Senior Advocates, Associates, Clerks, and Interns. You can assign tasks, delegate hearings, share research notes, and track internal progress across all active matters.'
              },
              {
                q: 'How does Fastcase automate court case tracking and hearings?',
                a: 'Fastcase organizes your cases by CNR number, court, and case stage. It generates daily chamber cause lists, maintains full hearing histories with court orders, and provides automated calendar reminders so you never miss a court date or limitation deadline.'
              },
              {
                q: 'Is client and matter data privileged and secure?',
                a: 'Yes. All data adheres strictly to Attorney-Client Privilege under Section 126 of the Indian Evidence Act. Data is encrypted using AES-256 and hosted exclusively in sovereign Indian tier-4 cloud datacenters in Mumbai and Bengaluru.'
              },
            ].map(({ q, a }) => <HomeFAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>

      {/* ── CLEAN BOTTOM ACTION BAR ─────────────────────────────────── */}
      <section className="py-10 bg-white">
        <div className="section-container max-w-4xl text-center">
          <h2 className="font-heading font-[800] text-2xl text-slate-900 mb-2">
            Ready to Modernize Your Chamber Operations?
          </h2>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Join hundreds of advocates across Maharashtra and India managing their daily practice on Fastcase.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a href={`${getErpUrl()}/register`} className="btn-primary text-sm py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-sm">
              Start 14-Day Free Trial <ArrowRight className="w-4 h-4" />
            </a>
            <Link to="/features" className="btn-secondary text-sm py-2.5 px-6 rounded-xl">
              Explore All Features
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
