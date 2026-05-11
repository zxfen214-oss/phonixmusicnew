// Phonix Music service worker — versioned shell offline support.
// Bump VERSION on every meaningful change to invalidate old caches.
const VERSION = 'v2-2026-05-11';
const SHELL_CACHE = `phonix-shell-${VERSION}`;
const ASSET_CACHE = `phonix-assets-${VERSION}`;
const OFFLINE_URL = '/offline.html';

const SHELL_URLS = [
  '/',
  OFFLINE_URL,
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
    // Don't auto-skipWaiting — wait for the page to ask via SKIP_WAITING.
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
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  // Never intercept API / auth / oauth.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/~oauth') ||
    url.pathname.startsWith('/auth/')
  ) return;

  // HTML navigations: NetworkFirst → cached shell → offline.html.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const preload = 'preloadResponse' in event ? await event.preloadResponse : null;
        const fresh = preload || await fetch(req);
        const cache = await caches.open(SHELL_CACHE);
        cache.put('/', fresh.clone()).catch(() => {});
        return fresh;
      } catch {
        const cache = await caches.open(SHELL_CACHE);
        const cached = (await cache.match(req)) || (await cache.match('/'));
        if (cached) return cached;
        const offline = await cache.match(OFFLINE_URL);
        return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
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
