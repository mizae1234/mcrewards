import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { UserRole } from '@prisma/client';
import * as XLSX from 'xlsx';

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

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        let created = 0;
        let updated = 0;
        const errors: string[] = [];

        for (const row of data) {
            try {
                // Map Excel columns (handle different naming conventions)
                const employeeCode = String(row['Employee Code'] || row['EmployeeCode'] || row['รหัสพนักงาน'] || '');
                const email = String(row['Email'] || row['อีเมล'] || '');
                const fullname = String(row['Fullname'] || row['Full Name'] || row['ชื่อ-สกุล'] || '');
                const position = String(row['Position'] || row['ตำแหน่ง'] || '');
                const businessUnit = String(row['BU'] || row['Business Unit'] || row['หน่วยธุรกิจ'] || '');
                const department = String(row['Department'] || row['แผนก'] || '');
                const branch = String(row['Branch'] || row['สาขา'] || '');
                const role = String(row['Role'] || row['บทบาท'] || 'Staff');
                const quota = parseInt(String(row['Quota'] || row['โควต้า'] || '0'), 10);

                if (!employeeCode || !email || !fullname) {
                    errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
                    continue;
                }

                // Upsert: create if not exists, update if exists
                const existing = await prisma.employee.findUnique({
                    where: { employeeCode }
                });

                if (existing) {
                    await prisma.employee.update({
                        where: { employeeCode },
                        data: {
                            email,
                            fullname,
                            position,
                            businessUnit,
                            department,
                            branch,
                            role: mapRole(role),
                            quota,
                            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullname)}`
                        }
                    });
                    updated++;
                } else {
                    await prisma.employee.create({
                        data: {
                            employeeCode,
                            email,
                            fullname,
                            position,
                            businessUnit,
                            department,
                            branch,
                            role: mapRole(role),
                            quota,
                            pointsBalance: 0,
                            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullname)}`
                        }
                    });
                    created++;
                }
            } catch (rowError: unknown) {
                const message = rowError instanceof Error ? rowError.message : 'Unknown error';
                errors.push(`Error processing row: ${message}`);
            }
        }

        return NextResponse.json({ created, updated, errors, total: data.length });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
