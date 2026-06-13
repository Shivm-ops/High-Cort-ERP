import { Link } from 'react-router-dom';
import {
  Scale, MapPin, Mail, Phone, Linkedin, Youtube, Facebook, Instagram,
  Lock, Shield, Users, ClipboardList, FolderOpen, Database,
} from 'lucide-react';

const trustCards = [
  {
    icon: Lock,
    title: '256-bit Data Encryption',
    desc: 'Client records, case files, evidence and documents are protected using industry-standard encryption practices.',
  },
  {
    icon: Shield,
    title: 'Multi-Tenant Data Isolation',
    desc: 'Every law firm operates in its own secure workspace. Firm data remains isolated from all other users.',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    desc: 'Partners, associates, clerks and staff can be assigned specific permissions to protect sensitive data.',
  },
  {
    icon: ClipboardList,
    title: 'Audit Logs',
    desc: 'Maintain complete visibility into platform activity and document access history across your firm.',
  },
  {
    icon: FolderOpen,
    title: 'Secure Document Storage',
    desc: 'Documents and evidence are stored securely with controlled access permissions and version history.',
  },
  {
    icon: Database,
    title: 'Daily Backups',
    desc: 'Regular backup processes help protect business continuity and critical legal records.',
  },
];

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
    { label: 'Data Security', to: '/data-security' },
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
    <>
      {/* ── Trust Banner ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: '#EEF2F7' }} className="border-t border-line py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[11px] font-[700] uppercase tracking-[0.1em] text-[#0EA5A4] mb-3">Security & Trust</p>
            <h2 className="font-heading font-[800] text-2xl lg:text-3xl tracking-tight text-[#0F172A]">
              Built for Security, Privacy and Professional Responsibility
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="bg-white border border-[#E2E8F0] rounded-xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#0EA5A4]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#0EA5A4]" />
                  </div>
                  <div>
                    <p className="font-heading font-[700] text-[14px] text-[#0F172A] mb-1">{card.title}</p>
                    <p className="text-[13px] text-[#475569] leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Main Footer ──────────────────────────────────────────────── */}
      <footer className="bg-[#0F172A] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            {/* Brand column */}
            <div className="lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-5 group">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                  <Scale className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-heading font-[800] text-[18px] tracking-[-0.03em] text-white" style={{ lineHeight: '1.1' }}>
                    Fast<span className="text-[#0EA5A4]">case</span>
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

              {/* Corporate identifiers */}
              <div className="space-y-1.5 mb-4">
                <p className="text-[11px] text-white/30">
                  <span className="text-white/20">CIN:</span> U70200PN2024PTC236589
                </p>
                <p className="text-[11px] text-white/30">
                  <span className="text-white/20">GSTIN:</span> 27ABOCS9037R1Z6
                </p>
              </div>

              {/* Contact details */}
              <div className="space-y-1.5 mb-5">
                <a href="tel:+919405669420"
                  className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
                >
                  <Phone className="w-3 h-3" /> +91 94056 69420
                </a>
                <a href="mailto:support@Fastcase.in"
                  className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
                >
                  <Mail className="w-3 h-3" /> support@Fastcase.in
                </a>
                <a href="mailto:contact@Fastcase.in"
                  className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
                >
                  <Mail className="w-3 h-3" /> contact@Fastcase.in
                </a>
                <a href="mailto:grievance@Fastcase.in"
                  className="flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/70 transition-colors"
                >
                  <Mail className="w-3 h-3" /> grievance@Fastcase.in
                </a>
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
                      <Link to={l.to}
                        className="text-[13px] text-white/50 hover:text-white transition-colors duration-150"
                      >
                        {l.label}
                      </Link>
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
    </>
  );
}
