import { Router, Request, Response } from 'express';
import { recurringService } from '../services/recurring.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Get All
router.get('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const data = await recurringService.getAll(userId);
        res.json(data);
    } catch (error) {
        console.error("Error fetching recurring transactions:", error);
        res.status(500).json({ error: 'Failed to fetch recurring transactions' });
    }
});

// Create
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        console.log("Creating recurring transaction with payload:", req.body);
        const data = await recurringService.create(userId, req.body);
        res.json(data);
    } catch (error) {
        console.error("Error creating recurring transaction:", error);
        res.status(500).json({ error: 'Failed to create recurring transaction' });
    }
});

// Delete
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const { id } = req.params;
        if (typeof id !== 'string') {
            res.status(400).json({ error: 'Invalid ID' });
            return;
        }
        await recurringService.delete(userId, id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete recurring transaction' });
    }
});

export const recurringRoutes = router;
