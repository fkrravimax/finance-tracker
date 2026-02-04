
import { db } from "../db";
import { transactions, budgets } from "../db/schema";
import { eq, sql } from "drizzle-orm";

export const dashboardService = {
    async getStats(userId: string) {
        // 1. Calculate Total Balance (Income - Expense)
        // using raw SQL for aggregation efficiently
        const balanceResult = await db.execute(sql`
            SELECT 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transaction 
            WHERE user_id = ${userId}
        `);

        const income = Number(balanceResult.rows[0].income || 0);
        const expense = Number(balanceResult.rows[0].expense || 0);
        const totalBalance = income - expense;

        // 2. Get Budget Info
        const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, userId));
        const budget = budgetResult[0] || null;

        // 3. Calculate Budget Usage
        // Assuming budget is monthly, calculate expenses for current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const monthlyExpenseResult = await db.execute(sql`
            SELECT SUM(amount) as total
            FROM transaction 
            WHERE user_id = ${userId} 
            AND type = 'expense'
            AND date >= ${startOfMonth}::timestamp
        `);

        const monthlyExpense = Number(monthlyExpenseResult.rows[0].total || 0);

        return {
            totalBalance,
            income,
            expense,
            monthlyExpense,
            budget: budget ? {
                limit: Number(budget.limit),
                used: monthlyExpense,
                percentage: budget.limit ? Math.min(Math.round((monthlyExpense / Number(budget.limit)) * 100), 100) : 0
            } : null
        };
    },

    async getMonthlyReport(userId: string, range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly') {
        let groupBy, interval, limit, dateFormat;

        switch (range) {
            case 'daily':
                groupBy = "TO_CHAR(date, 'YYYY-MM-DD')";
                interval = "30 days";
                dateFormat = "YYYY-MM-DD";
                // limit handled by date filter
                break;
            case 'weekly':
                groupBy = "TO_CHAR(date_trunc('week', date), 'YYYY-MM-DD')";
                interval = "3 months"; // Roughly 12 weeks
                dateFormat = "YYYY-MM-DD";
                break;
            case 'yearly':
                groupBy = "TO_CHAR(date, 'YYYY')";
                interval = "5 years";
                dateFormat = "YYYY";
                break;
            case 'monthly':
            default:
                groupBy = "TO_CHAR(date, 'YYYY-MM')";
                interval = "1 year";
                dateFormat = "YYYY-MM";
                break;
        }

        const result = await db.execute(sql.raw(`
            SELECT 
                ${groupBy} as period,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transaction
            WHERE user_id = '${userId}'
            AND date >= NOW() - INTERVAL '${interval}'
            GROUP BY 1
            ORDER BY 1 DESC
        `));

        return result.rows.map(row => ({
            month: row.period, // Keeping key 'month' for compatibility or rename to 'period'
            period: row.period,
            income: Number(row.income),
            expense: Number(row.expense)
        })).reverse();
    },

    async getBudgetVsReality(userId: string) {
        // GLOBAL BUDGET COMPARISON ONLY

        // 1. Get Global Budget
        const budgetResult = await db.select().from(budgets).where(eq(budgets.userId, userId));
        const budgetLimit = budgetResult[0]?.limit ? Number(budgetResult[0].limit) : 0;

        // 2. Get Total Expenses for Current Month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const expenseResult = await db.execute(sql`
            SELECT SUM(amount) as total
            FROM transaction
            WHERE user_id = ${userId}
            AND type = 'expense'
            AND date >= ${startOfMonth}::timestamp
        `);

        const totalSpent = Number(expenseResult.rows[0].total || 0);

        // Return simpler structure
        return [{
            category: 'Total Monthly Budget',
            limit: budgetLimit,
            actual: totalSpent
        }];
    },

    async getCumulativeCashFlow(userId: string) {
        // Get all transactions for current month ordered by date
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const transactions = await db.execute(sql`
            SELECT date, amount, type
            FROM transaction
            WHERE user_id = ${userId}
            AND date >= ${startOfMonth}::timestamp
            ORDER BY date ASC
        `);

        let cumulativeBalance = 0;
        return transactions.rows.map(t => {
            const amount = Number(t.amount);
            if (t.type === 'income') cumulativeBalance += amount;
            else cumulativeBalance -= amount;

            return {
                date: t.date,
                balance: cumulativeBalance
            };
        });
    }
};
