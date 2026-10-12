import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Zap, Building2, Crown, ChevronDown, Sparkles, Shield, HelpCircle } from 'lucide-react';

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

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes. Every plan includes a 14-day full-access trial without entering credit card details.' },
  { q: 'How does Annual billing save me money?', a: 'When you choose Annual billing, you get a 20% discount on both Starter and Professional plans, saving you up to ₹6,000 every year.' },
  { q: 'Can I switch or customize plans later?', a: 'Yes. You can upgrade, downgrade, or add additional advocate seats anytime from your firm billing dashboard.' },
  { q: 'Are GST tax invoices provided?', a: 'Yes. Fastcase generates proper GST-compliant tax invoices for every payment so you can claim business expenses.' },
  { q: 'Where is my legal data hosted?', a: 'All data is stored exclusively in high-security, ISO-compliant data centers located inside India (Bangalore & Mumbai).' },
];

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const plans = [
    {
      id: 'starter',
      icon: Zap,
      name: 'Starter',
      tagline: 'Solo Advocates & Independent Counsels',
      price: isAnnual ? '₹799' : '₹999',
      period: '/month',
      billedNote: isAnnual ? 'Billed annually (Save ₹2,400/yr)' : 'Billed monthly',
      description: 'The complete digital workspace to manage your individual legal practice cleanly.',
      cta: 'Registration',
      ctaHref: `${getErpUrl()}/register`,
      highlight: false,
      features: [
        'Up to 50 active court matters',
        '1 Advocate workspace',
        'Client directory & KYC document vault',
        'Hearing diary & daily cause list sync',
        '50+ court-verified draft templates',
        'GST-compliant legal tax invoicing',
        'WhatsApp hearing date alerts',
      ],
    },
    {
      id: 'pro',
      icon: Crown,
      name: 'Professional',
      tagline: 'Chambers & Growing Law Firms',
      price: isAnnual ? '₹1,999' : '₹2,499',
      period: '/month',
      billedNote: isAnnual ? 'Billed annually (Save ₹6,000/yr)' : 'Billed monthly',
      description: 'Advanced collaboration, multi-language drafts, and full firm automation.',
      cta: 'Registration',
      ctaHref: `${getErpUrl()}/register`,
      highlight: true,
      badge: 'RECOMMENDED FOR FIRMS',
      features: [
        'Unlimited active court matters',
        'Up to 5 advocate & associate accounts',
        'Multi-language drafting (EN, MR, HI, GU)',
        'OCR notice extraction & reply studio',
        'Precedent vault & citation library',
        'Client self-service case portal',
        'Firm receivables ledger & audit logs',
        'Priority email & WhatsApp assistance',
      ],
    },
    {
      id: 'enterprise',
      icon: Building2,
      name: 'Enterprise',
      tagline: 'Large Legal Firms & Corporate Counsels',
      price: 'Custom',
      period: '',
      billedNote: 'Tailored for large teams',
      description: 'Dedicated infrastructure, custom security policies, and SLA-backed support.',
      cta: 'Contact Sales',
      ctaTo: '/contact',
      highlight: false,
      features: [
        'Unlimited advocate & clerk accounts',
        'Dedicated account manager',
        'Custom court workflow configurations',
        'Enterprise SSO & role permissions',
        '99.99% uptime guarantee with SLA',
        'Custom legal template digitization',
      ],
    },
  ];

  return (
    <div className="bg-[#F8FAFC]">
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] border-b border-slate-200">
        <div className="section-container text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#C59B27]/10 border border-[#C59B27]/25 text-[#977318] text-[12px] font-bold tracking-wide uppercase rounded-full px-4 py-1.5 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
            Transparent & Customizable Pricing
          </div>

          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight text-slate-900 mb-4">
            Invest in Your Legal Practice
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto mb-8">
            Choose the right plan for your caseload. Switch billing cycles anytime to maximize savings.
          </p>

          {/* ── CUSTOMIZABLE BILLING TOGGLE ──────────────────────────── */}
          <div className="inline-flex items-center bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/70 shadow-inner">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                !isAnnual
                  ? 'bg-white text-slate-900 shadow-md scale-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 ${
                isAnnual
                  ? 'bg-primary text-white shadow-md scale-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Annual Billing</span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                isAnnual ? 'bg-amber-400 text-slate-950 shadow-sm' : 'bg-emerald-100 text-emerald-800'
              }`}>
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── PRICING CARDS ──────────────────────────────────────────── */}
      <section className="section-padding py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-stretch">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-gradient-to-b from-[#021816] via-[#013B36] to-[#074E47] text-white border-2 border-amber-400/30 shadow-[0_25px_60px_-10px_rgba(1,59,54,0.4)] hover:shadow-[0_30px_70px_-10px_rgba(1,59,54,0.5)] lg:-translate-y-2'
                      : 'bg-white border border-slate-200 text-slate-900 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.06)] hover:shadow-[0_12px_32px_-6px_rgba(15,23,42,0.1)] hover:-translate-y-1'
                  }`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 text-[11px] font-black px-4 py-1 rounded-full tracking-wider shadow-md border border-amber-300/40">
                        <Sparkles className="w-3 h-3 text-slate-950" />
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className={`font-heading font-[800] text-2xl tracking-tight mb-1 ${
                          plan.highlight ? 'text-white' : 'text-slate-900'
                        }`}>
                          {plan.name}
                        </h2>
                        <p className={`text-[12px] font-medium ${
                          plan.highlight ? 'text-sky-200/80' : 'text-slate-500'
                        }`}>
                          {plan.tagline}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        plan.highlight ? 'bg-white/10 text-amber-300' : 'bg-primary/10 text-primary'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-5 pt-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className={`font-heading font-[900] text-4xl sm:text-5xl tracking-tight ${
                          plan.highlight ? 'text-white' : 'text-slate-900'
                        }`}>
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className={`text-[14px] font-medium ${
                            plan.highlight ? 'text-sky-200/70' : 'text-slate-500'
                          }`}>
                            {plan.period}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] font-semibold mt-1 ${
                        plan.highlight ? 'text-amber-300' : 'text-[#014D46]'
                      }`}>
                        {plan.billedNote}
                      </p>
                    </div>

                    {/* Description */}
                    <p className={`text-[13px] leading-relaxed mb-6 pb-6 border-b ${
                      plan.highlight ? 'text-slate-200 border-white/15' : 'text-slate-600 border-slate-100'
                    }`}>
                      {plan.description}
                    </p>

                    {/* Features List */}
                    <div className="mb-8">
                      <p className={`text-[11px] font-bold uppercase tracking-wider mb-3.5 ${
                        plan.highlight ? 'text-sky-200/60' : 'text-slate-400'
                      }`}>
                        Included in this plan:
                      </p>
                      <ul className="space-y-2.5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-[13px]">
                            <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                              plan.highlight ? 'text-emerald-400' : 'text-emerald-600'
                            }`} />
                            <span className={plan.highlight ? 'text-slate-100' : 'text-slate-700'}>
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div>
                    {plan.ctaHref ? (
                      <a
                        href={plan.ctaHref}
                        className={`w-full inline-flex items-center justify-center gap-2 font-[700] text-[15px] py-3.5 rounded-xl transition-all duration-200 ${
                          plan.highlight
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg hover:shadow-xl hover:scale-[1.02]'
                            : 'bg-primary hover:bg-[#072B20] text-white shadow-md hover:shadow-lg'
                        }`}
                      >
                        {plan.cta} <ArrowRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        to={plan.ctaTo}
                        className={`w-full inline-flex items-center justify-center gap-2 font-[700] text-[15px] py-3.5 rounded-xl transition-all duration-200 ${
                          plan.highlight
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg'
                            : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-sm'
                        }`}
                      >
                        {plan.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    <p className={`text-center text-[11px] mt-2.5 ${
                      plan.highlight ? 'text-sky-200/50' : 'text-slate-400'
                    }`}>
                      14-day free trial · Cancel anytime
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECURITY & GUARANTEES ──────────────────────────────────── */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center p-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-[700] text-[15px] text-slate-900 mb-1">100% Indian Data Sovereignty</h3>
              <p className="text-[12px] text-slate-500 max-w-xs">Data stored exclusively in high-tier Mumbai and Bengaluru facilities.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-[700] text-[15px] text-slate-900 mb-1">Zero Hidden Fees</h3>
              <p className="text-[12px] text-slate-500 max-w-xs">Transparent pricing with GST invoicing and no unexpected surcharges.</p>
            </div>
            <div className="flex flex-col items-center p-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-[700] text-[15px] text-slate-900 mb-1">Dedicated Advocate Support</h3>
              <p className="text-[12px] text-slate-500 max-w-xs">Direct onboarding assistance from team specialists via call and WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQS ───────────────────────────────────────────────────── */}
      <section className="section-padding py-16 bg-[#F8FAFC]">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">Got Questions?</p>
            <h2 className="font-heading font-[800] text-3xl text-slate-900">Pricing FAQs</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={faq.q} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/70 transition-colors"
                >
                  <span className="font-[700] text-[14px] text-slate-900">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-primary' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-[13px] text-slate-600 leading-relaxed border-t border-slate-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

