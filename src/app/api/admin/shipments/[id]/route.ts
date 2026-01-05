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
            updatedBy,
            returnReason
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

        // Check if this is a RETURNED status change
        const isReturning = shippingStatus === ShippingStatus.RETURNED &&
            redeemRequest.shippingStatus !== ShippingStatus.RETURNED;

        if (isReturning) {
            // Use transaction to restore stock and points atomically
            const result = await prisma.$transaction(async (tx) => {
                // 1. Restore stock
                await tx.reward.update({
                    where: { id: redeemRequest.rewardId },
                    data: {
                        stock: redeemRequest.reward.stock + 1
                    }
                });

                // 2. Refund points to employee
                await tx.employee.update({
                    where: { id: redeemRequest.employeeId },
                    data: {
                        pointsBalance: redeemRequest.employee.pointsBalance + redeemRequest.pointsUsed
                    }
                });

                // 3. Update shipping status
                const updateData: any = {
                    shippingStatus: ShippingStatus.RETURNED
                };

                if (trackingNumber !== undefined) {
                    updateData.trackingNumber = trackingNumber;
                }
                if (carrier !== undefined) {
                    updateData.carrier = carrier;
                }

                const updated = await tx.redeemRequest.update({
                    where: { id },
                    data: updateData
                });

                // 4. Log audit
                await tx.auditLog.create({
                    data: {
                        action: 'SHIPPING_RETURNED',
                        entityType: 'RedeemRequest',
                        entityId: id,
                        actorId: updatedBy || 'Admin',
                        details: {
                            rewardName: redeemRequest.reward.name,
                            employeeName: redeemRequest.employee.fullname,
                            fromStatus: redeemRequest.shippingStatus,
                            toStatus: 'RETURNED',
                            stockRestored: true,
                            pointsRefunded: redeemRequest.pointsUsed,
                            returnReason: returnReason || 'No reason provided'
                        }
                    }
                });

                return updated;
            });

            return NextResponse.json({ success: true, request: result });
        } else {
            // Normal status update (no refund needed)
            const updateData: any = {};

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
        }
    } catch (error: any) {
        console.error('Error updating shipping:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update shipping' },
            { status: 400 }
        );
    }
}

