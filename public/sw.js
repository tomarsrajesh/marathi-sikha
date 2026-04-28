// v4 — Never cache HTML, always fetch fresh from network
const CACHE = 'marathi-sikha-v4';

// Only cache static assets (icons, images) — NEVER HTML
const STATIC_ASSETS = [
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting(); // activate immediately
});

self.addEventListener('activate', e => {
  // Delete ALL old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k))) // delete everything including v1, v2, v3
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // NEVER intercept API calls
  if (url.pathname.startsWith('/api/')) return;

  // NEVER cache HTML files — always fetch fresh
  if (e.request.headers.get('accept') && 
      e.request.headers.get('accept').includes('text/html')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // For static assets (icons etc) — cache first
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
