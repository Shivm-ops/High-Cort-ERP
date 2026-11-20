import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Mail, Clock, AlertCircle, CheckCircle2, Send, Phone, MapPin, Building2, User, ChevronRight } from 'lucide-react';

const legalNavLinks = [
  { name: 'Terms of Service', href: '/terms-of-service' },
  { name: 'Privacy Policy', href: '/privacy-policy' },
  { name: 'Refund Policy', href: '/refund-policy' },
  { name: 'Disclaimer', href: '/disclaimer' },
  { name: 'Cookie Policy', href: '/cookie-policy' },
  { name: 'Data Security', href: '/data-security' },
  { name: 'Grievance Officer', href: '/grievance-officer' },
];

const escalationSteps = [
  { step: '01', title: 'Submit Grievance', desc: 'File your grievance online via this form or email directly.', time: 'Immediate' },
  { step: '02', title: 'Written Acknowledgement', desc: 'System generates a unique ticket ID within 24 to 48 hours.', time: 'Within 48 hrs' },
  { step: '03', title: 'Investigation & Action', desc: 'Grievance Officer examines the case with legal & tech team.', time: 'Days 2–10' },
  { step: '04', title: 'Resolution Communication', desc: 'Formal resolution notice communicated in writing to you.', time: 'Within 15 days' },
];

const grievanceCategories = [
  'Billing / Payment / Duplicate Deduction',
  'Refund Request or Policy Query',
  'Account Security or Unauthorized Access',
  'Data Privacy & DPDP Act Data Erasure Request',
  'Service Availability or Technical Outage',
  'Document Generation or OCR Issue',
  'Terms of Service Violation',
  'Other Statutory Concern',
];

export default function GrievanceOfficer() {
  const location = useLocation();
  const [form, setForm] = useState({
    name: '', email: '', phone: '', category: '', description: '', resolution: '',
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
    }, 1000);
  };

  const inputClass =
    'w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#059669] focus:bg-white transition-all';

  return (
    <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ── Policy Navigation Tabs ── */}
        <div className="mb-6 overflow-x-auto no-scrollbar py-2">
          <nav className="flex items-center gap-1.5 min-w-max bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            {legalNavLinks.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#013B36] text-[#34D399] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* ── Clean Light Header ── */}
        <div className="mb-8 pb-6 border-b border-slate-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-bold text-[#065F46] mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Statutory Officer — Rule 3(11) of IT Rules, 2021 &amp; DPDP Act, 2023</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 mb-2 tracking-tight">
            Grievance Redressal
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
            Fastcase provides an official channel to resolve customer grievances, billing disputes, and data protection inquiries in a fair, prompt, and legally compliant manner.
          </p>
        </div>

        {/* ── 2-Column Content Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Officer Card & Timeline (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Designated Officer Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 mb-4">
                <div className="w-11 h-11 rounded-2xl bg-[#013B36] text-[#34D399] flex items-center justify-center shrink-0 shadow-xs">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 leading-tight">
                    Abhijit Patil
                  </h2>
                  <p className="text-xs text-[#059669] font-bold">
                    Designated Grievance &amp; Compliance Officer
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    SOSM Services Private Limited
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#013B36] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Corporate Office</span>
                    <span className="leading-relaxed">
                      B4/5, Omkar Plaza, Rajaram Road, Shahupuri, Kolhapur – 416001, Maharashtra, India
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#013B36] shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Dedicated Grievance Email</span>
                    <a href="mailto:grievance@fastcase.in" className="text-[#013B36] font-semibold hover:underline">
                      grievance@fastcase.in
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#013B36] shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Direct Helpline</span>
                    <a href="tel:+919405669420" className="text-slate-800 font-semibold hover:text-[#013B36]">
                      +91 94056 69420
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#013B36] shrink-0" />
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Working Hours</span>
                    <span className="text-slate-600">Monday to Friday (10:00 AM – 5:30 PM IST)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Timeline Notice */}
            <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              <div className="text-xs text-[#065F46]">
                <p className="font-bold mb-0.5">Guaranteed Statutory Response</p>
                <p className="text-[#047857] leading-relaxed">
                  Written acknowledgement is issued within <strong>48 hours</strong>. Complete inquiry and redressal are concluded within <strong>15 calendar days</strong>.
                </p>
              </div>
            </div>

            {/* Escalation Process Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Redressal Lifecycle
              </h3>
              <div className="space-y-4">
                {escalationSteps.map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-[#013B36] font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {s.step}
                    </span>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900">{s.title}</p>
                        <span className="text-[10.5px] font-semibold text-[#059669] bg-emerald-50 px-2 py-0.2 rounded-md">
                          {s.time}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Clean Submission Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-slate-200/90 shadow-xs">
              
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-14 h-14 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#059669]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h2 className="text-xl font-heading font-black text-slate-900 mb-2">
                    Grievance Registered Successfully
                  </h2>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto mb-6 leading-relaxed">
                    Your complaint has been assigned to our compliance desk. A formal acknowledgement with your tracking reference will be dispatched to your email within 48 hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setForm({ name: '', email: '', phone: '', category: '', description: '', resolution: '' });
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#013B36] text-[#34D399] text-xs font-bold hover:bg-[#02201D] transition-all shadow-xs cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-heading font-black text-slate-900 mb-1">
                      File a Formal Grievance
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Please supply accurate details so our Grievance Officer can investigate and resolve your concern.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Advocate / Litigant Name"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Registered Email <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="registered@email.com"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Mobile Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+91 98765 43210"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Grievance Category <span className="text-rose-500">*</span>
                        </label>
                        <select
                          name="category"
                          value={form.category}
                          onChange={handleChange}
                          required
                          className={inputClass}
                        >
                          <option value="">Select subject…</option>
                          {grievanceCategories.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Detailed Description of Complaint <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="Provide details regarding the transaction ID, court case number, date of incident, or technical difficulty…"
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Expected Redressal / Desired Outcome
                      </label>
                      <textarea
                        name="resolution"
                        value={form.resolution}
                        onChange={handleChange}
                        rows={2}
                        placeholder="State the resolution you are seeking (e.g., refund credit, data deletion, account unlock)…"
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        <strong>Statutory Declaration:</strong> You affirm that the details submitted herein are true and accurate to the best of your knowledge under Indian law.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#013B36] hover:bg-[#02201D] text-[#34D399] font-bold text-xs tracking-wide uppercase transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Submitting Ticket…</span>
                      ) : (
                        <>
                          <span>Submit Grievance to Compliance Officer</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
