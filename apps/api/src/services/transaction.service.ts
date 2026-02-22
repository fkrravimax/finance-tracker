import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, desc, and, gte, lt } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cryptoService } from "./encryption.service.js";

import { notificationService } from './notification.service.js';

export const transactionService = {
    async getAll(userId: string) {
        const rawTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));

        return rawTransactions.map(t => ({
            ...t,
            amount: cryptoService.decryptToNumber(t.amount), // Decrypting amount
            merchant: cryptoService.decrypt(t.merchant), // Decrypting merchant
            description: cryptoService.decrypt(t.description || '') // Decrypting description
        }));
    },

    async getByMonth(userId: string, month: number, year: number) {
        const startOfMonth = new Date(year, month, 1);
        const startOfNextMonth = new Date(year, month + 1, 1);

        const rawTransactions = await db.select()
            .from(transactions)
            .where(and(
                eq(transactions.userId, userId),
                gte(transactions.date, startOfMonth),
                lt(transactions.date, startOfNextMonth)
            ))
            .orderBy(desc(transactions.date));

        return rawTransactions.map(t => ({
            ...t,
            amount: cryptoService.decryptToNumber(t.amount),
            merchant: cryptoService.decrypt(t.merchant),
            description: cryptoService.decrypt(t.description || '')
        }));
    },

    async create(userId: string, data: typeof transactions.$inferInsert) {
        // Force userId and id
        const newTransaction = {
            ...data,
            userId,
            id: randomUUID(),
            amount: cryptoService.encrypt(data.amount), // Encrypt amount
            merchant: cryptoService.encrypt(data.merchant), // Encrypt merchant
            description: cryptoService.encrypt(data.description || ''), // Encrypt description
            // Ensure walletId is present if possible, or it will be null and caught by migration later
        };
        const result = await db.insert(transactions).values(newTransaction).returning();

        // Trigger Real-time Budget Check
        // we don't await this to keep UI fast
        notificationService.checkBudgetAlerts(userId).catch(err => console.error(err));

        const t = result[0];
        return {
            ...t,
            amount: cryptoService.decryptToNumber(t.amount),
            merchant: cryptoService.decrypt(t.merchant),
            description: cryptoService.decrypt(t.description || '')
        };
    },

    async update(userId: string, id: string, data: Partial<typeof transactions.$inferInsert>) {
        const updateData: any = { ...data, updatedAt: new Date() };

        if (data.amount !== undefined) updateData.amount = cryptoService.encrypt(data.amount);
        if (data.merchant !== undefined) updateData.merchant = cryptoService.encrypt(data.merchant);
        if (data.description !== undefined) updateData.description = cryptoService.encrypt(data.description || '');

        const result = await db.update(transactions)
            .set(updateData)
            .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
            .returning();

        // Trigger Real-time Budget Check
        notificationService.checkBudgetAlerts(userId).catch(err => console.error(err));

        const t = result[0];
        if (!t) return null;

        return {
            ...t,
            amount: cryptoService.decryptToNumber(t.amount),
            merchant: cryptoService.decrypt(t.merchant),
            description: cryptoService.decrypt(t.description || '')
        };
    },

    async delete(userId: string, id: string) {
        const result = await db.delete(transactions)
            .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
            .returning();

        // Trigger Real-time Budget Check (in case they go back under budget?)
        // Useful if we add logic later to "clear" alerts, but harmless now.
        notificationService.checkBudgetAlerts(userId).catch(err => console.error(err));

        return result[0];
    }
};
