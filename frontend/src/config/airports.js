// =============================================================================
//  Configuración de aeropuertos UK / Irlanda (extracomunitarios → control manual)
// -----------------------------------------------------------------------------
//  Para AÑADIR un aeropuerto: añade una línea { iata, name, country } en
//  el bloque que corresponda. El filtro y los nombres legibles se actualizan
//  solos en toda la app.
// =============================================================================

export const UK_AIRPORTS = [
  { iata: 'LGW', name: 'Londres Gatwick', country: 'UK' },
  { iata: 'LHR', name: 'Londres Heathrow', country: 'UK' },
  { iata: 'STN', name: 'Londres Stansted', country: 'UK' },
  { iata: 'LTN', name: 'Londres Luton', country: 'UK' },
  { iata: 'MAN', name: 'Mánchester', country: 'UK' },
  { iata: 'BHX', name: 'Birmingham', country: 'UK' },
  { iata: 'BRS', name: 'Bristol', country: 'UK' },
  { iata: 'EDI', name: 'Edimburgo', country: 'UK' },
  { iata: 'GLA', name: 'Glasgow', country: 'UK' },
  { iata: 'NCL', name: 'Newcastle', country: 'UK' },
  { iata: 'EMA', name: 'East Midlands', country: 'UK' },
  { iata: 'LBA', name: 'Leeds Bradford', country: 'UK' },
  { iata: 'ABZ', name: 'Aberdeen', country: 'UK' },
  { iata: 'BFS', name: 'Belfast Intl.', country: 'UK' },
  { iata: 'CWL', name: 'Cardiff', country: 'UK' },
  { iata: 'LPL', name: 'Liverpool', country: 'UK' },
  { iata: 'BOH', name: 'Bournemouth', country: 'UK' },
  { iata: 'SOU', name: 'Southampton', country: 'UK' },
  { iata: 'NWI', name: 'Norwich', country: 'UK' },
  { iata: 'INV', name: 'Inverness', country: 'UK' },
  { iata: 'DSA', name: 'Doncaster Sheffield', country: 'UK' },
  { iata: 'MME', name: 'Teesside', country: 'UK' },
  { iata: 'EXT', name: 'Exeter', country: 'UK' },
];

export const IRELAND_AIRPORTS = [
  { iata: 'DUB', name: 'Dublín', country: 'IE' },
  { iata: 'ORK', name: 'Cork', country: 'IE' },
  { iata: 'SNN', name: 'Shannon', country: 'IE' },
];

export const MONITORED_AIRPORTS = [...UK_AIRPORTS, ...IRELAND_AIRPORTS];

// Set de códigos IATA para filtrar rápido por origen.
export const MONITORED_IATA = new Set(MONITORED_AIRPORTS.map((a) => a.iata));

// Mapa IATA → { name, country } para mostrar nombre legible.
export const AIRPORT_BY_IATA = MONITORED_AIRPORTS.reduce((acc, a) => {
  acc[a.iata] = a;
  return acc;
}, {});

// Nombres legibles de aerolíneas frecuentes por ICAO (la API a veces no
// devuelve airline.name; aquí garantizamos un nombre presentable).
export const AIRLINE_BY_ICAO = {
  RYR: 'Ryanair',
  TOM: 'TUI Airways',
  EXS: 'Jet2',
  BAW: 'British Airways',
  EIN: 'Aer Lingus',
  EZY: 'easyJet',
  EZS: 'easyJet Switzerland',
  TCX: 'Thomas Cook',
  LOG: 'Loganair',
  WUK: 'Wizz Air UK',
};
