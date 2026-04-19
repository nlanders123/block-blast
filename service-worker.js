const CACHE_NAME = 'block-royale-v24';
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './icons.js',
    './game-logic.js',
    './game.js',
    './manifest.json',
    './privacy.html',
    './apple-touch-icon.png',
    './icon-192.png',
    './icon-512.png',
    './fonts/spline-sans-latin.woff2',
    './fonts/spline-sans-latin-ext.woff2',
    './fonts/pirata-one.ttf'
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
