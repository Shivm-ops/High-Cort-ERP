"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi' | 'mr' | 'gu';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "nav.overview": "Overview",
    "nav.users": "User Management",
    "nav.roles": "Roles & Access",
    "nav.firms": "Law Firms",
    "nav.kyc": "KYC Approvals",
    "nav.subscriptions": "Subscriptions",
    "nav.storage": "Tenant Storage",
    "nav.content": "Drafts & Case Laws",
    "nav.support": "Support Desk",
    "nav.reports": "Report Center",
    "nav.audit": "Audit Logs",
    "nav.settings": "System Settings",
  },
  hi: {
    "nav.overview": "अवलोकन",
    "nav.users": "उपयोगकर्ता प्रबंधन",
    "nav.roles": "भूमिकाएँ और पहुँच",
    "nav.firms": "लॉ फर्म्स",
    "nav.kyc": "KYC स्वीकृतियां",
    "nav.subscriptions": "सदस्यता",
    "nav.storage": "किरायेदार संग्रहण",
    "nav.content": "प्रारूप और केस लॉ",
    "nav.support": "सहायता डेस्क",
    "nav.reports": "रिपोर्ट केंद्र",
    "nav.audit": "ऑडिट लॉग",
    "nav.settings": "सिस्टम सेटिंग्स",
  },
  mr: {
    "nav.overview": "आढावा",
    "nav.users": "वापरकर्ता व्यवस्थापन",
    "nav.roles": "भूमिका आणि प्रवेश",
    "nav.firms": "लॉ फर्म्स",
    "nav.kyc": "KYC मान्यता",
    "nav.subscriptions": "सदस्यत्व",
    "nav.storage": "भाडेकरू स्टोरेज",
    "nav.content": "मसुदे आणि केस कायदे",
    "nav.support": "सपोर्ट डेस्क",
    "nav.reports": "अहवाल केंद्र",
    "nav.audit": "ऑडिट लॉग",
    "nav.settings": "सिस्टम सेटिंग्ज",
  },
  gu: {
    "nav.overview": "ઝાંખી",
    "nav.users": "વપરાશકર્તા વ્યવસ્થાપન",
    "nav.roles": "ભૂમિકાઓ અને ઍક્સેસ",
    "nav.firms": "લૉ ફર્મ્સ",
    "nav.kyc": "KYC મંજૂરીઓ",
    "nav.subscriptions": "સબ્સ્ક્રિપ્શન્સ",
    "nav.storage": "ભાડૂત સંગ્રહ",
    "nav.content": "ડ્રાફ્ટ્સ અને કેસ કાયદા",
    "nav.support": "સપોર્ટ ડેસ્ક",
    "nav.reports": "રિપોર્ટ સેન્ટર",
    "nav.audit": "ઓડિટ લોગ્સ",
    "nav.settings": "સિસ્ટમ સેટિંગ્સ",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
