import api from './api';

export interface RecurringTransaction {
    id: string;
    name: string;
    amount: number;
    frequency: 'Monthly' | 'Weekly' | 'Yearly';
    date: number;
    icon: string;
    nextDueDate?: string;
}

export const settingsService = {
    // Recurring Transactions
    getRecurring: async (): Promise<RecurringTransaction[]> => {
        const response = await api.get('/recurring');
        return response.data;
    },

    createRecurring: async (data: Omit<RecurringTransaction, 'id'>) => {
        const response = await api.post('/recurring', data);
        return response.data;
    },

    deleteRecurring: async (id: string) => {
        const response = await api.delete(`/recurring/${id}`);
        return response.data;
    },

    // Reset
    resetAllData: async () => {
        const response = await api.post('/reset', {});
        return response.data;
    }
};
