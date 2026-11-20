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
  const portalUrl = `${getErpUrl()}/citizen-portal`;
  const [inputVal, setInputVal] = useState('');

  const handleLaunch = (q) => {
    const queryParam = q ? `?q=${encodeURIComponent(q)}` : '';
    window.location.href = `${portalUrl}${queryParam}`;
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Clean Hero Section (Option 2: Navy, Cream & Coral) ── */}
      <section className="relative overflow-hidden pt-12 pb-16 bg-gradient-to-b from-[#021F1B] via-[#03362E] to-[#02201D] text-white border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-bold">
            <Scale className="w-3.5 h-3.5 text-[#059669]" />
            <span>सामान्य नागरिकांसाठी १-क्लिक विधी सहाय्य कक्ष</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            आपली समस्या सांगा — कायदेशीर उत्तर व अधिकृत अर्ज मिळवा
          </h1>

          <p className="text-sm sm:text-base text-[#6EE7B7] max-w-2xl mx-auto leading-relaxed">
            पोलीस ठाणे, सायबर सेल, ग्राहक मंच किंवा सरकारी कार्यालयात तक्रार कशी करावी हे सोप्या भाषेत समजून घ्या आणि कोर्ट-मान्य अधिकृत तक्रार अर्ज काही सेकंदांत मिळवा.
          </p>

          {/* Pricing Highlight Pill & Citizen Login */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] px-4 py-1.5 rounded-full text-xs font-bold">
              <span>💡 कायदेशीर मार्गदर्शन मोफत</span>
              <span>&bull;</span>
              <span className="text-[#059669] font-black">अधिकृत कोर्ट अर्ज: केवळ ₹३०/-</span>
            </div>

            <a
              href={`${getErpUrl()}/citizen-portal`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#065F46] text-xs font-bold border border-[#A7F3D0] transition cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-[#059669]" />
              <span>नवीन: मालमत्ता कायदेशीर तपासणी (Property Legal Check)</span>
            </a>

            <a
              href={`${getErpUrl()}/citizen-login`}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#6EE7B7] text-xs font-bold border border-white/20 transition cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#059669]" />
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
              className="w-full sm:w-auto px-6 py-3 bg-[#013B36] hover:bg-[#024E47] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 flex-shrink-0 shadow-md shadow-[#013B36]/25 cursor-pointer"
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
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[#6EE7B7] text-xs font-semibold border border-white/10 transition"
              >
                {issue.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── What We Provide Inside Portal (४ प्रमुख सेवा) ── */}
      <section className="py-14 bg-slate-50 dark:bg-[#070E1A] border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="px-3.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-xs font-black uppercase tracking-wider">
              पोर्टलवर काय उपलब्ध आहे
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              फास्टकेस नागरिक विधी कक्षातील ४ मुख्य सेवा
            </h2>
            <p className="text-xs sm:text-sm text-ink/70">
              सामान्य नागरिकांना विधी अडचण सोडवण्यासाठी आवश्यक असलेली सर्व कायदेशीर साधने एकाच छताखाली.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Service 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0C1D26] border border-line shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#013B36] text-white flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm text-ink">१. समस्या व उपाय</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46]">मोफत</span>
                </div>
                <p className="text-xs text-ink/70 leading-relaxed">
                  बँक सायबर फ्रॉड, पोलीस तक्रार, पगार वाद, ग्राहक संरक्षण, महिला छळ व RTI यावर १-क्लिक कायदेशीर मार्गदर्शन व कलमे.
                </p>
              </div>
              <div className="pt-4 border-t border-line/60 mt-4">
                <a href={portalUrl} className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1">
                  <span>उपाय जाणून घ्या</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Service 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0C1D26] border border-line shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#013B36] text-white flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm text-ink">२. अर्ज जनरेटर</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#013B36] text-white">केवळ ₹३०</span>
                </div>
                <p className="text-xs text-ink/70 leading-relaxed">
                  वकिलांच्या ड्राफ्टिंगचा खर्च ₹१,५०० असतो — फास्टकेसवर कोर्ट-मान्य A4 तक्रार अर्ज त्वरित मराठी व इंग्रजीत तयार करा व PDF डाऊनलोड करा.
                </p>
              </div>
              <div className="pt-4 border-t border-line/60 mt-4">
                <a href={portalUrl} className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1">
                  <span>अर्ज तयार करा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Service 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0C1D26] border border-line shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#013B36] text-white flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm text-ink">३. मालमत्ता तपासणी</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#059669] text-white">नवीन</span>
                </div>
                <p className="text-xs text-ink/70 leading-relaxed">
                  जमीन, प्लॉट, फ्लॅट खरेदीपूर्वी कायदेशीर तपासणी — ७/१२, फेरफार, इंडेक्स २ व ई-कोर्ट्स वाद (eCourts Disputes) शीर्षक रिस्क रिपोर्ट.
                </p>
              </div>
              <div className="pt-4 border-t border-line/60 mt-4">
                <a href={portalUrl} className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1">
                  <span>मालमत्ता तपासा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Service 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0C1D26] border border-line shadow-xs flex flex-col justify-between hover:shadow-md transition">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-xl bg-[#013B36] text-white flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#059669]" />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm text-ink">४. जतन केलेले अर्ज</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">सुरक्षित</span>
                </div>
                <p className="text-xs text-ink/70 leading-relaxed">
                  आपले तयार केलेले सर्व कोर्ट अर्ज, शासकीय तक्रारी व पावत्या क्लाउडमध्ये कायम सेव्ह राहतात आणि कधीही ॲक्सेस करता येतात.
                </p>
              </div>
              <div className="pt-4 border-t border-line/60 mt-4">
                <a href={portalUrl} className="text-xs font-bold text-[#059669] hover:underline flex items-center gap-1">
                  <span>माझे अर्ज पहा</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-Step Simple Process ── */}
      <section className="py-16 bg-white dark:bg-[#0C1D26] border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="px-3 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-xs font-black uppercase">
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
              <div className="w-10 h-10 rounded-xl bg-[#013B36] text-white font-black text-base flex items-center justify-center">
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
              <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#065F46] font-black text-base flex items-center justify-center">
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
              <div className="w-10 h-10 rounded-xl bg-[#013B36] text-[#34D399] font-black text-base flex items-center justify-center">
                ३
              </div>
              <h3 className="font-bold text-base text-ink">
                ₹३० मध्ये अधिकृत अर्ज मिळवा
              </h3>
              <p className="text-xs text-ink/70 leading-relaxed">
                वकिलांमार्फत ड्राफ्टिंगचा खर्च ₹१,५०० असतो — फास्टकेसवर कोर्ट-मान्य A4 अर्ज त्वरित PDF मध्ये डाऊनलोड करा.
              </p>
            </div>
          </div>

          {/* CTA Box */}
          <div className="bg-gradient-to-r from-[#021F1B] via-[#03362E] to-[#02201D] border border-white/10 rounded-3xl p-8 sm:p-10 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                आत्ताच आपली समस्या सोडवा
              </h3>
              <p className="text-xs sm:text-sm text-[#6EE7B7]">
                १-क्लिकमध्ये कायदेशीर मार्गदर्शन व अधिकृत तक्रार अर्ज तयार करा.
              </p>
            </div>
            <a
              href={portalUrl}
              className="px-8 py-3.5 bg-[#013B36] text-white font-black text-xs rounded-xl hover:bg-[#024E47] transition shadow-lg flex-shrink-0 flex items-center gap-2"
            >
              <span>कंझ्युमर पोर्टल उघडा →</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
