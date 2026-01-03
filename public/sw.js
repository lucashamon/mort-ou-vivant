const CACHE_NAME = 'mort-ou-vivant-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './index.css',
    './index.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

// Install event: Cache critical assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching all: app shell and content');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Fetch event: Cache First, Network Fallback
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return cache if available
            if (response) {
                return response;
            }
            // Otherwise fetch from network
            return fetch(event.request).then((networkResponse) => {
                // Optional: Dynamic caching for images could involve cloning the response here
                // but for now we stick to strict cache-first for safety.
                return networkResponse;
            });
        })
    );
});

// Activate event: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});
