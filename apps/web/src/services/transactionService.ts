import api from './api';
import type { Transaction } from '../types';

export const transactionService = {
    getAll: async (month?: number, year?: number): Promise<Transaction[]> => {
        const params = month !== undefined && year !== undefined
            ? `?month=${month}&year=${year}` : '';
        const { data } = await api.get(`/transactions${params}`);
        return data;
    },

    create: async (transaction: Omit<Transaction, 'id' | 'userId'>): Promise<Transaction> => {
        const { data } = await api.post('/transactions', transaction);
        return data;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/transactions/${id}`);
    },

    update: async (id: string, transaction: Partial<Transaction>): Promise<Transaction> => {
        const { data } = await api.put(`/transactions/${id}`, transaction);
        return data;
    }
};
