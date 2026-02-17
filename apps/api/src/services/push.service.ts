import webpush from 'web-push';
import { db } from '../db/index.js';
import { pushSubscriptions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Configure web-push with VAPID keys
// Configure web-push with VAPID keys
try {
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:rupiku@app.com';
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;

    if (vapidPublic && vapidPrivate) {
        webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
    } else {
        console.warn("[PushService] VAPID keys are missing. Push notifications will not work.");
    }
} catch (error) {
    console.error("[PushService] Failed to set VAPID details:", error);
}

export interface PushPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: {
        url?: string;
        action?: string;
    };
}

export const pushService = {
    async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
        // Check if already subscribed with same endpoint
        const existing = await db.select()
            .from(pushSubscriptions)
            .where(and(
                eq(pushSubscriptions.userId, userId),
                eq(pushSubscriptions.endpoint, subscription.endpoint)
            ));

        if (existing.length > 0) {
            return existing[0];
        }

        const [result] = await db.insert(pushSubscriptions).values({
            id: randomUUID(),
            userId,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        }).returning();

        return result;
    },

    async unsubscribe(userId: string, endpoint: string) {
        await db.delete(pushSubscriptions).where(
            and(
                eq(pushSubscriptions.userId, userId),
                eq(pushSubscriptions.endpoint, endpoint)
            )
        );
    },

    async sendToUser(userId: string, payload: PushPayload) {
        const subs = await db.select()
            .from(pushSubscriptions)
            .where(eq(pushSubscriptions.userId, userId));

        const results = await Promise.allSettled(
            subs.map(sub => {
                const pushSub = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    }
                };
                return webpush.sendNotification(pushSub, JSON.stringify(payload));
            })
        );

        // Clean up expired/invalid subscriptions (410 Gone)
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            if (result.status === 'rejected') {
                const err = result.reason as { statusCode?: number };
                if (err.statusCode === 410 || err.statusCode === 404) {
                    console.log(`[PUSH] Removing invalid subscription: ${subs[i].id}`);
                    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subs[i].id));
                }
            }
        }

        return results;
    },

    async sendToMultipleUsers(userIds: string[], payload: PushPayload) {
        const promises = userIds.map(userId =>
            this.sendToUser(userId, payload).catch(error => {
                console.error(`[PUSH] Failed to send to user ${userId}:`, error);
                throw error; // Re-throw to be caught by allSettled as rejected
            })
        );

        return Promise.allSettled(promises);
    },

    getVapidPublicKey() {
        return process.env.VAPID_PUBLIC_KEY || '';
    }
};
