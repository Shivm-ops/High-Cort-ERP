import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, Database, EyeOff, UserCheck, FileText, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy & Data Protection Policy"
      subtitle="How Fastcase safeguards advocate credentials, client case records, and confidential legal archives in compliance with Indian privacy laws."
      lastUpdated="November 20, 2026"
    >
      {/* ── Key Highlights Banner ── */}
      <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Database className="w-3.5 h-3.5 text-emerald-600" /> 100% Indian Data Centers
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            All legal pleadings, evidence files, and case notes are stored exclusively within sovereign data centers located in India.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5 text-[#013B36]" /> AES-256 Encryption
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            End-to-end encryption in transit (TLS 1.3) and AES-256 cryptographic protection at rest for all stored attachments.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            <EyeOff className="w-3.5 h-3.5 text-[#013B36]" /> Zero Data Sale
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            We never sell, rent, or monetize advocate or client information. You retain 100% ownership over all uploaded content.
          </p>
        </div>
      </div>

      <h2>1. Introduction &amp; Statutory Framework</h2>
      <p>
        <strong>SOSM Services Private Limited</strong> ("Company", "we", "us", or "our") operates <strong>Fastcase</strong>. We are committed to safeguarding the constitutional right to privacy and maintaining rigorous standards of legal data confidentiality in accordance with:
      </p>
      <ul>
        <li>The Digital Personal Data Protection Act, 2023 (DPDP Act).</li>
        <li>The Information Technology Act, 2000, and Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011.</li>
        <li>Bar Council of India Professional Conduct Standards concerning client confidentiality and privileged communications.</li>
      </ul>

      <h2>2. Roles under Indian Privacy Law</h2>
      <div className="not-prose my-6 border border-slate-200 rounded-2xl p-5 bg-slate-50 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#013B36]" /> The Advocate as the Data Fiduciary (Controller)
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            When you enter client names, case briefs, KYC records, or evidence files into Fastcase, you (or your law firm) act as the Data Fiduciary. You determine the lawful purpose for processing client data under the advocate-client mandate.
          </p>
        </div>
        <div className="pt-3 border-t border-slate-200/80">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#059669]" /> Fastcase as the Data Processor
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            Fastcase acts strictly as a technological Data Processor. We store, index, and retrieve data strictly on your instructions to provide practice management tools. We do not access or process client case files for any secondary commercial purposes.
          </p>
        </div>
      </div>

      <h2>3. Information We Collect</h2>

      <h3>3.1 Advocate Account Information</h3>
      <ul>
        <li>Full Name, State Bar Council Enrollment Number, and legal chamber address.</li>
        <li>Official Email address, verified mobile phone number, and GSTIN (for tax invoicing).</li>
        <li>Encrypted authentication credentials (passwords hashed using modern argon2/bcrypt algorithms).</li>
      </ul>

      <h3>3.2 Legal Matter &amp; Case Data (Managed by User)</h3>
      <ul>
        <li>Client contact records, case numbers (CNR, Suit No., Writ Petition No.), court listings, and hearing dates.</li>
        <li>Pleadings, affidavits, evidence files, and court daily orders uploaded for case preparation.</li>
        <li>Professional fee invoices and payment records generated through the platform.</li>
      </ul>

      <h3>3.3 Technical &amp; System Metadata</h3>
      <ul>
        <li>Session IP address, browser type, device operating system, and system audit timestamps to detect unauthorized login attempts.</li>
      </ul>

      <h2>4. How We Utilize Your Information</h2>
      <p>All information processed on Fastcase is used strictly for operational purposes:</p>
      <ul>
        <li>Authenticating your access and enforcing role-based team permissions across your legal chambers.</li>
        <li>Synchronizing hearing schedules with public eCourts cause lists to notify you of upcoming boards.</li>
        <li>Dispatching client reminders, fee receipts, and hearing updates via automated WhatsApp/SMS notifications.</li>
        <li>Generating compliant GST tax invoices for your Fastcase subscriptions.</li>
        <li>Preventing security intrusions, credential stuffing, and technical anomalies.</li>
      </ul>

      <h2>5. Strict Non-Disclosure &amp; Sub-Processors</h2>
      <p>
        We do not sell, trade, or lease personal or legal information to any advertisers or third-party brokers. Data is shared solely with certified technical infrastructure partners under binding confidentiality covenants:
      </p>
      <ul>
        <li><strong>Cloud Infrastructure:</strong> Tier-IV secure Indian data centers (ISO 27001, SOC 2 Type II certified) providing tenant-isolated database storage.</li>
        <li><strong>Payment Gateway:</strong> <strong>Razorpay Software Private Limited</strong>, an RBI-regulated payment aggregator compliant with PCI-DSS Level 1 standards for processing debit/credit cards, Net Banking, and UPI payments.</li>
        <li><strong>Messaging Gateway:</strong> WhatsApp Business API (Meta Platforms) for delivering automated client updates requested by you.</li>
      </ul>

      <h2>6. Comprehensive Security Measures</h2>
      <p>
        Fastcase employs defense-in-depth architecture to protect privileged legal information:
      </p>
      <ul>
        <li><strong>Encryption Standards:</strong> Data in transit is secured using TLS 1.3 with forward secrecy. Sensitive database attributes and stored document files are encrypted with AES-256.</li>
        <li><strong>Tenant Isolation:</strong> Logical separation ensures that no subscriber can view, query, or access records belonging to another advocate chamber.</li>
        <li><strong>Audit Logging:</strong> Every document view, download, edit, and deletion event generates an unalterable audit log for internal compliance.</li>
      </ul>

      <h2>7. Data Retention &amp; Permanent Erasure</h2>
      <p>
        You retain full authority to delete individual client files or case records at any time. Upon cancellation of a subscription:
      </p>
      <ul>
        <li>Your account enters a 30-day grace period during which you can export all client records and files in standard formats (PDF, Excel, CSV).</li>
        <li>After 90 days from subscription termination, your database partition and encrypted file attachments are permanently deleted from production disks.</li>
      </ul>

      <h2>8. Statutory Grievance Redressal Officer</h2>
      <p>
        Pursuant to Rule 3(11) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the DPDP Act, 2023, the details of our Grievance Officer are as follows:
      </p>
      <div className="not-prose my-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5 text-slate-700">
        <p className="font-bold text-slate-900 text-sm">Grievance Redressal Officer</p>
        <p><strong>Company:</strong> SOSM Services Private Limited</p>
        <p><strong>Address:</strong> B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India</p>
        <p><strong>Dedicated Email:</strong> <a href="mailto:grievance@fastcase.in" className="text-[#013B36] font-semibold underline">grievance@fastcase.in</a> / <a href="mailto:privacy@fastcase.in" className="text-[#013B36] font-semibold underline">privacy@fastcase.in</a></p>
        <p><strong>Direct Helpline:</strong> <a href="tel:+919405669420" className="text-[#013B36] font-semibold">+91 94056 69420</a></p>
        <p className="text-slate-500 pt-1 text-[11px]">All grievances are acknowledged within 24 hours and redressed within statutory timelines (maximum 15 working days).</p>
      </div>
    </LegalPageLayout>
  );
}
