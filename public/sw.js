const CACHE_NAME = 'pokemon-quiz-v3';
const API_CACHE  = 'pokemon-quiz-api-v3';
const IMG_CACHE  = 'pokemon-quiz-img-v3';

// 起動時にプリキャッシュするアセット
const PRECACHE = [
  '/',
  '/pokemon-data.json',
  '/manifest.webmanifest',
];

// ── Install: プリキャッシュ ──────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: 古いキャッシュを削除 ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![CACHE_NAME, API_CACHE, IMG_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ① ポケモン画像 (GitHub raw) → キャッシュ優先、なければネット、ネットなければプレースホルダー
  if (url.hostname === 'raw.githubusercontent.com') {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          cache.put(request, res.clone());
          return res;
        } catch {
          // オフライン時: 透明な1x1 PNG を返す
          return new Response(
            atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
            { headers: { 'Content-Type': 'image/png' } }
          );
        }
      })
    );
    return;
  }

  // ② PokéAPI (types取得) → ネット優先、失敗したらキャッシュ
  if (url.hostname.includes('pokeapi.co')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(API_CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ③ Next.js JS/CSS → ネット優先（更新を即反映）、オフライン時はキャッシュ
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          caches.open(CACHE_NAME).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // ④ ローカルファイル (pokemon-data.json など) → キャッシュ優先
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
