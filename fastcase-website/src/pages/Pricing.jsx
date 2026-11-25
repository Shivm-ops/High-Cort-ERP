import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Scale, CheckCircle2, Lock } from 'lucide-react';
import { appLinks } from '../data/site';

export default function Pricing() {
  return (
    <div className="bg-[#F8FAFC]">
      <section className="bg-white border-b border-slate-200">
        <div className="section-container pt-14 pb-12 sm:pt-16 text-center max-w-3xl">
          <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#059669]">Pricing</p>
          <h1 className="mt-3 font-heading font-[900] text-[32px] sm:text-[44px] leading-tight tracking-tight text-slate-900">
            Simple pricing for both products
          </h1>
          <p className="mt-4 text-[16px] text-slate-600">
            The Advocate ERP is priced by chamber size. The Consumer Portal charges only when you download a document.
          </p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="section-container max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Advocate ERP */}
          <div className="bg-white rounded-3xl border border-slate-200 p-7 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#013B36] text-[#34D399] flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#059669]">For advocates & law firms</p>
                <h2 className="font-heading font-[800] text-xl text-slate-900">Advocate ERP</h2>
              </div>
            </div>
            <p className="mt-6 font-heading font-[800] text-2xl text-slate-900">Plans by chamber size</p>
            <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
              Pricing depends on the number of users and the modules your practice needs. Contact us for a quote, or register to see the plans available for your chamber.
            </p>
            <ul className="mt-6 mb-8 space-y-2.5">
              {[
                'Clients, cases, hearings and cause lists',
                'Draft workspace and template library',
                'Legal research, case laws and bare acts',
                'Team members with role-based access',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[14px] text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap gap-3">
              <Link to="/contact" className="btn-primary text-sm">Contact us for pricing <ArrowRight className="w-4 h-4" /></Link>
              <a href={appLinks.advocateLogin()} className="btn-secondary text-sm"><Lock className="w-4 h-4" /> Advocate Login</a>
            </div>
          </div>

          {/* Consumer Portal */}
          <div className="bg-white rounded-3xl border-2 border-[#059669]/40 p-7 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#059669] text-white flex items-center justify-center"><Scale className="w-5 h-5" /></div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#059669]">For citizens & consumers</p>
                <h2 className="font-heading font-[800] text-xl text-slate-900">Consumer Portal</h2>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-heading font-[900] text-3xl text-slate-900">Free</p>
                <p className="mt-1 text-[13px] text-slate-600">Legal guidance for your problem</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-heading font-[900] text-3xl text-slate-900">₹30</p>
                <p className="mt-1 text-[13px] text-slate-600">Per generated document (A4 PDF)</p>
              </div>
            </div>
            <ul className="mt-6 mb-8 space-y-2.5">
              {[
                'Rights, time limits, where to go and documents needed — free',
                'Formal complaint or application addressed to the right authority',
                'Preview and edit before you pay',
                'Pay by UPI; documents saved in your account',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[14px] text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6 border-t border-slate-100 flex flex-wrap gap-3">
              <a href={appLinks.consumerPortal()} className="btn-primary text-sm">Open the Consumer Portal <ArrowRight className="w-4 h-4" /></a>
              <Link to="/consumer-portal" className="btn-secondary text-sm">Learn more</Link>
            </div>
          </div>
        </div>

        <p className="section-container max-w-5xl mt-8 text-center text-[13px] text-slate-500">
          Payments, cancellations and refunds are governed by our <Link to="/refund-policy" className="font-semibold text-[#059669] hover:underline">Refund Policy</Link> and{' '}
          <Link to="/terms-of-service" className="font-semibold text-[#059669] hover:underline">Terms of Service</Link>.
        </p>
      </section>
    </div>
  );
}
