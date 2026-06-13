import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight, HelpCircle } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Fastcase?',
        a: 'Fastcase is a comprehensive Advocate Practice Management Software developed by SOSM Services Private Limited. It is a cloud-based platform designed to automate and streamline every aspect of legal practice management for Indian advocates, law firms, legal consultants, and corporate legal departments.',
      },
      {
        q: 'Who can use Fastcase?',
        a: 'Fastcase is designed for individual advocates, law firms of all sizes, legal consultants, litigation teams, and corporate legal departments. Whether you are a solo practitioner in a district court or a senior partner at a major law firm, Fastcase has the tools for you.',
      },
      {
        q: 'Is Fastcase a legal advice platform?',
        a: 'No. Fastcase is a software platform only. It does not provide legal advice, act as an advocate, represent clients before courts, or guarantee any legal outcomes. All legal decisions, drafting, filings, and court submissions remain solely the responsibility of the registered advocate or user.',
      },
      {
        q: 'Is Fastcase available across India?',
        a: 'Yes. Fastcase is a cloud-based platform accessible from anywhere in India. It supports advocates practicing in any court across the country — from district courts to the Supreme Court.',
      },
    ],
  },
  {
    category: 'Features & Functionality',
    questions: [
      {
        q: 'What languages does Fastcase support?',
        a: 'Fastcase currently supports English, Marathi, Hindi, and Gujarati. You can draft legal documents, notices, affidavits, and other templates in these four languages. Additional language support is on our product roadmap.',
      },
      {
        q: 'How does the Auto-Populate Drafts feature work?',
        a: 'When you select a client in Fastcase, the system automatically populates their name, address, mobile number, email, matter details, and opposite party information into the selected document template. This eliminates manual data entry and significantly reduces drafting errors and time.',
      },
      {
        q: 'Does Fastcase support e-filing with courts?',
        a: 'Fastcase provides an E-Filing Workspace for preparing, organizing, and packaging filing documents. However, Fastcase does not directly file matters with government court portals unless an official integration is in place. The workspace helps you prepare perfect filing bundles for manual or assisted filing.',
      },
      {
        q: 'How does the WhatsApp notification feature work?',
        a: 'Fastcase sends automated WhatsApp notifications for hearing reminders, invoice alerts, compliance deadlines, and case updates. This feature requires WhatsApp Business API integration. Notifications can be sent to advocates, team members, and clients based on configurable rules.',
      },
      {
        q: 'Can my clients access their case information?',
        a: 'Yes. Fastcase includes a Client Portal where clients can view their case status, upcoming hearings, documents, invoices, and upload supporting documents. This reduces the number of status calls you receive and improves client satisfaction.',
      },
      {
        q: 'Does Fastcase support billing and invoicing?',
        a: 'Yes. Fastcase includes a complete Billing & Invoice Management module that generates professional GST-compliant invoices, tracks payments, manages outstanding amounts, and generates revenue reports. Invoice alerts can be sent via WhatsApp.',
      },
    ],
  },
  {
    category: 'Data & Security',
    questions: [
      {
        q: 'Is my data secure on Fastcase?',
        a: 'Yes. Fastcase implements enterprise-grade security measures including end-to-end encryption for data in transit and at rest, role-based access control, audit logs, tenant isolation, secure document storage, automated backups, disaster recovery systems, and continuous security monitoring. See our Data Security Policy for full details.',
      },
      {
        q: 'Who owns the data I upload to Fastcase?',
        a: 'You retain complete ownership of all your data, legal documents, and uploaded content. Fastcase does not claim ownership over any user-generated content. Your data is yours — we are merely providing the infrastructure to store and manage it securely.',
      },
      {
        q: 'Can I export my data from Fastcase?',
        a: 'Yes. Fastcase supports data export so you can download your client records, case data, documents, and other information at any time. We believe in data portability and do not lock you into the platform.',
      },
      {
        q: 'What happens to my data if I cancel my subscription?',
        a: 'Upon subscription cancellation, your data is retained for a period as specified in our data retention policy to allow you to export it. After the retention period, data is securely deleted from our systems. Please refer to our Privacy Policy for complete details.',
      },
    ],
  },
  {
    category: 'Billing & Plans',
    questions: [
      {
        q: 'Is there a free trial?',
        a: 'Yes, Fastcase offers a free trial period for new users. No credit card is required to start the trial. Contact us to begin your free trial and explore all features of the platform.',
      },
      {
        q: 'What subscription plans are available?',
        a: 'Fastcase offers monthly and annual subscription plans for individual advocates, small firms, and large teams. Annual plans offer a significant discount over monthly billing. Contact our sales team for current pricing information tailored to your practice size.',
      },
      {
        q: 'Can I get a refund if I am not satisfied?',
        a: 'Monthly plans are generally non-refundable after activation. Annual plans may be eligible for a partial refund within 7 days of subscription if there has been no significant usage. Free trial periods are non-refundable. Please review our full Refund & Cancellation Policy for details.',
      },
    ],
  },
  {
    category: 'Support',
    questions: [
      {
        q: 'How do I get support?',
        a: 'Fastcase provides support via email at support@Fastcase.in. You can also use the Contact form on our website. Our support team is available during business hours (Monday–Saturday, 9 AM – 6 PM IST) to assist with technical issues, onboarding, and training.',
      },
      {
        q: 'How do I raise a grievance?',
        a: 'For formal grievances, please use our dedicated Grievance Redressal page. All grievances are reviewed by our designated Grievance Officer and resolved within 30 days. We take all complaints seriously and follow a structured escalation process.',
      },
      {
        q: 'Is training provided for new users?',
        a: 'Yes. Fastcase provides onboarding assistance and training resources including documentation, video guides, and live support sessions for new subscribers. Our goal is to ensure every advocate can use the platform effectively from day one.',
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-200 ${open ? 'shadow-sm' : ''}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 p-5 text-left bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 dark:text-slate-400 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
          <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed pt-4">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 border border-white/20 rounded-2xl mb-6">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-5">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Everything you need to know about Fastcase. Can't find your answer?
            Contact us and we'll be happy to help.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="section-padding bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {faqs.map((section) => (
            <div key={section.category} className="mb-12">
              <h2 className="text-lg font-heading font-bold text-primary dark:text-blue-300 mb-5 pb-2 border-b border-gray-200 dark:border-slate-700">
                {section.category}
              </h2>
              <div className="space-y-3">
                {section.questions.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}

          {/* Still have questions */}
          <div className="card p-8 text-center mt-8">
            <HelpCircle className="w-10 h-10 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
              Still Have Questions?
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm">
              Our team is ready to help. Reach out via our contact form or email us directly.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/contact" className="btn-primary text-sm px-6 py-2.5">
                Contact Us <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <a href="mailto:support@Fastcase.in" className="btn-secondary text-sm px-6 py-2.5">
                support@Fastcase.in
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
