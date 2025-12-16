/**
 * Service Worker for Ethiopian Maids PWA
 *
 * Provides offline support and caching strategies
 */

const CACHE_NAME = 'ethiopian-maids-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// API endpoints that can be cached
const CACHEABLE_API_PATTERNS = [
  /\/graphql.*query.*GetMaidProfiles/,
  /\/graphql.*query.*GetJobs/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip hasura/graphql for subscriptions (WebSocket)
  if (url.pathname.includes('/v1/graphql') && request.headers.get('upgrade') === 'websocket') {
    return;
  }

  // Strategy: Network first, cache fallback for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Strategy: Stale-while-revalidate for API requests
  if (url.pathname.includes('/graphql')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              // Only cache successful responses
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((error) => {
              console.log('[SW] Network request failed:', error);
              // Return cached response if network fails
              if (cachedResponse) {
                return cachedResponse;
              }
              throw error;
            });

          // Return cached response immediately, update in background
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy: Cache first for static assets
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default: Network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone and cache the response
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Ethiopian Maids', body: event.data.text() };
    }
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      ...data,
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Ethiopian Maids', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'send-message') {
    event.waitUntil(syncMessages());
  }
});

// Helper functions
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

async function syncMessages() {
  // Sync pending messages when back online
  console.log('[SW] Syncing messages...');
  // This would be implemented with IndexedDB to store pending messages
}

// Log service worker registration
console.log('[SW] Service worker loaded');
