
import { db } from '../db/index.js';
import { budgets } from '../db/schema.js';
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cryptoService } from './crypto.service.js';

export const budgetService = {
    async get(userId: string) {
        const result = await db.select().from(budgets).where(eq(budgets.userId, userId));
        const budget = result[0];
        if (!budget) return null;

        return {
            ...budget,
            limit: cryptoService.decryptToNumber(budget.limit),
            name: budget.name // Name not encrypted in plan, but schema update had "limit" as encrypted. 
            // Wait, I should check schema. "name" was NOT marked encrypted in my plan for budgets, only "limit".
        };
    },

    async createOrUpdate(userId: string, data: { limit: number }) {
        const existing = await this.get(userId);

        if (existing) {
            const result = await db.update(budgets)
                .set({
                    limit: cryptoService.encrypt(data.limit), // Encrypt
                    updatedAt: new Date()
                })
                .where(eq(budgets.id, existing.id))
                .returning();

            return {
                ...result[0],
                limit: cryptoService.decryptToNumber(result[0].limit)
            };
        } else {
            const result = await db.insert(budgets).values({
                id: randomUUID(),
                userId,
                name: "Monthly Budget",
                limit: cryptoService.encrypt(data.limit), // Encrypt
                icon: "account_balance_wallet",
            }).returning();

            return {
                ...result[0],
                limit: cryptoService.decryptToNumber(result[0].limit)
            };
        }
    }
};
