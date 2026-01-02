'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Select } from '@/components/common/ui';
import { NewsItem, NewsStatus } from '@/types';
import { AdminNewsApi } from '@/services/adminNews';
import { Trash, Edit, Plus, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { useConfirm } from '@/components/common/ConfirmModal';

const AdminNews: React.FC = () => {
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<NewsItem>>({});
    const { confirm } = useConfirm();

    const loadNews = async () => {
        setLoading(true);
        const data = await AdminNewsApi.getAll();
        setNewsList(data);
        setLoading(false);
    };

    useEffect(() => { loadNews(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const itemToSave = {
            ...editingItem,
            status: editingItem.status || 'Draft',
            // Auto set publish date if published and not set
            publishDate: (editingItem.status === 'Published' && !editingItem.publishDate)
                ? new Date().toISOString()
                : editingItem.publishDate
        } as NewsItem;

        if (editingItem.id) {
            await AdminNewsApi.update(itemToSave);
        } else {
            await AdminNewsApi.create(itemToSave);
        }
        setIsModalOpen(false);
        loadNews();
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete News',
            message: 'Are you sure you want to delete this news item? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });
        if (confirmed) {
            await AdminNewsApi.delete(id);
            loadNews();
        }
    };

    const handleTogglePublish = async (item: NewsItem) => {
        const newStatus = item.status === 'Published' ? 'Draft' : 'Published';
        await AdminNewsApi.update({
            ...item,
            status: newStatus,
            publishDate: newStatus === 'Published' ? new Date().toISOString() : item.publishDate
        });
        loadNews();
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">News & Announcements</h3>
                    <p className="text-sm text-gray-500">Manage content visible on the Staff Dashboard.</p>
                </div>
                <Button onClick={() => { setEditingItem({}); setIsModalOpen(true); }}><Plus size={16} className="mr-2" /> Create News</Button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="grid gap-4">
                    {newsList.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                            <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">No Image</div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-lg text-gray-900">{item.title}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status === 'Published' ? 'bg-green-100 text-green-700' :
                                            item.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 mt-2 line-clamp-2">{item.summary}</p>
                                </div>
                                <div className="flex justify-between items-center mt-4">
                                    <div className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {item.publishDate ? new Date(item.publishDate).toLocaleDateString() : 'Not scheduled'}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => handleTogglePublish(item)}>
                                            {item.status === 'Published' ? 'Unpublish' : 'Publish'}
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setIsModalOpen(true); }}>
                                            <Edit size={14} className="mr-1" /> Edit
                                        </Button>
                                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50 border-none shadow-none" onClick={() => handleDelete(item.id)}>
                                            <Trash size={14} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {newsList.length === 0 && <div className="text-center py-10 text-gray-400">No news items found.</div>}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem.id ? 'Edit News' : 'Create News'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <Input placeholder="Title" value={editingItem.title || ''} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} required />

                    <div>
                        <label className="text-sm font-bold text-gray-700 block mb-1">Status</label>
                        <select
                            className="w-full border border-gray-300 rounded-lg p-2"
                            value={editingItem.status || 'Draft'}
                            onChange={e => setEditingItem({ ...editingItem, status: e.target.value as NewsStatus })}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                            <option value="Archived">Archived</option>
                        </select>
                    </div>

                    <Input placeholder="Image URL (Unsplash)" value={editingItem.imageUrl || ''} onChange={e => setEditingItem({ ...editingItem, imageUrl: e.target.value })} />

                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 min-h-[80px]"
                        placeholder="Short Summary"
                        value={editingItem.summary || ''}
                        onChange={e => setEditingItem({ ...editingItem, summary: e.target.value })}
                        required
                    />

                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 min-h-[150px]"
                        placeholder="Full Content"
                        value={editingItem.content || ''}
                        onChange={e => setEditingItem({ ...editingItem, content: e.target.value })}
                        required
                    />

                    <Button type="submit" className="w-full">Save News</Button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminNews;
