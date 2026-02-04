
import { db } from "../db";
import { budgets } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const budgetService = {
    async get(userId: string) {
        // Assuming single budget per user for now based on "Monthly Budget" UI
        const result = await db.select().from(budgets).where(eq(budgets.userId, userId));
        return result[0]; // Return the first budget found
    },

    async createOrUpdate(userId: string, data: { limit: number }) {
        const existing = await this.get(userId);

        if (existing) {
            const result = await db.update(budgets)
                .set({
                    limit: data.limit.toString(),
                    updatedAt: new Date()
                })
                .where(eq(budgets.id, existing.id))
                .returning();
            return result[0];
        } else {
            const result = await db.insert(budgets).values({
                id: randomUUID(),
                userId,
                name: "Monthly Budget",
                limit: data.limit.toString(),
                icon: "account_balance_wallet",
            }).returning();
            return result[0];
        }
    }
};
