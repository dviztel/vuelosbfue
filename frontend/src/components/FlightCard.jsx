import { useState } from 'react';
import {
  toCanaryTime,
  timesDiffer,
  describeStatus,
  airlineIcao,
  flightIata,
  flightIcaoCode,
  airlineName,
  fueSide,
  endpointInfo,
} from '../lib/format.js';

const TONE_STYLES = {
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  amber: 'bg-amber-glow/15 text-amber-glow border-amber-glow/40',
  red: 'bg-red-500/15 text-red-300 border-red-500/30',
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  gray: 'bg-slate-700/50 text-slate-400 border-slate-600/50', // aterrizado/despegado
};

// Etiqueta de estado del vuelo (se muestra junto al nº de vuelo y al expandir).
function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
        TONE_STYLES[status.tone] || TONE_STYLES.slate
      }`}
    >
      {status.dot && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-glow" />}
      {status.label}
    </span>
  );
}

// `direction`: 'arrivals' | 'departures'.
//  - arrivals  → mostramos el ORIGEN (UK/IRL) y la hora de LLEGADA a FUE.
//  - departures→ mostramos el DESTINO (UK/IRL) y la hora de SALIDA de FUE.
export default function FlightCard({ flight, direction }) {
  const [open, setOpen] = useState(false);

  const ep = endpointInfo(flight, direction); // aeropuerto UK/Irlanda
  const side = fueSide(flight, direction); // lado FUE (de aquí sale la hora)
  const status = describeStatus(flight, direction);

  const scheduled = toCanaryTime(side.scheduled);
  const estimated = toCanaryTime(side.estimated);
  const showEstimated = timesDiffer(side.scheduled, side.estimated);

  const icao = airlineIcao(flight);
  const iata = flightIata(flight);
  const flightCode = flightIcaoCode(flight); // EXS3130, RYR8042...
  const timeLabel = direction === 'departures' ? 'Salida' : 'Llegada';

  return (
    <article className="overflow-hidden rounded-2xl border border-tower-700 bg-tower-800/70 transition-colors hover:border-tower-600">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        {/* Ciudad (código) + número de vuelo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className="truncate text-base font-semibold text-slate-50">{ep.city}</span>
            <span className="shrink-0 font-mono text-xs text-slate-400">({ep.iata})</span>
            {ep.country && (
              <span className="shrink-0 rounded bg-tower-700 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                {ep.country}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-slate-400">{flightCode}</span>
            {status && <StatusBadge status={status} />}
          </div>
        </div>

        {/* Hora del evento en FUE (zona Canarias) */}
        <div className="shrink-0 text-right">
          <div className="font-mono text-xl font-bold leading-tight text-slate-50">
            {scheduled || '--:--'}
          </div>
          {showEstimated && estimated && (
            <div className="font-mono text-xs font-semibold text-amber-glow">est. {estimated}</div>
          )}
        </div>

        {/* Botón expandir (círculo claro, como el diseño) */}
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-xl font-light leading-none text-slate-800 shadow-sm transition-transform"
          aria-hidden
        >
          {open ? '×' : '+'}
        </span>
      </button>

      {/* Detalle desplegable */}
      {open && (
        <div className="border-t border-tower-700/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm text-slate-300">{airlineName(flight)}</div>
              <div className="mt-0.5 font-mono text-xs text-slate-500">
                {icao} · {iata}
              </div>
            </div>
            {status && <StatusBadge status={status} />}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="uppercase tracking-widest text-slate-500">
              {ep.name}
            </span>
            <span className="text-slate-400">
              {timeLabel}: <span className="font-mono text-slate-200">{scheduled || '--:--'}</span>
              {showEstimated && estimated && (
                <>
                  {' '}
                  → <span className="font-mono text-amber-glow">{estimated}</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
