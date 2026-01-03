import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RewardStatus } from '@prisma/client';

// GET /api/rewards/catalog/[id] - Get single reward
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const reward = await prisma.reward.findUnique({
            where: { id }
        });

        if (!reward) {
            return NextResponse.json(
                { error: 'Reward not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(reward);
    } catch (error) {
        console.error('Error fetching reward:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reward' },
            { status: 500 }
        );
    }
}

// PUT /api/rewards/catalog/[id] - Update reward (Admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, description, imageUrl, category, pointsCost, stock, isPhysical, status, updatedBy } = body;

        const existingReward = await prisma.reward.findUnique({
            where: { id }
        });

        if (!existingReward) {
            return NextResponse.json(
                { error: 'Reward not found' },
                { status: 404 }
            );
        }

        const reward = await prisma.reward.update({
            where: { id },
            data: {
                name: name ?? existingReward.name,
                description: description ?? existingReward.description,
                imageUrl: imageUrl ?? existingReward.imageUrl,
                category: category ?? existingReward.category,
                pointsCost: pointsCost !== undefined ? parseInt(pointsCost) : existingReward.pointsCost,
                stock: stock !== undefined ? parseInt(stock) : existingReward.stock,
                isPhysical: isPhysical ?? existingReward.isPhysical,
                status: status ?? existingReward.status,
                updatedBy: updatedBy || 'system'
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_REWARD',
                entityType: 'Reward',
                entityId: reward.id,
                actorId: updatedBy || 'system',
                details: { changes: body }
            }
        });

        return NextResponse.json(reward);
    } catch (error) {
        console.error('Error updating reward:', error);
        return NextResponse.json(
            { error: 'Failed to update reward' },
            { status: 500 }
        );
    }
}

// DELETE /api/rewards/catalog/[id] - Delete reward (Admin only)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if reward has any pending redemptions
        const pendingRedemptions = await prisma.redeemRequest.count({
            where: {
                rewardId: id,
                status: 'PENDING'
            }
        });

        if (pendingRedemptions > 0) {
            return NextResponse.json(
                { error: 'Cannot delete reward with pending redemptions' },
                { status: 400 }
            );
        }

        const reward = await prisma.reward.delete({
            where: { id }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'DELETE_REWARD',
                entityType: 'Reward',
                entityId: id,
                actorId: 'system',
                details: { deletedReward: reward.name }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting reward:', error);
        return NextResponse.json(
            { error: 'Failed to delete reward' },
            { status: 500 }
        );
    }
}
