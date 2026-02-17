import { db } from '../db/index.js';
import { transactions, wallets } from '../db/schema.js';
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cryptoService } from "./encryption.service.js";
import { notificationService } from './notification.service.js';

import { walletService } from './wallet.service.js';



export const transactionService = {
    async getAll(userId: string) {
        const rawTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.date));

        return rawTransactions.map(t => ({
            ...t,
            amount: cryptoService.decryptToNumber(t.amount), // Decrypting amount
            merchant: cryptoService.decrypt(t.merchant), // Decrypting merchant
            description: cryptoService.decrypt(t.description || ''), // Decrypting description
        }));
    },

    async create(userId: string, data: typeof transactions.$inferInsert) {
        return await db.transaction(async (tx) => {
            // 1. Insert Transaction
            const newTransaction = {
                ...data,
                userId,
                id: randomUUID(),
                amount: cryptoService.encrypt(data.amount),
                merchant: cryptoService.encrypt(data.merchant),
                description: cryptoService.encrypt(data.description || ''),
            };
            const [t] = await tx.insert(transactions).values(newTransaction).returning();



            // 3. Update Wallet Balance
            if (data.walletId) {
                const amount = Number(data.amount);
                const change = data.type === 'income' ? amount : -amount;
                await walletService.updateBalance(data.walletId, change); // This runs in its own tx/savepoint
            }

            // Trigger Real-time Budget Check (Async)
            notificationService.checkBudgetAlerts(userId).catch(err => console.error(err));

            return {
                ...t,
                amount: cryptoService.decryptToNumber(t.amount),
                merchant: cryptoService.decrypt(t.merchant),
                description: cryptoService.decrypt(t.description || '')
            };
        });
    },

    async update(userId: string, id: string, data: Partial<typeof transactions.$inferInsert>) {
        return await db.transaction(async (tx) => {
            // Get old transaction and Revert Wallet Balance
            const [oldT] = await tx.select().from(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
            if (!oldT) throw new Error("Transaction not found");

            let oldAmount = 0;
            if (oldT.walletId) {
                oldAmount = cryptoService.decryptToNumber(oldT.amount);
                const revertChange = oldT.type === 'income' ? -oldAmount : oldAmount;
                await walletService.updateBalance(oldT.walletId, revertChange);
            }

            // Prepare update
            const updateData: any = { ...data, updatedAt: new Date() };
            if (data.amount !== undefined) updateData.amount = cryptoService.encrypt(data.amount);
            if (data.merchant !== undefined) updateData.merchant = cryptoService.encrypt(data.merchant);
            if (data.description !== undefined) updateData.description = cryptoService.encrypt(data.description || '');

            const [t] = await tx.update(transactions)
                .set(updateData)
                .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
                .returning();

            // Apply New Wallet Balance
            const finalWalletId = data.walletId !== undefined ? data.walletId : oldT.walletId;
            // Note: if data.walletId is null, it means we removed it from wallet.
            // But if it is undefined, we keep old wallet.

            if (finalWalletId) {
                // We need the NEW amount. If data.amount is provided use it, else use decrypt(oldT.amount)
                let newAmount = 0;
                if (data.amount !== undefined) newAmount = Number(data.amount);
                else newAmount = cryptoService.decryptToNumber(oldT.amount);

                // We need the NEW type
                const newType = data.type || oldT.type;

                console.log(`Updating wallet ${finalWalletId}. Old Amount: ${oldAmount}, New Amount: ${newAmount}, New Type: ${newType}`);

                const applyChange = newType === 'income' ? newAmount : -newAmount;
                await walletService.updateBalance(finalWalletId, applyChange);
            }



            notificationService.checkBudgetAlerts(userId).catch(err => console.error(err));

            return {
                ...t,
                amount: cryptoService.decryptToNumber(t.amount),
                merchant: cryptoService.decrypt(t.merchant),
                description: cryptoService.decrypt(t.description || '')
            };
        });
    },

    async delete(userId: string, id: string) {
        return await db.transaction(async (tx) => {
            const [deleted] = await tx.delete(transactions)
                .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
                .returning();

            if (!deleted) return null;

            // Revert Wallet Balance
            if (deleted.walletId) {
                const amount = cryptoService.decryptToNumber(deleted.amount);
                const change = deleted.type === 'income' ? -amount : amount;
                await walletService.updateBalance(deleted.walletId, change);
            }



            notificationService.checkBudgetAlerts(userId).catch(err => console.error(err));

            return deleted;
        });
    }
};
