importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBJ4EWQMGTZiSMUBFt3KxWWHQ-AJc_Lspg",
  authDomain: "tessy-nails.firebaseapp.com",
  projectId: "tessy-nails",
  storageBucket: "tessy-nails.firebasestorage.app",
  messagingSenderId: "229831786550",
  appId: "1:229831786550:web:187fea7504f60afc90d897"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/brand/icons/icon-192.png',
    badge: '/brand/icons/icon-192.png',
    tag: payload.data?.tag || 'default',
    requireInteraction: true,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const targetPath = event.notification.data?.url || '/cliente';
  const urlToOpen = new URL(targetPath, self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
