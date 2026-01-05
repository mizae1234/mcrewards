import { QuotaSetting, UserRole } from '@/types';

export interface QuotaChangeLog {
    id: string;
    timestamp: string;
    adminId: string;
    role: UserRole;
    changeAmount: number;
    quotaBefore: number;
    quotaAfter: number;
    affectedCount?: number;
    note?: string;
    source: 'manual' | 'system-reset' | 'import' | 'distribute';
}

export interface DistributeResult {
    success: boolean;
    distributionId?: string;
    affectedCount: number;
    totalPointsDistributed?: number;
    message: string;
}

export const QuotasApi = {
    // Get all role allowances
    getAll: async (): Promise<QuotaSetting[]> => {
        try {
            const res = await fetch('/api/quotas');
            if (!res.ok) throw new Error('Failed to fetch quotas');
            return await res.json();
        } catch (error) {
            console.error('Failed to fetch quotas:', error);
            return [];
        }
    },

    // Get distribution history
    getLogs: async (limit = 50): Promise<QuotaChangeLog[]> => {
        try {
            const res = await fetch(`/api/quotas/history?limit=${limit}`);
            if (!res.ok) throw new Error('Failed to fetch logs');
            return await res.json();
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            return [];
        }
    },

    // Update default quota for a role
    updateDefault: async (role: UserRole, amount: number, adminId: string): Promise<void> => {
        try {
            const res = await fetch(`/api/quotas/${role}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ defaultQuota: amount, updatedBy: adminId })
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update quota');
            }
        } catch (error) {
            console.error('Failed to update quota:', error);
            throw error;
        }
    },

    // Distribute quota to all employees of a role
    distribute: async (role: UserRole, amount: number, adminId: string, note?: string): Promise<DistributeResult> => {
        try {
            const res = await fetch('/api/quotas/distribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role, amount, adminId, note })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to distribute quota');
            }

            return data;
        } catch (error: any) {
            console.error('Failed to distribute quota:', error);
            throw error;
        }
    }
};

