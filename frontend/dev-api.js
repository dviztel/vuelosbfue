// =============================================================================
//  Servidor de DESARROLLO LOCAL.
//  Expone la misma función serverless de Vercel (api/flights.js) en
//  http://localhost:3001/api/flights para poder trabajar con `npm run dev`.
//  En producción NO se usa: Vercel ejecuta api/flights.js como función.
//
//  Arranca con:  npm run dev:api   (en otra terminal, junto a `npm run dev`)
// =============================================================================

import express from 'express';
import handler from './api/flights.js';

const PORT = process.env.PORT || 3001;
const app = express();
app.use(express.json());

// Misma ruta y mismo handler que en producción.
app.all('/api/flights', (req, res) => handler(req, res));

app.listen(PORT, () => {
  console.log(`\n🛠  Dev API en http://localhost:${PORT}/api/flights`);
  console.log('   (en producción lo sirve Vercel como función serverless)\n');
});
