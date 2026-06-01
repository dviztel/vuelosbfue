// Diálogo modal de confirmación. Se usa antes de gastar un request de la API
// (excepto en la primera carga) y antes de resetear el contador.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'amber',
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClasses =
    tone === 'red'
      ? 'bg-red-500 hover:bg-red-400 text-white'
      : 'bg-amber-glow hover:bg-amber-400 text-tower-950';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-tower-600 bg-tower-800 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{message}</p>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-tower-600 bg-tower-700/50 py-2.5 text-sm font-medium text-slate-200 hover:bg-tower-700"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors ${confirmClasses}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
