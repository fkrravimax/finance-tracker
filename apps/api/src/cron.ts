import cron from 'node-cron';
import { recurringService } from './services/recurring.service.js';
import { notificationService } from './services/notification.service.js';

export const startCronJobs = () => {
    console.log('[CRON] Initializing Cron Jobs...');

    // Run every day at midnight to process due recurring transactions.
    cron.schedule('0 0 * * *', async () => {
        console.log('[CRON] Running daily recurring transaction check...');
        try {
            await recurringService.processDueTransactions();
        } catch (error) {
            console.error('[CRON] Error processing recurring transactions:', error);
        }
    }, { timezone: 'Asia/Jakarta' });

    // 🍽️ Lunch Reminder — Every day at 12:00 PM WIB
    cron.schedule('0 12 * * *', async () => {
        console.log('[CRON] Running lunch reminder...');
        try {
            await notificationService.sendLunchReminder();
        } catch (error) {
            console.error('[CRON] Error sending lunch reminders:', error);
        }
    }, { timezone: 'Asia/Jakarta' });

    // 📋 Daily Summary — Every day at 8:00 PM WIB
    cron.schedule('0 20 * * *', async () => {
        console.log('[CRON] Running daily summary...');
        try {
            await notificationService.sendDailySummary();
        } catch (error) {
            console.error('[CRON] Error sending daily summaries:', error);
        }
    }, { timezone: 'Asia/Jakarta' });

    // 📅 Recurring Transaction Reminder — Every day at 8:00 AM WIB
    cron.schedule('0 8 * * *', async () => {
        console.log('[CRON] Running recurring transaction reminder...');
        try {
            await notificationService.checkRecurringReminders();
        } catch (error) {
            console.error('[CRON] Error checking recurring reminders:', error);
        }
    }, { timezone: 'Asia/Jakarta' });

    // 📊 Budget Alert — Every day at 9:00 AM WIB
    cron.schedule('0 9 * * *', async () => {
        console.log('[CRON] Running budget alert check...');
        try {
            await notificationService.checkBudgetAlerts();
        } catch (error) {
            console.error('[CRON] Error checking budget alerts:', error);
        }
    }, { timezone: 'Asia/Jakarta' });

    console.log('[CRON] Jobs scheduled:');
    console.log('  - Recurring Transactions (Daily at midnight WIB)');
    console.log('  - Lunch Reminder (Daily at 12:00 PM WIB)');
    console.log('  - Daily Summary (Daily at 8:00 PM WIB)');
    console.log('  - Recurring Reminder (Daily at 8:00 AM WIB)');
    console.log('  - Budget Alert (Daily at 9:00 AM WIB)');
};
