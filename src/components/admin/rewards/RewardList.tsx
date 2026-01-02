'use client';

import React, { useEffect, useState } from 'react';
import { RewardItem, RewardStatus } from '@/types/rewards';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import { Button, Card } from '@/components/common/ui';
import { Edit, Plus, Trash, Package, Zap } from 'lucide-react';
import RewardForm from './RewardForm';
import { useConfirm } from '@/components/common/ConfirmModal';

const RewardList: React.FC = () => {
    const [rewards, setRewards] = useState<RewardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RewardItem | undefined>(undefined);
    const { confirm } = useConfirm();

    const loadData = async () => {
        setLoading(true);
        const data = await RewardsCatalogApi.getRewards();
        setRewards(data);
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (reward: RewardItem) => {
        await RewardsCatalogApi.saveReward(reward);
        loadData();
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
            await RewardsCatalogApi.deleteReward(id);
            loadData();
        }
    };

    const openCreate = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const openEdit = (item: RewardItem) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Reward Catalog</h2>
                    <p className="text-gray-500 text-sm">Manage available rewards and stock.</p>
                </div>
                <Button onClick={openCreate}><Plus size={18} className="mr-2" /> Add Reward</Button>
            </div>

            {loading ? <div className="text-center py-10">Loading...</div> : (
                <div className="grid grid-cols-1 gap-4">
                    {rewards.map(r => (
                        <div key={r.id} className="bg-white border rounded-xl p-4 flex gap-4 items-center hover:shadow-sm transition-shadow">
                            <img src={r.imageUrl} className="w-20 h-20 object-cover rounded-lg bg-gray-100" alt={r.name} />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-gray-900">{r.name}</h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${r.status === RewardStatus.ACTIVE ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {r.status}
                                    </span>
                                    {r.isPhysical ?
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 flex items-center gap-1"><Package size={10} /> Physical</span> :
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 flex items-center gap-1"><Zap size={10} /> Digital</span>
                                    }
                                </div>
                                <p className="text-sm text-gray-500">{r.category} • Cost: {r.pointsCost} pts</p>
                                <p className="text-xs text-gray-400 mt-1">Stock: {r.stock}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => openEdit(r)}><Edit size={16} /></Button>
                                <Button variant="danger" onClick={() => handleDelete(r.id)}><Trash size={16} /></Button>
                            </div>
                        </div>
                    ))}
                    {rewards.length === 0 && <div className="text-center py-10 text-gray-500">No rewards found.</div>}
                </div>
            )}

            <RewardForm
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingItem}
            />
        </div>
    );
};

export default RewardList;
