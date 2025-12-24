
const CACHE_NAME = 'smartstorage-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
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
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);

  // No interceptar llamadas a la API de Google
  if (url.hostname.includes('generativelanguage.googleapis.com') || url.hostname.includes('esm.sh')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Opcionalmente cachear nuevos recursos estáticos aquí
        return response;
      }).catch(() => {
        // Si falla la red y es una navegación, devolver el index.html de la caché
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});