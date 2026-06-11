import { Link } from 'react-router-dom';
import {
  Scale, Shield, Users, ShoppingCart, Car, Building2,
  Briefcase, CreditCard, MapPin, Receipt, CheckCircle,
  ArrowRight, FileText, FolderOpen, BookOpen, Monitor,
  ClipboardList, Award, Layers,
} from 'lucide-react';

const practiceAreas = [
  {
    icon: Scale,
    title: 'Civil Litigation',
    desc: 'Manage civil suits, injunction matters, recovery proceedings, partition disputes, property litigation, appeals, and court diary activities from a centralized workspace.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    features: ['Case Management', 'Court Diary', 'Evidence Repository', 'Draft Automation', 'Hearing Tracking'],
  },
  {
    icon: Shield,
    title: 'Criminal Law',
    desc: 'Handle FIR analysis, bail applications, anticipatory bail matters, criminal trials, appeals, and evidence documentation with structured workflows.',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100',
    features: ['FIR & Charge Sheet Records', 'Bail Application Drafting', 'Evidence Management', 'Witness Tracking', 'Court Calendar'],
  },
  {
    icon: Users,
    title: 'Family Law',
    desc: 'Efficiently manage divorce petitions, maintenance claims, child custody matters, domestic violence proceedings, and family settlements.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100',
    features: ['Client Relationship Tracking', 'Document Repository', 'Hearing Reminders', 'Draft Templates', 'Secure Records'],
  },
  {
    icon: ShoppingCart,
    title: 'Consumer Law',
    desc: 'Create consumer complaints, legal notices, rejoinders, and appeal documents while tracking commission hearings and filing deadlines.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    features: ['Notice Automation', 'Complaint Drafting', 'Limitation Tracking', 'Hearing Calendar', 'Evidence Storage'],
  },
  {
    icon: Car,
    title: 'Motor Accident Claims (MACT)',
    desc: 'Maintain claim records, medical evidence, compensation calculations, insurance documents, and tribunal proceedings in one platform.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    features: ['MACT Calculators', 'Medical Record Management', 'Compensation Tracking', 'Insurance Document Storage', 'Tribunal Diary'],
  },
  {
    icon: Building2,
    title: 'Corporate & Commercial Law',
    desc: 'Manage contracts, corporate disputes, arbitration matters, due diligence assignments, and compliance workflows efficiently.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    features: ['Contract Repository', 'Compliance Tracking', 'Due Diligence Checklists', 'Arbitration Management', 'Team Collaboration'],
  },
  {
    icon: Briefcase,
    title: 'Labour & Employment Law',
    desc: 'Track labour court matters, industrial disputes, employee claims, settlements, disciplinary proceedings, and employment documentation.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-100',
    features: ['Employee Matter Tracking', 'Notice Management', 'Hearing Calendar', 'Documentation Workflows', 'Reporting Tools'],
  },
  {
    icon: CreditCard,
    title: 'Banking & Finance',
    desc: 'Handle SARFAESI matters, DRT proceedings, loan recovery actions, financial disputes, and banking litigation.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    features: ['Recovery Tracking', 'DRT Case Management', 'Document Repository', 'Notice Automation', 'Compliance Monitoring'],
  },
  {
    icon: MapPin,
    title: 'Revenue & Land Matters',
    desc: 'Manage mutation entries, land acquisition cases, revenue appeals, property records, and government proceedings.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    features: ['Property Document Storage', 'Revenue Appeal Tracking', 'Hearing Management', 'Government Correspondence', 'Evidence Repository'],
  },
  {
    icon: Receipt,
    title: 'Tax Litigation',
    desc: 'Organize GST disputes, income tax appeals, assessments, tax notices, and tribunal proceedings.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100',
    features: ['GST Case Tracking', 'Tax Notice Management', 'Appeal Documentation', 'Deadline Monitoring', 'Reporting & Analytics'],
  },
  {
    icon: Award,
    title: 'Intellectual Property Rights (IPR)',
    desc: 'Manage trademark registrations, copyright matters, design protection, opposition proceedings, and infringement actions.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    features: ['Trademark Matters', 'Copyright Matters', 'Design Protection', 'Opposition Proceedings', 'Infringement Actions'],
  },
  {
    icon: Layers,
    title: 'Insolvency & Bankruptcy (IBC/NCLT)',
    desc: 'Handle CIRP proceedings, NCLT matters, resolution applications, liquidation cases, and creditor claims efficiently.',
    color: 'text-slate-600',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    features: ['CIRP Proceedings', 'NCLT Matters', 'Resolution Applications', 'Liquidation Cases', 'Creditor Claims'],
  },
];

const platformFeatures = [
  { icon: Users, title: 'Client Management', desc: 'Centralized client database with KYC, communication history, and case linking.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { icon: Briefcase, title: 'Case Management', desc: 'Track matters, hearings, tasks, deadlines, documents, and status updates.', color: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: FileText, title: 'Draft Automation', desc: 'Generate notices, replies, petitions, agreements, affidavits, and applications using reusable templates.', color: 'text-teal-600', bg: 'bg-teal-50' },
  { icon: FolderOpen, title: 'Evidence Repository', desc: 'Securely store, organize, search, and retrieve evidence and case-related documents.', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: Receipt, title: 'Billing & GST Invoicing', desc: 'Generate professional invoices, manage payments, and track outstanding fees.', color: 'text-green-600', bg: 'bg-green-50' },
  { icon: ClipboardList, title: 'Team Collaboration', desc: 'Assign tasks, manage advocate workloads, and monitor firm-wide productivity.', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { icon: BookOpen, title: 'Legal Research', desc: 'Research case laws, statutes, legal provisions, and judgments from a single workspace.', color: 'text-rose-600', bg: 'bg-rose-50' },
  { icon: Monitor, title: 'Client Portal', desc: 'Allow clients to securely view case updates, documents, invoices, and hearing schedules.', color: 'text-[#0F4C81]', bg: 'bg-[#0F4C81]/6' },
];

export default function PracticeAreas() {
  return (
    <div className="bg-surface">

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-20">
        <div className="section-container text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-white text-[12px] font-[700] tracking-wider uppercase px-4 py-1.5 rounded-full mb-6">
            Practice Areas
          </span>
          <h1 className="font-heading font-[900] text-4xl md:text-5xl tracking-tight text-white mb-5">
            Built for Every Area of<br />Indian Legal Practice
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            LegalOS provides specialized workflows, automation tools, document management, billing,
            hearing tracking, and case management capabilities tailored for advocates, law firms,
            and legal professionals across diverse areas of practice.
          </p>
        </div>
      </section>

      {/* Practice Area Cards */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {practiceAreas.map((area) => {
              const Icon = area.icon;
              return (
                <div key={area.title} className={`card p-6 border ${area.border} hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5`}>
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-11 h-11 ${area.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${area.color}`} />
                    </div>
                    <div>
                      <h3 className="font-heading font-[700] text-[15px] text-ink leading-tight">{area.title}</h3>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-ink/55 leading-relaxed mb-4">{area.desc}</p>

                  {/* Key Features */}
                  <div className="pt-4 border-t border-line">
                    <p className="text-[10px] font-[700] text-ink/35 uppercase tracking-wider mb-3">Key Features</p>
                    <ul className="space-y-1.5">
                      {area.features.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                          <span className="text-[12px] text-ink/60">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* One Platform Section */}
      <section className="section-padding border-t border-line" style={{ backgroundColor: '#EEF2F7' }}>
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="eyebrow mb-3">One Platform</p>
            <h2 className="section-heading text-4xl mb-4">One Platform. Every Legal Workflow.</h2>
            <p className="text-[16px] text-ink/50 max-w-2xl mx-auto">
              Whether you are a solo advocate, growing law firm, senior counsel, or corporate legal department,
              LegalOS helps streamline legal operations through:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {platformFeatures.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="card p-6 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
                  <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-heading font-[700] text-[14px] text-ink mb-1.5">{f.title}</h3>
                  <p className="text-[13px] text-ink/55 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why LegalOS */}
      <section className="section-padding bg-white border-t border-line">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="eyebrow mb-4">Why LegalOS</p>
              <h2 className="section-heading text-3xl mb-5">
                Built for the modern Indian legal profession.
              </h2>
              <p className="text-[15px] text-ink/60 leading-relaxed mb-5">
                LegalOS is designed specifically for Indian advocates and law firms to reduce administrative work,
                improve case organization, automate documentation, and provide complete visibility into legal
                operations from client onboarding to matter closure.
              </p>
              <p className="text-[14px] text-ink/45 leading-relaxed mb-8">
                Built by <span className="font-[600] text-ink/70">SOSM Services Private Limited</span> for the modern Indian legal profession.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/contact" className="btn-primary-lg">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/features" className="btn-secondary-lg">
                  Explore Features
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { stat: '10+', label: 'Practice Areas Supported', sub: 'Specialized workflows per area' },
                { stat: '16', label: 'Platform Modules', sub: 'Deeply integrated tools' },
                { stat: '4', label: 'Indian Languages', sub: 'English, Marathi, Hindi, Gujarati' },
                { stat: '99.9%', label: 'Uptime SLA', sub: 'Enterprise-grade reliability' },
              ].map((c) => (
                <div key={c.label} className="card p-6 text-center hover:shadow-card-hover transition-all duration-200">
                  <p className="font-heading font-[900] text-4xl text-[#0F4C81] tracking-tight mb-2">{c.stat}</p>
                  <p className="font-heading font-[700] text-[13px] text-ink mb-1">{c.label}</p>
                  <p className="text-[12px] text-ink/40 leading-snug">{c.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-sm border-t border-line" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }}>
        <div className="section-container text-center">
          <h2 className="font-heading font-[800] text-3xl tracking-tight text-white mb-4">
            Ready to streamline your practice?
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Start your free trial and experience LegalOS across your practice area — no credit card required.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact"
              className="inline-flex items-center gap-2 bg-white text-[#0F4C81] font-[600] text-[15px] px-7 py-3.5 rounded-xl hover:bg-white/90 transition-all duration-150 shadow-lg"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-[600] text-[15px] px-7 py-3.5 rounded-xl hover:bg-white/15 transition-all duration-150"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
