
import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { adminMiddleware } from '../middleware/admin.middleware.js';

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

export default router;
