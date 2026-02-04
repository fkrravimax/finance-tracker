import api from './api';

export interface SavingsGoal {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    category: string;
    image?: string;
}

export const savingsService = {
    getAll: async () => {
        const { data } = await api.get<SavingsGoal[]>('/savings-goals');
        return data;
    },

    create: async (goal: Omit<SavingsGoal, 'id' | 'currentAmount'>) => {
        const { data } = await api.post<SavingsGoal>('/savings-goals', goal);
        return data;
    },

    updateAmount: async (id: string, amount: number, type: 'deposit' | 'withdraw') => {
        const { data } = await api.patch<SavingsGoal>(`/savings-goals/${id}/amount`, { amount, type });
        return data;
    },

    delete: async (id: string) => {
        await api.delete(`/savings-goals/${id}`);
    }
};
