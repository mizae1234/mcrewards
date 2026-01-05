import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// PUT /api/quotas/[role] - Update default quota for a role
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ role: string }> }
) {
    try {
        const { role } = await params;
        const body = await request.json();
        const { defaultQuota, updatedBy } = body;

        // Validate role
        const roleEnum = role as UserRole;
        if (!Object.values(UserRole).includes(roleEnum)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        if (defaultQuota === undefined || defaultQuota < 0) {
            return NextResponse.json(
                { error: 'defaultQuota must be a non-negative number' },
                { status: 400 }
            );
        }

        const allowance = await prisma.roleAllowance.upsert({
            where: { role: roleEnum },
            update: { defaultQuota },
            create: {
                role: roleEnum,
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
                    role: roleEnum,
                    newQuota: defaultQuota
                }
            }
        });

        return NextResponse.json({
            success: true,
            role: allowance.role,
            defaultQuota: allowance.defaultQuota
        });
    } catch (error: any) {
        console.error('Error updating role quota:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update quota' },
            { status: 500 }
        );
    }
}
