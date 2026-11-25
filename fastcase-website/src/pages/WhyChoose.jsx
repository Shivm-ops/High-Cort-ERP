import { Link } from 'react-router-dom';
import {
  CheckCircle, ArrowRight, Globe, Shield, Zap,
  CreditCard, Users, Scale, HeadphonesIcon, Smartphone
} from 'lucide-react';

const reasons = [
  {
    icon: Globe,
    title: 'Designed for India',
    desc: 'Fastcase is built from scratch for the Indian legal system — Indian courts, Indian languages and Indian advocacy workflows. Not a foreign product adapted for India.',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Zap,
    title: 'All-in-One Platform',
    desc: 'From client intake to drafting and hearings, everything lives in one platform. No need to juggle multiple tools or spreadsheets.',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    desc: 'Your client data and legal documents are protected with end-to-end encryption, role-based access controls, and secure cloud storage with regular backups.',
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    icon: CreditCard,
    title: 'Legal Help for Citizens',
    desc: 'The Consumer Portal helps citizens understand their rights and prepare complaints and applications — free guidance, ₹30 per document.',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Assign tasks to juniors, clerks, and paralegals. Monitor deadlines across your team. Role-based access ensures data security within your office.',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
  },
  {
    icon: Scale,
    title: 'Scales with Your Practice',
    desc: 'Whether you practise alone or run a firm, add team members and modules as your practice grows.',
    color: 'text-primary',
    bg: 'bg-primary/5 dark:bg-primary/20',
  },
  {
    icon: HeadphonesIcon,
    title: 'Dedicated Support',
    desc: 'Get help from a support team that understands legal practice. We provide onboarding assistance, training, and ongoing support to ensure your success.',
    color: 'text-pink-600',
    bg: 'bg-pink-50 dark:bg-pink-900/20',
  },
  {
    icon: Smartphone,
    title: 'Work From Anywhere',
    desc: 'Access your practice from any device — desktop, tablet, or mobile. The fully responsive design ensures a great experience on every screen.',
    color: 'text-teal-600',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
  },
];

export default function WhyChoose() {
  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #021F1B 0%, #03362E 55%, #05483D 100%)' }} className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-5">
            Why Choose Fastcase?
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            See why advocates and law firms across India choose Fastcase for running their practice — and why citizens use the Consumer Portal for legal help.
          </p>
        </div>
      </section>

      {/* Key Reasons */}
      <section className="section-padding bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-heading text-3xl mb-4">8 Reasons to Choose Fastcase</h2>
            <p className="text-[16px] text-ink/50 max-w-2xl mx-auto">
              Purpose-built technology for the unique needs of Indian legal professionals.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {reasons.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="card p-6">
                  <div className={`w-12 h-12 ${r.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${r.color}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-2 text-base">
                    {r.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                    {r.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Security Highlight */}
      <section className="section-padding bg-white border-t border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 md:p-12 text-white" style={{ background: 'linear-gradient(135deg, #021F1B 0%, #03362E 55%, #05483D 100%)' }}>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <Shield className="w-14 h-14 text-[#059669] mb-5" />
                <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4">
                  Your Data is Safe with Fastcase
                </h2>
                <p className="text-slate-200/90 leading-relaxed mb-6">
                  We implement enterprise-grade security across every layer of the platform.
                  Your client data, legal documents, and business information are protected
                  with the highest standards of security.
                </p>
                <Link to="/data-security"
                  className="inline-flex items-center gap-2 border border-white/40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-150"
                >
                  View Data Security Policy <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  'End-to-End Encryption',
                  'Role-Based Access Control',
                  'Secure Cloud Storage',
                  'Automated Backups',
                  'Audit Log Trails',
                  'Tenant Isolation',
                  'Disaster Recovery',
                  'Security Monitoring',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#059669] flex-shrink-0" />
                    <span className="text-sm text-slate-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-sm border-t border-line" style={{ background: 'linear-gradient(135deg, #021F1B 0%, #03362E 55%, #05483D 100%)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading font-[800] text-3xl tracking-tight text-white mb-4">
            Make the Switch to Fastcase
          </h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">
            Explore the Advocate ERP for your practice, or the Consumer Portal if you need legal help.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact"
              className="inline-flex items-center gap-2 bg-white text-primary font-[600] text-[15px] px-7 py-3.5 rounded-xl hover:bg-white/90 transition-all duration-150 shadow-lg"
            >
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/features"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-[600] text-[15px] px-7 py-3.5 rounded-xl hover:bg-white/15 transition-all duration-150"
            >
              See All Features
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
