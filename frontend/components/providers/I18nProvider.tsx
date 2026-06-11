"use client";

import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/lib/i18n";
import { useLanguageStore } from "@/lib/store/languageStore";

function LanguageSync() {
  const { uiLanguage } = useLanguageStore();

  useEffect(() => {
    if (i18n.language !== uiLanguage) {
      i18n.changeLanguage(uiLanguage);
    }
    // Apply script attribute for font loading
    if (uiLanguage === "mr" || uiLanguage === "hi") {
      document.documentElement.setAttribute("data-script", "devanagari");
      document.documentElement.lang = uiLanguage === "mr" ? "mr" : "hi";
    } else if (uiLanguage === "gu") {
      document.documentElement.setAttribute("data-script", "gujarati");
      document.documentElement.lang = "gu";
    } else {
      document.documentElement.setAttribute("data-script", "latin");
      document.documentElement.lang = "en";
    }
  }, [uiLanguage]);

  return null;
}

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <LanguageSync />
      {children}
    </I18nextProvider>
  );
}
