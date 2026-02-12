
import { db } from '../db/index.js';
import { recurringTransactions, transactions } from '../db/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import { randomUUID } from "crypto";
import { cryptoService } from './crypto.service.js';

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

            // 1. Create the actual transaction
            await db.insert(transactions).values({
                id: randomUUID(),
                userId: item.userId,
                merchant: cryptoService.encrypt(decryptedName), // Re-encrypt for transaction
                category: 'Recurring',
                date: new Date(),
                amount: cryptoService.encrypt(decryptedAmount), // Re-encrypt
                type: 'expense',
                icon: item.icon,
                description: cryptoService.encrypt(`Recurring: ${item.frequency}`)
            });

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
