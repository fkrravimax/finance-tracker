
import { Request, Response } from 'express';
import { budgetService } from '../services/budget.service.js';

export const budgetController = {
    get: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const data = await budgetService.get(userId);
            res.json(data || null);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch budget' });
        }
    },

    set: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { limit } = req.body;
            if (!limit) return res.status(400).json({ error: "Limit is required" });

            const result = await budgetService.createOrUpdate(userId, { limit });
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to set budget' });
        }
    }
};
