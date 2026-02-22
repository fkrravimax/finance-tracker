import { Request, Response } from 'express';
import { transactionService } from '../services/transaction.service.js';

export const transactionController = {
    getAll: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { month, year } = req.query;

            let data;
            if (month !== undefined && year !== undefined) {
                data = await transactionService.getByMonth(
                    userId,
                    parseInt(month as string),
                    parseInt(year as string)
                );
            } else {
                data = await transactionService.getAll(userId);
            }

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
            const payload: any = {};
            if (req.body.merchant) payload.merchant = req.body.merchant;
            if (req.body.category) payload.category = req.body.category;
            if (req.body.amount) payload.amount = req.body.amount.toString();
            if (req.body.date) payload.date = new Date(req.body.date);
            if (req.body.type) payload.type = req.body.type;
            if (req.body.icon) payload.icon = req.body.icon;
            if (req.body.description) payload.description = req.body.description;
            // Do not allow updating id, userId, createdAt, etc.

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
