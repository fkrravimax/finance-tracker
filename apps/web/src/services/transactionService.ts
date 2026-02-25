import api from './api';
import type { Transaction } from '../types';

export const transactionService = {
    getAll: async (params?: { month?: number, year?: number, startDate?: string, endDate?: string, bypassCache?: string }): Promise<Transaction[]> => {
        const queryParams = new URLSearchParams();
        if (params?.month !== undefined) queryParams.append('month', params.month.toString());
        if (params?.year !== undefined) queryParams.append('year', params.year.toString());
        if (params?.startDate) queryParams.append('startDate', params.startDate);
        if (params?.endDate) queryParams.append('endDate', params.endDate);
        if (params?.bypassCache) queryParams.append('_t', params.bypassCache);

        const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
        const { data } = await api.get(`/transactions${queryString}`);
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
