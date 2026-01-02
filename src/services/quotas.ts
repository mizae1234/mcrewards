import { QuotaSetting, UserRole } from '@/types';
import seedData from '@/lib/seedAdmin.json';

const STORAGE_KEY = 'mcrewards_quotas';

if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData.quotas));
}

const getQuotas = (): QuotaSetting[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveQuotas = (quotas: QuotaSetting[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotas));
};

export interface QuotaChangeLog {
    id: string;
    timestamp: string;
    adminId: string;
    role: UserRole;
    changeAmount: number;
    quotaBefore: number;
    quotaAfter: number;
    note?: string;
    source: 'manual' | 'system-reset' | 'import';
}

const STORAGE_KEY_LOGS = 'mcrewards_quotas_logs';

const getLogs = (): QuotaChangeLog[] => {
    const stored = localStorage.getItem(STORAGE_KEY_LOGS);
    return stored ? JSON.parse(stored) : [];
};

const saveLogs = (logs: QuotaChangeLog[]) => {
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
};

export const QuotasApi = {
    getAll: async (): Promise<QuotaSetting[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(getQuotas()), 500));
    },

    getLogs: async (): Promise<QuotaChangeLog[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(getLogs().sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())), 300));
    },

    updateDefault: async (role: UserRole, amount: number, adminId: string, source: 'manual' | 'import' = 'manual'): Promise<void> => {
        const quotas = getQuotas();
        const logs = getLogs();
        const index = quotas.findIndex(q => q.role === role);

        if (index >= 0) {
            const oldQuota = quotas[index].monthlyQuota;
            const changeDiff = amount - oldQuota;

            // Only update and log if there is a change
            if (changeDiff !== 0) {
                quotas[index].monthlyQuota = amount;
                saveQuotas(quotas);

                const newLog: QuotaChangeLog = {
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    adminId,
                    role,
                    changeAmount: changeDiff,
                    quotaBefore: oldQuota,
                    quotaAfter: amount,
                    source,
                    note: `Quota updated from ${oldQuota} to ${amount}`
                };
                logs.unshift(newLog); // Add to top
                saveLogs(logs);
            }
        }
    }
};
