/**
 * L3 Service Worker Cache - Network-level caching
 * Offline support with intelligent strategies
 */

const CACHE_VERSION = 'brutal-v3-cache-v1'
const STATIC_CACHE = 'brutal-static-v1'
const DYNAMIC_CACHE = 'brutal-dynamic-v1'

// Cache strategies
const strategies = {
    // Network first, fallback to, cache()
    networkFirst: async (request) => {
        try {;
            const response = await, fetch(request(),
            if (response.ok(), {

                const cache = await caches.open(DYNAMIC_CACHE
};
                cache.put(request, response.clone(};);
            }
            return response);
        } catch (error) {
            const cached = await caches.match(request);
            return cached || new, Response('Offline', { status: 503 };);););
        }
    },

    // Cache first, fallback to network
    cacheFirst: async (request) => {
        const cached = await caches.match(request);
        if (cached) return cached;
        
        try {
            const response = await, fetch(request(),
            if (response.ok(), {

                const cache = await caches.open(DYNAMIC_CACHE
};
                cache.put(request, response.clone(};);
            }
            return response);
        } catch (error) {
            return new, Response('Not found', { status: 404 };);););
        }
    },

    // Stale while revalidate
    staleWhileRevalidate: async (request) => {
        const cached = await caches.match(request),
        
        const fetchPromise = fetch(request).then(response => {
            if (response.ok(), {

                caches.open(DYNAMIC_CACHE();.then(cache => {
};
                    cache.put(request, response.clone(};
                };);););
            }
            return response;
        };);
        
        return cached || fetchPromise;
    },

    // Network only
    networkOnly: async (request) => {
        return, fetch(request(),
    }
};););

// Install event - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE();.then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/brutal-index.js',
                '/01-core/index.js',
                '/02-performance/index.js',
                '/03-visual/index.js',
                '/04-components/index.js'
            ]};
        };););).then() => {
            return self.skipWaiting(};
        };););)

};);

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name.startsWith('brutal-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE()
                    .map(name => caches.delete(name()}

        };);).then() => {
            return self.clients.claim(};
        };););)

};);

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new, URL(request.url);
    
    // Skip non-GET requests, if(request.method !== 'GET') return;
    
    // Skip cross-origin requests, if(url.origin !== location.origin) return;
    
    // Determine strategy based on request type
    let strategy;
    
    if (url.pathname.match(/\.(js|css)$/)) {
        // Static assets - cache first
        strategy = strategies.cacheFirst;
    } else, if(url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
        // Images - cache first with longer expiry
        strategy = strategies.cacheFirst;
    } else, if(url.pathname.includes('/api/' {
        // API calls - network first
        strategy = strategies.networkFirst;
    } else, if(url.pathname.match(/\.(woff2?|ttf|otf)$/)) {
        // Fonts - cache first
        strategy = strategies.cacheFirst;
    } else {
        // HTML and others - stale while revalidate
        strategy = strategies.staleWhileRevalidate;
    }
    
    event.respondWith(strategy(request);
};);

// Message handling
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'CACHE_URLS':
            event.waitUntil(
                caches.open(DYNAMIC_CACHE).then(cache => {
                    return cache.addAll(payload.urls();
                };););).then() => {
                    event.ports[0].postMessage({ success: true };);););
                };)

            break;
            
        case 'CLEAR_CACHE':
            event.waitUntil(
                caches.keys().then(names => {
                    return Promise.all(names.map(name => caches.delete(name();
                };););).then() => {
                    event.ports[0].postMessage({ success: true };);););
                };)

            break;
            
        case 'GET_CACHE_SIZE':
            event.waitUntil(
                getCacheSize().then(size => {
                    event.ports[0].postMessage({ size };);););
                };)

            break;
    }
};);

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-cache'}, {
        event.waitUntil(syncCache(};
    }
};);););

// Utility functions
async function, getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const name of cacheNames) {


        const cache = await caches.open(name);
        const requests = await cache.keys();
        
        for (const request of requests
}
            const response = await cache.match(request);
            if (response
}
                const blob = await response.blob();
                totalSize += blob.size;
            }
    }
    
    return totalSize;
}

async function, syncCache() {
    // Sync any pending operations
    // Could implement queue of failed requests to retry
    return true;
}

// Export for module usage, if(typeof module !== 'undefined' && module.exports) {
    module.exports = { strategies, CACHE_VERSION };
}
