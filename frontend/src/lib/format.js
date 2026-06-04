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

// Fecha larga legible ("4 de Junio de 2026") en hora de Canarias, con el
// nombre del mes en mayúscula inicial (como en el diseño).
export function toCanaryLongDate(date = new Date()) {
  const s = new Intl.DateTimeFormat('es-ES', {
    timeZone: CANARY_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
  return s.replace(/ de ([a-zà-ÿ]+) de /, (_, mon) => ` de ${mon.charAt(0).toUpperCase()}${mon.slice(1)} de `);
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

// El "lado FUE" del vuelo según la dirección: en llegadas miramos arrival,
// en salidas departure. De ahí sale la hora grande de la tarjeta.
export function fueSide(flight, direction) {
  return direction === 'departures' ? flight?.departure || {} : flight?.arrival || {};
}

// El "otro extremo" (siempre el aeropuerto UK/Irlanda que filtramos): en
// llegadas es el origen (departure), en salidas el destino (arrival).
export function otherSide(flight, direction) {
  return direction === 'departures' ? flight?.arrival || {} : flight?.departure || {};
}

// Mapeo del estado de AviationStack → etiqueta + color + icono.
// Estados posibles de la API: scheduled, active, landed, cancelled,
// incident, diverted. Añadimos "retrasado" como derivado.
// `direction` ajusta la etiqueta (Aterrizado vs Despegado).
export function describeStatus(flight, direction = 'arrivals') {
  const raw = flight?.flight_status || 'scheduled';
  const side = fueSide(flight, direction);
  const delay = delayMinutes(side.scheduled, side.estimated);

  switch (raw) {
    case 'landed':
      return direction === 'departures'
        ? { key: 'landed', label: 'Despegado', tone: 'green', dot: false }
        : { key: 'landed', label: 'Aterrizado', tone: 'green', dot: false };
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

// Número de vuelo en formato ICAO (EXS3130, RYR8042...), como en las pantallas
// del aeropuerto. Si la API no lo trae, lo componemos: ICAO aerolínea + número.
export function flightIcaoCode(flight) {
  const icao = flight?.flight?.icao;
  if (icao) return icao.toUpperCase();
  const num = flight?.flight?.number || (flight?.flight?.iata || '').replace(/^[A-Za-z]+/, '');
  return num ? `${airlineIcao(flight)}${num}` : (flight?.flight?.iata || '—').toUpperCase();
}

// Nombre legible de la aerolínea: el de la API, o el del mapa por ICAO.
export function airlineName(flight) {
  const icao = airlineIcao(flight);
  return flight?.airline?.name || AIRLINE_BY_ICAO[icao] || icao;
}

// Aeropuerto UK/Irlanda del vuelo (origen en llegadas, destino en salidas):
// { iata, city, name, country }. Usa nuestra config si lo tenemos.
export function endpointInfo(flight, direction) {
  const side = otherSide(flight, direction);
  const iata = (side.iata || '').toUpperCase();
  const known = AIRPORT_BY_IATA[iata];
  return {
    iata,
    city: known?.city || side.airport || iata || '—',
    name: known?.name || side.airport || iata || '—',
    country: known?.country || null,
  };
}
