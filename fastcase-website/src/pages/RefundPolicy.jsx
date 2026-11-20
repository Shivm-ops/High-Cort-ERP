import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, Clock, ShieldCheck, AlertCircle, CreditCard, Zap, HelpCircle } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <LegalPageLayout
      title="Refund & Cancellation Policy"
      subtitle="Clear and transparent guidelines on subscription renewals, cancellations, service fulfillment, and refund turnaround times."
      lastUpdated="November 20, 2026"
    >
      {/* ── Key Highlights Banner ── */}
      <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-600" /> Instant Digital Delivery
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            All subscriptions and plan upgrades are provisioned digitally and activated immediately upon successful transaction approval.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-[#013B36]" /> 5–7 Day Refund Window
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Approved refunds are credited directly to your original payment method (Bank / UPI / Card) within 5 to 7 working days.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-[#013B36]" /> Cancel Anytime
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            You can cancel auto-renewal at any time from your Account Settings with zero hidden penalties or exit fees.
          </p>
        </div>
      </div>

      <h2>1. Overview &amp; Commercial Entity</h2>
      <p>
        This Refund and Cancellation Policy governs all digital software subscriptions, add-on storage packs, and SaaS services purchased on <strong>Fastcase</strong> (operated by <strong>SOSM Services Private Limited</strong>).
      </p>
      <p>
        We aim to provide exceptional legal practice management software. To ensure complete fairness to advocates while covering server infrastructure allocation and SMS/WhatsApp gateway charges, we adhere to the transparent guidelines outlined below.
      </p>

      <h2>2. Digital Service Delivery &amp; Fulfillment Policy</h2>
      <p>
        Fastcase operates strictly as a cloud-based Software-as-a-Service (SaaS) platform:
      </p>
      <ul>
        <li><strong>No Physical Shipment:</strong> As Fastcase is 100% digital software, there are no physical goods, parcels, or courier shipments involved.</li>
        <li><strong>Immediate Provisioning:</strong> Upon successful transaction authorization by our payment gateway (Razorpay), your account subscription tier, cloud storage quota, and active feature flags are unlocked instantly.</li>
        <li><strong>Proof of Delivery:</strong> An official tax invoice containing our GSTIN, company details, and digital receipt is delivered to your registered advocate email immediately upon transaction completion.</li>
      </ul>

      <h2>3. Free 14-Day Evaluation Trial</h2>
      <p>
        We encourage every legal professional to evaluate Fastcase risk-free before purchasing a paid plan:
      </p>
      <ul>
        <li>New users receive a full-featured evaluation trial with zero credit card or upfront billing required.</li>
        <li>You can test case management, e-filing workspaces, client portals, and smart drafting templates without financial commitment.</li>
        <li>Because free trials involve zero monetary charge, no refunds apply to trial periods.</li>
      </ul>

      <h2>4. Subscription Plans &amp; Refund Eligibility</h2>

      <h3>4.1 Annual Subscriptions (7-Day Money-Back Guarantee)</h3>
      <p>
        We offer a <strong>7-calendar-day refund window</strong> on first-time annual subscriptions:
      </p>
      <ul>
        <li><strong>Eligibility:</strong> The refund request must be sent within 7 days of the initial subscription date, and platform usage must be minimal (fewer than 5 client records created and zero legal notices dispatched via paid WhatsApp API).</li>
        <li><strong>Deductions:</strong> Third-party payment gateway processing charges (typically 2%–3%) and applicable non-recoverable GST are deducted from the refunded sum as permitted by Indian commercial law.</li>
        <li><strong>After 7 Days:</strong> Annual subscriptions are non-refundable after the initial 7-day window has elapsed. However, you can cancel auto-renewal at any time.</li>
      </ul>

      <h3>4.2 Monthly Subscriptions</h3>
      <p>
        Monthly subscription fees are <strong>non-refundable</strong> once a monthly billing cycle has commenced. Since high-capacity cloud database resources and automated daily cause list sync services are reserved for your account immediately, fees paid for the ongoing monthly billing cycle cannot be refunded.
      </p>

      <h3>4.3 Exceptional Technical Circumstances</h3>
      <p>
        A pro-rata or full refund may be sanctioned upon managerial review in the following verified events:
      </p>
      <ul>
        <li><strong>Duplicate Billing:</strong> An accidental duplicate charge caused by network or payment gateway gateway timeouts.</li>
        <li><strong>Unscheduled Downtime:</strong> Uninterrupted platform outage exceeding 72 consecutive hours caused solely by our server infrastructure failure.</li>
      </ul>

      <h2>5. Cancellation Procedure</h2>
      <p>You can cancel your subscription at any time without having to call or wait for support:</p>
      <ol>
        <li>Sign in to your Fastcase advocate account.</li>
        <li>Go to <strong>Settings &rarr; Subscription &amp; Billing</strong>.</li>
        <li>Select <strong>"Cancel Subscription"</strong>.</li>
        <li>Confirm your selection. You will receive an automated confirmation email.</li>
      </ol>
      <p>
        <em>Effect of Cancellation:</em> Your account will remain fully functional with all enterprise features until the conclusion of your current paid billing period. No future automatic deductions will occur.
      </p>

      <h2>6. Refund Processing Timeline</h2>
      <p>
        Once a refund request is approved by our billing team:
      </p>
      <div className="not-prose my-6 border border-slate-200 rounded-2xl p-5 bg-slate-50">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Step 1: Verification</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">24 – 48 Hours</p>
            <p className="text-slate-600 mt-1">Our accounts team validates the invoice and eligibility.</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Step 2: Gateway Initiation</p>
            <p className="font-bold text-slate-800 text-sm mt-0.5">Instant</p>
            <p className="text-slate-600 mt-1">Refund instruction is submitted to Razorpay API.</p>
          </div>
          <div>
            <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Step 3: Bank Credit</p>
            <p className="font-bold text-[#059669] text-sm mt-0.5">5 – 7 Working Days</p>
            <p className="text-slate-600 mt-1">Amount is credited directly to source account/card/UPI.</p>
          </div>
        </div>
      </div>

      <h2>7. Dedicated Billing Support &amp; Dispute Resolution</h2>
      <p>
        To initiate a cancellation, request a refund, or resolve a billing discrepancy, please submit your request along with your registered email and payment ID:
      </p>
      <ul>
        <li><strong>Billing Desk Email:</strong> <a href="mailto:billing@fastcase.in">billing@fastcase.in</a></li>
        <li><strong>Customer Care Helpline:</strong> <a href="tel:+919405669420">+91 94056 69420</a> (Mon–Sat, 9:30 AM – 6:30 PM IST)</li>
        <li><strong>Corporate Office:</strong> SOSM Services Private Limited, B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India.</li>
      </ul>
    </LegalPageLayout>
  );
}
