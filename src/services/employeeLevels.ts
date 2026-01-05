// Define EmployeeLevel locally to avoid @prisma/client import in services used by client components
// This must match the Prisma schema enum exactly
export enum EmployeeLevel {
    RISING_STAR = 'RISING_STAR',
    ACHIEVER = 'ACHIEVER',
    OUTSTANDING = 'OUTSTANDING',
    EXCELLENT_PERFORMER = 'EXCELLENT_PERFORMER',
    EMPLOYEE_OF_THE_YEAR = 'EMPLOYEE_OF_THE_YEAR',
    HALL_OF_FAME = 'HALL_OF_FAME'
}

// ============================================
// EMPLOYEE LEVEL DEFINITIONS
// Recognition-based Employee Level System
// ============================================

export interface LevelDefinition {
    level: EmployeeLevel;
    order: number; // For comparison
    name: string;
    nameTh: string;
    minPoints: number;
    color: string;
    bgColor: string;
    gradient: string;
    icon: string;
}

export interface LevelProgress {
    currentLevel: LevelDefinition;
    nextLevel: LevelDefinition | null;
    currentPoints: number;
    pointsToNext: number;
    progressPercent: number;
    isMaxLevel: boolean;
    motivationMessage: string;
    motivationMessageTh: string;
}

// Level definitions with thresholds
const LEVEL_DEFINITIONS: LevelDefinition[] = [
    {
        level: EmployeeLevel.RISING_STAR,
        order: 1,
        name: 'Rising Star',
        nameTh: 'ดาวรุ่ง',
        minPoints: 0,
        color: '#3B82F6',
        bgColor: 'bg-blue-500',
        gradient: 'from-blue-400 to-blue-600',
        icon: '⭐'
    },
    {
        level: EmployeeLevel.ACHIEVER,
        order: 2,
        name: 'Achiever',
        nameTh: 'ผู้ประสบความสำเร็จ',
        minPoints: 500,
        color: '#10B981',
        bgColor: 'bg-emerald-500',
        gradient: 'from-emerald-400 to-emerald-600',
        icon: '🏆'
    },
    {
        level: EmployeeLevel.OUTSTANDING,
        order: 3,
        name: 'Outstanding',
        nameTh: 'ยอดเยี่ยม',
        minPoints: 1500,
        color: '#8B5CF6',
        bgColor: 'bg-purple-500',
        gradient: 'from-purple-400 to-purple-600',
        icon: '🌟'
    },
    {
        level: EmployeeLevel.EXCELLENT_PERFORMER,
        order: 4,
        name: 'Excellent Performer',
        nameTh: 'ผู้ปฏิบัติงานดีเลิศ',
        minPoints: 3000,
        color: '#F59E0B',
        bgColor: 'bg-amber-500',
        gradient: 'from-amber-400 to-amber-600',
        icon: '💎'
    },
    {
        level: EmployeeLevel.EMPLOYEE_OF_THE_YEAR,
        order: 5,
        name: 'Employee of the Year',
        nameTh: 'พนักงานแห่งปี',
        minPoints: 5000,
        color: '#EF4444',
        bgColor: 'bg-red-500',
        gradient: 'from-red-400 to-red-600',
        icon: '👑'
    },
    {
        level: EmployeeLevel.HALL_OF_FAME,
        order: 6,
        name: 'Hall of Fame',
        nameTh: 'หอเกียรติยศ',
        minPoints: 10000,
        color: '#FFD700',
        bgColor: 'bg-yellow-400',
        gradient: 'from-yellow-300 via-yellow-400 to-amber-500',
        icon: '🏛️'
    }
];

export const EmployeeLevelService = {
    /**
     * Get all level definitions
     */
    getAllLevels: (): LevelDefinition[] => {
        return [...LEVEL_DEFINITIONS];
    },

    /**
     * Get level definition by enum value
     */
    getLevelDefinition: (level: EmployeeLevel): LevelDefinition => {
        const def = LEVEL_DEFINITIONS.find(l => l.level === level);
        if (!def) {
            return LEVEL_DEFINITIONS[0]; // Default to Rising Star
        }
        return def;
    },

    /**
     * Calculate level from points
     */
    getLevelByPoints: (points: number): LevelDefinition => {
        // Sort descending and find the first level where points >= minPoints
        const sorted = [...LEVEL_DEFINITIONS].sort((a, b) => b.minPoints - a.minPoints);
        for (const level of sorted) {
            if (points >= level.minPoints) {
                return level;
            }
        }
        return LEVEL_DEFINITIONS[0]; // Default to Rising Star
    },

    /**
     * Calculate progress to next level
     */
    getLevelProgress: (currentPoints: number): LevelProgress => {
        const currentLevel = EmployeeLevelService.getLevelByPoints(currentPoints);
        const currentIndex = LEVEL_DEFINITIONS.findIndex(l => l.level === currentLevel.level);
        const nextLevel = currentIndex < LEVEL_DEFINITIONS.length - 1
            ? LEVEL_DEFINITIONS[currentIndex + 1]
            : null;

        const isMaxLevel = !nextLevel;
        let progressPercent = 100;
        let pointsToNext = 0;

        if (nextLevel) {
            const pointsInCurrentLevel = currentPoints - currentLevel.minPoints;
            const pointsNeededForNext = nextLevel.minPoints - currentLevel.minPoints;
            pointsToNext = nextLevel.minPoints - currentPoints;
            progressPercent = Math.min(100, Math.max(0, (pointsInCurrentLevel / pointsNeededForNext) * 100));
        }

        // Motivation messages
        let motivationMessage = isMaxLevel
            ? 'Congratulations! You have reached the highest level!'
            : `${pointsToNext} more points to become ${nextLevel!.name}`;

        let motivationMessageTh = isMaxLevel
            ? 'ยินดีด้วย! คุณอยู่ในระดับสูงสุดแล้ว!'
            : `อีก ${pointsToNext.toLocaleString()} คะแนน เพื่อเลื่อนระดับเป็น ${nextLevel!.nameTh}`;

        return {
            currentLevel,
            nextLevel,
            currentPoints,
            pointsToNext,
            progressPercent,
            isMaxLevel,
            motivationMessage,
            motivationMessageTh
        };
    },

    /**
     * Check if a user at given level can access a reward
     */
    canAccessReward: (userLevel: EmployeeLevel, requiredLevel: EmployeeLevel | null): boolean => {
        if (!requiredLevel) return true; // No level requirement

        const userDef = EmployeeLevelService.getLevelDefinition(userLevel);
        const requiredDef = EmployeeLevelService.getLevelDefinition(requiredLevel);

        return userDef.order >= requiredDef.order;
    },

    /**
     * Get unlock message for a level-locked reward
     */
    getUnlockMessage: (requiredLevel: EmployeeLevel): { en: string; th: string } => {
        const levelDef = EmployeeLevelService.getLevelDefinition(requiredLevel);
        return {
            en: `Unlocks at ${levelDef.name} level`,
            th: `ปลดล็อกได้เมื่อถึงระดับ ${levelDef.nameTh}`
        };
    },

    /**
     * Compare two levels
     * Returns: positive if a > b, negative if a < b, 0 if equal
     */
    compareLevels: (a: EmployeeLevel, b: EmployeeLevel): number => {
        const aOrder = EmployeeLevelService.getLevelDefinition(a).order;
        const bOrder = EmployeeLevelService.getLevelDefinition(b).order;
        return aOrder - bOrder;
    }
};
