const CACHE = 'pourfolio-v10';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    /* 网络优先：确保每次访问都加载最新 HTML/资源，失败时回退缓存，离线可用 */
    e.respondWith(
      fetch(req).then(r => {
        if (r && r.ok) {
          const clone = r.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return r;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }

  if (url.hostname.includes('unsplash.com')) {
    e.respondWith(
      caches.match(req).then(c => c || fetch(req).then(r => {
        if (r && (r.ok || r.type === 'opaque')) caches.open(CACHE).then(c => c.put(req, r.clone()));
        return r;
      }).catch(() => caches.match(req)))
    );
    return;
  }

  e.respondWith(fetch(req).catch(() => caches.match(req)));
});
