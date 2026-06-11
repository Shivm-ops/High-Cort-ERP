import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import all translation files directly (avoids HTTP backend issues in Next.js App Router)
import enTranslation from "./locales/en/translation.json";
import mrTranslation from "./locales/mr/translation.json";
import hiTranslation from "./locales/hi/translation.json";
import guTranslation from "./locales/gu/translation.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
];

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  mr: "मराठी",
  hi: "हिन्दी",
  gu: "ગુજરાતી",
};

const resources = {
  en: { translation: enTranslation },
  mr: { translation: mrTranslation },
  hi: { translation: hiTranslation },
  gu: { translation: guTranslation },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: "en",
      fallbackLng: "en",
      supportedLngs: ["en", "mr", "hi", "gu"],
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
