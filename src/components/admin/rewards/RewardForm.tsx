'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RewardItem, RewardStatus } from '@/types/rewards';
import { Button, Input, Modal } from '@/components/common/ui';
import { Upload, X, Image as ImageIcon, Link, Loader2 } from 'lucide-react';

interface RewardFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (reward: RewardItem) => Promise<void>;
    initialData?: Partial<RewardItem>;
}

const RewardForm: React.FC<RewardFormProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState<Partial<RewardItem>>({});
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const data = initialData || { status: RewardStatus.ACTIVE, isPhysical: true, category: 'General' };
        setFormData(data);
        setPreviewUrl(data.imageUrl || null);
        // If editing and has imageUrl, assume URL mode
        setImageMode(data.imageUrl?.startsWith('http') ? 'url' : 'upload');
    }, [initialData, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.pointsCost || !formData.category) return;

        await onSave({
            ...formData,
            imageUrl: previewUrl || formData.imageUrl
        } as RewardItem);
        onClose();
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Allowed: jpg, png, webp, gif');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert('File too large. Max size: 5MB');
            return;
        }

        setUploading(true);

        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);
            formDataUpload.append('folder', 'rewards');

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload
            });

            const result = await response.json();

            if (result.success) {
                setPreviewUrl(result.url);
                setFormData(prev => ({ ...prev, imageUrl: result.url }));
            } else {
                alert(result.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload image');
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
        setPreviewUrl(null);
        setFormData(prev => ({ ...prev, imageUrl: '' }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData?.id ? "Edit Reward" : "Create New Reward"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                    label="Reward Name"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                />

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        type="number"
                        label="Points Cost"
                        value={formData.pointsCost || ''}
                        onChange={e => setFormData({ ...formData, pointsCost: Number(e.target.value) })}
                        required
                    />
                    <Input
                        type="number"
                        label="Stock"
                        value={formData.stock || ''}
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                        required
                    />
                </div>

                <Input
                    label="Category"
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                />

                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.isPhysical}
                            onChange={e => setFormData({ ...formData, isPhysical: e.target.checked })}
                            className="w-4 h-4 text-brand-yellow rounded focus:ring-brand-yellow"
                        />
                        <span className="text-gray-700 font-medium">Physical Item (Requires Shipping)</span>
                    </label>
                </div>

                {/* Image Upload Section */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Reward Image</label>
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
                            {previewUrl && (
                                <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={previewUrl}
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
                            {!previewUrl && (
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
                                value={formData.imageUrl || ''}
                                onChange={e => {
                                    setFormData({ ...formData, imageUrl: e.target.value });
                                    setPreviewUrl(e.target.value);
                                }}
                            />
                            {formData.imageUrl && (
                                <div className="relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={formData.imageUrl}
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

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                        className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-brand-yellow/50 focus:border-brand-yellow outline-none transition-all text-gray-900"
                        rows={3}
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="flex gap-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value as RewardStatus })}
                        className="border border-gray-300 rounded-lg p-2 text-gray-900"
                    >
                        <option value={RewardStatus.ACTIVE}>Active</option>
                        <option value={RewardStatus.INACTIVE}>Inactive</option>
                    </select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
                    <Button type="submit" disabled={uploading}>Save Reward</Button>
                </div>
            </form>
        </Modal>
    );
};

export default RewardForm;
