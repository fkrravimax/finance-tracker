import { type Request, type Response } from 'express';
import { pushService } from '../services/push.service.js';

export const notificationController = {
    async subscribe(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { subscription } = req.body;
            if (!subscription || !subscription.endpoint || !subscription.keys) {
                res.status(400).json({ error: 'Invalid subscription object' });
                return;
            }

            const result = await pushService.subscribe(userId, subscription);
            res.json({ success: true, subscription: result });
        } catch (error) {
            console.error('[NOTIFICATION] Subscribe error:', error);
            res.status(500).json({ error: 'Failed to subscribe' });
        }
    },

    async unsubscribe(req: Request, res: Response) {
        try {
            const userId = (req as any).user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { endpoint } = req.body;
            if (!endpoint) {
                res.status(400).json({ error: 'Endpoint is required' });
                return;
            }

            await pushService.unsubscribe(userId, endpoint);
            res.json({ success: true });
        } catch (error) {
            console.error('[NOTIFICATION] Unsubscribe error:', error);
            res.status(500).json({ error: 'Failed to unsubscribe' });
        }
    },

    async getVapidKey(_req: Request, res: Response) {
        try {
            const key = pushService.getVapidPublicKey();
            res.json({ publicKey: key });
        } catch (error) {
            console.error('[NOTIFICATION] Get VAPID key error:', error);
            res.status(500).json({ error: 'Failed to get VAPID key' });
        }
    },
};
