/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'sp-bg': '#16241C',
        'sp-surface': '#1F3327',
        'sp-surface-raised': '#28402F',
        'sp-ink': '#F3EFE2',
        'sp-ink-muted': '#A9B8AC',
        'sp-ink-faint': '#6E8074',
        'sp-pink': '#FF5DA2',
        'sp-yellow': '#F4D35E',
        'sp-cyan': '#7EE8CB',
        'sp-danger': '#FF6B6B',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'Segoe UI', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        pin: '999px',
      },
      boxShadow: {
        card: '0 2px 0 rgba(0,0,0,0.25), 0 8px 20px -6px rgba(0,0,0,0.35)',
        raised: '0 4px 0 rgba(0,0,0,0.28), 0 14px 30px -8px rgba(0,0,0,0.45)',
      },
      borderColor: {
        DEFAULT: 'rgba(243,239,226,0.14)',
        strong: 'rgba(243,239,226,0.28)',
      },
      backgroundImage: {
        corkboard:
          'radial-gradient(circle at 1px 1px, rgba(243,239,226,0.05) 1px, transparent 0)',
      },
      transitionTimingFunction: {
        'sp-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        skeletonSweep: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'sp-toast-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sp-toast-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(8px)' },
        },
        'sp-fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sp-page-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'sp-pin-pop': {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '70%': { opacity: '1', transform: 'scale(1.15)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'sp-like-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.28)' },
          '100%': { transform: 'scale(1)' },
        },
        'sp-busy-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.65' },
        },
      },
      animation: {
        skeleton: 'skeletonSweep 1.4s ease-in-out infinite',
        'sp-toast-in': 'sp-toast-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
        'sp-toast-out': 'sp-toast-out 0.15s ease-in both',
        'sp-fade-up': 'sp-fade-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'sp-page-in': 'sp-page-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) both',
        'sp-pin-pop': 'sp-pin-pop 0.42s cubic-bezier(0.22, 1, 0.36, 1) 0.08s both',
        'sp-like-pop': 'sp-like-pop 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        'sp-busy-pulse': 'sp-busy-pulse 0.9s ease-in-out infinite',
      },
      transitionDelay: {
        'sp-0': '0ms',
        'sp-1': '60ms',
        'sp-2': '120ms',
        'sp-3': '180ms',
        'sp-4': '240ms',
        'sp-5': '100ms',
      },
      rotate: {
        'sp-1': '-0.4deg',
        'sp-2': '0.3deg',
        'sp-3': '-0.15deg',
      },
    },
  },
  plugins: [],
}
