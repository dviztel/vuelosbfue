/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Estética "torre de control": azules profundos + ámbar de pista.
        tower: {
          950: '#040814',
          900: '#071029',
          800: '#0b1a3a',
          700: '#11264f',
          600: '#1b3668',
          500: '#27478a',
        },
        amber: {
          glow: '#ffb000', // ámbar luces de pista
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(255, 176, 0, 0.35)',
      },
    },
  },
  plugins: [],
};
