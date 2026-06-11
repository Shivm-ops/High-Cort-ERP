import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';

export default function RefundPolicy() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      subtitle="Our policy on subscription refunds, cancellations, and subscription management."
      lastUpdated="June 1, 2025"
    >
      <h2>1. Overview</h2>
      <p>
        This Refund & Cancellation Policy applies to all subscriptions and purchases made on the LegalOS platform operated by SOSM Services Private Limited. We have designed our refund policy to be fair and transparent while ensuring the sustainability of our service.
      </p>
      <p>
        By subscribing to LegalOS, you acknowledge and agree to the terms of this policy. Please read it carefully before making any purchase.
      </p>

      <h2>2. Free Trial Policy</h2>
      <ul>
        <li>Free trial periods are provided at no charge to allow you to evaluate the platform</li>
        <li>No payment is required to start a free trial</li>
        <li>Free trials are non-refundable (as no payment is made)</li>
        <li>Only one free trial is permitted per individual or organization</li>
        <li>Creating multiple accounts to extend free trial access is prohibited and may result in account termination</li>
        <li>At the end of the trial period, you will need to subscribe to continue using the platform</li>
      </ul>

      <h2>3. Monthly Subscription Plans</h2>
      <h3>3.1 Non-Refundable After Activation</h3>
      <p>
        Monthly subscription fees are <strong>non-refundable</strong> once the subscription has been activated and the billing period has begun. This is because full platform access is provided immediately upon activation.
      </p>
      <h3>3.2 Rationale</h3>
      <p>
        Upon activation of a monthly subscription, you gain immediate access to all platform features, your data storage allocation, and the ability to start using LegalOS. Given that the service is immediately consumed, monthly fees are not eligible for refund.
      </p>
      <h3>3.3 Cancellation of Monthly Plans</h3>
      <ul>
        <li>You may cancel a monthly subscription at any time</li>
        <li>Cancellation takes effect at the end of the current monthly billing cycle</li>
        <li>You will continue to have full access until the end of the paid period</li>
        <li>No charges will be made after the cancellation date for subsequent months</li>
      </ul>

      <h2>4. Annual Subscription Plans</h2>
      <h3>4.1 Refund Window</h3>
      <p>
        Annual subscription plans are eligible for a partial refund under the following conditions:
      </p>
      <ul>
        <li>The refund request is submitted within <strong>7 (seven) calendar days</strong> of the subscription start date</li>
        <li>There has been <strong>no significant usage</strong> of the platform during this period</li>
      </ul>
      <h3>4.2 Definition of "Significant Usage"</h3>
      <p>For the purposes of this policy, "significant usage" means any of the following activities:</p>
      <ul>
        <li>Creation of 5 or more client records</li>
        <li>Creation of 3 or more matters or cases</li>
        <li>Generation of any invoices</li>
        <li>Upload of documents or evidence files</li>
        <li>Generation or export of any legal drafts</li>
      </ul>
      <p>If any of the above actions have been performed, the subscription is considered to have been substantially used and is not eligible for refund.</p>

      <h3>4.3 Partial Refund Calculation</h3>
      <p>For approved refunds on annual plans within the 7-day window with no significant usage:</p>
      <ul>
        <li>The refund amount will be the total annual fee paid, minus the monthly rate for the period actually used</li>
        <li>Payment gateway transaction fees (if any) are non-refundable</li>
        <li>GST paid on the subscription fee is subject to applicable rules and may not be refundable</li>
      </ul>

      <h3>4.4 After the 7-Day Window</h3>
      <p>Annual subscription fees are non-refundable after the initial 7-day window, regardless of usage. However, you may cancel to prevent auto-renewal at the end of the annual term.</p>

      <h2>5. Exceptional Circumstances</h2>
      <p>We may consider refunds in exceptional circumstances, evaluated on a case-by-case basis:</p>
      <ul>
        <li>Extended platform unavailability (downtime exceeding 72 consecutive hours) due to our technical failure</li>
        <li>Billing errors resulting in duplicate charges</li>
        <li>Subscription activation that is demonstrably impossible due to technical issues on our end</li>
      </ul>
      <p>These exceptional refund requests must be submitted within 14 days of the qualifying event and are subject to verification.</p>

      <h2>6. How to Request a Refund</h2>
      <p>To request a refund:</p>
      <ol>
        <li>Email <a href="mailto:billing@legalos.in">billing@legalos.in</a> with the subject line "Refund Request – [Your Account Email]"</li>
        <li>Include: your registered email, subscription plan, date of purchase, and reason for refund request</li>
        <li>Our billing team will review your request and respond within 3-5 business days</li>
        <li>Approved refunds are processed within 7–15 working days to the original payment method</li>
        <li>You will receive an email confirmation once the refund is initiated</li>
      </ol>

      <h2>7. Refund Processing Timeline</h2>
      <ul>
        <li><strong>Review period:</strong> 3–5 business days from receipt of request</li>
        <li><strong>Processing time:</strong> 7–15 working days after approval</li>
        <li><strong>Bank credit time:</strong> Additional 3–7 business days depending on your bank/card issuer</li>
      </ul>
      <p>Total time from request to credit in your account: approximately 10–22 business days.</p>

      <h2>8. Cancellation Procedure</h2>
      <h3>8.1 How to Cancel</h3>
      <ul>
        <li>Log in to your LegalOS account</li>
        <li>Navigate to Account Settings → Subscription</li>
        <li>Click "Cancel Subscription" and follow the prompts</li>
        <li>You will receive a cancellation confirmation email</li>
      </ul>
      <h3>8.2 Alternatively</h3>
      <p>You may email <a href="mailto:support@legalos.in">support@legalos.in</a> with the subject "Subscription Cancellation Request" to cancel via our support team.</p>

      <h2>9. Subscription Expiry Rules</h2>
      <ul>
        <li>Upon expiry of a subscription, your account enters a 30-day grace period</li>
        <li>During the grace period, access is restricted to read-only (data export is available)</li>
        <li>After the grace period, access is suspended but data is retained for 60 more days</li>
        <li>After a total of 90 days post-expiry without renewal, data is permanently deleted</li>
        <li>We will send reminder emails at 30 days, 15 days, and 7 days before data deletion</li>
      </ul>

      <h2>10. Plan Upgrades & Downgrades</h2>
      <ul>
        <li>Upgrading your plan takes effect immediately; the price difference is prorated and charged</li>
        <li>Downgrading takes effect at the start of the next billing cycle</li>
        <li>No refund is issued for unused portions when downgrading a plan</li>
      </ul>

      <h2>11. Contact for Billing Queries</h2>
      <p>For billing and refund queries, contact us at:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:billing@legalos.in">billing@legalos.in</a></li>
        <li><strong>Support:</strong> <Link to="/contact">Contact Form</Link></li>
        <li><strong>Working Hours:</strong> Monday–Saturday, 9:00 AM – 6:00 PM IST</li>
      </ul>
    </LegalPageLayout>
  );
}
