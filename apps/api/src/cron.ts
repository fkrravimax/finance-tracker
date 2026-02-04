import cron from 'node-cron';
import { recurringService } from './services/recurring.service.js';

export const startCronJobs = () => {
    console.log('[CRON] Initializing Cron Jobs...');

    // Run every day at midnight
    // For testing/demo purposes, we can run it every minute: '* * * * *'
    // But for production logic: '0 0 * * *'
    // The user asked for "setiap tanggalnya" (on each date), so daily check is correct.

    // I will set it to run every minute for verifyability, as requested in the plan "Simulation".
    // But logically it should check if it already ran today? 
    // The service logic "lte(nextDueDate, now)" handles "is it due?". 
    // If it runs every minute, it will catch it the moment it becomes due.
    // Ideally it should update nextDueDate immediately so it doesn't double process.
    // My service does update nextDueDate. So running every minute is safe and responsive.

    cron.schedule('* * * * *', async () => {
        try {
            await recurringService.processDueTransactions();
        } catch (error) {
            console.error('[CRON] Error processing recurring transactions:', error);
        }
    });

    console.log('[CRON] Jobs scheduled: Recurring Transactions (Every Minute check)');
};
