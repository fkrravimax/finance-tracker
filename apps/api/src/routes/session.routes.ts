import express from 'express';
import { db } from '../db/index.js';
import { sessions } from '../db/schema.js';
import { eq, and, gt, ne } from 'drizzle-orm';
import { UAParser } from 'ua-parser-js';

const router = express.Router();

// GET /api/sessions - List active sessions
router.get('/', async (req, res) => {
    try {
        const userId = (req as any).user?.id;
        const currentSessionId = (req as any).session?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Fetch all active sessions for user
        const activeSessions = await db
            .select()
            .from(sessions)
            .where(
                and(
                    eq(sessions.userId, userId),
                    gt(sessions.expiresAt, new Date())
                )
            )
            .orderBy(sessions.updatedAt); // Newest last

        // Parse UA and format response
        const formattedSessions = activeSessions.map(session => {
            const parser = new UAParser(session.userAgent || '');
            const result = parser.getResult();

            return {
                id: session.id,
                ipAddress: session.ipAddress || 'Unknown IP',
                device: {
                    type: result.device.type || 'desktop', // mobile, tablet, console, smarttv, wearable, embedded
                    vendor: result.device.vendor,
                    model: result.device.model
                },
                os: {
                    name: result.os.name,
                    version: result.os.version
                },
                browser: {
                    name: result.browser.name,
                    version: result.browser.version
                },
                lastActive: session.updatedAt,
                isCurrent: session.id === currentSessionId
            };
        });

        // Sort: Current session first, then by lastActive desc
        formattedSessions.sort((a, b) => {
            if (a.isCurrent) return -1;
            if (b.isCurrent) return 1;
            return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        });

        res.json(formattedSessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// DELETE /api/sessions/:id - Revoke a session
router.delete('/:id', async (req, res) => {
    try {
        const userId = (req as any).user?.id;
        const sessionIdToDelete = req.params.id;
        const currentSessionId = (req as any).session?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (sessionIdToDelete === currentSessionId) {
            return res.status(400).json({ error: 'Cannot revoke current session. Please logout instead.' });
        }

        // Delete session ensuring it belongs to user
        const result = await db.delete(sessions)
            .where(
                and(
                    eq(sessions.id, sessionIdToDelete),
                    eq(sessions.userId, userId)
                )
            )
            .returning();

        if (result.length === 0) {
            return res.status(404).json({ error: 'Session not found or already revoked' });
        }

        res.json({ success: true, message: 'Session revoked successfully' });
    } catch (error) {
        console.error('Error revoking session:', error);
        res.status(500).json({ error: 'Failed to revoke session' });
    }
});

export default router;
