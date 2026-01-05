import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NewsStatus } from '@prisma/client';

// POST /api/news/[id]/publish - Publish news
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const publishedBy = body.publishedBy || 'Admin';

        const existing = await prisma.news.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        const news = await prisma.news.update({
            where: { id },
            data: {
                status: NewsStatus.PUBLISHED,
                publishedAt: new Date()
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'PUBLISH_NEWS',
                entityType: 'News',
                entityId: id,
                actorId: publishedBy,
                details: { title: news.title }
            }
        });

        return NextResponse.json({ success: true, news });
    } catch (error: any) {
        console.error('Error publishing news:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to publish news' },
            { status: 500 }
        );
    }
}
