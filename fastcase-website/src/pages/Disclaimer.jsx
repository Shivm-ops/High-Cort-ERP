import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';
import { AlertTriangle, Scale, ShieldAlert, FileText, CheckCircle2, Info } from 'lucide-react';

export default function Disclaimer() {
  return (
    <LegalPageLayout
      title="Disclaimer & Statutory Notice"
      subtitle="Important regulatory and legal disclaimers governing the use of the Fastcase Practice Management Platform."
      lastUpdated="November 20, 2026"
    >
      {/* ── Key Regulatory Notice Card ── */}
      <div className="not-prose p-5 bg-amber-50/80 rounded-2xl border border-amber-200/90 mb-8 flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-amber-950 mb-1">
            Statutory Notice under the Advocates Act, 1961 &amp; Bar Council of India Rules
          </h2>
          <p className="text-xs text-amber-900/90 leading-relaxed">
            Fastcase is a legal workflow software platform operated by <strong>SOSM Services Private Limited</strong>. Fastcase is <strong>not a law firm</strong>, does not solicit legal business, and does not provide formal legal representation or opinions. All tools are designed exclusively to assist registered legal practitioners and litigants in managing their judicial workflows.
          </p>
        </div>
      </div>

      <h2>1. Nature of the Fastcase Service</h2>
      <p>
        Fastcase is an enterprise software platform and Enterprise Resource Planning (ERP) suite tailored for advocates, law chambers, senior counsels, and litigants across India. The software offers document storage, automated hearing alerts, court diary scheduling, fee invoicing, and document drafting templates.
      </p>
      <p>
        Nothing contained within the platform, website, sample templates, or marketing documentation constitutes legal advice, a formal legal opinion, or a recommendation on any ongoing judicial proceeding.
      </p>

      <h2>2. No Advocate-Client Relationship</h2>
      <p>
        Your use of the Fastcase platform, creation of a subscriber account, or interaction with our support team does not create an advocate-client relationship between you and <strong>SOSM Services Private Limited</strong> or its directors, employees, or technical staff.
      </p>
      <p>
        Legal advice must always be obtained from an independent, licensed advocate enrolled with a State Bar Council under the Advocates Act, 1961, who can evaluate the unique facts of your specific case.
      </p>

      <h2>3. AI Legal Drafting &amp; Document Generation</h2>
      <p>
        Fastcase incorporates smart templates and assistive drafting modules to streamline the creation of legal notices, bail applications, affidavits, and consumer complaints. By utilizing these drafting tools, you acknowledge and agree that:
      </p>
      <ul>
        <li><strong>Drafting Starting Points:</strong> All auto-generated drafts and boilerplate templates are intended strictly as preliminary drafts and starting points.</li>
        <li><strong>Mandatory Human Review:</strong> The practicing advocate is solely responsible for verifying the factual accuracy, statutory references, court jurisdiction, and judicial precedents before printing, signing, or presenting any document in court.</li>
        <li><strong>No Outcome Guarantee:</strong> Fastcase makes no representation that documents generated using our templates will be accepted without objection by any court, tribunal, or registrar.</li>
      </ul>

      <h2>4. Public Court Data &amp; Cause List Tracking</h2>
      <p>
        Fastcase provides automated court diary synchronization by reading public daily cause lists and case status information published by the National Judicial Data Grid (NJDG), High Court computer registries, and e-Courts systems.
      </p>
      <ul>
        <li><strong>Informational Convenience:</strong> Case status notifications and cause list updates are provided for organizational convenience only.</li>
        <li><strong>Certified Copies Prevail:</strong> In the event of any discrepancy between notifications delivered via Fastcase and the official physical cause list or certified order passed by a Presiding Judge, the official court records and certified copies shall always prevail.</li>
        <li><strong>Advocate Duty:</strong> Subscribers remain duty-bound to independently confirm hearing dates, bench allocations, and peremptory board listings directly from the official court registry.</li>
      </ul>

      <h2>5. E-Filing &amp; Government Registry Portals</h2>
      <p>
        While Fastcase provides digital workspace tools to assemble e-filing bundles, index petitions, and organize annexures according to High Court e-filing guidelines, the actual act of filing remains under the direct control and credential access of the advocate or litigant on government filing portals. Fastcase is not affiliated with or endorsed by any judicial registry.
      </p>

      <h2>6. Third-Party Integrations &amp; Payment Gateway</h2>
      <p>
        Our platform integrates with trusted third-party providers:
      </p>
      <ul>
        <li><strong>Razorpay Software Private Limited:</strong> Handles subscription payments, invoices, and transaction processing. Payment security is governed by Razorpay's PCI-DSS compliant infrastructure.</li>
        <li><strong>WhatsApp Cloud API:</strong> Automated notifications and reminders dispatched via WhatsApp are subject to Meta Platforms' business messaging terms. Fastcase is not liable for intermittent telecommunication delivery delays caused by external network operators.</li>
      </ul>

      <h2>7. Limitation of Professional Liability</h2>
      <p>
        To the fullest extent permitted under Indian law, <strong>SOSM Services Private Limited</strong>, its directors, officers, engineers, and affiliates disclaim any liability for:
      </p>
      <ul>
        <li>Any loss of judicial limitation periods, dismissals in default, or adverse orders resulting from user oversight or technical connectivity issues.</li>
        <li>Clerical or typographical errors introduced into legal pleadings generated via OCR or automated data extraction.</li>
        <li>Direct, indirect, consequential, or exemplary damages arising out of the use or inability to use the Fastcase platform.</li>
      </ul>

      <h2>8. Regulatory Compliance Inquiries</h2>
      <p>
        If you have questions regarding our compliance notices or require regulatory clarifications, please contact our Legal Cell:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:legal@fastcase.in">legal@fastcase.in</a></li>
        <li><strong>Compliance Desk:</strong> <a href="tel:+919405669420">+91 94056 69420</a></li>
        <li><strong>Corporate Office:</strong> SOSM Services Private Limited, B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India.</li>
      </ul>
    </LegalPageLayout>
  );
}
