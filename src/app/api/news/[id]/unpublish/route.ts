import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { NewsStatus } from '@prisma/client';

// POST /api/news/[id]/unpublish - Unpublish news
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json().catch(() => ({}));
        const unpublishedBy = body.unpublishedBy || 'Admin';

        const existing = await prisma.news.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        const news = await prisma.news.update({
            where: { id },
            data: {
                status: NewsStatus.DRAFT,
                publishedAt: null
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'UNPUBLISH_NEWS',
                entityType: 'News',
                entityId: id,
                actorId: unpublishedBy,
                details: { title: news.title }
            }
        });

        return NextResponse.json({ success: true, news });
    } catch (error: any) {
        console.error('Error unpublishing news:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to unpublish news' },
            { status: 500 }
        );
    }
}
