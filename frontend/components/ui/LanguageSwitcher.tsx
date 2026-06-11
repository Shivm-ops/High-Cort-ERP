"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Check } from "lucide-react";
import { useLanguageStore, SupportedLanguage } from "@/lib/store/languageStore";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const [open, setOpen] = useState(false);
  const { uiLanguage, setUILanguage } = useLanguageStore();

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === uiLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        title="Change Language / भाषा बदलें / भाषा बदला / ભાષા બદલો"
        className={cn(
          "h-9 px-3 rounded-xl flex items-center gap-1.5 text-[12px] font-semibold transition-all duration-200 border",
          open
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
        )}
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="hidden sm:block">{current.nativeName}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
            >
              {/* Header */}
              <div className="px-3 py-2.5 border-b border-gray-50 bg-gray-50/60">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3 h-3" />
                  Interface Language
                </div>
              </div>

              <div className="p-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setUILanguage(lang.code as SupportedLanguage);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                      uiLanguage === lang.code
                        ? "bg-green-50 text-green-700"
                        : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <span className="text-base w-6 text-center">{lang.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold leading-tight truncate">
                        {lang.nativeName}
                      </div>
                      {lang.nativeName !== lang.name && (
                        <div className="text-[10px] text-gray-400 leading-tight">
                          {lang.name}
                        </div>
                      )}
                    </div>
                    {uiLanguage === lang.code && (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Footer hint */}
              <div className="px-3 py-2 border-t border-gray-50 bg-gray-50/40">
                <p className="text-[10px] text-gray-400 text-center">
                  More in Settings → Multilingual
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
