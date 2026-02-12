import cron from 'node-cron';
import { recurringService } from './services/recurring.service.js';

export const startCronJobs = () => {
    console.log('[CRON] Initializing Cron Jobs...');

    // Run every day at midnight to process due recurring transactions.
    // The service logic uses "lte(nextDueDate, now)" to check if a transaction is due,
    // and immediately updates nextDueDate after processing to prevent double execution.
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running daily recurring transaction check...');
        try {
            await recurringService.processDueTransactions();
        } catch (error) {
            console.error('[CRON] Error processing recurring transactions:', error);
        }
    });

    console.log('[CRON] Jobs scheduled: Recurring Transactions (Daily at midnight)');
};

