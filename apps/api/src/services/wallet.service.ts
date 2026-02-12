
import { db } from '../db/index.js';
import { wallets, transactions } from '../db/schema.js';
import { eq, and, sql } from "drizzle-orm";

export const walletService = {
    async getAll(userId: string) {
        // 1. Get all wallets
        const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));

        // 2. Calculate balance for each wallet
        const walletsWithBalance = await Promise.all(userWallets.map(async (wallet) => {
            const balanceResult = await db.execute(sql`
                SELECT 
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
                FROM transaction 
                WHERE wallet_id = ${wallet.id}
            `);

            const income = Number(balanceResult.rows[0].income || 0);
            const expense = Number(balanceResult.rows[0].expense || 0);
            return {
                ...wallet,
                balance: income - expense
            };
        }));

        return walletsWithBalance;
    },

    async create(userId: string, name: string, type: 'BANK' | 'CASH' | 'E_WALLET' | 'OTHER' | string) {
        const [newWallet] = await db.insert(wallets).values({
            userId,
            name,
            type,
            balance: "0",
        }).returning();
        return newWallet;
    },

    async update(walletId: string, userId: string, data: Partial<typeof wallets.$inferInsert>) {
        const [updated] = await db.update(wallets)
            .set({ ...data, updatedAt: new Date() })
            .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
            .returning();
        return updated;
    },

    async delete(walletId: string, userId: string) {
        return await db.delete(wallets)
            .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
            .returning();
    },

    // Ensure default wallets exist and migrate old transactions
    async ensureDefaultWallets(userId: string) {
        const existing = await this.getAll(userId);

        if (existing.length === 0) {
            console.log(`[Migration] User ${userId} has no wallets. Creating default 'Main Bank'...`);

            // Migration: Create Main Bank
            const mainBank = await this.create(userId, "Main Bank", "BANK");

            // Migration: Update ALL null-wallet transactions to this new wallet
            const result = await db.update(transactions)
                .set({ walletId: mainBank.id })
                .where(and(eq(transactions.userId, userId), sql`wallet_id IS NULL`));

            console.log(`[Migration] Assigned ${result.rowCount} transactions to 'Main Bank'.`);

            return [{ ...mainBank, balance: 0 }]; // Approximation, refetch for real balance
        }
        return existing;
    }
};
