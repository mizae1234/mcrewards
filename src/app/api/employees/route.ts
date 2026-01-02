import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
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

// GET all employees (with optional search)
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const search = searchParams.get('search');

        const where = search ? {
            OR: [
                { fullname: { contains: search, mode: 'insensitive' as const } },
                { employeeCode: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
                { department: { contains: search, mode: 'insensitive' as const } }
            ]
        } : {};

        const employees = await prisma.employee.findMany({
            where,
            orderBy: { employeeCode: 'asc' }
        });
        return NextResponse.json(employees);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// CREATE employee
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { employeeCode, email, fullname, position, businessUnit, department, branch, role, quota } = body;

        const employee = await prisma.employee.create({
            data: {
                employeeCode,
                email,
                fullname,
                position,
                businessUnit,
                department,
                branch,
                role: mapRole(role),
                quota: quota || 0,
                pointsBalance: 0,
                avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullname)}`
            }
        });
        return NextResponse.json(employee, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
