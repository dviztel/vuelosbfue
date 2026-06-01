// =============================================================================
//  Utilidades de formato: horas en zona de Canarias, estados, códigos de vuelo
// =============================================================================

import { AIRPORT_BY_IATA, AIRLINE_BY_ICAO } from '../config/airports.js';

const CANARY_TZ = 'Atlantic/Canary';

// La API devuelve timestamps ISO (normalmente con offset). Los formateamos
// SIEMPRE en hora de Canarias (GMT/WEST), una hora menos que la península.
export function toCanaryTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: CANARY_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export function toCanaryDateTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: CANARY_TZ,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

// ¿La hora estimada difiere de la programada? (margen > 1 min)
export function timesDiffer(scheduledIso, estimatedIso) {
  if (!scheduledIso || !estimatedIso) return false;
  const s = new Date(scheduledIso).getTime();
  const e = new Date(estimatedIso).getTime();
  if (isNaN(s) || isNaN(e)) return false;
  return Math.abs(e - s) > 60 * 1000;
}

// Minutos de retraso (positivo = retraso). null si no se puede calcular.
export function delayMinutes(scheduledIso, estimatedIso) {
  if (!scheduledIso || !estimatedIso) return null;
  const s = new Date(scheduledIso).getTime();
  const e = new Date(estimatedIso).getTime();
  if (isNaN(s) || isNaN(e)) return null;
  return Math.round((e - s) / 60000);
}

// Mapeo del estado de AviationStack → etiqueta + color + icono.
// Estados posibles de la API: scheduled, active, landed, cancelled,
// incident, diverted. Añadimos "retrasado" como derivado.
export function describeStatus(flight) {
  const raw = flight?.flight_status || 'scheduled';
  const arr = flight?.arrival || {};
  const delay = delayMinutes(arr.scheduled, arr.estimated);

  switch (raw) {
    case 'landed':
      return { key: 'landed', label: 'Aterrizado', tone: 'green', dot: false };
    case 'active':
      return { key: 'active', label: 'En vuelo', tone: 'cyan', dot: true };
    case 'cancelled':
      return { key: 'cancelled', label: 'Cancelado', tone: 'red', dot: false };
    case 'diverted':
      return { key: 'diverted', label: 'Desviado', tone: 'red', dot: false };
    case 'incident':
      return { key: 'incident', label: 'Incidencia', tone: 'red', dot: false };
    case 'scheduled':
    default:
      if (delay != null && delay >= 15) {
        return { key: 'delayed', label: `Retrasado +${delay}'`, tone: 'amber', dot: false };
      }
      return { key: 'scheduled', label: 'Programado', tone: 'slate', dot: false };
  }
}

// Código de aerolínea ICAO (RYR, TOM...) con fallback a IATA.
export function airlineIcao(flight) {
  return (
    flight?.airline?.icao ||
    flight?.airline?.iata ||
    flight?.flight?.icao?.slice(0, 3) ||
    '???'
  ).toUpperCase();
}

// Número de vuelo IATA (FR1234, LS567...). Fallback al ICAO completo.
export function flightIata(flight) {
  return (flight?.flight?.iata || flight?.flight?.icao || flight?.flight?.number || '—').toUpperCase();
}

// Nombre legible de la aerolínea: el de la API, o el del mapa por ICAO.
export function airlineName(flight) {
  const icao = airlineIcao(flight);
  return flight?.airline?.name || AIRLINE_BY_ICAO[icao] || icao;
}

// Origen: { iata, name }. Usa el nombre de nuestra config si lo tenemos,
// si no el que devuelva la API.
export function originInfo(flight) {
  const dep = flight?.departure || {};
  const iata = (dep.iata || '').toUpperCase();
  const known = AIRPORT_BY_IATA[iata];
  return {
    iata,
    name: known?.name || dep.airport || iata || '—',
    country: known?.country || null,
  };
}
