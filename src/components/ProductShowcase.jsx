import { useState } from 'react';
import {
  LayoutDashboard, Briefcase, Calendar, BarChart2, Gavel,
} from 'lucide-react';

const tabs = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    headline: 'Your Entire Legal Practice at a Glance',
    desc: 'One unified operations dashboard showing today\'s critical items — hearings, urgent filings, limitation alerts, pending affidavits — plus matter pipeline, notice management, recent activity, and quick actions the moment you log in.',
    img: '/screenshots/dashboard.png',
    color: 'text-primary',
    bg: 'bg-primary/8',
    accent: '#0F4C81',
  },
  {
    id: 'case',
    icon: Briefcase,
    label: 'Case Management',
    headline: 'Every Detail of Every Matter, Organized',
    desc: 'Full case lifecycle management — case overview, client summary, filing readiness score with missing document alerts, matter progress, hearings timeline, and integrated tabs for documents, evidence, drafts, court orders, and billing.',
    img: '/screenshots/case-management.png',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    accent: '#7C3AED',
  },
  {
    id: 'hearing',
    icon: Calendar,
    label: 'Hearings & Calendar',
    headline: 'Full Command of Your Court Calendar',
    desc: 'Hearing Command Center shows today\'s, this week\'s, and all upcoming hearings in one view. Browse your cause list by date, schedule new hearings, and stay on top of upcoming deadlines and filing dates — all in real time.',
    img: '/screenshots/hearing-prep.png',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    accent: '#F97316',
  },
  {
    id: 'practice',
    icon: BarChart2,
    label: 'Practice Areas',
    headline: 'Monitor Revenue & Cases by Domain',
    desc: 'Practice Area Dashboard gives you 84+ cases tracked across Criminal Law, Civil Law, Property Law, GST & Taxation, Family Law, MACT and more — with active cases, upcoming hearings, closed matters, and revenue per domain in one view.',
    img: '/screenshots/practice-areas.png',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    accent: '#059669',
  },
  {
    id: 'court',
    icon: Gavel,
    label: 'Court Management',
    headline: 'All Your Courts Managed in One Place',
    desc: 'Court Dashboard tracks active cases across Supreme Court, High Courts, District Courts and tribunals simultaneously — with pending orders, pending filings, cause lists, presiding judge details, and quick actions per court.',
    img: '/screenshots/court-management.png',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    accent: '#E11D48',
  },
];

export default function ProductShowcase() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <section className="section-padding bg-white">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="eyebrow mb-4">Product Screenshots</p>
          <h2 className="section-heading text-4xl lg:text-5xl mb-4">
            See LegalOS in Action
          </h2>
          <p className="text-[17px] text-ink/50 max-w-xl mx-auto">
            A purpose-built legal operating system — explore the platform that advocates and law firms across India use to run their entire practice.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            const isActive = i === active;
            return (
              <button
                key={t.id}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-[600] transition-all duration-150
                  ${isActive
                    ? `${t.bg} ${t.color} border-2 shadow-sm`
                    : 'bg-surface border-2 border-transparent text-ink/50 hover:text-ink/80 hover:bg-surface-alt'
                  }`}
                style={isActive ? { borderColor: t.accent + '40' } : {}}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-5 gap-10 items-start">
          {/* Left: description */}
          <div className="lg:col-span-2 lg:pt-4">
            <div className={`inline-flex items-center gap-2 ${tab.bg} ${tab.color} text-[11px] font-[700] uppercase tracking-[0.08em] px-3 py-1.5 rounded-full mb-5`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </div>
            <h3 className="font-heading font-[800] text-[22px] text-ink tracking-tight leading-snug mb-4">
              {tab.headline}
            </h3>
            <p className="text-[15px] text-ink/55 leading-relaxed mb-8">
              {tab.desc}
            </p>
            {/* Feature dots */}
            <div className="space-y-3">
              {getFeaturesForTab(tab.id).map((f) => (
                <div key={f} className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0`} style={{ backgroundColor: tab.accent }} />
                  <span className="text-[14px] text-ink/65">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: screenshot */}
          <div className="lg:col-span-3">
            <div className="relative">
              {/* Glow */}
              <div
                className="absolute -inset-4 rounded-3xl opacity-10 blur-2xl"
                style={{ backgroundColor: tab.accent }}
              />
              {/* Browser chrome frame */}
              <div className="relative bg-white rounded-2xl overflow-hidden border border-line shadow-[0_20px_60px_-10px_rgba(15,23,42,0.15),0_4px_16px_-4px_rgba(15,23,42,0.08)]">
                {/* Browser top bar */}
                <div className="bg-[#F1F3F5] border-b border-line px-4 py-2.5 flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400/70" />
                    <div className="w-3 h-3 rounded-full bg-amber-400/70" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
                  </div>
                  <div className="flex-1 bg-white border border-line rounded-md px-3 py-1 flex items-center gap-1.5 text-[11px] text-ink/30 max-w-[240px] mx-auto">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                    app.legalos.in
                  </div>
                </div>
                {/* Screenshot */}
                <img
                  src={tab.img}
                  alt={`LegalOS ${tab.label}`}
                  className="w-full block"
                  style={{ aspectRatio: '16/9', objectFit: 'cover', objectPosition: 'top' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                {/* Fallback placeholder */}
                <div
                  className="w-full items-center justify-center bg-surface-alt"
                  style={{ aspectRatio: '16/9', display: 'none' }}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 ${tab.bg} rounded-2xl flex items-center justify-center mx-auto mb-3`}>
                      <tab.icon className={`w-8 h-8 ${tab.color}`} />
                    </div>
                    <p className="text-[13px] text-ink/40 font-medium">{tab.label} screenshot</p>
                    <p className="text-[11px] text-ink/25 mt-1">Place image at public/screenshots/{tab.id === 'case' ? 'case-management' : tab.id === 'hearing' ? 'hearing-prep' : tab.id === 'practice' ? 'practice-areas' : tab.id === 'court' ? 'court-management' : 'dashboard'}.png</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getFeaturesForTab(id) {
  const map = {
    dashboard: [
      "Today's hearings, urgent filings, limitation alerts, and pending affidavits",
      'Matter pipeline: Active, Drafting, Evidence, Argument, Appeal stages',
      'Quick actions: New Client, New Matter, Upload Notice, Generate Invoice',
      'Recent activity feed and limitation alerts with days remaining',
    ],
    case: [
      'Case details: court, case number, practice area, stage, priority',
      'Filing readiness score with itemised missing-document checklist',
      'Matter progress: documents, evidence, drafts, and hearings scheduled',
      'Tabs for Hearings, Timeline, Parties, Documents, Evidence, Court Orders, Billing',
    ],
    hearing: [
      "Today's, this week's, and total upcoming hearings at a glance",
      'Date-wise cause list — browse any date on the built-in calendar',
      'Upcoming deadlines panel with filing and drafting due dates',
      'Schedule hearings directly from the command center',
    ],
    practice: [
      '84 total cases, 53 active, 31 closed, ₹18.1L revenue YTD',
      'Per-domain view: Criminal Law, Civil Law, Property Law, Family Law',
      'Active cases, upcoming hearings, and revenue per practice area',
      'GST & Taxation, MACT, and more — all domains in one dashboard',
    ],
    court: [
      '32 active cases tracked across all courts simultaneously',
      'Supreme Court, High Court, and District Court dashboards',
      'Pending orders, pending filings, and matters listed today',
      'Quick actions per court: Add Hearing, Cause List, Upload Order',
    ],
  };
  return map[id] || [];
}
