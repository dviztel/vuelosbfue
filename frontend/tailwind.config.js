/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta "slate aeropuerto": grises azulados oscuros + acento naranja.
        // (Se conserva el nombre `tower` para no tocar las clases existentes.)
        tower: {
          950: '#10171f',
          900: '#1a2530', // fondo general / cabecera
          800: '#222f3d',
          700: '#2c3a4b', // tarjetas / bordes
          600: '#3a4a5e', // borde hover
          500: '#4d6076',
        },
        amber: {
          glow: '#f0883e', // acento naranja (tabs, barra de fecha, resaltes)
          400: '#f59e57', // naranja claro para hover
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 12px rgba(240, 136, 62, 0.35)',
      },
    },
  },
  plugins: [],
};
