import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        // Step 1: Verify Identity
        if (action === 'verify') {
            const { employeeCode, dateOfBirth } = body;

            if (!employeeCode || !dateOfBirth) {
                return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
            }

            const employee = await prisma.employee.findUnique({
                where: { employeeCode }
            });

            if (!employee) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }

            if (!employee.dateOfBirth) {
                return NextResponse.json(
                    { error: 'Date of birth not set in system. Please contact HR.' },
                    { status: 400 }
                );
            }

            // Compare dates (ignoring time)
            const inputDate = new Date(dateOfBirth).toISOString().split('T')[0];
            const dbDate = new Date(employee.dateOfBirth).toISOString().split('T')[0];

            if (inputDate !== dbDate) {
                return NextResponse.json({ error: 'Incorrect Date of Birth' }, { status: 400 });
            }

            return NextResponse.json({ success: true });
        }

        // Step 2: Reset Password
        if (action === 'reset') {
            const { employeeCode, dateOfBirth, newPassword } = body;

            // Re-verify strictly before changing
            const employee = await prisma.employee.findUnique({
                where: { employeeCode }
            });

            if (!employee || !employee.dateOfBirth) {
                return NextResponse.json({ error: 'User validation failed' }, { status: 400 });
            }

            const inputDate = new Date(dateOfBirth).toISOString().split('T')[0];
            const dbDate = new Date(employee.dateOfBirth).toISOString().split('T')[0];

            if (inputDate !== dbDate) {
                return NextResponse.json({ error: 'Incorrect Date of Birth' }, { status: 400 });
            }

            const hashedPassword = await hashPassword(newPassword);

            await prisma.employee.update({
                where: { employeeCode },
                data: { password: hashedPassword }
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
