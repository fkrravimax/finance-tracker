import { authService } from './authService';

export const upgradeService = {
    // Request upgrade to Platinum
    async requestUpgrade(): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const response = await authService.fetchWithAuth('/api/upgrade-requests', {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.error || 'Failed to submit upgrade request' };
            }

            return { success: true, message: 'Upgrade request submitted successfully!' };
        } catch (error) {
            console.error('Error requesting upgrade:', error);
            return { success: false, error: 'Failed to submit upgrade request' };
        }
    },

    // Check if user has pending upgrade request
    async checkPendingRequest(): Promise<{ hasPendingRequest: boolean }> {
        try {
            const response = await authService.fetchWithAuth('/api/upgrade-requests/status');
            const data = await response.json();
            return { hasPendingRequest: data.hasPendingRequest };
        } catch (error) {
            console.error('Error checking upgrade status:', error);
            return { hasPendingRequest: false };
        }
    },

    // Admin: Get all pending upgrade requests
    async getPendingRequests(): Promise<any[]> {
        try {
            const response = await authService.fetchWithAuth('/api/admin/upgrade-requests');
            return await response.json();
        } catch (error) {
            console.error('Error fetching upgrade requests:', error);
            return [];
        }
    },

    // Admin: Approve or reject upgrade request
    async processRequest(requestId: string, action: 'approve' | 'reject'): Promise<{ success: boolean; message?: string; error?: string }> {
        try {
            const response = await authService.fetchWithAuth(`/api/admin/upgrade-requests/${requestId}`, {
                method: 'PATCH',
                body: JSON.stringify({ action }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { success: false, error: error.error || 'Failed to process request' };
            }

            const data = await response.json();
            return { success: true, message: data.message };
        } catch (error) {
            console.error('Error processing upgrade request:', error);
            return { success: false, error: 'Failed to process request' };
        }
    },
};
