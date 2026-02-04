import { Router, Request, Response } from 'express';
import { resetService } from '../services/reset.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Reset All Data
router.post('/', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = res.locals.user.id;
        const result = await resetService.resetUserData(userId);
        res.json(result);
    } catch (error) {
        console.error("Reset error", error);
        res.status(500).json({ error: 'Failed to reset data' });
    }
});

export const resetRoutes = router;
