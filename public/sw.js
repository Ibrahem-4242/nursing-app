// Nursing Study Hub - Progressive Web App Service Worker
const CACHE_NAME = 'nursing-hub-pwa-v1';

const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install: Cache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-caching asset warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Network-first strategy with cache fallback for offline reading
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET requests and external third-party requests (AdSense, analytics, gists)
  if (req.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Skip dynamic API calls that must be fresh
  if (url.pathname.startsWith('/api/admin') || url.pathname.startsWith('/api/student')) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        // Cache successful GET responses for static assets and pages
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Offline fallback
        const cachedResponse = await caches.match(req);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (req.mode === 'navigate') {
          return caches.match('/');
        }
        return new Response('Offline - No connection available', {
          status: 503,
          statusText: 'Offline',
        });
      })
  );
});
