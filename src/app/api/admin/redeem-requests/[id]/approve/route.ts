import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RedeemStatus, ShippingStatus } from '@prisma/client';

// POST /api/admin/redeem-requests/[id]/approve - Approve redeem request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { approvedBy } = body;

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get the request
            const redeemRequest = await tx.redeemRequest.findUnique({
                where: { id },
                include: { reward: true, employee: true }
            });

            if (!redeemRequest) {
                throw new Error('Redeem request not found');
            }

            if (redeemRequest.status !== RedeemStatus.PENDING) {
                throw new Error('Request is not pending');
            }

            // 2. Check employee still has enough points
            if (redeemRequest.employee.pointsBalance < redeemRequest.pointsUsed) {
                throw new Error('Employee no longer has sufficient points');
            }

            // 3. Deduct points from employee
            await tx.employee.update({
                where: { id: redeemRequest.employeeId },
                data: {
                    pointsBalance: redeemRequest.employee.pointsBalance - redeemRequest.pointsUsed
                }
            });

            // 4. Update request status
            const updatedRequest = await tx.redeemRequest.update({
                where: { id },
                data: {
                    status: RedeemStatus.APPROVED,
                    approvedBy: approvedBy || 'Admin',
                    approvedAt: new Date(),
                    shippingStatus: redeemRequest.reward.isPhysical
                        ? ShippingStatus.PROCESSING
                        : ShippingStatus.NOT_REQUIRED
                }
            });

            // 5. Log audit
            await tx.auditLog.create({
                data: {
                    action: 'APPROVE_REDEEM',
                    entityType: 'RedeemRequest',
                    entityId: id,
                    actorId: approvedBy || 'Admin',
                    details: {
                        rewardName: redeemRequest.reward.name,
                        employeeName: redeemRequest.employee.fullname,
                        pointsDeducted: redeemRequest.pointsUsed
                    }
                }
            });

            return updatedRequest;
        });

        return NextResponse.json({ success: true, request: result });
    } catch (error: any) {
        console.error('Error approving redeem request:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to approve request' },
            { status: 400 }
        );
    }
}
