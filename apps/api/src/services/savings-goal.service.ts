import { db } from '../db/index.js';
import { savingsGoals } from '../db/schema.js';
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const savingsGoalService = {
    async getAll(userId: string) {
        return await db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId));
    },

    async create(userId: string, data: typeof savingsGoals.$inferInsert) {
        const newGoal = {
            ...data,
            userId,
            id: randomUUID(),
            currentAmount: data.currentAmount || "0",
        };
        const result = await db.insert(savingsGoals).values(newGoal).returning();
        return result[0];
    },

    async updateAmount(userId: string, id: string, amount: number, type: 'deposit' | 'withdraw') {
        const goal = await db.query.savingsGoals.findFirst({
            where: and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))
        });

        if (!goal) throw new Error("Goal not found");

        const current = Number(goal.currentAmount);
        const newAmount = type === 'deposit' ? current + amount : current - amount;

        if (newAmount < 0) throw new Error("Insufficient funds");

        const result = await db.update(savingsGoals)
            .set({ currentAmount: newAmount.toString(), updatedAt: new Date() })
            .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
            .returning();

        return result[0];
    },

    async delete(userId: string, id: string) {
        const result = await db.delete(savingsGoals)
            .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)))
            .returning();
        return result[0];
    }
};
