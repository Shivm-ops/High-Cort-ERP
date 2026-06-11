import { Link } from 'react-router-dom';
import {
  Users, Scale, FileText, Zap, MessageSquare, FolderOpen, ClipboardList,
  Calendar, Gavel, Package, BookOpen, Search, CreditCard, Monitor,
  Bell, Globe, ArrowRight, CheckCircle
} from 'lucide-react';

const features = [
  {
    id: 1, icon: Users, title: 'Client Management', subtitle: 'Complete CRM for Legal Practices',
    color: 'text-blue-600', bg: 'bg-blue-50',
    items: ['Client Registration & CRM', 'Client Profile Management', 'PAN & Aadhaar Storage', 'KYC Records Management', 'Contact Management', 'Complete Client History'],
    benefits: 'Faster onboarding, better organization, centralized records for every client.',
  },
  {
    id: 2, icon: Scale, title: 'Case & Matter Management', subtitle: 'Full Visibility Over Every Case',
    color: 'text-violet-600', bg: 'bg-violet-50',
    items: ['Matter Creation & Tracking', 'Practice Area Management', 'Court Management', 'Appeal Tracking', 'Case Timeline View', 'Opposite Party Tracking'],
    benefits: 'Complete matter visibility and improved case control for complex litigations.',
  },
  {
    id: 3, icon: FileText, title: 'Draft Library Management', subtitle: 'Multi-Language Legal Templates',
    color: 'text-teal-600', bg: 'bg-teal-50',
    items: ['Legal Draft Repository', 'Multi-language Drafts (EN, MR, HI, GU)', 'Editable Templates', 'Matter-linked Drafts', 'Notices & Notice Replies', 'Affidavits, Applications, Petitions'],
    benefits: 'Faster drafting and significantly reduced repetitive document work.',
  },
  {
    id: 4, icon: Zap, title: 'Auto-Populate Drafts', subtitle: 'Smart Document Automation',
    color: 'text-amber-600', bg: 'bg-amber-50',
    items: ['Auto-fill Client Name & Address', 'Auto-populate Mobile & Email', 'Auto-insert Matter Details', 'Opposite Party Information', 'One-click Draft Generation', 'Reduce Manual Data Entry'],
    benefits: 'Drafts generated in seconds with zero manual data entry errors.',
  },
  {
    id: 5, icon: MessageSquare, title: 'Notice & Reply Management', subtitle: 'End-to-End Notice Processing',
    color: 'text-orange-600', bg: 'bg-orange-50',
    items: ['Notice Upload & Storage', 'OCR Text Extraction', 'Reply Drafting Workspace', 'PDF Export', 'Letterhead Printing Support', 'Delivery Tracking'],
    benefits: 'Process notices faster with OCR-powered content extraction.',
  },
  {
    id: 6, icon: FolderOpen, title: 'Document & Evidence Management', subtitle: 'Centralized Legal Document Repository',
    color: 'text-emerald-600', bg: 'bg-emerald-50',
    items: ['Document & Evidence Upload', 'Matter-wise Storage Organization', 'In-browser File Preview', 'Secure File Download', 'Version History Tracking', 'Search & Filter Documents'],
    benefits: 'Never lose a document again — centralized evidence management for every matter.',
  },
  {
    id: 7, icon: ClipboardList, title: 'Task Management', subtitle: 'Team Coordination & Deadlines',
    color: 'text-cyan-600', bg: 'bg-cyan-50',
    items: ['Task Creation & Assignment', 'Deadline Tracking & Alerts', 'Team Monitoring Dashboard', 'Senior & Junior Advocate Roles', 'Clerk & Paralegal Management', 'Progress Tracking'],
    benefits: 'Better team coordination and no missed deadlines across your practice.',
  },
  {
    id: 8, icon: Calendar, title: 'Hearing Management', subtitle: 'Never Miss a Court Date',
    color: 'text-pink-600', bg: 'bg-pink-50',
    items: ['Hearing Scheduling', 'Integrated Calendar View', 'Automated Reminders', 'Hearing History Log', 'Multi-court Management', 'WhatsApp Hearing Alerts'],
    benefits: 'Significant reduction in missed hearings with automated multi-channel reminders.',
  },
  {
    id: 9, icon: Gavel, title: 'Court Order & Compliance', subtitle: 'Compliance Tracking & Management',
    color: 'text-red-600', bg: 'bg-red-50',
    items: ['Interim Order Storage', 'Final Order & Judgment Filing', 'Compliance Obligation Tracking', 'Compliance Deadline Reminders', 'Order Search & Retrieval', 'Compliance Status Dashboard'],
    benefits: 'Stay on top of all court-ordered compliance obligations effortlessly.',
  },
  {
    id: 10, icon: Package, title: 'E-Filing Workspace', subtitle: 'Court Filing Preparation',
    color: 'text-lime-600', bg: 'bg-lime-50',
    items: ['Filing Preparation Workspace', 'Filing Checklists', 'Filing Bundle Creation', 'Printable Court Documents', 'Document Packaging Tools', 'Pre-filing Verification'],
    benefits: 'Faster, error-free filing preparation with automated checklists.',
    note: 'LegalOS does not directly file matters with government portals unless officially integrated.',
  },
  {
    id: 11, icon: BookOpen, title: 'Case Law Management', subtitle: 'Judgment & Citation Library',
    color: 'text-emerald-600', bg: 'bg-emerald-50',
    items: ['Judgment Storage & Organization', 'Citation Management', 'Matter Linking', 'Legal Reference Library', 'Search by Court / Year / Subject', 'Export for Court Briefs'],
    benefits: 'Build a powerful personal case law database for better legal preparation.',
  },
  {
    id: 12, icon: Search, title: 'Legal Research Workspace', subtitle: 'Research, Citations & Arguments',
    color: 'text-sky-600', bg: 'bg-sky-50',
    items: ['Research Notes Workspace', 'Citation Tracking', 'Argument Management', 'Reference Library', 'Research-to-Draft Pipeline', 'Matter-linked Research'],
    benefits: 'Improved legal research quality with structured notes and citation management.',
  },
  {
    id: 13, icon: CreditCard, title: 'Billing & Invoice Management', subtitle: 'GST-Compliant Professional Billing',
    color: 'text-green-600', bg: 'bg-green-50',
    items: ['Professional Invoice Generation', 'GST-Compliant Invoices', 'Payment Tracking', 'Outstanding Amount Tracking', 'Revenue Reports', 'WhatsApp Invoice Alerts'],
    benefits: 'Professional billing with full GST compliance and payment follow-up automation.',
  },
  {
    id: 14, icon: Monitor, title: 'Client Portal', subtitle: 'Self-Service Client Access',
    color: 'text-[#0F4C81]', bg: 'bg-[#0F4C81]/6',
    items: ['View Case Status', 'Access Hearing Schedule', 'Download Documents', 'View Invoices & Payments', 'Upload Supporting Documents', 'Secure Messaging'],
    benefits: 'Improved client transparency and reduced time spent on status queries.',
  },
  {
    id: 15, icon: Bell, title: 'WhatsApp Notifications', subtitle: 'Automated Multi-channel Alerts',
    color: 'text-green-600', bg: 'bg-green-50',
    items: ['Hearing Alerts & Reminders', 'Invoice & Payment Alerts', 'Compliance Deadline Reminders', 'Case Update Notifications', 'Task Deadline Alerts', 'Customizable Notification Rules'],
    benefits: 'Keep clients and team members informed automatically via WhatsApp.',
  },
  {
    id: 16, icon: Globe, title: 'Multi-Language Support', subtitle: 'Work in Your Language',
    color: 'text-blue-600', bg: 'bg-blue-50',
    items: ['English Interface & Documents', 'Marathi Interface & Documents', 'Hindi Interface & Documents', 'Gujarati Interface & Documents', 'Language-specific Draft Templates', 'Multi-language Notice Drafting'],
    benefits: 'Draft documents and manage your practice in the language you are most comfortable with.',
  },
];

export default function Features() {
  return (
    <div className="bg-surface">
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-20">
        <div className="section-container text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-white text-[12px] font-[700] tracking-wider uppercase px-4 py-1.5 rounded-full mb-6">
            16 Powerful Features
          </span>
          <h1 className="font-heading font-[900] text-4xl md:text-5xl tracking-tight text-white mb-5">
            Complete Practice Management<br />Feature Set
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Every feature you need to automate and grow your legal practice —
            built specifically for Indian advocates and law firms.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding bg-white">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.id} className="card p-6 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5">
                  <div className="flex items-start gap-4 mb-5">
                    <div className={`w-11 h-11 ${f.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${f.color}`} />
                    </div>
                    <div>
                      <span className="text-[10px] font-[700] text-ink/25 tracking-wider">
                        #{f.id.toString().padStart(2, '0')}
                      </span>
                      <h3 className="font-heading font-[700] text-[15px] text-ink leading-tight">
                        {f.title}
                      </h3>
                      <p className="text-[11px] text-ink/45 mt-0.5">{f.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 mb-4">
                    {f.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-[#16A34A] flex-shrink-0" />
                        <span className="text-[12px] text-ink/60">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-3 border-t border-line">
                    <p className="text-[12px] text-ink/50 leading-relaxed">
                      <span className="font-[600] text-ink/70">Key Benefit: </span>
                      {f.benefits}
                    </p>
                    {f.note && (
                      <p className="text-[11px] text-orange-500 mt-2 italic">{f.note}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding-sm" style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }}>
        <div className="section-container text-center">
          <h2 className="font-heading font-[800] text-3xl tracking-tight text-white mb-4">
            Start Using All 16 Features Today
          </h2>
          <p className="text-white/60 mb-8">
            No feature paywalls. Get access to every feature from day one with your LegalOS subscription.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/contact"
              className="inline-flex items-center gap-2 bg-white text-[#0F4C81] font-[600] text-[15px] px-7 py-3.5 rounded-xl hover:bg-white/90 transition-all duration-150 shadow-lg"
            >
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/pricing"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-[600] text-[15px] px-7 py-3.5 rounded-xl hover:bg-white/15 transition-all duration-150"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
