/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(255, 255, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 255, 255, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
        '4xl': '72px',
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in-up': 'fade-in-up 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in-left': 'fade-in-left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'fade-in-right': 'fade-in-right 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'bounce-once': 'bounce-once 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'float': 'float 4s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-in-bottom': 'slide-in-bottom 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'rotate-in': 'rotate-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'bounce-in': 'bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        'fade-in-down': {
          'from': {
            opacity: '0',
            transform: 'translateY(-40px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-up': {
          'from': {
            opacity: '0',
            transform: 'translateY(40px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in-left': {
          'from': {
            opacity: '0',
            transform: 'translateX(-40px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'fade-in-right': {
          'from': {
            opacity: '0',
            transform: 'translateX(40px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'bounce-once': {
          '0%, 20%, 53%, 80%, 100%': {
            transform: 'translate3d(0, 0, 0)',
          },
          '40%, 43%': {
            transform: 'translate3d(0, -12px, 0)',
          },
          '70%': {
            transform: 'translate3d(0, -6px, 0)',
          },
          '90%': {
            transform: 'translate3d(0, -3px, 0)',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-15px)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            boxShadow: '0 0 25px rgba(255, 255, 255, 0.2)',
          },
          '50%': {
            boxShadow: '0 0 35px rgba(255, 255, 255, 0.4)',
          },
        },
        'shimmer': {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0',
          },
        },
        'slide-in-bottom': {
          'from': {
            opacity: '0',
            transform: 'translateY(30px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'scale-in': {
          'from': {
            opacity: '0',
            transform: 'scale(0.9)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        'rotate-in': {
          'from': {
            opacity: '0',
            transform: 'rotate(-180deg) scale(0.5)',
          },
          'to': {
            opacity: '1',
            transform: 'rotate(0deg) scale(1)',
          },
        },
        'bounce-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.3)',
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.05)',
          },
          '70%': {
            transform: 'scale(0.9)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
    },
  },
  plugins: [],
}
