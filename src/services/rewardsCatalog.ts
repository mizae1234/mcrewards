import {
    RewardItem,
    RedemptionRequest,
    RewardHistoryEntry,
    RedemptionStatus,
    ShippingStatus,
    HistoryAction,
    TrackingInfo,
    ShippingType
} from '@/types/rewards';
import seedData from '@/lib/seedRewards.json';

const STORAGE_KEY_REWARDS = 'mcrewards_catalog_items';
const STORAGE_KEY_REDEMPTIONS = 'mcrewards_catalog_redemptions';
const STORAGE_KEY_HISTORY = 'mcrewards_catalog_history';

// Initialize storage with seed data if empty
const initializeStorage = () => {
    if (!localStorage.getItem(STORAGE_KEY_REWARDS)) {
        localStorage.setItem(STORAGE_KEY_REWARDS, JSON.stringify(seedData.rewards));
    }
    if (!localStorage.getItem(STORAGE_KEY_REDEMPTIONS)) {
        localStorage.setItem(STORAGE_KEY_REDEMPTIONS, JSON.stringify(seedData.redemptions));
    }
    if (!localStorage.getItem(STORAGE_KEY_HISTORY)) {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(seedData.history));
    }
};

initializeStorage();

const getStored = <T>(key: string): T[] => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
};

const setStored = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const addHistory = (entry: Omit<RewardHistoryEntry, 'id' | 'timestamp'>) => {
    const history = getStored<RewardHistoryEntry>(STORAGE_KEY_HISTORY);
    const newEntry: RewardHistoryEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString()
    };
    setStored(STORAGE_KEY_HISTORY, [newEntry, ...history]);
};

export const RewardsCatalogApi = {
    // --- Reward Management ---
    getRewards: async (): Promise<RewardItem[]> => {
        await new Promise(r => setTimeout(r, 400));
        return getStored<RewardItem>(STORAGE_KEY_REWARDS);
    },

    saveReward: async (reward: RewardItem): Promise<RewardItem> => {
        await new Promise(r => setTimeout(r, 400));
        const rewards = getStored<RewardItem>(STORAGE_KEY_REWARDS);
        const index = rewards.findIndex(r => r.id === reward.id);

        if (index >= 0) {
            rewards[index] = { ...reward, updatedAt: new Date().toISOString() };
        } else {
            rewards.push({
                ...reward,
                id: reward.id || crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
        }
        setStored(STORAGE_KEY_REWARDS, rewards);
        return reward;
    },

    deleteReward: async (id: string): Promise<void> => {
        await new Promise(r => setTimeout(r, 400));
        const rewards = getStored<RewardItem>(STORAGE_KEY_REWARDS).filter(r => r.id !== id);
        setStored(STORAGE_KEY_REWARDS, rewards);
    },

    // --- Redemption Management ---
    getRedemptions: async (): Promise<RedemptionRequest[]> => {
        await new Promise(r => setTimeout(r, 400));
        return getStored<RedemptionRequest>(STORAGE_KEY_REDEMPTIONS);
    },

    updateRedemptionStatus: async (id: string, status: RedemptionStatus, actor: string): Promise<void> => {
        await new Promise(r => setTimeout(r, 400));
        const redemptions = getStored<RedemptionRequest>(STORAGE_KEY_REDEMPTIONS);
        const index = redemptions.findIndex(r => r.id === id);
        if (index === -1) throw new Error('Redemption not found');

        const oldStatus = redemptions[index].status;
        redemptions[index].status = status;

        // Auto-update shipping status if approved
        if (status === RedemptionStatus.APPROVED && redemptions[index].shippingStatus === ShippingStatus.PENDING) {
            redemptions[index].shippingStatus = ShippingStatus.PROCESSING;
        }

        setStored(STORAGE_KEY_REDEMPTIONS, redemptions);

        // Log History
        addHistory({
            rewardId: redemptions[index].rewardId,
            rewardName: redemptions[index].rewardName,
            employeeCode: redemptions[index].employeeCode,
            employeeName: redemptions[index].employeeName,
            action: status === RedemptionStatus.APPROVED ? HistoryAction.APPROVED :
                status === RedemptionStatus.REJECTED ? HistoryAction.REJECTED : HistoryAction.UPDATED,
            actor,
            note: `Status change: ${oldStatus} -> ${status}`
        });
    },

    // --- Fulfillment ---
    updateShippingStatus: async (id: string, shippingStatus: ShippingStatus, tracking: TrackingInfo | undefined, actor: string): Promise<void> => {
        await new Promise(r => setTimeout(r, 400));
        const redemptions = getStored<RedemptionRequest>(STORAGE_KEY_REDEMPTIONS);
        const index = redemptions.findIndex(r => r.id === id);
        if (index === -1) throw new Error('Redemption not found');

        const oldStatus = redemptions[index].shippingStatus;
        redemptions[index].shippingStatus = shippingStatus;
        if (tracking) {
            redemptions[index].tracking = tracking;
        }

        setStored(STORAGE_KEY_REDEMPTIONS, redemptions);

        // SYNC WITH TRANSACTIONS (User History)
        try {
            const txId = redemptions[index].transactionId;
            if (txId) {
                const txData = localStorage.getItem('mcrewards_transactions');
                if (txData) {
                    const transactions = JSON.parse(txData);
                    const txIndex = transactions.findIndex((t: any) => t.id === txId);
                    if (txIndex >= 0) {
                        transactions[txIndex].shippingStatus = shippingStatus;
                        if (tracking) {
                            transactions[txIndex].trackingNumber = tracking.trackingNumber;
                        }
                        localStorage.setItem('mcrewards_transactions', JSON.stringify(transactions));
                    }
                }
            }
        } catch (e) {
            console.error("Failed to sync transaction status", e);
        }

        let action = HistoryAction.UPDATED;
        if (shippingStatus === ShippingStatus.SHIPPED) action = HistoryAction.SHIPPED;
        if (shippingStatus === ShippingStatus.DELIVERED) action = HistoryAction.DELIVERED;

        addHistory({
            rewardId: redemptions[index].rewardId,
            rewardName: redemptions[index].rewardName,
            employeeCode: redemptions[index].employeeCode,
            employeeName: redemptions[index].employeeName,
            action,
            actor,
            note: `Shipping: ${oldStatus} -> ${shippingStatus}`
        });
    },

    markDeliveredByTransactionId: async (transactionId: string, actor: string): Promise<void> => {
        const redemptions = getStored<RedemptionRequest>(STORAGE_KEY_REDEMPTIONS);
        const request = redemptions.find(r => r.transactionId === transactionId);

        if (request) {
            await RewardsCatalogApi.updateShippingStatus(request.id, ShippingStatus.DELIVERED, undefined, actor);
        } else {
            // Fallback for legacy items or direct API updates
            // If not found in catalog, we might still want to update the transaction itself directly
            // But for now, let's just throw or handle gracefully.
            // The History.tsx component has a catch block that falls back to Api.updateShippingStatus
            throw new Error("Redemption Request not found for this transaction");
        }
    },

    // --- History ---
    // --- User Redemption ---
    createRedemptionRequest: async (request: Omit<RedemptionRequest, 'id' | 'requestedAt' | 'status' | 'shippingStatus'>): Promise<RedemptionRequest> => {
        await new Promise(r => setTimeout(r, 400));

        // 1. Check Stock
        const rewards = getStored<RewardItem>(STORAGE_KEY_REWARDS);
        const rewardIndex = rewards.findIndex(r => r.id === request.rewardId);
        if (rewardIndex === -1) throw new Error('Reward not found');
        if (rewards[rewardIndex].stock <= 0) throw new Error('Out of stock');

        // 2. Deduct Stock
        rewards[rewardIndex].stock -= 1;
        setStored(STORAGE_KEY_REWARDS, rewards);

        // 3. Create Request
        const redemptions = getStored<RedemptionRequest>(STORAGE_KEY_REDEMPTIONS);
        const newRequest: RedemptionRequest = {
            ...request,
            id: crypto.randomUUID(),
            requestedAt: new Date().toISOString(),
            status: RedemptionStatus.PENDING,
            shippingStatus: request.shippingType === ShippingType.DIGITAL ? ShippingStatus.NOT_REQUIRED : ShippingStatus.PENDING
        };
        redemptions.push(newRequest);
        setStored(STORAGE_KEY_REDEMPTIONS, redemptions);

        // 4. Log History
        addHistory({
            rewardId: request.rewardId,
            rewardName: request.rewardName,
            employeeCode: request.employeeCode,
            employeeName: request.employeeName,
            action: HistoryAction.REDEEMED,
            actor: request.employeeName,
            note: `Redeemed for ${request.pointsUsed} pts`
        });

        return newRequest;
    },

    getHistory: async (): Promise<RewardHistoryEntry[]> => {
        await new Promise(r => setTimeout(r, 400));
        return getStored<RewardHistoryEntry>(STORAGE_KEY_HISTORY);
    }
};
