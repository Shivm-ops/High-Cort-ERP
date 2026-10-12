import { Link } from 'react-router-dom';
import {
  Users, Scale, FileText, Zap, MessageSquare, FolderOpen, ClipboardList,
  Calendar, Gavel, Package, BookOpen, Search, CreditCard, Monitor,
  Bell, Globe, ArrowRight, CheckCircle
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

const features = [
  {
    id: 1, icon: Users, title: 'Client Management',
    color: 'text-blue-600', bg: 'bg-blue-50',
    desc: 'Centralized client directory with KYC records and case history.',
    items: ['Client CRM & Profiles', 'KYC Document Vault'],
  },
  {
    id: 2, icon: Scale, title: 'Case Management',
    color: 'text-violet-600', bg: 'bg-violet-50',
    desc: 'End-to-end matter tracking across all active litigation courts.',
    items: ['Case Lifecycle Tracking', 'Court Diary & Cause Lists'],
  },
  {
    id: 3, icon: FileText, title: 'Draft Library',
    color: 'text-teal-600', bg: 'bg-teal-50',
    desc: '500+ verified legal templates for notices, writs, and petitions.',
    items: ['500+ Verified Templates', 'Multi-Language Support'],
  },
  {
    id: 4, icon: Zap, title: 'Auto-Populate Drafts',
    color: 'text-amber-600', bg: 'bg-amber-50',
    desc: 'Generate court-ready documents in one click using client data.',
    items: ['Instant 1-Click Auto-Fill', 'Word & PDF Export'],
  },
  {
    id: 5, icon: MessageSquare, title: 'Notice & Reply Studio',
    color: 'text-orange-600', bg: 'bg-orange-50',
    desc: 'OCR scan notices and draft professional replies 5x faster.',
    items: ['OCR Scan Extraction', 'Dispatch Tracking'],
  },
  {
    id: 6, icon: FolderOpen, title: 'Evidence Vault',
    color: 'text-emerald-600', bg: 'bg-emerald-50',
    desc: 'Bank-grade encrypted storage for case files and evidence.',
    items: ['Matter-Wise Storage', 'In-Browser File Preview'],
  },
  {
    id: 7, icon: ClipboardList, title: 'Team Coordination',
    color: 'text-cyan-600', bg: 'bg-cyan-50',
    desc: 'Delegate tasks, set deadlines, and track advocate workloads.',
    items: ['Task Delegation & Alerts', 'Role-Based Permissions'],
  },
  {
    id: 8, icon: Calendar, title: 'Hearing Diary',
    color: 'text-pink-600', bg: 'bg-pink-50',
    desc: 'Smart court calendar with daily cause lists and alert reminders.',
    items: ['Automated Court Alerts', 'Daily Cause List Sync'],
  },
  {
    id: 9, icon: Gavel, title: 'Court Orders',
    color: 'text-red-600', bg: 'bg-red-50',
    desc: 'Organize interim orders with automated compliance tracking.',
    items: ['Order Repository', 'Compliance Deadlines'],
  },
  {
    id: 10, icon: Package, title: 'E-Filing Workspace',
    color: 'text-lime-600', bg: 'bg-lime-50',
    desc: 'Prepare neat filing bundles with automated index sheets.',
    items: ['Filing Bundle Generator', 'Pre-Filing Checklists'],
  },
  {
    id: 11, icon: BookOpen, title: 'Case Law Vault',
    color: 'text-emerald-600', bg: 'bg-emerald-50',
    desc: 'Save and tag winning judgments and citations for court briefs.',
    items: ['Searchable Judgments', 'Citation Cross-Referencing'],
  },
  {
    id: 12, icon: Search, title: 'Legal Research',
    color: 'text-sky-600', bg: 'bg-sky-50',
    desc: 'Build strong arguments with structured research notes.',
    items: ['Research Notes Studio', 'Matter-Linked Citations'],
  },
  {
    id: 13, icon: CreditCard, title: 'GST Billing & Invoicing',
    color: 'text-green-600', bg: 'bg-green-50',
    desc: 'GST-compliant legal fee invoices and payment tracking.',
    items: ['GST Tax Invoices', 'Receivables Ledger'],
  },
  {
    id: 14, icon: Monitor, title: 'Client Portal',
    color: 'text-[#0F4C81]', bg: 'bg-[#0F4C81]/6',
    desc: 'Transparent client portal for case updates, orders, and bills.',
    items: ['Real-Time Case Status', 'Direct Document Access'],
  },
  {
    id: 15, icon: Bell, title: 'WhatsApp Alerts',
    color: 'text-green-600', bg: 'bg-green-50',
    desc: 'Instant WhatsApp updates for hearing dates and payment receipts.',
    items: ['Automated Hearing Alerts', 'Payment Acknowledgments'],
  },
  {
    id: 16, icon: Globe, title: 'Regional Languages',
    color: 'text-blue-600', bg: 'bg-blue-50',
    desc: 'Work in your court language: English, Marathi, Hindi, Gujarati.',
    items: ['4 Regional Languages', 'Vernacular Formats'],
  },
];

export default function Features() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-16">
        <div className="section-container text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-white text-[12px] font-[700] tracking-wider uppercase px-4 py-1.5 rounded-full mb-5">
            Core Features
          </span>
          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-4">
            Everything Your Legal Practice Needs
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto">
            16 deeply integrated modules designed specifically for Indian advocates and law firms.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.id} className="card p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${f.color}`} />
                      </div>
                      <span className="text-[11px] font-bold text-ink/20">
                        #{f.id.toString().padStart(2, '0')}
                      </span>
                    </div>

                    <h3 className="font-heading font-[700] text-[15px] text-ink mb-1.5 leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-[12px] text-ink/55 leading-relaxed mb-3">
                      {f.desc}
                    </p>
                  </div>

                  <ul className="space-y-1.5 pt-3 border-t border-line">
                    {f.items.map((item) => (
                      <li key={item} className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                        <span className="text-[11px] font-medium text-ink/70">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

