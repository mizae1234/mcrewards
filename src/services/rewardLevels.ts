import { RewardLevel } from '@/types';

export interface ProgressData {
    currentLevel: RewardLevel;
    nextLevel: RewardLevel | null;
    progressPercent: number;
    pointsToNext: number;
    currentBase: number;
    nextThreshold: number;
    isMaxLevel: boolean;
}

// Reward from API
interface CatalogReward {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    pointsCost: number;
    stock: number;
    isPhysical: boolean;
    status: string;
    minLevelRequired: string | null; // EmployeeLevel enum value from DB
}

// Map EmployeeLevel enum to display title
const LEVEL_TITLES: Record<string, string> = {
    'RISING_STAR': 'Rising Star',
    'ACHIEVER': 'Achiever',
    'OUTSTANDING': 'Outstanding',
    'EXCELLENT_PERFORMER': 'Excellent Performer',
    'EMPLOYEE_OF_THE_YEAR': 'Employee of the Year',
    'HALL_OF_FAME': 'Hall of Fame'
};

// Map EmployeeLevel enum to minimum points required
const LEVEL_MIN_POINTS: Record<string, number> = {
    'RISING_STAR': 0,
    'ACHIEVER': 100,
    'OUTSTANDING': 300,
    'EXCELLENT_PERFORMER': 600,
    'EMPLOYEE_OF_THE_YEAR': 1000,
    'HALL_OF_FAME': 2000
};

export const LevelService = {
    getLevels: async (): Promise<RewardLevel[]> => {
        try {
            // Fetch rewards from real database API
            const res = await fetch('/api/rewards/catalog?status=ACTIVE');
            if (!res.ok) throw new Error('Failed to fetch rewards');

            const rewards: CatalogReward[] = await res.json();

            // Transform to RewardLevel format and sort by pointsCost
            const levels = rewards
                .filter(r => r.status === 'ACTIVE')
                .map(r => {
                    // Use minLevelRequired from DB if available, otherwise fallback based on points
                    const levelKey = r.minLevelRequired || getLevelFromPoints(r.pointsCost);
                    const title = LEVEL_TITLES[levelKey] || levelKey || 'All Levels';
                    const minPoint = LEVEL_MIN_POINTS[levelKey] ?? 0;

                    return {
                        id: r.id,
                        name: r.name,
                        description: r.description || '',
                        imageUrl: r.imageUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(r.name.substring(0, 2)),
                        costPoints: r.pointsCost,
                        stock: r.stock,
                        minPoint: minPoint, // Use level-based unlock threshold
                        title: title.toUpperCase(),
                        levelTitle: title,
                        category: r.category,
                        isPhysical: r.isPhysical,
                        minLevelRequired: r.minLevelRequired
                    };
                })
                .sort((a, b) => a.minPoint - b.minPoint);

            return levels;
        } catch (error) {
            console.error('Failed to fetch levels from API:', error);
            return [];
        }
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

// Helper function to get level key from points (fallback when minLevelRequired is null)
function getLevelFromPoints(points: number): string {
    if (points >= 2000) return 'HALL_OF_FAME';
    if (points >= 1000) return 'EMPLOYEE_OF_THE_YEAR';
    if (points >= 600) return 'EXCELLENT_PERFORMER';
    if (points >= 300) return 'OUTSTANDING';
    if (points >= 100) return 'ACHIEVER';
    return 'RISING_STAR';
}

