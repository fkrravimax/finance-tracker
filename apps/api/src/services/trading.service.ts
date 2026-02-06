import { db } from '../db/index.js';
import { trades, users, transactions } from '../db/schema.js';
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const tradingService = {
    async createTrade(userId: string, data: any) {
        return await db.transaction(async (tx) => {
            const tradeId = randomUUID();
            const pnl = parseFloat(data.pnl);

            // 1. Insert Trade
            const [newTrade] = await tx.insert(trades).values({
                id: tradeId,
                userId,
                pair: data.pair,
                type: data.type,
                amount: data.amount.toString(),
                entryPrice: data.entryPrice.toString(),
                closePrice: data.closePrice?.toString(),
                leverage: parseInt(data.leverage),
                pnl: pnl.toString(),
                outcome: pnl > 0 ? 'WIN' : pnl < 0 ? 'LOSS' : 'BE',
                status: 'CLOSED', // Assuming logged trades are closed
                notes: data.notes,
                openedAt: new Date(), // Or use provided date from data.date if exists
            }).returning();

            // 2. Update User Trading Balance
            // We use sql increment to avoid race conditions roughly, though raw sql update is safer
            // Drizzle doesn't have a simple increment(), so we do a raw sql update
            await tx.execute(
                sql`UPDATE "user" SET trading_balance = trading_balance + ${pnl} WHERE id = ${userId}`
            );

            return newTrade;
        });
    },

    async getTrades(userId: string) {
        return await db.select().from(trades)
            .where(eq(trades.userId, userId))
            .orderBy(desc(trades.createdAt));
    },

    async getStats(userId: string) {
        const userTrades = await db.select().from(trades).where(eq(trades.userId, userId));

        let wins = 0;
        let losses = 0;
        let totalPnl = 0;
        let bestPair = { pair: 'N/A', pnl: -Infinity };
        const pairStats: Record<string, number> = {};

        // Equity Curve Calculation (simplified)
        // We ideally want daily snapshots, but for now we'll just return the running total of PnL over trades
        const equityCurve = userTrades
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            .reduce((acc: any[], trade) => {
                const pnl = parseFloat(trade.pnl || '0');
                const lastBalance = acc.length > 0 ? acc[acc.length - 1].value : 0;

                // Track stats
                totalPnl += pnl;
                if (pnl > 0) wins++;
                if (pnl < 0) losses++;

                // Track pair stats
                if (!pairStats[trade.pair]) pairStats[trade.pair] = 0;
                pairStats[trade.pair] += pnl;

                acc.push({
                    date: trade.createdAt,
                    value: lastBalance + pnl
                });
                return acc;
            }, []);

        // Find best pair
        for (const [pair, pnl] of Object.entries(pairStats)) {
            if (pnl > bestPair.pnl) {
                bestPair = { pair, pnl };
            }
        }

        // Get current balance
        const [user] = await db.select({ tradingBalance: users.tradingBalance }).from(users).where(eq(users.id, userId));

        return {
            wins,
            losses,
            totalPnl,
            bestPair: bestPair.pair === 'N/A' ? '-' : bestPair.pair,
            equityCurve,
            currentBalance: parseFloat(user?.tradingBalance || '0')
        };
    },

    async withdraw(userId: string, amount: number, convertedAmount?: number) {
        return await db.transaction(async (tx) => {
            // 1. Check Balance
            const [user] = await tx.select().from(users).where(eq(users.id, userId));
            const currentBalance = parseFloat(user.tradingBalance || '0');

            if (currentBalance < amount) {
                throw new Error("Insufficient trading balance");
            }

            // 2. Deduct from Trading Wallet (USD)
            await tx.execute(
                sql`UPDATE "user" SET trading_balance = trading_balance - ${amount} WHERE id = ${userId}`
            );

            // 3. Add to Main Transactions (Income in IDR if converted)
            const transactionAmount = convertedAmount || amount; // Use converted amount if provided, else USD amount
            const [transaction] = await tx.insert(transactions).values({
                id: randomUUID(),
                userId,
                merchant: 'Trading Wallet',
                category: 'Investments', // or Income
                date: new Date(),
                amount: transactionAmount.toString(),
                type: 'income',
                icon: 'candlestick_chart',
                description: convertedAmount ? `Withdrawal from Trading Wallet ($${amount})` : 'Withdrawal from Trading Wallet'
            }).returning();

            return transaction;
        });
    },

    async deposit(userId: string, amount: number, convertedAmount?: number) {
        return await db.transaction(async (tx) => {
            // 1. Add to Trading Wallet (USD)
            await tx.execute(
                sql`UPDATE "user" SET trading_balance = trading_balance + ${amount} WHERE id = ${userId}`
            );

            // 2. Deduct from Main Transactions (Expense in IDR if converted)
            const transactionAmount = convertedAmount || amount; // Use converted amount if provided, else USD amount

            // Note: We don't strictly check main balance here as this is a simple expense logging in the current architecture.
            // If main balance is strictly tracked in a 'balances' table, we would check it.
            // But currently main balance is a sum of transactions.

            const [transaction] = await tx.insert(transactions).values({
                id: randomUUID(),
                userId,
                merchant: 'Trading Wallet',
                category: 'Investments',
                date: new Date(),
                amount: transactionAmount.toString(),
                type: 'expense',
                icon: 'candlestick_chart',
                description: convertedAmount ? `Deposit to Trading Wallet ($${amount})` : 'Deposit to Trading Wallet'
            }).returning();

            return transaction;
        });
    }
};
