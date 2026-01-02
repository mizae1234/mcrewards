import { RewardLevel, User } from '@/types';
import { Api } from './api';

export interface ProgressData {
    currentLevel: RewardLevel;
    nextLevel: RewardLevel | null;
    progressPercent: number;
    pointsToNext: number;
    currentBase: number;
    nextThreshold: number;
    isMaxLevel: boolean;
}

export const LevelService = {
    getLevels: async (): Promise<RewardLevel[]> => {
        // Fetch real rewards
        const rewards = Api.getRewards();

        // Filter those that are "Levels" (have minPoint defined)
        // And map them to RewardLevel interface (typescript satisfied by check)
        const levels = rewards
            .filter(r => r.minPoint !== undefined && r.levelTitle !== undefined)
            .map(r => ({
                ...r,
                minPoint: r.minPoint || 0,
                title: r.levelTitle || ''
            }))
            .sort((a, b) => a.minPoint - b.minPoint);

        return levels;
    },

    calculateProgress: async (userPoints: number): Promise<ProgressData> => {
        const sorted = await LevelService.getLevels();

        // Find current level (highest minPoint <= userPoints)
        let currentIndex = -1;
        for (let i = sorted.length - 1; i >= 0; i--) {
            if (userPoints >= sorted[i].minPoint) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex === -1 && sorted.length > 0) currentIndex = 0;

        const currentLevel = sorted[currentIndex];
        const nextLevel = sorted[currentIndex + 1] || null;
        const isMaxLevel = !nextLevel;

        const currentBase = currentLevel ? currentLevel.minPoint : 0;
        let progressPercent = 100;
        let pointsToNext = 0;
        let nextThreshold = currentBase;

        if (nextLevel) {
            nextThreshold = nextLevel.minPoint;
            const numerator = Math.max(0, userPoints - currentBase);
            const denominator = nextThreshold - currentBase;
            pointsToNext = Math.max(0, nextThreshold - userPoints);

            if (denominator > 0) {
                progressPercent = Math.min(100, (numerator / denominator) * 100);
            } else {
                progressPercent = 100;
            }
        }

        return {
            currentLevel,
            nextLevel,
            progressPercent,
            pointsToNext,
            currentBase,
            nextThreshold,
            isMaxLevel
        };
    }
};
