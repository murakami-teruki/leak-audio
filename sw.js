// オフライン用キャッシュ。オンライン時は常に最新を取得し、失敗時のみキャッシュを使う（ネットワーク優先）
const CACHE = 'leak-audio-v1.5';
const FILES = ['./', 'index.html', 'test.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
const isCacheable = u => { const x = new URL(u); return x.origin === location.origin || x.host === 'cdnjs.cloudflare.com'; };

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !isCacheable(e.request.url)) return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
