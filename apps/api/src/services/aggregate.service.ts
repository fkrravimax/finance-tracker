
import { db } from '../db/index.js';
import { monthlyAggregates, dailyAggregates, categoryAggregates } from '../db/schema.js';
import { eq, and, gte, lte } from "drizzle-orm";

export const aggregateService = {
    // --- Monthly Aggregates ---
    async upsertMonthly(userId: string, monthKey: string, data: { income: string, expense: string, version: number }) {
        return await db.transaction(async (tx) => {
            const existing = await tx.select().from(monthlyAggregates)
                .where(and(eq(monthlyAggregates.userId, userId), eq(monthlyAggregates.monthKey, monthKey)));

            if (existing.length > 0) {
                // Update
                return await tx.update(monthlyAggregates)
                    .set({
                        income: data.income,
                        expense: data.expense,
                        version: data.version,
                        updatedAt: new Date()
                    })
                    .where(eq(monthlyAggregates.id, existing[0].id))
                    .returning();
            } else {
                // Insert
                return await tx.insert(monthlyAggregates).values({
                    userId,
                    monthKey,
                    income: data.income,
                    expense: data.expense,
                    version: data.version
                }).returning();
            }
        });
    },

    async getMonthly(userId: string, monthKey: string) {
        const result = await db.select().from(monthlyAggregates)
            .where(and(eq(monthlyAggregates.userId, userId), eq(monthlyAggregates.monthKey, monthKey)));
        return result[0] || null;
    },

    async getAllMonthly(userId: string) {
        return await db.select().from(monthlyAggregates)
            .where(eq(monthlyAggregates.userId, userId));
    },

    // --- Daily Aggregates ---
    async upsertDaily(userId: string, dayKey: string, data: { income: string, expense: string }) {
        return await db.transaction(async (tx) => {
            const existing = await tx.select().from(dailyAggregates)
                .where(and(eq(dailyAggregates.userId, userId), eq(dailyAggregates.dayKey, dayKey)));

            if (existing.length > 0) {
                return await tx.update(dailyAggregates)
                    .set({
                        income: data.income,
                        expense: data.expense,
                        updatedAt: new Date()
                    })
                    .where(eq(dailyAggregates.id, existing[0].id))
                    .returning();
            } else {
                return await tx.insert(dailyAggregates).values({
                    userId,
                    dayKey,
                    income: data.income,
                    expense: data.expense
                }).returning();
            }
        });
    },

    async getDaily(userId: string, dayKey: string) {
        const result = await db.select().from(dailyAggregates)
            .where(and(eq(dailyAggregates.userId, userId), eq(dailyAggregates.dayKey, dayKey)));
        return result[0] || null;
    },

    async getDailyRange(userId: string, fromKey: string, toKey: string) {
        return await db.select().from(dailyAggregates)
            .where(and(
                eq(dailyAggregates.userId, userId),
                gte(dailyAggregates.dayKey, fromKey),
                lte(dailyAggregates.dayKey, toKey)
            ));
    },

    // --- Category Aggregates ---
    async upsertCategory(userId: string, monthKey: string, category: string, type: string, amount: string) {
        return await db.transaction(async (tx) => {
            const existing = await tx.select().from(categoryAggregates)
                .where(and(
                    eq(categoryAggregates.userId, userId),
                    eq(categoryAggregates.monthKey, monthKey),
                    eq(categoryAggregates.category, category),
                    eq(categoryAggregates.type, type)
                ));

            if (existing.length > 0) {
                return await tx.update(categoryAggregates)
                    .set({
                        amount,
                        updatedAt: new Date()
                    })
                    .where(eq(categoryAggregates.id, existing[0].id))
                    .returning();
            } else {
                return await tx.insert(categoryAggregates).values({
                    userId,
                    monthKey,
                    category,
                    type,
                    amount
                }).returning();
            }
        });
    },

    async getCategories(userId: string, monthKey: string) {
        return await db.select().from(categoryAggregates)
            .where(and(eq(categoryAggregates.userId, userId), eq(categoryAggregates.monthKey, monthKey)));
    }
};
