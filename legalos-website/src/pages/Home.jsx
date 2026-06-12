import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductShowcase from '../components/ProductShowcase';
import {
  Scale, Users, Briefcase, Calendar, FileText, FolderOpen, BookOpen,
  Bell, LayoutDashboard, Receipt, CheckCircle, ArrowRight, Shield,
  Globe, Zap, Mail, Gavel, Lock, UserCheck, Timer, Database,
  ClipboardList, CreditCard, FileSearch, MessageSquare, Award, TrendingUp,
  Layers, ChevronDown,
} from 'lucide-react';

/* ─── Dashboard Mockup ─────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="relative w-full max-w-[620px] mx-auto lg:mx-0">
      <div className="absolute -inset-6 bg-gradient-to-br from-primary/8 via-teal/5 to-transparent rounded-3xl" />
      <div className="relative bg-white rounded-2xl overflow-hidden border border-line shadow-dashboard">
        {/* Browser chrome */}
        <div className="bg-slate-50 border-b border-line px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <div className="flex-1 bg-white border border-line rounded-md px-3 py-1.5 flex items-center gap-1.5 text-[11px] text-ink/30">
            <Lock className="w-3 h-3 text-emerald-500" />
            app.legalos.in/dashboard
          </div>
        </div>
        {/* Real screenshot */}
        <img
          src="/screenshots/dashboard.png"
          alt="LegalOS Dashboard"
          className="w-full block"
          style={{ maxHeight: 460, objectFit: 'cover', objectPosition: 'top' }}
        />
      </div>
    </div>
  );
}

/* ─── Inline FAQ Item ───────────────────────────────────────────────── */
function HomeFAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-line rounded-xl overflow-hidden transition-all duration-200 ${open ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left bg-white hover:bg-surface transition-colors"
        aria-expanded={open}
      >
        <span className="text-[14px] font-semibold text-ink leading-snug">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-ink/40 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white border-t border-line">
          <p className="text-[14px] text-ink/60 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Data ─────────────────────────────────────────────────────────── */
const features = [
  {
    icon: Users,
    title: 'Client Management',
    desc: 'A complete CRM built for legal practice.',
    items: ['Client onboarding & KYC', 'PAN & Aadhaar records', 'Communication history', 'Client self-service portal'],
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    icon: Briefcase,
    title: 'Matter Management',
    desc: 'Full visibility over every case, from intake to closure.',
    items: ['Case lifecycle tracking', 'Court & judge details', 'Opponent management', 'Case timeline & notes'],
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    icon: Calendar,
    title: 'Hearing Management',
    desc: 'Never miss a court date again.',
    items: ['Smart court diary', 'Automated reminders', 'Cause list tracking', 'Multi-court calendar'],
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: FileText,
    title: 'Draft Automation',
    desc: 'Generate professional legal documents in seconds.',
    items: ['Notices & replies', 'Agreements & petitions', 'Auto-populate from client data', 'Multi-language templates'],
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    icon: FolderOpen,
    title: 'Evidence & Documents',
    desc: 'Centralized, secure document management.',
    items: ['OCR text extraction', 'Evidence tagging & linking', 'Version control', 'Secure encrypted storage'],
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    icon: Receipt,
    title: 'Billing & Invoicing',
    desc: 'Professional GST-compliant billing built in.',
    items: ['GST invoice generation', 'Payment tracking', 'Receivables dashboard', 'Revenue analytics'],
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    icon: ClipboardList,
    title: 'Team Collaboration',
    desc: 'Coordinate your entire team from one platform.',
    items: ['Advocate & clerk roles', 'Task allocation', 'Internal notes', 'Workflow management'],
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  {
    icon: BookOpen,
    title: 'Legal Research',
    desc: 'Research smarter with integrated case law tools.',
    items: ['Bare Acts library', 'Case law database', 'Citation management', 'AI-assisted research'],
    color: 'text-rose-600',
    bg: 'bg-rose-50',
  },
  {
    icon: Timer,
    title: 'Compliance & Limitation',
    desc: 'Stay ahead of every deadline and compliance date.',
    items: ['Limitation date calculator', 'Compliance due dates', 'Automated deadline alerts', 'Court order tracking'],
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    icon: Layers,
    title: 'Client Portal',
    desc: 'Transparent client experience without extra effort.',
    items: ['Case status updates', 'Document access', 'Invoice download', 'Secure messaging'],
    color: 'text-primary',
    bg: 'bg-primary/8',
  },
];

/* ─── Home Page ─────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="bg-surface">

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_-10%,rgba(15,76,129,0.05),transparent)]" />
        <div className="section-container relative">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-teal/8 border border-teal/15 text-teal text-[12px] font-bold tracking-wide uppercase rounded-full px-3.5 py-1.5 mb-7">
                <Zap className="w-3 h-3" />
                India's Legal Operating System
              </div>

              <h1 className="display-heading text-[2.75rem] sm:text-5xl lg:text-[3.5rem] mb-6 text-balance">
                India's Complete<br />
                <span className="text-primary">Legal Operating</span><br />
                System.
              </h1>

              <p className="text-[18px] text-ink/55 leading-relaxed mb-4 max-w-lg">
                Manage Clients, Cases, Hearings, Drafts, Billing, Research and Evidence from <strong className="text-ink/80 font-semibold">one secure platform</strong>.
              </p>
              <p className="text-[15px] text-ink/45 leading-relaxed mb-9 max-w-lg">
                LegalOS helps advocates, law firms and legal professionals automate office operations, improve productivity and manage their entire legal practice digitally.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/contact" className="btn-primary-lg">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={import.meta.env.VITE_ERP_APP_URL || 'http://localhost:3000'} className="btn-secondary-lg">
                  Book Live Demo
                </a>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                {[
                  'Secure Cloud Platform',
                  'Multi-Language Support',
                  'GST Compliant Billing',
                  'Built for Indian Advocates',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-[13px] text-ink/60 font-medium">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ──────────────────────────────────────────────── */}
      <section className="bg-surface-alt border-y border-line py-10">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-line rounded-2xl overflow-hidden">
            {[
              { icon: LayoutDashboard, label: 'Practice Management', sub: 'Manage your entire legal office from one platform', color: 'text-primary', bg: 'bg-primary/8' },
              { icon: BookOpen, label: 'Legal Research', sub: 'Research laws, provisions and case references', color: 'text-rose-600', bg: 'bg-rose-50' },
              { icon: Users, label: 'Team Collaboration', sub: 'Coordinate advocates, clerks and staff efficiently', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: Timer, label: 'Compliance Tracking', sub: 'Monitor deadlines, limitation periods and filings', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map(({ icon: Icon, label, sub, color, bg }) => (
              <div key={label} className="bg-white px-6 py-7 flex flex-col items-center text-center gap-3">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="font-heading font-[700] text-[15px] text-ink mb-1">{label}</p>
                  <p className="text-[12px] text-ink/45 leading-snug">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
            {[
              { icon: Shield, text: 'Enterprise-grade security' },
              { icon: Lock, text: 'AES-256 encryption' },
              { icon: Globe, text: 'India-hosted data centers' },
              { icon: Award, text: 'Bar Council compliant' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-teal flex-shrink-0" />
                <span className="text-[12px] font-medium text-ink/50">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section id="features" className="section-padding bg-white">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="eyebrow mb-4">Platform Features</p>
            <h2 className="section-heading text-4xl lg:text-5xl mb-5">
              Everything your practice needs.
            </h2>
            <p className="text-[18px] text-ink/50 max-w-xl mx-auto">
              16 deeply integrated modules covering every dimension of legal practice management.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="feature-card group">
                  <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-200`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-heading font-[700] text-[16px] text-ink mb-1.5 tracking-tight">{f.title}</h3>
                  <p className="text-[13px] text-ink/50 mb-4 leading-snug">{f.desc}</p>
                  <ul className="space-y-2">
                    {f.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-[12px] text-ink/60">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Link to="/features" className="btn-secondary-lg inline-flex">
              Explore all 16 features <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE ───────────────────────────────────────── */}
      <ProductShowcase />

      {/* ── HOW LEGALOS WORKS ──────────────────────────────────────── */}
      <section className="section-padding bg-surface-alt border-y border-line">
        <div className="section-container">
          <div className="text-center mb-16">
            <p className="eyebrow mb-4">How It Works</p>
            <h2 className="section-heading text-4xl lg:text-5xl mb-5">
              How LegalOS Automates<br />Your Legal Practice
            </h2>
            <p className="text-[17px] text-ink/50 max-w-2xl mx-auto">
              A complete workflow from client onboarding to case closure, designed specifically for Indian advocates, law firms, and legal professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                step: '01', icon: UserCheck, title: 'Client Onboarding & KYC',
                color: 'text-blue-600', bg: 'bg-blue-50',
                items: ['Register clients', 'Store KYC records securely', 'Maintain complete client history', 'Centralized client database'],
              },
              {
                step: '02', icon: Briefcase, title: 'Case & Matter Creation',
                color: 'text-violet-600', bg: 'bg-violet-50',
                items: ['Create matters in seconds', 'Organize practice areas', 'Track opponents and parties', 'Manage timelines'],
              },
              {
                step: '03', icon: FolderOpen, title: 'Document & Evidence Management',
                color: 'text-emerald-600', bg: 'bg-emerald-50',
                items: ['Upload evidence', 'OCR document extraction', 'Secure document repository', 'Version history tracking'],
              },
              {
                step: '04', icon: FileText, title: 'Drafting & Notice Automation',
                color: 'text-teal-600', bg: 'bg-teal-50',
                items: ['Legal draft templates', 'Notice generation', 'Reply drafting', 'Auto-populated client information'],
              },
              {
                step: '05', icon: Calendar, title: 'Hearings & Court Management',
                color: 'text-orange-500', bg: 'bg-orange-50',
                items: ['Court diary', 'Hearing schedules', 'Automated reminders', 'Compliance tracking'],
              },
              {
                step: '06', icon: Receipt, title: 'Billing & Client Updates',
                color: 'text-green-600', bg: 'bg-green-50',
                items: ['GST-compliant invoices', 'Payment tracking', 'Client portal access', 'Automated notifications'],
              },
            ].map(({ step, icon: Icon, title, color, bg, items }) => (
              <div key={step} className="card p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <span className="font-heading font-[900] text-[32px] text-ink/8 leading-none tracking-tight">{step}</span>
                </div>
                <h3 className="font-heading font-[700] text-[15px] text-ink mb-4 leading-snug">{title}</h3>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0 mt-0.5" />
                      <span className="text-[13px] text-ink/60">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ENTERPRISE SECURITY ─────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="eyebrow mb-4">Security & Compliance</p>
              <h2 className="section-heading text-4xl mb-5">
                Enterprise Security Built<br />for Legal Professionals
              </h2>
              <p className="text-[16px] text-ink/50 leading-relaxed mb-8">
                LegalOS implements enterprise-grade security across every layer of the platform to protect your client data, legal documents, and firm information.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                {[
                  'Multi-Tenant Data Isolation',
                  'AES-256 Data Encryption',
                  'Role-Based Access Control',
                  'Complete Audit Logs',
                  'Secure Document Storage',
                  'Daily Backups',
                  'Disaster Recovery Protection',
                  'India-Hosted Infrastructure',
                  'Session Management',
                  'Activity Monitoring',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5 py-2.5 border-b border-line last:border-0">
                    <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span className="text-[14px] text-ink/70 font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link to="/data-security" className="btn-secondary inline-flex text-[14px]">
                  View Data Security Policy <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Lock, title: 'Data Security', desc: 'All client records and documents protected with enterprise-grade encryption.', color: 'text-primary', bg: 'bg-primary/8' },
                { icon: Users, title: 'Access Control', desc: 'Advocates, associates, clerks, and staff receive role-based permissions.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { icon: ClipboardList, title: 'Audit Trail', desc: 'Track every action, modification, upload, and approval across the platform.', color: 'text-teal-600', bg: 'bg-teal-50' },
                { icon: Database, title: 'Business Continuity', desc: "Automated backups and disaster recovery mechanisms protect your firm's data.", color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(({ icon: Icon, title, desc, color, bg }) => (
                <div key={title} className="card p-6 hover:shadow-card-hover transition-shadow">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <h3 className="font-heading font-[700] text-[15px] text-ink mb-2">{title}</h3>
                  <p className="text-[13px] text-ink/55 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CLIENT PORTAL ──────────────────────────────────────────── */}
      <section className="section-padding bg-surface-alt border-y border-line">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="eyebrow mb-4">Client Portal</p>
              <h2 className="section-heading text-4xl mb-5">
                Keep Clients Informed Without<br />Endless Follow-Ups
              </h2>
              <p className="text-[16px] text-ink/50 leading-relaxed mb-6">
                Clients receive secure access to everything they need — reducing inbound calls and delivering a professional digital experience.
              </p>

              <div className="mb-8">
                <p className="text-[11px] font-[700] uppercase tracking-[0.08em] text-ink/35 mb-4">Clients receive secure access to:</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { icon: Briefcase, text: 'Case status updates' },
                    { icon: Calendar, text: 'Hearing schedules' },
                    { icon: FolderOpen, text: 'Shared documents' },
                    { icon: Receipt, text: 'Invoice downloads' },
                    { icon: TrendingUp, text: 'Payment history' },
                    { icon: Bell, text: 'Important notifications' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 bg-white border border-line rounded-xl px-4 py-3">
                      <Icon className="w-4 h-4 text-[#0EA5A4] flex-shrink-0" />
                      <span className="text-[13px] font-medium text-ink/70">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                {[
                  'Reduce client status calls',
                  'Improve transparency',
                  'Increase client satisfaction',
                  'Provide professional digital experience',
                ].map((b) => (
                  <div key={b} className="flex items-center gap-2.5">
                    <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span className="text-[14px] text-ink/65 font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Portal mockup */}
            <div className="card overflow-hidden border-line shadow-feature">
              <div className="bg-primary px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white text-[11px] font-bold">RS</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-[13px]">Rajesh Sharma</p>
                    <p className="text-white/50 text-[10px]">Client Portal</p>
                  </div>
                </div>
                <span className="bg-success/20 text-emerald-300 text-[10px] font-bold px-2 py-1 rounded-full">Active</span>
              </div>
              <div className="p-5 space-y-3 bg-white">
                {[
                  { label: 'Property Dispute Matter', status: 'Active · Hearing on 15 Jun', icon: Briefcase, col: 'text-primary bg-primary/8' },
                  { label: 'Next Hearing', status: '15 June 2025 · Dist. Court', icon: Calendar, col: 'text-orange-500 bg-orange-50' },
                  { label: 'Invoice #INV-0047', status: '₹15,000 · Due 20 June', icon: Receipt, col: 'text-green-600 bg-green-50' },
                  { label: 'Documents', status: '12 files · Last updated today', icon: FolderOpen, col: 'text-violet-600 bg-violet-50' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl border border-line hover:bg-surface transition-colors">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.col}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{item.label}</p>
                        <p className="text-[11px] text-ink/45">{item.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ───────────────────────────────────────────── */}
      <section id="integrations" className="section-padding bg-white">
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="eyebrow mb-4">Integrations</p>
            <h2 className="section-heading text-4xl mb-4">Powerful Integrations</h2>
            <p className="text-[16px] text-ink/50 max-w-lg mx-auto">
              LegalOS connects with the tools and systems that matter for Indian legal practice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MessageSquare, title: 'WhatsApp Notifications', desc: 'Automatically notify clients regarding hearings, invoices, and case updates.', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Mail, title: 'Email Communication', desc: 'Send notices, reminders, and documents directly from LegalOS.', color: 'text-blue-600', bg: 'bg-blue-50' },
              { icon: FileSearch, title: 'OCR Document Processing', desc: 'Extract information from uploaded legal documents automatically.', color: 'text-teal-600', bg: 'bg-teal-50' },
              { icon: FileText, title: 'e-Sign Integration', desc: 'Send documents for electronic signature directly from the platform.', color: 'text-violet-600', bg: 'bg-violet-50' },
              { icon: Receipt, title: 'GST Billing', desc: 'Generate compliant invoices and track payments effortlessly.', color: 'text-green-600', bg: 'bg-green-50' },
              { icon: Calendar, title: 'Calendar Synchronization', desc: 'Manage hearings and important dates across your team efficiently.', color: 'text-orange-500', bg: 'bg-orange-50' },
              { icon: CreditCard, title: 'Payment Gateway Support', desc: 'Collect professional fees digitally with secure payment processing.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { icon: Gavel, title: 'Future e-Courts Connectivity', desc: 'Designed for future integration with Indian court systems.', color: 'text-primary', bg: 'bg-primary/8' },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="card p-5 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-heading font-[700] text-[14px] text-ink mb-2">{title}</h3>
                <p className="text-[13px] text-ink/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRACTICE AREAS ─────────────────────────────────────────── */}
      <section className="section-padding bg-surface-alt border-y border-line">
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="eyebrow mb-4">Practice Areas</p>
            <h2 className="section-heading text-4xl mb-4">Designed Specifically For Indian Advocates</h2>
            <p className="text-[16px] text-ink/50 max-w-lg mx-auto">
              Specialized workflows, templates, and case management tools for every major area of Indian legal practice.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              'Civil Litigation',
              'Criminal Litigation',
              'Family Law',
              'Consumer Matters',
              'Property & Revenue Matters',
              'Labour & Employment Law',
              'Corporate & Commercial Law',
              'Tax Litigation',
              'DRT & SARFAESI',
              'Motor Accident Claims (MACT)',
              'Arbitration & Mediation',
              'Documentation & Registration Practice',
            ].map((area) => (
              <div key={area}
                className="bg-white border border-line rounded-xl px-4 py-3.5 flex items-center gap-2.5 hover:border-primary/30 hover:bg-primary/4 transition-all duration-150"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                <span className="text-[13px] font-[600] text-ink/65">{area}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/practice-areas" className="btn-secondary inline-flex text-[14px]">
              View All Practice Areas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ─────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="eyebrow mb-4">Pricing</p>
            <h2 className="section-heading text-4xl mb-4">Simple, Transparent Pricing</h2>
            <p className="text-[16px] text-ink/50 max-w-lg mx-auto">
              Choose the plan that fits your practice. Every plan includes a 14-day free trial — no credit card required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {[
              { name: 'Starter', tagline: 'For solo advocates', price: '₹999', period: '/month', desc: 'Everything a solo advocate needs to run a professional practice.', highlight: false },
              { name: 'Professional', tagline: 'For growing law firms', price: '₹2,499', period: '/month', desc: 'Advanced features for multi-advocate practices and growing firms.', highlight: true, badge: 'Most Popular' },
              { name: 'Enterprise', tagline: 'For large legal organizations', price: 'Custom', period: '', desc: 'Tailored solutions for large firms, corporate legal teams and institutions.', highlight: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`relative rounded-2xl border p-7 flex flex-col
                  ${plan.highlight ? 'bg-primary border-primary shadow-feature' : 'bg-white border-line shadow-card'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center bg-teal text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                      {plan.badge}
                    </span>
                  </div>
                )}
                <p className={`font-heading font-[800] text-xl mb-0.5 ${plan.highlight ? 'text-white' : 'text-ink'}`}>{plan.name}</p>
                <p className={`text-[12px] mb-5 ${plan.highlight ? 'text-white/60' : 'text-ink/40'}`}>{plan.tagline}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`font-heading font-[900] text-3xl tracking-tight ${plan.highlight ? 'text-white' : 'text-ink'}`}>{plan.price}</span>
                  {plan.period && <span className={`text-[13px] mb-1 ${plan.highlight ? 'text-white/50' : 'text-ink/40'}`}>{plan.period}</span>}
                </div>
                <p className={`text-[13px] mb-6 flex-1 leading-relaxed ${plan.highlight ? 'text-white/60' : 'text-ink/50'}`}>{plan.desc}</p>
                <Link to="/pricing"
                  className={`inline-flex items-center justify-center gap-2 font-semibold text-[14px] py-2.5 rounded-xl transition-all duration-150
                    ${plan.highlight ? 'bg-white text-primary hover:bg-white/90' : 'btn-primary'}`}
                >
                  View Plan <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-[13px] text-ink/35 mt-6">
            Annual plans available with up to 20% discount ·{' '}
            <Link to="/pricing" className="text-[#0EA5A4] hover:underline">Compare all plans</Link>
          </p>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="section-padding-sm bg-surface-alt border-y border-line">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-12">
            <p className="eyebrow mb-4">FAQ</p>
            <h2 className="section-heading text-3xl mb-3">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'What is LegalOS?', a: 'LegalOS is a comprehensive Advocate Practice Management Software developed by SOSM Services Private Limited. It is a cloud-based platform designed to automate and streamline every aspect of legal practice management for Indian advocates, law firms, and legal professionals.' },
              { q: 'Is there a free trial?', a: 'Yes — all paid plans include a 14-day free trial with no credit card required. You get full access to every feature during the trial period.' },
              { q: 'Is my data secure on LegalOS?', a: 'Yes. LegalOS implements enterprise-grade security including AES-256 encryption, role-based access control, audit logs, tenant isolation, secure document storage, and automated daily backups.' },
              { q: 'Which languages does LegalOS support?', a: 'LegalOS currently supports English, Marathi, Hindi, and Gujarati. You can draft legal documents, notices, and templates in all four languages.' },
              { q: 'Can I upgrade or downgrade my plan?', a: 'Absolutely. You can upgrade immediately (prorated) or downgrade at the next billing cycle. Annual plans also offer up to 20% savings over monthly billing.' },
            ].map(({ q, a }) => <HomeFAQItem key={q} q={q} a={a} />)}
          </div>
          <div className="text-center mt-8">
            <Link to="/faq" className="btn-secondary inline-flex text-[14px]">
              View all FAQs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="max-w-3xl mx-auto text-center">
            <p className="eyebrow mb-4">Get Started Today</p>
            <h2 className="display-heading text-4xl lg:text-5xl mb-5">
              The most professional legal platform in India.
            </h2>
            <p className="text-[18px] text-ink/50 max-w-xl mx-auto mb-10">
              Start your free trial and experience how LegalOS transforms your legal practice — no credit card required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Link to="/contact" className="btn-primary-lg">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <a href={import.meta.env.VITE_ERP_APP_URL || 'http://localhost:3000'} className="btn-secondary-lg">
                Book a Live Demo
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {['14-day free trial', 'No credit card required', 'Full feature access', 'Onboarding support'].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="text-[13px] text-ink/50">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
