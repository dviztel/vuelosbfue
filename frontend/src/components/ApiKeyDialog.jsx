import { useEffect, useState } from 'react';

// Diálogo para que CADA usuario introduzca su propia API key de AviationStack.
// La key se guarda en su navegador (localStorage) y se envía al backend.
export default function ApiKeyDialog({
  open,
  currentKey = '',
  hasServerKey = false,
  onSave,
  onClear,
  onCancel,
}) {
  const [value, setValue] = useState(currentKey);
  const [show, setShow] = useState(false);

  // Resincroniza el input cada vez que se abre.
  useEffect(() => {
    if (open) {
      setValue(currentKey);
      setShow(false);
    }
  }, [open, currentKey]);

  if (!open) return null;

  const clean = value.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-tower-600 bg-tower-800 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-100">Tu API key de AviationStack</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Introduce tu propia clave. Se guarda solo en este dispositivo y se usa
          tu cupo mensual (100 requests), no el de otra persona.
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          La consigues gratis en{' '}
          <a
            href="https://aviationstack.com/dashboard"
            target="_blank"
            rel="noreferrer"
            className="text-amber-glow underline-offset-2 hover:underline"
          >
            aviationstack.com/dashboard
          </a>
          .
        </p>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <input
              type={show ? 'text' : 'password'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Pega aquí tu API key…"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-lg border border-tower-600 bg-tower-900 px-3 py-2.5 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-amber-glow"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="shrink-0 rounded-lg border border-tower-600 bg-tower-700/50 px-2.5 py-2.5 text-xs text-slate-300 hover:bg-tower-700"
              title={show ? 'Ocultar' : 'Mostrar'}
            >
              {show ? '🙈' : '👁'}
            </button>
          </div>

          {hasServerKey && (
            <p className="mt-2 text-[11px] text-slate-500">
              Si lo dejas vacío y guardas, se usará la key del servidor por defecto.
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-tower-600 bg-tower-700/50 py-2.5 text-sm font-medium text-slate-200 hover:bg-tower-700"
          >
            Cancelar
          </button>
          {currentKey && (
            <button
              onClick={onClear}
              className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20"
              title="Borrar mi key de este dispositivo"
            >
              Borrar
            </button>
          )}
          <button
            onClick={() => onSave(clean)}
            className="flex-1 rounded-lg bg-amber-glow py-2.5 text-sm font-bold text-tower-950 transition-colors hover:bg-amber-400"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
