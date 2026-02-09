
import api from './api';

export const aiService = {
    categorize: async (merchant: string, description?: string): Promise<string> => {
        const response = await api.post('/ai/categorize', { merchant, description });
        return response.data.category;
    }
};
