const CACHE_NAME = 'esnafca-v3-stable';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests with http/https schemes
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Bypass Next.js internal chunks, dev server HMR, and API endpoints
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('webpack')
  ) {
    return;
  }

  // Safe Network-First with guaranteed Response fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status === 0 || (!response.ok && response.status !== 404)) {
          return response;
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        // Always return a valid Response instance, never undefined or null
        return new Response('Çevrimdışısınız. Lütfen internet bağlantınızı kontrol ediniz.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })
  );
});
