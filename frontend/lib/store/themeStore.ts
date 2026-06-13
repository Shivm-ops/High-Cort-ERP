import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ThemeColors {
  primary: string;
  accent: string;
  isLight?: boolean;
}

export interface TypographySettings {
  fontStyle: string;
  fontSize: string;
  borderRadius: string;
  layout: string;
}

export const PREDEFINED_THEMES = [
  { id: "emerald", name: "Emerald Legal", primary: "#013B36", accent: "#6EE7B7", desc: "Modern Law Firm Style" },
  { id: "executive", name: "Executive Blue", primary: "#1E3A8A", accent: "#FFFFFF", desc: "Corporate & Arbitration" },
  { id: "supreme", name: "Supreme Black", primary: "#111827", accent: "#D4AF37", desc: "Senior Advocates & High Court" },
  { id: "maroon", name: "Classic Maroon", primary: "#800000", accent: "#FFFFF0", desc: "Traditional Legal Chamber" },
  { id: "silver", name: "Silver Professional", primary: "#374151", accent: "#C0C0C0", desc: "Modern Litigation Practice" },
  { id: "royal", name: "Royal Purple", primary: "#4C1D95", accent: "#FFFFFF", desc: "Premium Boutique Firms" },
  { id: "minimal", name: "Minimal White", primary: "#FFFFFF", accent: "#374151", desc: "Clean Professional Appearance", isLight: true },
];

interface ThemeState {
  activeThemeId: string;
  customColors: ThemeColors;
  typography: TypographySettings;
  
  // Actions
  setActiveThemeId: (id: string) => void;
  setCustomColors: (colors: Partial<ThemeColors>) => void;
  setTypography: (settings: Partial<TypographySettings>) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      activeThemeId: "emerald",
      customColors: { primary: "#013B36", accent: "#6EE7B7" },
      typography: { fontStyle: "Inter", fontSize: "13px", borderRadius: "0.75rem", layout: "comfortable" },
      
      setActiveThemeId: (id) => set({ activeThemeId: id }),
      setCustomColors: (colors) => set((state) => ({ customColors: { ...state.customColors, ...colors } })),
      setTypography: (settings) => set((state) => ({ typography: { ...state.typography, ...settings } })),
    }),
    {
      name: 'fastcase-theme-storage',
    }
  )
);
