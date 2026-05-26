/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surface scale — dark, layered
        surface: {
          0:  '#0a0a0f',  // deepest background
          1:  '#0f0f16',  // base bg
          2:  '#13131c',  // card bg
          3:  '#1a1a26',  // elevated card
          4:  '#202030',  // hover state
          5:  '#282840',  // active state
        },
        // Primary accent — electric teal
        accent: {
          DEFAULT: '#00d4aa',
          dim:     '#00d4aa33',
          muted:   '#00d4aa66',
          hover:   '#00efc0',
        },
        // Text scale
        ink: {
          primary:   '#e8e8f0',
          secondary: '#9090b0',
          tertiary:  '#505070',
          disabled:  '#303050',
        },
        // Status colors
        danger:  '#ff4d6a',
        warning: '#f5a623',
        success: '#00d4aa',
      },
      fontFamily: {
        sans:  ['DM Sans', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
      borderRadius: {
        'xl2': '16px',
        'xl3': '20px',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.25s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
