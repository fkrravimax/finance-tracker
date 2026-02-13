import { db } from '../db/index.js';
import { users, transactions, budgets, recurringTransactions } from '../db/schema.js';
import { eq, lte } from 'drizzle-orm';
import { cryptoService } from './encryption.service.js';
import { pushService, type PushPayload } from './push.service.js';

export const notificationService = {
    /**
     * Lunch Reminder — Sent daily at 12:00 PM WIB
     * "Sudah waktunya istirahat! 🍽️ Jangan lupa makan siang dan catat pengeluaranmu hari ini."
     */
    async sendLunchReminder() {
        console.log('[NOTIFY] Sending lunch reminders...');

        const allUsers = await db.select({
            id: users.id,
            notifyLunch: users.notifyLunch,
        }).from(users);

        const eligibleUsers = allUsers.filter(u => u.notifyLunch !== false);

        const payload: PushPayload = {
            title: 'Waktunya Istirahat! 🍽️',
            body: 'Jangan lupa makan siang dan catat pengeluaranmu hari ini. Tetap semangat! 💪',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'lunch-reminder',
            data: {
                url: '/',
                action: 'open-app',
            },
        };

        for (const user of eligibleUsers) {
            try {
                await pushService.sendToUser(user.id, payload);
            } catch (error) {
                console.error(`[NOTIFY] Lunch reminder failed for ${user.id}:`, error);
            }
        }

        console.log(`[NOTIFY] Lunch reminders sent to ${eligibleUsers.length} users.`);
    },

    /**
     * Daily Summary — Sent daily at 8:00 PM WIB
     * Shows today's income, expense, and remaining budget
     */
    async sendDailySummary() {
        console.log('[NOTIFY] Sending daily summaries...');

        const allUsers = await db.select({
            id: users.id,
            notifyDaily: users.notifyDaily,
        }).from(users);

        const eligibleUsers = allUsers.filter(u => u.notifyDaily === true);

        for (const user of eligibleUsers) {
            try {
                // Get today's transactions
                const allTx = await db.select().from(transactions).where(eq(transactions.userId, user.id));

                const today = new Date();
                const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

                let todayIncome = 0;
                let todayExpense = 0;

                allTx.forEach(tx => {
                    const txDate = new Date(tx.date);
                    if (txDate >= startOfDay && txDate < endOfDay) {
                        const amount = cryptoService.decryptToNumber(tx.amount);
                        if (tx.type === 'income') todayIncome += amount;
                        if (tx.type === 'expense') todayExpense += amount;
                    }
                });

                // Get budget info
                const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, user.id));
                const budgetLimit = budgetResult[0] ? cryptoService.decryptToNumber(budgetResult[0].limit) : 0;

                // Calculate monthly expense for budget context
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                let monthlyExpense = 0;
                allTx.forEach(tx => {
                    const txDate = new Date(tx.date);
                    if (txDate >= startOfMonth && tx.type === 'expense') {
                        monthlyExpense += cryptoService.decryptToNumber(tx.amount);
                    }
                });

                const remaining = budgetLimit > 0 ? budgetLimit - monthlyExpense : 0;
                const formatNum = (n: number) => n.toLocaleString('id-ID');

                let body = `💰 Pemasukan: Rp ${formatNum(todayIncome)} | 💸 Pengeluaran: Rp ${formatNum(todayExpense)}`;
                if (budgetLimit > 0) {
                    body += ` | 📊 Sisa budget: Rp ${formatNum(Math.max(0, remaining))}`;
                }

                const payload: PushPayload = {
                    title: 'Rangkuman Keuangan Hari Ini 📋',
                    body,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'daily-summary',
                    data: { url: '/', action: 'open-app' },
                };

                await pushService.sendToUser(user.id, payload);
            } catch (error) {
                console.error(`[NOTIFY] Daily summary failed for ${user.id}:`, error);
            }
        }

        console.log(`[NOTIFY] Daily summaries sent to ${eligibleUsers.length} users.`);
    },

    /**
     * Recurring Transaction Reminder — Sent daily at 8:00 AM WIB
     * Notifies users about recurring transactions due tomorrow
     */
    async checkRecurringReminders() {
        console.log('[NOTIFY] Checking recurring transaction reminders...');

        const allUsers = await db.select({
            id: users.id,
            notifyRecurring: users.notifyRecurring,
        }).from(users);

        const eligibleUsers = allUsers.filter(u => u.notifyRecurring !== false);
        const eligibleUserIds = new Set(eligibleUsers.map(u => u.id));

        // Find recurring transactions due tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueRecurring = await db.select()
            .from(recurringTransactions)
            .where(lte(recurringTransactions.nextDueDate, tomorrow));

        // Group by user
        const userRecurrings = new Map<string, string[]>();
        for (const item of dueRecurring) {
            if (!eligibleUserIds.has(item.userId)) continue;

            const nextDue = item.nextDueDate ? new Date(item.nextDueDate) : null;
            if (!nextDue) continue;

            // Only notify for items due tomorrow (not past due ones being processed)
            const tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setHours(0, 0, 0, 0);
            const tomorrowEnd = new Date(tomorrowStart);
            tomorrowEnd.setHours(23, 59, 59, 999);

            if (nextDue >= tomorrowStart && nextDue <= tomorrowEnd) {
                const name = cryptoService.decrypt(item.name);
                if (!userRecurrings.has(item.userId)) {
                    userRecurrings.set(item.userId, []);
                }
                userRecurrings.get(item.userId)!.push(name);
            }
        }

        for (const [userId, names] of userRecurrings) {
            try {
                const namelist = names.join(', ');
                const payload: PushPayload = {
                    title: 'Tagihan Jatuh Tempo Besok! 📅',
                    body: `${namelist} akan jatuh tempo besok. Pastikan saldo mencukupi!`,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'recurring-reminder',
                    data: { url: '/', action: 'open-app' },
                };

                await pushService.sendToUser(userId, payload);
            } catch (error) {
                console.error(`[NOTIFY] Recurring reminder failed for ${userId}:`, error);
            }
        }

        console.log(`[NOTIFY] Recurring reminders sent to ${userRecurrings.size} users.`);
    },

    /**
     * Budget Alert — Sent daily at 9:00 AM WIB
     * Notifies when monthly expense reaches 50% or 80% of budget
     */
    async checkBudgetAlerts() {
        console.log('[NOTIFY] Checking budget alerts...');

        const allUsers = await db.select({
            id: users.id,
            notifyBudget50: users.notifyBudget50,
            notifyBudget80: users.notifyBudget80,
        }).from(users);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        for (const user of allUsers) {
            try {
                // Get budget
                const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, user.id));
                if (!budgetResult[0]) continue;

                const budgetLimit = cryptoService.decryptToNumber(budgetResult[0].limit);
                if (budgetLimit <= 0) continue;

                // Get monthly expense
                const allTx = await db.select().from(transactions).where(eq(transactions.userId, user.id));
                let monthlyExpense = 0;

                allTx.forEach(tx => {
                    const txDate = new Date(tx.date);
                    if (txDate >= startOfMonth && tx.type === 'expense') {
                        monthlyExpense += cryptoService.decryptToNumber(tx.amount);
                    }
                });

                const percentage = Math.round((monthlyExpense / budgetLimit) * 100);
                const formatNum = (n: number) => n.toLocaleString('id-ID');

                // 80% alert
                if (percentage >= 80 && user.notifyBudget80 !== false) {
                    const payload: PushPayload = {
                        title: 'Peringatan Budget! ⚠️',
                        body: `Kamu sudah menggunakan ${percentage}% budget bulan ini (Rp ${formatNum(monthlyExpense)} dari Rp ${formatNum(budgetLimit)}). Hati-hati ya!`,
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        tag: 'budget-alert-80',
                        data: { url: '/', action: 'open-app' },
                    };
                    await pushService.sendToUser(user.id, payload);
                }
                // 50% alert (only if not already at 80%)
                else if (percentage >= 50 && percentage < 80 && user.notifyBudget50 !== false) {
                    const payload: PushPayload = {
                        title: 'Info Budget 📊',
                        body: `Kamu sudah menggunakan ${percentage}% budget bulan ini (Rp ${formatNum(monthlyExpense)} dari Rp ${formatNum(budgetLimit)}). Tetap bijak mengatur keuangan!`,
                        icon: '/icon-192.png',
                        badge: '/icon-192.png',
                        tag: 'budget-alert-50',
                        data: { url: '/', action: 'open-app' },
                    };
                    await pushService.sendToUser(user.id, payload);
                }
            } catch (error) {
                console.error(`[NOTIFY] Budget alert failed for ${user.id}:`, error);
            }
        }

        console.log('[NOTIFY] Budget alerts check completed.');
    },
};
