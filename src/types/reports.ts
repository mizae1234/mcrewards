export interface ReportFilter {
    startDate: string;
    endDate: string;
    businessUnit: string;
    department: string;
    branch: string;
    search: string;
}

export interface EmployeePointsData {
    id: string;
    employeeCode: string;
    name: string;
    role: string;
    businessUnit: string;
    department: string;
    branch: string;
    pointsEarned: number;
    pointsRedeemed: number;
    netPoints: number;
    rank: number;
}

export interface RedemptionData {
    id: string;
    date: string;
    employeeName: string;
    rewardName: string;
    category: string;
    pointsUsed: number;
    businessUnit: string;
    department: string;
    branch: string;
}

export interface GiverData {
    id: string;
    name: string;
    role: string;
    businessUnit: string;
    department: string;
    branch: string;
    pointsGiven: number;
    transactionsCount: number;
    averagePoints: number;
    quotaRemaining: number;
}
