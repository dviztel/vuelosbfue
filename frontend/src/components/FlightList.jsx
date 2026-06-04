import FlightCard from './FlightCard.jsx';

export default function FlightList({ flights, direction, loading }) {
  if (loading && flights.length === 0) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-2xl border border-tower-700 bg-tower-800/50"
          />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    const what = direction === 'departures' ? 'salidas hacia' : 'llegadas desde';
    return (
      <div className="rounded-2xl border border-dashed border-tower-700 bg-tower-800/40 py-12 text-center">
        <div className="text-3xl">{direction === 'departures' ? '🛫' : '🛬'}</div>
        <p className="mt-2 text-sm font-medium text-slate-300">No hay {what} UK/Irlanda</p>
        <p className="mt-1 text-xs text-slate-500">
          en los datos cargados. Pulsa ↻ para consultar de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flights.map((f, i) => (
        <FlightCard
          key={`${f.flight?.iata || f.flight?.icao || 'x'}-${i}`}
          flight={f}
          direction={direction}
        />
      ))}
    </div>
  );
}
