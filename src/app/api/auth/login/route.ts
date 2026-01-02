import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { employeeCode, password } = await request.json();

        if (!employeeCode || !password) {
            return NextResponse.json(
                { error: 'Employee Code and Password are required' },
                { status: 400 }
            );
        }

        const employee = await prisma.employee.findFirst({
            where: {
                OR: [
                    { employeeCode },
                    { email: employeeCode }
                ]
            }
        });

        if (!employee) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        let isValid = false;
        let isDefaultPassword = false;

        if (employee.password) {
            // Check hashed password
            isValid = await verifyPassword(password, employee.password);
        } else {
            // Backward compatibility: check if password matches employeeCode
            // Case insensitive check for legacy text match? 
            // Usually IDs are case insensitive in login but passwords accurate.
            // Let's assume straight match for now or just allow it if they use exactly employeeCode
            if (password === employee.employeeCode) {
                isValid = true;
                isDefaultPassword = true;

                // Optional: Migrate them immediately? 
                // Better to let them change it themselves or auto-migrate here.
                // Let's auto-migrate for security? No, let's keep it simple: 
                // just allow login, but maybe flag that they should change it.
            }
        }

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // If it was the default password (NULL in db), we might want to set it now? 
        // Or just leave it null. The req says "Set default password = employee code" on import.

        // Return user info (excluding password)
        const { password: _, ...userWithoutPassword } = employee;

        return NextResponse.json({
            user: userWithoutPassword,
            isDefaultPassword
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
