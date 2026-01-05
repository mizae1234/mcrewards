import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// Default quotas for each role
const DEFAULT_QUOTAS: Record<UserRole, number> = {
    Admin: 10000,
    Executive: 5000,
    MiddleManagement: 2000,
    Staff: 500
};

// GET /api/quotas - Get all role allowances with employee counts
export async function GET() {
    try {
        // Get or create role allowances
        const roles = Object.values(UserRole);
        const allowances = [];

        for (const role of roles) {
            let allowance = await prisma.roleAllowance.findUnique({
                where: { role }
            });

            // Create if not exists
            if (!allowance) {
                allowance = await prisma.roleAllowance.create({
                    data: {
                        role,
                        defaultQuota: DEFAULT_QUOTAS[role] || 0
                    }
                });
            }

            // Get employee count for this role
            const employeeCount = await prisma.employee.count({
                where: { role }
            });

            allowances.push({
                id: allowance.id,
                role: allowance.role,
                monthlyQuota: allowance.defaultQuota,
                employeeCount,
                updatedAt: allowance.updatedAt
            });
        }

        return NextResponse.json(allowances);
    } catch (error) {
        console.error('Error fetching quotas:', error);
        return NextResponse.json(
            { error: 'Failed to fetch quotas' },
            { status: 500 }
        );
    }
}

// POST /api/quotas - Create or update role allowance
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { role, defaultQuota, updatedBy } = body;

        if (!role || defaultQuota === undefined) {
            return NextResponse.json(
                { error: 'role and defaultQuota are required' },
                { status: 400 }
            );
        }

        const allowance = await prisma.roleAllowance.upsert({
            where: { role: role as UserRole },
            update: { defaultQuota },
            create: {
                role: role as UserRole,
                defaultQuota
            }
        });

        // Log audit
        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_ROLE_QUOTA',
                entityType: 'RoleAllowance',
                entityId: allowance.id,
                actorId: updatedBy || 'Admin',
                details: {
                    role,
                    newQuota: defaultQuota
                }
            }
        });

        return NextResponse.json(allowance);
    } catch (error) {
        console.error('Error updating quota:', error);
        return NextResponse.json(
            { error: 'Failed to update quota' },
            { status: 500 }
        );
    }
}
