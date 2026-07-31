/* ============================================================
   Service Worker — הקופה המשותפת
   עדכן את CACHE_VERSION בכל פריסה חדשה
   ============================================================ */
const CACHE_VERSION = 14;
const CACHE_NAME = `kupa-v${CACHE_VERSION}`;

const PRECACHE_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icon-180.png',
  './icon-512.png'
];

// ── Install: cache all static files ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_FILES))
      .then(() => self.skipWaiting()) // activate immediately without waiting
  );
});

// ── Activate: clear old caches ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim()) // take control of all open tabs
  );
});

// ── Fetch: network first, fallback to cache ──
self.addEventListener('fetch', (e) => {
  // Only handle same-origin and http/https requests
  if (!e.request.url.startsWith('http')) return;

  // Skip Firebase and Google API requests — always go to network
  const url = new URL(e.request.url);
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('google') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic')) {
    return;
  }

  // For our own files: network first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(response => {
        // Save fresh copy to cache
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(e.request)) // offline fallback
  );
});

// ── Message from app (e.g. "skip waiting now") ──
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
