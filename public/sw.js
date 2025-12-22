// Service Worker for Push Notifications - High Priority Version
const SW_VERSION = '2.0.0';

self.addEventListener('install', (event) => {
  console.log('Service Worker v' + SW_VERSION + ' installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker v' + SW_VERSION + ' activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  // Default notification data
  let data = {
    title: '🔔 Porteiro Virtual',
    body: 'Você tem uma nova notificação',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: {},
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      data = { ...data, ...pushData };
      console.log('Push data parsed:', data);
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Try as text
      try {
        data.body = event.data.text();
      } catch (e2) {
        console.error('Error parsing push data as text:', e2);
      }
    }
  }

  // High priority notification options
  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    // Strong vibration pattern for urgency
    vibrate: [400, 100, 400, 100, 400, 100, 400],
    data: data.data || {},
    // Keep notification visible until user interacts
    requireInteraction: true,
    // Re-notify even with same tag to ensure visibility
    renotify: true,
    // Unique tag with timestamp
    tag: 'doorbell-' + Date.now(),
    // Ensure sound plays
    silent: false,
    // Action buttons
    actions: [
      { action: 'open', title: '🔓 Atender', icon: '/pwa-192x192.png' },
      { action: 'dismiss', title: '❌ Ignorar' },
    ],
    // Timestamp for sorting
    timestamp: Date.now(),
  };

  console.log('Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('Notification shown successfully');
      })
      .catch((err) => {
        console.error('Error showing notification:', err);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  if (event.action === 'dismiss') {
    console.log('Notification dismissed by user');
    return;
  }

  const notificationData = event.notification.data || {};
  const roomName = notificationData.roomName;
  const propertyName = notificationData.propertyName;

  console.log('Opening app with data:', { roomName, propertyName });

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('Found clients:', clientList.length);
        
        // If there's already an open window, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            console.log('Focusing existing client');
            client.focus();
            // Post message to handle incoming call
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
          console.log('Opening new window');
          return self.clients.openWindow('/');
        }
      })
      .catch((err) => {
        console.error('Error handling notification click:', err);
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed without interaction');
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Keep service worker alive for background processing
self.addEventListener('fetch', (event) => {
  // Let the browser handle fetch requests normally
  // This handler keeps the service worker active
});
