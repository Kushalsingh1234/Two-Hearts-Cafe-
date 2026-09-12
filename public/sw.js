// Two Hearts Cafe - Progressive Web App Service Worker
const CACHE_NAME = 'two-hearts-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/audio/ting.mp3',
  '/audio/ting.wav',
  '/images/pwa/icon-192.png',
  '/images/pwa/icon-512.png',
  '/images/pwa/icon.svg',
  '/favicon.svg'
];

// Install: Cache critical assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll fallback:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Claim clients immediately so notifications work on first load
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Listen for incoming messages from Admin or Customer clients
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_ORDER_NOTIFICATION') {
    const { title, body, data } = event.data;
    showOrderNotification(title, body, data);
  }

  if (event.data.type === 'PING') {
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({ type: 'PONG', status: 'active' });
    }
  }
});

// Web Push event: Wakes up the service worker even if the browser is closed or backgrounded
self.addEventListener('push', (event) => {
  let title = '🔔 New Order Received! — Two Hearts Cafe';
  let body = 'A new customer order has been placed.';
  let data = { url: '/?admin=true&pwa=1' };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      body = payload.body || body;
      data = payload.data || data;
    } catch (e) {
      body = event.data.text() || body;
    }
  }

  event.waitUntil(showOrderNotification(title, body, data));
});

// Helper to trigger rich notification with sound and vibration
function showOrderNotification(title, body, data = {}) {
  const options = {
    body: body || 'New order ready for kitchen prep.',
    icon: '/images/pwa/icon-192.png',
    badge: '/images/pwa/badge-72.png',
    sound: '/audio/ting.mp3',
    // Strong vibration pattern: 300ms buzz, 100ms pause, 300ms buzz, 100ms pause, 500ms buzz
    vibrate: [300, 100, 300, 100, 500],
    tag: 'twohearts-order-' + (data.orderId || Date.now()),
    renotify: true,
    requireInteraction: true, // Keep notification visible until clicked/swiped
    data: {
      url: data.url || '/?admin=true&pwa=1',
      orderId: data.orderId || null,
      timestamp: Date.now()
    },
    actions: [
      { action: 'view_order', title: '👀 View Order' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(title, options);
}

// Notification Click: Focus existing Admin window or open new tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/?admin=true&pwa=1';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Look for existing open admin dashboard
      for (const client of windowClients) {
        if (client.url.includes('admin=true') && 'focus' in client) {
          return client.focus();
        }
      }
      // 2. Look for any window from this origin
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // 3. Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
