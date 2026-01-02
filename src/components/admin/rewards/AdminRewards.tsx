'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Modal } from '@/components/common/ui';
import { Reward } from '@/types';
import { RewardsApi } from '@/services/rewards';
import { Trash, Edit, Plus, AlertCircle } from 'lucide-react';
import { useConfirm } from '@/components/common/ConfirmModal';

const AdminRewards: React.FC = () => {
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingReward, setEditingReward] = useState<Partial<Reward>>({});
    const { confirm } = useConfirm();

    const loadRewards = async () => {
        setLoading(true);
        const data = await RewardsApi.getAll();
        setRewards(data);
        setLoading(false);
    };

    useEffect(() => { loadRewards(); }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        await RewardsApi.save(editingReward as Reward);
        setIsModalOpen(false);
        loadRewards();
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Reward',
            message: 'Are you sure you want to delete this reward? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });
        if (confirmed) {
            await RewardsApi.delete(id);
            loadRewards();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">Reward Catalog</h3>
                    <p className="text-sm text-gray-500">Manage items available for redemption.</p>
                </div>
                <Button onClick={() => { setEditingReward({}); setIsModalOpen(true); }}><Plus size={16} className="mr-2" /> Add Reward</Button>
            </div>

            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {rewards.map(r => (
                        <div key={r.id} className="group bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow relative overflow-hidden">
                            <div className="aspect-video w-full bg-gray-50 rounded-lg mb-3 overflow-hidden">
                                <img src={r.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt="" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 line-clamp-1">{r.name}</h4>
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1 min-h-[40px]">{r.description}</p>

                                <div className="flex justify-between items-center mt-3">
                                    <div className="text-brand-red font-black text-lg">{r.costPoints} <span className="text-xs font-normal text-gray-400">pts</span></div>
                                    <div className={`text-xs px-2 py-1 rounded-full ${r.stock < 10 ? 'bg-red-50 text-red-600 font-bold flex items-center gap-1' : 'bg-green-50 text-green-700'}`}>
                                        {r.stock < 10 && <AlertCircle size={10} />} Stock: {r.stock}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg backdrop-blur-sm shadow-sm">
                                <button className="p-2 hover:bg-gray-100 rounded-md text-gray-600" onClick={() => { setEditingReward(r); setIsModalOpen(true) }}><Edit size={16} /></button>
                                <button className="p-2 hover:bg-red-50 rounded-md text-red-600" onClick={() => handleDelete(r.id)}><Trash size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Manage Reward">
                <form onSubmit={handleSave} className="space-y-4">
                    <Input placeholder="Reward Name" value={editingReward.name || ''} onChange={e => setEditingReward({ ...editingReward, name: e.target.value })} required />
                    <Input type="number" placeholder="Cost (Points)" value={editingReward.costPoints || ''} onChange={e => setEditingReward({ ...editingReward, costPoints: +e.target.value })} required />
                    <Input type="number" placeholder="Stock" value={editingReward.stock || ''} onChange={e => setEditingReward({ ...editingReward, stock: +e.target.value })} required />
                    <Input placeholder="Image URL" value={editingReward.imageUrl || ''} onChange={e => setEditingReward({ ...editingReward, imageUrl: e.target.value })} />
                    <textarea className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-yellow/50" rows={3} placeholder="Description" value={editingReward.description || ''} onChange={e => setEditingReward({ ...editingReward, description: e.target.value })} />
                    <Button type="submit" className="w-full">Save Reward</Button>
                </form>
            </Modal>
        </div>
    );
};

export default AdminRewards;
