# ✈️ No Schengen Flights · FUE Border Control

Web app para el **control de pasaportes en el aeropuerto de Fuerteventura (FUE)**.
Muestra los vuelos **no-Schengen** (Reino Unido e Irlanda → control manual)
de **hoy**, en dos pestañas:

- **Salidas** — vuelos que SALEN de FUE hacia UK/Irlanda.
- **Llegadas** — vuelos que LLEGAN a FUE desde UK/Irlanda.

Horas siempre en **zona de Canarias**, ordenadas de más temprano a más tarde,
con el **estado** de cada vuelo (En tierra, En vuelo, Aterrizado/Despegado,
Retrasado, Cancelado) y control del consumo de la API (100 req/mes).

```
FUE Border Control/
└── frontend/   → React + Vite + Tailwind (PWA) + función serverless en api/
```

> No hay carpeta `backend/`: el único trozo de servidor es la función
> serverless `frontend/api/flights.js` (un proxy HTTP→HTTPS sin estado). Todo
> lo demás (API key, contador, caché) vive en el navegador de cada usuario.

---

## 🚀 Arranque en local (un solo comando)

Necesitas **Node.js 18+**.

```powershell
cd "$env:USERPROFILE\Desktop\Claude Docs\FUE Border Control\frontend"
npm install      # solo la primera vez
npm run dev
```

Abre **http://localhost:5173**. La primera vez te pedirá tu **API key de
AviationStack** (botón ⚙): pégala y se guarda **solo en este dispositivo**.

> El mismo `npm run dev` sirve la web **y** la API local (la función
> `api/flights.js` se monta como middleware de Vite). No hace falta un segundo
> proceso. En producción, esa función la ejecuta Vercel.

🔑 La key se saca gratis en https://aviationstack.com/dashboard

---

## 🧠 ¿Por qué una función serverless?

El plan **gratuito** de AviationStack **solo responde por HTTP, no HTTPS**.
Un frontend en HTTPS no puede llamar a HTTP (el navegador lo bloquea por
*mixed content*). La función `api/flights.js` llama por HTTP server-side y
devuelve los datos por HTTPS:

```
Navegador (HTTPS)  ──►  /api/flights (Vercel)  ──HTTP──►  AviationStack
       ▲                        │
       └─────────  HTTPS  ──────┘
```

La función es **stateless**. El resto vive en el navegador (localStorage):

- **API key** de cada usuario (cada persona la suya, en SU dispositivo).
- **Contador** de consumo (100 req/mes), por key y por dispositivo.
- **Caché** de la última respuesta (abrir la app NO gasta requests).

---

## 🎛️ Control de consumo (100 requests/mes por key)

| Acción | ¿Gasta request? |
|---|---|
| Abrir la app | **No** (usa la caché del dispositivo). |
| Botón "Actualizar" | **Sí (2)**: trae llegadas + salidas. Pide confirmación. |
| Auto-refresco cada X min | **Sí (2 por refresco)**. Avisa al activarlo. |
| Resetear contador | No. Solo pone el contador a 0. |

La barra de consumo: **azul** (0–50) · **ámbar** (51–80) · **rojo** (81–100).
El contador se **auto-resetea** al cambiar de mes (hora de Canarias).

---

## 🗓️ Solo vuelos de HOY

El plan gratuito de AviationStack no permite filtrar por fecha y devuelve
vuelos de varios días. La app filtra **client-side** y muestra solo los del
**día de hoy** (hora de Canarias) — incluidos los que ya han pasado hoy.

---

## ➕ Añadir más aeropuertos UK/Irlanda

Edita `frontend/src/config/airports.js` y añade una línea en `UK_AIRPORTS`
o `IRELAND_AIRPORTS`:

```js
{ iata: 'XXX', city: 'Ciudad', name: 'Nombre completo', country: 'UK' },
```

El filtro y los nombres se actualizan solos en toda la app.

---

## ☁️ Deploy y 📱 PWA

Ver **[DESPLIEGUE.md](./DESPLIEGUE.md)** para publicar en Vercel y para
instalarla como app en el móvil (manifest + service worker incluidos).

> ⚠️ La URL de Vercel es pública: **no** pongas tu API key como variable de
> entorno allí. Cada usuario introduce la suya dentro de la app.
