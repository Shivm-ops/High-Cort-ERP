import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Scale, FileText, Calendar, CreditCard, Search,
  ArrowRight, CheckCircle, ShieldCheck
} from 'lucide-react';

const showcasePillars = [
  {
    id: 'client',
    title: 'Client Management',
    tag: 'CRM & Client KYC Vault',
    desc: 'Centralized advocate CRM. Organize corporate and individual clients, store encrypted Aadhaar/PAN KYC documents, and track complete multi-matter history.',
    image: '/screenshots/dashboard.webp',
    bullets: [
      'Comprehensive KYC vault with encrypted document storage',
      'Client communication history & WhatsApp alert logs',
      'Instant client intake forms with matter linking',
    ],
  },
  {
    id: 'case',
    title: 'Case & Matter Tracking',
    tag: 'Matter Lifecycle & CNR',
    desc: 'Track litigations across Supreme Court, High Courts, District Benches, and Tribunals with automated CNR lookup and daily cause list synchronization.',
    image: '/screenshots/case-management.webp',
    bullets: [
      'Automated CNR sync across eCourts & High Court portals',
      'Comprehensive matter stages: filing, evidence, arguments, orders',
      'Pre-filing readiness checklists & document bundles',
    ],
  },
  {
    id: 'hearing',
    title: 'Hearing Management',
    tag: 'Command Center & Cause Lists',
    desc: 'Never miss a court appearance. Interactive hearing diary automatically cross-references daily cause lists and alerts your team of upcoming dates and limitation deadlines.',
    image: '/screenshots/hearing-prep.webp',
    bullets: [
      'Daily court diary & automated cause list integration',
      'Limitation period countdown alerts & filing deadlines',
      'Multi-bench court room and presiding judge tracking',
    ],
  },
  {
    id: 'draft',
    title: 'Draft Automation',
    tag: '500+ Verified Templates',
    desc: 'Accelerate drafting by 5x. Access 500+ Bar-compliant templates for plaints, written statements, writs, notices, and bail applications with 1-click client data auto-population.',
    image: '/screenshots/draft-workspace.png',
    bullets: [
      '500+ verified Indian court templates & vernacular formats',
      '1-click auto-population with client & matter metadata',
      'Instant export to editable Word (.docx) and indexed PDF',
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Invoicing',
    tag: 'GST Invoices & Fee Ledger',
    desc: 'Complete financial transparency. Generate GST-compliant fee bills, record hearing appearance fees, track client advance retainers, and issue automated payment receipts.',
    image: '/screenshots/billing-invoicing.png',
    bullets: [
      'GST tax invoices with SAC 9982 legal service codes',
      'Matter-wise fee, expense, and advance retainer ledger',
      'Automated payment acknowledgments via WhatsApp',
    ],
  },
  {
    id: 'research',
    title: 'Legal Research',
    tag: 'AI Judgments & Citations',
    desc: 'Supercharge your legal strategy. Search Supreme Court and High Court citations, cross-reference statutory bare acts, and compile citation briefs directly inside case folders.',
    image: '/screenshots/legal-research.png',
    bullets: [
      'Instant citation search across landmark judgments',
      'Direct statutory bare acts & section cross-referencing',
      'Matter-linked research notes and argument binders',
    ],
  },
];

// Clean, essential core blocks - without image clutter
const importantBlocks = [
  {
    id: 1,
    icon: Users,
    title: 'Client Management & CRM',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    badge: 'CRM & KYC',
    desc: 'Centralized client directory with automated KYC records, Aadhaar/PAN vaults, and comprehensive client case history.',
    items: ['Client CRM & Profiles', 'KYC Document Vault', 'Client Intake Studio'],
  },
  {
    id: 2,
    icon: Scale,
    title: 'Case & Matter Tracking',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    badge: 'Litigation',
    desc: 'End-to-end matter lifecycle tracking across all active litigation courts with automated CNR syncing and case diaries.',
    items: ['Case Lifecycle Tracking', 'CNR eCourts Sync', 'Pre-Filing Checklists'],
  },
  {
    id: 3,
    icon: Calendar,
    title: 'Hearing Diary & Calendar',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    badge: 'Court Diary',
    desc: 'Smart court calendar with daily cause lists, limitation dates countdown, and automatic WhatsApp/SMS court alerts.',
    items: ['Daily Cause List Sync', 'Automated Hearing Alerts', 'Limitation Reminders'],
  },
  {
    id: 4,
    icon: FileText,
    title: 'Draft Automation & Library',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    badge: 'Automation',
    desc: '500+ verified legal templates for notices, plaints, and petitions with 1-click client metadata auto-population.',
    items: ['500+ Verified Templates', '1-Click Auto-Fill', 'Word & PDF Export'],
  },
  {
    id: 5,
    icon: CreditCard,
    title: 'GST Billing & Invoicing',
    color: 'text-green-600',
    bg: 'bg-green-50',
    badge: 'Finance',
    desc: 'GST-compliant legal tax invoices (SAC 9982), fee ledgers, advance trust retainers, and automated payment receipts.',
    items: ['GST Tax Invoices', 'Receivables Ledger', 'Advance Retainers'],
  },
  {
    id: 6,
    icon: Search,
    title: 'Legal Research & Case Law',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    badge: 'Research',
    desc: 'Search landmark High Court & Supreme Court citations, bare acts cross-referencing, and structured research briefs.',
    items: ['Searchable Judgments', 'Bare Acts Linking', 'Research Studio'],
  },
];

export default function Features() {
  const [activeTab, setActiveTab] = useState(showcasePillars[0].id);
  const currentPillar = showcasePillars.find(p => p.id === activeTab) || showcasePillars[0];

  return (
    <div className="bg-surface">
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-16">
        <div className="section-container text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-white text-[12px] font-[700] tracking-wider uppercase px-4 py-1.5 rounded-full mb-4">
            Platform Capabilities
          </span>
          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-4">
            Everything Your Legal Practice Needs
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto">
            Essential litigation management modules designed specifically for Indian advocates and law chambers.
          </p>
        </div>
      </section>

      {/* Interactive Platform Showcase */}
      <section className="py-12 bg-slate-50 border-b border-line">
        <div className="section-container">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Interactive Platform Showcase
            </span>
            <h2 className="font-heading font-[800] text-2xl md:text-3xl text-ink mt-3">
              Explore The Advocate Workspace
            </h2>
            <p className="text-sm text-ink/60 mt-1.5">
              Select any core pillar below to preview its live operational workflow.
            </p>
          </div>

          {/* Module Selector Pills */}
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8">
            {showcasePillars.map((p) => {
              const isActive = activeTab === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(p.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 border flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-ink/70 border-line hover:border-primary/40 hover:text-ink'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-400' : 'bg-slate-300'}`} />
                  {p.title}
                </button>
              );
            })}
          </div>

          {/* Active Module Showcase Card */}
          <div className="bg-white rounded-2xl border border-line shadow-card overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Detail (5 cols) */}
              <div className="lg:col-span-5 p-6 md:p-8 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-line bg-gradient-to-b from-white to-slate-50/50">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {currentPillar.tag}
                  </span>
                  <h3 className="font-heading font-[800] text-2xl text-ink tracking-tight mb-2">
                    {currentPillar.title}
                  </h3>
                  <p className="text-sm text-ink/65 leading-relaxed mb-6">
                    {currentPillar.desc}
                  </p>

                  <div className="space-y-3 pt-4 border-t border-line">
                    <p className="text-[11px] font-bold text-ink/40 uppercase tracking-wider">Key Capabilities</p>
                    {currentPillar.bullets.map((b, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-[13px] font-medium text-ink/80 leading-snug">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Screenshot Showcase (7 cols) */}
              <div className="lg:col-span-7 bg-slate-900 p-4 sm:p-6 flex items-center justify-center">
                <div className="relative w-full rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 bg-slate-950 group">
                  <img
                    src={currentPillar.image}
                    alt={currentPillar.title}
                    className="w-full h-auto object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-white text-[10px] font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Fastcase Workspace · Real-Time View
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Important Blocks (Clean 6 Cards, No Card Images) */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[11px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              Core Architecture
            </span>
            <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-ink mt-3">
              Essential Practice Pillars
            </h2>
            <p className="text-sm text-ink/55 mt-1.5">
              Everything required to manage litigations, client relationships, and court compliance smoothly.
            </p>
          </div>

          {/* Clean 6-Card Grid without image clutter */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {importantBlocks.map((b) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.id}
                  className="card p-6 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between border border-line bg-white"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-11 h-11 ${b.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs`}>
                        <Icon className={`w-5 h-5 ${b.color}`} />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-ink/60 border border-slate-200 uppercase tracking-wider">
                        {b.badge}
                      </span>
                    </div>

                    <h3 className="font-heading font-[700] text-[16px] text-ink mb-2 leading-snug">
                      {b.title}
                    </h3>
                    <p className="text-[13px] text-ink/60 leading-relaxed mb-4">
                      {b.desc}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-4 border-t border-line">
                    {b.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[12px] font-medium text-ink/75">{item}</span>
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
