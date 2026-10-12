import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu, X, Sun, Moon, Scale, ChevronDown, ArrowRight,
  Users, Calendar, FileText, CreditCard, Search, Briefcase, Shield,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const featuresMenu = [
  {
    id: 'client',
    label: 'Client Management',
    desc: 'CRM, KYC & client portal',
    to: '/features',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    image: '/screenshots/dashboard.webp',
    tag: 'CRM & Client Records',
    highlight: 'Centralized client directory with automated KYC records, Aadhaar/PAN vaults, and client case history.',
  },
  {
    id: 'case',
    label: 'Case & Matter Tracking',
    desc: 'Full case lifecycle management',
    to: '/features',
    icon: Briefcase,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    image: '/screenshots/case-management.webp',
    tag: 'Matter Lifecycle',
    highlight: 'CNR tracking, automated cause lists, filing readiness, and multi-bench hearing schedules.',
  },
  {
    id: 'hearing',
    label: 'Hearing Management',
    desc: 'Calendar, diary & reminders',
    to: '/features',
    icon: Calendar,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    image: '/screenshots/hearing-prep.webp',
    tag: 'Hearing Diary',
    highlight: 'Smart court calendar with daily cause lists, limitation dates, and automated court alerts.',
  },
  {
    id: 'draft',
    label: 'Draft Automation',
    desc: 'Templates & auto-population',
    to: '/features',
    icon: FileText,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    image: '/screenshots/draft-workspace.png',
    tag: 'Draft Library',
    highlight: '500+ verified legal templates with 1-click client data auto-population and Word/PDF export.',
  },
  {
    id: 'billing',
    label: 'Billing & Invoicing',
    desc: 'GST invoices & payment tracking',
    to: '/features',
    icon: CreditCard,
    color: 'text-green-600',
    bg: 'bg-green-50',
    image: '/screenshots/billing-invoicing.png',
    tag: 'GST & Fee Ledger',
    highlight: 'GST-compliant legal fee invoices, trust account retainers, and automated payment receipts.',
  },
  {
    id: 'research',
    label: 'Legal Research',
    desc: 'Case laws & AI research',
    to: '/features',
    icon: Search,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    image: '/screenshots/legal-research.png',
    tag: 'Case Law Vault',
    highlight: 'Searchable judgments, bare acts citation linking, and structured research briefs.',
  },
];

const primaryNav = [
  { label: 'Features', to: '/features', hasMenu: true },
  { label: 'Practice Areas', to: '/practice-areas' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

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

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(featuresMenu[0]);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => { setMobileOpen(false); setFeaturesOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setFeaturesOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-line shadow-[0_1px_0_rgba(15,23,42,0.06)]'
        : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_1px_3px_rgba(1,59,54,0.35)] group-hover:shadow-[0_2px_8px_rgba(1,59,54,0.35)] transition-shadow">
              <Scale className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-heading font-[800] text-[18px] tracking-[-0.03em] text-ink" style={{ lineHeight: '1.1' }}>
                Fast<span className="text-primary">case</span>
              </p>
              <p className="text-[9px] font-semibold tracking-[0.1em] text-ink/30 uppercase" style={{ lineHeight: '1', marginTop: '2px' }}>
                Fastcase Platform
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNav.map((item) =>
              item.hasMenu ? (
                <div
                  key={item.label}
                  className="relative"
                  ref={dropdownRef}
                  onMouseEnter={() => setFeaturesOpen(true)}
                  onMouseLeave={() => setFeaturesOpen(false)}
                >
                  <button
                    id="features-dropdown-button"
                    onClick={() => setFeaturesOpen(o => !o)}
                    className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors duration-150
                      ${featuresOpen ? 'text-primary bg-primary/5' : 'text-ink/70 hover:text-ink hover:bg-surface'}`}
                  >
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {featuresOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-[840px] bg-white rounded-2xl border border-line shadow-[0_24px_70px_-12px_rgba(15,23,42,0.18),0_6px_20px_-4px_rgba(15,23,42,0.08)] z-50 overflow-hidden">
                      {/* Dropdown header */}
                      <div className="px-6 pt-3.5 pb-2.5 border-b border-line flex items-center justify-between bg-slate-50/70">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-[11px] font-[700] text-ink/60 uppercase tracking-[0.1em]">Platform Features & Modules</p>
                        </div>
                        <span className="text-[11px] font-medium text-ink/40">Hover over any module to preview live screen</span>
                      </div>

                      {/* Content: 2 Columns */}
                      <div className="p-4 grid grid-cols-12 gap-4">
                        {/* Left: 6 Features with image thumbnails (7 cols) */}
                        <div className="col-span-7 grid grid-cols-1 gap-1.5">
                          {featuresMenu.map((f) => {
                            const Icon = f.icon;
                            const isActive = activeFeature.id === f.id;
                            return (
                              <Link
                                key={f.id}
                                to={f.to}
                                onMouseEnter={() => setActiveFeature(f)}
                                className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-150 group/item border ${
                                  isActive
                                    ? 'bg-primary/5 border-primary/25 shadow-xs'
                                    : 'border-transparent hover:bg-surface hover:border-line'
                                }`}
                              >
                                {/* Mini Image Thumbnail */}
                                <div className="relative w-14 h-11 rounded-lg overflow-hidden border border-line bg-slate-100 flex-shrink-0 shadow-xs group-hover/item:border-primary/40 transition-colors">
                                  <img
                                    src={f.image}
                                    alt={f.label}
                                    className="w-full h-full object-cover object-top"
                                    loading="eager"
                                  />
                                  <div className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-md ${f.bg} flex items-center justify-center shadow-xs border border-white/60`}>
                                    <Icon className={`w-2.5 h-2.5 ${f.color}`} />
                                  </div>
                                </div>

                                {/* Title & Subtitle */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-[13px] font-[600] leading-tight transition-colors ${isActive ? 'text-primary font-bold' : 'text-ink'}`}>
                                      {f.label}
                                    </p>
                                  </div>
                                  <p className="text-[11px] text-ink/50 mt-0.5 leading-snug line-clamp-1">{f.desc}</p>
                                </div>

                                {/* Arrow Indicator */}
                                <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                                  isActive ? 'text-primary translate-x-0.5 opacity-100' : 'text-ink/20 opacity-0 group-hover/item:opacity-100'
                                }`} />
                              </Link>
                            );
                          })}
                        </div>

                        {/* Right: Live Module Preview Showcase (5 cols) */}
                        <div className="col-span-5 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/80 rounded-xl border border-line p-3.5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {activeFeature.tag}
                              </span>
                              <span className="text-[10px] font-bold text-ink/30 uppercase tracking-wider">Module Preview</span>
                            </div>

                            {/* Screenshot Showcase */}
                            <div className="relative w-full h-[145px] rounded-lg overflow-hidden border border-line/90 shadow-sm bg-white mb-2.5 group">
                              <img
                                src={activeFeature.image}
                                alt={activeFeature.label}
                                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                              <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                                <p className="text-[12px] font-bold drop-shadow-sm leading-tight">{activeFeature.label}</p>
                              </div>
                            </div>

                            <p className="text-[11px] text-ink/65 leading-relaxed line-clamp-2">
                              {activeFeature.highlight}
                            </p>
                          </div>

                          <Link
                            to={activeFeature.to}
                            className="mt-3 w-full py-2 px-3 rounded-lg bg-white border border-line hover:border-primary/40 hover:text-primary text-[12px] font-semibold text-ink flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
                          >
                            Explore in Platform <ArrowRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="px-6 py-2.5 bg-surface border-t border-line flex items-center justify-between">
                        <p className="text-[11px] text-ink/45 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-primary/70" />
                          16 integrated modules · Tailored for High Court & District Court advocates
                        </p>
                        <Link
                          to="/features"
                          className="flex items-center gap-1.5 text-[12px] font-[600] text-primary hover:text-hover transition-colors"
                        >
                          View all 16 features <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink key={item.label} to={item.to}
                  className={({ isActive }) =>
                    `px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors duration-150
                    ${isActive ? 'text-primary bg-primary/5' : 'text-ink/70 hover:text-ink hover:bg-surface'}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Responsive Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-line bg-white hover:bg-surface text-ink/70 hover:text-primary hover:border-primary/40 transition-all shadow-2xs cursor-pointer flex-shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] text-amber-500 transition-transform hover:rotate-45" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-slate-700 transition-transform hover:-rotate-12" />
              )}
            </button>

            {/* Direct Login Button */}
            <a
              href={`${getErpUrl()}/login`}
              className="hidden sm:inline-flex items-center btn-secondary text-[14px] py-2 px-4 rounded-lg border border-line font-medium hover:border-primary/40 hover:text-primary transition-colors"
            >
              Login
            </a>

            {/* Direct Registration Button */}
            <a
              href={`${getErpUrl()}/register`}
              className="btn-primary text-[13px] sm:text-[14px] py-2 px-3.5 sm:px-4 rounded-lg whitespace-nowrap"
            >
              Registration
            </a>

            <button onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu"
              className="lg:hidden p-2 rounded-lg text-ink/60 hover:bg-surface transition-colors ml-0.5"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-line bg-white overflow-y-auto max-h-[85vh]">
          <div className="px-4 py-4 space-y-1">
            {/* Mobile Theme Toggle Row */}
            <div className="flex items-center justify-between px-3 py-2.5 mb-3 rounded-xl bg-surface border border-line">
              <span className="text-[13px] font-semibold text-ink flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
                Theme: <span className="capitalize text-ink/70 font-medium">{theme}</span>
              </span>
              <button
                onClick={toggleTheme}
                className="px-3 py-1 rounded-lg text-[12px] font-bold border border-line bg-white text-ink hover:text-primary shadow-2xs transition-colors cursor-pointer"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>

            <NavLink to="/features"
              className={({ isActive }) =>
                `block px-4 py-3 rounded-xl text-[15px] font-semibold transition-colors
                ${isActive ? 'text-primary bg-primary/5' : 'text-ink/80 hover:text-ink hover:bg-surface'}`
              }
            >
              Features
            </NavLink>

            {/* Mobile Feature Sub-Items with Images */}
            <div className="px-2 py-1 space-y-1 mb-2">
              <p className="px-2 text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1">Key Modules</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {featuresMenu.map((f) => (
                  <Link
                    key={f.id}
                    to={f.to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-surface/60 hover:bg-surface transition-colors border border-line/60"
                  >
                    <img src={f.image} alt={f.label} className="w-10 h-8 rounded-md object-cover object-top border border-line flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-ink leading-tight truncate">{f.label}</p>
                      <p className="text-[10px] text-ink/45 truncate">{f.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {primaryNav.filter(item => !item.hasMenu).map((item) => (
              <NavLink key={item.label} to={item.to}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-[15px] font-medium transition-colors
                  ${isActive ? 'text-primary bg-primary/5' : 'text-ink/70 hover:text-ink hover:bg-surface'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-line space-y-2">
              <a href={`${getErpUrl()}/login`} className="btn-secondary w-full rounded-xl block text-center py-2.5 px-4 font-medium">
                Login
              </a>
              <a href={`${getErpUrl()}/register`} className="btn-primary w-full rounded-xl block text-center py-2.5 px-4">
                Registration
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
