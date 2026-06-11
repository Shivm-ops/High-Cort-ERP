import { Link } from 'react-router-dom';
import { Scale, Target, Eye, MapPin, ArrowRight, CheckCircle, Users, Building2, Briefcase, Award } from 'lucide-react';

const team = [
  {
    initials: 'AP',
    name: 'Abhijit Patil',
    role: 'Founder',
    badges: ['SEBI Registered Research Analyst', 'Member of ACFE (USA)'],
    bio: 'Abhijit founded LegalOS with a clear vision: to give Indian legal professionals the same operational intelligence that large enterprises take for granted. With a background in financial research and forensic accounting, he brings both analytical rigour and deep market understanding to the platform.',
  },
  {
    initials: 'P',
    name: 'Priyankka',
    role: 'Management Team',
    badges: ['Strategic Planning', 'Operations & Growth'],
    bio: "Priyankka is an integral part of the Management Team at LegalOS, where she plays a key role in strategic planning, operational oversight, and long-term organisational development. Her leadership ensures that every product decision and business process is aligned with the company's mission.",
  },
  {
    initials: 'BP',
    name: 'Bhupal Pujari',
    role: 'Director',
    company: 'SOSM Services Pvt Ltd',
    badges: ['Director'],
    bio: "As Director of SOSM Services Pvt Ltd, Bhupal brings strong leadership and strategic vision to LegalOS, guiding the company's growth, business development, and market expansion across key verticals.",
  },
  {
    initials: 'SP',
    name: 'Shivam Patil',
    role: 'DevOps Engineer',
    badges: ['DevOps Engineer'],
    bio: 'Shivam contributes as DevOps Engineer, managing deployments, infrastructure reliability, and ensuring the LegalOS platform remains secure, scalable, and always available.',
  },
];

const values = [
  {
    icon: Target,
    title: 'Advocate-First Design',
    desc: 'Every feature is built around how Indian advocates actually work — not adapted from foreign legal software.',
  },
  {
    icon: Eye,
    title: 'Transparency',
    desc: 'Clear pricing, no hidden charges, and complete data ownership for all users.',
  },
  {
    icon: Scale,
    title: 'Integrity',
    desc: 'We handle sensitive legal data with the highest standards of security and confidentiality.',
  },
  {
    icon: Users,
    title: 'Empowering Advocates',
    desc: 'Helping advocates of all scales — solo practitioners to large firms — compete with the best.',
  },
];

const audiences = [
  { icon: Briefcase, label: 'Individual Advocates', desc: 'Solo practitioners managing their complete practice.' },
  { icon: Building2, label: 'Law Firms', desc: 'Multi-user teams with role-based access and workflows.' },
  { icon: Users, label: 'Legal Consultants', desc: 'Consultants managing multiple client relationships.' },
  { icon: Scale, label: 'Litigation Teams', desc: 'Coordinated teams handling complex litigations.' },
  { icon: Target, label: 'Corporate Legal Depts.', desc: 'In-house legal teams managing company matters.' },
];

export default function About() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-20">
        <div className="section-container text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 border border-white/20 rounded-2xl mb-6">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-[900] text-4xl md:text-5xl tracking-tight text-white mb-5">
            About LegalOS
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            We are building India's most comprehensive Advocate Practice Management Software —
            designed to bring the full power of modern technology to every legal professional.
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="section-padding bg-white border-b border-line">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <span className="eyebrow mb-3">Our Story</span>
              <h2 className="section-heading text-3xl mb-5">
                Born from the Heart of India's Legal Community
              </h2>
              <div className="space-y-4 text-[15px] text-ink/60 leading-relaxed">
                <p>
                  LegalOS was created by <strong className="text-ink font-semibold">SOSM Services Private Limited</strong>,
                  a technology company headquartered in Kolhapur, Maharashtra, India.
                  We saw firsthand the challenges Indian advocates face: managing hundreds of clients,
                  juggling court dates, drafting documents in multiple languages, handling billing,
                  and staying on top of compliance — all without adequate software support.
                </p>
                <p>
                  Most legal software available in India was either too expensive, designed for
                  Western legal systems, or required extensive technical knowledge to operate.
                  Advocates were relying on spreadsheets, paper registers, and disconnected tools.
                </p>
                <p>
                  We built LegalOS to change that — a single, unified platform that handles
                  every aspect of legal practice management, designed specifically for Indian
                  advocates, in the languages they speak, with the workflows they follow.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="card p-6 border-l-4 border-[#0F4C81]">
                <h3 className="font-heading font-[700] text-[#0F4C81] mb-2 text-lg">Our Mission</h3>
                <p className="text-ink/60 text-sm leading-relaxed">
                  To empower every Indian advocate with enterprise-grade technology that automates
                  practice management, improves client service, and enables growth — at a price
                  accessible to practitioners of every scale.
                </p>
              </div>
              <div className="card p-6 border-l-4 border-[#16A34A]">
                <h3 className="font-heading font-[700] text-[#16A34A] mb-2 text-lg">Our Vision</h3>
                <p className="text-ink/60 text-sm leading-relaxed">
                  A future where every advocate in India — from a first-year junior in a district
                  court to a senior partner in a high court — operates their practice with the
                  same efficiency, organization, and professionalism as the best law firms in the world.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding" style={{ backgroundColor: '#EEF2F7' }}>
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="eyebrow mb-3">What We Stand For</p>
            <h2 className="section-heading text-3xl">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="card p-6 text-center">
                  <div className="w-12 h-12 bg-[#0F4C81]/8 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-[#0F4C81]" />
                  </div>
                  <h3 className="font-heading font-[700] text-ink mb-2">{v.title}</h3>
                  <p className="text-sm text-ink/60 leading-relaxed">{v.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="section-padding bg-white border-b border-line">
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="eyebrow mb-3">Who We Serve</p>
            <h2 className="section-heading text-3xl mb-3">Built For Every Legal Professional</h2>
            <p className="text-ink/50 max-w-xl mx-auto">
              LegalOS serves the full spectrum of legal professionals across India.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {audiences.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.label} className="card-hover p-5 text-center group">
                  <div className="w-11 h-11 bg-[#0EA5A4]/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-[#0EA5A4] transition-all duration-200">
                    <Icon className="w-5 h-5 text-[#0EA5A4] group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-sm font-heading font-[600] text-ink mb-1.5">{a.label}</h3>
                  <p className="text-xs text-ink/50 leading-relaxed">{a.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding" style={{ backgroundColor: '#EEF2F7' }}>
        <div className="section-container">
          <div className="text-center mb-14">
            <p className="eyebrow mb-3">Our Team</p>
            <h2 className="section-heading text-3xl mb-3">The People Behind LegalOS</h2>
            <p className="text-ink/50 max-w-xl mx-auto">
              A dedicated team of legal technology professionals, engineers, and domain experts
              working to transform how India practises law.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="card p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0F4C81]/10 border-2 border-[#0F4C81]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-heading font-[700] text-[#0F4C81]">
                      {member.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-heading font-[700] text-ink text-sm leading-tight">
                      {member.name}
                    </p>
                    <p className="text-xs font-[600] text-[#0EA5A4] uppercase tracking-wide mt-0.5">
                      {member.role}
                      {member.company && (
                        <span className="text-ink/40 font-normal normal-case tracking-normal">
                          {' · '}{member.company}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {member.badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1 text-xs font-[500] px-2.5 py-1 rounded-full bg-[#0F4C81]/6 text-[#0F4C81] border border-[#0F4C81]/12"
                    >
                      <Award className="w-3 h-3" />
                      {b}
                    </span>
                  ))}
                </div>

                <hr className="border-line" />

                <p className="text-sm text-ink/60 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="section-padding bg-white border-b border-line">
        <div className="section-container max-w-4xl">
          <div className="card p-8 md:p-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-[#0F4C81] rounded-xl flex items-center justify-center">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="font-heading font-[800] text-xl text-[#0F4C81]">
                  SOSM Services Private Limited
                </h2>
                <p className="text-sm text-ink/50">Registered Company · India</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xs font-[700] text-ink/40 uppercase tracking-wider mb-3">
                  Registered Address
                </h3>
                <div className="flex items-start gap-2 text-ink/60">
                  <MapPin className="w-4 h-4 mt-1 text-[#0EA5A4] flex-shrink-0" />
                  <address className="not-italic text-sm leading-relaxed">
                    B4/5, Omkar Plaza,<br />
                    Rajaram Road, Near ICICI Bank,<br />
                    E Ward, Shahupuri,<br />
                    Kolhapur – 416001,<br />
                    Maharashtra, India
                  </address>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-[700] text-ink/40 uppercase tracking-wider mb-3">
                  Company Details
                </h3>
                <ul className="space-y-2 text-sm text-ink/60">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                    Incorporated under Companies Act, 2013
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                    GST Registered Entity
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                    Operations from Kolhapur, Maharashtra
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                    Jurisdiction: Kolhapur Courts
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-sm" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }}>
        <div className="section-container text-center">
          <h2 className="font-heading font-[800] text-3xl tracking-tight text-white mb-4">
            Experience LegalOS Today
          </h2>
          <p className="text-white/60 mb-8">
            Start your free trial and discover how LegalOS can transform your legal practice.
          </p>
          <Link to="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#0F4C81] font-[600] text-[15px] px-7 py-3.5 rounded-xl hover:bg-white/90 transition-all duration-150 shadow-lg"
          >
            Get Started Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
