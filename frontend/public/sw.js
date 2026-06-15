// Service worker mínimo: solo para que la app sea instalable como PWA.
// NO cacheamos /api: la función serverless devuelve datos siempre frescos y
// la caché/contador de requests se gestionan en el navegador (localStorage).
const CACHE = 'fue-shell-v1';
const SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Nunca interceptar llamadas a la API.
  if (url.pathname.startsWith('/api')) return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
