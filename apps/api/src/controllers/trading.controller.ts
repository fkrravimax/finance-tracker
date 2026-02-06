import { Request, Response } from 'express';
import { tradingService } from '../services/trading.service.js';

export const tradingController = {
    createTrade: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const result = await tradingService.createTrade(userId, req.body);
            res.json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to log trade' });
        }
    },

    getTrades: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const trades = await tradingService.getTrades(userId);
            res.json(trades);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch trades' });
        }
    },

    getStats: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const stats = await tradingService.getStats(userId);
            res.json(stats);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    },

    withdraw: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const { amount } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }
            const result = await tradingService.withdraw(userId, parseFloat(amount));
            res.json(result);
        } catch (error: any) {
            console.error(error);
            if (error.message === "Insufficient trading balance") {
                return res.status(400).json({ error: error.message });
            }
            res.status(500).json({ error: 'Failed to withdraw funds' });
        }
    }
};
