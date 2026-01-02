import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';

// Helper to map role string to enum
function mapRole(roleStr: string): UserRole {
    const roleMap: Record<string, UserRole> = {
        'admin': UserRole.Admin,
        'executive': UserRole.Executive,
        'middle management': UserRole.MiddleManagement,
        'midle management': UserRole.MiddleManagement,
        'staff': UserRole.Staff,
    };
    return roleMap[roleStr?.toLowerCase().trim()] || UserRole.Staff;
}

// GET single employee
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const employee = await prisma.employee.findUnique({
            where: { id }
        });

        if (!employee) {
            return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
        }

        return NextResponse.json(employee);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// UPDATE employee
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { employeeCode, email, fullname, position, businessUnit, department, branch, role, quota, pointsBalance } = body;

        const employee = await prisma.employee.update({
            where: { id },
            data: {
                employeeCode,
                email,
                fullname,
                position,
                businessUnit,
                department,
                branch,
                role: role ? mapRole(role) : undefined,
                quota,
                pointsBalance,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullname)}`
            }
        });
        return NextResponse.json(employee);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}

// DELETE employee
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.employee.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
