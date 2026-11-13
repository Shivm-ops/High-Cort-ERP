import React, { useState } from 'react';
import {
  Scale,
  ShieldAlert,
  FileText,
  Clock,
  PhoneCall,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  CreditCard,
  Building2,
  Lock,
  Search,
  User,
} from 'lucide-react';

const getErpUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      const rootDomain = host.replace(/^(app|admin|landing|www)\./, "");
      return `${window.location.protocol}//app.${rootDomain}`;
    }
  }
  return import.meta.env.VITE_ERP_APP_URL || "http://localhost:3000";
};

const COMMON_ISSUES = [
  { label: '💳 ऑनलाइन बँक / UPI फ्रॉड', query: 'सायबर बँक फसवणूक' },
  { label: '👮 पोलिसांनी FIR नाकारला', query: 'पोलिसांनी तक्रार घेतली नाही' },
  { label: '💼 थकीत पगार व नोकरी वाद', query: 'मालकाने पगार दिला नाही' },
  { label: '🛒 सदोष वस्तू / वॉरंटी नाकारली', query: 'ग्राहक तक्रार सदोष वस्तू' },
  { label: '🏠 जमीन / घरावर बेकायदेशीर कब्जा', query: 'जमिनीवर अतिक्रमण' },
  { label: '👩 कौटुंबिक छळ व महिला सुरक्षा', query: 'कौटुंबिक हिंसाचार तक्रार' },
];

export default function ConsumerPortal() {
  const portalUrl = `${getErpUrl()}/citizen-login`;
  const [inputVal, setInputVal] = useState('');

  const handleLaunch = (q) => {
    window.location.href = portalUrl;
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Emergency SOS Top Notification ── */}
      <div className="bg-[#991B1B] text-white px-4 py-2 text-xs font-bold text-center flex flex-wrap items-center justify-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          आपत्कालीन विधी हेल्पलाईन (२४x७):
        </span>
        <span className="text-red-200">पोलीस: <strong className="text-white">११२</strong></span>
        <span className="text-red-200">|</span>
        <span className="text-red-200">सायबर फ्रॉड: <strong className="text-white">१९३०</strong></span>
        <span className="text-red-200">|</span>
        <span className="text-red-200">महिला: <strong className="text-white">१०९१</strong></span>
        <span className="text-red-200">|</span>
        <span className="text-red-200">मोफत विधी सेवा: <strong className="text-white">१५१००</strong></span>
      </div>

      {/* ── Clean Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-[#0B251E] via-[#0D3027] to-[#081C16] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>सामान्य नागरिकांसाठी १-क्लिक विधी सहाय्य कक्ष</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            आपली समस्या सांगा — कायदेशीर उत्तर व अधिकृत अर्ज मिळवा
          </h1>

          <p className="text-sm sm:text-base text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            पोलीस ठाणे, सायबर सेल, ग्राहक मंच किंवा सरकारी कार्यालयात तक्रार कशी करावी हे सोप्या भाषेत समजून घ्या आणि कोर्ट-मान्य अधिकृत तक्रार अर्ज काही सेकंदांत मिळवा.
          </p>

          {/* Pricing Highlight Pill & Citizen Login */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/40 text-amber-200 px-4 py-1.5 rounded-full text-xs font-bold">
              <span>💡 कायदेशीर मार्गदर्शन मोफत</span>
              <span>&bull;</span>
              <span className="text-amber-100 font-black">अधिकृत कोर्ट अर्ज: केवळ ₹४९/-</span>
            </div>

            <a
              href={`${getErpUrl()}/citizen-login`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>नागरिक लॉगिन / नोंदणी</span>
            </a>
          </div>

          {/* Quick Problem Launch Box */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 max-w-2xl mx-auto shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-white/20">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="आपली समस्या लिहा (उदा. ऑनलाइन पैसे कापले, पगार मिळाला नाही)..."
              className="w-full px-4 py-3 text-sm text-gray-900 bg-transparent focus:outline-none font-medium"
            />
            <button
              onClick={() => handleLaunch(inputVal)}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 flex-shrink-0 shadow-md"
            >
              <span>उपाय शोधा</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {COMMON_ISSUES.map((issue, idx) => (
              <a
                key={idx}
                href={portalUrl}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-200 text-xs font-semibold border border-white/10 transition"
              >
                {issue.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3-Step Simple Process ── */}
      <section className="py-16 bg-white dark:bg-[#0C1D26] border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
              सोपी ३-कलमी पद्धत
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              हे कसे काम करते?
            </h2>
            <p className="text-xs sm:text-sm text-ink/60">
              कोणतीही कायदेशीर माहिती नसतानाही सामान्य नागरिक स्वतःचा अर्ज तयार करू शकतात.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-surface dark:bg-[#122734] border border-line space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-black text-base flex items-center justify-center">
                १
              </div>
              <h3 className="font-bold text-base text-ink">
                आपली समस्या सांगा
              </h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                बँक फसवणूक, पगार वाद, पोलीस तक्रार किंवा घर-जमीन वाद याबाबत साध्या शब्दांत माहिती द्या.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-surface dark:bg-[#122734] border border-line space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 font-black text-base flex items-center justify-center">
                २
              </div>
              <h3 className="font-bold text-base text-ink">
                काय करावे ते समजून घ्या
              </h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                तुमचे कायदेशीर हक्क कोणते आहेत, कोणत्या कार्यालयात जावे आणि कोणती कागदपत्रे लागतील हे तात्काळ जाणून घ्या.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-surface dark:bg-[#122734] border border-line space-y-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 font-black text-base flex items-center justify-center">
                ३
              </div>
              <h3 className="font-bold text-base text-ink">
                ₹४९ मध्ये अधिकृत अर्ज मिळवा
              </h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                वकिलांमार्फत ड्राफ्टिंगचा खर्च ₹१,५०० असतो — फास्टकेसवर कोर्ट-मान्य A4 अर्ज त्वरित PDF मध्ये डाऊनलोड करा.
              </p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black">
                आत्ताच आपली समस्या सोडवा
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100">
                १-क्लिकमध्ये कायदेशीर मार्गदर्शन व अधिकृत तक्रार अर्ज तयार करा.
              </p>
            </div>
            <a
              href={portalUrl}
              className="px-8 py-3.5 bg-white text-emerald-950 font-black text-xs rounded-xl hover:bg-emerald-50 transition shadow-lg flex-shrink-0 flex items-center gap-2"
            >
              <span>कंझ्युमर पोर्टल उघडा →</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
