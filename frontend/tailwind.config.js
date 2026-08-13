/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'sp-bg': '#F0F4F2',
        'sp-surface': '#FFFFFF',
        'sp-surface-raised': '#E8F0EA',
        'sp-ink': '#111827',
        'sp-ink-muted': '#4B5563',
        'sp-ink-faint': '#9CA3AF',
        'sp-pink': '#1877F2', /* Reused as primary blue/celeste */
        'sp-yellow': '#F59E0B',
        'sp-cyan': '#0EA5E9', /* Light blue / celeste */
        'sp-danger': '#EF4444',
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
      keyframes: {
        skeletonSweep: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        skeleton: 'skeletonSweep 1.4s ease-in-out infinite',
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
