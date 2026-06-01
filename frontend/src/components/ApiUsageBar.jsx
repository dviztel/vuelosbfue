// Barra de consumo de API: X/100 con color azul → ámbar → rojo.
export default function ApiUsageBar({
  count = 0,
  limit = 100,
  usingServerKey = false,
  onReset,
  onEditKey,
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((count / limit) * 100)) : 0;

  // azul (0-50) · ámbar (51-80) · rojo (81-100)
  let barColor = 'bg-sky-500';
  let textColor = 'text-sky-300';
  if (pct > 80) {
    barColor = 'bg-red-500';
    textColor = 'text-red-300';
  } else if (pct > 50) {
    barColor = 'bg-amber-glow';
    textColor = 'text-amber-glow';
  }

  return (
    <div className="rounded-lg border border-tower-700 bg-tower-900/70 px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
          Consumo API · este mes
        </span>
        <span className={`font-mono text-sm font-bold ${textColor}`}>
          {count}/{limit}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-tower-700">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[11px] text-slate-500">
          {limit - count > 0 ? `${limit - count} requests disponibles` : 'Cupo agotado'}
        </span>
        <button
          onClick={onReset}
          className="text-[11px] font-medium text-slate-400 underline-offset-2 hover:text-amber-glow hover:underline"
        >
          Resetear (mes nuevo)
        </button>
      </div>

      <div className="mt-1.5 flex items-center justify-between border-t border-tower-700/60 pt-1.5">
        <span className="text-[11px] text-slate-500">
          {usingServerKey ? '🔑 Usando key del servidor' : '🔑 Usando tu key'}
        </span>
        <button
          onClick={onEditKey}
          className="text-[11px] font-medium text-slate-400 underline-offset-2 hover:text-amber-glow hover:underline"
        >
          {usingServerKey ? 'Usar mi key' : 'Cambiar key'}
        </button>
      </div>
    </div>
  );
}
