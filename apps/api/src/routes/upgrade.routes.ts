import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { upgradeRequests, users } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = Router();

// POST /api/upgrade-requests - User submits upgrade request
router.post('/', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Get current user plan
        const userResult = await db.select({ plan: users.plan }).from(users).where(eq(users.id, userId)).limit(1);
        const currentPlan = userResult[0]?.plan || 'FREE';

        // Check if already platinum
        if (currentPlan === 'PLATINUM') {
            return res.status(400).json({ error: "You are already on Platinum plan" });
        }

        // Check if there's already a pending request
        const existingRequest = await db.select()
            .from(upgradeRequests)
            .where(and(
                eq(upgradeRequests.userId, userId),
                eq(upgradeRequests.status, 'PENDING')
            ))
            .limit(1);

        if (existingRequest.length > 0) {
            return res.status(400).json({ error: "You already have a pending upgrade request" });
        }

        // Create new upgrade request
        const newRequest = await db.insert(upgradeRequests).values({
            userId,
            currentPlan,
            requestedPlan: 'PLATINUM',
            status: 'PENDING',
        }).returning();

        res.status(201).json(newRequest[0]);
    } catch (error) {
        console.error("Error creating upgrade request:", error);
        res.status(500).json({ error: "Failed to create upgrade request" });
    }
});

// GET /api/upgrade-requests/status - User checks their pending request status
router.get('/status', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const pendingRequest = await db.select()
            .from(upgradeRequests)
            .where(and(
                eq(upgradeRequests.userId, userId),
                eq(upgradeRequests.status, 'PENDING')
            ))
            .limit(1);

        if (pendingRequest.length === 0) {
            return res.json({ hasPendingRequest: false });
        }

        res.json({
            hasPendingRequest: true,
            request: pendingRequest[0]
        });
    } catch (error) {
        console.error("Error fetching upgrade request status:", error);
        res.status(500).json({ error: "Failed to fetch upgrade request status" });
    }
});

export default router;
