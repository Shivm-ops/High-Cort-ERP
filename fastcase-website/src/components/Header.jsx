import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu, X, Sun, Moon, Scale, ChevronDown, ArrowRight,
  Users, Calendar, FileText, CreditCard, Search, Briefcase, Shield,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const featuresMenu = [
  { label: 'Client Management', desc: 'CRM, KYC & client portal', to: '/features', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Case & Matter Tracking', desc: 'Full case lifecycle management', to: '/features', icon: Briefcase, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Hearing Management', desc: 'Calendar, diary & reminders', to: '/features', icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-50' },
  { label: 'Draft Automation', desc: 'Templates & auto-population', to: '/features', icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'Billing & Invoicing', desc: 'GST invoices & payment tracking', to: '/features', icon: CreditCard, color: 'text-green-600', bg: 'bg-green-50' },
  { label: 'Legal Research', desc: 'Case laws & AI research', to: '/features', icon: Search, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

const primaryNav = [
  { label: 'Features', to: '/features', hasMenu: true },
  { label: 'Practice Areas', to: '/practice-areas' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const ERP_APP_URL = import.meta.env.VITE_ERP_APP_URL || "http://localhost:3000";
const ADMIN_APP_URL = import.meta.env.VITE_ADMIN_APP_URL || "http://localhost:3001";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const portalDropdownRef = useRef(null);

  useEffect(() => { setMobileOpen(false); setFeaturesOpen(false); setPortalOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setFeaturesOpen(false);
      if (portalDropdownRef.current && !portalDropdownRef.current.contains(e.target)) setPortalOpen(false);
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
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-[0_1px_3px_rgba(15,76,129,0.3)] group-hover:shadow-[0_2px_8px_rgba(15,76,129,0.3)] transition-shadow">
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
                <div key={item.label} className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setFeaturesOpen(o => !o)}
                    className={`flex items-center gap-1 px-3.5 py-2 rounded-lg text-[14px] font-medium transition-colors duration-150
                      ${featuresOpen ? 'text-primary bg-primary/5' : 'text-ink/70 hover:text-ink hover:bg-surface'}`}
                  >
                    {item.label}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${featuresOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {featuresOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2.5 w-[480px] bg-white rounded-2xl border border-line shadow-[0_20px_60px_-10px_rgba(15,23,42,0.12),0_4px_16px_-4px_rgba(15,23,42,0.06)] z-50 overflow-hidden">
                      {/* Dropdown header */}
                      <div className="px-5 pt-4 pb-3 border-b border-line">
                        <p className="text-[11px] font-[700] text-ink/35 uppercase tracking-[0.1em]">Platform Features</p>
                      </div>

                      {/* Feature grid */}
                      <div className="p-3 grid grid-cols-2 gap-1">
                        {featuresMenu.map((f) => {
                          const Icon = f.icon;
                          return (
                            <Link key={f.label} to={f.to}
                              className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group/item"
                            >
                              <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0 group-hover/item:scale-105 transition-transform duration-150`}>
                                <Icon className={`w-4 h-4 ${f.color}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-[600] text-ink leading-tight">{f.label}</p>
                                <p className="text-[11px] text-ink/45 mt-0.5 leading-snug">{f.desc}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>

                      {/* Footer */}
                      <div className="px-5 py-3 bg-surface border-t border-line flex items-center justify-between">
                        <p className="text-[11px] text-ink/40">16 modules · built for Indian advocates</p>
                        <Link to="/features"
                          className="flex items-center gap-1.5 text-[12px] font-[600] text-primary hover:text-hover transition-colors"
                        >
                          View all features <ArrowRight className="w-3 h-3" />
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
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} aria-label="Toggle theme"
              className="hidden sm:flex p-2 rounded-lg text-ink/40 hover:text-ink/70 hover:bg-surface transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>

            {/* Portals Dropdown */}
            <div className="relative" ref={portalDropdownRef}>
              <button
                onClick={() => setPortalOpen((o) => !o)}
                className="hidden sm:inline-flex items-center gap-1.5 btn-secondary text-[14px] py-2 px-3.5 rounded-lg border border-line"
              >
                <span>Portal Login</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${portalOpen ? 'rotate-180' : ''}`} />
              </button>

              {portalOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-line py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1.5 border-b border-line mb-1">
                    <p className="text-[11px] font-bold text-ink/40 uppercase tracking-wider">Access Portals</p>
                  </div>
                  
                  {/* User Portal (Domain) */}
                  <a
                    href={ERP_APP_URL}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-surface transition-colors rounded-lg mx-1 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-ink group-hover:text-primary transition-colors">User Portal</span>
                        <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">Domain</span>
                      </div>
                      <p className="text-[11px] text-ink/50 mt-0.5">Advocate & Firm ERP Workspace</p>
                    </div>
                  </a>

                  {/* Super Admin Portal (Subdomain) */}
                  <a
                    href={ADMIN_APP_URL}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-surface transition-colors rounded-lg mx-1 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-ink group-hover:text-amber-600 transition-colors">Super Admin</span>
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Subdomain</span>
                      </div>
                      <p className="text-[11px] text-ink/50 mt-0.5">Tenant & System Control Panel</p>
                    </div>
                  </a>
                </div>
              )}
            </div>

            <Link to="/contact" className="btn-primary text-[14px] py-2 px-4 rounded-lg">
              Start Free Trial
            </Link>

            <button onClick={() => setMobileOpen(o => !o)} aria-label="Toggle menu"
              className="lg:hidden p-2 rounded-lg text-ink/60 hover:bg-surface transition-colors ml-1"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-line bg-white overflow-y-auto max-h-[80vh]">
          <div className="px-4 py-4 space-y-1">
            {primaryNav.map((item) => (
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
              <p className="text-[11px] font-bold text-ink/40 uppercase tracking-wider px-1">Access Portals</p>
              <a href={ERP_APP_URL} className="btn-secondary w-full rounded-xl flex items-center justify-between py-2.5 px-4 text-left">
                <span>Advocate Workspace (User)</span>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">Domain</span>
              </a>
              <a href={ADMIN_APP_URL} className="btn-secondary w-full rounded-xl flex items-center justify-between py-2.5 px-4 text-left">
                <span>Super Admin Portal</span>
                <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200">Subdomain</span>
              </a>
              <Link to="/contact" className="btn-primary w-full rounded-xl text-center block mt-2">Start Free Trial</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
