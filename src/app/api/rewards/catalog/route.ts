import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { RewardStatus } from '@prisma/client';

// GET /api/rewards/catalog - List all rewards
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const isPhysical = searchParams.get('isPhysical');
        const category = searchParams.get('category');

        const where: any = {};

        if (status) {
            where.status = status as RewardStatus;
        }
        if (isPhysical !== null && isPhysical !== undefined && isPhysical !== '') {
            where.isPhysical = isPhysical === 'true';
        }
        if (category) {
            where.category = category;
        }

        const rewards = await prisma.reward.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(rewards);
    } catch (error) {
        console.error('Error fetching rewards:', error);
        return NextResponse.json(
            { error: 'Failed to fetch rewards' },
            { status: 500 }
        );
    }
}

// POST /api/rewards/catalog - Create new reward (Admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, imageUrl, category, pointsCost, stock, isPhysical, status, createdBy } = body;

        // Validation
        if (!name || !pointsCost || !category) {
            return NextResponse.json(
                { error: 'Name, pointsCost, and category are required' },
                { status: 400 }
            );
        }

        const reward = await prisma.reward.create({
            data: {
                name,
                description: description || null,
                imageUrl: imageUrl || null,
                category,
                pointsCost: parseInt(pointsCost),
                stock: parseInt(stock) || 0,
                isPhysical: isPhysical ?? true,
                status: status || RewardStatus.ACTIVE,
                createdBy: createdBy || 'system',
                updatedBy: createdBy || 'system'
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'CREATE_REWARD',
                entityType: 'Reward',
                entityId: reward.id,
                actorId: createdBy || 'system',
                details: { name, pointsCost, stock }
            }
        });

        return NextResponse.json(reward, { status: 201 });
    } catch (error) {
        console.error('Error creating reward:', error);
        return NextResponse.json(
            { error: 'Failed to create reward' },
            { status: 500 }
        );
    }
}
