// Phonix Music service worker — app-shell offline support.
// NetworkFirst for HTML so a fresh deploy always wins when online,
// CacheFirst for hashed static assets (immutable by build hash).
const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;

const SHELL_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.webp',
  '/apple-touch-icon.webp',
  '/site-icon.webp',
  '/placeholder.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    await Promise.allSettled(SHELL_URLS.map((u) => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
        .map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

function isAssetRequest(url) {
  return (
    url.pathname.startsWith('/_build/') ||
    url.pathname.startsWith('/assets/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico|gif)$/i.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept API / auth / supabase routes
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/~oauth') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // HTML navigations: NetworkFirst, fallback to cached shell.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('/', fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        const cached = (await cache.match(req)) || (await cache.match('/'));
        if (cached) return cached;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Static assets: StaleWhileRevalidate.
  if (isAssetRequest(url)) {
    event.respondWith((async () => {
      const cache = await caches.open(ASSET_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone()).catch(() => {});
          return res;
        })
        .catch(() => null);
      return cached || (await network) || new Response('', { status: 504 });
    })());
  }
});
