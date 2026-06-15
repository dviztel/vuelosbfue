// =============================================================================
//  Función serverless (Vercel) · Proxy a AviationStack
// -----------------------------------------------------------------------------
//  ÚNICO motivo de que esto viva en el servidor:
//  el plan GRATUITO de AviationStack SOLO responde por HTTP (no HTTPS), y un
//  navegador en HTTPS no puede llamar a un endpoint HTTP (mixed content).
//  Esta función llama por HTTP server-side y devuelve los datos por HTTPS.
//
//  Es STATELESS: no guarda contador ni caché. El contador (100 req/mes) y la
//  caché viven en el navegador de cada usuario (localStorage), porque cada
//  persona usa SU propia API key.
//
//  DIRECCIÓN (?direction=arrivals|departures):
//   - arrivals   → vuelos que LLEGAN a FUE   (arr_iata=FUE)
//   - departures → vuelos que SALEN de FUE   (dep_iata=FUE)
//   El filtro UK/Irlanda lo aplica el frontend sobre el otro extremo.
//
//  API KEY:
//   - Se toma de la cabecera "x-api-key" que envía el frontend.
//   - process.env.AVIATIONSTACK_KEY es un fallback SOLO para desarrollo local.
//     ⚠️  NO definas esa variable en Vercel: la URL es pública y cualquiera
//        gastaría tu cupo. En producción cada usuario mete su propia key.
// =============================================================================

const FUE_IATA = process.env.FUE_IATA || 'FUE';
const API_BASE = 'http://api.aviationstack.com/v1/flights';

export default async function handler(req, res) {
  const headerKey = (req.headers['x-api-key'] || '').toString().trim();
  // El fallback de entorno solo aplica en local (en Vercel no debe existir).
  const key = headerKey || (process.env.AVIATIONSTACK_KEY || '').trim();

  if (!key) {
    return res.status(400).json({
      error: 'No hay API key. Introduce tu clave de AviationStack en ⚙ Ajustes.',
    });
  }

  // Dirección del listado. Por defecto, llegadas (compatibilidad).
  const direction =
    (req.query?.direction || '').toString().toLowerCase() === 'departures'
      ? 'departures'
      : 'arrivals';
  const param = direction === 'departures' ? 'dep_iata' : 'arr_iata';

  // Paginación: FUE tiene ~200 movimientos/día y el plan gratuito devuelve como
  // mucho 100 por llamada. Con ?offset=100, 200… el cliente pide las siguientes
  // páginas para no perderse vuelos UK/Irlanda (cada página = 1 request).
  const offset = Math.max(0, parseInt((req.query?.offset || '0').toString(), 10) || 0);

  try {
    const url =
      `${API_BASE}?access_key=${encodeURIComponent(key)}` +
      `&${param}=${encodeURIComponent(FUE_IATA)}&limit=100&offset=${offset}`;

    const r = await fetch(url);
    const data = await r.json();

    // AviationStack devuelve 200 con { error } cuando la clave es inválida,
    // se agotó el cupo, etc.
    if (data?.error) {
      return res.status(502).json({
        error: data.error.message || data.error.info || 'Error de AviationStack',
      });
    }

    return res
      .status(200)
      .json({ flights: data, direction, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Error al contactar AviationStack' });
  }
}
