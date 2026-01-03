import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShippingStatus } from '@prisma/client';

// PUT /api/admin/shipments/[id] - Update shipping status
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            shippingStatus,
            trackingNumber,
            carrier,
            updatedBy
        } = body;

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

        const updateData: any = {
            updatedBy: updatedBy || 'Admin'
        };

        if (shippingStatus) {
            updateData.shippingStatus = shippingStatus as ShippingStatus;

            if (shippingStatus === ShippingStatus.SHIPPED) {
                updateData.shippedAt = new Date();
            } else if (shippingStatus === ShippingStatus.DELIVERED) {
                updateData.deliveredAt = new Date();
            }
        }

        if (trackingNumber !== undefined) {
            updateData.trackingNumber = trackingNumber;
        }

        if (carrier !== undefined) {
            updateData.carrier = carrier;
        }

        const updated = await prisma.redeemRequest.update({
            where: { id },
            data: updateData
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_SHIPPING',
                entityType: 'RedeemRequest',
                entityId: id,
                actorId: updatedBy || 'Admin',
                details: {
                    rewardName: redeemRequest.reward.name,
                    employeeName: redeemRequest.employee.fullname,
                    fromStatus: redeemRequest.shippingStatus,
                    toStatus: shippingStatus,
                    trackingNumber
                }
            }
        });

        return NextResponse.json({ success: true, request: updated });
    } catch (error: any) {
        console.error('Error updating shipping:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update shipping' },
            { status: 400 }
        );
    }
}
