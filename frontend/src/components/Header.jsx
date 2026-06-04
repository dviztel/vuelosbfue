import { toCanaryDateTime } from '../lib/format.js';

// Cabecera estilo panel de aeropuerto: ⚙ ajustes · título · ↻ + badge FUE.
export default function Header({
  onSettings,
  onRefresh,
  refreshing,
  refreshDisabled,
  fetchedAt,
  cached,
  count,
}) {
  return (
    <header className="border-b border-tower-700/70 pb-3">
      <div className="flex items-center gap-2">
        <button
          onClick={onSettings}
          className="shrink-0 rounded-lg border border-tower-700 bg-tower-800/60 px-2.5 py-2 text-base text-slate-300 transition-colors hover:border-amber-glow hover:text-amber-glow"
          title="Ajustes · API key"
          aria-label="Ajustes · API key"
        >
          ⚙
        </button>

        <h1 className="flex-1 text-center text-lg font-bold tracking-tight text-slate-50">
          No Schengen Flights
        </h1>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onRefresh}
            disabled={refreshDisabled}
            className="rounded-lg border border-tower-700 bg-tower-800/60 px-2.5 py-2 text-base text-slate-300 transition-colors hover:border-amber-glow hover:text-amber-glow disabled:cursor-not-allowed disabled:opacity-40"
            title="Actualizar vuelos (gasta 2 requests)"
            aria-label="Actualizar vuelos"
          >
            <span className={refreshing ? 'inline-block animate-spin' : 'inline-block'}>↻</span>
          </button>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-bold tracking-wide text-slate-800">
            FUE
          </span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {count} vuelo{count === 1 ? '' : 's'}
        </span>
        {fetchedAt && (
          <>
            <span className="text-slate-700">·</span>
            <span>
              datos {cached ? 'en caché' : 'actualizados'}: {toCanaryDateTime(fetchedAt)}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
