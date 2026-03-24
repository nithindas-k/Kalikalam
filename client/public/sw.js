

self.addEventListener("push", (event) => {
    let data = { title: "Kalikalam", body: "New update!", icon: "/favicon.ico" };
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || "https://api.dicebear.com/7.x/initials/svg?seed=Kalikalam&backgroundColor=f97316",
        badge: "https://api.dicebear.com/7.x/initials/svg?seed=K&backgroundColor=f97316",
        data: data.data || {}
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    
    // Default URL if not provided in the payload
    let targetUrl = "/";
    if (event.notification.data && event.notification.data.url) {
        targetUrl = event.notification.data.url;
    }

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // Check if there is already a window/tab open with the same origin
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    return client.focus();
                }
            }
            // If no window/tab is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
