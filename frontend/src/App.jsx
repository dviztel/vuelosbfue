import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import ApiUsageBar from './components/ApiUsageBar.jsx';
import FlightList from './components/FlightList.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import ApiKeyDialog from './components/ApiKeyDialog.jsx';
import {
  getFlights,
  refreshFlights,
  resetUsage,
  getHealth,
  getApiKey,
  setApiKey,
} from './lib/api.js';
import { MONITORED_IATA } from './config/airports.js';

// Intervalos disponibles para el auto-refresh (en minutos).
const AUTO_INTERVALS = [15, 30, 60];

export default function App() {
  const [raw, setRaw] = useState([]); // todos los arrivals que devuelve la API
  const [fetchedAt, setFetchedAt] = useState(null);
  const [cached, setCached] = useState(false);
  const [usage, setUsage] = useState({ count: 0, limit: 100 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [autoMinutes, setAutoMinutes] = useState(0); // 0 = desactivado
  const [dialog, setDialog] = useState(null); // { type: 'refresh' | 'reset' | 'auto' }

  // --- API key por usuario -------------------------------------------------
  const [apiKey, setApiKeyState] = useState(getApiKey()); // key guardada (este equipo)
  const [hasServerKey, setHasServerKey] = useState(false); // fallback en el .env
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const autoTimer = useRef(null);

  // -------------------------------------------------------------------------
  //  Filtrado: SOLO orígenes UK/Irlanda, ordenados por hora de llegada.
  // -------------------------------------------------------------------------
  const flights = useMemo(() => {
    return raw
      .filter((f) => {
        const dep = (f?.departure?.iata || '').toUpperCase();
        return MONITORED_IATA.has(dep);
      })
      .sort((a, b) => {
        const ta = new Date(a?.arrival?.scheduled || 0).getTime();
        const tb = new Date(b?.arrival?.scheduled || 0).getTime();
        return ta - tb;
      });
  }, [raw]);

  // -------------------------------------------------------------------------
  //  Carga / refresco
  // -------------------------------------------------------------------------
  function applyResponse(data) {
    setRaw(Array.isArray(data.flights?.data) ? data.flights.data : []);
    setFetchedAt(data.fetchedAt || null);
    setCached(Boolean(data.cached));
    if (data.usage) setUsage(data.usage);
    setError(null);
  }

  // Carga inicial: usa caché del backend (NO gasta request salvo la 1ª vez).
  async function initialLoad() {
    setLoading(true);
    try {
      const data = await getFlights();
      applyResponse(data);
    } catch (e) {
      setError(e.message);
      if (e.usage) setUsage(e.usage);
    } finally {
      setLoading(false);
    }
  }

  // Refresco real: GASTA 1 request.
  async function doRefresh() {
    setLoading(true);
    try {
      const data = await refreshFlights();
      applyResponse(data);
    } catch (e) {
      setError(e.message);
      if (e.usage) setUsage(e.usage);
    } finally {
      setLoading(false);
    }
  }

  async function doReset() {
    try {
      const u = await resetUsage();
      setUsage(u);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    // Comprobamos si el servidor tiene key de fallback. Si NO hay ni key
    // local ni de servidor, forzamos el diálogo para que el usuario meta
    // la suya antes de poder traer vuelos.
    (async () => {
      let serverKey = false;
      try {
        const health = await getHealth();
        serverKey = Boolean(health?.hasServerKey);
        setHasServerKey(serverKey);
      } catch {
        /* si /health falla, seguimos: initialLoad mostrará el error */
      }
      if (!getApiKey() && !serverKey) {
        setShowKeyDialog(true);
      }
      await initialLoad();
    })();

    // Registro del service worker (PWA) solo en producción.
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  //  Guardar / borrar la API key del usuario
  // -------------------------------------------------------------------------
  function handleSaveKey(key) {
    setApiKey(key); // persiste en localStorage (vacío = borra)
    setApiKeyState(key);
    setShowKeyDialog(false);
    setError(null);
    // Recargamos con la nueva key (usa caché, no gasta request).
    initialLoad();
  }

  function handleClearKey() {
    setApiKey('');
    setApiKeyState('');
    setShowKeyDialog(false);
    setError(null);
    initialLoad();
  }

  // -------------------------------------------------------------------------
  //  Auto-refresh opcional
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    if (autoMinutes > 0) {
      autoTimer.current = setInterval(() => {
        // El auto-refresh gasta requests; por eso avisamos al activarlo.
        doRefresh();
      }, autoMinutes * 60 * 1000);
    }
    return () => autoTimer.current && clearInterval(autoTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoMinutes]);

  const cupoAgotado = usage.count >= usage.limit;

  // -------------------------------------------------------------------------
  //  Handlers de los diálogos de confirmación
  // -------------------------------------------------------------------------
  function handleConfirm() {
    const type = dialog?.type;
    setDialog(null);
    if (type === 'refresh') doRefresh();
    else if (type === 'reset') doReset();
    else if (type === 'auto') setAutoMinutes(dialog.minutes);
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-4 px-4 py-5">
      <Header
        fetchedAt={fetchedAt}
        cached={cached}
        count={flights.length}
        onSettings={() => setShowKeyDialog(true)}
      />

      <ApiUsageBar
        count={usage.count}
        limit={usage.limit}
        usingServerKey={usage.usingServerKey}
        onReset={() => setDialog({ type: 'reset' })}
        onEditKey={() => setShowKeyDialog(true)}
      />

      {/* Botón de actualización manual */}
      <button
        onClick={() => setDialog({ type: 'refresh' })}
        disabled={loading || cupoAgotado}
        className="flex items-center justify-center gap-2 rounded-xl bg-amber-glow py-3 text-sm font-bold text-tower-950 shadow-glow transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? (
          <>
            <Spinner /> Consultando…
          </>
        ) : cupoAgotado ? (
          'Cupo mensual agotado'
        ) : (
          <>↻ Actualizar vuelos (gasta 1 request)</>
        )}
      </button>

      {/* Auto-refresh opcional */}
      <div className="flex items-center justify-between rounded-lg border border-tower-700 bg-tower-900/50 px-3 py-2">
        <span className="text-xs text-slate-400">Auto-refresco</span>
        <div className="flex gap-1">
          <IntervalButton active={autoMinutes === 0} onClick={() => setAutoMinutes(0)}>
            Off
          </IntervalButton>
          {AUTO_INTERVALS.map((m) => (
            <IntervalButton
              key={m}
              active={autoMinutes === m}
              onClick={() => setDialog({ type: 'auto', minutes: m })}
            >
              {m}m
            </IntervalButton>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      <FlightList flights={flights} loading={loading} />

      <footer className="mt-auto pt-4 text-center text-[10px] text-slate-600">
        Horas en zona Atlantic/Canary · datos vía AviationStack (proxy backend)
      </footer>

      {/* Diálogos de confirmación */}
      <ConfirmDialog
        open={dialog?.type === 'refresh'}
        title="¿Actualizar vuelos?"
        message={`Esto consume 1 request de tu cupo mensual (${usage.count}/${usage.limit} usados). ¿Continuar?`}
        confirmLabel="Sí, actualizar"
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog?.type === 'reset'}
        title="¿Resetear el contador?"
        message="Pon el contador de requests a 0. Hazlo solo al empezar un mes nuevo de cupo."
        confirmLabel="Resetear"
        tone="red"
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        open={dialog?.type === 'auto'}
        title="¿Activar auto-refresco?"
        message={`Se actualizará automáticamente cada ${dialog?.minutes} min. OJO: cada actualización consume 1 request del cupo mensual.`}
        confirmLabel="Activar"
        onConfirm={handleConfirm}
        onCancel={() => setDialog(null)}
      />

      {/* Configuración de la API key del usuario */}
      <ApiKeyDialog
        open={showKeyDialog}
        currentKey={apiKey}
        hasServerKey={hasServerKey}
        onSave={handleSaveKey}
        onClear={handleClearKey}
        onCancel={() => setShowKeyDialog(false)}
      />
    </div>
  );
}

function IntervalButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors ${
        active
          ? 'bg-amber-glow text-tower-950'
          : 'bg-tower-700/60 text-slate-300 hover:bg-tower-700'
      }`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}
