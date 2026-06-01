import {
  toCanaryTime,
  timesDiffer,
  describeStatus,
  airlineIcao,
  flightIata,
  airlineName,
  originInfo,
} from '../lib/format.js';

const TONE_STYLES = {
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  amber: 'bg-amber-glow/15 text-amber-glow border-amber-glow/40',
  red: 'bg-red-500/15 text-red-300 border-red-500/30',
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

export default function FlightCard({ flight }) {
  const status = describeStatus(flight);
  const arr = flight.arrival || {};
  const origin = originInfo(flight);

  const scheduled = toCanaryTime(arr.scheduled);
  const estimated = toCanaryTime(arr.estimated);
  const showEstimated = timesDiffer(arr.scheduled, arr.estimated);

  const icao = airlineIcao(flight);
  const iata = flightIata(flight);

  return (
    <article className="rounded-xl border border-tower-700 bg-tower-900/70 p-4 transition-colors hover:border-tower-600">
      <div className="flex items-start justify-between gap-3">
        {/* Códigos de vuelo (monospace, como las pantallas de AENA) */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-lg font-bold tracking-wider text-amber-glow">{icao}</span>
            <span className="text-lg font-bold tracking-wider text-slate-100">{iata}</span>
          </div>
          <div className="mt-0.5 truncate text-sm text-slate-400">{airlineName(flight)}</div>
        </div>

        {/* Estado */}
        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
            TONE_STYLES[status.tone] || TONE_STYLES.slate
          }`}
        >
          {status.dot && (
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-glow" />
          )}
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        {/* Origen */}
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-slate-500">Origen</div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-base font-bold text-slate-100">
              {origin.iata || '—'}
            </span>
            {origin.country && (
              <span className="rounded bg-tower-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                {origin.country}
              </span>
            )}
          </div>
          <div className="truncate text-sm text-slate-400">{origin.name}</div>
        </div>

        {/* Horas (zona Canarias) */}
        <div className="shrink-0 text-right">
          <div className="text-[11px] uppercase tracking-widest text-slate-500">
            Llegada (Canarias)
          </div>
          <div className="font-mono text-2xl font-bold leading-tight text-slate-100">
            {scheduled || '--:--'}
          </div>
          {showEstimated && estimated && (
            <div className="font-mono text-sm font-semibold text-amber-glow">
              est. {estimated}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
