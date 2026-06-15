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
import { toCanaryLongDate, canaryDateKey, canaryTodayKey } from './lib/format.js';

// Intervalos disponibles para el auto-refresh (en minutos).
const AUTO_INTERVALS = [15, 30, 60];

export default function App() {
  const [arrivalsRaw, setArrivalsRaw] = useState([]); // vuelos que LLEGAN a FUE
  const [departuresRaw, setDeparturesRaw] = useState([]); // vuelos que SALEN de FUE
  const [tab, setTab] = useState('departures'); // 'departures' | 'arrivals'

  const [fetchedAt, setFetchedAt] = useState(null);
  const [cached, setCached] = useState(false);
  const [usage, setUsage] = useState({ count: 0, limit: 100 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [autoMinutes, setAutoMinutes] = useState(0); // 0 = desactivado
  const [dialog, setDialog] = useState(null); // { type: 'refresh' | 'reset' | 'auto' }

  // --- API key por usuario -------------------------------------------------
  const [apiKey, setApiKeyState] = useState(getApiKey());
  const [hasServerKey, setHasServerKey] = useState(false);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const autoTimer = useRef(null);

  // -------------------------------------------------------------------------
  //  Filtrado: SOLO el extremo UK/Irlanda, ordenado por la hora en FUE.
  //   - Llegadas: filtra por ORIGEN (departure), ordena por hora de llegada.
  //   - Salidas:  filtra por DESTINO (arrival),  ordena por hora de salida.
  // -------------------------------------------------------------------------
  const flights = useMemo(() => {
    const isDep = tab === 'departures';
    const raw = isDep ? departuresRaw : arrivalsRaw;
    const todayKey = canaryTodayKey();
    return raw
      .filter((f) => {
        // 1) Solo el extremo UK/Irlanda (origen en llegadas, destino en salidas).
        const otherIata = (
          (isDep ? f?.arrival?.iata : f?.departure?.iata) || ''
        ).toUpperCase();
        if (!MONITORED_IATA.has(otherIata)) return false;
        // 2) Solo vuelos cuyo evento en FUE es HOY (hora de Canarias). El plan
        //    gratuito de AviationStack no filtra por fecha y mezcla varios días;
        //    aquí nos quedamos con TODO el día de hoy (también los ya pasados).
        const sched = (isDep ? f?.departure : f?.arrival)?.scheduled;
        return canaryDateKey(sched) === todayKey;
      })
      .sort((a, b) => {
        const ta = new Date((isDep ? a?.departure : a?.arrival)?.scheduled || 0).getTime();
        const tb = new Date((isDep ? b?.departure : b?.arrival)?.scheduled || 0).getTime();
        return ta - tb;
      });
  }, [arrivalsRaw, departuresRaw, tab]);

  // -------------------------------------------------------------------------
  //  Carga / refresco
  // -------------------------------------------------------------------------
  function applyResponse(data) {
    setArrivalsRaw(Array.isArray(data.arrivals) ? data.arrivals : []);
    setDeparturesRaw(Array.isArray(data.departures) ? data.departures : []);
    setFetchedAt(data.fetchedAt || null);
    setCached(Boolean(data.cached));
    if (data.usage) setUsage(data.usage);
    setError(null);
  }

  // Carga inicial: usa caché del dispositivo (NO gasta salvo la 1ª vez).
  async function initialLoad() {
    setLoading(true);
    try {
      applyResponse(await getFlights());
    } catch (e) {
      setError(e.message);
      if (e.usage) setUsage(e.usage);
    } finally {
      setLoading(false);
    }
  }

  // Refresco real: GASTA hasta 2 requests (llegadas + salidas).
  async function doRefresh() {
    setLoading(true);
    try {
      applyResponse(await refreshFlights());
    } catch (e) {
      setError(e.message);
      if (e.usage) setUsage(e.usage);
    } finally {
      setLoading(false);
    }
  }

  async function doReset() {
    try {
      setUsage(await resetUsage());
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    (async () => {
      let serverKey = false;
      try {
        const health = await getHealth();
        serverKey = Boolean(health?.hasServerKey);
        setHasServerKey(serverKey);
      } catch {
        /* si /health falla, seguimos */
      }
      if (!getApiKey() && !serverKey) setShowKeyDialog(true);
      await initialLoad();
    })();

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
      // Cuando un SW nuevo toma el control, recargar UNA vez para usar ya la
      // versión nueva (evita quedarse mostrando una versión vieja en blanco).
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------------------------------------------------------------------------
  //  Guardar / borrar la API key del usuario
  // -------------------------------------------------------------------------
  function handleSaveKey(key) {
    setApiKey(key);
    setApiKeyState(key);
    setShowKeyDialog(false);
    setError(null);
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
      autoTimer.current = setInterval(() => doRefresh(), autoMinutes * 60 * 1000);
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
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-3 px-4 py-5">
      <Header
        onSettings={() => setShowKeyDialog(true)}
        onRefresh={() => setDialog({ type: 'refresh' })}
        refreshing={loading}
        refreshDisabled={loading || cupoAgotado}
        fetchedAt={fetchedAt}
        cached={cached}
        count={flights.length}
      />

      {/* Pestañas Salidas / Llegadas */}
      <div className="grid grid-cols-2 gap-1 rounded-full border border-tower-700 bg-tower-900/60 p-1">
        <TabButton active={tab === 'departures'} onClick={() => setTab('departures')}>
          Salidas
        </TabButton>
        <TabButton active={tab === 'arrivals'} onClick={() => setTab('arrivals')}>
          Llegadas
        </TabButton>
      </div>

      {/* Barra de fecha */}
      <div className="flex items-center justify-between rounded-xl bg-amber-glow px-4 py-2.5 text-tower-950">
        <span className="text-sm font-bold">Hoy</span>
        <span className="text-sm font-semibold">{toCanaryLongDate()}</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          ⚠️ {error}
        </div>
      )}

      <FlightList flights={flights} direction={tab} loading={loading} />

      {/* Controles de API (consumo + auto-refresco) */}
      <ApiUsageBar
        count={usage.count}
        limit={usage.limit}
        usingServerKey={usage.usingServerKey}
        onReset={() => setDialog({ type: 'reset' })}
        onEditKey={() => setShowKeyDialog(true)}
      />

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

      <footer className="mt-auto pt-2 text-center text-[10px] text-slate-600">
        Horas en zona Atlantic/Canary · datos vía AviationStack · solo vuelos de hoy
      </footer>

      {/* Diálogos de confirmación */}
      <ConfirmDialog
        open={dialog?.type === 'refresh'}
        title="¿Actualizar vuelos?"
        message={`⚠️ Trae TODOS los vuelos de hoy (llegadas + salidas, en varias páginas). Gasta entre 2 y 6 requests de tu cupo mensual (llevas ${usage.count}/${usage.limit}). ¿Continuar?`}
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
        message={`Se actualizará cada ${dialog?.minutes} min. ⚠️ OJO: cada actualización gasta entre 2 y 6 requests (trae todas las páginas del día) de tu cupo de 100/mes → con auto-refresco el cupo se agota rápido.`}
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

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full py-2 text-sm font-semibold transition-colors ${
        active ? 'bg-amber-glow text-tower-950 shadow-glow' : 'text-slate-300 hover:text-slate-100'
      }`}
    >
      {children}
    </button>
  );
}

function IntervalButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors ${
        active ? 'bg-amber-glow text-tower-950' : 'bg-tower-700/60 text-slate-300 hover:bg-tower-700'
      }`}
    >
      {children}
    </button>
  );
}
