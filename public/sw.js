const CACHE_NAME_STATIC = 'mort-ou-vivant-static-v3'; // Bump this for app shell updates
const CACHE_NAME_IMAGES = 'mort-ou-vivant-images-v1'; // Can remain v1 longer if images don't change often

const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css', // Changed from index.css to match actual file if checking previous file list, but index.html imports style.css usually. Let's check imports. 
    // Wait, earlier view_file of index.html showed <link rel="stylesheet" href="/style.css"> and view_file of sw.js showed ./index.css (which might be wrong or a build artifact).
    // The user's file structure has style.css in root.
    // Let's stick to what we know exists:
    '/index.html',
    '/style.css',
    '/main.js',
    '/src/game.js',
    '/data.json',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Install: Cache Static Assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME_STATIC).then((cache) => {
            console.log('[Service Worker] Caching App Shell');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME_STATIC && key !== CACHE_NAME_IMAGES) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch: Split Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Image Strategy: Cache First
    if (url.pathname.startsWith('/images/') || url.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        event.respondWith(
            caches.open(CACHE_NAME_IMAGES).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse; // Return from cache
                    }
                    // Fetch from network and cache
                    return fetch(event.request).then((networkResponse) => {
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    });
                });
            })
        );
        return; // Early exit for images
    }

    // 2. App Shell Strategy: Network First (Freshness priority)
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request); // Fallback to cache if offline
        })
    );
});
