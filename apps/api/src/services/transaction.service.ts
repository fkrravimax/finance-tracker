import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cryptoService } from "./crypto.service.js";

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
        return result[0];
    }
};
