"use client";

import React, { useEffect } from "react";
import { useThemeStore, PREDEFINED_THEMES } from "@/lib/store/themeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeThemeId, customColors, typography } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;

    // Determine current theme colors
    const currentTheme = activeThemeId === "custom" 
      ? { primary: customColors.primary, accent: customColors.accent, isLight: customColors.isLight }
      : PREDEFINED_THEMES.find(t => t.id === activeThemeId) || PREDEFINED_THEMES[0];

    // Inject CSS variables
    root.style.setProperty("--color-primary", currentTheme.primary);
    root.style.setProperty("--color-accent", currentTheme.accent);

    // Some derived colors (simplified for now, ideally use a color manipulation library)
    root.style.setProperty("--color-primary-dark", currentTheme.primary); // Could darken
    root.style.setProperty("--color-primary-light", currentTheme.primary); // Could lighten
    root.style.setProperty("--color-accent-dark", currentTheme.accent);
    root.style.setProperty("--color-accent-light", currentTheme.accent);

    // Typography
    root.style.setProperty("--font-family-base", typography.fontStyle + ", system-ui, sans-serif");
    root.style.setProperty("--font-size-base", typography.fontSize);
    root.style.setProperty("--border-radius-base", typography.borderRadius);
    
    // Set a global class or attribute for light/dark specific overrides if needed
    if (currentTheme.isLight) {
      root.classList.add("theme-light");
    } else {
      root.classList.remove("theme-light");
    }

  }, [activeThemeId, customColors, typography]);

  return <>{children}</>;
}
