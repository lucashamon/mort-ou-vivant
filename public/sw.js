const CACHE_NAME_IMAGES = 'mort-ou-vivant-images-v1';
const OLD_STATIC_CACHE = 'mort-ou-vivant-static-v3'; // Identified for cleanup

// Install: No more static caching
self.addEventListener('install', (event) => {
    // Force immediate activation
    self.skipWaiting();
});

// Activate: Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                // Keep only the image cache
                if (key !== CACHE_NAME_IMAGES) {
                    console.log('[Service Worker] Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch: Only intercept images
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Image Strategy: Cache First
    // Checks for /images/ path OR common image extensions
    if (url.pathname.includes('/images/') || url.pathname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
        event.respondWith(
            caches.open(CACHE_NAME_IMAGES).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse; // Return from cache
                    }
                    // Fetch from network and cache
                    return fetch(event.request).then((networkResponse) => {
                        // Check if we received a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        cache.put(event.request, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => {
                        // Optional: Return a placeholder if offline and image not in cache
                        // return caches.match('/images/placeholder.png'); 
                    });
                });
            })
        );
    }
    
    // For all other requests (HTML, JS, CSS, JSON), do NOT call event.respondWith.
    // This allows the browser to handle the request normally (Network only/Standard HTTP Cache).
});