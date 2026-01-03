import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/audit-logs - Get audit logs with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');
        const actorId = searchParams.get('actorId');
        const action = searchParams.get('action');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const where: any = {};

        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (actorId) where.actorId = actorId;
        if (action) where.action = action;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.auditLog.count({ where })
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + logs.length < total
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
