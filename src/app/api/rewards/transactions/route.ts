import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET transactions with optional filters
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const giverId = searchParams.get('giverId');
        const recipientId = searchParams.get('recipientId');
        const type = searchParams.get('type'); // SINGLE, GROUP
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Build where clause
        const where: any = {};

        if (giverId) {
            where.giverId = giverId;
        }

        if (recipientId) {
            where.allocations = {
                some: { recipientId }
            };
        }

        if (type) {
            where.type = type;
        }

        const [transactions, total] = await Promise.all([
            prisma.rewardTransaction.findMany({
                where,
                include: {
                    giver: {
                        select: {
                            id: true,
                            employeeCode: true,
                            fullname: true,
                            department: true,
                            avatar: true
                        }
                    },
                    allocations: {
                        include: {
                            recipient: {
                                select: {
                                    id: true,
                                    employeeCode: true,
                                    fullname: true,
                                    department: true,
                                    avatar: true
                                }
                            },
                            category: {
                                select: {
                                    id: true,
                                    name: true,
                                    color: true,
                                    icon: true
                                }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.rewardTransaction.count({ where })
        ]);

        return NextResponse.json({
            transactions,
            total,
            limit,
            offset,
            hasMore: offset + transactions.length < total
        });

    } catch (error: unknown) {
        console.error('Transactions fetch error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
