import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        // Build date filter for redeem requests
        const dateFilter = start && end ? {
            createdAt: {
                gte: new Date(start),
                lte: new Date(end + 'T23:59:59.999Z'),
            }
        } : {};

        // Get all rewards with their redeem counts
        const rewards = await prisma.reward.findMany({
            include: {
                redeemRequests: {
                    where: {
                        status: { in: ['APPROVED', 'PENDING'] },
                        ...dateFilter,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const data = rewards.map(reward => ({
            id: reward.id,
            name: reward.name,
            category: reward.category,
            pointsCost: reward.pointsCost,
            stock: reward.stock,
            status: reward.status,
            redeemedCount: reward.redeemRequests.filter(r => r.status === 'APPROVED').length,
        }));

        // Sort by redeemed count descending
        data.sort((a, b) => b.redeemedCount - a.redeemedCount);

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Failed to get catalog report:', error);
        return NextResponse.json(
            { error: 'Failed to get catalog report' },
            { status: 500 }
        );
    }
}
