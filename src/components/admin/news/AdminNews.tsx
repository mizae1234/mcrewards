'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Modal, Input, Textarea } from '@/components/common/ui';
import { NewsApi, News } from '@/services/newsApi';
import { Plus, Calendar, Edit, Trash2, Eye, EyeOff, Loader2, CheckCircle, AlertTriangle, Image as ImageIcon, Upload, Link, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminNews: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [news, setNews] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    // Form modal state
    const [formModal, setFormModal] = useState<{ isOpen: boolean; editId?: string }>({ isOpen: false });
    const [formData, setFormData] = useState({ title: '', content: '', description: '', coverImage: '' });
    const [saving, setSaving] = useState(false);

    // Image upload state
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete confirmation
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; news?: News }>({ isOpen: false });

    // Messages
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadNews = async () => {
        setLoading(true);
        try {
            const data = await NewsApi.getAll(true);
            setNews(data);
        } catch (error) {
            console.error('Failed to load news:', error);
        }
        setLoading(false);
    };

    useEffect(() => { loadNews(); }, []);

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    const showError = (msg: string) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(null), 5000);
    };

    // Open create/edit modal
    const openForm = (editNews?: News) => {
        if (editNews) {
            setFormData({
                title: editNews.title,
                content: editNews.content,
                description: editNews.description || '',
                coverImage: editNews.coverImage || ''
            });
            setImageMode(editNews.coverImage?.startsWith('http') ? 'url' : 'upload');
            setFormModal({ isOpen: true, editId: editNews.id });
        } else {
            setFormData({ title: '', content: '', description: '', coverImage: '' });
            setImageMode('upload');
            setFormModal({ isOpen: true });
        }
    };

    // Image upload handlers
    const handleFileUpload = async (file: File) => {
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showError('Invalid file type. Allowed: jpg, png, webp, gif');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            showError('File too large. Max size: 5MB');
            return;
        }

        setUploading(true);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'news');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload
            });

            const result = await response.json();

            if (result.success) {
                setFormData(prev => ({ ...prev, coverImage: result.url }));
            } else {
                showError(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
        }
    };

    const clearImage = () => {
        setFormData(prev => ({ ...prev, coverImage: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Save news
    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            showError('กรุณากรอก Title และ Content');
            return;
        }
        setSaving(true);
        try {
            const adminId = currentUser?.id || 'Admin';
            if (formModal.editId) {
                await NewsApi.update(formModal.editId, { ...formData, updatedBy: adminId });
                showSuccess('อัพเดทข่าวสำเร็จ');
            } else {
                await NewsApi.create({ ...formData, createdBy: adminId });
                showSuccess('สร้างข่าวสำเร็จ');
            }
            setFormModal({ isOpen: false });
            loadNews();
        } catch (error: any) {
            showError(error.message);
        }
        setSaving(false);
    };

    // Publish/Unpublish
    const togglePublish = async (item: News) => {
        setProcessing(item.id);
        try {
            const adminId = currentUser?.id || 'Admin';
            if (item.status === 'PUBLISHED') {
                await NewsApi.unpublish(item.id, adminId);
                showSuccess('Unpublish สำเร็จ');
            } else {
                await NewsApi.publish(item.id, adminId);
                showSuccess('Publish สำเร็จ');
            }
            loadNews();
        } catch (error: any) {
            showError(error.message);
        }
        setProcessing(null);
    };

    // Delete
    const confirmDelete = async () => {
        if (!deleteModal.news) return;
        setProcessing(deleteModal.news.id);
        try {
            await NewsApi.delete(deleteModal.news.id, currentUser?.id);
            showSuccess('ลบข่าวสำเร็จ');
            setDeleteModal({ isOpen: false });
            loadNews();
        } catch (error: any) {
            showError(error.message);
        }
        setProcessing(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Success/Error Messages */}
            {successMessage && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
                    <CheckCircle size={20} /> {successMessage}
                </div>
            )}
            {errorMessage && (
                <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 z-50">
                    <AlertTriangle size={20} /> {errorMessage}
                </div>
            )}

            {/* Header */}
            <Card className="p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">News & Announcements</h2>
                        <p className="text-sm text-gray-500">Manage content visible on the Staff Dashboard</p>
                    </div>
                    <Button onClick={() => openForm()} className="bg-gray-900 text-white hover:bg-gray-800">
                        <Plus size={16} className="mr-2" /> Create News
                    </Button>
                </div>
            </Card>

            {/* News List */}
            {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
            ) : news.length === 0 ? (
                <Card className="p-12 text-center text-gray-400">
                    <p>No news yet. Click "Create News" to add your first announcement.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {news.map(item => (
                        <Card key={item.id} className="p-6">
                            <div className="flex gap-6">
                                {/* Cover Image */}
                                <div className="w-32 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.coverImage ? (
                                        <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{item.title}</h3>
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description || item.content}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${item.status === 'PUBLISHED'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {item.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                                        </span>
                                    </div>

                                    {/* Date & Actions */}
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Calendar size={14} />
                                            {item.publishedAt
                                                ? new Date(item.publishedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
                                                : 'Not scheduled'
                                            }
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => togglePublish(item)}
                                                disabled={processing === item.id}
                                                className={item.status === 'PUBLISHED'
                                                    ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                                    : 'border-green-300 text-green-600 hover:bg-green-50'
                                                }
                                            >
                                                {processing === item.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : item.status === 'PUBLISHED' ? (
                                                    <><EyeOff size={14} className="mr-1" /> Unpublish</>
                                                ) : (
                                                    <><Eye size={14} className="mr-1" /> Publish</>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openForm(item)}
                                                className="border-gray-300 text-gray-600"
                                            >
                                                <Edit size={14} className="mr-1" /> Edit
                                            </Button>
                                            <button
                                                onClick={() => setDeleteModal({ isOpen: true, news: item })}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={formModal.isOpen}
                onClose={() => !saving && setFormModal({ isOpen: false })}
                title={formModal.editId ? 'Edit News' : 'Create News'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter news title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                        <Input
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief summary for list view"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                        <Textarea
                            value={formData.content}
                            onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
                            placeholder="Full news content"
                            rows={5}
                        />
                    </div>

                    {/* Image Upload Section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Cover Image</label>
                            <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setImageMode('upload')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${imageMode === 'upload'
                                        ? 'bg-white shadow text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Upload size={12} className="inline mr-1" />
                                    Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageMode('url')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${imageMode === 'url'
                                        ? 'bg-white shadow text-gray-900'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <Link size={12} className="inline mr-1" />
                                    URL
                                </button>
                            </div>
                        </div>

                        {imageMode === 'upload' ? (
                            <div className="space-y-3">
                                {/* Preview */}
                                {formData.coverImage && (
                                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={formData.coverImage}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                        />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {/* Upload Zone */}
                                {!formData.coverImage && (
                                    <div
                                        onDragEnter={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDragOver={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`
                                            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                                            ${dragActive
                                                ? 'border-[#FFBC0D] bg-yellow-50'
                                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                            }
                                            ${uploading ? 'pointer-events-none opacity-60' : ''}
                                        `}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />

                                        {uploading ? (
                                            <div className="flex flex-col items-center">
                                                <Loader2 className="w-8 h-8 text-[#FFBC0D] animate-spin mb-2" />
                                                <span className="text-sm text-gray-500">Uploading...</span>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    Drag & drop image here
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    or click to browse
                                                </p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    JPG, PNG, WebP, GIF • Max 5MB
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Input
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.coverImage}
                                    onChange={e => setFormData(prev => ({ ...prev, coverImage: e.target.value }))}
                                />
                                {formData.coverImage && (
                                    <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                        <img
                                            src={formData.coverImage}
                                            alt="Preview"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" fill="%239ca3af" text-anchor="middle" dy=".3em">Invalid URL</text></svg>';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setFormModal({ isOpen: false })} disabled={saving || uploading}>
                            Cancel
                        </Button>
                        <Button className="flex-1 bg-brand-yellow text-brand-dark" onClick={handleSave} disabled={saving || uploading}>
                            {saving ? <><Loader2 size={16} className="mr-2 animate-spin" /> Saving...</> : 'Save'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false })}
                title="ยืนยันการลบ"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        คุณต้องการลบข่าว <strong>"{deleteModal.news?.title}"</strong> หรือไม่?
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setDeleteModal({ isOpen: false })}>
                            ยกเลิก
                        </Button>
                        <Button className="flex-1 bg-red-600 text-white hover:bg-red-700" onClick={confirmDelete} disabled={!!processing}>
                            {processing ? <Loader2 size={16} className="animate-spin" /> : 'ลบ'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default AdminNews;
