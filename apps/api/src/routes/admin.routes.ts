
import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { users, upgradeRequests, sessions, accounts, wallets, transactions, savingsGoals, budgets, recurringTransactions, trades } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { pushService, type PushPayload } from '../services/push.service.js';

const router = Router();

// Apply admin middleware to all routes in this router
router.use(adminMiddleware);

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response) => {
    try {
        const allUsers = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            plan: users.plan,
            createdAt: users.createdAt,
            image: users.image,
        }).from(users);
        res.json(allUsers);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role, plan } = req.body;

        if (!role && !plan) {
            return res.status(400).json({ error: "Role or plan must be provided" });
        }

        const updateData: any = {};
        if (role) updateData.role = role;
        if (plan) updateData.plan = plan;

        await db.update(users)
            .set(updateData)
            .where(eq(users.id, id as string));

        const updatedUser = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            role: users.role,
            plan: users.plan,
            createdAt: users.createdAt,
            image: users.image,
        }).from(users).where(eq(users.id, id as string)).limit(1);

        res.json(updatedUser[0]);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});

// GET /api/admin/upgrade-requests - Get all pending upgrade requests
router.get('/upgrade-requests', async (req: Request, res: Response) => {
    try {
        const requests = await db.select({
            id: upgradeRequests.id,
            userId: upgradeRequests.userId,
            currentPlan: upgradeRequests.currentPlan,
            requestedPlan: upgradeRequests.requestedPlan,
            status: upgradeRequests.status,
            createdAt: upgradeRequests.createdAt,
            userName: users.name,
            userEmail: users.email,
        })
            .from(upgradeRequests)
            .leftJoin(users, eq(upgradeRequests.userId, users.id))
            .where(eq(upgradeRequests.status, 'PENDING'))
            .orderBy(desc(upgradeRequests.createdAt));

        res.json(requests);
    } catch (error) {
        console.error("Error fetching upgrade requests:", error);
        res.status(500).json({ error: "Failed to fetch upgrade requests" });
    }
});

// PATCH /api/admin/upgrade-requests/:id - Approve or reject upgrade request
router.patch('/upgrade-requests/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'approve' or 'reject'

        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ error: "Action must be 'approve' or 'reject'" });
        }

        // Get the upgrade request
        const request = await db.select()
            .from(upgradeRequests)
            .where(eq(upgradeRequests.id, id as string))
            .limit(1);

        if (request.length === 0) {
            return res.status(404).json({ error: "Upgrade request not found" });
        }

        const upgradeRequest = request[0];

        if (upgradeRequest.status !== 'PENDING') {
            return res.status(400).json({ error: "This request has already been processed" });
        }

        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

        // Update the upgrade request status
        await db.update(upgradeRequests)
            .set({
                status: newStatus,
                updatedAt: new Date()
            })
            .where(eq(upgradeRequests.id, id as string));

        // If approved, update the user's plan
        if (action === 'approve') {
            await db.update(users)
                .set({
                    plan: upgradeRequest.requestedPlan,
                    updatedAt: new Date()
                })
                .where(eq(users.id, upgradeRequest.userId));
        }

        res.json({
            success: true,
            message: action === 'approve'
                ? 'User has been upgraded to ' + upgradeRequest.requestedPlan
                : 'Upgrade request has been rejected'
        });
    } catch (error) {
        console.error("Error processing upgrade request:", error);
        res.status(500).json({ error: "Failed to process upgrade request" });
    }
});

// POST /api/admin/notifications/broadcast - Send push notification to all users
router.post('/notifications/broadcast', async (req: Request, res: Response) => {
    try {
        const { title, body, url } = req.body;

        if (!body) {
            return res.status(400).json({ error: "Message body is required" });
        }

        // Get all users who have enabled info notifications
        const eligibleUsers = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.notifyInfo, true));

        console.log(`[DEBUG] Eligible users count: ${eligibleUsers.length}`);

        const userIds = eligibleUsers.map(u => u.id);

        if (userIds.length === 0) {
            console.log('[DEBUG] No eligible users found for broadcast');
            return res.json({ success: true, message: "No users subscribed to info notifications", count: 0 });
        }

        const payload: PushPayload = {
            title: title || 'Info Admin 📢',
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'admin-broadcast-' + Date.now(),
            data: {
                url: url || '/',
                action: 'open-app',
            },
        };

        // Send in background to avoid blocking response for too long
        pushService.sendToMultipleUsers(userIds, payload)
            .then(results => {
                console.log('[DEBUG] Broadcast results:', JSON.stringify(results));
            })
            .catch(err =>
                console.error("[ADMIN] Broadcast failed:", err)
            );

        res.json({
            success: true,
            message: `Broadcast queued for ${userIds.length} users`,
            count: userIds.length
        });
    } catch (error) {
        console.error("Error sending broadcast:", error);
        res.status(500).json({ error: "Failed to send broadcast" });
    }
});

// DELETE /api/admin/users/:id - Delete a user and all their data
router.delete('/users/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminUser = (req as any).user;

        // Prevent admin from deleting themselves
        if (adminUser.id === id) {
            return res.status(400).json({ error: "You cannot delete your own account" });
        }

        // Check if user exists
        const [targetUser] = await db.select({ id: users.id, name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, id as string))
            .limit(1);

        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Delete all user data in order (child tables first)
        await db.delete(trades).where(eq(trades.userId, id as string));
        await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, id as string));
        await db.delete(budgets).where(eq(budgets.userId, id as string));
        await db.delete(savingsGoals).where(eq(savingsGoals.userId, id as string));
        await db.delete(transactions).where(eq(transactions.userId, id as string));
        await db.delete(wallets).where(eq(wallets.userId, id as string));
        await db.delete(upgradeRequests).where(eq(upgradeRequests.userId, id as string));
        await db.delete(sessions).where(eq(sessions.userId, id as string));
        await db.delete(accounts).where(eq(accounts.userId, id as string));

        // Finally, delete the user
        await db.delete(users).where(eq(users.id, id as string));

        console.log(`Admin ${adminUser.email} deleted user ${targetUser.email} (${id})`);

        res.json({
            success: true,
            message: `User ${targetUser.name} (${targetUser.email}) has been deleted`
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;
