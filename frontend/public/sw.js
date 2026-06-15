// Service worker mínimo para que la app sea instalable como PWA.
//
// IMPORTANTE (lección aprendida): la estrategia anterior ("caché primero" para
// TODO) servía un index.html viejo tras cada deploy, y ese HTML pedía un bundle
// JS con hash que Vercel ya había borrado → pantalla en blanco. Por eso ahora:
//  - El HTML / navegación va por RED primero (siempre la versión fresca; si no
//    hay conexión, cae a la caché).
//  - Los assets con hash (JS/CSS/iconos) van por caché primero (su nombre cambia
//    en cada build, así que nunca hay versión "vieja" colisionando).
//  - /api nunca se cachea (datos siempre frescos; el contador vive en el cliente).
const CACHE = 'fue-shell-v2';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      // Borra cachés de versiones anteriores (p.ej. fue-shell-v1).
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
      // Recupera pestañas que se quedaron en una versión vieja: las recarga para
      // que tomen ya la versión nueva (network-first). Evita el blanco eterno.
      try {
        const clients = await self.clients.matchAll({ type: 'window' });
        clients.forEach((c) => c.navigate && c.navigate(c.url));
      } catch {
        /* navigate no soportado: el usuario recargará a mano */
      }
    })()
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api')) return; // nunca interceptar la API
  if (e.request.method !== 'GET') return;

  // HTML / navegación → RED primero (nunca servir un index viejo con bundle muerto).
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(e.request).then((c) => c || caches.match('/index.html')))
    );
    return;
  }

  // Resto (assets con hash, manifest, icono) → caché primero con relleno.
  e.respondWith(caches.match(e.request).then((cached) => cached || fetch(e.request)));
});
