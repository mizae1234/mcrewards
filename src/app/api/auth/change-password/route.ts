import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { employeeId, currentPassword, newPassword } = await request.json();

        if (!employeeId || !currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Missing requirements' },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify current password
        let isValid = false;
        if (employee.password) {
            isValid = await verifyPassword(currentPassword, employee.password);
        } else {
            // Verify against employeeCode if no password set
            isValid = currentPassword === employee.employeeCode;
        }

        if (!isValid) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update
        await prisma.employee.update({
            where: { id: employeeId },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ success: true });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
