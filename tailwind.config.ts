import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        vault: {
          bg: '#0a0a1a',
          card: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#f97316',
          coral: '#ff6b6b',
          magenta: '#e040fb',
          cyan: '#22d3ee',
          purple: '#a855f7',
          success: '#22c55e',
          danger: '#ef4444',
          warning: '#f59e0b',
          pending: '#f59e0b',
          muted: 'rgba(255, 255, 255, 0.4)',
        },
      },
      backgroundImage: {
        'vault-gradient': 'linear-gradient(135deg, #0f0c29 0%, #1a1145 30%, #24243e 60%, #0f0c29 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'accent-gradient': 'linear-gradient(135deg, #f97316, #e040fb, #a855f7)',
        'stat-gradient': 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(224,64,251,0.15))',
        'hero-gradient': 'linear-gradient(180deg, rgba(10,10,26,0) 0%, rgba(10,10,26,0.8) 50%, #0a0a1a 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(249,115,22,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(249,115,22,0.4)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
