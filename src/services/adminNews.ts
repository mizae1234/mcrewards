import { NewsItem, NewsStatus } from '@/types';
import seedData from '@/lib/seedAdmin.json';

const STORAGE_KEY = 'mcrewards_news';

// Initialize storage if empty
if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData.news));
}

const getNews = (): NewsItem[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveNews = (news: NewsItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(news));
};

export const AdminNewsApi = {
    getAll: async (): Promise<NewsItem[]> => {
        return new Promise((resolve) => {
            setTimeout(() => resolve(getNews()), 500);
        });
    },

    getPublished: async (): Promise<NewsItem[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const published = getNews().filter(n => n.status === 'Published');
                resolve(published);
            }, 300);
        });
    },

    create: async (item: Omit<NewsItem, 'id'>): Promise<NewsItem> => {
        const newItem = { ...item, id: crypto.randomUUID() };
        const news = getNews();
        saveNews([newItem, ...news]);
        return newItem;
    },

    update: async (item: NewsItem): Promise<NewsItem> => {
        const news = getNews();
        const index = news.findIndex(n => n.id === item.id);
        if (index !== -1) {
            news[index] = item;
            saveNews(news);
        }
        return item;
    },

    delete: async (id: string): Promise<void> => {
        const news = getNews().filter(n => n.id !== id);
        saveNews(news);
    }
};
