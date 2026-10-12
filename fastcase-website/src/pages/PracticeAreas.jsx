import { Link } from 'react-router-dom';
import {
  Scale, Shield, Users, ShoppingCart, Car, Building2,
  Briefcase, CreditCard, MapPin, Receipt, CheckCircle,
  Award, Layers, Gavel
} from 'lucide-react';

const practiceAreas = [
  {
    icon: Scale,
    title: 'Civil Litigation',
    desc: 'Original suits, preliminary injunctions, partition disputes, and civil appellate tracking across High Courts.',
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    tags: ['Suit Tracking', 'Court Diary', 'Plaints & Written Statements'],
  },
  {
    icon: Shield,
    title: 'Criminal Defense & Trials',
    desc: 'Police FIR records, regular & anticipatory bail drafting, chargesheet analysis, and criminal writ petitions.',
    color: 'text-rose-900',
    bg: 'bg-rose-50/80',
    border: 'border-rose-100',
    tags: ['FIR Tracking', 'Bail Petitions', 'Trial Evidence Vault'],
  },
  {
    icon: Users,
    title: 'Family & Matrimonial Law',
    desc: 'Divorce petitions, mutual consent terms, maintenance claims under Sec 125 CrPC, and child custody schedules.',
    color: 'text-primary',
    bg: 'bg-emerald-50/70',
    border: 'border-emerald-100',
    tags: ['Custody Settlements', 'Confidential Vault', 'Maintenance Claims'],
  },
  {
    icon: ShoppingCart,
    title: 'Consumer Protection Law',
    desc: 'District Commission and State NCDRC complaint filings, statutory notices, and consumer hearing diaries.',
    color: 'text-amber-800',
    bg: 'bg-amber-50/80',
    border: 'border-amber-100',
    tags: ['NCDRC Complaints', 'Notice Automation', 'Limitation Alerts'],
  },
  {
    icon: Car,
    title: 'Motor Accident Claims (MACT)',
    desc: 'Tribunal compensation calculations, structured disability claims, insurance defenses, and medical record vaults.',
    color: 'text-amber-900',
    bg: 'bg-amber-50/80',
    border: 'border-amber-100',
    tags: ['MACT Calculators', 'Medical Records', 'Tribunal Diary'],
  },
  {
    icon: Building2,
    title: 'Corporate & Commercial Disputes',
    desc: 'Commercial court plaints, Section 9 & 11 arbitration filings, summary suits, and contractual compliance.',
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    tags: ['Arbitration Petitions', 'Due Diligence', 'Team Workflows'],
  },
  {
    icon: Briefcase,
    title: 'Labour & Industrial Law',
    desc: 'Industrial tribunal disputes, termination challenges, gratuity claims, and trade union conciliation records.',
    color: 'text-teal-900',
    bg: 'bg-teal-50/80',
    border: 'border-teal-100',
    tags: ['Labour Court Diary', 'Conciliation Records', 'Settlement Deeds'],
  },
  {
    icon: CreditCard,
    title: 'Banking, DRT & SARFAESI',
    desc: 'Section 13(2) demand notices, Securitisation Applications (SA), DRT recovery proceedings, and N.I. Act 138 cases.',
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    tags: ['DRT Proceedings', 'Sec 138 Cheque Bounce', 'SARFAESI Actions'],
  },
  {
    icon: MapPin,
    title: 'Revenue, Land & Tenancy',
    desc: 'RTS appeals before SDO/Collector, land acquisition objections, 7/12 mutation entries, and tenancy tribunal dates.',
    color: 'text-emerald-900',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-100',
    tags: ['Revenue Appeals', '7/12 Records', 'Acquisition Claims'],
  },
  {
    icon: Receipt,
    title: 'Direct & Indirect Tax Litigation',
    desc: 'GST show cause notices, statutory appeals before CESTAT/ITAT, assessment orders, and High Court tax writs.',
    color: 'text-emerald-900',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-100',
    tags: ['GST Show Cause', 'ITAT Appeals', 'Statutory Deadlines'],
  },
  {
    icon: Award,
    title: 'Intellectual Property Rights (IPR)',
    desc: 'Trademark & copyright applications, opposition proceedings before the Controller, and passing-off injunctions.',
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/20',
    tags: ['Trademark Opposition', 'Copyright Vault', 'Infringement Injunctions'],
  },
  {
    icon: Layers,
    title: 'Insolvency & Bankruptcy (NCLT)',
    desc: 'Section 7 & 9 IBC petitions, CIRP claims processing, moratorium tracking, and NCLAT appellate records.',
    color: 'text-slate-800',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    tags: ['NCLT Petitions', 'CIRP Claims Tracker', 'Resolution Plans'],
  },
];

export default function PracticeAreas() {
  return (
    <div className="bg-[#F8FAFC]">
      {/* ── COURT-SUITE HERO ────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #021816 0%, #013B36 55%, #074E47 100%)'
        }}
        className="pt-32 pb-20 text-white relative overflow-hidden"
      >
        {/* Subtle courtroom watermark aura */}
        <div className="absolute inset-0 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

        <div className="section-container text-center relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[12px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-5 shadow-sm">
            <Gavel className="w-3.5 h-3.5 text-amber-400" />
            Judicial Practice Domains
          </div>
          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-4">
            Tailored for Every Court & Jurisdiction
          </h1>
          <p className="text-base sm:text-lg text-slate-200/80 max-w-2xl mx-auto leading-relaxed">
            From District Court trials to High Court constitutional benches and tribunals — structured case workflows, statutory checklists, and Bar-compliant formats.
          </p>
        </div>
      </section>

      {/* ── PRACTICE AREA CARDS (Courtroom Aesthetic) ────────────────── */}
      <section className="section-padding bg-white py-16">
        <div className="section-container">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
              12 Practice Portfolios
            </span>
            <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900 mt-3">
              Specialized Advocate Workspaces
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Engineered to meet the procedural rules and evidentiary standards of Indian courts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {practiceAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div
                  key={area.title}
                  className={`card p-6 border ${area.border} bg-white hover:border-primary/40 hover:shadow-[0_12px_28px_-6px_rgba(1,59,54,0.12)] transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <div className={`w-10 h-10 ${area.bg} rounded-xl flex items-center justify-center flex-shrink-0 border border-slate-200/60 shadow-2xs`}>
                        <Icon className={`w-5 h-5 ${area.color}`} />
                      </div>
                      <h3 className="font-heading font-[700] text-[15px] text-slate-900 leading-snug">
                        {area.title}
                      </h3>
                    </div>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed mb-4">
                      {area.desc}
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {area.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200/80"
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
    </div>
  );
}
