export interface News {
    id: string;
    title: string;
    content: string;
    description?: string | null;
    coverImage?: string | null;
    status: 'DRAFT' | 'PUBLISHED';
    publishedAt?: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export const NewsApi = {
    // Get all news (admin view = all, staff view = published only)
    getAll: async (adminView = false): Promise<News[]> => {
        const res = await fetch(`/api/news${adminView ? '?admin=true' : ''}`);
        if (!res.ok) throw new Error('Failed to fetch news');
        return res.json();
    },

    // Create news (draft)
    create: async (data: { title: string; content: string; description?: string; coverImage?: string; createdBy?: string }): Promise<News> => {
        const res = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to create news');
        }
        return res.json();
    },

    // Update news
    update: async (id: string, data: { title?: string; content?: string; description?: string; coverImage?: string; updatedBy?: string }): Promise<News> => {
        const res = await fetch(`/api/news/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to update news');
        }
        return res.json();
    },

    // Delete news
    delete: async (id: string, deletedBy?: string): Promise<void> => {
        const res = await fetch(`/api/news/${id}?deletedBy=${deletedBy || 'Admin'}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to delete news');
        }
    },

    // Publish news
    publish: async (id: string, publishedBy?: string): Promise<News> => {
        const res = await fetch(`/api/news/${id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publishedBy })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to publish news');
        }
        const data = await res.json();
        return data.news;
    },

    // Unpublish news
    unpublish: async (id: string, unpublishedBy?: string): Promise<News> => {
        const res = await fetch(`/api/news/${id}/unpublish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unpublishedBy })
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Failed to unpublish news');
        }
        const data = await res.json();
        return data.news;
    }
};
