import { useState } from 'react';
import { MapPin, Mail, Clock, Send, CheckCircle, Phone, Building2, MessageSquare, ShieldCheck, Sparkles } from 'lucide-react';

const contactReasons = [
  'General Enquiry',
  'Advocate Onboarding Support',
  'Subscription & Billing',
  'Feature Request',
  'Law Firm / Enterprise Demo',
  'Data Privacy & Security Inquiry',
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
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '2331143f-9c75-4def-8367-75e6f7890ec9';

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: accessKey,
          from_name: 'Fastcase Website Inquiry',
          subject: `Fastcase Inquiry: ${form.subject || 'General'} from ${form.name}`,
          name: form.name,
          email: form.email,
          phone: form.phone || 'N/A',
          organization: form.organization || 'N/A',
          message: form.message,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSubmitted(true);
      } else {
        setError(result.message || 'Failed to send message. Please try again or email us directly.');
      }
    } catch (err) {
      setError('Network error. Please try again or reach out to us at contact@fastcase.in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F8FAFC]">
      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #021816 0%, #013B36 55%, #074E47 100%)' }} className="pt-28 pb-16 text-white relative overflow-hidden">
        <div className="section-container text-center max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[12px] font-bold tracking-wider uppercase px-4 py-1.5 rounded-full mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Support & Communications
          </div>
          <h1 className="font-heading font-[900] text-3xl sm:text-4xl md:text-5xl tracking-tight mb-4">
            Get in Touch with Fastcase
          </h1>
          <p className="text-base sm:text-lg text-sky-100/75 leading-relaxed max-w-xl mx-auto">
            Whether you need practice onboarding, technical help, or have questions about legal billing, our team is ready to assist you.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <section className="section-padding py-16">
        <div className="section-container max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 items-start">

            {/* Left: Contact Info (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">

              {/* Corporate Card */}
              <div className="bg-white rounded-3xl p-7 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-heading font-[800] text-base text-slate-900 leading-tight">
                      SOSM Services Private Limited
                    </h2>
                    <p className="text-[12px] text-slate-500 font-medium">Fastcase Platform Headquarters</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registered Office</p>
                      <address className="not-italic text-[13px] text-slate-700 leading-relaxed mt-0.5">
                        B4/5, Omkar Plaza, Rajaram Road,<br />
                        Near ICICI Bank, E Ward, Shahupuri,<br />
                        Kolhapur – 416001, Maharashtra, India
                      </address>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct Phone</p>
                      <a href="tel:+919405669420" className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors block mt-0.5">
                        +91 94056 69420
                      </a>
                      <span className="text-[11px] text-slate-400">Available Mon–Sat (9 AM – 6 PM IST)</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Official Email</p>
                      <a href="mailto:contact@fastcase.in" className="text-[13px] font-semibold text-slate-900 hover:text-primary transition-colors block mt-0.5">
                        contact@fastcase.in
                      </a>
                      <a href="mailto:support@fastcase.in" className="text-[12px] text-slate-500 hover:text-primary transition-colors block">
                        support@fastcase.in
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Working Hours</p>
                      <p className="text-[13px] text-slate-700 leading-snug mt-0.5">
                        Monday to Saturday: 9:00 AM – 6:00 PM IST
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Closed on Sundays & National Court Holidays</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Department Directory */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="font-heading font-[800] text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" /> Direct Department Inquiries
                </h3>
                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Technical Support</span>
                    <a href="mailto:support@fastcase.in" className="text-primary font-semibold hover:underline">
                      support@fastcase.in
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Advocate Onboarding</span>
                    <a href="mailto:contact@fastcase.in" className="text-primary font-semibold hover:underline">
                      contact@fastcase.in
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-600 font-medium">Grievance Officer</span>
                    <a href="mailto:grievance@fastcase.in" className="text-primary font-semibold hover:underline">
                      grievance@fastcase.in
                    </a>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-600 font-medium">Data Privacy & Security</span>
                    <a href="mailto:privacy@fastcase.in" className="text-primary font-semibold hover:underline">
                      privacy@fastcase.in
                    </a>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: Message Form (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                    <h2 className="font-heading font-[800] text-2xl text-slate-900 mb-2">
                      Inquiry Received!
                    </h2>
                    <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
                      Thank you for contacting Fastcase. A dedicated legal solutions representative will review your message and respond within 1 business day.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: '', email: '', phone: '', organization: '', subject: '', message: '' });
                      }}
                      className="inline-flex items-center gap-2 bg-primary hover:bg-[#072B20] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md"
                    >
                      Send Another Inquiry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-6">
                      <h2 className="font-heading font-[800] text-2xl text-slate-900 mb-1.5">
                        Send a Message
                      </h2>
                      <p className="text-sm text-slate-500">
                        Fill in your details below and our team will get back to you promptly.
                      </p>
                    </div>

                    {error && (
                      <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Full Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            placeholder="Adv. Rajesh Sharma"
                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="advocate@example.com"
                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Phone / WhatsApp
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+91 98765 43210"
                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Law Firm / Chamber Name
                          </label>
                          <input
                            type="text"
                            name="organization"
                            value={form.organization}
                            onChange={handleChange}
                            placeholder="Sharma & Associates"
                            className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all shadow-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Inquiry Subject <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all shadow-sm cursor-pointer"
                        >
                          <option value="">Select a subject…</option>
                          {contactReasons.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Detailed Message <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          placeholder="Please share details about your chamber or the assistance you need…"
                          className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all shadow-sm resize-none"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-[#072B20] text-white font-[800] text-[15px] py-3.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer"
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              Submitting…
                            </span>
                          ) : (
                            <>
                              Submit Message <Send className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center pt-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Your contact details are strictly confidential under our Privacy Policy.</span>
                      </div>
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
