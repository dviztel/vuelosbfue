// =============================================================================
//  FUE Border Control · Backend proxy para AviationStack
// -----------------------------------------------------------------------------
//  ¿Por qué existe este backend?
//  El plan GRATUITO de AviationStack SOLO responde por HTTP (no HTTPS).
//  Un frontend servido por HTTPS no puede llamar a un endpoint HTTP: el
//  navegador lo bloquea por "mixed content". La solución es este proxy:
//  el servidor llama a la API por HTTP (server-side, sin restricciones de
//  navegador) y reexpone los datos al frontend por HTTPS.
//
//  Además centraliza el CONTROL DE CONSUMO (solo 100 requests/mes):
//   - Persiste un contador en disco (usage.json), SEPARADO POR API KEY.
//   - Cachea la última respuesta (cache.json) para no malgastar requests.
//   - Distingue entre lectura de caché (no cuenta) y refresco real (cuenta).
//
//  API KEY POR USUARIO:
//   - Cada persona puede mandar su propia key en la cabecera "x-api-key"
//     (el frontend la guarda en localStorage y la envía en cada petición).
//   - Si no manda ninguna, se usa la key del .env (AVIATIONSTACK_KEY) como
//     fallback. Así cada usuario gasta SU cupo, no el del dueño del servidor.
// =============================================================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3001;
const ENV_API_KEY = (process.env.AVIATIONSTACK_KEY || '').trim();
const MONTHLY_LIMIT = Number(process.env.MONTHLY_LIMIT || 100);
const ARRIVAL_IATA = process.env.ARR_IATA || 'FUE';

// IMPORTANTE: HTTP, no HTTPS (limitación del plan gratuito).
const API_BASE = 'http://api.aviationstack.com/v1/flights';

const USAGE_FILE = path.join(__dirname, 'usage.json');
const CACHE_FILE = path.join(__dirname, 'cache.json');

if (!ENV_API_KEY) {
  console.warn(
    '\n⚠️  No hay AVIATIONSTACK_KEY en el .env (fallback del servidor).\n' +
    '   No pasa nada si cada usuario introduce su propia key en la app,\n' +
    '   pero sin key local NI de servidor no se podrán traer vuelos.\n'
  );
}

// -----------------------------------------------------------------------------
//  Resolución de la API key y su identificador de consumo
// -----------------------------------------------------------------------------

// La key del usuario (cabecera x-api-key) tiene PRIORIDAD sobre la del .env.
function resolveKey(req) {
  const headerKey = (req.get('x-api-key') || '').trim();
  return headerKey || ENV_API_KEY || '';
}

// ¿Está usando la key del servidor (la del .env) en vez de una propia?
function usingServerKey(req) {
  const headerKey = (req.get('x-api-key') || '').trim();
  return !headerKey;
}

// Identificador corto y NO sensible para separar el consumo por key.
// (los últimos 6 caracteres bastan para distinguir entre usuarios).
function keyId(key) {
  if (!key) return 'none';
  return key.slice(-6);
}

// -----------------------------------------------------------------------------
//  Persistencia sencilla en ficheros JSON
// -----------------------------------------------------------------------------

const currentMonthKey = () => {
  // Mes en hora de Canarias, para que el "mes" coincida con el calendario local.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Atlantic/Canary',
    year: 'numeric',
    month: '2-digit',
  });
  return fmt.format(new Date()); // p.ej. "2026-05"
};

async function readJson(file, fallback) {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

// usage.json tiene forma { "<keyId>": { count, month }, ... } → un cupo por key.
async function getUsage(key) {
  const all = await readJson(USAGE_FILE, {});
  const id = keyId(key);
  const month = currentMonthKey();
  // Auto-reset cuando cambia el mes natural (por key).
  if (!all[id] || all[id].month !== month) {
    all[id] = { count: 0, month };
    await writeFile(USAGE_FILE, JSON.stringify(all, null, 2));
  }
  return all[id]; // { count, month }
}

async function bumpUsage(key) {
  const all = await readJson(USAGE_FILE, {});
  const id = keyId(key);
  const month = currentMonthKey();
  if (!all[id] || all[id].month !== month) all[id] = { count: 0, month };
  all[id].count += 1;
  await writeFile(USAGE_FILE, JSON.stringify(all, null, 2));
  return all[id];
}

async function resetUsage(key) {
  const all = await readJson(USAGE_FILE, {});
  const id = keyId(key);
  all[id] = { count: 0, month: currentMonthKey() };
  await writeFile(USAGE_FILE, JSON.stringify(all, null, 2));
  return all[id];
}

// La caché es GLOBAL: los vuelos que llegan a FUE son los mismos sea cual sea
// la key, así que cualquier usuario aprovecha la última respuesta cacheada.
async function getCache() {
  return readJson(CACHE_FILE, null);
}

async function setCache(payload) {
  await writeFile(CACHE_FILE, JSON.stringify(payload, null, 2));
  return payload;
}

// -----------------------------------------------------------------------------
//  Llamada real a AviationStack (cuenta 1 request del cupo de esa key)
// -----------------------------------------------------------------------------

async function fetchFlightsFromApi(key) {
  if (!key) {
    const err = new Error(
      'No hay API key. Introduce tu clave de AviationStack en ⚙ Ajustes.'
    );
    err.status = 400;
    throw err;
  }

  const url =
    `${API_BASE}?access_key=${encodeURIComponent(key)}` +
    `&arr_iata=${encodeURIComponent(ARRIVAL_IATA)}&limit=100`;

  const res = await fetch(url);
  const data = await res.json();

  // AviationStack devuelve 200 con un objeto { error } cuando algo falla
  // (clave inválida, límite mensual agotado, etc.).
  if (data?.error) {
    const err = new Error(data.error.message || data.error.info || 'Error de AviationStack');
    err.status = 502;
    err.code = data.error.code;
    throw err;
  }

  return data;
}

// -----------------------------------------------------------------------------
//  App
// -----------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

// Salud. hasServerKey indica si hay key de fallback en el .env.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasServerKey: Boolean(ENV_API_KEY), arr: ARRIVAL_IATA });
});

// Consumo actual (de la key del usuario, o de la del servidor si no manda una).
app.get('/api/usage', async (req, res) => {
  const key = resolveKey(req);
  const usage = await getUsage(key);
  res.json({
    ...usage,
    limit: MONTHLY_LIMIT,
    usingServerKey: usingServerKey(req),
    hasServerKey: Boolean(ENV_API_KEY),
  });
});

// Reset manual del contador (botón "empezar mes nuevo") de la key activa.
app.post('/api/usage/reset', async (req, res) => {
  const key = resolveKey(req);
  const usage = await resetUsage(key);
  res.json({
    ...usage,
    limit: MONTHLY_LIMIT,
    usingServerKey: usingServerKey(req),
    hasServerKey: Boolean(ENV_API_KEY),
  });
});

// Lectura "barata": devuelve la caché si existe. Solo gasta 1 request si
// nunca se ha cargado nada (primera vez de todas). Se usa en la carga inicial.
app.get('/api/flights', async (req, res) => {
  try {
    const key = resolveKey(req);
    const usage = await getUsage(key);
    const cache = await getCache();

    if (cache) {
      return res.json({
        flights: cache.data,
        fetchedAt: cache.fetchedAt,
        cached: true,
        usage: { ...usage, limit: MONTHLY_LIMIT, usingServerKey: usingServerKey(req) },
      });
    }

    // No hay nada cacheado todavía → primera consulta real.
    if (usage.count >= MONTHLY_LIMIT) {
      return res.status(429).json({
        error: 'Límite mensual de requests alcanzado y no hay datos en caché.',
        usage: { ...usage, limit: MONTHLY_LIMIT, usingServerKey: usingServerKey(req) },
      });
    }

    const data = await fetchFlightsFromApi(key);
    const bumped = await bumpUsage(key);
    const saved = await setCache({ data, fetchedAt: new Date().toISOString() });

    res.json({
      flights: saved.data,
      fetchedAt: saved.fetchedAt,
      cached: false,
      usage: { ...bumped, limit: MONTHLY_LIMIT, usingServerKey: usingServerKey(req) },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// Refresco REAL: siempre llama a la API y gasta 1 request. Lo dispara el
// botón de actualizar (tras el diálogo de confirmación del frontend).
app.post('/api/refresh', async (req, res) => {
  try {
    const key = resolveKey(req);
    const usage = await getUsage(key);

    if (usage.count >= MONTHLY_LIMIT) {
      return res.status(429).json({
        error: `Has alcanzado el límite de ${MONTHLY_LIMIT} requests este mes.`,
        usage: { ...usage, limit: MONTHLY_LIMIT, usingServerKey: usingServerKey(req) },
      });
    }

    const data = await fetchFlightsFromApi(key);
    const bumped = await bumpUsage(key);
    const saved = await setCache({ data, fetchedAt: new Date().toISOString() });

    res.json({
      flights: saved.data,
      fetchedAt: saved.fetchedAt,
      cached: false,
      usage: { ...bumped, limit: MONTHLY_LIMIT, usingServerKey: usingServerKey(req) },
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✈️  FUE Border Control · backend escuchando en http://localhost:${PORT}`);
  console.log(`   Arrivals: ${ARRIVAL_IATA} · Límite mensual: ${MONTHLY_LIMIT} requests/key`);
  console.log(`   Key de servidor (fallback): ${ENV_API_KEY ? 'cargada ✓' : 'NO configurada ✗'}\n`);
});
