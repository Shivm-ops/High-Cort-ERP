import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Briefcase, Scale, Lock, CheckCircle2, ChevronDown, ShieldCheck, Languages, FileText,
} from 'lucide-react';
import {
  appLinks, erpHighlights, consumerTools, consumerCategories, consumerSteps,
} from '../data/site';

/* ─── Product card used in the hero ─────────────────────────────────── */
function ProductCard({ variant, eyebrow, title, desc, points, primary, secondary }) {
  const isConsumer = variant === 'consumer';
  const Icon = isConsumer ? Scale : Briefcase;
  return (
    <div className="group relative flex flex-col bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] hover:shadow-[0_18px_40px_-14px_rgba(1,59,54,0.22)] hover:border-[#059669]/40 transition-all duration-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isConsumer ? 'bg-[#059669] text-white' : 'bg-[#013B36] text-[#34D399]'}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#059669]">{eyebrow}</p>
          <h2 className="font-heading font-[800] text-xl text-slate-900 leading-tight">{title}</h2>
        </div>
      </div>
      <p className="text-[14px] text-slate-600 leading-relaxed mb-4">{desc}</p>
      <ul className="space-y-2 mb-6">
        {points.map((p) => (
          <li key={p} className="flex items-start gap-2 text-[13.5px] text-slate-700">
            <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-2">
        <Link to={primary.to} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#013B36] hover:bg-[#024E47] text-white text-[13px] font-bold transition">
          {primary.label} <ArrowRight className="w-4 h-4 text-[#34D399]" />
        </Link>
        <a href={secondary.href} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:border-[#059669]/50 text-[13px] font-semibold transition">
          {secondary.icon} {secondary.label}
        </a>
      </div>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-[14.5px] font-semibold text-slate-900">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">{a}</p>}
    </div>
  );
}

const faqs = [
  {
    q: 'What is Fastcase?',
    a: 'Fastcase is a legal technology platform by SOSM Services Private Limited with two products: the Advocate ERP, a practice management system for advocates and law firms, and the Consumer Portal, which helps citizens understand their legal rights and prepare complaints and applications.',
  },
  {
    q: 'Which product should I use?',
    a: 'If you are an advocate, a chamber or a law firm, use the Advocate ERP to manage clients, cases, hearings, drafting and your team. If you are an individual facing a legal problem — for example cyber fraud, a police complaint, unpaid salary or a defective product — use the Consumer Portal.',
  },
  {
    q: 'Is the Consumer Portal free?',
    a: 'Reading the legal remedy for your problem is free. Generating a formatted complaint or application and downloading it as an A4 PDF costs ₹30 per document.',
  },
  {
    q: 'In which language are Consumer Portal documents prepared?',
    a: 'Guidance and documents in the Consumer Portal are currently prepared in Marathi, in the format expected by the concerned office or authority in Maharashtra.',
  },
  {
    q: 'Does Fastcase provide legal advice?',
    a: 'No. Fastcase is a software platform, not a law firm. The Consumer Portal provides general legal information and document formats. For advice on your specific situation, please consult an advocate.',
  },
];

export default function Home() {
  return (
    <div className="bg-[#F8FAFC]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.16),rgba(1,59,54,0.05)_45%,transparent_75%)]" />
        </div>

        <div className="section-container relative pt-14 pb-16 sm:pt-20 sm:pb-20">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-bold uppercase tracking-[0.08em] text-[#065F46]">
              Legal technology for India
            </span>
            <h1 className="mt-5 font-heading font-[900] text-[34px] sm:text-5xl lg:text-[56px] leading-[1.08] tracking-tight text-slate-900">
              Software for advocates.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#013B36] via-[#059669] to-[#10B981] dark:from-[#34D399] dark:via-[#10B981] dark:to-[#6EE7B7]">
                Legal help for every citizen.
              </span>
            </h1>
            <p className="mt-5 text-[16px] sm:text-lg text-slate-600 leading-relaxed">
              Fastcase brings two products together on one secure platform — an <strong className="font-semibold text-slate-800">Advocate ERP</strong> that
              runs your law practice, and a <strong className="font-semibold text-slate-800">Consumer Portal</strong> that helps ordinary people understand their rights and prepare the right complaint or application.
            </p>
          </div>

          <div className="mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
            <ProductCard
              variant="erp"
              eyebrow="For advocates & law firms"
              title="Advocate ERP"
              desc="A complete practice management system for Indian advocates, chambers and law firms."
              points={[
                'Clients, cases, hearings and cause lists in one place',
                'Draft workspace, template library and legal research',
                'Team roles, tasks and limitation tracking',
              ]}
              primary={{ to: '/advocate-erp', label: 'Explore Advocate ERP' }}
              secondary={{ href: appLinks.advocateLogin(), label: 'Advocate Login', icon: <Lock className="w-3.5 h-3.5 text-slate-400" /> }}
            />
            <ProductCard
              variant="consumer"
              eyebrow="For citizens & consumers"
              title="Consumer Portal"
              desc="Legal guidance and ready-to-submit applications for everyday legal problems."
              points={[
                'Understand your rights and where to go — free',
                'Generate complaints and applications for 13 common problems',
                'Download a print-ready A4 PDF for ₹30',
              ]}
              primary={{ to: '/consumer-portal', label: 'Explore Consumer Portal' }}
              secondary={{ href: appLinks.consumerPortal(), label: 'Open Portal', icon: <ArrowRight className="w-3.5 h-3.5 text-slate-400" /> }}
            />
          </div>
        </div>
      </section>

      {/* ── ADVOCATE ERP ─────────────────────────────────────────────────── */}
      <section id="advocate-erp" className="py-16 sm:py-24 bg-[#F8FAFC] scroll-mt-20">
        <div className="section-container">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-28">
              <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#059669]">Product 01 · Advocate ERP</p>
              <h2 className="mt-3 font-heading font-[800] text-3xl sm:text-[38px] leading-[1.15] tracking-tight text-slate-900">
                Run your entire legal practice from one workspace.
              </h2>
              <p className="mt-4 text-[15.5px] text-slate-600 leading-relaxed">
                Replace diaries, registers and scattered files. The Advocate ERP keeps every client, matter,
                hearing, draft and task connected — so you and your team always know what is due and where each case stands.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to="/advocate-erp" className="btn-primary text-sm">
                  Explore Advocate ERP <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={appLinks.advocateRegister()} className="btn-secondary text-sm">
                  Register your chamber
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {erpHighlights.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#059669]/40 hover:shadow-card-hover transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#013B36] text-[#34D399] flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-heading font-[700] text-[16px] text-slate-900">{title}</h3>
                  <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
              <Link
                to="/features"
                className="sm:col-span-2 flex items-center justify-between gap-3 bg-white rounded-2xl border border-dashed border-slate-300 px-5 py-4 text-[14px] font-semibold text-slate-700 hover:border-[#059669] hover:text-[#013B36] transition"
              >
                See every ERP module
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONSUMER PORTAL ──────────────────────────────────────────────── */}
      <section
        id="consumer-portal"
        className="py-16 sm:py-24 text-white scroll-mt-20"
        style={{ background: 'linear-gradient(160deg, #021F1B 0%, #03362E 55%, #05483D 100%)' }}
      >
        <div className="section-container">
          <div className="max-w-3xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#34D399]">Product 02 · Consumer Portal</p>
            <h2 className="mt-3 font-heading font-[800] text-3xl sm:text-[38px] leading-[1.15] tracking-tight !text-white">
              Facing a legal problem? Know your rights and prepare the right application.
            </h2>
            <p className="mt-4 text-[15.5px] text-white/75 leading-relaxed">
              The Consumer Portal is built for ordinary citizens — not lawyers. It explains what the law says about your problem,
              which office to approach and what to carry, and then prepares a properly formatted complaint or application you can sign and submit.
            </p>
          </div>

          {/* Four tools */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {consumerTools.map(({ icon: Icon, name, tag, desc }) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#059669] text-white flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#6EE7B7] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                </div>
                <h3 className="font-heading font-[700] text-[16px] !text-white">{name}</h3>
                <p className="mt-2 text-[13px] text-white/65 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Problems covered */}
          <div className="mt-12">
            <h3 className="font-heading font-[700] text-lg !text-white">Problems the portal helps with</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {consumerCategories.map(({ id, icon: Icon, title }) => (
                <span key={id} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-[13px] text-white/90">
                  <Icon className="w-4 h-4 text-[#34D399]" />
                  {title}
                </span>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {consumerSteps.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#34D399] text-[#013B36] text-sm font-black">{i + 1}</span>
                <h4 className="mt-3 font-heading font-[700] text-[15px] !text-white">{s.title}</h4>
                <p className="mt-1.5 text-[13px] text-white/65 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to="/consumer-portal" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#34D399] hover:bg-[#6EE7B7] text-[#013B36] text-sm font-extrabold transition">
              Explore Consumer Portal <ArrowRight className="w-4 h-4" />
            </Link>
            <a href={appLinks.consumerPortal()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition">
              Open the portal
            </a>
            <span className="text-[12.5px] text-white/55">Documents are prepared in Marathi · Currently focused on Maharashtra</span>
          </div>
        </div>
      </section>

      {/* ── PLATFORM BASICS ──────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-b border-slate-200">
        <div className="section-container grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: 'Secure by design', desc: 'Role-based access, a separate workspace for each firm and regular data backups.' },
            { icon: Languages, title: 'Built for Indian languages', desc: 'The ERP works in English, Marathi, Hindi and Gujarati. Consumer documents are prepared in Marathi.' },
            { icon: FileText, title: 'Built around Indian law', desc: 'Designed for Indian courts. Consumer guidance follows the new criminal laws — BNS, BNSS and BSA, 2023.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-[700] text-[15px] text-slate-900">{title}</h3>
                <p className="mt-1 text-[13.5px] text-slate-600 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-[#F8FAFC]">
        <div className="section-container max-w-3xl">
          <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900 text-center">Common questions</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => <FAQItem key={f.q} {...f} />)}
          </div>
          <p className="mt-6 text-center text-[14px] text-slate-600">
            More answers on the <Link to="/faq" className="font-semibold text-[#059669] hover:underline">FAQ page</Link> or{' '}
            <Link to="/contact" className="font-semibold text-[#059669] hover:underline">contact us</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
