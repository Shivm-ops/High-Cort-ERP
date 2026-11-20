import { Printer, Calendar, Scale } from 'lucide-react';

export default function LegalPageLayout({ title, subtitle, lastUpdated, children }) {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-14 bg-gradient-to-br from-[#021F1B] via-[#03362E] to-[#02201D] text-white overflow-hidden border-b border-[#05483D]/50">
        {/* Subtle Ambient Dot Grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#34D399]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-bold text-[#6EE7B7] mb-3">
                <Scale className="w-3.5 h-3.5 text-[#34D399]" />
                <span>Fastcase Legal & Compliance</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-white mb-2 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[#A7F3D0] text-sm sm:text-base max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="no-print self-start flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4 text-[#34D399]" />
              Print Document
            </button>
          </div>

          {lastUpdated && (
            <div className="flex items-center gap-1.5 mt-5 text-xs text-[#6EE7B7] font-semibold">
              <Calendar className="w-3.5 h-3.5 text-[#34D399]" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-12 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-6 sm:p-10 md:p-12 legal-prose bg-white rounded-3xl shadow-sm border border-slate-200/90">
            {/* Company Banner */}
            <div className="p-4 bg-[#ECFDF5] rounded-2xl border border-[#A7F3D0] mb-8 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#013B36] text-[#34D399] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm text-[#065F46] font-extrabold tracking-tight">
                  SOSM Services Private Limited — Fastcase Platform
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India
                </p>
              </div>
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
