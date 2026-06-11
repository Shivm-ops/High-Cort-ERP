export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose lg:prose-xl">
        <p>Effective Date: June 2026</p>
        <h2>1. Introduction</h2>
        <p>Welcome to LegalOS. We respect your privacy and are committed to protecting your personal data.</p>
        <h2>2. Data We Collect</h2>
        <p>We collect personal information such as name, email address, phone number, and bar council registration number. For clients, we store case details and legal documents encrypted at rest.</p>
        <h2>3. Data Security</h2>
        <p>Your data is protected using AES-256 encryption. We employ strict role-based access control and Multi-Factor Authentication.</p>
        <h2>4. Contact Us</h2>
        <p>If you have any privacy concerns, contact our Grievance Officer at privacy@legalos.in.</p>
      </div>
    </div>
  );
}
