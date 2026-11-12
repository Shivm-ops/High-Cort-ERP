import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductShowcase from '../components/ProductShowcase';
import {
  Users, Briefcase, Calendar, FileText, CheckCircle, ArrowRight, Shield,
  Zap, Lock, ChevronDown, Gavel, CreditCard
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

/* ─── Compact Dashboard Mockup ────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[580px] mx-auto lg:mx-0">
      <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(13,38,68,0.15)]">
        {/* Browser bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-md px-3 py-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Lock className="w-3 h-3 text-emerald-600" />
            app.fastcase.in/dashboard
          </div>
        </div>
        {/* Real screenshot */}
        <img
          src="/screenshots/dashboard.png"
          alt="Fastcase Dashboard"
          className="w-full block object-cover object-top max-h-[380px]"
        />
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

      {/* ── HERO (Compact & Judicial) ─────────────────────────────────── */}
      <section className="relative pt-28 pb-14 lg:pt-32 lg:pb-16 overflow-hidden bg-white border-b border-slate-200">
        <div className="section-container relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <div className="inline-flex items-center gap-2 bg-primary/8 border border-primary/20 text-primary text-[11px] font-bold tracking-wider uppercase rounded-full px-3.5 py-1.5">
                  <Gavel className="w-3.5 h-3.5 text-amber-500" />
                  Legal ERP for Indian Advocates
                </div>
                <Link
                  to="/consumer-portal"
                  className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold tracking-wider uppercase rounded-full px-3.5 py-1.5 hover:bg-emerald-100 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Consumer Portal (नागरिक कक्ष) →
                </Link>
              </div>

              <h1 className="font-heading font-[900] text-3xl sm:text-4xl lg:text-[44px] text-slate-900 leading-[1.32] sm:leading-[1.28] lg:leading-[1.24] tracking-tight mb-5 text-balance">
                Everything Your Legal Practice Needs, <span className="text-[#014D46] dark:text-[#3FB594]">Unified.</span>
              </h1>

              <p className="text-[16px] text-slate-600 leading-relaxed mb-6 max-w-lg">
                Automate case lifecycles, court cause lists, 500+ vernacular drafts, and GST-compliant fee billing from one secure platform.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <a href={`${getErpUrl()}/register`} className="btn-primary text-sm py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-sm">
                  Registration <ArrowRight className="w-4 h-4" />
                </a>
                <a href={`${getErpUrl()}/login`} className="btn-secondary text-sm py-2.5 px-6 rounded-xl">
                  Advocate Login
                </a>
                <a
                  href={`${getErpUrl()}/consumer`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-sm transition-all hover:shadow-md"
                >
                  <Shield className="w-4 h-4" />
                  Consumer Portal
                </a>
              </div>

              {/* Key Trust Checkmarks */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 14-Day Free Trial
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> 100% Indian Cloud Data
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Bar Council Compliant
                </span>
              </div>
            </div>

            {/* Right — Dashboard Mockup */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST HIGHLIGHTS (Single Clean Strip) ───────────────────── */}
      <section className="bg-slate-50 border-b border-slate-200 py-6">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Briefcase, title: 'Case Lifecycle', desc: 'CNR sync & cause lists' },
              { icon: FileText, title: '500+ Drafts', desc: 'English, Marathi, Hindi' },
              { icon: CreditCard, title: 'GST Invoicing', desc: 'SAC 9982 legal tax bills' },
              { icon: Shield, title: 'Sec 126 Privilege', desc: 'Encrypted client vaults' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-[700] text-[13px] text-slate-900 leading-tight truncate">{title}</p>
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
                color: 'text-teal-900 bg-teal-50 border-teal-200/60',
              },
              {
                icon: CreditCard,
                title: 'GST Billing & Ledger',
                desc: 'Compliant legal fee invoices, trust account retainers, and automated WhatsApp receipts.',
                tag: 'Billing',
                color: 'text-emerald-900 bg-emerald-50 border-emerald-200/60',
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

      {/* ── CITIZEN & CONSUMER PORTAL SHOWCASE ───────────────────────── */}
      <section className="py-16 bg-gradient-to-b from-emerald-950 via-[#013B36] to-slate-900 text-white relative overflow-hidden">
        <div className="section-container relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold tracking-wider uppercase rounded-full px-3.5 py-1 mb-4">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                Dedicated Citizen & Consumer Module
              </div>
              <h2 className="font-heading font-[900] text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4 text-white">
                नागरिक व ग्राहक विधी तक्रार निवारण कक्ष
              </h2>
              <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
                Ordinary citizens can now understand their legal rights, pinpoint the exact competent authority, and generate professionally formatted, court-ready complaint applications in Marathi, Hindi, and English.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-emerald-100/90 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Consumer Forum Complaints (CPA 2019)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Police & FIR Guidance (BNSS 2023)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>1930 Cyber Financial Fraud Recovery</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Municipal & RTI Applications</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`${getErpUrl()}/consumer`}
                  className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md transition-all"
                >
                  <Shield className="w-4 h-4 text-slate-950" />
                  तक्रार अर्ज तयार करा (Open Consumer Portal) <ArrowRight className="w-4 h-4" />
                </a>
                <Link
                  to="/consumer-portal"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm py-2.5 px-5 rounded-xl transition-all"
                >
                  Learn More (सविस्तर माहिती)
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/15">
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  1-Click Assistance
                </span>
                <span className="text-[11px] font-semibold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full">
                  100% Free for Citizens
                </span>
              </div>
              <ul className="space-y-3 text-xs text-emerald-100/90 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">1</span>
                  <span>Select from 9 core grievance categories without needing legal knowledge.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">2</span>
                  <span>System identifies the applicable Act, Section, and competent authority.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/30 text-emerald-300 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">3</span>
                  <span>Generates signed A4 PDF complaints with proper verification clauses ready for submission.</span>
                </li>
              </ul>
              <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-300/80">
                <span>Helplines: 1930 Cyber · 112 Police · 1915 Consumer</span>
              </div>
            </div>
          </div>
        </div>
      </section>
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
