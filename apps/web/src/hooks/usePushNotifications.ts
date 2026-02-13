import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
            checkExistingSubscription();
        }
    }, []);

    const checkExistingSubscription = async () => {
        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            }
        } catch (error) {
            console.error('[PUSH] Error checking subscription:', error);
        }
    };

    const registerServiceWorker = async (): Promise<ServiceWorkerRegistration> => {
        const registration = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;
        return registration;
    };

    const subscribe = useCallback(async () => {
        if (!isSupported) return false;
        setLoading(true);

        try {
            // 1. Request notification permission
            const perm = await Notification.requestPermission();
            setPermission(perm);
            if (perm !== 'granted') {
                setLoading(false);
                return false;
            }

            // 2. Register service worker
            const registration = await registerServiceWorker();

            // 3. Get VAPID public key from backend
            const vapidRes = await authService.fetchWithAuth('/api/notifications/vapid-key');
            const { publicKey } = await vapidRes.json();

            // 4. Subscribe to push
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
            });

            // 5. Send subscription to backend
            await authService.fetchWithAuth('/api/notifications/subscribe', {
                method: 'POST',
                body: JSON.stringify({ subscription: subscription.toJSON() }),
            });

            setIsSubscribed(true);
            setLoading(false);
            return true;
        } catch (error) {
            console.error('[PUSH] Subscribe error:', error);
            setLoading(false);
            return false;
        }
    }, [isSupported]);

    const unsubscribe = useCallback(async () => {
        if (!isSupported) return false;
        setLoading(true);

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                    // Unsubscribe from push
                    await subscription.unsubscribe();

                    // Remove from backend
                    await authService.fetchWithAuth('/api/notifications/unsubscribe', {
                        method: 'DELETE',
                        body: JSON.stringify({ endpoint: subscription.endpoint }),
                    });
                }
            }

            setIsSubscribed(false);
            setLoading(false);
            return true;
        } catch (error) {
            console.error('[PUSH] Unsubscribe error:', error);
            setLoading(false);
            return false;
        }
    }, [isSupported]);

    return {
        isSupported,
        isSubscribed,
        permission,
        loading,
        subscribe,
        unsubscribe,
    };
}
