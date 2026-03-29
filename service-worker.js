const CACHE_NAME = 'block-royale-v5';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './game-logic.js',
    './game.js',
    './levels.js',
    './manifest.json'
];

// Install: cache assets and immediately activate (skip waiting)
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate: delete old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network-first — try fresh, fall back to cache for offline
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then((response) => {
                // Cache the fresh response for offline use
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
                return response;
            })
            .catch(() => caches.match(e.request))
    );
});
