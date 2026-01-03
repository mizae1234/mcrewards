import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RedeemStatus } from '@prisma/client';

// POST /api/admin/redeem-requests/[id]/reject - Reject redeem request
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { rejectedBy, reason } = body;

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

            // 2. Restore stock (was deducted on request creation)
            await tx.reward.update({
                where: { id: redeemRequest.rewardId },
                data: {
                    stock: redeemRequest.reward.stock + 1
                }
            });

            // 3. Update request status
            const updatedRequest = await tx.redeemRequest.update({
                where: { id },
                data: {
                    status: RedeemStatus.REJECTED,
                    rejectedReason: reason || null,
                    approvedBy: rejectedBy || 'Admin',
                    approvedAt: new Date()
                }
            });

            // 4. Log audit
            await tx.auditLog.create({
                data: {
                    action: 'REJECT_REDEEM',
                    entityType: 'RedeemRequest',
                    entityId: id,
                    actorId: rejectedBy || 'Admin',
                    details: {
                        rewardName: redeemRequest.reward.name,
                        employeeName: redeemRequest.employee.fullname,
                        reason: reason || 'No reason provided',
                        stockRestored: true
                    }
                }
            });

            return updatedRequest;
        });

        return NextResponse.json({ success: true, request: result });
    } catch (error: any) {
        console.error('Error rejecting redeem request:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to reject request' },
            { status: 400 }
        );
    }
}
