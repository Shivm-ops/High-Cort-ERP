import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Settings, Info, CheckCircle2, Lock } from 'lucide-react';

const cookieTypes = [
  {
    name: 'Strictly Necessary & Authentication Cookies',
    badge: 'Mandatory',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    purpose: 'Required for core platform operations, security tokens, and advocate login session persistence.',
    cookies: [
      { name: 'access_token', duration: '7 days', role: 'Cryptographically signed JWT bearer token for API authentication' },
      { name: 'refresh_token', duration: '30 days', role: 'Secure HTTP-only token to refresh authenticated advocate sessions' },
      { name: 'csrftoken', duration: 'Session', role: 'Protects against Cross-Site Request Forgery attacks on court filings & forms' },
    ],
  },
  {
    name: 'Payment & Transaction Security Cookies',
    badge: 'Mandatory',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    purpose: 'Set by our RBI-licensed payment gateway partner (Razorpay) to verify transactional integrity and prevent card fraud.',
    cookies: [
      { name: 'rzp_checkout', duration: 'Session', role: 'Maintains transaction state during subscription checkout' },
      { name: 'rzp_device_id', duration: '1 year', role: 'Fraud detection and 3D-Secure 2.0 transaction authentication' },
    ],
  },
  {
    name: 'User Preference & Workspace State',
    badge: 'Functional',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    purpose: 'Stores UI custom preferences such as dark/light interface mode and collapsed sidebar navigation.',
    cookies: [
      { name: 'fastcase_theme', duration: '1 year', role: 'Stores your selected workspace theme (light or high-contrast dark)' },
      { name: 'sidebar_collapsed', duration: '1 year', role: 'Preserves your advocate dashboard layout and folder drawer states' },
    ],
  },
  {
    name: 'Performance & Diagnostic Telemetry',
    badge: 'Optional',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    purpose: 'Helps our engineering team monitor API latency, cause list sync speed, and server uptime. No personal legal files or case data are ever tracked.',
    cookies: [
      { name: 'fc_perf_telemetry', duration: '30 days', role: 'Aggregated error reporting and client page load speed metrics' },
    ],
  },
];

export default function CookiePolicy() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="Complete disclosure of cookies, local storage identifiers, and session tokens utilized across the Fastcase Legal Platform."
      lastUpdated="November 20, 2026"
    >
      {/* ── Key Highlights Callout ── */}
      <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5 text-[#059669]" /> Zero Advertising
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            Fastcase does not use third-party marketing or tracking pixels. We never monetize or sell advocate data.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5 text-[#059669]" /> Bank-Grade Security
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            All authentication tokens are transmitted exclusively over encrypted TLS 1.3 channels with strict SameSite rules.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <Settings className="w-3.5 h-3.5 text-[#059669]" /> User Control
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            You can configure, review, or clear cookies directly via your browser settings at any time without penalty.
          </p>
        </div>
      </div>

      <h2>1. What Are Cookies and Local Storage?</h2>
      <p>
        Cookies are small text strings and encrypted data tokens placed on your workstation or mobile device when you interact with <strong>Fastcase</strong> (operated by <strong>SOSM Services Private Limited</strong>). In addition to traditional HTTP cookies, our application utilizes browser LocalStorage and SessionStorage to cache encrypted application state, such as active case draft IDs and user preferences.
      </p>
      <p>
        These technologies ensure that your active court diary sessions remain active without repeated login prompts, prevent unauthorized access to confidential legal case files, and secure payment processing.
      </p>

      <h2>2. Categories of Cookies We Deploy</h2>
      <p>Below is an itemized breakdown of all first-party and verified third-party tokens deployed on our domain:</p>

      <div className="not-prose space-y-4 my-6">
        {cookieTypes.map((c) => (
          <div key={c.name} className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Cookie className="w-4 h-4 text-[#013B36]" />
                <h3 className="text-sm font-bold text-slate-900">{c.name}</h3>
              </div>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${c.badgeClass}`}>
                {c.badge}
              </span>
            </div>
            
            <div className="p-4 text-xs text-slate-600">
              <p className="mb-3 leading-relaxed">{c.purpose}</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-1.5 pr-4">Cookie / Token</th>
                      <th className="py-1.5 pr-4">Retention</th>
                      <th className="py-1.5">Operational Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {c.cookies.map((item) => (
                      <tr key={item.name}>
                        <td className="py-2 pr-4 font-mono font-bold text-[#013B36]">{item.name}</td>
                        <td className="py-2 pr-4 font-medium text-slate-500">{item.duration}</td>
                        <td className="py-2 text-slate-600">{item.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2>3. Third-Party Integrations</h2>
      <p>
        Fastcase does not partner with behavioral advertisement networks or data brokers. Third-party cookies are strictly limited to technical service partners required to fulfill our legal tech service:
      </p>
      <ul>
        <li><strong>Razorpay Software Private Limited:</strong> Our PCI-DSS Level 1 compliant payment gateway. Razorpay places cryptographic tokens to authenticate card, UPI, and net banking transactions and safeguard against payment fraud.</li>
        <li><strong>WhatsApp Cloud API (Meta Platforms):</strong> When you trigger automated cause list reminders or client notices, message delivery telemetry is handled securely through Meta’s enterprise API infrastructure.</li>
      </ul>

      <h2>4. How to Manage and Disable Cookies in Your Browser</h2>
      <p>
        You have the legal right to decide whether to accept or reject non-essential cookies. You can modify your browser settings to decline all cookies or to alert you whenever a cookie is offered:
      </p>
      <ul>
        <li><strong>Google Chrome:</strong> Settings &rarr; Privacy and security &rarr; Third-party cookies.</li>
        <li><strong>Mozilla Firefox:</strong> Settings &rarr; Privacy &amp; Security &rarr; Enhanced Tracking Protection.</li>
        <li><strong>Apple Safari:</strong> Preferences &rarr; Privacy &rarr; Manage Website Data.</li>
        <li><strong>Microsoft Edge:</strong> Settings &rarr; Cookies and site permissions &rarr; Manage and delete cookies.</li>
      </ul>
      <p>
        <em>Please Note:</em> Because authentication tokens (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">access_token</code>) are strictly necessary to verify your advocate credentials, disabling all cookies will prevent you from signing in to the Fastcase dashboard.
      </p>

      <h2>5. Updates to This Cookie Policy</h2>
      <p>
        We may update this policy periodically to reflect statutory updates or changes in platform features. When changes are published, the revised effective date at the top of this page will be updated.
      </p>

      <h2>6. Privacy &amp; Data Protection Officer Contact</h2>
      <p>
        For inquiries regarding our cookie management or privacy safeguards, please reach out to our dedicated compliance desk:
      </p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@fastcase.in">privacy@fastcase.in</a></li>
        <li><strong>Direct Helpline:</strong> <a href="tel:+919405669420">+91 94056 69420</a></li>
        <li><strong>Postal Mail:</strong> SOSM Services Private Limited, B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India.</li>
      </ul>
    </LegalPageLayout>
  );
}
