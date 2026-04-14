/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'fc-black': '#0e0e0e',
        'fc-surface': '#131313',
        'fc-surface-high': '#1e1e1e',
        'fc-surface-higher': '#2a2a2a',
        'fc-yellow': '#eaea00',
        'fc-yellow-dim': '#cdcd00',
        'fc-white': '#ffffff',
        'fc-outline': '#939277',
        'fc-outline-dim': '#484831',
        'fc-error': '#ff4444',
        'fc-error-container': '#93000a',
        'fc-on-error': '#ffdad6',
        'fc-muted': '#cac8aa',
      },
      fontFamily: {
        bungee: ['Bungee', 'cursive'],
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Work Sans', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        full: '9999px',
      },
      boxShadow: {
        'hard': '8px 8px 0px 0px #000000',
        'hard-yellow': '8px 8px 0px 0px #eaea00',
        'hard-white': '8px 8px 0px 0px #ffffff',
        'hard-sm': '4px 4px 0px 0px #000000',
        'hard-yellow-sm': '4px 4px 0px 0px #eaea00',
        'hard-lg': '12px 12px 0px 0px #000000',
        'hard-white-lg': '12px 12px 0px 0px #ffffff',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 10s linear infinite',
        'marquee': 'marquee 40s linear infinite',
        'scanline': 'scanline 2s linear infinite',
        'flicker': 'flicker 0.15s infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
