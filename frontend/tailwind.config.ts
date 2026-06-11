import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sidebar
        sidebar: {
          DEFAULT: "var(--color-primary)",
          dark: "var(--color-primary-dark)",
          teal: "var(--color-primary-light)",
          light: "var(--color-primary-light)",
        },
        // Accent
        mint: {
          DEFAULT: "var(--color-accent)",
          dark: "#34D399",
          light: "#A7F3D0",
        },
        aqua: {
          DEFAULT: "#72D6C9",
          dark: "#2DD4BF",
        },
        lime: {
          DEFAULT: "#8FE388",
          dark: "#4ADE80",
        },
        // Highlights
        premium: {
          orange: "#F59E0B",
          coral: "#FB7185",
          purple: "#A78BFA",
          blue: "#60A5FA",
        },
        // Workspace
        workspace: {
          bg: "#F7F8F6",
          white: "#FFFFFF",
          border: "#E5E7EB",
          card: "#FFFFFF",
        },
        // Text
        charcoal: "#1F2937",
        muted: "#6B7280",
        // Status
        status: {
          active: "#10B981",
          pending: "#F59E0B",
          urgent: "#EF4444",
          completed: "#6B7280",
          hearing: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Cal Sans", "Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "sidebar-gradient":
          "linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 40%, var(--color-primary-dark) 100%)",
        "card-gradient":
          "linear-gradient(135deg, rgba(var(--color-accent-rgb), 0.1) 0%, rgba(var(--color-accent-rgb), 0.05) 100%)",
        "mint-gradient":
          "linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%)",
        "glass-gradient":
          "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        "card-hover":
          "0 10px 40px 0 rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)",
        "mint-glow": "0 0 20px rgba(110, 231, 183, 0.3)",
        "sidebar-active":
          "0 0 0 1px rgba(110, 231, 183, 0.2), 0 4px 16px rgba(110, 231, 183, 0.15)",
        premium: "0 20px 60px -10px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "pulse-mint": "pulseMint 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-20px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulseMint: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(110, 231, 183, 0)" },
          "50%": { boxShadow: "0 0 0 8px rgba(110, 231, 183, 0.2)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
