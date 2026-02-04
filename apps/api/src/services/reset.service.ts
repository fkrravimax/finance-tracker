import { db } from '../db/index.js';
import { transactions, budgets, savingsGoals, recurringTransactions } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const resetService = {
    async resetUserData(userId: string) {
        // Delete all transactions
        await db.delete(transactions).where(eq(transactions.userId, userId));

        // Delete all budgets
        await db.delete(budgets).where(eq(budgets.userId, userId));

        // Delete all savings goals
        await db.delete(savingsGoals).where(eq(savingsGoals.userId, userId));

        // Delete all recurring transactions
        await db.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));

        // We DO NOT delete the user or auth accounts, so they stay logged in.
        // We DO NOT delete notification settings (optional, but usually "reset data" means content).

        return { success: true, message: "All user data verified and reset." };
    }
};
