import api from './api';

export interface Session {
    id: string;
    ipAddress: string;
    device: {
        type: string;
        vendor?: string;
        model?: string;
    };
    os: {
        name?: string;
        version?: string;
    };
    browser: {
        name?: string;
        version?: string;
    };
    lastActive: string;
    isCurrent: boolean;
}

export const sessionService = {
    getSessions: async (): Promise<Session[]> => {
        try {
            const { data } = await api.get('/sessions');
            return data;
        } catch (error: any) {
            console.error('Failed to fetch sessions:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch sessions');
        }
    },

    revokeSession: async (id: string): Promise<void> => {
        try {
            await api.delete(`/sessions/${id}`);
        } catch (error: any) {
            console.error('Failed to revoke session:', error);
            throw new Error(error.response?.data?.message || 'Failed to revoke session');
        }
    }
};
