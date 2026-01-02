import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { TransactionType, TransactionStatus } from '@prisma/client';

interface SingleRewardRequest {
    giverId: string;
    recipientId: string;
    points: number;
    categoryId: string;
    message?: string;
    source: 'manual' | 'qr';
}

export async function POST(request: NextRequest) {
    try {
        const body: SingleRewardRequest = await request.json();
        const { giverId, recipientId, points, categoryId, message, source } = body;

        // Validation
        if (!giverId || !recipientId || !points || !categoryId) {
            return NextResponse.json(
                { error: 'Missing required fields: giverId, recipientId, points, categoryId' },
                { status: 400 }
            );
        }

        if (points <= 0) {
            return NextResponse.json(
                { error: 'Points must be greater than 0' },
                { status: 400 }
            );
        }

        if (giverId === recipientId) {
            return NextResponse.json(
                { error: 'Cannot give points to yourself' },
                { status: 400 }
            );
        }

        // Fetch giver and verify quota
        const giver = await prisma.employee.findUnique({
            where: { id: giverId }
        });

        if (!giver) {
            return NextResponse.json(
                { error: 'Giver not found' },
                { status: 404 }
            );
        }

        if (giver.quota < points) {
            return NextResponse.json(
                { error: `Insufficient quota. Available: ${giver.quota}, Requested: ${points}` },
                { status: 400 }
            );
        }

        // Fetch recipient
        const recipient = await prisma.employee.findUnique({
            where: { id: recipientId }
        });

        if (!recipient) {
            return NextResponse.json(
                { error: 'Recipient not found' },
                { status: 404 }
            );
        }

        // Verify category exists and is active
        const category = await prisma.rewardCategory.findUnique({
            where: { id: categoryId }
        });

        if (!category || !category.isActive) {
            return NextResponse.json(
                { error: 'Category not found or inactive' },
                { status: 400 }
            );
        }

        // Execute atomic transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Deduct quota from giver
            await tx.employee.update({
                where: { id: giverId },
                data: { quota: { decrement: points } }
            });

            // 2. Add points to recipient
            await tx.employee.update({
                where: { id: recipientId },
                data: { pointsBalance: { increment: points } }
            });

            // 3. Create transaction record
            const transaction = await tx.rewardTransaction.create({
                data: {
                    type: TransactionType.SINGLE,
                    totalPoints: points,
                    status: TransactionStatus.COMPLETED,
                    message,
                    source: source || 'manual',
                    giverId,
                    createdBy: giverId,
                    updatedBy: giverId,
                    allocations: {
                        create: {
                            recipientId,
                            categoryId,
                            points,
                            createdBy: giverId,
                            updatedBy: giverId
                        }
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
            message: `Successfully gave ${points} points to ${recipient.fullname}`
        });

    } catch (error: unknown) {
        console.error('Single reward error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
