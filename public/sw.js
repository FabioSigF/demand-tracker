const CACHE_NAME = 'demand-tracker-cache-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: DO NOT intercept page navigations or redirects (which causes ERR_FAILED on Next.js 307 redirects)
  // Let network handle page layouts, redirects, non-GETs and API calls
  if (
    event.request.method !== 'GET' ||
    event.request.mode === 'navigate' ||
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('identitytoolkit.googleapis.com') ||
    event.request.url.includes('firebase') ||
    event.request.url.startsWith('chrome-extension:')
  ) {
    return;
  }

  // Cache only static assets for speed optimization
  const isStaticAsset = 
    event.request.url.includes('/_next/static/') ||
    event.request.url.endsWith('.svg') ||
    event.request.url.endsWith('.png') ||
    event.request.url.endsWith('.woff2') ||
    event.request.url.includes('/fonts/');

  if (!isStaticAsset) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => null);
    })
  );
});
