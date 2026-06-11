import { Printer, Calendar } from 'lucide-react';

export default function LegalPageLayout({ title, subtitle, lastUpdated, children }) {
  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white mb-3">{title}</h1>
              {subtitle && <p className="text-blue-100 text-base max-w-xl">{subtitle}</p>}
            </div>
            <button
              onClick={() => window.print()}
              className="no-print flex-shrink-0 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-1.5 mt-4 text-xs text-blue-200">
              <Calendar className="w-3.5 h-3.5" />
              <span>Last Updated: {lastUpdated}</span>
            </div>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-14 bg-brand-bg dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 md:p-12 legal-prose">
            {/* Company Banner */}
            <div className="p-4 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10 dark:border-primary/20 mb-8">
              <p className="text-sm text-primary dark:text-blue-300 font-semibold">
                SOSM Services Private Limited — LegalOS
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
                B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India
              </p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </div>
  );
}
