
import { db } from '../db/index.js';
import { recurringTransactions, transactions } from '../db/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import { randomUUID } from "crypto";
import { cryptoService } from './encryption.service.js';
import { transactionService } from './transaction.service.js';
import { aggregateService } from './aggregate.service.js';

export const recurringService = {
    async getAll(userId: string) {
        const raw = await db.select().from(recurringTransactions).where(eq(recurringTransactions.userId, userId));
        return raw.map(t => ({
            ...t,
            name: cryptoService.decrypt(t.name),
            amount: cryptoService.decryptToNumber(t.amount)
        }));
    },

    async create(userId: string, data: typeof recurringTransactions.$inferInsert) {
        // Calculate next due date logic
        const now = new Date();
        const nextDue = new Date();
        const day = data.date;

        if (data.frequency === 'Monthly') {
            nextDue.setDate(day);
            if (now.getDate() > day) {
                nextDue.setMonth(nextDue.getMonth() + 1);
            }
        } else if (data.frequency === 'Weekly') {
            nextDue.setDate(day);
            if (now.getDate() > day) {
                nextDue.setDate(nextDue.getDate() + 7);
            }
        }
        // ... (Yearly logic omitted for brevity as per previous file, or defaults)

        const [newRecurring] = await db.insert(recurringTransactions).values({
            ...data,
            userId,
            id: randomUUID(),
            name: cryptoService.encrypt(data.name),
            amount: cryptoService.encrypt(data.amount),
            nextDueDate: nextDue
        }).returning();

        return {
            ...newRecurring,
            name: cryptoService.decrypt(newRecurring.name),
            amount: cryptoService.decryptToNumber(newRecurring.amount)
        };
    },

    async delete(userId: string, id: string) {
        await db.delete(recurringTransactions).where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));
    },

    // To be called by CRON job
    async processDueTransactions() {
        console.log('[CRON] Checking for due recurring transactions...');
        const now = new Date();

        // 1. Fetch all potential candidates (we can't filter by encrypted fields, but nextDueDate is NOT encrypted, so this is fine!)
        const due = await db.select().from(recurringTransactions).where(lte(recurringTransactions.nextDueDate, now));

        for (const item of due) {
            console.log(`[CRON] Processing recurring: ${item.id} for user ${item.userId}`);

            const decryptedName = cryptoService.decrypt(item.name);
            const decryptedAmount = cryptoService.decryptToNumber(item.amount);
            const type = 'expense'; // Recurring transactions currently only support expenses in schema

            // Prepare Aggregates
            const date = new Date();
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            // 1. Monthly
            let monthlyAgg = await aggregateService.getMonthly(item.userId, monthKey);
            let mIncome = 0, mExpense = 0, mVersion = 1;
            if (monthlyAgg) {
                mIncome = cryptoService.decryptToNumber(monthlyAgg.income);
                mExpense = cryptoService.decryptToNumber(monthlyAgg.expense);
                mVersion = monthlyAgg.version + 1;
            }
            // type is always expense for now
            mExpense += decryptedAmount;

            // 2. Daily
            let dailyAgg = await aggregateService.getDaily(item.userId, dayKey);
            let dIncome = 0, dExpense = 0;
            if (dailyAgg) {
                dIncome = cryptoService.decryptToNumber(dailyAgg.income);
                dExpense = cryptoService.decryptToNumber(dailyAgg.expense);
            }
            // type is always expense
            dExpense += decryptedAmount;

            // 3. Category
            const category = 'Recurring';
            let catAggs = await aggregateService.getCategories(item.userId, monthKey);
            let targetCat = catAggs.find(c => c.category === category && c.type === type);
            let cAmount = 0;
            if (targetCat) {
                cAmount = cryptoService.decryptToNumber(targetCat.amount);
            }
            cAmount += decryptedAmount;

            const aggregates = {
                monthly: {
                    monthKey,
                    income: cryptoService.encrypt(mIncome.toString()),
                    expense: cryptoService.encrypt(mExpense.toString()),
                    version: mVersion
                },
                daily: {
                    dayKey,
                    income: cryptoService.encrypt(dIncome.toString()),
                    expense: cryptoService.encrypt(dExpense.toString())
                },
                category: {
                    monthKey,
                    category,
                    type,
                    amount: cryptoService.encrypt(cAmount.toString())
                }
            };

            // Call TransactionService to create transaction + update aggregates + update wallet
            await transactionService.create(item.userId, {
                amount: decryptedAmount.toString(),
                merchant: decryptedName,
                category: category,
                date: now,
                type: type,
                icon: item.icon,
                description: `Recurring: ${item.frequency}`,
                // walletId: null - implicitly null
            } as any, aggregates);

            // 2. Update nextDueDate
            const nextDate = new Date(item.nextDueDate || now);

            if (item.frequency === 'Monthly') {
                nextDate.setMonth(nextDate.getMonth() + 1);
            } else if (item.frequency === 'Weekly') {
                nextDate.setDate(nextDate.getDate() + 7);
            } else if (item.frequency === 'Yearly') {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }

            await db.update(recurringTransactions)
                .set({ nextDueDate: nextDate, updatedAt: new Date() })
                .where(eq(recurringTransactions.id, item.id));
        }
    }
};
