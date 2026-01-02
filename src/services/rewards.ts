import { Reward } from '@/types';
import seedData from '@/lib/seedAdmin.json';

const STORAGE_KEY = 'mcrewards_rewards';

if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData.rewards));
}

const getRewards = (): Reward[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveRewards = (rewards: Reward[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rewards));
};

export const RewardsApi = {
    getAll: async (): Promise<Reward[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(getRewards()), 500));
    },

    save: async (reward: Reward): Promise<Reward> => {
        const rewards = getRewards();
        const index = rewards.findIndex(r => r.id === reward.id);
        if (index >= 0) {
            rewards[index] = reward;
        } else {
            rewards.push({ ...reward, id: reward.id || crypto.randomUUID() });
        }
        saveRewards(rewards);
        return reward;
    },

    delete: async (id: string): Promise<void> => {
        const rewards = getRewards().filter(r => r.id !== id);
        saveRewards(rewards);
    }
};
