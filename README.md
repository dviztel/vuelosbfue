# ✈️ FUE Border Control

Web app para **control de pasaportes en el aeropuerto de Fuerteventura (FUE)**.
Muestra automáticamente los vuelos de **llegada desde Reino Unido e Irlanda**
(extracomunitarios → requieren control manual), ordenados por hora de llegada,
con horas en zona de Canarias y control del consumo de la API.

```
FUE Border Control/
├── backend/      → proxy Express (llama a AviationStack por HTTP, server-side)
└── frontend/     → React + Vite + Tailwind (PWA instalable)
```

---

## 🚀 Arranque en local (paso a paso)

Necesitas **Node.js 18+** (tienes la v24, perfecto).

### 1. Configurar la API key del backend

1. Entra en `backend/`.
2. Copia el fichero de ejemplo a `.env`:

   **PowerShell:**
   ```powershell
   cd "$env:USERPROFILE\Desktop\Claude Docs\FUE Border Control\backend"
   Copy-Item .env.example .env
   ```

3. Abre `.env` y pega tu clave real de AviationStack:

   ```env
   AVIATIONSTACK_KEY=tu_clave_de_aviationstack_aqui
   PORT=3001
   ARR_IATA=FUE
   MONTHLY_LIMIT=100
   ```

   > 🔑 La key la sacas de tu panel: https://aviationstack.com/dashboard
   > El `.env` está en `.gitignore`: **nunca se sube a git**.

### 2. Arrancar el backend (terminal 1)

```powershell
cd "$env:USERPROFILE\Desktop\Claude Docs\FUE Border Control\backend"
npm install      # solo la primera vez
npm run dev
```

Verás:
```
✈️  FUE Border Control · backend escuchando en http://localhost:3001
   API key: cargada ✓
```

### 3. Arrancar el frontend (terminal 2)

```powershell
cd "$env:USERPROFILE\Desktop\Claude Docs\FUE Border Control\frontend"
npm install      # solo la primera vez
npm run dev
```

Abre **http://localhost:5173** en el navegador (o en el móvil, en la misma
red Wi-Fi, usando la IP de tu PC: `http://192.168.x.x:5173`).

> En desarrollo, Vite redirige automáticamente las llamadas `/api/*` al
> backend en el puerto 3001 (configurado en `vite.config.js`), así que no
> tienes que tocar nada.

---

## 🧠 ¿Por qué un backend proxy?

El plan **gratuito** de AviationStack **solo responde por HTTP, no HTTPS**.
Un frontend servido por HTTPS no puede llamar a HTTP (el navegador lo bloquea
por *mixed content*). Por eso:

```
Navegador (HTTPS)  ──►  Backend Express  ──HTTP──►  AviationStack
       ▲                      │
       └──────  HTTPS  ───────┘
```

El backend también:
- Guarda la **API key** server-side (nunca llega al navegador).
- **Cuenta** los requests usados y los persiste en `backend/usage.json`.
- **Cachea** la última respuesta en `backend/cache.json` para no malgastar
  requests (la carga inicial usa la caché; solo el botón "Actualizar" gasta uno).
- **Auto-resetea** el contador al cambiar de mes (hora de Canarias).

---

## 🎛️ Control de consumo (solo 100 requests/mes)

| Acción | ¿Gasta request? |
|---|---|
| Abrir la app (carga inicial) | **No** si hay caché. Solo la 1ª vez de todas. |
| Botón "Actualizar vuelos" | **Sí** (1). Pide confirmación antes. |
| Auto-refresco cada X min | **Sí** (1 por refresco). Avisa al activarlo. |
| Resetear contador | No. Solo pone el contador a 0. |

La barra de consumo cambia de color: **azul** (0–50) · **ámbar** (51–80) ·
**rojo** (81–100).

---

## ➕ Añadir más aeropuertos UK/Irlanda

Edita `frontend/src/config/airports.js` y añade una línea en `UK_AIRPORTS`
o `IRELAND_AIRPORTS`:

```js
{ iata: 'XXX', name: 'Nombre legible', country: 'UK' },
```

El filtro y los nombres se actualizan solos en toda la app.

---

## ☁️ Deploy (Vercel / Railway)

El backend **debe** seguir existiendo en producción (por el tema HTTP).
Opciones recomendadas:

- **Railway / Render:** despliega `backend/` como servicio Node
  (`npm start`) y `frontend/` como sitio estático. Pon `AVIATIONSTACK_KEY`
  en las variables de entorno del servicio backend. Apunta el frontend al
  backend (en producción, sirve el frontend y proxea `/api` al backend, o
  usa una variable `VITE_API_BASE`).
- **Vercel:** el frontend va perfecto como estático; el backend conviene
  desplegarlo aparte (Railway/Render) porque necesita estado en disco
  (`usage.json` / `cache.json`). Si lo quieres todo en Vercel, habría que
  mover el contador/caché a un almacén persistente (KV/Postgres).

> ⚠️ En producción **no expongas** la key en el frontend bajo ningún concepto.

---

## 📱 PWA (instalable en el móvil)

Está incluida: `manifest.json` + service worker (`public/sw.js`, solo cachea
el "shell", **nunca** los datos de la API). Tras hacer `npm run build` y servir
el sitio por HTTPS, el navegador del móvil ofrecerá "Añadir a pantalla de inicio".
