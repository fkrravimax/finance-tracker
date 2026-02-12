import { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service.js';

export const transactionController = {
    getAll: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const data = await transactionService.getAll(userId);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch transactions' });
        }
    },

    create: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const payload = {
                ...req.body,
                date: new Date(req.body.date), // Ensure date is Date object
                amount: req.body.amount.toString(), // Ensure amount is string for decimal
            };
            const result = await transactionService.create(userId, payload);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to create transaction' });
        }
    },

    update: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params as { id: string };
            const payload = {
                ...req.body,
                date: req.body.date ? new Date(req.body.date) : undefined,
                amount: req.body.amount ? req.body.amount.toString() : undefined,
            };

            const result = await transactionService.update(userId, id, payload);

            if (!result) {
                return res.status(404).json({ error: 'Transaction not found' });
            }

            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to update transaction' });
        }
    },

    delete: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { id } = req.params as { id: string };
            await transactionService.delete(userId, id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete transaction' });
        }
    }
};
