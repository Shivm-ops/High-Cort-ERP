import LegalPageLayout from '../components/LegalPageLayout';
import { Shield, Lock, Eye, Server, RefreshCw, AlertCircle } from 'lucide-react';

const securityPillars = [
  { icon: Lock, title: 'Encryption', desc: 'AES-256 at rest, TLS 1.2+ in transit', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: Eye, title: 'Access Control', desc: 'Role-based, least-privilege access', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { icon: Server, title: 'Secure Storage', desc: 'Tenant-isolated cloud infrastructure', color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { icon: RefreshCw, title: 'Backup & Recovery', desc: 'Automated backups, disaster recovery', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  { icon: AlertCircle, title: 'Monitoring', desc: '24/7 security monitoring & alerts', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { icon: Shield, title: 'Audit Trails', desc: 'Complete activity logging', color: 'text-primary', bg: 'bg-primary/5 dark:bg-primary/20' },
];

export default function DataSecurity() {
  return (
    <LegalPageLayout
      title="Data Security Policy"
      subtitle="How LegalOS protects your legal data and client information with enterprise-grade security."
      lastUpdated="June 1, 2025"
    >
      {/* Security Pillars */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10 not-prose">
        {securityPillars.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className={`${p.bg} rounded-xl p-4 text-center`}>
              <Icon className={`w-6 h-6 ${p.color} mx-auto mb-2`} />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.title}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{p.desc}</p>
            </div>
          );
        })}
      </div>

      <h2>1. Our Commitment to Security</h2>
      <p>
        SOSM Services Private Limited understands that legal data is among the most sensitive information a person can share. Client identities, case strategies, financial information, and evidence files require the highest level of protection. Our security posture is built on the principle of defense-in-depth — multiple layers of security working together to protect your data.
      </p>

      <h2>2. Encryption</h2>
      <h3>2.1 Encryption at Rest</h3>
      <ul>
        <li>All data stored on LegalOS servers is encrypted using AES-256 (Advanced Encryption Standard with 256-bit keys)</li>
        <li>Documents, attachments, and evidence files are encrypted individually</li>
        <li>Database fields containing sensitive information (Aadhaar, PAN, etc.) use field-level encryption</li>
        <li>Encryption keys are managed through a secure key management service and are rotated periodically</li>
      </ul>

      <h3>2.2 Encryption in Transit</h3>
      <ul>
        <li>All data transmitted between your browser/app and LegalOS servers uses TLS 1.2 or higher</li>
        <li>HTTP Strict Transport Security (HSTS) is enforced to prevent downgrade attacks</li>
        <li>SSL/TLS certificates are from trusted Certificate Authorities and are renewed automatically</li>
        <li>Internal service-to-service communication is also encrypted</li>
      </ul>

      <h2>3. Role-Based Access Control (RBAC)</h2>
      <p>LegalOS implements granular role-based access control to ensure each user can only access data relevant to their role:</p>
      <ul>
        <li><strong>Super Admin / Account Owner:</strong> Full access to all data and settings within the account</li>
        <li><strong>Senior Advocate:</strong> Access to all matters, clients, and team management</li>
        <li><strong>Junior Advocate:</strong> Access to assigned matters and related documents only</li>
        <li><strong>Clerk / Paralegal:</strong> Restricted access to operational data; no access to sensitive client financials or KYC by default</li>
        <li><strong>Client Portal User:</strong> Access only to their own case information as permitted by the advocate</li>
      </ul>
      <p>Access permissions are configurable by account administrators and follow the principle of least privilege.</p>

      <h2>4. Audit Logs</h2>
      <ul>
        <li>All significant user actions are logged in tamper-evident audit trails</li>
        <li>Logged events include: logins, data access, document views, downloads, edits, deletions, and permission changes</li>
        <li>Audit logs include timestamp, user identity, IP address, and action details</li>
        <li>Logs are retained for a minimum of 12 months</li>
        <li>Account administrators can access audit logs for their organization at any time</li>
      </ul>

      <h2>5. Tenant Isolation</h2>
      <ul>
        <li>Each LegalOS account operates in an isolated data environment (tenant isolation)</li>
        <li>Data from one account cannot be accessed by another account under any circumstances</li>
        <li>Database queries are scoped to the authenticated tenant's data only</li>
        <li>Storage buckets and document repositories are segregated by tenant</li>
        <li>Regular penetration testing verifies that tenant isolation remains intact</li>
      </ul>

      <h2>6. Secure Document Storage</h2>
      <ul>
        <li>All uploaded documents are stored in secure, enterprise-grade cloud object storage</li>
        <li>Document storage is geo-redundant with copies maintained in multiple availability zones within India</li>
        <li>Direct document URLs are signed, time-limited, and cannot be shared without authentication</li>
        <li>Antivirus/malware scanning is applied to all uploaded files before storage</li>
        <li>File integrity checks verify documents have not been tampered with</li>
      </ul>

      <h2>7. Backup Systems</h2>
      <ul>
        <li>Database backups are performed daily and retained for 30 days</li>
        <li>Incremental backups are taken every 6 hours</li>
        <li>Document and file backups are synchronized in real time to redundant storage</li>
        <li>Backup integrity is verified through regular restoration tests</li>
        <li>Critical data is replicated across multiple geographic regions within India</li>
      </ul>

      <h2>8. Disaster Recovery</h2>
      <ul>
        <li>LegalOS maintains a comprehensive Disaster Recovery Plan (DRP)</li>
        <li>Recovery Time Objective (RTO): 4 hours for major incidents</li>
        <li>Recovery Point Objective (RPO): Maximum 6 hours of data loss in a catastrophic failure scenario</li>
        <li>Failover procedures are tested at least twice per year</li>
        <li>In the event of a major incident, users are notified via email with status updates</li>
      </ul>

      <h2>9. Security Monitoring</h2>
      <ul>
        <li>24/7 automated monitoring of platform infrastructure for security anomalies</li>
        <li>Intrusion Detection System (IDS) and Intrusion Prevention System (IPS) deployed</li>
        <li>Automated alerts for suspicious activity such as unusual login patterns or excessive data access</li>
        <li>DDoS protection and rate limiting on all public-facing endpoints</li>
        <li>Vulnerability scanning of the platform on a regular schedule</li>
        <li>Security patches applied within 72 hours of critical vulnerability disclosure</li>
      </ul>

      <h2>10. Application Security</h2>
      <ul>
        <li>SQL injection, XSS, CSRF, and other OWASP Top 10 vulnerabilities are mitigated</li>
        <li>All user inputs are validated and sanitized server-side</li>
        <li>Dependency libraries are regularly updated and scanned for known vulnerabilities</li>
        <li>Secure coding practices are enforced through code review processes</li>
        <li>Regular third-party security audits and penetration testing</li>
      </ul>

      <h2>11. Physical Security</h2>
      <ul>
        <li>LegalOS infrastructure is hosted on enterprise cloud providers with SOC 2 Type II certification</li>
        <li>Data centers have 24/7 physical security, biometric access, CCTV surveillance</li>
        <li>Hosting infrastructure is located in India-based data centers where possible</li>
        <li>Our internal team has controlled access to production systems with mandatory MFA</li>
      </ul>

      <h2>12. Incident Response</h2>
      <p>In the event of a security incident or data breach:</p>
      <ol>
        <li>The incident is immediately contained and assessed by our security team</li>
        <li>Affected users are notified within 72 hours of our becoming aware of the breach</li>
        <li>Notification includes the nature of the breach, data affected, and remediation steps</li>
        <li>A full post-incident analysis is conducted and improvements implemented</li>
        <li>If legally required, appropriate government authorities are notified</li>
      </ol>

      <h2>13. Your Security Responsibilities</h2>
      <p>Users also play a role in keeping LegalOS secure:</p>
      <ul>
        <li>Use strong, unique passwords for your LegalOS account</li>
        <li>Enable two-factor authentication (2FA) if available</li>
        <li>Do not share your login credentials with unauthorized persons</li>
        <li>Log out of your account when using shared or public devices</li>
        <li>Report any suspicious activity immediately to <a href="mailto:security@legalos.in">security@legalos.in</a></li>
        <li>Keep your contact email and recovery information up to date</li>
      </ul>

      <h2>14. Contact Our Security Team</h2>
      <p>To report a security vulnerability or incident:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:security@legalos.in">security@legalos.in</a></li>
        <li><strong>Subject:</strong> "Security Vulnerability Report – LegalOS"</li>
        <li>We acknowledge security reports within 24 hours and provide updates as the issue is investigated</li>
      </ul>
    </LegalPageLayout>
  );
}
