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
//  API KEY:
//   - Se toma de la cabecera "x-api-key" que envía el frontend.
//   - process.env.AVIATIONSTACK_KEY es un fallback SOLO para desarrollo local.
//     ⚠️  NO definas esa variable en Vercel: la URL es pública y cualquiera
//        gastaría tu cupo. En producción cada usuario mete su propia key.
// =============================================================================

const ARRIVAL_IATA = process.env.ARR_IATA || 'FUE';
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

  try {
    const url =
      `${API_BASE}?access_key=${encodeURIComponent(key)}` +
      `&arr_iata=${encodeURIComponent(ARRIVAL_IATA)}&limit=100`;

    const r = await fetch(url);
    const data = await r.json();

    // AviationStack devuelve 200 con { error } cuando la clave es inválida,
    // se agotó el cupo, etc.
    if (data?.error) {
      return res.status(502).json({
        error: data.error.message || data.error.info || 'Error de AviationStack',
      });
    }

    return res.status(200).json({ flights: data, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Error al contactar AviationStack' });
  }
}
