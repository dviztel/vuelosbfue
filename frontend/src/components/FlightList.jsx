import FlightCard from './FlightCard.jsx';

export default function FlightList({ flights, loading }) {
  if (loading && flights.length === 0) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-xl border border-tower-700 bg-tower-900/50"
          />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-tower-700 bg-tower-900/40 py-12 text-center">
        <div className="text-3xl">🛬</div>
        <p className="mt-2 text-sm font-medium text-slate-300">
          No hay llegadas desde UK/Irlanda
        </p>
        <p className="mt-1 text-xs text-slate-500">
          en los datos cargados. Pulsa actualizar para consultar de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {flights.map((f, i) => (
        <FlightCard key={`${f.flight?.iata || f.flight?.icao || 'x'}-${i}`} flight={f} />
      ))}
    </div>
  );
}
