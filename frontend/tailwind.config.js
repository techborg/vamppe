/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pulse: {
          50:  '#fff8f0',
          100: '#ffecd6',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6c0a',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        surface: {
          DEFAULT: '#0a0a0f',
          1: '#12121a',
          2: '#18182280',
          3: '#1e1e2a',
          4: '#26263380',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'glow-pulse': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(249,115,22,0.14) 0%, transparent 70%)',
        'glow-violet': 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.14) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-sm': '0 0 14px rgba(249,115,22,0.28)',
        'glow-md': '0 0 28px rgba(249,115,22,0.22)',
        'glow-lg': '0 0 48px rgba(249,115,22,0.18)',
        'glass':   '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07)',
      },
      animation: {
        'pulse-once': 'pulseOnce 0.35s ease-out',
        'slide-up':   'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        'fade-in':    'fadeIn 0.18s ease-out',
        'scale-in':   'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':    'shimmer 2s infinite',
      },
      keyframes: {
        pulseOnce: {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.4)' },
          '100%': { transform: 'scale(1)' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)',   opacity: 1 },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        scaleIn: {
          '0%':   { transform: 'scale(0.94)', opacity: 0 },
          '100%': { transform: 'scale(1)',    opacity: 1 },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
