import { Link } from 'react-router-dom';
import { Scale, Target, Eye, MapPin, ArrowRight, CheckCircle, Building2, Award } from 'lucide-react';

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

const team = [
  {
    initials: 'AP',
    name: 'Abhijit Patil',
    role: 'Founder',
    badges: ['SEBI Registered Analyst', 'ACFE (USA)'],
    bio: 'Leads product vision, bringing forensic rigor and financial analytics to advocate operations.',
  },
  {
    initials: 'P',
    name: 'Priyankka',
    role: 'Management Team',
    badges: ['Strategy & Operations'],
    bio: 'Oversees operational strategy, business execution, and firm onboarding across the platform.',
  },
  {
    initials: 'BP',
    name: 'Bhupal Pujari',
    role: 'Director',
    company: 'SOSM Services Pvt Ltd',
    badges: ['Corporate Leadership'],
    bio: 'Drives strategic partnerships, compliance, and enterprise growth at SOSM Services.',
  },
  {
    initials: 'SJ',
    name: 'Shweta Jadhav',
    role: 'DevOps Engineer',
    badges: ['Cloud & Infrastructure'],
    bio: 'Manages cloud infrastructure, continuous deployment, and platform reliability ensuring 99.9% uptime.',
  },
];

export default function About() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-16">
        <div className="section-container text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-white text-[12px] font-[700] tracking-wider uppercase px-4 py-1.5 rounded-full mb-5">
            About Fastcase
          </span>
          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight text-white mb-4">
            Transforming Indian Legal Practice
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-xl mx-auto">
            Empowering advocates and law firms with smart, cloud-based practice management tools.
          </p>
        </div>
      </section>

      {/* Story & Mission */}
      <section className="section-padding bg-white border-b border-line">
        <div className="section-container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6 border-l-4 border-[#0F4C81]">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-[#0F4C81]" />
                <h2 className="font-heading font-[700] text-lg text-ink">Our Mission</h2>
              </div>
              <p className="text-[13px] text-ink/65 leading-relaxed">
                To replace fragmented spreadsheets and paper registers with an intelligent, integrated workspace that automates casework, diary tracking, and billing for advocates across India.
              </p>
            </div>
            <div className="card p-6 border-l-4 border-[#16A34A]">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-5 h-5 text-[#16A34A]" />
                <h2 className="font-heading font-[700] text-lg text-ink">Built for Advocates</h2>
              </div>
              <p className="text-[13px] text-ink/65 leading-relaxed">
                Designed specifically for Indian district and high courts, supporting multi-language drafting (English, Marathi, Hindi, Gujarati), limitation deadlines, and GST-compliant invoicing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-surface">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="eyebrow mb-2">Leadership & Engineering</p>
            <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-ink">The Fastcase Team</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {team.map((m) => (
              <div key={m.name} className="card p-5 flex flex-col justify-between hover:shadow-card-hover transition-all">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#0F4C81]/10 border border-[#0F4C81]/20 flex items-center justify-center flex-shrink-0 font-bold text-[#0F4C81] text-xs">
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-[700] text-ink text-[14px] leading-tight truncate">{m.name}</p>
                      <p className="text-[11px] font-[600] text-teal uppercase tracking-wide mt-0.5">{m.role}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-ink/60 leading-relaxed mb-3">{m.bio}</p>
                </div>
                <div className="flex flex-wrap gap-1 pt-3 border-t border-line">
                  {m.badges.map((b) => (
                    <span key={b} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="section-padding-sm bg-white border-t border-line">
        <div className="section-container max-w-3xl">
          <div className="card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-[#0F4C81] rounded-lg flex items-center justify-center text-white">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-[800] text-base text-ink">SOSM Services Private Limited</h3>
                  <p className="text-[12px] text-ink/50">Incorporated under Companies Act, 2013 · India</p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-ink/60 text-[12px] mt-3">
                <MapPin className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                <span>B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#16A34A] bg-[#16A34A]/8 border border-[#16A34A]/20 px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> GST Registered
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-sm" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }}>
        <div className="section-container text-center">
          <h2 className="font-heading font-[800] text-2xl sm:text-3xl tracking-tight text-white mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-white/65 text-sm sm:text-base mb-6 max-w-md mx-auto">
            Join advocates and legal professionals modernizing their practice with Fastcase.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`${getErpUrl()}/register`}
              className="inline-flex items-center gap-2 bg-white text-[#0F4C81] font-[700] text-[14px] px-6 py-3 rounded-xl hover:bg-white/90 transition-all duration-150 shadow-md"
            >
              Registration <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href={`${getErpUrl()}/login`}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-[600] text-[14px] px-6 py-3 rounded-xl hover:bg-white/15 transition-all duration-150"
            >
              Advocate Login
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
