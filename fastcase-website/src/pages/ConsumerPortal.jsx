import { useState } from 'react';
import {
  Shield, Scale, FileText, AlertCircle, Phone, ArrowRight,
  CheckCircle2, Building2, UserCheck, HardHat, Landmark, Home, ExternalLink
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

const categories = [
  {
    icon: Shield,
    title: 'ग्राहक तक्रार निवारण (Consumer Protection)',
    act: 'Consumer Protection Act, 2019',
    forum: 'District / State Consumer Disputes Redressal Commission (DCDRC / SCDRC)',
    desc: 'दोषपूर्ण वस्तू, निकृष्ट सेवा, बिल्डरकडून फ्लॅटचा ताबा मिळण्यास विलंब, फसव्या जाहिराती, किंवा विमा दावा नाकारणे.',
    color: 'emerald',
    badge: 'CPA 2019'
  },
  {
    icon: Scale,
    title: 'पोलीस व एफआयआर सहाय्य (Police & FIR)',
    act: 'Bharatiya Nagarik Suraksha Sanhita (BNSS 2023)',
    forum: 'पोलीस ठाणे / पोलीस अधीक्षक (SP/CP) / न्यायदंडाधिकारी (Sec 175(3), 175(4))',
    desc: 'गंभीर गुन्ह्यांची तक्रार नोंदवणे, पोलीस ठाण्यात तक्रार न घेतल्यास वरिष्ठ अधिकाऱ्यांकडे दाद मागणे व कोर्टात अर्ज.',
    color: 'blue',
    badge: 'BNSS 2023'
  },
  {
    icon: AlertCircle,
    title: 'सायबर गुन्हे व बँक फसवणूक (Cybercrime Fraud)',
    act: 'Information Technology Act, 2000 & IPC / BNS',
    forum: 'National Cyber Crime Portal (1930 Helpline) / cybercrime.gov.in',
    desc: 'UPI / क्रेडिट कार्ड फसवणूक, ओटीपी स्कॅम, सोशल मीडिया ब्लॅकमेलिंग आणि बनावट नोकरीचे आमिष.',
    color: 'rose',
    badge: 'Toll-free 1930'
  },
  {
    icon: Building2,
    title: 'महानगरपालिका व नागरी समस्या (Municipal Grievance)',
    act: 'Maharashtra Municipal Corporations Act & Civil Law',
    forum: 'महानगरपालिका आयुक्त / प्रभाग अधिकारी (Ward Officer)',
    desc: 'अनधिकृत बांधकाम, सार्वजनिक रस्त्यावरील अतिक्रमण, दूषित पाणीपुरवठा, कचरा व्यवस्थापन आणि आरोग्य समस्या.',
    color: 'amber',
    badge: 'Civic Grievance'
  },
  {
    icon: UserCheck,
    title: 'महिला व बाल संरक्षण (Women & Child Safety)',
    act: 'DV Act 2005, POSH Act 2013 & POCSO',
    forum: 'संरक्षण अधिकारी (Protection Officer) / महिला आयोग (Women Commission)',
    desc: 'कौटुंबिक हिंसाचार, कामाच्या ठिकाणी लैंगिक छळ, पोटगी आणि मुलांचा ताबा मिळण्याबाबत अर्ज.',
    color: 'purple',
    badge: 'Helpline 1091'
  },
  {
    icon: HardHat,
    title: 'कामगार व रोजगार वाद (Labour & Employment)',
    act: 'Payment of Wages, Industrial Disputes & Gratuity Act',
    forum: 'कामगार आयुक्त कार्यालय (Labour Commissioner)',
    desc: 'थकबाकी पगार, बेकायदेशीर कामावरून काढणे, ग्रॅच्युइटी आणि पीएफ (PF) न मिळणेबाबत तक्रारी.',
    color: 'teal',
    badge: 'Labour Forum'
  },
  {
    icon: Landmark,
    title: 'माहिती अधिकार व सरकारी विभाग (RTI & Departments)',
    act: 'Right to Information Act, 2005 (कलम ६(१))',
    forum: 'जन माहिती अधिकारी (PIO) / प्रथम अपीलीय अधिकारी (FAA)',
    desc: 'सरकारी कागदपत्रे, योजनांचे अनुदान, राशन, जमिनीच्या नोंदी व रस्ते कामांच्या माहितीसाठी अर्ज.',
    color: 'indigo',
    badge: 'RTI Act 2005'
  },
  {
    icon: Home,
    title: 'मालमत्ता व महसूल वाद (Property & Land Disputes)',
    act: 'Maharashtra Land Revenue Code, 1966',
    forum: 'तहसीलदार / उपविभागीय अधिकारी (SDO) / दिवाणी न्यायालय',
    desc: '७/१२ फेरफार नोंदी, रस्त्याचा हक्क (कलम १४३), वहिवाट वाद आणि अनधिकृत कब्जा.',
    color: 'cyan',
    badge: 'MLRC 1966'
  },
];

const helplines = [
  { name: 'National Cyber Fraud Helpline', number: '1930', desc: 'Financial cyber fraud urgent account freeze' },
  { name: 'Emergency Police / Fire / Medical', number: '112', desc: 'All-India emergency response system' },
  { name: 'National Consumer Helpline', number: '1915 / 1800-11-4000', desc: 'Consumer grievance registration' },
  { name: 'Women Helpline (Domestic Violence / POSH)', number: '1091 / 181', desc: '24x7 women in distress support' },
  { name: 'Free Legal Aid (NALSA / SLSA)', number: '15100', desc: 'Free advocate assistance for eligible citizens' },
];

export default function ConsumerPortal() {
  const [selectedLang, setSelectedLang] = useState('mr');

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 lg:pt-16 lg:pb-20 bg-gradient-to-b from-emerald-950 via-[#013B36] to-slate-900 text-white overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#10B981_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[12px] font-bold tracking-wider uppercase rounded-full px-4 py-1.5 mb-6">
              <Shield className="w-4 h-4 text-emerald-400" />
              विनामूल्य नागरिक व ग्राहक विधी सहाय्य कक्ष
            </div>

            <h1 className="font-heading font-[900] text-3xl sm:text-4xl lg:text-[46px] leading-[1.2] mb-5 tracking-tight text-white">
              सामान्य नागरिकांसाठी <span className="text-emerald-400">१-क्लिक विधी सहाय्य</span> व अधिकृत तक्रार निवारण कक्ष
            </h1>

            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed mb-8 max-w-2xl font-normal">
              ग्राहक तक्रार मंच, पोलीस ठाणे, सायबर सेल किंवा सरकारी कार्यालयात तक्रार नोंदवण्यासाठी वकिलांची गरज नाही. 
              तुमच्या समस्येनुसार योग्य कायदेशीर तरतुदी समजून घ्या आणि कोर्ट-मान्य अधिकृत तक्रार अर्ज त्वरित डाऊनलोड करा.
            </p>

            {/* Direct CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href={`${getErpUrl()}/consumer`}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[15px] py-3.5 px-7 rounded-xl flex items-center gap-2.5 shadow-lg shadow-emerald-900/40 hover:shadow-xl transition-all"
              >
                <Shield className="w-5 h-5 text-slate-950" />
                तक्रार अर्ज तयार करा (Launch Consumer Portal)
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href={`${getErpUrl()}/citizen-login`}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[14px] py-3.5 px-6 rounded-xl transition-all"
              >
                नागरिक लॉगिन / नोंदणी
              </a>
            </div>

            {/* Features strip */}
            <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-6 text-[13px] text-emerald-200/80 font-medium">
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

      {/* ── 24x7 EMERGENCY HELPLINES STRIP ─────────────────────────── */}
      <section className="bg-emerald-900/10 border-y border-emerald-200/60 dark:border-emerald-900/60 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-[13px] uppercase tracking-wider">
              <Phone className="w-4 h-4 text-emerald-600 animate-pulse" />
              २४x७ अधिकृत सरकारी हेल्पलाईन:
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {helplines.map((h) => (
                <div key={h.name} className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">{h.number}</span>
                  <span className="text-slate-500 text-[11px] font-normal">{h.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9 CORE CITIZEN CATEGORIES ──────────────────────────────── */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
              तक्रार निवारण कक्ष
            </span>
            <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900 mt-3">
              कोणत्या प्रकारच्या समस्येसाठी तुम्हाला दाद मागायची आहे?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              खालीलपैकी तुमची समस्या निवडा; प्रणाली आपोआप संबंधित कायदा, अधिकृत अधिकारी आणि अर्ज तयार करेल.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.title}
                  className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {c.badge}
                      </span>
                    </div>

                    <h3 className="font-heading font-[700] text-[15px] text-slate-900 mb-2 leading-snug">
                      {c.title}
                    </h3>
                    <p className="text-[12.5px] text-slate-600 leading-relaxed mb-3">
                      {c.desc}
                    </p>

                    <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                      <p><span className="font-semibold text-slate-700">कायदा:</span> {c.act}</p>
                      <p><span className="font-semibold text-slate-700">अधिकारी:</span> {c.forum}</p>
                    </div>
                  </div>

                  <a
                    href={`${getErpUrl()}/consumer`}
                    className="mt-4 w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-emerald-50 text-emerald-700 text-[12px] font-bold border border-slate-200 hover:border-emerald-300 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    अर्ज तयार करा <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS: 4 SIMPLE STEPS ────────────────────────────── */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading font-[800] text-2xl sm:text-3xl text-slate-900">
              फक्त ४ सोप्या टप्प्यांत कायदेशीर तक्रार अर्ज तयार करा
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              कोणतीही कायदेशीर पदवी किंवा किचकट प्रक्रियेची माहिती नसताना सामान्य नागरिक अर्ज करू शकतात.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '१',
                title: 'समस्या निवडा',
                desc: 'ग्राहक फसवणूक, पोलीस तक्रार, सायबर गुन्हे किंवा महानगरपालिका विषय निवडा.'
              },
              {
                step: '२',
                title: 'महत्त्वाचे तपशील भरा',
                desc: 'तारीख, विरुद्ध पक्षाचे नाव, घडलेली घटना आणि नुकसानीची माहिती द्या.'
              },
              {
                step: '३',
                title: 'कायदेशीर कलमे पहा',
                desc: 'प्रणाली आपोआप योग्य कलम (CPA 2019 / BNSS 2023) आणि सक्षम अधिकारी ठरवते.'
              },
              {
                step: '४',
                title: 'A4 प्रिंट व सबमिट',
                desc: 'कोर्ट व सरकारी कार्यालयात स्वीकारार्ह असा स्वाक्षरी-योग्य PDF अर्ज डाऊनलोड करा.'
              },
            ].map((s) => (
              <div key={s.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black text-sm flex items-center justify-center mb-3">
                  {s.step}
                </div>
                <h3 className="font-heading font-[700] text-[15px] text-slate-900 mb-1.5">
                  {s.title}
                </h3>
                <p className="text-[12.5px] text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <section className="py-14 bg-gradient-to-r from-emerald-900 to-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading font-[900] text-2xl sm:text-3xl mb-4 text-white">
            तुमच्या अधिकारांचे रक्षण करा — तक्रार अर्ज आताच सुरू करा
          </h2>
          <p className="text-emerald-100/80 text-sm sm:text-base mb-8 max-w-xl mx-auto">
            कोणत्याही त्रासाशिवाय काही मिनिटांत तुमच्या समस्येचा अधिकृत कायदेशीर मसुदा तयार करा.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`${getErpUrl()}/consumer`}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold py-3.5 px-8 rounded-xl shadow-lg flex items-center gap-2 transition-all"
            >
              <Shield className="w-4 h-4 text-slate-950" />
              नागरिक तक्रार कक्ष उघडा (Open Consumer Portal)
            </a>
            <a
              href={`${getErpUrl()}/citizen-login`}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3.5 px-6 rounded-xl transition-all"
            >
              नवीन नागरिक नोंदणी
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
