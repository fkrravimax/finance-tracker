import { db } from '../db/index.js';
import { transactions } from '../db/schema.js';
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const transactionService = {
    async getAll(userId: string) {
        return await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));
    },

    async create(userId: string, data: typeof transactions.$inferInsert) {
        // Force userId and id
        const newTransaction = {
            ...data,
            userId,
            id: randomUUID(),
        };
        const result = await db.insert(transactions).values(newTransaction).returning();
        return result[0];
    },

    async update(userId: string, id: string, data: Partial<typeof transactions.$inferInsert>) {
        const result = await db.update(transactions)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
            .returning();
        return result[0];
    },

    async delete(userId: string, id: string) {
        const result = await db.delete(transactions)
            .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
            .returning();
        return result[0];
    }
};
