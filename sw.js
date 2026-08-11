// Service Worker de AnonPosts (PWA)
// Estrategia: network-first (la app necesita el servidor); el cache es solo respaldo offline del "shell".
const CACHE = 'anonposts-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/script.js', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  // Solo interceptamos GET; las llamadas al API (POST/DELETE/PUT) van directo a la red.
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
