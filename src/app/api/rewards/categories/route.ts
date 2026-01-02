import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET all active categories
export async function GET() {
    try {
        const categories = await prisma.rewardCategory.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(categories);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// CREATE new category (Admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, color, icon, createdBy } = body;

        if (!name || !createdBy) {
            return NextResponse.json(
                { error: 'Name and createdBy are required' },
                { status: 400 }
            );
        }

        const category = await prisma.rewardCategory.create({
            data: {
                name,
                description,
                color: color || '#6B7280',
                icon,
                createdBy,
                updatedBy: createdBy
            }
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
