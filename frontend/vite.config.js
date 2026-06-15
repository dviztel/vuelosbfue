import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import handler from './api/flights.js';

// El frontend nunca llama a AviationStack directamente (mixed content HTTP/HTTPS):
// pasa por la función serverless api/flights.js. En PRODUCCIÓN la ejecuta Vercel.
// En DESARROLLO, este plugin monta esa MISMA función como middleware del dev
// server, así un único `npm run dev` sirve la web y la API en :5173 (no hace
// falta un segundo proceso ni proxy).
function devApi() {
  return {
    name: 'dev-api-flights',
    configureServer(server) {
      server.middlewares.use('/api/flights', async (req, res) => {
        const url = new URL(req.originalUrl || req.url, 'http://localhost');
        req.query = Object.fromEntries(url.searchParams);
        // Shim mínimo de la API de respuesta estilo Vercel (res.status().json()).
        res.status = (code) => {
          res.statusCode = code;
          return res;
        };
        res.json = (obj) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
          return res;
        };
        try {
          await handler(req, res);
        } catch (e) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e?.message || 'Error en la API local' }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), devApi()],
  server: { port: 5173 },
});
