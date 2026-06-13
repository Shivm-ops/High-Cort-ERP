import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      subtitle="The terms and conditions governing your use of the Fastcase platform."
      lastUpdated="June 1, 2025"
    >
      <h2>1. Acceptance of Terms</h2>
      <p>
        These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Subscriber", "Advocate") and SOSM Services Private Limited ("Company", "we", "us"), the operator of Fastcase. By accessing or using Fastcase, you confirm that you have read, understood, and agree to be bound by these Terms.
      </p>
      <p>
        If you are subscribing on behalf of a law firm or organization, you represent that you have authority to bind that organization to these Terms.
      </p>

      <h2>2. User Eligibility</h2>
      <p>To use Fastcase, you must:</p>
      <ul>
        <li>Be at least 18 years of age</li>
        <li>Be a legally registered advocate enrolled with a Bar Council of India, or an authorized employee/agent of such an advocate or law firm</li>
        <li>Have the legal capacity to enter into binding contracts under Indian law</li>
        <li>Not be prohibited from using the platform under any applicable law</li>
        <li>Provide accurate and complete registration information</li>
      </ul>

      <h2>3. Account Registration</h2>
      <ul>
        <li>You must register with accurate, current, and complete information</li>
        <li>You are responsible for maintaining the confidentiality of your login credentials</li>
        <li>You are responsible for all activities that occur under your account</li>
        <li>You must notify us immediately of any unauthorized access or security breach at <a href="mailto:security@Fastcase.in">security@Fastcase.in</a></li>
        <li>You may not share your account credentials with third parties not authorized under your subscription</li>
        <li>One account per individual advocate; team/firm plans cover multiple authorized users</li>
      </ul>

      <h2>4. Subscription Terms</h2>
      <h3>4.1 Subscription Plans</h3>
      <p>Fastcase is offered on a subscription basis. You must select a plan and pay the applicable fees to access the platform. Plan details, pricing, and features are as specified on the platform at the time of subscription.</p>

      <h3>4.2 Billing Cycle</h3>
      <ul>
        <li>Monthly subscriptions are billed every 30 days from the subscription activation date</li>
        <li>Annual subscriptions are billed once per year from the activation date</li>
        <li>Subscriptions auto-renew unless cancelled before the renewal date</li>
      </ul>

      <h3>4.3 Free Trial</h3>
      <p>Free trial periods are subject to the terms stated at the time of registration. No credit card is required during the trial. Free trials are non-refundable and non-transferable. Only one free trial per person/organization.</p>

      <h3>4.4 Subscription Expiry</h3>
      <p>Upon expiry of a subscription without renewal, access to the platform will be restricted to read-only mode for 30 days to allow data export, after which access will be suspended. Data is retained for an additional 60 days before permanent deletion.</p>

      <h2>5. Payment Terms</h2>
      <ul>
        <li>All fees are in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise</li>
        <li>Payment must be made in advance for each subscription period</li>
        <li>Accepted payment methods are as displayed on the platform's checkout page</li>
        <li>Late payments may result in service suspension</li>
        <li>You are responsible for all applicable taxes, levies, or duties imposed in connection with your subscription</li>
        <li>Pricing is subject to change with 30 days' prior notice to registered subscribers</li>
      </ul>

      <h2>6. User Responsibilities</h2>
      <p>You are responsible for:</p>
      <ul>
        <li>Ensuring the accuracy of all data entered into Fastcase</li>
        <li>Obtaining proper consent from your clients before uploading their personal information</li>
        <li>Complying with the Bar Council of India's rules, the Advocates Act 1961, and all applicable laws</li>
        <li>Maintaining appropriate cybersecurity practices for your account</li>
        <li>Backing up critical data independently</li>
        <li>Informing your clients about how their data is stored and processed on Fastcase</li>
      </ul>

      <h2>7. Advocate Responsibilities</h2>
      <p>Advocates using Fastcase specifically agree that:</p>
      <ul>
        <li>All legal decisions, advice, drafting, and court submissions are solely the advocate's professional responsibility</li>
        <li>Fastcase is a management tool only and does not replace professional legal judgment</li>
        <li>The advocate is solely responsible for verifying the accuracy and appropriateness of any auto-generated documents</li>
        <li>The advocate maintains attorney-client privilege and confidentiality obligations independently of this platform</li>
        <li>Use of Fastcase for any purpose that violates the Bar Council of India's Professional Conduct Rules is prohibited</li>
      </ul>

      <h2>8. Acceptable Use Policy</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Use Fastcase for any unlawful purpose or in violation of any applicable law</li>
        <li>Upload or transmit any malicious code, viruses, or harmful content</li>
        <li>Attempt to gain unauthorized access to any part of the platform</li>
        <li>Reverse engineer, decompile, or disassemble any part of the platform</li>
        <li>Resell, sublicense, or commercially exploit the platform without written permission</li>
        <li>Use the platform to store or transmit infringing, defamatory, or illegal content</li>
        <li>Interfere with or disrupt platform infrastructure, servers, or networks</li>
        <li>Use automated bots, scrapers, or crawlers on the platform</li>
        <li>Impersonate any person or entity</li>
      </ul>

      <h2>9. Intellectual Property</h2>
      <h3>9.1 Fastcase IP</h3>
      <p>The Fastcase platform, its features, source code, design, branding, trademarks, and pre-built legal templates are the exclusive intellectual property of SOSM Services Private Limited. No license to our intellectual property is granted except for the limited right to use the platform as per these Terms.</p>

      <h3>9.2 User Content</h3>
      <p>You retain all ownership rights over content you create or upload on Fastcase, including legal drafts, client documents, and case information. You grant Fastcase a limited, non-exclusive license to host, store, and process your content solely for the purpose of providing the service to you.</p>

      <h2>10. Limitation of Liability</h2>
      <p>To the maximum extent permitted by applicable law:</p>
      <ul>
        <li>Fastcase is provided on an "as is" and "as available" basis without warranties of any kind</li>
        <li>We do not warrant that the platform will be error-free, uninterrupted, or free of security vulnerabilities</li>
        <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the platform</li>
        <li>Our total liability for any claim arising from these Terms or your use of Fastcase shall not exceed the amount you paid us in the 3 months preceding the claim</li>
        <li>We are not responsible for any legal outcomes, court decisions, or professional consequences resulting from your use of the platform</li>
      </ul>

      <h2>11. Suspension and Termination</h2>
      <h3>11.1 Suspension by Fastcase</h3>
      <p>We may suspend or restrict your access to Fastcase immediately without notice if:</p>
      <ul>
        <li>You violate any provision of these Terms</li>
        <li>You engage in fraudulent, abusive, or illegal activities</li>
        <li>Your account payment is overdue</li>
        <li>We are required to do so by law or government order</li>
        <li>Your use poses a security risk to the platform or other users</li>
      </ul>

      <h3>11.2 Termination by User</h3>
      <p>You may cancel your subscription at any time through your account settings or by contacting support. Cancellation takes effect at the end of the current billing period. Please refer to our <Link to="/refund-policy">Refund Policy</Link> for details on refunds upon cancellation.</p>

      <h2>12. Indemnification</h2>
      <p>You agree to indemnify, defend, and hold harmless SOSM Services Private Limited, its directors, officers, employees, and agents from any claims, losses, damages, liabilities, costs, or expenses arising from your use of Fastcase, your violation of these Terms, or your infringement of any third-party rights.</p>

      <h2>13. Governing Law & Jurisdiction</h2>
      <p>
        These Terms are governed by the laws of India. Any disputes arising from or related to these Terms or your use of Fastcase shall be subject to the exclusive jurisdiction of the courts at <strong>Kolhapur, Maharashtra, India</strong>. You consent to the personal jurisdiction of such courts.
      </p>

      <h2>14. Dispute Resolution</h2>
      <p>Before initiating any legal proceedings, parties agree to attempt to resolve disputes informally. Either party may send written notice to the other describing the dispute. If not resolved within 30 days, parties may pursue formal dispute resolution.</p>

      <h2>15. Changes to Terms</h2>
      <p>We may update these Terms from time to time. We will notify you of material changes at least 30 days before they take effect via email and in-platform notice. Continued use of Fastcase after the effective date constitutes acceptance of the updated Terms.</p>

      <h2>16. Contact</h2>
      <p>For questions about these Terms, contact us at:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:legal@Fastcase.in">legal@Fastcase.in</a></li>
        <li><strong>Address:</strong> SOSM Services Private Limited, B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India</li>
      </ul>
    </LegalPageLayout>
  );
}
