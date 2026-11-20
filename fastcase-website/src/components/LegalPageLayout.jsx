import { Link, useLocation } from 'react-router-dom';
import { Calendar, Scale, ShieldCheck, Mail, Phone, MapPin, Building2, CheckCircle2 } from 'lucide-react';

const legalNavLinks = [
  { name: 'Terms of Service', href: '/terms-of-service' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Refund Policy', href: '/refund-policy' },
  { name: 'Disclaimer', href: '/disclaimer' },
  { name: 'Cookie Policy', href: '/cookie-policy' },
  { name: 'Data Security', href: '/data-security' },
  { name: 'Grievance Officer', href: '/grievance-officer' },
];

export default function LegalPageLayout({ title, subtitle, lastUpdated, children }) {
  const location = useLocation();

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Policy Navigation Tabs ── */}
        <div className="mb-6 overflow-x-auto no-scrollbar py-2">
          <nav className="flex items-center gap-1.5 min-w-max bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            {legalNavLinks.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#013B36] text-[#34D399] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Clean Light Header ── */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-bold text-[#065F46] mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span>Fastcase Legal &amp; Compliance Hub</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-2 tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {lastUpdated && (
              <div className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#013B36]" />
                <span>Effective Date: {lastUpdated}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Legal Card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-6 sm:p-10 md:p-12 legal-prose">
          
          {/* ── Verified Corporate Entity Banner ── */}
          <div className="p-5 bg-gradient-to-r from-[#ECFDF5] via-[#F0FDF4] to-white rounded-2xl border border-[#A7F3D0] mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-[#A7F3D0]/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#013B36] text-[#34D399] flex items-center justify-center shrink-0 shadow-xs">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-900 font-extrabold tracking-tight">
                      SOSM Services Private Limited
                    </p>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#D1FAE5] text-[#065F46] text-[10.5px] font-bold">
                      <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Verified Entity
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Operating the Fastcase Advocate ERP &amp; Legal Management Platform
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs text-slate-600">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#013B36] shrink-0 mt-0.5" />
                <span>B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, MH, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#013B36] shrink-0" />
                <a href="tel:+919405669420" className="hover:text-[#013B36] font-semibold text-slate-800">
                  +91 94056 69420
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#013B36] shrink-0" />
                <a href="mailto:support@fastcase.in" className="hover:text-[#013B36] font-semibold text-slate-800">
                  support@fastcase.in
                </a>
              </div>
            </div>
          </div>

          {/* Page Content */}
          {children}

          {/* ── Help / Contact Footer Strip ── */}
          <div className="not-prose mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-5 rounded-2xl">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Questions or Legal Assistance?</p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                Our compliance and support desk is available Monday through Saturday (9:30 AM – 6:30 PM IST).
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="mailto:support@fastcase.in"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#013B36] text-[#34D399] text-xs font-bold hover:bg-[#02201D] transition-all shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" /> Contact Support
              </a>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all shadow-xs"
              >
                Help Desk
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
