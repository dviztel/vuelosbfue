// =============================================================================
//  Configuración de aeropuertos UK / Irlanda (extracomunitarios → control manual)
// -----------------------------------------------------------------------------
//  Para AÑADIR un aeropuerto: añade una línea { iata, city, name, country } en
//  el bloque que corresponda. El filtro, la ciudad de la tarjeta y los nombres
//  legibles se actualizan solos en toda la app.
//   - city: lo que se ve grande en la tarjeta  → "Londres (LGW)"
//   - name: nombre completo del aeropuerto      → "Londres Gatwick"
// =============================================================================

export const UK_AIRPORTS = [
  { iata: 'LGW', city: 'Londres', name: 'Londres Gatwick', country: 'UK' },
  { iata: 'LHR', city: 'Londres', name: 'Londres Heathrow', country: 'UK' },
  { iata: 'STN', city: 'Londres', name: 'Londres Stansted', country: 'UK' },
  { iata: 'LTN', city: 'Londres', name: 'Londres Luton', country: 'UK' },
  { iata: 'MAN', city: 'Mánchester', name: 'Mánchester', country: 'UK' },
  { iata: 'BHX', city: 'Birmingham', name: 'Birmingham', country: 'UK' },
  { iata: 'BRS', city: 'Bristol', name: 'Bristol', country: 'UK' },
  { iata: 'EDI', city: 'Edimburgo', name: 'Edimburgo', country: 'UK' },
  { iata: 'GLA', city: 'Glasgow', name: 'Glasgow', country: 'UK' },
  { iata: 'NCL', city: 'Newcastle', name: 'Newcastle', country: 'UK' },
  { iata: 'EMA', city: 'East Midlands', name: 'East Midlands', country: 'UK' },
  { iata: 'LBA', city: 'Leeds', name: 'Leeds Bradford', country: 'UK' },
  { iata: 'ABZ', city: 'Aberdeen', name: 'Aberdeen', country: 'UK' },
  { iata: 'BFS', city: 'Belfast', name: 'Belfast Intl.', country: 'UK' },
  { iata: 'CWL', city: 'Cardiff', name: 'Cardiff', country: 'UK' },
  { iata: 'LPL', city: 'Liverpool', name: 'Liverpool', country: 'UK' },
  { iata: 'BOH', city: 'Bournemouth', name: 'Bournemouth', country: 'UK' },
  { iata: 'SOU', city: 'Southampton', name: 'Southampton', country: 'UK' },
  { iata: 'NWI', city: 'Norwich', name: 'Norwich', country: 'UK' },
  { iata: 'INV', city: 'Inverness', name: 'Inverness', country: 'UK' },
  { iata: 'DSA', city: 'Doncaster', name: 'Doncaster Sheffield', country: 'UK' },
  { iata: 'MME', city: 'Teesside', name: 'Teesside', country: 'UK' },
  { iata: 'EXT', city: 'Exeter', name: 'Exeter', country: 'UK' },
];

export const IRELAND_AIRPORTS = [
  { iata: 'DUB', city: 'Dublín', name: 'Dublín', country: 'IE' },
  { iata: 'ORK', city: 'Cork', name: 'Cork', country: 'IE' },
  { iata: 'SNN', city: 'Shannon', name: 'Shannon', country: 'IE' },
];

export const MONITORED_AIRPORTS = [...UK_AIRPORTS, ...IRELAND_AIRPORTS];

// Set de códigos IATA para filtrar rápido por origen/destino.
export const MONITORED_IATA = new Set(MONITORED_AIRPORTS.map((a) => a.iata));

// Mapa IATA → { city, name, country } para mostrar nombre legible.
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
