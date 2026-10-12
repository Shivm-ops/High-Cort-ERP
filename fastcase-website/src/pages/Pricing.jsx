import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Zap, Building2, Crown, ChevronDown } from 'lucide-react';
import { useState } from 'react';

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

const plans = [
  {
    icon: Zap,
    name: 'Starter',
    tagline: 'Solo Advocates',
    price: '₹999',
    period: '/month',
    description: 'Essential toolkit to run your solo practice cleanly and efficiently.',
    cta: 'Registration',
    ctaHref: `${getErpUrl()}/register`,
    highlight: false,
    features: [
      'Up to 50 active court matters',
      'Client management & KYC vault',
      'Hearing diary & smart reminders',
      '50+ verified draft templates',
      'GST tax invoice generation',
    ],
  },
  {
    icon: Crown,
    name: 'Professional',
    tagline: 'Growing Law Firms',
    price: '₹2,499',
    period: '/month',
    description: 'Advanced capabilities for multi-advocate litigation chambers.',
    cta: 'Registration',
    ctaHref: `${getErpUrl()}/register`,
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Unlimited active court matters',
      'Up to 5 advocate team accounts',
      'Multi-language drafts (EN, MR, HI, GU)',
      'OCR notice & evidence processing',
      'Legal research & citation library',
      'Client portal & WhatsApp alerts',
    ],
  },
  {
    icon: Building2,
    name: 'Enterprise',
    tagline: 'Large Legal Chambers',
    price: 'Custom',
    period: '',
    description: 'Customized deployment and dedicated support for large firms.',
    cta: 'Contact Sales',
    ctaTo: '/contact',
    highlight: false,
    features: [
      'Unlimited advocate & staff seats',
      'Dedicated account manager',
      'Custom workflow integrations',
      'Priority SLA & phone support',
      'Enterprise security & audit logs',
    ],
  },
];

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes, every plan includes a 14-day free trial with no credit card required.' },
  { q: 'Can I upgrade or downgrade later?', a: 'Yes, you can easily change plans at any time from your account settings.' },
  { q: 'Are GST invoices provided?', a: 'Yes, Fastcase issues GST-compliant tax invoices for all subscription payments.' },
  { q: 'What happens to my data if I cancel?', a: 'Your data remains exportable for 90 days following cancellation.' },
];

export default function Pricing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="pt-32 pb-14 bg-white border-b border-line">
        <div className="section-container text-center">
          <p className="eyebrow mb-3">Transparent Pricing</p>
          <h1 className="display-heading text-3xl sm:text-4xl md:text-5xl mb-4">
            Simple, Transparent Plans
          </h1>
          <p className="text-base sm:text-lg text-ink/60 max-w-lg mx-auto">
            Choose the plan that fits your practice. All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border p-7 flex flex-col justify-between
                    ${plan.highlight
                      ? 'bg-primary border-primary shadow-feature text-white'
                      : 'bg-white border-line shadow-card hover:shadow-card-hover transition-shadow'
                    }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center bg-teal text-white text-[11px] font-bold px-3 py-1 rounded-full tracking-wide uppercase">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className={`font-heading font-[800] text-xl tracking-tight ${plan.highlight ? 'text-white' : 'text-ink'}`}>
                          {plan.name}
                        </p>
                        <p className={`text-[12px] font-medium ${plan.highlight ? 'text-white/70' : 'text-ink/50'}`}>
                          {plan.tagline}
                        </p>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.highlight ? 'bg-white/15' : 'bg-primary/8'}`}>
                        <Icon className={`w-5 h-5 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className={`font-heading font-[900] text-3xl sm:text-4xl tracking-tight ${plan.highlight ? 'text-white' : 'text-ink'}`}>
                          {plan.price}
                        </span>
                        {plan.period && (
                          <span className={`text-[13px] ${plan.highlight ? 'text-white/60' : 'text-ink/40'}`}>
                            {plan.period}
                          </span>
                        )}
                      </div>
                      <p className={`text-[12px] mt-1.5 leading-relaxed ${plan.highlight ? 'text-white/70' : 'text-ink/55'}`}>
                        {plan.description}
                      </p>
                    </div>

                    <div className={`pt-4 mb-6 border-t ${plan.highlight ? 'border-white/15' : 'border-line'}`}>
                      <ul className="space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2">
                            <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-teal-300' : 'text-[#16A34A]'}`} />
                            <span className={`text-[13px] ${plan.highlight ? 'text-white/90' : 'text-ink/70'}`}>
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    {plan.ctaHref ? (
                      <a
                        href={plan.ctaHref}
                        className={`w-full inline-flex items-center justify-center gap-2 font-[700] text-[14px] py-3 rounded-xl transition-all duration-150
                          ${plan.highlight
                            ? 'bg-white text-primary hover:bg-white/90 shadow-md'
                            : 'btn-primary'
                          }`}
                      >
                        {plan.cta} <ArrowRight className="w-4 h-4" />
                      </a>
                    ) : (
                      <Link
                        to={plan.ctaTo}
                        className={`w-full inline-flex items-center justify-center gap-2 font-[700] text-[14px] py-3 rounded-xl transition-all duration-150
                          ${plan.highlight
                            ? 'bg-white text-primary hover:bg-white/90 shadow-md'
                            : 'btn-secondary border border-line'
                          }`}
                      >
                        {plan.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-14 bg-white border-t border-line">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-10">
            <h2 className="font-heading font-[800] text-2xl text-ink">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={faq.q} className="border border-line rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-surface transition-colors"
                >
                  <span className="font-[600] text-[14px] text-ink">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-ink/40 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 bg-surface/50 border-t border-line text-[13px] text-ink/65 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-sm" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }}>
        <div className="section-container text-center">
          <h2 className="font-heading font-[800] text-2xl sm:text-3xl tracking-tight text-white mb-3">
            Get Started in Minutes
          </h2>
          <p className="text-white/65 text-sm sm:text-base mb-6 max-w-md mx-auto">
            Create your account today. No long-term commitment, cancel anytime.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`${getErpUrl()}/register`}
              className="inline-flex items-center gap-2 bg-white text-[#0F4C81] font-[700] text-[14px] px-6 py-3 rounded-xl hover:bg-white/90 transition-all duration-150 shadow-md"
            >
              Registration <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`${getErpUrl()}/login`}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-[600] text-[14px] px-6 py-3 rounded-xl hover:bg-white/15 transition-all duration-150"
            >
              Advocate Login
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
