
import { db } from '../db/index.js';
import { savingsGoals } from '../db/schema.js';
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cryptoService } from './crypto.service.js';

export const savingsGoalService = {
    async getAll(userId: string) {
        const raw = await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
        return raw.map(g => ({
            ...g,
            name: cryptoService.decrypt(g.name),
            targetAmount: cryptoService.decryptToNumber(g.targetAmount),
            currentAmount: cryptoService.decryptToNumber(g.currentAmount)
        }));
    },

    async create(userId: string, data: typeof savingsGoals.$inferInsert) {
        const newGoal = {
            ...data,
            userId,
            id: randomUUID(),
            name: cryptoService.encrypt(data.name),
            targetAmount: cryptoService.encrypt(data.targetAmount),
            currentAmount: cryptoService.encrypt(data.currentAmount || "0"),
        };
        const result = await db.insert(savingsGoals).values(newGoal).returning();

        return {
            ...result[0],
            name: cryptoService.decrypt(result[0].name),
            targetAmount: cryptoService.decryptToNumber(result[0].targetAmount),
            currentAmount: cryptoService.decryptToNumber(result[0].currentAmount)
        };
    },

    async updateAmount(userId: string, id: string, amount: number, type: 'deposit' | 'withdraw') {
        // Fetch first
        const [goal] = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));

        if (!goal) throw new Error("Goal not found");

        const current = cryptoService.decryptToNumber(goal.currentAmount);
        const newAmount = type === 'deposit' ? current + amount : current - amount;

        if (newAmount < 0) throw new Error("Insufficient funds");

        const result = await db.update(savingsGoals)
            .set({
                currentAmount: cryptoService.encrypt(newAmount),
                updatedAt: new Date()
            })
            .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
            .returning();

        return {
            ...result[0],
            name: cryptoService.decrypt(result[0].name),
            targetAmount: cryptoService.decryptToNumber(result[0].targetAmount),
            currentAmount: cryptoService.decryptToNumber(result[0].currentAmount)
        };
    },

    async delete(userId: string, id: string) {
        const result = await db.delete(savingsGoals)
            .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
            .returning();
        return result[0];
    }
};
