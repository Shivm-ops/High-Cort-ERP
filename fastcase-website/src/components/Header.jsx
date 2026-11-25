import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Scale, Lock, ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { appLinks } from '../data/site';

// Simple, stable navigation — every item is a plain link (no hover pop-ups).
const primaryNav = [
  { label: 'Advocate ERP', to: '/advocate-erp' },
  { label: 'Consumer Portal', to: '/consumer-portal' },
  { label: 'Features', to: '/features' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  useEffect(() => { setMobileOpen(false); }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled
        ? 'bg-white/95 backdrop-blur-md border-b border-line shadow-[0_1px_0_rgba(15,23,42,0.06)]'
        : 'bg-white border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px] gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group" aria-label="Fastcase home">
            <div className="w-8 h-8 bg-[#013B36] rounded-lg flex items-center justify-center shadow-[0_1px_3px_rgba(1,59,54,0.35)] group-hover:shadow-[0_2px_8px_rgba(1,59,54,0.45)] transition-shadow">
              <Scale className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <p className="font-heading font-[900] text-[18.5px] tracking-[-0.03em] text-slate-900 leading-none">
                Fast<span className="text-[#059669]">case</span>
              </p>
              <p className="text-[9px] font-bold tracking-[0.08em] text-[#059669] uppercase mt-0.5">
                Legal Technology
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden xl:flex items-center gap-0.5" aria-label="Primary">
            {primaryNav.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-[14px] font-medium transition-colors duration-150 whitespace-nowrap
                  ${isActive ? 'text-primary bg-primary/5 font-semibold' : 'text-ink/70 hover:text-ink hover:bg-surface'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-line dark:border-[#183344] bg-white dark:bg-[#0C1D26] hover:bg-surface dark:hover:bg-[#122734] text-ink/70 hover:text-primary hover:border-primary/40 transition-all shadow-2xs cursor-pointer flex-shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-[18px] h-[18px] text-amber-400" />
              ) : (
                <Moon className="w-[18px] h-[18px] text-slate-700" />
              )}
            </button>

            {/* Consumer Portal box (unchanged style) */}
            <Link
              to="/consumer-portal"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/90 text-xs font-bold text-slate-700 hover:text-[#013B36] hover:border-[#059669]/50 hover:bg-[#ECFDF5] transition whitespace-nowrap shadow-2xs"
              title="Legal help, complaints and applications for citizens"
            >
              <Scale className="w-3.5 h-3.5 text-[#059669]" />
              <span>Consumer Portal</span>
              <span className="text-[9px] font-black bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-1.5 py-0.2 rounded-full">
                Citizen Desk
              </span>
            </Link>

            {/* Advocate Login box (unchanged style) */}
            <a
              href={appLinks.advocateLogin()}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:text-[#013B36] hover:bg-slate-100 transition border border-transparent hover:border-slate-200 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Advocate Login</span>
            </a>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="xl:hidden p-2 rounded-lg text-ink/70 hover:bg-surface transition-colors ml-0.5"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile / tablet menu */}
      {mobileOpen && (
        <div className="xl:hidden border-t border-line bg-white overflow-y-auto h-[calc(100vh-68px)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-1">
            {primaryNav.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-[15px] font-medium transition-colors
                  ${isActive ? 'text-primary bg-primary/5 font-semibold' : 'text-slate-700 hover:bg-surface'}`
                }
              >
                {item.label}
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </NavLink>
            ))}

            <div className="pt-4 mt-2 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Link
                to="/consumer-portal"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-[#ECFDF5] hover:border-[#059669]/50 transition"
              >
                <Scale className="w-4 h-4 text-[#059669]" />
                Consumer Portal
                <span className="text-[9px] font-black bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] px-1.5 py-0.2 rounded-full">
                  Citizen Desk
                </span>
              </Link>
              <a
                href={appLinks.advocateLogin()}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <Lock className="w-4 h-4 text-slate-400" />
                Advocate Login
              </a>
            </div>

            <div className="flex items-center justify-between px-4 py-3 mt-2 rounded-xl border border-line">
              <span className="text-[13px] font-medium text-slate-600">
                Theme: <span className="capitalize">{theme}</span>
              </span>
              <button
                onClick={toggleTheme}
                className="px-3 py-1 rounded-lg text-[12px] font-bold border border-line text-slate-700 hover:text-primary transition-colors"
              >
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
