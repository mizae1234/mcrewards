import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NewsStatus } from '@prisma/client';

// GET /api/news - Get all news (Admin: all, Staff: published only)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const adminView = searchParams.get('admin') === 'true';

        const where = adminView ? {} : { status: NewsStatus.PUBLISHED };

        const news = await prisma.news.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(news);
    } catch (error: any) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch news' },
            { status: 500 }
        );
    }
}

// POST /api/news - Create news (Admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, content, description, coverImage, createdBy } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: 'Title and content are required' },
                { status: 400 }
            );
        }

        const news = await prisma.news.create({
            data: {
                title,
                content,
                description: description || null,
                coverImage: coverImage || null,
                status: NewsStatus.DRAFT,
                createdBy: createdBy || 'Admin'
            }
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE_NEWS',
                entityType: 'News',
                entityId: news.id,
                actorId: createdBy || 'Admin',
                details: { title }
            }
        });

        return NextResponse.json(news, { status: 201 });
    } catch (error: any) {
        console.error('Error creating news:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create news' },
            { status: 500 }
        );
    }
}
