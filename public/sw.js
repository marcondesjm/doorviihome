// Service Worker for Push Notifications
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let data = {
    title: 'Porteiro Virtual',
    body: 'Você tem uma nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {},
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    // High priority notification settings
    vibrate: [300, 100, 300, 100, 300, 100, 300], // Strong vibration pattern
    data: data.data,
    requireInteraction: true, // Notification stays until user interacts
    renotify: true, // Re-notify even if notification with same tag exists
    tag: 'doorbell-' + Date.now(), // Unique tag to ensure notification shows
    silent: false, // Ensure sound plays
    urgency: 'high',
    actions: [
      { action: 'open', title: '🔓 Atender' },
      { action: 'dismiss', title: '❌ Dispensar' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const notificationData = event.notification.data || {};
  const roomName = notificationData.roomName;
  const propertyName = notificationData.propertyName;

  // Open the app at the home page where IncomingCall will show
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If there's already an open window, focus it and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            // Post message to refresh the page and show incoming call
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              roomName,
              propertyName,
            });
            return;
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});
