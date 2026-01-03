import {
    RewardItem,
    RedemptionRequest,
    RewardHistoryEntry,
    RedemptionStatus,
    ShippingStatus,
    TrackingInfo,
    RewardStatus
} from '@/types/rewards';

// ======================================
// PRODUCTION API - Uses real database
// ======================================

export const RewardsCatalogApi = {
    // --- Reward Management ---
    getRewards: async (): Promise<RewardItem[]> => {
        try {
            const res = await fetch('/api/rewards/catalog');
            if (!res.ok) throw new Error('Failed to fetch rewards');
            const data = await res.json();
            // Transform DB format to UI format
            return data.map((r: any) => ({
                id: r.id,
                name: r.name,
                category: r.category,
                description: r.description || '',
                pointsCost: r.pointsCost,
                stock: r.stock,
                imageUrl: r.imageUrl || '',
                isPhysical: r.isPhysical,
                status: r.status === 'ACTIVE' ? RewardStatus.ACTIVE : RewardStatus.INACTIVE,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            }));
        } catch (error) {
            console.error('Failed to fetch rewards:', error);
            return [];
        }
    },

    saveReward: async (reward: RewardItem): Promise<RewardItem> => {
        try {
            const isUpdate = !!reward.id && reward.id.length > 10; // UUID check
            const url = isUpdate ? `/api/rewards/catalog/${reward.id}` : '/api/rewards/catalog';
            const method = isUpdate ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: reward.name,
                    description: reward.description,
                    imageUrl: reward.imageUrl,
                    category: reward.category,
                    pointsCost: reward.pointsCost,
                    stock: reward.stock,
                    isPhysical: reward.isPhysical,
                    status: reward.status === RewardStatus.ACTIVE ? 'ACTIVE' : 'INACTIVE',
                    createdBy: 'Admin',
                    updatedBy: 'Admin'
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to save reward');
            }

            return await res.json();
        } catch (error) {
            console.error('Failed to save reward:', error);
            throw error;
        }
    },

    deleteReward: async (id: string): Promise<void> => {
        try {
            const res = await fetch(`/api/rewards/catalog/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete reward');
            }
        } catch (error) {
            console.error('Failed to delete reward:', error);
            throw error;
        }
    },

    // --- Redemption Management ---
    getRedemptions: async (): Promise<RedemptionRequest[]> => {
        try {
            const res = await fetch('/api/rewards/redeem?all=true');
            if (!res.ok) throw new Error('Failed to fetch redemptions');
            return await res.json();
        } catch (error) {
            console.error('Failed to fetch redemptions:', error);
            return [];
        }
    },

    updateRedemptionStatus: async (id: string, status: RedemptionStatus, actor: string): Promise<void> => {
        try {
            const endpoint = status === RedemptionStatus.APPROVED
                ? `/api/admin/redeem-requests/${id}/approve`
                : `/api/admin/redeem-requests/${id}/reject`;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvedBy: actor,
                    rejectedBy: actor
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Failed to update redemption status:', error);
            throw error;
        }
    },

    // --- Fulfillment ---
    updateShippingStatus: async (id: string, shippingStatus: ShippingStatus, tracking: TrackingInfo | undefined, actor: string): Promise<void> => {
        try {
            const res = await fetch(`/api/admin/shipments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shippingStatus: shippingStatus.toUpperCase().replace('-', '_'),
                    trackingNumber: tracking?.trackingNumber,
                    carrier: tracking?.carrier,
                    updatedBy: actor
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update shipping');
            }
        } catch (error) {
            console.error('Failed to update shipping status:', error);
            throw error;
        }
    },

    // --- User Redemption ---
    createRedemptionRequest: async (request: Omit<RedemptionRequest, 'id' | 'requestedAt' | 'status' | 'shippingStatus'>): Promise<RedemptionRequest> => {
        try {
            // First, get the employee ID from their code
            const empRes = await fetch(`/api/employees?search=${encodeURIComponent(request.employeeCode)}`);
            if (!empRes.ok) throw new Error('Failed to find employee');
            const employees = await empRes.json();
            const employee = employees.find((e: any) => e.employeeCode === request.employeeCode);
            if (!employee) throw new Error('Employee not found');

            const res = await fetch('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: employee.id,
                    rewardId: request.rewardId,
                    shippingType: request.shippingType?.toUpperCase(),
                    shippingAddress: request.shippingAddress,
                    contactPhone: request.contactPhone,
                    note: request.note
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create redemption');
            }

            return await res.json();
        } catch (error) {
            console.error('Failed to create redemption:', error);
            throw error;
        }
    },

    // --- History ---
    getHistory: async (): Promise<RewardHistoryEntry[]> => {
        try {
            const res = await fetch('/api/admin/audit-logs?entityType=RedeemRequest&limit=100');
            if (!res.ok) throw new Error('Failed to fetch history');
            const data = await res.json();

            // Transform audit logs to history entries
            return data.logs.map((log: any) => ({
                id: log.id,
                rewardId: log.details?.rewardId || log.entityId,
                rewardName: log.details?.rewardName || 'Unknown',
                employeeCode: log.details?.employeeCode || '',
                employeeName: log.details?.employeeName || '',
                action: log.action.toLowerCase().replace('_', '-'),
                timestamp: log.createdAt,
                actor: log.actorId,
                note: log.details?.reason || log.details?.note
            }));
        } catch (error) {
            console.error('Failed to fetch history:', error);
            return [];
        }
    },

    // Legacy method for compatibility
    markDeliveredByTransactionId: async (transactionId: string, actor: string): Promise<void> => {
        // This method is used by legacy History.tsx component
        // For now, we'll skip this as it requires transaction ID mapping
        console.warn('markDeliveredByTransactionId not implemented for new API');
    }
};
