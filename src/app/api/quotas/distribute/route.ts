import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// POST /api/quotas/distribute - Bulk add/subtract points to employees by role
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { role, amount, adminId, note } = body;

        // Validation - allow negative amounts (for deduction)
        if (!role || amount === undefined || amount === 0) {
            return NextResponse.json(
                { error: 'role and non-zero amount are required' },
                { status: 400 }
            );
        }

        // Validate role enum
        if (!Object.values(UserRole).includes(role as UserRole)) {
            return NextResponse.json(
                { error: 'Invalid role' },
                { status: 400 }
            );
        }

        const isDeduction = amount < 0;

        // Get role allowance (create if needed)
        let roleAllowance = await prisma.roleAllowance.findUnique({
            where: { role: role as UserRole }
        });

        if (!roleAllowance) {
            roleAllowance = await prisma.roleAllowance.create({
                data: {
                    role: role as UserRole,
                    defaultQuota: Math.abs(amount)
                }
            });
        }

        // Use transaction for atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // 1. Get all employees with this role (need more fields for logging)
            const employees = await tx.employee.findMany({
                where: { role: role as UserRole },
                select: {
                    id: true,
                    employeeCode: true,
                    fullname: true,
                    pointsBalance: true,
                    quota: true
                }
            });

            if (employees.length === 0) {
                return {
                    affectedCount: 0,
                    message: `No employees found with role ${role}`
                };
            }

            // 2. Create distribution record first (to get ID for logs)
            const distribution = await tx.allowanceDistribution.create({
                data: {
                    roleAllowanceId: roleAllowance!.id,
                    role: role as UserRole,
                    amount,
                    affectedCount: employees.length,
                    distributedBy: adminId || 'Admin',
                    note: note || `${isDeduction ? 'Deducted' : 'Added'} ${Math.abs(amount).toLocaleString()} points ${isDeduction ? 'from' : 'to'} ${employees.length} ${role} employees`
                }
            });

            // 3. Update each employee and create individual log
            let totalActualChange = 0;
            const changeLogs = [];

            for (const emp of employees) {
                const pointsBefore = emp.pointsBalance;
                let newBalance: number;

                if (isDeduction) {
                    // For deduction: ensure balance doesn't go below 0
                    newBalance = Math.max(0, pointsBefore + amount);
                } else {
                    // For addition: simply add
                    newBalance = pointsBefore + amount;
                }

                const actualChange = newBalance - pointsBefore;
                totalActualChange += actualChange;

                // Debug log
                console.log(`[ALLOCATE] Employee ${emp.employeeCode}: ${pointsBefore} + ${amount} = ${newBalance}`);

                // Update employee
                await tx.employee.update({
                    where: { id: emp.id },
                    data: {
                        pointsBalance: newBalance,
                        quota: Math.abs(amount) // Update quota to latest allowance
                    }
                });

                // Create individual log entry
                changeLogs.push({
                    distributionId: distribution.id,
                    employeeId: emp.id,
                    employeeCode: emp.employeeCode,
                    employeeName: emp.fullname,
                    pointsBefore,
                    pointsChange: amount,
                    actualChange,
                    pointsAfter: newBalance
                });
            }

            // 4. Batch create all change logs
            await tx.pointsChangeLog.createMany({
                data: changeLogs
            });

            // 5. Log audit
            await tx.auditLog.create({
                data: {
                    action: isDeduction ? 'DEDUCT_QUOTA' : 'ADD_QUOTA',
                    entityType: 'AllowanceDistribution',
                    entityId: distribution.id,
                    actorId: adminId || 'Admin',
                    details: {
                        role,
                        amount,
                        affectedCount: employees.length,
                        totalActualChange,
                        note
                    }
                }
            });

            return {
                distributionId: distribution.id,
                affectedCount: employees.length,
                totalPointsChanged: totalActualChange,
                isDeduction
            };
        });

        const actionText = result.isDeduction ? 'หัก' : 'เพิ่ม';
        return NextResponse.json({
            success: true,
            ...result,
            message: `${actionText} ${Math.abs(amount).toLocaleString()} points ${result.isDeduction ? 'จาก' : 'ให้'} ${result.affectedCount} ${role} employees สำเร็จ`
        });
    } catch (error: any) {
        console.error('Error distributing quota:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to distribute quota' },
            { status: 500 }
        );
    }
}
