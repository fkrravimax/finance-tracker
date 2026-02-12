
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

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const { data } = await api.get('/dashboard/stats');
        return data;
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
