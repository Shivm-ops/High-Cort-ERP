import LegalPageLayout from '../components/LegalPageLayout';
import { Shield, Lock, Eye, Server, RefreshCw, AlertCircle, CheckCircle2, KeyRound, HardDrive, ShieldCheck } from 'lucide-react';

const securityPillars = [
  { icon: Lock, title: 'AES-256 Encryption', desc: 'Military-grade encryption at rest and TLS 1.3 in transit', color: 'text-[#059669]', bg: 'bg-[#ECFDF5] border border-[#A7F3D0]' },
  { icon: KeyRound, title: 'Granular RBAC', desc: 'Strict role-based permissions for advocates, associates, & clerks', color: 'text-[#013B36]', bg: 'bg-slate-50 border border-slate-200' },
  { icon: Server, title: 'Indian Data Residency', desc: 'Tier-IV MeitY-empanelled cloud data centers in India', color: 'text-[#013B36]', bg: 'bg-slate-50 border border-slate-200' },
  { icon: RefreshCw, title: 'Automated Backups', desc: 'Daily geo-redundant snapshots with 30-day point-in-time recovery', color: 'text-[#013B36]', bg: 'bg-slate-50 border border-slate-200' },
  { icon: Eye, title: 'Tamper-Evident Logs', desc: 'Immutable audit trails tracking all case file views and downloads', color: 'text-[#013B36]', bg: 'bg-slate-50 border border-slate-200' },
  { icon: ShieldCheck, title: 'Tenant Isolation', desc: 'Logical and cryptographic separation across all legal chambers', color: 'text-[#059669]', bg: 'bg-[#ECFDF5] border border-[#A7F3D0]' },
];

export default function DataSecurity() {
  return (
    <LegalPageLayout
      title="Data Security Architecture"
      subtitle="How Fastcase implements defense-in-depth security, sovereign Indian data residency, and cryptographic controls to protect confidential legal archives."
      lastUpdated="November 20, 2026"
    >
      {/* ── Security Pillars Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10 not-prose">
        {securityPillars.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.title} className={`${p.bg} rounded-2xl p-4 transition-all shadow-2xs`}>
              <div className="w-8 h-8 rounded-xl bg-white shadow-xs flex items-center justify-center mb-2.5">
                <Icon className={`w-4 h-4 ${p.color}`} />
              </div>
              <p className="text-sm font-bold text-slate-900">{p.title}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{p.desc}</p>
            </div>
          );
        })}
      </div>

      <h2>1. Security Architecture &amp; Indian Data Residency</h2>
      <p>
        Legal documents represent the highest standard of privileged information. At <strong>Fastcase</strong> (operated by <strong>SOSM Services Private Limited</strong>), we design our infrastructure under the zero-trust paradigm.
      </p>
      <p>
        All customer databases, documents, and evidentiary files are hosted exclusively on <strong>Tier-IV certified, MeitY-empanelled cloud infrastructure located physically within the Republic of India</strong>. We guarantee that no foreign data transfer occurs, strictly fulfilling the Indian Digital Personal Data Protection Act (DPDP Act 2023) mandates.
      </p>

      <h2>2. Cryptographic Protection</h2>

      <h3>2.1 Data at Rest (AES-256)</h3>
      <ul>
        <li><strong>Volume &amp; File Encryption:</strong> Case attachments, client identity proofs, and pleadings are encrypted using AES-256 (Advanced Encryption Standard with 256-bit keys).</li>
        <li><strong>Field-Level Encryption:</strong> Sensitive PII fields (including Aadhaar, PAN, and client contact details) are stored using deterministic field-level cryptography to prevent unauthorized database querying.</li>
        <li><strong>Key Rotation:</strong> Encryption keys are segregated from application data and managed through hardware security modules (HSM) with scheduled key rotation.</li>
      </ul>

      <h3>2.2 Data in Transit (TLS 1.3)</h3>
      <ul>
        <li>All browser, mobile, and API communications are enforced through Transport Layer Security (TLS 1.3) with perfect forward secrecy.</li>
        <li>HTTP Strict Transport Security (HSTS) with preloading is enabled to defend against protocol downgrade and man-in-the-middle attacks.</li>
        <li>Legacy cryptographic ciphers (SSLv3, TLS 1.0, and TLS 1.1) are disabled across all endpoints.</li>
      </ul>

      <h2>3. Multi-Tenant Cryptographic Isolation</h2>
      <p>
        Each advocate chamber operates within a logically isolated virtual partition:
      </p>
      <ul>
        <li>Every SQL query executed by our backend engines automatically injects the verified tenant token (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">tenant_id</code>) derived from cryptographically signed JWT tokens.</li>
        <li>Document storage buckets utilize dynamic access policies ensuring that no subscriber can ever read, browse, or query documents belonging to another chamber.</li>
      </ul>

      <h2>4. Role-Based Access Control (RBAC)</h2>
      <p>Within a legal chamber, account owners have granular control over associate permissions:</p>
      <ul>
        <li><strong>Managing Partner / Senior Advocate:</strong> Complete administrative control, billing management, audit log inspection, and team allocation.</li>
        <li><strong>Associate Advocate:</strong> Access restricted to assigned case briefs, calendar items, and drafting folders.</li>
        <li><strong>Court Clerk / Paralegal:</strong> Operational access to cause lists, filing records, and task boards, with sensitive billing and financial modules disabled.</li>
        <li><strong>Client Portal User:</strong> Restricted read-only access to their own specific matter updates as permitted by the advocate.</li>
      </ul>

      <h2>5. Disaster Recovery &amp; Geo-Redundant Backups</h2>
      <p>We maintain comprehensive business continuity standards to ensure zero loss of legal archives:</p>
      <ul>
        <li><strong>Backup Frequency:</strong> Complete database snapshots are taken every 24 hours, complemented by continuous transaction-log streaming every 15 minutes.</li>
        <li><strong>Recovery Objectives:</strong> Our Recovery Point Objective (RPO) is under 2 hours, and our Recovery Time Objective (RTO) is under 4 hours for catastrophic scenarios.</li>
        <li><strong>Geo-Redundancy:</strong> Backups are mirrored across multiple geographic disaster zones within India to guard against regional network disruptions.</li>
      </ul>

      <h2>6. Continuous Security Monitoring &amp; Vulnerability Testing</h2>
      <ul>
        <li><strong>DDoS Mitigation:</strong> Cloudflare edge protection shields all public APIs against Distributed Denial of Service (DDoS) spikes.</li>
        <li><strong>Web Application Firewall (WAF):</strong> Automated inspection blocks OWASP Top-10 attacks, including SQL Injection, Cross-Site Scripting (XSS), and CSRF.</li>
        <li><strong>Third-Party Penetration Testing:</strong> Independent CERT-In certified cybersecurity firms conduct regular penetration testing and code audits.</li>
      </ul>

      <h2>7. Vulnerability Disclosure &amp; Security Contact</h2>
      <p>
        We value the contributions of security researchers. If you identify a potential security vulnerability within our platform, please report it immediately:
      </p>
      <ul>
        <li><strong>Security Desk Email:</strong> <a href="mailto:security@fastcase.in">security@fastcase.in</a></li>
        <li><strong>Subject Line:</strong> "Security Vulnerability Report – [Component]"</li>
        <li><strong>Emergency Phone:</strong> <a href="tel:+919405669420">+91 94056 69420</a></li>
        <li><strong>Commitment:</strong> We acknowledge receipt within 24 hours and commit to resolving verified issues with high priority.</li>
      </ul>
    </LegalPageLayout>
  );
}
