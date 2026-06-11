import { useState } from 'react';
import { Shield, Mail, Clock, AlertCircle, CheckCircle, Send, ChevronRight } from 'lucide-react';

const escalationSteps = [
  {
    step: 1,
    title: 'Submit Your Grievance',
    desc: 'Submit your complaint via the form below or email the Grievance Officer directly.',
    duration: 'Day 0',
  },
  {
    step: 2,
    title: 'Acknowledgement',
    desc: 'You will receive a written acknowledgement of your grievance within 3 business days.',
    duration: 'Within 3 business days',
  },
  {
    step: 3,
    title: 'Investigation',
    desc: 'The Grievance Officer reviews your complaint, collects relevant information, and investigates.',
    duration: 'Days 3–25',
  },
  {
    step: 4,
    title: 'Resolution Communication',
    desc: 'The Grievance Officer communicates the decision and resolution to you in writing.',
    duration: 'Within 30 days',
  },
  {
    step: 5,
    title: 'Escalation (if required)',
    desc: 'If you are not satisfied with the resolution, you may escalate to senior management or approach applicable regulatory authorities.',
    duration: 'Post Day 30',
  },
];

const grievanceCategories = [
  'Privacy / Data Protection Concern',
  'Unauthorized Access to Account',
  'Data Breach Notification',
  'Incorrect Billing or Charge',
  'Platform Misuse or Abuse',
  'Service Quality Complaint',
  'Violation of Terms of Service',
  'Delay in Support Response',
  'Data Deletion Request Not Honored',
  'Other Grievance',
];

export default function GrievanceOfficer() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', category: '', description: '', resolution: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSubmitted(true); }, 1200);
  };

  const inputClass =
    'w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition';

  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 border border-white/20 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-5">
            Grievance Redressal
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            LegalOS is committed to resolving all user grievances in a fair, transparent,
            and timely manner. If you have a concern, we are here to help.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Left: Officer Info + Process */}
            <div className="lg:col-span-2 space-y-6">
              {/* Grievance Officer Card */}
              <div className="card p-6 border-l-4 border-primary">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-heading font-bold text-gray-900 dark:text-white">
                      Grievance Officer
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      SOSM Services Private Limited
                    </p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Name</p>
                    <p className="text-gray-800 dark:text-slate-200 font-semibold">
                      Abhijit Patil
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Designation</p>
                    <p className="text-gray-800 dark:text-slate-200">
                      Grievance Officer – LegalOS
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Email</p>
                    <a
                      href="mailto:grievance@legalos.in"
                      className="text-accent hover:underline flex items-center gap-1"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      grievance@legalos.in
                    </a>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Postal Address</p>
                    <address className="not-italic text-gray-700 dark:text-slate-300 text-xs leading-relaxed">
                      Grievance Officer – LegalOS<br />
                      SOSM Services Private Limited<br />
                      B4/5, Omkar Plaza, Rajaram Road,<br />
                      Shahupuri, Kolhapur – 416001,<br />
                      Maharashtra, India
                    </address>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-slate-500 font-medium uppercase tracking-wide mb-0.5">Contact Hours</p>
                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-slate-300 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Monday–Friday, 10:00 AM – 5:00 PM IST
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="card p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4.5 h-4.5 w-[18px] h-[18px] text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Resolution Timeline</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                      All grievances are acknowledged within <strong>3 business days</strong> and resolved within <strong>30 days</strong> of receipt. Complex cases may take longer with appropriate communication.
                    </p>
                  </div>
                </div>
              </div>

              {/* Escalation Process */}
              <div className="card p-6">
                <h3 className="text-sm font-heading font-semibold text-gray-900 dark:text-white mb-4">
                  Escalation Process
                </h3>
                <div className="space-y-4">
                  {escalationSteps.map((s) => (
                    <div key={s.step} className="flex gap-3">
                      <div className="w-6 h-6 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{s.title}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mt-0.5">{s.desc}</p>
                        <p className="text-xs text-accent font-medium mt-0.5">{s.duration}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Grievance Form */}
            <div className="lg:col-span-3">
              <div className="card p-8">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-brand-success" />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                      Grievance Submitted
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400 text-sm max-w-sm mx-auto mb-2">
                      Your grievance has been received. You will receive an acknowledgement within 3 business days at your registered email.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-500 mb-6">
                      Please retain any reference number provided in the acknowledgement email for future correspondence.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', category: '', description: '', resolution: '' }); }}
                      className="btn-primary text-sm px-6 py-2.5"
                    >
                      Submit Another Grievance
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1">
                      Submit a Grievance
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                      Please provide complete details so we can investigate and resolve your concern effectively.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Your Full Name"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Registered Email <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="email@example.com"
                            className={inputClass}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Mobile Number
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+91 XXXXX XXXXX"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Grievance Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="category"
                            value={form.category}
                            onChange={handleChange}
                            required
                            className={inputClass}
                          >
                            <option value="">Select category…</option>
                            {grievanceCategories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                          Detailed Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleChange}
                          required
                          rows={4}
                          placeholder="Describe your grievance in detail. Include dates, account details, and any relevant information…"
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                          Expected Resolution
                        </label>
                        <textarea
                          name="resolution"
                          value={form.resolution}
                          onChange={handleChange}
                          rows={2}
                          placeholder="What resolution are you seeking? (Optional)"
                          className={`${inputClass} resize-none`}
                        />
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-xs text-yellow-800 dark:text-yellow-300">
                          <strong>Important:</strong> By submitting this form, you confirm that the information provided is accurate to the best of your knowledge. False or misleading grievances may be rejected.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center text-sm py-3 disabled:opacity-60"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Submitting…
                          </span>
                        ) : (
                          <>Submit Grievance <Send className="w-4 h-4" /></>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
