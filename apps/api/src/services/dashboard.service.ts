
import { db } from '../db/index.js';
import { transactions, budgets } from '../db/schema.js';
import { eq } from "drizzle-orm";
import { walletService } from './wallet.service.js';
import { cryptoService } from './encryption.service.js';

export const dashboardService = {
    async getStats(userId: string) {
        // 0. Ensure Wallets Exist
        await walletService.ensureDefaultWallets(userId);

        // 1. Fetch ALL transactions for the user (we must decrypt to aggregate)
        const allTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));

        // 2. Decrypt and Process
        const decryptedTransactions = allTransactions.map(t => ({
            ...t,
            amount: cryptoService.decryptToNumber(t.amount),
            type: t.type,
            date: new Date(t.date)
        }));

        // 3. Calculate Global Totals
        let income = 0;
        let expense = 0;

        decryptedTransactions.forEach(t => {
            if (t.type === 'income') income += t.amount;
            if (t.type === 'expense') expense += t.amount;
        });

        const totalBalance = income - expense;

        // 4. Monthly Stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        let monthlyIncome = 0;
        let monthlyExpense = 0;

        decryptedTransactions.forEach(t => {
            if (t.date >= startOfMonth && t.date <= endOfMonth) {
                if (t.type === 'income') monthlyIncome += t.amount;
                if (t.type === 'expense') monthlyExpense += t.amount;
            }
        });

        const cashFlow = monthlyIncome - monthlyExpense;
        const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpense) / monthlyIncome) * 100 : 0;

        // 5. Get Budget
        const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, userId));
        const budget = budgetResult[0] || null;
        const budgetLimit = budget ? cryptoService.decryptToNumber(budget.limit) : 0;

        // 6. Get Wallets (which now need to recalculate their balances)
        // walletService.getAll will also need to be refactored to not use SQL SUM
        // For now, let's call it, assuming we will fix it next.
        const wallets = await walletService.getAll(userId);

        return {
            totalBalance,
            income,
            expense,
            monthlyIncome, // Added this
            monthlyExpense,
            wallets,
            budget: budget ? {
                limit: budgetLimit,
                used: monthlyExpense,
                percentage: budgetLimit > 0 ? Math.min(Math.round((monthlyExpense / budgetLimit) * 100), 100) : 0
            } : null,
            savingsRate: Math.max(0, savingsRate),
            cashFlow
        };
    },

    async getMonthlyReport(userId: string, range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
        // Fetch all transactions
        const allTransactions = await db.select().from(transactions).where(eq(transactions.userId, userId));

        const decrypted = allTransactions.map(t => ({
            ...t,
            amount: cryptoService.decryptToNumber(t.amount),
            date: new Date(t.date)
        }));

        const now = new Date();
        const map = new Map<string, { income: number, expense: number }>();

        // Determine filter start date
        let startDate = new Date();
        if (range === 'daily') startDate.setDate(now.getDate() - 30);
        if (range === 'weekly') startDate.setMonth(now.getMonth() - 3);
        if (range === 'monthly') startDate.setFullYear(now.getFullYear() - 1);
        if (range === 'yearly') startDate.setFullYear(now.getFullYear() - 5);

        decrypted.forEach(t => {
            if (t.date < startDate) return;

            let key = '';
            // Format Key
            if (range === 'daily') key = t.date.toISOString().split('T')[0]; // YYYY-MM-DD
            if (range === 'weekly') {
                // Approximate week bucket
                const d = new Date(t.date);
                const day = d.getDay(),
                    diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
                const monday = new Date(d.setDate(diff));
                key = monday.toISOString().split('T')[0];
            }
            if (range === 'monthly') key = t.date.toISOString().slice(0, 7); // YYYY-MM
            if (range === 'yearly') key = t.date.toISOString().slice(0, 4); // YYYY

            if (!map.has(key)) map.set(key, { income: 0, expense: 0 });
            const entry = map.get(key)!;

            if (t.type === 'income') entry.income += t.amount;
            if (t.type === 'expense') entry.expense += t.amount;
        });

        // Convert map to array and update sorting
        return Array.from(map.entries()).map(([period, val]) => ({
            month: period,
            period,
            income: val.income,
            expense: val.expense
        })).sort((a, b) => a.period.localeCompare(b.period));
    },

    async getBudgetVsReality(userId: string) {
        // 1. Get Global Budget
        const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, userId));
        const budgetLimit = budgetResult[0] ? cryptoService.decryptToNumber(budgetResult[0].limit) : 0;

        // 2. Fetch Transactions for Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const transactionsRes = await db.select().from(transactions).where(eq(transactions.userId, userId));

        const totalSpent = transactionsRes.reduce((acc, t) => {
            const date = new Date(t.date);
            if (date >= startOfMonth && date <= endOfMonth && t.type === 'expense') {
                return acc + cryptoService.decryptToNumber(t.amount);
            }
            return acc;
        }, 0);

        return [{
            category: 'Total Monthly Budget',
            limit: budgetLimit,
            actual: totalSpent
        }];
    },

    async getCumulativeCashFlow(userId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const transactionsRes = await db.select().from(transactions).where(eq(transactions.userId, userId));

        const sorted = transactionsRes
            .map(t => ({
                ...t,
                amount: cryptoService.decryptToNumber(t.amount),
                date: new Date(t.date)
            }))
            .filter(t => t.date >= startOfMonth)
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        let cumulativeBalance = 0;
        return sorted.map(t => {
            if (t.type === 'income') cumulativeBalance += t.amount;
            else cumulativeBalance -= t.amount;

            return {
                date: t.date,
                balance: cumulativeBalance
            };
        });
    }
};
