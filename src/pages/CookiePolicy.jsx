import LegalPageLayout from '../components/LegalPageLayout';
import { Link } from 'react-router-dom';

const cookieTypes = [
  {
    name: 'Essential / Strictly Necessary Cookies',
    purpose: 'Required for the platform to function. Cannot be disabled.',
    examples: ['Session management', 'Authentication tokens', 'Security tokens (CSRF protection)', 'Load balancing'],
    canDisable: false,
    duration: 'Session or up to 24 hours',
  },
  {
    name: 'Login & Authentication Cookies',
    purpose: 'Remember your login state and keep you authenticated.',
    examples: ['Remember me cookies', 'Authentication tokens', 'Account preference storage'],
    canDisable: false,
    duration: 'Up to 30 days (if "Remember Me" selected)',
  },
  {
    name: 'Session Cookies',
    purpose: 'Maintain your session and track activity within a single visit.',
    examples: ['Active session identifiers', 'Temporary workflow state', 'Form data retention during session'],
    canDisable: false,
    duration: 'Session only (deleted when browser closes)',
  },
  {
    name: 'Preference / Functional Cookies',
    purpose: 'Remember your choices and personalize your experience.',
    examples: ['Theme preference (light/dark)', 'Language preference', 'Sidebar state', 'Table column preferences'],
    canDisable: true,
    duration: 'Up to 1 year',
  },
  {
    name: 'Analytics Cookies',
    purpose: 'Help us understand how the platform is used so we can improve it.',
    examples: ['Page views and navigation tracking', 'Feature usage analytics', 'Performance monitoring', 'Error tracking'],
    canDisable: true,
    duration: 'Up to 2 years',
  },
];

export default function CookiePolicy() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      subtitle="How LegalOS uses cookies and similar tracking technologies."
      lastUpdated="June 1, 2025"
    >
      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files stored on your device (computer, tablet, or mobile phone) when you visit a website or use a web application. They are widely used to make websites work efficiently, remember your preferences, and provide analytics information.
      </p>
      <p>
        LegalOS uses cookies and similar technologies (such as local storage and session storage) to provide a better user experience, maintain your login session, remember your preferences, and understand how the platform is used.
      </p>

      <h2>2. Types of Cookies We Use</h2>
      <p>We use the following categories of cookies on the LegalOS platform:</p>

      <div className="not-prose space-y-5 my-6">
        {cookieTypes.map((c) => (
          <div key={c.name} className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 bg-primary/5 dark:bg-primary/10 flex items-start justify-between gap-4">
              <h3 className="text-sm font-semibold text-primary dark:text-blue-300">{c.name}</h3>
              <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                c.canDisable
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {c.canDisable ? 'Optional' : 'Required'}
              </span>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800">
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-3">{c.purpose}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-slate-500 mb-3">
                <span><strong>Duration:</strong> {c.duration}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Examples:</p>
                <ul className="text-xs text-gray-500 dark:text-slate-400 space-y-0.5 list-disc list-inside ml-2">
                  {c.examples.map((e) => <li key={e}>{e}</li>)}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2>3. How We Use Cookie Information</h2>
      <p>Information collected through cookies is used to:</p>
      <ul>
        <li>Keep you logged in to your LegalOS account securely</li>
        <li>Remember your preferences such as dark/light mode and language settings</li>
        <li>Prevent Cross-Site Request Forgery (CSRF) attacks</li>
        <li>Analyze how different features are used to improve the platform</li>
        <li>Detect unusual activity and prevent fraud</li>
        <li>Measure platform performance and identify technical issues</li>
      </ul>

      <h2>4. Third-Party Cookies</h2>
      <p>Some cookies on LegalOS may be set by third-party services we use:</p>
      <ul>
        <li><strong>Analytics Providers:</strong> We may use analytics tools to understand platform usage patterns. These tools may set their own cookies. Data collected is anonymized and aggregated.</li>
        <li><strong>Payment Gateways:</strong> When you make payments, the payment gateway may set cookies for fraud prevention and transaction processing.</li>
        <li><strong>Error Tracking Services:</strong> Tools that help us identify and fix technical errors may collect session data.</li>
      </ul>
      <p>We do not use cookies for advertising or share cookie data with advertising networks.</p>

      <h2>5. Managing Your Cookie Preferences</h2>
      <h3>5.1 Browser Settings</h3>
      <p>You can control cookies through your web browser settings. Most browsers allow you to:</p>
      <ul>
        <li>View cookies stored by websites</li>
        <li>Delete specific or all cookies</li>
        <li>Block cookies from specific websites</li>
        <li>Block all third-party cookies</li>
        <li>Receive alerts when cookies are being set</li>
      </ul>

      <h3>5.2 Impact of Disabling Cookies</h3>
      <p>
        <strong>Essential and session cookies cannot be disabled</strong> without severely impacting platform functionality. Disabling essential cookies may prevent you from logging in or using core features of LegalOS.
      </p>
      <p>
        Disabling optional (analytics and preference) cookies will not affect your ability to use the platform but may result in reduced personalization.
      </p>

      <h3>5.3 Cookie Settings in LegalOS</h3>
      <p>Where technically feasible, LegalOS will provide in-platform cookie preference controls. Look for the cookie settings option in your account preferences.</p>

      <h2>6. Local Storage & Session Storage</h2>
      <p>
        In addition to cookies, LegalOS may use browser local storage and session storage to store application state, cached data, and user preferences. These are similar to cookies but are stored differently in your browser. You can clear local/session storage through your browser's developer tools or privacy settings.
      </p>

      <h2>7. Do Not Track</h2>
      <p>
        Some browsers support a "Do Not Track" (DNT) setting. Currently, there is no industry standard for how platforms should respond to DNT signals. LegalOS does not currently respond to DNT signals from browsers, but we honor opt-out preferences through our own cookie preference controls.
      </p>

      <h2>8. Changes to This Policy</h2>
      <p>
        We may update this Cookie Policy from time to time to reflect changes in our practices or applicable regulations. We will notify registered users of significant changes. Continued use of LegalOS after updates constitutes acceptance of the revised policy.
      </p>

      <h2>9. Contact Us</h2>
      <p>For questions about our use of cookies, contact us at:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:privacy@legalos.in">privacy@legalos.in</a></li>
        <li><strong>Contact Form:</strong> <Link to="/contact">Click here</Link></li>
      </ul>
    </LegalPageLayout>
  );
}
