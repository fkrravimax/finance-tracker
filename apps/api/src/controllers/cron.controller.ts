import { Request, Response } from 'express';
import { recurringService } from '../services/recurring.service.js';
import { notificationService } from '../services/notification.service.js';

export const cronController = {
    handleCron: async (req: Request, res: Response) => {
        // 1. Secure the endpoint
        const authHeader = req.headers.authorization;
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { job } = req.query;

        console.log(`[CRON] Received Vercel trigger for job: ${job}`);

        try {
            switch (job) {
                case 'process-recurring':
                    await recurringService.processDueTransactions();
                    break;
                case 'lunch-reminder':
                    await notificationService.sendLunchReminder();
                    break;
                case 'daily-summary':
                    await notificationService.sendDailySummary();
                    break;
                case 'recurring-reminder':
                    await notificationService.checkRecurringReminders();
                    break;
                case 'budget-alert':
                    await notificationService.checkBudgetAlerts();
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid job type' });
            }

            return res.json({ status: 'success', job });
        } catch (error: any) {
            console.error(`[CRON] Error executing job ${job}:`, error);
            return res.status(500).json({ error: error.message });
        }
    }
};
