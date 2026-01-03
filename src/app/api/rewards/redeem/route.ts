import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ShippingType, ShippingStatus, RedeemStatus } from '@prisma/client';

// GET /api/rewards/redeem - Get redeem requests (for admin or user's own)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const employeeId = searchParams.get('employeeId');
        const status = searchParams.get('status');
        const all = searchParams.get('all'); // Admin flag to get all requests

        const where: any = {};

        if (employeeId && !all) {
            where.employeeId = employeeId;
        }
        if (status) {
            where.status = status as RedeemStatus;
        }

        const requests = await prisma.redeemRequest.findMany({
            where,
            include: {
                employee: {
                    select: {
                        employeeCode: true,
                        fullname: true,
                        businessUnit: true,
                        department: true,
                        branch: true
                    }
                },
                reward: {
                    select: {
                        name: true,
                        imageUrl: true,
                        isPhysical: true,
                        category: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform to match existing UI interface
        const transformed = requests.map(req => ({
            id: req.id,
            rewardId: req.rewardId,
            rewardName: req.reward.name,
            employeeCode: req.employee.employeeCode,
            employeeName: req.employee.fullname,
            businessUnit: req.employee.businessUnit,
            department: req.employee.department,
            branch: req.employee.branch,
            pointsUsed: req.pointsUsed,
            requestedAt: req.createdAt.toISOString(),
            status: req.status.toLowerCase(),
            shippingType: req.shippingType.toLowerCase(),
            shippingAddress: req.shippingAddress,
            contactPhone: req.contactPhone,
            shippingStatus: req.shippingStatus.toLowerCase().replace('_', '-'),
            tracking: req.trackingNumber ? {
                carrier: req.carrier,
                trackingNumber: req.trackingNumber,
                shippedAt: req.shippedAt?.toISOString(),
                deliveredAt: req.deliveredAt?.toISOString()
            } : undefined,
            note: req.note
        }));

        return NextResponse.json(transformed);
    } catch (error) {
        console.error('Error fetching redeem requests:', error);
        return NextResponse.json(
            { error: 'Failed to fetch redeem requests' },
            { status: 500 }
        );
    }
}

// POST /api/rewards/redeem - Create new redeem request (User)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            employeeId,
            rewardId,
            shippingType,
            shippingAddress,
            contactPhone,
            note
        } = body;

        // Validation
        if (!employeeId || !rewardId) {
            return NextResponse.json(
                { error: 'employeeId and rewardId are required' },
                { status: 400 }
            );
        }

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get reward and check stock
            const reward = await tx.reward.findUnique({
                where: { id: rewardId }
            });

            if (!reward) {
                throw new Error('Reward not found');
            }

            if (reward.stock <= 0) {
                throw new Error('Out of stock');
            }

            if (reward.status !== 'ACTIVE') {
                throw new Error('Reward is not available');
            }

            // 2. Get employee and check points
            const employee = await tx.employee.findUnique({
                where: { id: employeeId }
            });

            if (!employee) {
                throw new Error('Employee not found');
            }

            if (employee.pointsBalance < reward.pointsCost) {
                throw new Error('Insufficient points');
            }

            // 3. Validate shipping address for physical items
            if (reward.isPhysical && shippingType === 'DELIVERY' && !shippingAddress) {
                throw new Error('Shipping address is required for delivery');
            }

            // 4. Deduct stock (points deducted on approval)
            await tx.reward.update({
                where: { id: rewardId },
                data: { stock: reward.stock - 1 }
            });

            // 5. Create redeem request
            const redeemRequest = await tx.redeemRequest.create({
                data: {
                    employeeId,
                    rewardId,
                    pointsUsed: reward.pointsCost,
                    status: RedeemStatus.PENDING,
                    shippingType: (shippingType as ShippingType) || (reward.isPhysical ? ShippingType.PICKUP : ShippingType.DIGITAL),
                    shippingAddress: shippingAddress || null,
                    contactPhone: contactPhone || null,
                    shippingStatus: reward.isPhysical ? ShippingStatus.PENDING : ShippingStatus.NOT_REQUIRED,
                    note: note || null
                }
            });

            // 6. Log audit
            await tx.auditLog.create({
                data: {
                    action: 'CREATE_REDEEM_REQUEST',
                    entityType: 'RedeemRequest',
                    entityId: redeemRequest.id,
                    actorId: employeeId,
                    details: {
                        rewardName: reward.name,
                        pointsUsed: reward.pointsCost
                    }
                }
            });

            return redeemRequest;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Error creating redeem request:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create redeem request' },
            { status: 400 }
        );
    }
}
