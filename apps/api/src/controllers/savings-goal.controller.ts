import { Request, Response } from 'express';
import { savingsGoalService } from '../services/savings-goal.service';

export const savingsGoalController = {
    getAll: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const data = await savingsGoalService.getAll(userId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch savings goals' });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const result = await savingsGoalService.create(userId, {
                ...req.body,
                targetAmount: req.body.targetAmount.toString(),
                targetDate: new Date(req.body.targetDate),
            });
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create savings goal' });
        }
    },

    updateAmount: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            const { amount, type } = req.body; // type: 'deposit' | 'withdraw'

            const result = await savingsGoalService.updateAmount(userId, id, Number(amount), type);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: 'Failed to update savings goal' });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params;
            await savingsGoalService.delete(userId, id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete savings goal' });
        }
    }
};
