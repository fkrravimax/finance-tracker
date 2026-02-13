// Rupiku Service Worker — Push Notifications

// Listen for push events from the server
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'Rupiku',
            body: event.data.text(),
        };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/icon-192.png',
        badge: data.badge || '/icon-192.png',
        tag: data.tag || 'rupiku-notification',
        vibrate: [100, 50, 100],
        data: data.data || { url: '/' },
        actions: [
            {
                action: 'open',
                title: 'Buka Rupiku',
            },
        ],
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Rupiku', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If an app window is already open, focus it
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open a new window
            return clients.openWindow(url);
        })
    );
});

// Activate immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});
