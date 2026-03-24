const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerPushNotifications(userId: string) {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push notifications are not supported in this browser.");
        return;
    }

    try {
        
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;

       
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied.");
            return;
        }

        console.log("🔔 Fetching VAPID key from:", `${API_BASE_URL}/push/vapid-public-key`);
        const keyResponse = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
        
        if (!keyResponse.ok) {
            throw new Error(`Failed to fetch VAPID key: ${keyResponse.status} ${keyResponse.statusText}`);
        }

        const data = await keyResponse.json();
        const publicKey = data.publicKey;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
        }

        await fetch(`${API_BASE_URL}/push/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId, subscription }),
        });

        console.log("Registered for push notifications.");
    } catch (err) {
        console.error("Failed to register for push notifications:", err);
    }
}
