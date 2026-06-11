import { create } from "zustand";
import { persist } from "zustand/middleware";
import i18n from "@/lib/i18n";

export type SupportedLanguage = "en" | "mr" | "hi" | "gu";

interface LanguageState {
  uiLanguage: SupportedLanguage;
  draftLanguage: SupportedLanguage;
  documentLanguage: SupportedLanguage;
  setUILanguage: (lang: SupportedLanguage) => void;
  setDraftLanguage: (lang: SupportedLanguage) => void;
  setDocumentLanguage: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      uiLanguage: "en",
      draftLanguage: "en",
      documentLanguage: "en",

      setUILanguage: (lang) => {
        i18n.changeLanguage(lang);
        set({ uiLanguage: lang });
        // Apply script attribute for font loading
        if (lang === "mr" || lang === "hi") {
          document.documentElement.setAttribute("data-script", "devanagari");
          document.documentElement.lang = lang;
        } else if (lang === "gu") {
          document.documentElement.setAttribute("data-script", "gujarati");
          document.documentElement.lang = "gu";
        } else {
          document.documentElement.setAttribute("data-script", "latin");
          document.documentElement.lang = "en";
        }
        // Sync to backend (fire and forget)
        try {
          fetch("/api/users/me/language", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ preferred_language: lang }),
          }).catch(() => {/* silent fail — local store is source of truth */});
        } catch {/* ignore */}
      },

      setDraftLanguage: (lang) => set({ draftLanguage: lang }),
      setDocumentLanguage: (lang) => set({ documentLanguage: lang }),
    }),
    {
      name: "lagalos-language-storage",
    }
  )
);
