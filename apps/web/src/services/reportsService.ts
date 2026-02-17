
import api from './api';
import { encryptionService } from './encryptionService';

export interface ReportStats {
    history: { period: string; income: number; expense: number }[];
    cashFlow: { date: Date; balance: number }[];
    budgetVsReality: { category: string; limit: number; actual: number }[];
}

export const reportsService = {
    getReport: async (range: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'): Promise<ReportStats> => {
        await encryptionService.ensureInitialized();
        const now = new Date();

        let history: any[] = [];
        let cashFlow: any[] = [];
        let budgetVsReality: any[] = [];

        // 1. Fetch History Data based on Range
        if (range === 'monthly' || range === 'yearly') {
            // Fetch ALL monthly aggregates
            const { data: monthlyData } = await api.get('/aggregates/monthly'); // Returns all

            // Decrypt and Sort
            const decrypted = monthlyData.map((m: any) => ({
                monthKey: m.monthKey,
                income: encryptionService.decryptToNumber(m.income),
                expense: encryptionService.decryptToNumber(m.expense)
            })).sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey));

            if (range === 'monthly') {
                // Filter last 12 months? Or just return all? Front-end usually filters or shows all.
                // Let's return last 12 months for "history" table if needed, or just mapped.
                history = decrypted.map((d: any) => ({
                    period: d.monthKey,
                    income: d.income,
                    expense: d.expense
                }));
            } else if (range === 'yearly') {
                // Group by Year
                const years: Record<string, { income: number, expense: number }> = {};
                decrypted.forEach((d: any) => {
                    const year = d.monthKey.substring(0, 4);
                    if (!years[year]) years[year] = { income: 0, expense: 0 };
                    years[year].income += d.income;
                    years[year].expense += d.expense;
                });
                history = Object.entries(years).map(([year, val]) => ({
                    period: year,
                    income: val.income,
                    expense: val.expense
                })).sort((a, b) => a.period.localeCompare(b.period));
            }

            // CashFlow (Cumulative from these monthly aggregates?)
            // Note: Monthly aggregates don't give "daily" resolution for cashflow chart if we want smooth lines.
            // But for Month/Year view, monthly resolution is fine.
            // Let's build cumulative balance from history.
            let balance = 0;
            cashFlow = history.map((h: any) => {
                balance += (h.income - h.expense);
                return {
                    date: h.period, // String YYYY-MM
                    balance
                };
            });
        }
        else if (range === 'daily') {
            // Fetch last 30 days
            const to = now.toISOString().split('T')[0];
            const fromDate = new Date();
            fromDate.setDate(now.getDate() - 30);
            const from = fromDate.toISOString().split('T')[0];

            const { data: dailyData } = await api.get(`/aggregates/daily?from=${from}&to=${to}`);

            const decrypted = dailyData.map((d: any) => ({
                dayKey: d.dayKey,
                income: encryptionService.decryptToNumber(d.income),
                expense: encryptionService.decryptToNumber(d.expense)
            })).sort((a: any, b: any) => a.dayKey.localeCompare(b.dayKey));

            history = decrypted.map((d: any) => ({
                period: d.dayKey,
                income: d.income,
                expense: d.expense
            }));

            let balance = 0;
            cashFlow = history.map((h: any) => {
                balance += (h.income - h.expense);
                return {
                    date: h.period,
                    balance
                };
            });
        }

        // 2. Budget Vs Reality
        // This usually compares "Current Month" expenses vs "Global Budget".
        // Fetch global budget
        let budgetLimit = 0;
        try {
            const { data: budgets } = await api.get('/budgets');
            if (budgets && budgets.length > 0) {
                budgetLimit = encryptionService.decryptToNumber(budgets[0].limit);
            }
        } catch (e) { }

        // Calculate this month's expense (reality)
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let currentMonthExpense = 0;
        try {
            const { data: mData } = await api.get(`/aggregates/monthly?monthKey=${currentMonthKey}`);
            if (mData) {
                currentMonthExpense = encryptionService.decryptToNumber(mData.expense);
            }
        } catch (e) { }

        budgetVsReality = [{
            category: 'Total Monthly Budget',
            limit: budgetLimit,
            actual: currentMonthExpense
        }];

        return {
            history,
            cashFlow,
            budgetVsReality
        };
    },

    getDailyStats: async (month: Date) => {
        await encryptionService.ensureInitialized();

        const year = month.getFullYear();
        const m = month.getMonth();
        const start = new Date(year, m, 1);
        const end = new Date(year, m + 1, 0);

        const from = start.toISOString().split('T')[0];
        const to = end.toISOString().split('T')[0];

        const { data: dailyData } = await api.get(`/aggregates/daily?from=${from}&to=${to}`);

        const stats: Record<number, { income: number; expense: number; net: number }> = {};

        // Initialize all days
        for (let d = 1; d <= end.getDate(); d++) {
            stats[d] = { income: 0, expense: 0, net: 0 };
        }

        if (dailyData) {
            dailyData.forEach((d: any) => {
                const day = parseInt(d.dayKey.split('-')[2]);
                const income = encryptionService.decryptToNumber(d.income);
                const expense = encryptionService.decryptToNumber(d.expense);

                if (stats[day]) {
                    stats[day].income = income;
                    stats[day].expense = expense;
                    stats[day].net = income - expense;
                }
            });
        }

        return stats;
    },

    getCategoryBreakdown: async (monthKey: string) => {
        await encryptionService.ensureInitialized();
        const { data: catData } = await api.get(`/aggregates/categories?monthKey=${monthKey}`);

        if (!catData || !Array.isArray(catData)) return [];

        // Format: { category, amount, percentage }
        // We only want 'expense' type for ExpensesByCategory
        const expenses = catData.filter((c: any) => c.type === 'expense').map((c: any) => ({
            category: c.category,
            amount: encryptionService.decryptToNumber(c.amount)
        }));

        const total = expenses.reduce((acc: number, c: any) => acc + c.amount, 0);

        return expenses.map((c: any) => ({
            ...c,
            percentage: total > 0 ? (c.amount / total) * 100 : 0
        })).sort((a: any, b: any) => b.amount - a.amount);
    }
};
