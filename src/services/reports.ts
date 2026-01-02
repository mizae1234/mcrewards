import { ReportFilter, EmployeePointsData, RedemptionData, GiverData } from '../types/reports';
import seedData from '@/lib/seedAdmin.json';

// Helper to filter data (mock)
const isWithinDate = (dateStr: string, start: string, end: string) => {
    const d = new Date(dateStr).getTime();
    const s = start ? new Date(start).getTime() : 0;
    const e = end ? new Date(end).getTime() : Infinity;
    return d >= s && d <= e;
};

const matchesText = (text: string, query: string) => {
    if (!query) return true;
    return text.toLowerCase().includes(query.toLowerCase());
};

const matchesOrg = (item: any, filter: ReportFilter) => {
    if (filter.businessUnit && item.businessUnit !== filter.businessUnit) return false;
    if (filter.department && item.department !== filter.department) return false;
    if (filter.branch && item.branch !== filter.branch) return false;
    return true;
};

export const ReportsApi = {
    getEmployeePointsSummary: async (filter: ReportFilter): Promise<EmployeePointsData[]> => {
        // Simulate API delay
        await new Promise(r => setTimeout(r, 600));

        // Mock Aggregation from seed users + transactions
        // For now, we'll map users to mock data for demo purposes, 
        // in real app this would query the backend DB.

        // Fix: seedData.users is the array directly (based on seedAdmin.json structure)
        return seedData.users.map((u, index) => ({
            id: u.id,
            employeeCode: u.employeeCode,
            name: `${u.firstName} ${u.lastName}`,
            role: u.role,
            businessUnit: u.businessUnit || 'HQ',
            department: u.department || 'General',
            branch: u.branch || 'Main',
            pointsEarned: u.pointsBalance + Math.floor(Math.random() * 5000), // Mock historical data
            pointsRedeemed: Math.floor(Math.random() * 2000),
            netPoints: u.pointsBalance,
            rank: index + 1
        })).filter(u =>
            matchesText(u.name, filter.search) &&
            matchesOrg(u, filter)
        );
    },

    getRewardRedemptions: async (filter: ReportFilter): Promise<RedemptionData[]> => {
        await new Promise(r => setTimeout(r, 600));

        // Mock Transactions
        // In real app, filter seedData.transactions where type === 'REDEEM'

        const mockRedemptions: RedemptionData[] = Array.from({ length: 50 }).map((_, i) => ({
            id: `r-${i}`,
            date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
            employeeName: `Employee ${i}`,
            rewardName: `Reward ${i % 5}`,
            category: 'Lifestyle',
            pointsUsed: (i % 5 + 1) * 100,
            businessUnit: 'Ops',
            department: 'Store',
            branch: 'Branch A'
        }));

        return mockRedemptions.filter(r =>
            isWithinDate(r.date, filter.startDate, filter.endDate) &&
            matchesText(r.employeeName, filter.search) &&
            matchesOrg(r, filter)
        );
    },

    getGiverSummary: async (filter: ReportFilter): Promise<GiverData[]> => {
        await new Promise(r => setTimeout(r, 600));

        // Fix: seedData.users is the array directly
        return seedData.users
            .filter(u => ['Admin', 'Executive', 'Middle Management'].includes(u.role))
            .map(u => ({
                id: u.id,
                name: `${u.firstName} ${u.lastName}`,
                role: u.role,
                businessUnit: u.businessUnit || 'HQ',
                department: u.department || 'General',
                branch: u.branch || 'Main',
                pointsGiven: Math.floor(Math.random() * 10000),
                transactionsCount: Math.floor(Math.random() * 50),
                averagePoints: Math.floor(Math.random() * 500),
                quotaRemaining: u.quotaRemaining
            })).filter(u =>
                matchesText(u.name, filter.search) &&
                matchesOrg(u, filter)
            );
    }
};
