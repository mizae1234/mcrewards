import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('start');
        const endDate = searchParams.get('end');

        const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999); // Include full end day

        // 1. KPI Stats
        // Points Issued (from AllowanceDistribution - positive amounts)
        const pointsIssuedResult = await prisma.allowanceDistribution.aggregate({
            _sum: { amount: true },
            where: {
                distributedAt: { gte: start, lte: end },
                amount: { gt: 0 }
            }
        });
        const totalPointsIssued = pointsIssuedResult._sum?.amount || 0;

        // Points Redeemed (from RedeemRequest - approved)
        const pointsRedeemedResult = await prisma.redeemRequest.aggregate({
            _sum: { pointsUsed: true },
            where: {
                createdAt: { gte: start, lte: end },
                status: 'APPROVED'
            }
        });
        const totalPointsRedeemed = pointsRedeemedResult._sum?.pointsUsed || 0;

        // Pending Requests
        const pendingRequests = await prisma.redeemRequest.count({
            where: { status: 'PENDING' }
        });

        // Active Users (employees with transactions in period)
        const activePointsLogs = await prisma.pointsChangeLog.findMany({
            where: { createdAt: { gte: start, lte: end } },
            select: { employeeId: true },
            distinct: ['employeeId']
        });
        const activeUsersCount = activePointsLogs.length;

        // Active Departments
        const activeEmployees = await prisma.employee.findMany({
            where: {
                id: { in: activePointsLogs.map(l => l.employeeId) }
            },
            select: { department: true }
        });
        const activeDepts = new Set(activeEmployees.map(e => e.department).filter(Boolean));
        const activeDeptsCount = activeDepts.size;

        // 2. Catalog Performance (Top redeemed rewards)
        const rewards = await prisma.reward.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const rewardStats = await Promise.all(rewards.map(async (reward) => {
            const redeemCount = await prisma.redeemRequest.count({
                where: {
                    rewardId: reward.id,
                    createdAt: { gte: start, lte: end }
                }
            });
            return {
                id: reward.id,
                name: reward.name,
                category: reward.category,
                pointsCost: reward.pointsCost,
                stock: reward.stock,
                status: reward.status,
                redeemedCount: redeemCount
            };
        }));

        // Sort by redeemed count descending
        const catalogStats = rewardStats.sort((a, b) => b.redeemedCount - a.redeemedCount);

        // 3. User Activity (employees with most activity)
        const employees = await prisma.employee.findMany();

        const userActivity = await Promise.all(employees.slice(0, 20).map(async (emp) => {
            // Points received (quota allocations)
            const receivedResult = await prisma.pointsChangeLog.aggregate({
                _sum: { actualChange: true },
                where: {
                    employeeId: emp.id,
                    createdAt: { gte: start, lte: end },
                    actualChange: { gt: 0 }
                }
            });

            // Redemptions
            const redeemCount = await prisma.redeemRequest.count({
                where: {
                    employeeId: emp.id,
                    createdAt: { gte: start, lte: end }
                }
            });

            return {
                id: emp.id,
                name: emp.fullname || emp.employeeCode,
                department: emp.department || '-',
                given: 0, // Not applicable in current model
                received: receivedResult._sum?.actualChange || 0,
                redeemed: redeemCount
            };
        }));

        // Sort by activity (received + redeemed)
        const sortedUserActivity = userActivity
            .filter(u => u.received > 0 || u.redeemed > 0)
            .sort((a, b) => (b.received + b.redeemed) - (a.received + a.redeemed));

        // 4. Department Activity
        const deptMap: Record<string, { given: number; received: number; redeemed: number; users: Set<string> }> = {};

        for (const user of sortedUserActivity) {
            if (user.department && user.department !== '-') {
                if (!deptMap[user.department]) {
                    deptMap[user.department] = { given: 0, received: 0, redeemed: 0, users: new Set() };
                }
                deptMap[user.department].received += user.received;
                deptMap[user.department].redeemed += user.redeemed;
                deptMap[user.department].users.add(user.id);
            }
        }

        const teamActivity = Object.entries(deptMap).map(([dept, stats]) => ({
            department: dept,
            given: stats.given,
            received: stats.received,
            redeemed: stats.redeemed,
            activeUsersCount: stats.users.size
        })).sort((a, b) => (b.received + b.redeemed) - (a.received + a.redeemed));

        return NextResponse.json({
            kpi: {
                totalPointsIssued,
                totalPointsRedeemed,
                pendingRequests,
                activeUsersCount,
                activeDeptsCount
            },
            catalog: catalogStats,
            userActivity: sortedUserActivity.slice(0, 10),
            teamActivity
        });

    } catch (error: any) {
        console.error('Error fetching dashboard:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}
