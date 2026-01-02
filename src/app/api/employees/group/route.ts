import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET employees filtered by group (department, businessUnit, or branch)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const department = searchParams.get('department');
        const businessUnit = searchParams.get('businessUnit');
        const branch = searchParams.get('branch');
        const excludeId = searchParams.get('excludeId'); // Exclude current user

        // Build where clause based on provided filters
        const where: Record<string, unknown> = {
            // Only include these roles as recipients (exclude Executive)
            role: {
                in: ['MiddleManagement', 'Staff', 'Admin']
            }
        };

        if (department) {
            where.department = department;
        }
        if (businessUnit) {
            where.businessUnit = businessUnit;
        }
        if (branch) {
            where.branch = branch;
        }
        if (excludeId) {
            where.id = { not: excludeId };
        }

        const employees = await prisma.employee.findMany({
            where,
            select: {
                id: true,
                employeeCode: true,
                fullname: true,
                position: true,
                department: true,
                businessUnit: true,
                branch: true,
                role: true,
                avatar: true
            },
            orderBy: { fullname: 'asc' }
        });

        return NextResponse.json(employees);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
