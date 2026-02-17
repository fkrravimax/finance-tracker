
import api from './api';

export interface DashboardStats {
    totalBalance: number;
    income: number;
    expense: number;
    monthlyExpense: number;
    wallets?: { id: string; name: string; type: string; balance: number }[];
    budget: {
        limit: number;
        used: number;
        percentage: number;
    } | null;
}

import { encryptionService } from './encryptionService';

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        await encryptionService.ensureInitialized();
        // Fetch pre-calculated stats from backend (Original Architecture)
        const { data } = await api.get('/dashboard/stats');

        // Data structure from backend: 
        // { totalBalance, income (global), expense (global), monthlyIncome, monthlyExpense, wallets, budget, savingsRate, cashFlow }

        // We need to match DashboardStats interface:
        // { totalBalance, income, expense, monthlyExpense, wallets, budget }

        // IMPORTANT: The UI "Cash Flow" and top stats usually want MONTHLY Income/Expense.
        // But previously (Client-Side Aggregates), we were specifically fetching Monthly Aggregates.
        // So we should map "income" to "monthlyIncome" if available, or just use what backend sends if it was sending monthly before.
        // Looking at backend code, it calculates global income/expense too.
        // Let's use Monthly Income for the "income" field to match recent behavior.

        return {
            totalBalance: Number(data.totalBalance), // Ensure number
            income: Number(data.monthlyIncome || data.income), // Prefer Monthly for Dashboard view
            expense: Number(data.monthlyExpense || data.expense), // Prefer Monthly
            monthlyExpense: Number(data.monthlyExpense),
            wallets: data.wallets,
            budget: data.budget
        };
    },
    setBudget: async (limit: number) => {
        const { data } = await api.post('/budgets', { limit });
        return data;
    },
    getReport: async (range: string = 'monthly') => {
        const { data } = await api.get(`/dashboard/report?range=${range}`);
        return data;
    }
};
