import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/news/[id] - Update news
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, content, description, coverImage, updatedBy } = body;

        const existing = await prisma.news.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        const news = await prisma.news.update({
            where: { id },
            data: {
                title: title ?? existing.title,
                content: content ?? existing.content,
                description: description !== undefined ? description : existing.description,
                coverImage: coverImage !== undefined ? coverImage : existing.coverImage
            }
        });

        await prisma.auditLog.create({
            data: {
                action: 'UPDATE_NEWS',
                entityType: 'News',
                entityId: id,
                actorId: updatedBy || 'Admin',
                details: { title: news.title }
            }
        });

        return NextResponse.json(news);
    } catch (error: any) {
        console.error('Error updating news:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update news' },
            { status: 500 }
        );
    }
}

// DELETE /api/news/[id] - Delete news
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const deletedBy = searchParams.get('deletedBy') || 'Admin';

        const existing = await prisma.news.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        await prisma.news.delete({ where: { id } });

        await prisma.auditLog.create({
            data: {
                action: 'DELETE_NEWS',
                entityType: 'News',
                entityId: id,
                actorId: deletedBy,
                details: { title: existing.title }
            }
        });

        return NextResponse.json({ success: true, message: 'News deleted' });
    } catch (error: any) {
        console.error('Error deleting news:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete news' },
            { status: 500 }
        );
    }
}
