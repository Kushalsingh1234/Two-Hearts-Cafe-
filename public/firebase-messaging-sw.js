// Firebase Cloud Messaging background handler
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAkXufx8FsFT-HA0vsxxB6TuvOMAKzfwLE",
  authDomain: "two-hearts-cafe-1144c.firebaseapp.com",
  projectId: "two-hearts-cafe-1144c",
  storageBucket: "two-hearts-cafe-1144c.firebasestorage.app",
  messagingSenderId: "753799219299",
  appId: "1:753799219299:web:d65816128b4a9bb92c9056"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background push payload: ', payload);
  const title = payload.notification?.title || '🔔 New Order Received! — Two Hearts Cafe';
  const options = {
    body: payload.notification?.body || 'A new order is ready for kitchen prep.',
    icon: '/images/pwa/icon-192.png',
    badge: '/images/pwa/badge-72.png',
    vibrate: [300, 100, 300, 100, 500],
    sound: '/audio/ting.mp3',
    tag: 'twohearts-fcm-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.data?.url || '/?admin=true'
    },
    actions: [
      { action: 'open', title: 'Open Kitchen Orders' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/?admin=true';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('admin') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
