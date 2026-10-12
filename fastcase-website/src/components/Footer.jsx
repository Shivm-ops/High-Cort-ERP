import { Link } from 'react-router-dom';
import {
  Scale, MapPin, Mail, Phone, Linkedin, Youtube, Facebook, Instagram,
} from 'lucide-react';

const footerLinks = {
  Product: [
    { label: 'Features', to: '/features' },
    { label: 'Practice Areas', to: '/practice-areas' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Why Fastcase', to: '/why-Fastcase' },
    { label: 'Integrations', to: '/#integrations' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Contact', to: '/contact' },
    { label: 'FAQ', to: '/faq' },
    { label: 'Grievance Officer', to: '/grievance-officer' },
  ],
  Legal: [
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms of Service', to: '/terms-of-service' },
    { label: 'Refund Policy', to: '/refund-policy' },
    { label: 'Disclaimer', to: '/disclaimer' },
    { label: 'Cookie Policy', to: '/cookie-policy' },
  ],
};

const socialLinks = [
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-[#021513] text-white border-t border-[#013B36]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-10">

          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-8 h-8 bg-amber-400/10 rounded-lg flex items-center justify-center border border-amber-400/20">
                <Scale className="w-4 h-4 text-amber-400" strokeWidth={2} />
              </div>
              <div>
                <p className="font-heading font-[800] text-[18px] tracking-[-0.03em] text-white" style={{ lineHeight: '1.1' }}>
                  Fast<span className="text-amber-400">case</span>
                </p>
                <p className="text-[9px] font-semibold tracking-[0.1em] text-white/30 uppercase" style={{ lineHeight: '1', marginTop: '2px' }}>
                  Fastcase Platform
                </p>
              </div>
            </Link>

            <p className="text-[14px] text-white/50 leading-relaxed mb-5 max-w-xs">
              India's complete legal operating system — built for advocates, law firms and legal professionals.
            </p>

            {/* Address */}
            <div className="flex items-start gap-2.5 mb-4">
              <MapPin className="w-3.5 h-3.5 text-white/30 mt-0.5 flex-shrink-0" />
              <address className="not-italic text-[12px] text-white/40 leading-relaxed">
                SOSM Services Private Limited<br />
                B4/5, Omkar Plaza, Rajaram Road,<br />
                Near ICICI Bank, E Ward, Shahupuri,<br />
                Kolhapur – 416001, Maharashtra, India
              </address>
            </div>

            {/* Registration identifiers */}
            <div className="space-y-1 mb-5">
              <p className="text-[11px] text-white/25">CIN: U70200PN2024PTC236589</p>
              <p className="text-[11px] text-white/25">GSTIN: 27ABOCS9037R1Z6</p>
            </div>

            {/* Contact */}
            <div className="space-y-1.5 text-[12px] text-white/40 mb-6">
              <div className="flex items-center gap-2">
                <Phone className="w-3 h-3 text-white/25" />
                <span>+91 94056 69420</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-white/25" />
                <span>support@Fastcase.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-white/25" />
                <span>contact@Fastcase.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3 h-3 text-white/25" />
                <span>grievance@Fastcase.in</span>
              </div>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2.5">
              {socialLinks.map(({ icon: Icon, label, href }) => (
                <a key={label} href={href} aria-label={label}
                  className="w-8 h-8 rounded-lg bg-white/6 border border-white/8 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-150"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/30 mb-4">{category}</p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l.label}>
                    {l.isExternal ? (
                      <a
                        href={l.href}
                        className="text-[13px] text-white/50 hover:text-white transition-colors duration-150 inline-flex items-center gap-1.5"
                      >
                        <span>{l.label}</span>
                        {l.badge && (
                          <span className="text-[9px] font-semibold bg-white/10 text-[#0EA5A4] px-1.5 py-0.5 rounded border border-white/10">
                            {l.badge}
                          </span>
                        )}
                      </a>
                    ) : (
                      <Link to={l.to}
                        className="text-[13px] text-white/50 hover:text-white transition-colors duration-150"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/25">
            © {new Date().getFullYear()} SOSM Services Private Limited. All rights reserved.
          </p>
          <p className="text-[12px] text-white/20">
            Fastcase is a software platform — not a law firm and does not provide legal advice.
            Jurisdiction: Kolhapur, Maharashtra, India.
          </p>
        </div>
      </div>
    </footer>
  );
}
