import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { TransactionType, TransactionStatus } from '@prisma/client';

interface GroupRewardRequest {
    giverId: string;
    groupType: 'department' | 'businessUnit' | 'branch';
    groupValue: string;
    totalPoints: number;
    categoryId: string;
    message?: string;
    distributionMode: 'equal' | 'custom';
    customAllocations?: { recipientId: string; points: number }[];
}

export async function POST(request: NextRequest) {
    try {
        const body: GroupRewardRequest = await request.json();
        const {
            giverId,
            groupType,
            groupValue,
            totalPoints,
            categoryId,
            message,
            distributionMode,
            customAllocations
        } = body;

        // Validation
        if (!giverId || !groupType || !groupValue || !categoryId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Fetch giver
        const giver = await prisma.employee.findUnique({
            where: { id: giverId }
        });

        if (!giver) {
            return NextResponse.json(
                { error: 'Giver not found' },
                { status: 404 }
            );
        }

        // Verify category
        const category = await prisma.rewardCategory.findUnique({
            where: { id: categoryId }
        });

        if (!category || !category.isActive) {
            return NextResponse.json(
                { error: 'Category not found or inactive' },
                { status: 400 }
            );
        }

        // Fetch group members (exclude Executive role - only MiddleManagement, Staff, Admin can receive)
        const groupFilter: Record<string, string> = {};
        groupFilter[groupType] = groupValue;

        const members = await prisma.employee.findMany({
            where: {
                ...groupFilter,
                id: { not: giverId }, // Exclude giver
                role: {
                    in: ['MiddleManagement', 'Staff', 'Admin'] // Exclude Executive
                }
            }
        });

        if (members.length === 0) {
            return NextResponse.json(
                { error: 'No eligible members found in the selected group' },
                { status: 400 }
            );
        }

        // Calculate allocations
        let allocations: { recipientId: string; points: number }[];

        if (distributionMode === 'custom' && customAllocations) {
            // Validate custom allocations
            const memberIds = new Set(members.map(m => m.id));
            for (const alloc of customAllocations) {
                if (!memberIds.has(alloc.recipientId)) {
                    return NextResponse.json(
                        { error: `Recipient ${alloc.recipientId} is not in the selected group` },
                        { status: 400 }
                    );
                }
                if (alloc.points <= 0) {
                    return NextResponse.json(
                        { error: 'All allocations must have positive points' },
                        { status: 400 }
                    );
                }
            }
            allocations = customAllocations;
        } else {
            // Equal distribution - totalPoints is per person, not divided
            if (totalPoints <= 0) {
                return NextResponse.json(
                    { error: 'Points per person must be greater than 0' },
                    { status: 400 }
                );
            }
            // Give each person the full totalPoints amount
            allocations = members.map(m => ({
                recipientId: m.id,
                points: totalPoints // Each person gets this amount
            }));
        }

        // Calculate actual total
        const actualTotal = allocations.reduce((sum, a) => sum + a.points, 0);

        // Check quota
        if (giver.quota < actualTotal) {
            return NextResponse.json(
                { error: `Insufficient quota. Available: ${giver.quota}, Requested: ${actualTotal}` },
                { status: 400 }
            );
        }

        // Execute atomic transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct quota from giver
            await tx.employee.update({
                where: { id: giverId },
                data: { quota: { decrement: actualTotal } }
            });

            // 2. Add points to all recipients
            for (const alloc of allocations) {
                await tx.employee.update({
                    where: { id: alloc.recipientId },
                    data: { pointsBalance: { increment: alloc.points } }
                });
            }

            // 3. Create transaction with all allocations
            const transaction = await tx.rewardTransaction.create({
                data: {
                    type: TransactionType.GROUP,
                    totalPoints: actualTotal,
                    status: TransactionStatus.COMPLETED,
                    message,
                    groupType,
                    groupValue,
                    source: 'group',
                    giverId,
                    createdBy: giverId,
                    updatedBy: giverId,
                    allocations: {
                        create: allocations.map(alloc => ({
                            recipientId: alloc.recipientId,
                            categoryId,
                            points: alloc.points,
                            createdBy: giverId,
                            updatedBy: giverId
                        }))
                    }
                },
                include: {
                    allocations: {
                        include: {
                            recipient: true,
                            category: true
                        }
                    },
                    giver: true
                }
            });

            return transaction;
        });

        return NextResponse.json({
            success: true,
            transaction: result,
            summary: {
                totalPoints: actualTotal,
                recipientCount: allocations.length,
                groupType,
                groupValue
            },
            message: `Successfully distributed ${actualTotal} points to ${allocations.length} members`
        });

    } catch (error: unknown) {
        console.error('Group reward error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
