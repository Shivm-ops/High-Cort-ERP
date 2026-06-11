import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Zap, Building2, Crown } from 'lucide-react';

const plans = [
  {
    icon: Zap,
    name: 'Starter',
    tagline: 'For solo advocates',
    price: '₹999',
    period: '/month',
    description: 'Everything you need to run a solo legal practice professionally.',
    cta: 'Start Free Trial',
    ctaTo: '/contact',
    highlight: false,
    features: [
      'Up to 50 active matters',
      'Client management & CRM',
      'Hearing calendar & reminders',
      'Draft library (50 templates)',
      'GST invoice generation',
      'Document storage (5 GB)',
      'WhatsApp notifications',
      'Email support',
    ],
    note: '14-day free trial included',
  },
  {
    icon: Crown,
    name: 'Professional',
    tagline: 'For growing law firms',
    price: '₹2,499',
    period: '/month',
    description: 'Advanced features for multi-advocate practices and growing firms.',
    cta: 'Start Free Trial',
    ctaTo: '/contact',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Unlimited active matters',
      'Up to 5 advocate accounts',
      'Full client CRM & portal',
      'Unlimited draft templates',
      'Multi-language support',
      'OCR notice processing',
      'Legal research workspace',
      'GST billing & revenue reports',
      'Evidence management (50 GB)',
      'Task & team management',
      'Priority support',
      'Custom letterhead',
    ],
    note: '14-day free trial included',
  },
  {
    icon: Building2,
    name: 'Enterprise',
    tagline: 'For large legal organizations',
    price: 'Custom',
    period: '',
    description: 'Tailored deployment for large firms, corporate legal teams and institutions.',
    cta: 'Contact Sales',
    ctaTo: '/contact',
    highlight: false,
    features: [
      'Unlimited advocates & staff',
      'Dedicated account manager',
      'Custom integrations & API',
      'White-label options',
      'Unlimited storage',
      'Advanced analytics & reporting',
      'SSO / enterprise auth',
      'SLA-backed uptime guarantee',
      'On-premise deployment option',
      'Custom training & onboarding',
      '24/7 dedicated support',
    ],
    note: 'Volume pricing available',
  },
];

const faqs = [
  { q: 'Is there a free trial?', a: 'Yes — all paid plans include a 14-day free trial with no credit card required. You get full access to every feature during the trial.' },
  { q: 'Can I upgrade or downgrade at any time?', a: 'Absolutely. You can upgrade immediately (prorated) or downgrade at the next billing cycle through your account settings.' },
  { q: 'Are GST invoices provided?', a: 'Yes. LegalOS generates proper GST tax invoices for all subscription payments, suitable for business expense claims.' },
  { q: 'What happens to my data if I cancel?', a: 'Your data is retained for 90 days after cancellation in read-only mode, giving you full time to export everything. After 90 days it is securely deleted.' },
  { q: 'Do you offer discounts for annual plans?', a: 'Yes — annual subscriptions receive up to 20% off compared to monthly billing. Contact us for annual pricing.' },
];

export default function Pricing() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section className="pt-32 pb-16 bg-white border-b border-line">
        <div className="section-container text-center">
          <p className="eyebrow mb-4">Pricing</p>
          <h1 className="display-heading text-5xl lg:text-6xl mb-5">
            Simple, transparent pricing.
          </h1>
          <p className="text-lg text-ink/60 max-w-xl mx-auto">
            Choose the plan that fits your practice. Every plan includes a 14-day free trial — no credit card required.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-4 items-start">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <div key={plan.name}
                  className={`relative rounded-2xl border p-8 flex flex-col
                    ${plan.highlight
                      ? 'bg-primary border-primary shadow-feature'
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

                  <div className="mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${plan.highlight ? 'bg-white/15' : 'bg-primary/8'}`}>
                      <Icon className={`w-5 h-5 ${plan.highlight ? 'text-white' : 'text-primary'}`} />
                    </div>
                    <p className={`font-heading font-[800] text-2xl tracking-tight mb-0.5 ${plan.highlight ? 'text-white' : 'text-ink'}`}>
                      {plan.name}
                    </p>
                    <p className={`text-[13px] ${plan.highlight ? 'text-white/60' : 'text-ink/50'}`}>{plan.tagline}</p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className={`font-heading font-[900] text-4xl tracking-tight ${plan.highlight ? 'text-white' : 'text-ink'}`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`text-[14px] mb-1.5 ${plan.highlight ? 'text-white/50' : 'text-ink/40'}`}>{plan.period}</span>
                      )}
                    </div>
                    <p className={`text-[13px] mt-2 ${plan.highlight ? 'text-white/60' : 'text-ink/50'}`}>{plan.description}</p>
                  </div>

                  <Link to={plan.ctaTo}
                    className={`w-full mb-6 inline-flex items-center justify-center gap-2 font-semibold text-[15px] py-3 rounded-xl transition-all duration-150
                      ${plan.highlight
                        ? 'bg-white text-primary hover:bg-white/90'
                        : 'btn-primary'
                      }`}
                  >
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Link>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-teal' : 'text-success'}`} />
                        <span className={`text-[13px] ${plan.highlight ? 'text-white/80' : 'text-ink/70'}`}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <p className={`text-[11px] mt-5 text-center ${plan.highlight ? 'text-white/40' : 'text-ink/30'}`}>
                    {plan.note}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding-sm bg-white border-t border-line">
        <div className="section-container max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="section-heading text-3xl mb-3">Pricing FAQ</h2>
            <p className="text-ink/50">Common questions about billing and plans.</p>
          </div>
          <div className="divide-y divide-line">
            {faqs.map((faq) => (
              <div key={faq.q} className="py-6">
                <p className="font-heading font-[700] text-[15px] text-ink mb-2">{faq.q}</p>
                <p className="text-[14px] text-ink/60 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-sm border-t border-line">
        <div className="section-container text-center">
          <h2 className="section-heading text-3xl mb-3">Ready to modernize your practice?</h2>
          <p className="text-ink/50 mb-8">Start your 14-day free trial. No credit card required.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="btn-primary-lg">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" className="btn-secondary-lg">Book a Live Demo</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
