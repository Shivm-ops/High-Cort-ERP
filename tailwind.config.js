/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F4C81',
          50: '#EBF3FB',
          100: '#C8DFF4',
          200: '#9EC5EA',
          300: '#74ABDF',
          400: '#4A91D5',
          500: '#0F4C81',
          600: '#0D4474',
          700: '#0B3963',
          800: '#082D4E',
          900: '#061F37',
        },
        teal: {
          DEFAULT: '#0EA5A4',
          50: '#ECFAFA',
          100: '#C6EEEE',
          500: '#0EA5A4',
          600: '#0D9594',
          700: '#0B8080',
        },
        ink: {
          DEFAULT: '#0F172A',
          secondary: '#475569',
          muted: '#94A3B8',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          alt: '#EEF2F7',
          card: '#FFFFFF',
        },
        line: '#E2E8F0',
        success: '#16A34A',
        hover: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'sans-serif'],
      },
      fontSize: {
        '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '6xl': ['3.75rem', { lineHeight: '1.08', letterSpacing: '-0.025em' }],
        '7xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.04)',
        'card-hover': '0 10px 30px -5px rgba(15,23,42,0.08), 0 4px 12px -4px rgba(15,23,42,0.06)',
        feature: '0 20px 60px -10px rgba(15,76,129,0.10)',
        dashboard: '0 25px 80px -15px rgba(15,76,129,0.15), 0 8px 20px -8px rgba(15,23,42,0.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
