/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Funnel Display"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Funnel Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        studio: {
          bg: 'var(--p-bg)',
          surface: 'var(--p-surface)',
          elevated: 'var(--p-elevated)',
          ink: 'var(--p-ink)',
          muted: 'var(--p-muted)',
          accent: 'var(--p-accent)',
          accentInk: 'var(--p-accent-ink)',
          hairline: 'var(--p-hairline)',
        },
      },
    },
  },
  plugins: [],
};
