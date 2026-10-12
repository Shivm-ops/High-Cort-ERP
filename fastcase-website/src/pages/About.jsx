import { Link } from 'react-router-dom';
import {
  Scale, Target, Eye, MapPin, CheckCircle,
  Building2, Award, Shield, Users, Server, Globe2, FileText, Phone, Mail,
  Sparkles, CheckCircle2, Milestone, Lock
} from 'lucide-react';

const team = [
  {
    initials: 'AP',
    name: 'Abhijit Patil',
    role: 'Founder & Product Architect',
    badges: ['Forensic Analytics', 'ACFE (USA)', 'SEBI Reg. Analyst'],
    bio: 'Brings deep financial analytics, statutory rigor, and technology architecture to modernize daily advocate practice.',
  },
  {
    initials: 'BP',
    name: 'Bhupal Pujari',
    role: 'Director & Corporate Governance',
    company: 'SOSM Services Pvt Ltd',
    badges: ['Corporate Law', 'Institutional Operations'],
    bio: 'Oversees statutory compliance, enterprise governance, and institutional legal partnerships across Maharashtra and India.',
  },
  {
    initials: 'PP',
    name: 'Priyankka Patil',
    role: 'Head of Client Success',
    badges: ['Firm Onboarding', 'Advocate Workflows'],
    bio: 'Spearheads law firm onboarding, advocate workflow optimization, and continuous product feedback loops.',
  },
  {
    initials: 'SJ',
    name: 'Shweta Jadhav',
    role: 'Lead DevOps & Cloud Systems',
    badges: ['Cloud Infrastructure', 'Cybersecurity'],
    bio: 'Architects secure containerized deployments, automated backups, and 99.9% platform availability across Indian cloud datacenters.',
  },
];

const pillars = [
  {
    icon: Shield,
    title: 'Attorney-Client Privilege',
    desc: 'Section 126 of the Indian Evidence Act compliant data confidentiality with multi-tenant encryption isolating all case records and client files.',
  },
  {
    icon: Server,
    title: '100% Indian Data Sovereignty',
    desc: 'All court data, briefs, and client vaults reside exclusively in certified tier-4 datacenters within Indian borders (Mumbai & Bengaluru).',
  },
  {
    icon: Globe2,
    title: 'Vernacular Judicial Access',
    desc: 'Deep multi-language support (English, Marathi, Hindi, Gujarati) enabling advocates to draft fluently in their court language.',
  },
  {
    icon: Scale,
    title: 'Bar Council Alignment',
    desc: 'Engineered as practice-enhancement software adhering strictly to professional ethics and Bar Council of India standards.',
  },
];

const milestones = [
  {
    year: '2024',
    title: 'Incorporation & Foundation',
    desc: 'SOSM Services Private Limited incorporated in Kolhapur, Maharashtra with a dedicated mission to digitize advocate operations.',
  },
  {
    year: '2024',
    title: 'Multi-Court Architecture',
    desc: 'Engineered High Court and District Court cause list tracking and limitation timeline calculators.',
  },
  {
    year: '2025',
    title: 'Vernacular Legal Drafting',
    desc: 'Digitized 500+ regional legal drafts across English, Marathi, Hindi, and Gujarati with 1-click matter auto-fill.',
  },
  {
    year: '2026',
    title: 'Sovereign Cloud Deployment',
    desc: 'Enterprise-grade cloud infrastructure launched with automated encryption, daily backups, and 99.9% uptime SLA.',
  },
];

export default function About() {
  return (
    <div className="bg-[#F8FAFC]">
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(135deg, #071626 0%, #0D2644 55%, #153B64 100%)'
        }}
        className="pt-28 pb-20 text-white relative overflow-hidden"
      >
        <div className="section-container text-center max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[12px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-6 shadow-sm">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            Institutional Profile
          </div>
          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight mb-5 text-white">
            Engineering the Digital Backbone for Indian Legal Practice
          </h1>
          <p className="text-base sm:text-lg text-slate-200/80 leading-relaxed max-w-2xl mx-auto">
            Developed by SOSM Services Private Limited in Kolhapur, Maharashtra, Fastcase replaces cumbersome paper registers and manual diaries with a high-performance legal operating platform.
          </p>
        </div>
      </section>

      {/* ── MISSION & VISION ───────────────────────────────────────── */}
      <section className="section-padding py-16 bg-[#F8FAFC]">
        <div className="section-container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0F4C81] flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="font-heading font-[800] text-2xl text-slate-900 mb-3">Our Mission</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                To equip every advocate in India — from solo practitioners at district courts to multi-partner litigation firms at High Courts — with enterprise-grade legal technology that automates case tracking, eliminates missed hearings, and streamlines professional fee collections.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Eye className="w-6 h-6" />
              </div>
              <h2 className="font-heading font-[800] text-2xl text-slate-900 mb-3">Our Vision</h2>
              <p className="text-slate-600 text-[14px] leading-relaxed">
                A digitally unified Indian judicial ecosystem where legal professionals save hours on administrative paperwork each day, enabling them to focus on courtroom advocacy, research, and delivering transparent, prompt justice to their clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS ───────────────────────────────────────────── */}
      <section className="section-padding py-16 bg-white border-y border-slate-200">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Our Foundation</p>
            <h2 className="font-heading font-[800] text-3xl text-slate-900">Built on Trust & Professional Ethics</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2">
              Designed around the statutory realities and ethical codes of the Indian legal fraternity.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-white text-[#0F4C81] border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-[700] text-base text-slate-900 mb-2">{p.title}</h3>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PLATFORM MILESTONES ────────────────────────────────────── */}
      <section className="section-padding py-16 bg-[#F8FAFC]">
        <div className="section-container max-w-4xl">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Our Evolution</p>
            <h2 className="font-heading font-[800] text-3xl text-slate-900">Platform Milestones</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {milestones.map((m) => (
              <div key={m.title} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="px-3 py-1.5 rounded-xl bg-[#0F4C81]/10 text-[#0F4C81] font-heading font-[900] text-sm flex-shrink-0">
                  {m.year}
                </div>
                <div>
                  <h3 className="font-heading font-[800] text-base text-slate-900 mb-1">{m.title}</h3>
                  <p className="text-[13px] text-slate-600 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LEADERSHIP TEAM ────────────────────────────────────────── */}
      <section className="section-padding py-16 bg-white border-t border-slate-200">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="eyebrow mb-2">Leadership & Technology</p>
            <h2 className="font-heading font-[800] text-3xl text-slate-900">The Minds Behind Fastcase</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto mt-2">
              Combining forensic analytics, operational legal acumen, and high-reliability cloud architecture.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m) => (
              <div key={m.name} className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200">
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F4C81] to-[#1E4E7C] text-white flex items-center justify-center font-bold text-sm shadow-md flex-shrink-0">
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-[800] text-[15px] text-slate-900 leading-snug truncate">{m.name}</p>
                      <p className="text-[11px] font-semibold text-[#0EA5A4] uppercase tracking-wide mt-0.5">{m.role}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-slate-600 leading-relaxed mb-4">{m.bio}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-200">
                  {m.badges.map((b) => (
                    <span key={b} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATUTORY CORPORATE REGISTRATION ───────────────────────── */}
      <section className="section-padding py-16 bg-[#F8FAFC] border-t border-slate-200">
        <div className="section-container max-w-4xl">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#0F4C81] text-white rounded-2xl flex items-center justify-center shadow-md">
                  <Building2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-heading font-[800] text-xl text-slate-900">SOSM Services Private Limited</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Incorporated under Companies Act, 2013 · Ministry of Corporate Affairs, India</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Active & Verified Entity
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Corporate Office</p>
                <div className="flex items-start gap-2.5 text-slate-700 text-sm leading-relaxed">
                  <MapPin className="w-4 h-4 text-[#0EA5A4] flex-shrink-0 mt-1" />
                  <address className="not-italic">
                    B4/5, Omkar Plaza, Rajaram Road,<br />
                    Near ICICI Bank, E Ward, Shahupuri,<br />
                    Kolhapur – 416001, Maharashtra, India
                  </address>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Statutory Identifiers</p>
                <div className="space-y-1.5 text-sm text-slate-700">
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">CIN</span>
                    <span className="font-mono font-semibold text-xs text-slate-800">U70200PN2024PTC236589</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 text-xs">GSTIN</span>
                    <span className="font-mono font-semibold text-xs text-slate-800">27ABOCS9037R1Z6</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-500 text-xs">Jurisdiction</span>
                    <span className="font-semibold text-xs text-slate-800">Kolhapur & Bombay High Court</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-4">
                <a href="mailto:contact@fastcase.in" className="flex items-center gap-1.5 hover:text-[#0F4C81] transition-colors">
                  <Mail className="w-3.5 h-3.5 text-[#0EA5A4]" /> contact@fastcase.in
                </a>
                <a href="tel:+919405669420" className="flex items-center gap-1.5 hover:text-[#0F4C81] transition-colors">
                  <Phone className="w-3.5 h-3.5 text-[#0EA5A4]" /> +91 94056 69420
                </a>
              </div>
              <span>Fastcase Platform by SOSM Services Pvt Ltd</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
