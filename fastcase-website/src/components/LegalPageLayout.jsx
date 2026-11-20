import { Printer, Calendar, Scale } from 'lucide-react';

export default function LegalPageLayout({ title, subtitle, lastUpdated, children }) {
  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Clean Light Header */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 mb-3">
                <Scale className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fastcase Legal &amp; Compliance</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-2 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              onClick={() => window.print()}
              className="no-print self-start flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              Print Document
            </button>
          </div>

          {lastUpdated && (
            <div className="flex items-center gap-1.5 mt-4 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          )}
        </div>

        {/* Content Card */}
        <div className="card p-6 sm:p-10 md:p-12 legal-prose bg-white rounded-3xl shadow-xs border border-slate-200/90">
          {/* Company Banner */}
          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 mb-8 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#013B36] text-[#34D399] flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm text-emerald-950 font-bold tracking-tight">
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
    </div>
  );
}
