// My_Tripper Service Worker
// Enables PWA install, offline access, and background keep-alive

const CACHE = 'mytripper-v1';
const PRECACHE = [
  '/',
  '/index.html',
];

// ── Install: cache the shell ──────────────────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fall back to network ─────────────────────────────
self.addEventListener('fetch', e => {
  // Don't intercept BLE, GPS, or external API calls
  const url = new URL(e.request.url);
  const isExternal = url.origin !== location.origin;
  if (isExternal) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        // Cache successful GET responses for app shell
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
