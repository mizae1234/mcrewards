import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        // Build date filter
        const dateFilter = start && end ? {
            createdAt: {
                gte: new Date(start),
                lte: new Date(end + 'T23:59:59.999Z'),
            }
        } : {};

        // Get all employees with their transaction allocations and redeem requests
        const employees = await prisma.employee.findMany({
            include: {
                receivedAllocations: {
                    where: dateFilter,
                },
                redeemRequests: {
                    where: {
                        status: 'APPROVED',
                        ...dateFilter,
                    },
                },
            },
            orderBy: {
                fullname: 'asc',
            },
        });

        const data = employees.map(emp => {
            // Calculate points received from allocations
            const pointsReceived = emp.receivedAllocations.reduce((sum, alloc) => sum + alloc.points, 0);

            // Calculate points used from approved redeem requests
            const pointsUsed = emp.redeemRequests.reduce((sum, req) => sum + req.pointsUsed, 0);

            return {
                id: emp.id,
                employeeCode: emp.employeeCode,
                name: emp.fullname,
                department: emp.department,
                branch: emp.branch,
                quota: emp.quota,
                pointsReceived,
                pointsUsed,
                balance: emp.pointsBalance,
            };
        });

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Failed to get employee points report:', error);
        return NextResponse.json(
            { error: 'Failed to get employee points report' },
            { status: 500 }
        );
    }
}
