import { toCanaryDateTime } from '../lib/format.js';

export default function Header({ fetchedAt, cached, count, onSettings }) {
  return (
    <header className="border-b border-tower-700/70 pb-3">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl" aria-hidden>
          🛂
        </span>
        <div className="flex-1">
          <h1 className="text-lg font-bold leading-none tracking-tight text-slate-50">
            FUE <span className="text-amber-glow">Border Control</span>
          </h1>
          <p className="mt-0.5 text-[11px] uppercase tracking-widest text-slate-500">
            Llegadas UK · Irlanda → control de pasaportes
          </p>
        </div>
        <button
          onClick={onSettings}
          className="shrink-0 rounded-lg border border-tower-700 bg-tower-900/60 px-2.5 py-2 text-base text-slate-300 transition-colors hover:border-amber-glow hover:text-amber-glow"
          title="Ajustes · API key"
          aria-label="Ajustes · API key"
        >
          ⚙
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
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
