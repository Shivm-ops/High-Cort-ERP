import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      subtitle="How Fastcase collects, uses, and protects your personal and legal data."
      lastUpdated="June 1, 2025"
    >
      <h2>1. Introduction</h2>
      <p>
        SOSM Services Private Limited ("Company", "we", "us", or "our") operates the Fastcase platform ("Fastcase", "Platform", "Service"). This Privacy Policy describes how we collect, use, disclose, and safeguard your information when you use Fastcase.
      </p>
      <p>
        By accessing or using Fastcase, you acknowledge that you have read, understood, and agree to the collection and use of information as described in this Privacy Policy. If you do not agree, please discontinue use of the platform.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>2.1 Account & Registration Information</h3>
      <p>When you register on Fastcase, we collect:</p>
      <ul>
        <li>Full name and professional designation (e.g., Advocate, Senior Advocate)</li>
        <li>Bar Council enrollment number</li>
        <li>Email address and mobile number</li>
        <li>Office/chamber address</li>
        <li>GST registration number (if applicable)</li>
        <li>Password (stored in hashed form — never in plain text)</li>
      </ul>

      <h3>2.2 Client Information</h3>
      <p>As part of your legal practice management, you may store the following information about your clients on the Platform:</p>
      <ul>
        <li>Client name, address, mobile number, and email</li>
        <li>PAN (Permanent Account Number)</li>
        <li>Aadhaar number (stored with applicable encryption)</li>
        <li>KYC documents and records</li>
        <li>Business details (for corporate clients)</li>
        <li>Family and relationship information (as relevant to the matter)</li>
      </ul>
      <p>You, as the advocate/user, are the data controller for your clients' information. Fastcase processes this data on your behalf as a data processor.</p>

      <h3>2.3 Case & Matter Information</h3>
      <ul>
        <li>Case names, matter types, and practice areas</li>
        <li>Court names, case numbers, and filing information</li>
        <li>Hearing dates, orders, and compliance records</li>
        <li>Opposite party details</li>
        <li>Case notes, research, and arguments</li>
      </ul>

      <h3>2.4 KYC & Identification Documents</h3>
      <ul>
        <li>Identity proof documents uploaded for client KYC</li>
        <li>Address proof documents</li>
        <li>Professional registration documents</li>
      </ul>

      <h3>2.5 Documents & Evidence Files</h3>
      <ul>
        <li>Legal drafts, notices, agreements, and petitions created on the platform</li>
        <li>Uploaded court orders, judgments, and affidavits</li>
        <li>Evidence files and supporting documents uploaded per matter</li>
        <li>Document version histories</li>
      </ul>

      <h3>2.6 Billing & Financial Data</h3>
      <ul>
        <li>Invoice details and billing records</li>
        <li>Payment status and transaction history</li>
        <li>GST invoice data</li>
        <li>Your subscription plan and payment history with us</li>
      </ul>

      <h3>2.7 Usage & Technical Data</h3>
      <ul>
        <li>IP address, browser type, and operating system</li>
        <li>Pages visited, features used, and session duration</li>
        <li>Device identifiers</li>
        <li>Access logs and audit trails</li>
        <li>Error logs and performance data</li>
      </ul>

      <h3>2.8 Cookie Data</h3>
      <p>We use cookies to maintain your session, remember preferences, and analyze platform usage. Please see our <Link to="/cookie-policy">Cookie Policy</Link> for complete details.</p>

      <h2>3. How We Use Your Information</h2>
      <p>We use the collected information for the following purposes:</p>
      <ul>
        <li>To provide, operate, and maintain the Fastcase platform</li>
        <li>To authenticate users and maintain session security</li>
        <li>To enable auto-populate features for draft generation</li>
        <li>To send WhatsApp notifications (hearings, invoices, reminders)</li>
        <li>To generate and send GST invoices and billing communications</li>
        <li>To provide customer support and respond to queries</li>
        <li>To detect, prevent, and address security incidents and fraud</li>
        <li>To improve and develop platform features</li>
        <li>To comply with applicable laws and regulations</li>
        <li>To respond to legal process and government requests</li>
      </ul>

      <h2>4. Data Ownership</h2>
      <p>
        <strong>Users retain complete ownership of their legal documents, client data, and all uploaded content.</strong> Fastcase does not claim any ownership rights over user-generated content, legal drafts, client information, case records, or any documents uploaded or created on the platform.
      </p>
      <p>
        Fastcase is a data processor acting on your instructions as the data controller. We will not use your clients' data for any purpose other than providing the contracted services to you.
      </p>

      <h2>5. Data Sharing & Disclosure</h2>
      <p>We do not sell, trade, or rent your personal information to third parties. We may share information in the following limited circumstances:</p>
      <ul>
        <li><strong>Service Providers:</strong> Cloud hosting, database, and infrastructure partners who process data on our behalf under strict confidentiality agreements</li>
        <li><strong>WhatsApp Integration:</strong> When sending notifications via WhatsApp Business API, relevant message data passes through WhatsApp's (Meta's) infrastructure</li>
        <li><strong>E-Sign Integration:</strong> If you use digital signature features, relevant document data is shared with the integrated e-sign provider</li>
        <li><strong>Legal Compliance:</strong> When required by law, court order, or government authority</li>
        <li><strong>Business Transfer:</strong> In the event of a merger or acquisition, data may transfer to the successor entity subject to the same privacy protections</li>
      </ul>

      <h2>6. Third-Party Integrations</h2>
      <h3>6.1 WhatsApp Business API</h3>
      <p>Fastcase integrates with WhatsApp Business API for sending notifications. Message content for notifications passes through Meta's (WhatsApp's) servers. Usage of this feature is subject to WhatsApp's Terms of Service and Privacy Policy.</p>

      <h3>6.2 E-Sign Integration</h3>
      <p>If e-signature functionality is available and used, the relevant document content is transmitted to the integrated e-sign service provider. We ensure our e-sign partners maintain appropriate data protection standards.</p>

      <h3>6.3 E-Courts Integration</h3>
      <p>Any integration with e-Courts or eCourt Services portals is subject to the terms and policies of the National Informatics Centre and the respective High Courts.</p>

      <h2>7. Data Security</h2>
      <p>We implement comprehensive security measures to protect your data. See our <Link to="/data-security">Data Security Policy</Link> for full details. In summary:</p>
      <ul>
        <li>All data is encrypted in transit (TLS 1.2+) and at rest (AES-256)</li>
        <li>Role-based access controls restrict data access within your organization</li>
        <li>Audit logs track all access and modifications</li>
        <li>Regular security monitoring and vulnerability assessments</li>
        <li>Secure, isolated data environments per client/tenant</li>
      </ul>

      <h2>8. Data Retention</h2>
      <p>We retain your data for as long as your account is active or as needed to provide services. Specifically:</p>
      <ul>
        <li>Active subscription data is retained for the duration of your subscription</li>
        <li>Upon account termination, data is retained for 90 days to allow export</li>
        <li>After 90 days from termination, data is securely and permanently deleted</li>
        <li>Billing records may be retained for 7 years as required by Indian tax law</li>
        <li>Audit logs are retained for 1 year for security purposes</li>
      </ul>

      <h2>9. Your Rights</h2>
      <p>As a user of Fastcase, you have the following rights regarding your data:</p>
      <ul>
        <li><strong>Access:</strong> Request a copy of your personal data we hold</li>
        <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
        <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
        <li><strong>Export:</strong> Export your data in standard formats at any time</li>
        <li><strong>Objection:</strong> Object to specific processing of your data</li>
        <li><strong>Complaint:</strong> Lodge a complaint with our Grievance Officer</li>
      </ul>
      <p>To exercise these rights, contact us at <a href="mailto:privacy@Fastcase.in">privacy@Fastcase.in</a> or use our <Link to="/contact">Contact form</Link>.</p>

      <h2>10. Data Deletion Requests</h2>
      <p>To request deletion of your account and all associated data:</p>
      <ol>
        <li>Send an email to <a href="mailto:privacy@Fastcase.in">privacy@Fastcase.in</a> with the subject "Data Deletion Request"</li>
        <li>Include your registered email address and account details</li>
        <li>We will verify your identity and process the request within 30 days</li>
        <li>You will receive a confirmation once deletion is complete</li>
      </ol>
      <p>Note: Certain data may be retained for legal compliance purposes (e.g., billing records for tax compliance) even after an account deletion request.</p>

      <h2>11. Children's Privacy</h2>
      <p>Fastcase is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If you become aware that a minor has provided us with personal information, please contact us immediately.</p>

      <h2>12. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email and/or an in-platform notification. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>

      <h2>13. Contact Us</h2>
      <p>For privacy-related queries or to exercise your rights:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@Fastcase.in">privacy@Fastcase.in</a></li>
        <li><strong>Postal Address:</strong> SOSM Services Private Limited, B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India</li>
        <li><strong>Grievance Officer:</strong> <Link to="/grievance-officer">Click here</Link> for our Grievance Redressal page</li>
      </ul>
    </LegalPageLayout>
  );
}
