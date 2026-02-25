import { db } from '../db/index.js';
import { transactions, budgets, savingsGoals, recurringTransactions, wallets, trades } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export const resetService = {
    async resetUserData(userId: string) {
        // Atomic reset: all-or-nothing using DB transaction
        await db.transaction(async (tx) => {
            await tx.delete(trades).where(eq(trades.userId, userId));
            await tx.delete(recurringTransactions).where(eq(recurringTransactions.userId, userId));
            await tx.delete(budgets).where(eq(budgets.userId, userId));
            await tx.delete(savingsGoals).where(eq(savingsGoals.userId, userId));
            await tx.delete(transactions).where(eq(transactions.userId, userId));
            await tx.delete(wallets).where(eq(wallets.userId, userId));
        });

        // We DO NOT delete the user account, sessions, or notification settings.
        // "Reset data" means content only.

        return { success: true, message: "All user data verified and reset." };
    }
};
