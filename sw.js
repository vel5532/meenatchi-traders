// ═══════════════════════════════════════════════
//  MEENATCHI TRADERS — Service Worker (sw.js)
//  Handles offline caching & PWA install
// ═══════════════════════════════════════════════

const CACHE_NAME = 'mt-traders-v1.0';

// Files to cache for offline use
const CACHE_ASSETS = [
  './',
  './index.html',
  './loyalty-gifts.js',
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;600;700;800&family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// ── Install: cache all assets ──────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ─────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: serve from cache, fallback to network ──
self.addEventListener('fetch', event => {
  // Skip non-GET and cross-origin requests (except CDN)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // If offline and not cached, return offline page for HTML requests
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});

// ── Background Sync (for future use) ──────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sales') {
    console.log('[SW] Background sync triggered for sales');
  }
});

// ── Push Notifications (for future use) ───────
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Meenatchi Traders', {
      body: data.body || 'New notification',
      icon: './icons/icon-192.png',
      badge: './icons/icon-72.png',
      data: data
    })
  );
});
