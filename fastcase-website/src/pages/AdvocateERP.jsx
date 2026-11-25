import { Link } from 'react-router-dom';
import { ArrowRight, Lock, CheckCircle2, Briefcase } from 'lucide-react';
import { appLinks, erpModuleGroups } from '../data/site';

const audiences = ['Independent advocates', 'Chambers', 'Law firms', 'Legal teams'];

const workflow = [
  { title: 'Add the client', desc: 'Record the enquiry through Client Intake and create the client profile.' },
  { title: 'Open the matter', desc: 'Create the case with court, case number, parties, stage and documents.' },
  { title: 'Track every date', desc: 'Hearings, cause lists, limitation periods and tasks stay on one calendar.' },
  { title: 'Draft and research', desc: 'Prepare drafts from templates, look up case laws and bare acts, and keep it all on the matter.' },
];

const practiceAreas = [
  'Civil', 'Criminal', 'Family', 'Consumer', 'MACT', 'Commercial',
  'Labour', 'Banking & DRT', 'Revenue & Land', 'Tax', 'IPR', 'Insolvency',
];

/* Illustrative map of the ERP workspace — module names only, no sample data */
function WorkspaceMap() {
  return (
    <div className="relative">
      <div className="absolute -inset-3 bg-gradient-to-tr from-[#34D399]/20 via-[#059669]/10 to-[#013B36]/20 rounded-3xl blur-2xl pointer-events-none" />
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-[0_24px_60px_-20px_rgba(1,59,54,0.25)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
          <span className="ml-2 text-[11px] font-semibold text-slate-500">Fastcase · Advocate ERP workspace</span>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-200">
          {erpModuleGroups.map((g) => (
            <div key={g.id} className="bg-white p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#059669] mb-2.5">{g.title}</p>
              <ul className="space-y-1.5">
                {g.modules.slice(0, 5).map(({ icon: Icon, name }) => (
                  <li key={name} className="flex items-center gap-2 text-[12.5px] text-slate-700">
                    <Icon className="w-3.5 h-3.5 text-[#013B36] flex-shrink-0" />
                    <span className="truncate">{name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdvocateERP() {
  return (
    <div className="bg-[#F8FAFC]">
      {/* ── HERO ── */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden">
        <div className="section-container py-14 sm:py-20 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-bold uppercase tracking-[0.08em] text-[#065F46]">
              <Briefcase className="w-3.5 h-3.5" /> Advocate ERP
            </span>
            <h1 className="mt-5 font-heading font-[900] text-[34px] sm:text-[46px] leading-[1.1] tracking-tight text-slate-900">
              The practice management system for Indian advocates.
            </h1>
            <p className="mt-5 text-[16px] sm:text-[17px] text-slate-600 leading-relaxed">
              Fastcase Advocate ERP brings your clients, cases, hearings, cause lists, drafting, legal research and team into
              one secure workspace — built for the way litigation works in Indian courts.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={appLinks.advocateLogin()} className="btn-primary text-sm">
                <Lock className="w-4 h-4" /> Advocate Login
              </a>
              <a href={appLinks.advocateRegister()} className="btn-secondary text-sm">
                Register your chamber <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-2">
              {audiences.map((a) => (
                <span key={a} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 bg-white">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> {a}
                </span>
              ))}
            </div>
          </div>
          <div className="lg:col-span-6">
            <WorkspaceMap />
          </div>
        </div>
      </section>

      {/* ── WHAT IT DOES ── */}
      <section className="py-16 sm:py-24">
        <div className="section-container">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#059669]">What the ERP covers</p>
            <h2 className="mt-3 font-heading font-[800] text-3xl sm:text-[36px] leading-tight tracking-tight text-slate-900">
              Four areas of your practice, connected.
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {erpModuleGroups.map((g) => (
              <div key={g.id} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
                <h3 className="font-heading font-[800] text-xl text-slate-900">{g.title}</h3>
                <p className="mt-1.5 text-[14px] text-slate-600">{g.summary}</p>
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                  {g.modules.map(({ icon: Icon, name }) => (
                    <li key={name} className="flex items-center gap-2.5 text-[13.5px] text-slate-700">
                      <span className="w-7 h-7 rounded-lg bg-[#013B36] text-[#34D399] flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Link to="/features#erp" className="inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#013B36] hover:text-[#059669]">
              See what each module does <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── WORKFLOW ── */}
      <section className="py-16 sm:py-20 bg-white border-y border-slate-200">
        <div className="section-container">
          <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900">How a matter moves through Fastcase</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workflow.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl border border-slate-200 p-5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#013B36] text-[#34D399] text-sm font-black">{i + 1}</span>
                <h3 className="mt-3 font-heading font-[700] text-[16px] text-slate-900">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRACTICE AREAS ── */}
      <section className="py-16 sm:py-20">
        <div className="section-container grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5">
            <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900">Organised by practice area</h2>
            <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
              Group matters by area of law and see each area’s active cases and hearings at a glance.
            </p>
            <Link to="/practice-areas" className="mt-5 inline-flex items-center gap-2 text-[14.5px] font-semibold text-[#013B36] hover:text-[#059669]">
              View practice areas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="lg:col-span-7 flex flex-wrap gap-2">
            {practiceAreas.map((p) => (
              <span key={p} className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-[13.5px] font-medium text-slate-700">{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-20">
        <div className="section-container">
          <div className="rounded-3xl px-6 py-10 sm:px-12 sm:py-12 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            style={{ background: 'linear-gradient(135deg, #021F1B 0%, #03362E 55%, #05483D 100%)' }}>
            <div>
              <h2 className="font-heading font-[800] text-2xl sm:text-3xl !text-white">Bring your practice onto Fastcase.</h2>
              <p className="mt-2 text-white/70 text-[15px]">Sign in to your workspace, or register your chamber to get started.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={appLinks.advocateLogin()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#34D399] hover:bg-[#6EE7B7] text-[#013B36] text-sm font-extrabold transition">
                <Lock className="w-4 h-4" /> Advocate Login
              </a>
              <a href={appLinks.advocateRegister()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition">
                Register your chamber
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
