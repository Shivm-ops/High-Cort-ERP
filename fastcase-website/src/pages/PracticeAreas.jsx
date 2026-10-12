import { Link } from 'react-router-dom';
import {
  Scale, Shield, Users, ShoppingCart, Car, Building2,
  Briefcase, CreditCard, MapPin, Receipt, CheckCircle,
  ArrowRight, Award, Layers
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

const practiceAreas = [
  {
    icon: Scale,
    title: 'Civil Litigation',
    desc: 'Suits, injunctions, partition disputes, and appeal tracking.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    tags: ['Suit Tracking', 'Court Diary', 'Draft Templates'],
  },
  {
    icon: Shield,
    title: 'Criminal Law',
    desc: 'FIR records, bail drafting, charge sheets, and evidence vault.',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    tags: ['FIR Tracking', 'Bail Petitions', 'Evidence Vault'],
  },
  {
    icon: Users,
    title: 'Family Law',
    desc: 'Divorce petitions, maintenance claims, and custody settlements.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    tags: ['Custody Claims', 'Confidential Vault', 'Settlement Records'],
  },
  {
    icon: ShoppingCart,
    title: 'Consumer Law',
    desc: 'Consumer forum complaints, legal notices, and hearing diary.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    tags: ['Forum Complaints', 'Notice Automation', 'Limitation Alerts'],
  },
  {
    icon: Car,
    title: 'Motor Accident (MACT)',
    desc: 'Tribunal claims, medical records, and compensation calculators.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    tags: ['MACT Calculators', 'Medical Vault', 'Tribunal Diary'],
  },
  {
    icon: Building2,
    title: 'Corporate & Commercial',
    desc: 'Contracts, commercial arbitration, company disputes, and compliance.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    tags: ['Arbitration', 'Due Diligence', 'Team Workflows'],
  },
  {
    icon: Briefcase,
    title: 'Labour & Employment',
    desc: 'Industrial disputes, employee claims, and labour court hearings.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    tags: ['Labour Diary', 'Notice Studio', 'Settlement Records'],
  },
  {
    icon: CreditCard,
    title: 'Banking & Finance',
    desc: 'SARFAESI actions, DRT proceedings, and loan recovery tracking.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    tags: ['SARFAESI & DRT', 'Notice Automation', 'Recovery Ledgers'],
  },
  {
    icon: MapPin,
    title: 'Revenue & Land Matters',
    desc: 'Mutation entries, land acquisition cases, and revenue appeals.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    tags: ['Revenue Appeals', 'Property Records', 'Hearing Calendar'],
  },
  {
    icon: Receipt,
    title: 'Tax Litigation',
    desc: 'GST disputes, income tax appeals, assessments, and tribunal dates.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    tags: ['GST Cases', 'Tax Appeals', 'Statutory Deadlines'],
  },
  {
    icon: Award,
    title: 'Intellectual Property (IPR)',
    desc: 'Trademark filings, copyright matters, oppositions, and infringement.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    tags: ['Trademarks', 'Opposition Filings', 'Infringement Actions'],
  },
  {
    icon: Layers,
    title: 'Insolvency & Bankruptcy (NCLT)',
    desc: 'CIRP proceedings, NCLT applications, and creditor claim tracking.',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    tags: ['CIRP & NCLT Diary', 'Resolution Plans', 'Creditor Vault'],
  },
];

export default function PracticeAreas() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-16">
        <div className="section-container text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-white text-[12px] font-[700] tracking-wider uppercase px-4 py-1.5 rounded-full mb-5">
            Practice Areas
          </span>
          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-4">
            Tailored for Every Area of Indian Law
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto">
            Specialized court tracking, templates, and evidence management built for your specific domain.
          </p>
        </div>
      </section>

      {/* Practice Area Cards */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {practiceAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div
                  key={area.title}
                  className={`card p-5 border ${area.border} hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 ${area.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${area.color}`} />
                      </div>
                      <h3 className="font-heading font-[700] text-[15px] text-ink leading-snug">
                        {area.title}
                      </h3>
                    </div>
                    <p className="text-[12px] text-ink/55 leading-relaxed mb-4">
                      {area.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-line flex flex-wrap gap-1.5">
                    {area.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-surface text-ink/70 border border-line"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-12 bg-surface-alt border-y border-line">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: '12+', label: 'Practice Areas' },
              { stat: '16', label: 'Integrated Modules' },
              { stat: '4', label: 'Court Languages' },
              { stat: '99.9%', label: 'Cloud Uptime' },
            ].map((c) => (
              <div key={c.label}>
                <p className="font-heading font-[900] text-3xl sm:text-4xl text-[#0F4C81] tracking-tight mb-1">{c.stat}</p>
                <p className="font-medium text-[13px] text-ink/60">{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

