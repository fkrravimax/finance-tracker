import { Router } from 'express';
import { notificationService } from '../services/notification.service.js';
import { db } from '../db/index.js';
import { watchlists, notifications } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { cryptoService } from '../services/encryption.service.js';

const router = Router();

// --- Notifications ---

router.get('/', async (req, res) => {
    try {
        const userId = req.body.user.id; // From authMiddleware
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const data = await notificationService.getNotifications(userId, limit, offset);

        // Count unread
        const unreadResults = await db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

        res.json({
            data,
            unreadCount: unreadResults.length
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.put('/read-all', async (req, res) => {
    try {
        const userId = req.body.user.id;
        await notificationService.markAllAsRead(userId);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

router.put('/:id/read', async (req, res) => {
    try {
        const userId = req.body.user.id;
        const { id } = req.params;
        await notificationService.markAsRead(userId, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});


// --- Watchlist (Simple management) ---

router.get('/watchlist', async (req, res) => {
    try {
        const userId = req.body.user.id;
        const list = await db.select().from(watchlists).where(eq(watchlists.userId, userId));
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

router.post('/watchlist', async (req, res) => {
    try {
        const userId = req.body.user.id;
        const { symbol } = req.body;

        if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

        // Check if exists
        const existing = await db.select().from(watchlists).where(and(eq(watchlists.userId, userId), eq(watchlists.symbol, symbol)));
        if (existing.length > 0) return res.json({ message: 'Already in watchlist' });

        await db.insert(watchlists).values({
            id: randomUUID(),
            userId,
            symbol: symbol.toUpperCase(),
            // Initial lastPrice is null, will be filled by cron
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});

router.delete('/watchlist/:id', async (req, res) => {
    try {
        const userId = req.body.user.id;
        const { id } = req.params;
        await db.delete(watchlists).where(and(eq(watchlists.id, id), eq(watchlists.userId, userId)));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete from watchlist' });
    }
});

export default router;
