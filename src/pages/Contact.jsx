import { useState } from 'react';
import { MapPin, Mail, Clock, Send, CheckCircle, Phone } from 'lucide-react';

const contactReasons = [
  'General Enquiry',
  'Technical Support',
  'Billing & Payments',
  'Sales & Subscription',
  'Feature Request',
  'Data / Privacy Request',
  'Partnership Enquiry',
  'Other',
];

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #0F4C81 0%, #1E3A5F 100%)' }} className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-5">Contact Us</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Have a question, need support, or want to learn more about LegalOS?
            We're here to help.
          </p>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Company Card */}
              <div className="card p-6">
                <h2 className="text-lg font-heading font-bold text-primary dark:text-blue-300 mb-5">
                  SOSM Services Private Limited
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/5 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4.5 h-4.5 w-[18px] h-[18px] text-primary dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-0.5">Registered Office</p>
                      <address className="not-italic text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                        B4/5, Omkar Plaza,<br />
                        Rajaram Road, Near ICICI Bank,<br />
                        E Ward, Shahupuri,<br />
                        Kolhapur – 416001,<br />
                        Maharashtra, India
                      </address>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/5 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-[18px] h-[18px] text-primary dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-0.5">Email</p>
                      <a href="mailto:support@legalos.in" className="text-sm text-accent hover:underline">
                        support@legalos.in
                      </a>
                      <br />
                      <a href="mailto:sales@legalos.in" className="text-sm text-accent hover:underline">
                        sales@legalos.in
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-primary/5 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-[18px] h-[18px] text-primary dark:text-blue-300" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-0.5">Working Hours</p>
                      <p className="text-sm text-gray-600 dark:text-slate-400">
                        Monday – Saturday<br />
                        9:00 AM – 6:00 PM IST
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                        Closed on Sundays & National Holidays
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Emails */}
              <div className="card p-6">
                <h3 className="text-sm font-heading font-semibold text-gray-900 dark:text-white mb-4">
                  Department Contacts
                </h3>
                <div className="space-y-3">
                  {[
                    { dept: 'Technical Support', email: 'support@legalos.in' },
                    { dept: 'Billing & Payments', email: 'billing@legalos.in' },
                    { dept: 'Sales & Subscription', email: 'sales@legalos.in' },
                    { dept: 'Privacy & Data Requests', email: 'privacy@legalos.in' },
                    { dept: 'Legal & Compliance', email: 'legal@legalos.in' },
                    { dept: 'Security Issues', email: 'security@legalos.in' },
                  ].map((d) => (
                    <div key={d.dept} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-gray-500 dark:text-slate-400">{d.dept}</span>
                      <a href={`mailto:${d.email}`} className="text-xs text-accent hover:underline font-medium">
                        {d.email}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="card p-8">
                {submitted ? (
                  <div className="text-center py-10">
                    <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-brand-success" />
                    </div>
                    <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-2">
                      Message Sent Successfully!
                    </h2>
                    <p className="text-gray-600 dark:text-slate-400 text-sm max-w-sm mx-auto">
                      Thank you for reaching out. Our team will review your message and respond within 1–2 business days.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', organization: '', subject: '', message: '' }); }}
                      className="btn-primary mt-6 text-sm px-6 py-2.5"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-heading font-bold text-gray-900 dark:text-white mb-1">
                      Send Us a Message
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">
                      Fill the form below and we'll get back to you within 1–2 business days.
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
                            placeholder="Adv. Your Name"
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="advocate@example.com"
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
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
                            placeholder="+91 98765 43210"
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                            Organization / Law Firm
                          </label>
                          <input
                            type="text"
                            name="organization"
                            value={form.organization}
                            onChange={handleChange}
                            placeholder="Your Law Firm Name"
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                          Subject / Reason <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
                        >
                          <option value="">Select a reason…</option>
                          {contactReasons.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          placeholder="Describe your query or issue in detail…"
                          className="w-full px-3 py-2.5 text-sm bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full justify-center text-sm py-3 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Sending…
                          </span>
                        ) : (
                          <>
                            Send Message <Send className="w-4 h-4" />
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 dark:text-slate-500 text-center">
                        By submitting this form you agree to our{' '}
                        <a href="/privacy-policy" className="text-accent hover:underline">Privacy Policy</a>.
                      </p>
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
