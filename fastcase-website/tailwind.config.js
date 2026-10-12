/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#013B36',
          50: '#F0FDF8',
          100: '#DCF7EC',
          200: '#BAEBD9',
          300: '#87D7BE',
          400: '#3FB594',
          500: '#014D46',
          600: '#013B36',
          700: '#0B3D2E',
          800: '#082C22',
          900: '#041A14',
          950: '#02110D',
        },
        gold: {
          DEFAULT: '#C59B27',
          light: '#FBF5E6',
          border: '#E8D49E',
          dark: '#A67F18',
        },
        teal: {
          DEFAULT: '#014D46',
          50: '#F0F9F8',
          100: '#D0EEEA',
          500: '#014D46',
          600: '#013B36',
          700: '#0B3D2E',
        },
        ink: {
          DEFAULT: '#0B132B',
          secondary: '#334155',
          muted: '#64748B',
        },
        surface: {
          DEFAULT: '#F8FAFC',
          alt: '#F1F5F9',
          card: '#FFFFFF',
        },
        line: '#E2E8F0',
        success: '#15803D',
        hover: '#014D46',
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
        feature: '0 20px 60px -10px rgba(1,59,54,0.12)',
        dashboard: '0 25px 80px -15px rgba(1,59,54,0.18), 0 8px 20px -8px rgba(15,23,42,0.08)',
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
