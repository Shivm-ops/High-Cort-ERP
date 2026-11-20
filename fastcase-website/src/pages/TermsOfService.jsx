import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';
import { FileCheck, Shield, Scale, AlertOctagon, CheckCircle2, Building, Gavel } from 'lucide-react';

export default function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The binding legal agreement governing advocate and client access to the Fastcase Legal Operating System."
      lastUpdated="November 20, 2026"
    >
      {/* ── Key Highlights Banner ── */}
      <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Scale className="w-3.5 h-3.5 text-emerald-600" /> Advocate Ownership
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            You retain 100% intellectual property and title over all case documents, client data, and legal pleadings uploaded.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5 text-[#013B36]" /> BCI Rules Compliant
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Constructed specifically to uphold the professional ethics and confidentiality guidelines of the Bar Council of India.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            <Gavel className="w-3.5 h-3.5 text-[#013B36]" /> Kolhapur Jurisdiction
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Subject exclusively to Indian commercial laws and the competent courts at Kolhapur, Maharashtra.
          </p>
        </div>
      </div>

      <h2>1. The Legal Agreement</h2>
      <p>
        These Terms of Service ("Terms") constitute a legally enforceable contract between you ("Subscriber", "Advocate", "User") and <strong>SOSM Services Private Limited</strong> ("Company", "we", "us"), the proprietary developer and operator of <strong>Fastcase</strong>.
      </p>
      <p>
        By accessing the platform at <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">fastcase.in</code>, registering an advocate chamber, or executing a subscription payment, you affirm that you have read, comprehended, and agreed to be bound by these Terms and our incorporated policies.
      </p>

      <h2>2. User Eligibility &amp; Professional Verification</h2>
      <p>To register for an advocate account, you represent and warrant that:</p>
      <ul>
        <li>You are at least eighteen (18) years of age with full contractual capacity under the Indian Contract Act, 1872.</li>
        <li>You are a duly enrolled advocate on the rolls of a State Bar Council under the Advocates Act, 1961, or an authorized junior, clerk, or staff member operating under the express authority of a licensed advocate.</li>
        <li>Your credentials provided during registration (including State Bar enrollment details) are genuine, current, and verifiable.</li>
      </ul>

      <h2>3. Account Security &amp; Chambers Management</h2>
      <ul>
        <li><strong>Confidentiality of Access:</strong> You are responsible for preserving the secrecy of your login passwords and two-factor authentication tokens.</li>
        <li><strong>Multi-User Chambers:</strong> On firm or team plans, the primary account owner is responsible for ensuring that associate advocates, clerks, and paralegals maintain access controls corresponding to their assigned roles.</li>
        <li><strong>Breach Notification:</strong> In the event of suspected unauthorized account access or compromised credentials, you must alert us immediately at <a href="mailto:security@fastcase.in">security@fastcase.in</a>.</li>
      </ul>

      <h2>4. Subscription Plans, Billing &amp; Invoicing</h2>
      <ul>
        <li><strong>Commercial Plans:</strong> Fastcase offers monthly and annual subscription tiers. Tier features, storage allocations, and pricing are clearly displayed on our platform at checkout.</li>
        <li><strong>Currency &amp; Taxes:</strong> All subscription charges are denominated in Indian Rupees (INR) and are subject to statutory Goods and Services Tax (GST) at applicable rates.</li>
        <li><strong>Payment Processing:</strong> Transactions are processed securely via our RBI-regulated partner, <strong>Razorpay Software Private Limited</strong>. Accepted instruments include Credit/Debit Cards, UPI, Net Banking, and corporate bank transfers.</li>
        <li><strong>Instant Digital Delivery:</strong> Services are provisioned digitally and activated immediately upon successful payment approval. Official GST tax invoices are delivered to your registered email automatically.</li>
        <li><strong>Renewal &amp; Termination:</strong> Subscriptions auto-renew unless cancelled prior to the renewal date via Account Settings. Refund guidelines are governed strictly by our <Link to="/refund-policy">Refund &amp; Cancellation Policy</Link>.</li>
      </ul>

      <h2>5. Advocate Professional Responsibility</h2>
      <p>
        Fastcase is an administrative ERP and practice automation tool:
      </p>
      <ul>
        <li><strong>Sole Discretion:</strong> All legal arguments, draft filings, court appearances, client advice, and case strategies remain exclusively under the independent professional judgment of the human advocate.</li>
        <li><strong>Document Accuracy:</strong> The advocate is duty-bound to proofread, verify, and validate all auto-populated document templates, notice drafts, and e-filing bundles prior to filing in any judicial forum.</li>
        <li><strong>Privilege Maintenance:</strong> Fastcase does not inspect or review your client communications. The attorney-client privilege governed by Section 126 of the Indian Evidence Act, 1872 (and corresponding provisions of the Bharatiya Sakshya Adhiniyam, 2023) is preserved through end-to-end technical controls.</li>
      </ul>

      <h2>6. Intellectual Property &amp; Content Ownership</h2>
      <ul>
        <li><strong>User Content:</strong> You retain complete, unencumbered ownership of all pleadings, case files, client registers, and documents uploaded to Fastcase. You grant us only a restricted technical license to host, process, and encrypt your content to fulfill platform features.</li>
        <li><strong>Fastcase Platform IP:</strong> The application code, software architecture, UI layouts, algorithms, trademarks, and design assets are the exclusive intellectual property of <strong>SOSM Services Private Limited</strong>.</li>
      </ul>

      <h2>7. Prohibited &amp; Acceptable Use</h2>
      <p>You agree not to engage in any of the following activities on the platform:</p>
      <ul>
        <li>Attempting to bypass security mechanisms, reverse-engineer source code, or decompile the software.</li>
        <li>Uploading malware, automated scraping bots, or unauthorized API querying scripts.</li>
        <li>Utilizing the platform to dispatch unsolicited spam or violate the Bar Council of India's prohibition on commercial advertising.</li>
        <li>Impersonating judicial officers, registrars, or other advocates.</li>
      </ul>

      <h2>8. Limitation of Liability</h2>
      <p>
        To the maximum extent permissible by law:
      </p>
      <ul>
        <li>Fastcase is provided on an "as is" and "as available" basis. We do not warrant that service will be uninterrupted or immune from unforeseen network outages.</li>
        <li>SOSM Services Private Limited shall not be liable for indirect, incidental, punitive, or consequential damages resulting from lost case records or missed court deadlines caused by user oversight.</li>
        <li>Our total aggregate liability under any cause of action shall be strictly capped at the total subscription fees paid by you in the three (3) months preceding the incident.</li>
      </ul>

      <h2>9. Governing Law, Dispute Resolution &amp; Jurisdiction</h2>
      <p>
        These Terms shall be governed by and construed in accordance with the laws of the Republic of India. In the event of any controversy or dispute arising from your use of the platform:
      </p>
      <ul>
        <li>The parties agree to attempt amicable resolution via written communication for a period of thirty (30) days.</li>
        <li>If unaddressed, all disputes shall be submitted to the exclusive jurisdiction of the competent courts of law located at <strong>Kolhapur, Maharashtra, India</strong>.</li>
      </ul>

      <h2>10. Contact Information</h2>
      <p>For questions or formal legal notices regarding these Terms of Service, contact:</p>
      <ul>
        <li><strong>Legal Cell:</strong> <a href="mailto:legal@fastcase.in">legal@fastcase.in</a></li>
        <li><strong>Support &amp; Billing:</strong> <a href="mailto:support@fastcase.in">support@fastcase.in</a></li>
        <li><strong>Telephone:</strong> <a href="tel:+919405669420">+91 94056 69420</a></li>
        <li><strong>Corporate Office:</strong> SOSM Services Private Limited, B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India.</li>
      </ul>
    </LegalPageLayout>
  );
}
