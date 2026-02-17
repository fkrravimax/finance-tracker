
import { Request, Response } from 'express';
import { aggregateService } from '../services/aggregate.service.js';

export const aggregateController = {
    getMonthly: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { monthKey } = req.query;

            if (monthKey) {
                const data = await aggregateService.getMonthly(userId, monthKey as string);
                res.json(data);
            } else {
                const data = await aggregateService.getAllMonthly(userId);
                res.json(data);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch monthly aggregates' });
        }
    },

    getDaily: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { dayKey, from, to } = req.query;

            if (dayKey) {
                const data = await aggregateService.getDaily(userId, dayKey as string);
                res.json(data);
            } else if (from && to) {
                const data = await aggregateService.getDailyRange(userId, from as string, to as string);
                res.json(data);
            } else {
                return res.status(400).json({ error: 'dayKey OR (from, to) parameters are required' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch daily aggregates' });
        }
    },

    getCategories: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { monthKey } = req.query;

            if (!monthKey) {
                return res.status(400).json({ error: 'monthKey is required' });
            }

            const data = await aggregateService.getCategories(userId, monthKey as string);
            res.json(data);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch category aggregates' });
        }
    }
};
