import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/quotas/logs - Get individual points change logs
export async function GET() {
    try {
        const logs = await prisma.pointsChangeLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                distribution: {
                    select: {
                        role: true,
                        distributedBy: true
                    }
                }
            }
        });

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('Error fetching logs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch logs' },
            { status: 500 }
        );
    }
}
