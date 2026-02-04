
import { Request, Response } from 'express';
import { dashboardService } from '../services/dashboard.service.js';

export const dashboardController = {
    getStats: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const stats = await dashboardService.getStats(userId);
            res.json(stats);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch dashboard stats' });
        }
    },

    getReport: async (req: Request, res: Response) => {
        try {
            const userId = (req as any).user.id;
            const range = req.query.range as any || 'monthly';

            const history = await dashboardService.getMonthlyReport(userId, range);
            const budgetVsReality = await dashboardService.getBudgetVsReality(userId);
            const cashFlow = await dashboardService.getCumulativeCashFlow(userId);

            res.json({
                history,
                budgetVsReality,
                cashFlow
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch dashboard report' });
        }
    }
};
