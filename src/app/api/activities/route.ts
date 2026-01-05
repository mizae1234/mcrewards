import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/activities - Get recent activities for a user (give, receive, redeem)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!employeeId) {
            return NextResponse.json(
                { error: 'employeeId is required' },
                { status: 400 }
            );
        }

        // Get recent activities from different sources
        const [receivedAllocations, givenTransactions, redeemRequests] = await Promise.all([
            // Points received
            prisma.transactionAllocation.findMany({
                where: { recipientId: employeeId },
                include: {
                    transaction: {
                        include: { giver: { select: { fullname: true } } }
                    },
                    category: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            }),
            // Points given
            prisma.rewardTransaction.findMany({
                where: { giverId: employeeId },
                include: {
                    allocations: {
                        include: {
                            recipient: { select: { fullname: true } }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            }),
            // Redeem requests
            prisma.redeemRequest.findMany({
                where: { employeeId },
                include: {
                    reward: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: limit
            })
        ]);

        // Transform to unified activity format
        const activities: any[] = [];

        // Transform received points
        receivedAllocations.forEach(alloc => {
            activities.push({
                id: alloc.id,
                type: 'received',
                date: alloc.createdAt,
                points: alloc.points,
                message: alloc.transaction.message || `Received from ${alloc.transaction.giver.fullname}`,
                category: alloc.category.name,
                icon: 'gift'
            });
        });

        // Transform given points
        givenTransactions.forEach(tx => {
            const recipientNames = tx.allocations
                .map(a => a.recipient.fullname)
                .slice(0, 2)
                .join(', ');
            const extraCount = tx.allocations.length > 2 ? ` +${tx.allocations.length - 2} more` : '';

            activities.push({
                id: tx.id,
                type: 'given',
                date: tx.createdAt,
                points: tx.totalPoints,
                message: `Gave to ${recipientNames}${extraCount}`,
                icon: 'send'
            });
        });

        // Transform redeem requests
        redeemRequests.forEach(req => {
            activities.push({
                id: req.id,
                type: 'redeem',
                date: req.createdAt,
                points: req.pointsUsed,
                message: `Redeemed: ${req.reward.name}`,
                status: req.status.toLowerCase(),
                icon: 'shopping-bag'
            });
        });

        // Sort by date descending and limit
        activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const limitedActivities = activities.slice(0, limit);

        return NextResponse.json(limitedActivities);
    } catch (error) {
        console.error('Error fetching activities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activities' },
            { status: 500 }
        );
    }
}
