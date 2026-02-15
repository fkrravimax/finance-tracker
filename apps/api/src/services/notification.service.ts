import { db } from '../db/index.js';
import { users, transactions, budgets, recurringTransactions, notifications, watchlists } from '../db/schema.js';
import { eq, lte, and, desc } from 'drizzle-orm';
import { cryptoService } from './encryption.service.js';
import { pushService, type PushPayload } from './push.service.js';
import { randomUUID } from 'crypto';

export const notificationService = {
    // --- Persistence Helper ---

    async createAndSend(userId: string, type: string, title: string, message: string, payload: PushPayload, metadata?: any) {
        // 1. Persist to DB
        await db.insert(notifications).values({
            id: randomUUID(),
            userId,
            type,
            title,
            message,
            metadata: metadata ? JSON.stringify(metadata) : undefined,
            isRead: false,
        });

        // 2. Send Push
        await pushService.sendToUser(userId, payload);
    },

    // --- Public API for Frontend ---

    async getNotifications(userId: string, limit = 50, offset = 0) {
        return await db.select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(limit)
            .offset(offset);
    },

    async markAsRead(userId: string, notificationId: string) {
        await db.update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
    },

    async markAllAsRead(userId: string) {
        await db.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.userId, userId));
    },

    // --- Cron Jobs ---

    async sendLunchReminder() {
        console.log('[NOTIFY] Sending lunch reminders...');
        const allUsers = await db.select({ id: users.id, notifyLunch: users.notifyLunch }).from(users);
        const eligibleUsers = allUsers.filter(u => u.notifyLunch !== false);

        const payload: PushPayload = {
            title: 'Waktunya Istirahat! 🍽️',
            body: 'Jangan lupa makan siang dan catat pengeluaranmu hari ini. Tetap semangat! 💪',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'lunch-reminder',
            data: { url: '/', action: 'open-app' },
        };

        for (const user of eligibleUsers) {
            try {
                await this.createAndSend(user.id, 'info', payload.title, payload.body, payload);
            } catch (error) {
                console.error(`[NOTIFY] Lunch reminder failed for ${user.id}:`, error);
            }
        }
    },

    async sendDailySummary() {
        console.log('[NOTIFY] Sending daily summaries...');
        const allUsers = await db.select({ id: users.id, notifyDaily: users.notifyDaily }).from(users);
        const eligibleUsers = allUsers.filter(u => u.notifyDaily === true);

        for (const user of eligibleUsers) {
            try {
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

                // Get budget context
                const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, user.id));
                const budgetLimit = budgetResult[0] ? cryptoService.decryptToNumber(budgetResult[0].limit) : 0;

                const formatNum = (n: number) => n.toLocaleString('id-ID');
                let body = `💰 Masuk: Rp ${formatNum(todayIncome)} | 💸 Keluar: Rp ${formatNum(todayExpense)}`;

                if (budgetLimit > 0) {
                    // Calculate monthly expense
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    let monthlyExpense = 0;
                    allTx.forEach(tx => {
                        const txDate = new Date(tx.date);
                        if (txDate >= startOfMonth && tx.type === 'expense') {
                            monthlyExpense += cryptoService.decryptToNumber(tx.amount);
                        }
                    });
                    const remaining = budgetLimit - monthlyExpense;
                    body += ` | Sisa: Rp ${formatNum(Math.max(0, remaining))}`;
                }

                const payload: PushPayload = {
                    title: 'Rangkuman Harian 📋',
                    body,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'daily-summary',
                    data: { url: '/', action: 'open-app' },
                };

                await this.createAndSend(user.id, 'info', payload.title, payload.body, payload);
            } catch (error) {
                console.error(`[NOTIFY] Daily summary failed for ${user.id}:`, error);
            }
        }
    },

    async checkRecurringReminders() {
        console.log('[NOTIFY] Checking recurring transaction reminders...');
        const allUsers = await db.select({ id: users.id, notifyRecurring: users.notifyRecurring }).from(users);
        const eligibleUsers = allUsers.filter(u => u.notifyRecurring !== false);
        const eligibleUserIds = new Set(eligibleUsers.map(u => u.id));

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        const dueRecurring = await db.select().from(recurringTransactions).where(lte(recurringTransactions.nextDueDate, tomorrow));
        const userRecurrings = new Map<string, string[]>();

        for (const item of dueRecurring) {
            if (!eligibleUserIds.has(item.userId)) continue;
            const nextDue = item.nextDueDate ? new Date(item.nextDueDate) : null;
            if (!nextDue) continue;

            // H-2 Logic (40h - 56h window)
            const rangeStart = new Date(Date.now() + (40 * 60 * 60 * 1000));
            const rangeEnd = new Date(Date.now() + (56 * 60 * 60 * 1000));

            if (nextDue >= rangeStart && nextDue <= rangeEnd) {
                const name = cryptoService.decrypt(item.name);
                if (!userRecurrings.has(item.userId)) userRecurrings.set(item.userId, []);
                userRecurrings.get(item.userId)!.push(name);
            }
        }

        for (const [userId, names] of userRecurrings) {
            try {
                const payload: PushPayload = {
                    title: 'Tagihan H-2! 📅',
                    body: `${names.join(', ')} jatuh tempo dalam 2 hari.`,
                    icon: '/icon-192.png',
                    badge: '/icon-192.png',
                    tag: 'recurring-reminder',
                    data: { url: '/', action: 'open-app' },
                };
                await this.createAndSend(userId, 'bill', payload.title, payload.body, payload);
            } catch (error) {
                console.error(`[NOTIFY] Recurring failed for ${userId}:`, error);
            }
        }
    },

    async checkBudgetAlerts(specificUserId?: string) {
        console.log(`[NOTIFY] Checking budget alerts${specificUserId ? ` for ${specificUserId}` : '...'}`);

        let targetUsers: {
            id: string;
            notifyBudget50: boolean | null;
            notifyBudget80: boolean | null;
            notifyBudget95: boolean | null;
            notifyBudget100: boolean | null;
        }[] = [];

        if (specificUserId) {
            const user = await db.select({
                id: users.id,
                notifyBudget50: users.notifyBudget50,
                notifyBudget80: users.notifyBudget80,
                notifyBudget95: users.notifyBudget95,
                notifyBudget100: users.notifyBudget100,
            }).from(users).where(eq(users.id, specificUserId));
            if (user[0]) targetUsers = [user[0]];
        } else {
            targetUsers = await db.select({
                id: users.id,
                notifyBudget50: users.notifyBudget50,
                notifyBudget80: users.notifyBudget80,
                notifyBudget95: users.notifyBudget95,
                notifyBudget100: users.notifyBudget100,
            }).from(users);
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        for (const user of targetUsers) {
            try {
                const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, user.id));
                if (!budgetResult[0]) continue;

                const budgetLimit = cryptoService.decryptToNumber(budgetResult[0].limit);
                if (budgetLimit <= 0) continue;

                const allTx = await db.select().from(transactions).where(eq(transactions.userId, user.id));
                let monthlyExpense = 0;
                allTx.forEach(tx => {
                    if (new Date(tx.date) >= startOfMonth && tx.type === 'expense') {
                        monthlyExpense += cryptoService.decryptToNumber(tx.amount);
                    }
                });

                const percentage = Math.round((monthlyExpense / budgetLimit) * 100);
                const formatNum = (n: number) => n.toLocaleString('id-ID');

                // Determine highest crossed threshold
                let threshold = 0;
                let alertType: 'warning' | 'error' | null = null;

                if (percentage >= 100 && user.notifyBudget100 !== false) {
                    threshold = 100;
                    alertType = 'error';
                } else if (percentage >= 95 && user.notifyBudget95 !== false) {
                    threshold = 95;
                    alertType = 'warning';
                } else if (percentage >= 80 && user.notifyBudget80 !== false) {
                    threshold = 80;
                    alertType = 'warning';
                } else if (percentage >= 50 && user.notifyBudget50 !== false && percentage < 80) {
                    threshold = 50;
                    alertType = 'warning';
                }

                if (threshold > 0) {
                    // Anti-Spam: Check if we already sent THIS threshold alert this month
                    const existing = await db.select().from(notifications).where(and(
                        eq(notifications.userId, user.id),
                        eq(notifications.type, 'budget')
                    ));

                    const alreadySent = existing.some(n => {
                        try {
                            const meta = JSON.parse(n.metadata || '{}');
                            return meta.threshold === threshold && new Date(n.createdAt) >= startOfMonth;
                        } catch { return false; }
                    });

                    if (!alreadySent) {
                        const title = threshold >= 100 ? 'Budget Habis! 🚨' :
                            threshold >= 95 ? 'Budget Kritis! ⚠️' :
                                threshold >= 80 ? 'Peringatan Budget ⚠️' : 'Info Budget 📊';

                        const body = `Terpakai ${percentage}% (${formatNum(monthlyExpense)}/${formatNum(budgetLimit)}).`;

                        const payload: PushPayload = {
                            title,
                            body,
                            icon: '/icon-192.png',
                            badge: '/icon-192.png',
                            tag: `budget-alert-${threshold}`,
                            data: { url: '/', action: 'open-app' },
                        };

                        await this.createAndSend(user.id, 'budget', title, body, payload, { threshold });
                    }
                }
            } catch (error) {
                console.error(`[NOTIFY] Budget alert check failed for ${user.id}:`, error);
            }
        }
    },

    // Stub for Market Update (to be implemented next)
    async checkMarketUpdates() {
        console.log('[NOTIFY] Market update check triggered (NOT IMPLEMENTED YET)');
    }
};
