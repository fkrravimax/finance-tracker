
import { db } from '../db/index.js';
import { wallets, transactions } from '../db/schema.js';
import { eq, and, sql } from "drizzle-orm";
import { cryptoService } from './encryption.service.js';

export const walletService = {
    async getAll(userId: string) {
        // 1. Get all wallets
        const userWallets = await db.select().from(wallets).where(eq(wallets.userId, userId));

        // 2. Decrypt stored balances (No more calculating from transactions!)
        return userWallets.map(wallet => ({
            ...wallet,
            name: cryptoService.decrypt(wallet.name),
            type: wallet.type,
            balance: cryptoService.decryptToNumber(wallet.balance)
        }));
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
        // Note: Direct balance update via this method should be restricted or careful.
        if (data.balance) updateData.balance = cryptoService.encrypt(data.balance);

        const [updated] = await db.update(wallets)
            .set(updateData)
            .where(and(eq(wallets.id, walletId), eq(wallets.userId, userId)))
            .returning();

        if (!updated) return null;

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

            // Recalculate balance for this new wallet based on assigned transactions
            // This is a one-time migration step, so calculating is fine here.
            const walletTrx = await db.select().from(transactions).where(eq(transactions.walletId, mainBank.id));
            let balance = 0;
            walletTrx.forEach(t => {
                const amount = cryptoService.decryptToNumber(t.amount);
                if (t.type === 'income') balance += amount;
                else balance -= amount;
            });

            // Update with calculated balance
            await db.update(wallets)
                .set({ balance: cryptoService.encrypt(balance.toString()) })
                .where(eq(wallets.id, mainBank.id));

            return [{ ...mainBank, balance }];
        }
        return existing;
    },

    // Atomic Balance Update
    // Must be called within a transaction if possible, or we start one here.
    // If called from TransactionService which is already in a tx, passing 'tx' would be ideal.
    // If we can't pass 'tx', we rely on optimistic locking or short critical section.
    // Since we don't pass 'tx' easily, we will use a fresh transaction block here.
    async updateBalance(walletId: string, amountChange: number) {
        return await db.transaction(async (tx) => {
            // Lock the row for update
            const [wallet] = await tx.select()
                .from(wallets)
                .where(eq(wallets.id, walletId))
                .for('update'); // Lock!

            if (!wallet) throw new Error("Wallet not found");

            const currentBalance = cryptoService.decryptToNumber(wallet.balance);
            const newBalance = currentBalance + amountChange;

            await tx.update(wallets)
                .set({
                    balance: cryptoService.encrypt(newBalance.toString()),
                    updatedAt: new Date()
                })
                .where(eq(wallets.id, walletId));

            return newBalance;
        });
    }
};
