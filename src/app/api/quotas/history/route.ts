import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/quotas/history - Get distribution history
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const role = searchParams.get('role');

        const where: any = {};
        if (role) {
            where.role = role;
        }

        const distributions = await prisma.allowanceDistribution.findMany({
            where,
            orderBy: { distributedAt: 'desc' },
            take: limit,
            include: {
                roleAllowance: {
                    select: {
                        defaultQuota: true
                    }
                }
            }
        });

        // Transform to match existing UI format
        const logs = distributions.map(d => ({
            id: d.id,
            timestamp: d.distributedAt.toISOString(),
            adminId: d.distributedBy,
            role: d.role,
            changeAmount: d.amount,
            quotaBefore: 0, // We don't track before value in new model
            quotaAfter: d.roleAllowance.defaultQuota,
            affectedCount: d.affectedCount,
            note: d.note,
            source: 'distribute' as const
        }));

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching quota history:', error);
        return NextResponse.json(
            { error: 'Failed to fetch history' },
            { status: 500 }
        );
    }
}
