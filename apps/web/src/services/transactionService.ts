import api from './api';
import type { Transaction } from '../types';

import type { AggregatePayload } from './aggregatorService';

export const transactionService = {
    getAll: async (): Promise<Transaction[]> => {
        const { data } = await api.get('/transactions');
        return data;
    },

    create: async (transaction: Omit<Transaction, 'id' | 'userId'>, aggregates?: AggregatePayload): Promise<Transaction> => {
        const { data } = await api.post('/transactions', { ...transaction, aggregates });
        return data;
    },

    delete: async (id: string, aggregates?: AggregatePayload): Promise<void> => {
        // Delete usually doesn't have a body in standard REST, but some APIs allow it.
        // Express allows body in DELETE. axios.delete(url, { data: payload })
        await api.delete(`/transactions/${id}`, { data: { aggregates } });
    },

    update: async (id: string, transaction: Partial<Transaction>, aggregates?: AggregatePayload): Promise<Transaction> => {
        const { data } = await api.put(`/transactions/${id}`, { ...transaction, aggregates });
        return data;
    }
};
