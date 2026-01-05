import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShippingStatus } from '@prisma/client';

// PUT /api/rewards/redeem/[id]/confirm-delivery - User confirms they received the item
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { employeeId } = body;

        if (!employeeId) {
            return NextResponse.json(
                { error: 'employeeId is required' },
                { status: 400 }
            );
        }

        // Get the redeem request
        const redeemRequest = await prisma.redeemRequest.findUnique({
            where: { id },
            include: { reward: true, employee: true }
        });

        if (!redeemRequest) {
            return NextResponse.json(
                { error: 'Redeem request not found' },
                { status: 404 }
            );
        }

        // Verify the request belongs to this employee
        if (redeemRequest.employeeId !== employeeId) {
            return NextResponse.json(
                { error: 'Unauthorized - This request does not belong to you' },
                { status: 403 }
            );
        }

        // Verify the current status is SHIPPED
        if (redeemRequest.shippingStatus !== ShippingStatus.SHIPPED) {
            return NextResponse.json(
                { error: `Cannot confirm delivery. Current status is ${redeemRequest.shippingStatus}` },
                { status: 400 }
            );
        }

        // Update to DELIVERED
        const updated = await prisma.redeemRequest.update({
            where: { id },
            data: {
                shippingStatus: ShippingStatus.DELIVERED,
                deliveredAt: new Date()
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'USER_CONFIRM_DELIVERY',
                entityType: 'RedeemRequest',
                entityId: id,
                actorId: employeeId,
                details: {
                    rewardName: redeemRequest.reward.name,
                    employeeName: redeemRequest.employee.fullname,
                    confirmedByUser: true
                }
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Delivery confirmed successfully',
            request: {
                id: updated.id,
                shippingStatus: updated.shippingStatus
            }
        });
    } catch (error: any) {
        console.error('Error confirming delivery:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to confirm delivery' },
            { status: 400 }
        );
    }
}
