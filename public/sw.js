// Orbit PWA Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch to satisfy PWA installability requirements
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
