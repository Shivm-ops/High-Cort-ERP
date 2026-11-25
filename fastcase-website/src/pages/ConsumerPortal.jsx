import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Scale, CheckCircle2, ChevronDown, Phone, Building, Languages,
  MapPin, LogIn, AlertTriangle, Lightbulb, FileSignature, FolderCheck, Landmark,
} from 'lucide-react';
import { appLinks, consumerCategories, consumerSteps } from '../data/site';

const toolDetails = [
  {
    icon: Lightbulb,
    name: 'Problem & Legal Remedy',
    tag: 'Free',
    intro: 'Type your problem in your own words or choose a category. The portal shows:',
    points: [
      'Your legal rights in plain language',
      'The time limit that applies',
      'Which office or authority to approach',
      'Step-by-step actions to take',
      'Documents to carry',
      'Helpline numbers',
      'What to do if the authority refuses',
    ],
  },
  {
    icon: FileSignature,
    name: 'Application Generator',
    tag: '₹30 per document',
    intro: 'Sign in, enter your details and the portal prepares a formal complaint or application:',
    points: [
      'Addressed to the correct authority',
      'Relevant legal provisions included',
      'Your name, incident details and the other party filled in',
      'Preview and edit before you download',
      'Print-ready A4 PDF in a one-page or two-page format',
    ],
  },
  {
    icon: FolderCheck,
    name: 'My Applications',
    tag: 'Your account',
    intro: 'Every document you generate is kept in your account:',
    points: [
      'All your applications in one list',
      'Open and download them again any time',
    ],
  },
  {
    icon: Landmark,
    name: 'Property Legal Check',
    tag: 'Before you buy',
    intro: 'Check a property before you buy it — agricultural land, residential or NA plot, flat, commercial or industrial property:',
    points: [
      '7/12 extract and mutation (ferfar) records',
      'Search for pending court cases on the property',
      'Upload a sale deed or Index II to cross-check survey numbers and owner names',
      'Download a property check report',
    ],
  },
];

const notes = [
  { icon: Languages, title: 'Documents in Marathi', desc: 'Guidance and generated applications are currently in Marathi, in the format offices expect.' },
  { icon: MapPin, title: 'Focused on Maharashtra', desc: 'Authorities, procedures and property records follow Maharashtra practice.' },
  { icon: LogIn, title: 'Sign in only when needed', desc: 'Read guidance without an account. Sign in to generate, pay for and save documents.' },
  { icon: AlertTriangle, title: 'Information, not legal advice', desc: 'The portal gives general legal information. In an emergency call 112. For advice on your case, consult an advocate.' },
];

const faqs = [
  { q: 'Who is the Consumer Portal for?', a: 'For any individual dealing with an everyday legal problem — such as online fraud, a police complaint, unpaid salary, a defective product, property encroachment, domestic violence, a lost document or an RTI request — who wants to understand what to do and prepare the correct application.' },
  { q: 'What does it cost?', a: 'Reading the legal remedy for your problem is free. Generating an application and downloading it as an A4 PDF costs ₹30 per document, payable by UPI.' },
  { q: 'Do I need to create an account?', a: 'No account is needed to read the guidance. You need to sign in to generate documents, make the payment and keep your documents saved in “My Applications”.' },
  { q: 'What do I do after downloading the application?', a: 'Print it, sign it, attach the documents listed in the guidance and submit it to the authority named on the application. Keep the acknowledgement (received stamp) for your records.' },
  { q: 'Can I edit the application before downloading?', a: 'Yes. You can review the prepared application, change your details and preview it again before you pay and download.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="text-[14.5px] font-semibold text-slate-900">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function ConsumerPortal() {
  const groups = useMemo(() => ['All', ...Array.from(new Set(consumerCategories.map((c) => c.group)))], []);
  const [group, setGroup] = useState('All');
  const visible = group === 'All' ? consumerCategories : consumerCategories.filter((c) => c.group === group);

  return (
    <div className="bg-[#F8FAFC]">
      {/* ── HERO ── */}
      <section className="text-white" style={{ background: 'linear-gradient(160deg, #021F1B 0%, #03362E 55%, #05483D 100%)' }}>
        <div className="section-container py-14 sm:py-20 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6EE7B7]">
              <Scale className="w-3.5 h-3.5" /> Consumer Portal · For citizens
            </span>
            <h1 className="mt-5 font-heading font-[900] text-[34px] sm:text-[48px] leading-[1.08] tracking-tight !text-white">
              Legal help for everyday problems, in simple steps.
            </h1>
            <p className="mt-5 text-[16px] sm:text-[17px] text-white/75 leading-relaxed max-w-2xl">
              Cheated online? Police not registering your complaint? Salary not paid? The Fastcase Consumer Portal explains
              your rights, tells you exactly where to go, and prepares the formal complaint or application you need to submit.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={appLinks.consumerPortal()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#34D399] hover:bg-[#6EE7B7] text-[#013B36] text-sm font-extrabold transition">
                Open the Consumer Portal <ArrowRight className="w-4 h-4" />
              </a>
              <a href={appLinks.consumerLogin()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition">
                <LogIn className="w-4 h-4" /> Sign in / Register
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-white/70">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#34D399]" /> Free legal guidance</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#34D399]" /> 13 common problems covered</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#34D399]" /> ₹30 per document</span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
              <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#6EE7B7]">How it works</p>
              <ol className="mt-4 space-y-4">
                {consumerSteps.map((s, i) => (
                  <li key={s.title} className="flex gap-3.5">
                    <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#34D399] text-[#013B36] text-[13px] font-black">{i + 1}</span>
                    <div>
                      <p className="text-[14.5px] font-bold text-white">{s.title}</p>
                      <p className="text-[13px] text-white/65 leading-relaxed">{s.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT YOU CAN DO ── */}
      <section className="py-16 sm:py-24">
        <div className="section-container">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#059669]">Inside the portal</p>
            <h2 className="mt-3 font-heading font-[800] text-3xl sm:text-[36px] leading-tight tracking-tight text-slate-900">What you can do after you open the portal</h2>
          </div>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
            {toolDetails.map(({ icon: Icon, name, tag, intro, points }) => (
              <div key={name} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#059669] text-white flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading font-[800] text-lg text-slate-900">{name}</h3>
                  </div>
                  <span className="text-[11px] font-bold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-full whitespace-nowrap">{tag}</span>
                </div>
                <p className="mt-4 text-[14px] text-slate-600">{intro}</p>
                <ul className="mt-3 space-y-2">
                  {points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEMS COVERED ── */}
      <section className="py-16 sm:py-24 bg-white border-y border-slate-200">
        <div className="section-container">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#059669]">Problems covered</p>
            <h2 className="mt-3 font-heading font-[800] text-3xl sm:text-[36px] leading-tight tracking-tight text-slate-900">Complaints and applications you can prepare</h2>
            <p className="mt-3 text-[15px] text-slate-600">Each problem comes with free guidance and a ready application addressed to the right authority.</p>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto scrollbar-none pb-1" role="tablist" aria-label="Filter problems">
            {groups.map((g) => (
              <button
                key={g}
                role="tab"
                aria-selected={group === g}
                onClick={() => setGroup(g)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap border transition ${
                  group === g ? 'bg-[#013B36] text-white border-[#013B36]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#059669]/50'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(({ id, icon: Icon, title, desc, authority, helpline }) => (
              <div key={id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col hover:border-[#059669]/40 hover:shadow-card-hover transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-[700] text-[15px] text-slate-900 leading-snug">{title}</h3>
                    <p className="mt-1 text-[13px] text-slate-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4">
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[12.5px] text-slate-600">
                    <p className="flex items-start gap-2"><Building className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" /><span>Addressed to: <span className="font-medium text-slate-800">{authority}</span></span></p>
                    {helpline && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> Helpline: <span className="font-semibold text-slate-800">{helpline}</span></p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GOOD TO KNOW ── */}
      <section className="py-16 sm:py-20">
        <div className="section-container">
          <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900">Good to know</h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {notes.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-slate-200 p-5">
                <Icon className="w-5 h-5 text-[#059669]" />
                <h3 className="mt-3 font-heading font-[700] text-[15px] text-slate-900">{title}</h3>
                <p className="mt-1.5 text-[13.5px] text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="pb-16 sm:pb-20">
        <div className="section-container max-w-3xl">
          <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900 text-center">Questions about the Consumer Portal</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => <FAQItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-20">
        <div className="section-container">
          <div className="rounded-3xl px-6 py-10 sm:px-12 sm:py-12 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6"
            style={{ background: 'linear-gradient(135deg, #021F1B 0%, #03362E 55%, #05483D 100%)' }}>
            <div>
              <h2 className="font-heading font-[800] text-2xl sm:text-3xl !text-white">Start with your problem.</h2>
              <p className="mt-2 text-white/70 text-[15px]">Open the portal, read the remedy for free, and prepare your application when you are ready.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={appLinks.consumerPortal()} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#34D399] hover:bg-[#6EE7B7] text-[#013B36] text-sm font-extrabold transition">
                Open the Consumer Portal <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/features#consumer" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition">
                View all features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
