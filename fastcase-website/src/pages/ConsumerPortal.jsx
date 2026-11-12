import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Shield,
  FileText,
  Clock,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Building2,
  Lock,
  Search,
  Sparkles,
  ChevronRight,
  HelpCircle,
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

const EMERGENCY_ITEMS = [
  {
    title: 'आर्थिक सायबर फसवणूक (UPI / OTP)',
    helpline: '१९३०',
    time: 'पहिली ६० ते १२० मिनिटे',
    action: 'त्वरित १९३० वर तक्रार करून बँक खाते गोठवा (Freeze). ३ दिवसांत बँकेस लेखी कळवून Zero Liability मिळवा.',
    badge: 'Cybercrime',
    color: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    title: 'महिला व बाल संरक्षण / अत्याचार',
    helpline: '११२ / १०९१ / १८१',
    time: 'तात्काळ (पहिली २४ तास)',
    action: 'कोणत्याही ठाण्यात Zero FIR चा हक्क. महिला पोलीस अधिकाऱ्याकडूनच जबाब नोंदवणे व मोफत शासकीय वैद्यकीय तपासणी (MLC).',
    badge: 'Women Safety',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    title: 'गंभीर मारहाण / प्राणघातक हल्ला',
    helpline: '११२ / सरकारी रुग्णालय',
    time: 'तात्काळ (पहिली ६ तास)',
    action: 'आधी शासकीय रुग्णालयात उपचार व MLC रिपोर्ट नोंदवा. BNS कलम ११५ व ११७ अन्वये दखलपात्र FIR सक्तीची.',
    badge: 'Police / FIR',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    title: 'रस्ता अपघात (Good Samaritan)',
    helpline: '१०८ / ११२',
    time: 'तात्काळ (Golden Hour)',
    action: 'अपघातात मदत करणाऱ्या नागरिकास मोटार वाहन कायदा कलम १३४A अन्वये संरक्षण. कोणत्याही पोलीस चौकशीची भीती नाही.',
    badge: 'Emergency',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

const CHAPTER_HIGHLIGHTS = [
  { num: '०१', title: 'पोलीस ठाण्यात तक्रार दाखल करणे', desc: 'दखलपात्र (Cognizable) व अदखलपात्र (NC) मधील फरक आणि मोफत FIR प्रत.' },
  { num: '०२', title: 'FIR नाकारल्यास काय करावे?', desc: 'BNSS १७३(४) अन्वये SP कडे RPAD तक्रार आणि BNSS १७५(३) अन्वये JMFC कोर्ट आदेश.' },
  { num: '०३', title: 'झिरो एफआयआर (Zero FIR)', desc: 'हद्दीची कोणतीही अट नाही; भारतातील कोणत्याही पोलीस ठाण्यात दाखल करण्याचा अधिकार.' },
  { num: '०४', title: 'अटक झाल्यास कायदेशीर अधिकार', desc: 'डी.के. बसू मार्गदर्शक तत्त्वे, २४ तासांत मॅजिस्ट्रेटसमोर हजर राहणे आणि मोफत वकील.' },
  { num: '०५', title: 'जामीन (Bail) नियम व प्रक्रिया', desc: 'जामीनपात्र, अजामीनपात्र, अटकपूर्व जामीन (BNSS ४८२) व डिफॉल्ट जामीन (BNSS १८७).' },
  { num: '०६', title: 'महिला व वृद्धांची घरीच चौकशी', desc: 'BNSS १७९ नुसार महिला, मुले व ६० वर्षांवरील ज्येष्ठांना ठाण्यात न बोलवता घरीच जबाब.' },
  { num: '०७', title: 'ग्राहक संरक्षण व ई-दाखील', desc: 'सदोष वस्तू व सेवेतील त्रुटीविरुद्ध घरबसल्या ई-दाखील मंचावरून ऑनलाईन केस.' },
  { num: '०८', title: 'माहिती अधिकार (RTI 2005)', desc: '३० दिवसांत माहिती मिळणे बंधनकारक; टाळाटाळ करणाऱ्या अधिकाऱ्यावर रोज ₹२५० दंड.' },
];

export default function ConsumerPortal() {
  const portalUrl = `${getErpUrl()}/citizen-portal`;

  return (
    <div className="min-h-screen bg-surface">
      {/* ── Emergency SOS Top Notification ── */}
      <div className="bg-[#991B1B] text-white px-4 py-2.5 text-xs font-bold text-center flex flex-wrap items-center justify-center gap-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          आपत्कालीन विधी हेल्पलाईन (२४x७):
        </span>
        <span className="text-red-200">पोलीस: <strong className="text-white">११२</strong></span>
        <span className="text-red-200">|</span>
        <span className="text-red-200">महिला: <strong className="text-white">१०९१ / १८१</strong></span>
        <span className="text-red-200">|</span>
        <span className="text-red-200">सायबर फ्रॉड: <strong className="text-white">१९३०</strong></span>
        <span className="text-red-200">|</span>
        <span className="text-red-200">मोफत विधी सेवा: <strong className="text-white">१५१००</strong></span>
      </div>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-[#0B251E] via-[#0D3027] to-[#081C16] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>महाराष्ट्र नागरिक कायदेविषयक मार्गदर्शिका व तक्रार कक्ष</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              सामान्य नागरिकांसाठी १-क्लिक विधी सहाय्य व अधिकृत तक्रार निवारण
            </h1>

            <p className="text-sm sm:text-base text-emerald-100/80 leading-relaxed">
              ग्राहक तक्रार मंच, पोलीस ठाणे, सायबर सेल किंवा सरकारी कार्यालयात तक्रार नोंदवण्यासाठी महागड्या वकिलांची गरज नाही. नवीन फौजदारी कायदे (BNS, BNSS, BSA २०२३) समजून घ्या आणि कोर्ट-मान्य अधिकृत तक्रार अर्ज काही सेकंदांत डाऊनलोड करा.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <a
                href={portalUrl}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold text-sm transition shadow-lg hover:shadow-emerald-500/25 flex items-center gap-2"
              >
                <span>तक्रार अर्ज तयार करा (Launch Portal)</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={`${getErpUrl()}/citizen-login`}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm transition border border-white/20"
              >
                नागरिक लॉगिन / नोंदणी
              </a>
            </div>

            <div className="pt-3 flex flex-wrap items-center gap-6 text-xs text-emerald-200/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> १००% विनामूल्य नागरी सहाय्य
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> मराठी, हिंदी व इंग्रजी भाषा समर्थन
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> A4 कोर्ट-रेडी PDF डाऊनलोड
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── First 60 Minutes Emergency Highlights ── */}
      <section className="py-16 bg-white dark:bg-[#0C1D26] border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase">
              पहिली ६० मिनिटे – आपत्कालीन सहाय्य
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              घटनेनंतरच्या पहिल्या एका तासात काय करावे?
            </h2>
            <p className="text-xs sm:text-sm text-ink/60">
              तातडीच्या प्रसंगात कायद्याने नागरिकांना दिलेले अधिकार आणि त्वरित करावयाची कृती.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {EMERGENCY_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-line bg-surface dark:bg-[#122734] space-y-3 flex flex-col justify-between hover:border-primary/50 transition shadow-2xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.color}`}>
                      {item.badge}
                    </span>
                    <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 rounded-full">
                      {item.helpline}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-ink">
                    {item.title}
                  </h3>

                  <p className="text-xs text-ink/70 leading-relaxed">
                    {item.action}
                  </p>
                </div>

                <div className="pt-3 border-t border-line text-[11px] text-ink/40 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  {item.time}
                </div>
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <a
              href={portalUrl}
              className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-hover"
            >
              सर्व ८ आपत्कालीन प्रसंग व संपूर्ण मार्गदर्शक पहा <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ── 10 Chapters Showcase ── */}
      <section className="py-16 bg-[#F8FAF7] dark:bg-[#08151D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase">
              कायदे मार्गदर्शिका
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-ink">
              १० सविस्तर प्रकरणे (१२-कलमी कार्यपद्धती)
            </h2>
            <p className="text-xs sm:text-sm text-ink/60">
              प्रत्येक विषयावर कायदेशीर अधिकार, आवश्यक कागदपत्रे, कायदेशीर मुदत आणि तयार अर्जाचा नमुना.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CHAPTER_HIGHLIGHTS.map((ch, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#0C1D26] border border-line hover:border-emerald-500 transition shadow-2xs space-y-2"
              >
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  {ch.num}
                </span>
                <h4 className="font-bold text-sm text-ink leading-snug">
                  {ch.title}
                </h4>
                <p className="text-xs text-ink/60 leading-relaxed">
                  {ch.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Big CTA Card */}
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl">
              <h3 className="text-2xl font-black">
                आपली समस्या सांगा — अधिकृत अर्ज तयार करा
              </h3>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                पोलीस ठाणे, ग्राहक मंच, सायबर सेल किंवा महापालिकेसाठी आवश्यक असलेले सर्व अधिकृत तक्रार अर्ज विहित कायदेशीर भाषेमध्ये तयार करा.
              </p>
            </div>
            <a
              href={portalUrl}
              className="px-8 py-4 bg-white text-emerald-950 font-black text-sm rounded-2xl hover:bg-emerald-50 transition shadow-lg flex-shrink-0 flex items-center gap-2"
            >
              <span>कंझ्युमर पोर्टल उघडा</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
