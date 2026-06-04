// =============================================================================
//  Cliente de datos. El frontend NUNCA habla con AviationStack directamente
//  (HTTP/HTTPS mixed content). Pasa por la función serverless /api/flights,
//  que es un simple proxy STATELESS.
//
//  TODO el estado vive en ESTE dispositivo (localStorage):
//   - La API key del usuario (cada persona la suya).
//   - El contador de consumo (100 req/mes) por key.
//   - La caché de la última respuesta (para no gastar requests al abrir).
//
//  Hay DOS sentidos (llegadas y salidas a/desde FUE). Un refresco trae los dos
//  → gasta 2 requests. Cada sentido se cachea por separado.
// =============================================================================

const LIMIT = 100; // requests/mes del plan gratuito de AviationStack

const KEY_STORAGE = 'fue_aviationstack_key';
const CACHE_STORAGE = 'fue_flights_cache';
const USAGE_STORAGE = 'fue_usage';

// --- localStorage helpers ----------------------------------------------------

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v == null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado / sin espacio */
  }
}

// Mes natural en hora de Canarias (para que el "mes" cuadre con el calendario
// local y el contador se reinicie a la vez que el cupo).
function monthKey() {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Atlantic/Canary',
    year: 'numeric',
    month: '2-digit',
  });
  return fmt.format(new Date()); // p.ej. "2026-06"
}

// --- API key del usuario -----------------------------------------------------

export function getApiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setApiKey(key) {
  try {
    const clean = (key || '').trim();
    if (clean) localStorage.setItem(KEY_STORAGE, clean);
    else localStorage.removeItem(KEY_STORAGE);
  } catch {
    /* localStorage no disponible */
  }
}

export function hasApiKey() {
  return Boolean(getApiKey());
}

function authHeaders() {
  const key = getApiKey();
  return key ? { 'x-api-key': key } : {};
}

// Identificador corto y no sensible para separar el consumo por key.
function keyId(key) {
  return key ? key.slice(-6) : 'none';
}

// --- Contador de consumo (por key, en este dispositivo) ----------------------

function readUsage() {
  const all = readLS(USAGE_STORAGE, {});
  const id = keyId(getApiKey());
  const month = monthKey();
  if (!all[id] || all[id].month !== month) {
    all[id] = { count: 0, month }; // auto-reset al cambiar de mes
    writeLS(USAGE_STORAGE, all);
  }
  return all[id];
}

function bumpUsage() {
  const all = readLS(USAGE_STORAGE, {});
  const id = keyId(getApiKey());
  const month = monthKey();
  if (!all[id] || all[id].month !== month) all[id] = { count: 0, month };
  all[id].count += 1;
  writeLS(USAGE_STORAGE, all);
  return all[id];
}

function withMeta(usage) {
  // usingServerKey siempre false: en producción cada usuario usa su key.
  return { ...usage, limit: LIMIT, usingServerKey: false };
}

// Construye la respuesta que consume la app a partir de la caché por sentido.
function buildResult(cache, cached) {
  const arr = cache?.arrivals;
  const dep = cache?.departures;
  const times = [arr?.fetchedAt, dep?.fetchedAt].filter(Boolean).sort();
  return {
    arrivals: Array.isArray(arr?.list) ? arr.list : [],
    departures: Array.isArray(dep?.list) ? dep.list : [],
    fetchedAt: times.length ? times[times.length - 1] : null,
    cached,
    usage: withMeta(readUsage()),
  };
}

// --- API pública usada por la app -------------------------------------------

// En producción no hay key de servidor (la URL es pública). Forzar diálogo.
export async function getHealth() {
  return { ok: true, hasServerKey: false };
}

export async function getUsage() {
  return withMeta(readUsage());
}

export async function resetUsage() {
  const all = readLS(USAGE_STORAGE, {});
  const id = keyId(getApiKey());
  all[id] = { count: 0, month: monthKey() };
  writeLS(USAGE_STORAGE, all);
  return withMeta(all[id]);
}

// Una llamada REAL al proxy para un sentido. Gasta 1 request al tener éxito.
async function fetchDirection(direction) {
  let res;
  try {
    res = await fetch(`/api/flights?direction=${direction}`, { headers: { ...authHeaders() } });
  } catch {
    throw new Error('No se pudo contactar con el servidor.');
  }

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) throw new Error(body?.error || `Error ${res.status}`);

  bumpUsage(); // solo contamos si la API respondió OK
  const list = Array.isArray(body?.flights?.data) ? body.flights.data : [];
  return { list, fetchedAt: body?.fetchedAt || null };
}

// Refresco REAL de AMBOS sentidos. Gasta hasta 2 requests.
async function fetchBoth() {
  const usage0 = readUsage();
  if (usage0.count >= LIMIT) {
    const err = new Error(`Has alcanzado el límite de ${LIMIT} requests este mes.`);
    err.usage = withMeta(usage0);
    throw err;
  }

  const cache = readLS(CACHE_STORAGE, {}) || {};
  const [aRes, dRes] = await Promise.allSettled([
    fetchDirection('arrivals'),
    fetchDirection('departures'),
  ]);

  if (aRes.status === 'fulfilled') cache.arrivals = aRes.value;
  if (dRes.status === 'fulfilled') cache.departures = dRes.value;
  writeLS(CACHE_STORAGE, cache);

  // Si los dos fallan, propagamos el error (con el consumo actual).
  if (aRes.status === 'rejected' && dRes.status === 'rejected') {
    const err = new Error(aRes.reason?.message || dRes.reason?.message || 'Error al actualizar.');
    err.usage = withMeta(readUsage());
    throw err;
  }

  return buildResult(cache, false);
}

// Carga "barata": usa la caché del dispositivo (NO gasta). Si no hay caché y
// hay key, hace una primera consulta real (ambos sentidos). Sin key, devuelve
// vacío (la app abrirá el diálogo para que el usuario meta su clave).
export async function getFlights() {
  const cache = readLS(CACHE_STORAGE, null);
  if (cache && (cache.arrivals || cache.departures)) {
    return buildResult(cache, true);
  }
  if (!getApiKey()) {
    return buildResult({}, false);
  }
  return fetchBoth();
}

// Refresco REAL: siempre llama al proxy (ambos sentidos) y gasta requests.
export async function refreshFlights() {
  return fetchBoth();
}
