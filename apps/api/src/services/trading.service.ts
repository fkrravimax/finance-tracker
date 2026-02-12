
import { db } from '../db/index.js';
import { trades, users, transactions } from '../db/schema.js';
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { cryptoService } from './crypto.service.js';

export const tradingService = {
    async createTrade(userId: string, data: any) {
        return await db.transaction(async (tx) => {
            const tradeId = randomUUID();
            const pnl = parseFloat(data.pnl);

            // 1. Insert Trade (Encrypt sensitive fields)
            const [newTrade] = await tx.insert(trades).values({
                id: tradeId,
                userId,
                pair: data.pair,
                type: data.type,
                amount: cryptoService.encrypt(data.amount),
                entryPrice: cryptoService.encrypt(data.entryPrice),
                closePrice: data.closePrice ? cryptoService.encrypt(data.closePrice) : null,
                leverage: parseInt(data.leverage),
                pnl: cryptoService.encrypt(pnl),
                outcome: pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BE',
                status: 'CLOSED',
                notes: data.notes ? cryptoService.encrypt(data.notes) : null,
                openedAt: new Date(),
            }).returning();

            // 2. Update User Trading Balance (Manual Fetch -> Decrypt -> Calc -> Encrypt -> Update)
            const [user] = await tx.select().from(users).where(eq(users.id, userId));
            const currentBalance = cryptoService.decryptToNumber(user.tradingBalance || '0');
            const newBalance = currentBalance + pnl;

            await tx.update(users)
                .set({ tradingBalance: cryptoService.encrypt(newBalance) })
                .where(eq(users.id, userId));

            return {
                ...newTrade,
                amount: cryptoService.decryptToNumber(newTrade.amount),
                entryPrice: cryptoService.decryptToNumber(newTrade.entryPrice),
                pnl: cryptoService.decryptToNumber(newTrade.pnl || '0')
            };
        });
    },

    async getTrades(userId: string) {
        const raw = await db.select().from(trades)
            .where(eq(trades.userId, userId))
            .orderBy(desc(trades.createdAt));

        return raw.map(t => ({
            ...t,
            amount: cryptoService.decryptToNumber(t.amount),
            entryPrice: cryptoService.decryptToNumber(t.entryPrice),
            closePrice: t.closePrice ? cryptoService.decryptToNumber(t.closePrice) : null,
            pnl: t.pnl ? cryptoService.decryptToNumber(t.pnl) : null,
            notes: t.notes ? cryptoService.decrypt(t.notes) : null
        }));
    },

    async getStats(userId: string) {
        const userTrades = await db.select().from(trades).where(eq(trades.userId, userId));

        let wins = 0;
        let losses = 0;
        let totalPnl = 0;
        let bestPair = { pair: 'N/A', pnl: -Infinity };
        const pairStats: Record<string, number> = {};
        const equityCurve: any[] = [];

        // Need to sort by date to build equity curve
        const sortedTrades = userTrades.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        // Get current balance
        const [user] = await db.select({ tradingBalance: users.tradingBalance }).from(users).where(eq(users.id, userId));
        const currentBalance = cryptoService.decryptToNumber(user?.tradingBalance || '0');

        // Note: Equity curve usually starts from 0 or initial deposit. 
        // Here we just track cumulative PnL.
        let runningPnl = 0;

        for (const trade of sortedTrades) {
            const pnl = cryptoService.decryptToNumber(trade.pnl || '0');

            totalPnl += pnl;
            runningPnl += pnl;

            if (pnl > 0) wins++;
            if (pnl < 0) losses++;

            if (!pairStats[trade.pair]) pairStats[trade.pair] = 0;
            pairStats[trade.pair] += pnl;

            equityCurve.push({
                date: trade.createdAt,
                value: runningPnl // accurate relative performance
            });
        }

        // Find best pair
        for (const [pair, pnl] of Object.entries(pairStats)) {
            if (pnl > bestPair.pnl) {
                bestPair = { pair, pnl };
            }
        }

        return {
            wins,
            losses,
            totalPnl,
            bestPair: bestPair.pair === 'N/A' ? '-' : bestPair.pair,
            equityCurve,
            currentBalance
        };
    },

    async withdraw(userId: string, amount: number, convertedAmount?: number) {
        return await db.transaction(async (tx) => {
            // 1. Check Balance
            const [user] = await tx.select().from(users).where(eq(users.id, userId));
            const currentBalance = cryptoService.decryptToNumber(user.tradingBalance || '0');

            if (currentBalance < amount) {
                throw new Error("Insufficient trading balance");
            }

            // 2. Deduct from Trading Wallet
            const newBalance = currentBalance - amount;
            await tx.update(users)
                .set({ tradingBalance: cryptoService.encrypt(newBalance) })
                .where(eq(users.id, userId));

            // 3. Add to Main Transactions (Income in IDR if converted)
            const transactionAmount = convertedAmount || amount;
            const description = convertedAmount ? `Withdrawal from Trading Wallet ($${amount})` : 'Withdrawal from Trading Wallet';

            const [transaction] = await tx.insert(transactions).values({
                id: randomUUID(),
                userId,
                merchant: cryptoService.encrypt('Trading Wallet'),
                category: 'Investments',
                date: new Date(),
                amount: cryptoService.encrypt(transactionAmount),
                type: 'income',
                icon: 'candlestick_chart',
                description: cryptoService.encrypt(description)
            }).returning();

            // Decrypt result for frontend
            return {
                ...transaction,
                merchant: 'Trading Wallet',
                amount: transactionAmount,
                description
            };
        });
    },

    async deposit(userId: string, amount: number, convertedAmount?: number) {
        return await db.transaction(async (tx) => {
            // 1. Add to Trading Wallet
            const [user] = await tx.select().from(users).where(eq(users.id, userId));
            const currentBalance = cryptoService.decryptToNumber(user.tradingBalance || '0');
            const newBalance = currentBalance + amount;

            await tx.update(users)
                .set({ tradingBalance: cryptoService.encrypt(newBalance) })
                .where(eq(users.id, userId));

            // 2. Deduct from Main Transactions (Expense)
            const transactionAmount = convertedAmount || amount;
            const description = convertedAmount ? `Deposit to Trading Wallet ($${amount})` : 'Deposit to Trading Wallet';

            const [transaction] = await tx.insert(transactions).values({
                id: randomUUID(),
                userId,
                merchant: cryptoService.encrypt('Trading Wallet'),
                category: 'Investments',
                date: new Date(),
                amount: cryptoService.encrypt(transactionAmount),
                type: 'expense',
                icon: 'candlestick_chart',
                description: cryptoService.encrypt(description)
            }).returning();

            return {
                ...transaction,
                merchant: 'Trading Wallet',
                amount: transactionAmount,
                description
            };
        });
    }
};
