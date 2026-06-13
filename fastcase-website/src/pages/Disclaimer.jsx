import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export default function Disclaimer() {
  return (
    <LegalPageLayout
      title="Disclaimer"
      subtitle="Important limitations and disclaimers regarding the use of Fastcase."
      lastUpdated="June 1, 2025"
    >
      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl mb-8 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-orange-800 dark:text-orange-300 font-medium">
          Please read this disclaimer carefully. It contains important information about what Fastcase is and is not.
        </p>
      </div>

      <h2>1. Nature of Fastcase</h2>
      <p>
        Fastcase is a <strong>software platform and practice management tool</strong> developed and operated by SOSM Services Private Limited. Fastcase is designed to help advocates, law firms, and legal professionals manage and automate their practice administration, document management, case tracking, and billing operations.
      </p>

      <h2>2. Not Legal Advice</h2>
      <p>
        <strong>Fastcase does not provide legal advice of any kind.</strong> The information, templates, documents, draft formats, and other content available on the Fastcase platform are for <em>practice management and administrative purposes only</em>. Nothing on Fastcase constitutes or should be construed as legal advice, legal opinion, or a legal recommendation.
      </p>
      <p>
        Users should always consult a qualified and registered advocate for legal advice specific to their situation. Fastcase cannot and does not replace professional legal consultation.
      </p>

      <h2>3. Not an Advocate or Legal Representative</h2>
      <p>Fastcase is NOT:</p>
      <ul>
        <li>An advocate registered with the Bar Council of India or any State Bar Council</li>
        <li>A legal representative of any client or user</li>
        <li>A party authorized to appear before any court, tribunal, or quasi-judicial authority</li>
        <li>An officer of the court in any jurisdiction</li>
      </ul>

      <h2>4. No Court Representation</h2>
      <p>
        Fastcase does not appear before any court, tribunal, arbitration panel, or other judicial or quasi-judicial forum on behalf of any user or client. The platform provides tools to help advocates prepare for and manage their court appearances, but it does not take any actions before courts.
      </p>

      <h2>5. No Guarantee of Legal Outcomes</h2>
      <p>
        <strong>Fastcase makes no representation, warranty, or guarantee regarding any legal outcome.</strong> The success or failure of any legal matter, court filing, petition, appeal, or other legal action is determined by courts, tribunals, and judicial authorities based on facts, law, and advocacy — not by the use of practice management software.
      </p>
      <p>
        Use of Fastcase does not improve, guarantee, or affect the likelihood of success in any legal proceeding.
      </p>

      <h2>6. User Responsibility for Legal Decisions</h2>
      <p>
        <strong>All legal decisions, including but not limited to:</strong>
      </p>
      <ul>
        <li>Legal advice given to clients</li>
        <li>Drafting and review of legal documents</li>
        <li>Filing of cases, appeals, and applications</li>
        <li>Court submissions, arguments, and pleadings</li>
        <li>Settlement negotiations and agreements</li>
        <li>Compliance with court orders</li>
        <li>Professional conduct and ethical obligations</li>
      </ul>
      <p>
        <strong>remain solely and exclusively the responsibility of the registered advocate or authorized user.</strong> Fastcase is a tool to assist in practice management — the professional judgment, skill, and responsibility always remain with the human advocate.
      </p>

      <h2>7. Template Accuracy Disclaimer</h2>
      <p>
        While Fastcase provides legal document templates to assist advocates, these templates:
      </p>
      <ul>
        <li>Are general-purpose starting points and not jurisdiction-specific legal advice</li>
        <li>May not reflect the latest legislative changes, court rules, or judicial precedents</li>
        <li>Must be reviewed and modified by the advocate before use</li>
        <li>Should be adapted to the specific facts and circumstances of each matter</li>
        <li>Do not constitute a guarantee of legal correctness or court acceptance</li>
      </ul>
      <p>
        <strong>Advocates are solely responsible for verifying, reviewing, and approving all documents generated through or stored on Fastcase before filing or delivering them to any court, client, or third party.</strong>
      </p>

      <h2>8. E-Filing Disclaimer</h2>
      <p>
        Fastcase provides an E-Filing Workspace to help advocates prepare filing documents and bundles. However:
      </p>
      <ul>
        <li>Fastcase does not directly file documents with any government portal, court, or e-courts system unless an official integration is formally established and disclosed</li>
        <li>The act of filing remains the responsibility of the advocate</li>
        <li>Fastcase is not responsible for any technical issues with third-party filing portals</li>
        <li>Advocates must verify that their filings comply with the rules of the relevant court</li>
      </ul>

      <h2>9. OCR & Auto-Populate Accuracy</h2>
      <p>
        Fastcase uses Optical Character Recognition (OCR) technology for notice processing and auto-populate features. While we strive for accuracy:
      </p>
      <ul>
        <li>OCR results may contain errors and require human review before use</li>
        <li>Auto-populated document fields must be verified by the advocate before finalizing any document</li>
        <li>We are not responsible for errors in documents resulting from uncorrected OCR output</li>
      </ul>

      <h2>10. Third-Party Integrations</h2>
      <p>
        Fastcase may integrate with third-party services including WhatsApp, e-sign providers, and payment gateways. We are not responsible for the terms, policies, availability, or actions of third-party services. Your use of integrated third-party services is subject to their respective terms and privacy policies.
      </p>

      <h2>11. Limitation of Liability</h2>
      <p>
        SOSM Services Private Limited, its directors, officers, employees, and agents shall not be liable for any damage, loss, or harm — direct, indirect, incidental, consequential, or punitive — arising from:
      </p>
      <ul>
        <li>Your use of or reliance on the Fastcase platform</li>
        <li>Any legal outcome or court decision in matters managed through Fastcase</li>
        <li>Errors, inaccuracies, or omissions in auto-generated documents</li>
        <li>Technical failures, outages, or data loss events</li>
        <li>Unauthorized access to your account due to your failure to secure credentials</li>
      </ul>

      <h2>12. Acceptance</h2>
      <p>
        By using Fastcase, you acknowledge that you have read, understood, and agree to this Disclaimer. If you do not agree with any part of this Disclaimer, please discontinue use of the platform.
      </p>

      <h2>13. Questions</h2>
      <p>For questions about this Disclaimer, contact us at <a href="mailto:legal@Fastcase.in">legal@Fastcase.in</a> or visit our <Link to="/contact">Contact page</Link>.</p>
    </LegalPageLayout>
  );
}
