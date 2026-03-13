// Meenatchi Traders Service Worker v1.1.0
// Updates this version number forces all clients to get fresh files

const CACHE_NAME = 'meenatchi-v1.1.0';
const CACHE_URLS = ['/meenatchi-traders/', '/meenatchi-traders/index.html'];

// On install: cache the app
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate immediately, don't wait
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS)).catch(() => {})
  );
});

// On activate: delete ALL old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim()) // Take control of all open tabs
  );
});

// On fetch: Network first, fall back to cache
// This ensures APK always gets the latest code from GitHub
self.addEventListener('fetch', event => {
  // Only handle same-origin requests
  if (!event.request.url.includes('meenatchi-traders') &&
      !event.request.url.includes('github.io')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Got fresh from network — update cache
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed — serve from cache
        return caches.match(event.request);
      })
  );
});
