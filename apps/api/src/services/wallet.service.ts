
import { db } from '../db/index.js';
import { wallets, transactions } from '../db/schema.js';
import { eq, and, sql } from "drizzle-orm";
import { cryptoService } from './encryption.service.js';

export const walletService = {
    async getAll(userId: string) {
        // 1. Get all wallets
        const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));

        // 2. Fetch all transactions for user (optimization: fetch once and filter in memory if userId matches, 
        // but here we might do it per wallet or fetch all user transactions once. 
        // Fetching all user transactions is better than N queries.)
        const allTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));

        // 3. Calculate balance for each wallet in memory
        const walletsWithBalance = userWallets.map(wallet => {
            let income = 0;
            let expense = 0;

            allTransactions.forEach(t => {
                if (t.walletId === wallet.id) {
                    const amount = cryptoService.decryptToNumber(t.amount);
                    if (t.type === 'income') income += amount;
                    if (t.type === 'expense') expense += amount;
                }
            });

            return {
                ...wallet,
                name: cryptoService.decrypt(wallet.name),
                type: wallet.type, // Type is not encrypted
                balance: income - expense // Calculated fresh
            };
        });

        return walletsWithBalance;
    },

    async create(userId: string, name: string, type: 'BANK' | 'CASH' | 'E_WALLET' | 'OTHER' | string) {
        const [newWallet] = await db.insert(wallets).values({
            userId,
            name: cryptoService.encrypt(name),
            type,
            balance: cryptoService.encrypt("0"), // Encrypted initial balance
        }).returning();

        return {
            ...newWallet,
            name: cryptoService.decrypt(newWallet.name),
            balance: 0
        };
    },

    async update(walletId: string, userId: string, data: Partial<typeof wallets.$inferInsert>) {
        const updateData: any = { ...data, updatedAt: new Date() };
        if (data.name) updateData.name = cryptoService.encrypt(data.name);
        if (data.balance) updateData.balance = cryptoService.encrypt(data.balance);

        const [updated] = await db.update(wallets)
            .set(updateData)
            .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
            .returning();

        return {
            ...updated,
            name: cryptoService.decrypt(updated.name),
            balance: cryptoService.decryptToNumber(updated.balance)
        };
    },

    async delete(walletId: string, userId: string) {
        return await db.delete(wallets)
            .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
            .returning();
    },

    async ensureDefaultWallets(userId: string) {
        let existing = await this.getAll(userId);

        if (existing.length === 0) {
            console.log(`[Migration] User ${userId} has no wallets. Creating default 'Main Bank'...`);
            const mainBank = await this.create(userId, "Main Bank", "BANK");
            existing = [{ ...mainBank, balance: 0 }];
        }

        // Migration: Update ALL null-wallet transactions to the first available wallet
        // This fixes accounts that created an Initial Balance before the walletId patch was deployed
        const result = await db.update(transactions)
            .set({ walletId: existing[0].id })
            .where(and(eq(transactions.userId, userId), sql`wallet_id IS NULL`));

        if (result.rowCount && result.rowCount > 0) {
            console.log(`[Migration] Assigned ${result.rowCount} orphaned transactions to '${existing[0].name}'.`);
        }

        return existing;
    }
};
