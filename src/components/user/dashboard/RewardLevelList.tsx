'use client';

import React, { useEffect, useState } from 'react';
import { User, RewardLevel } from '@/types';
import { LevelService } from '@/services/rewardLevels';
import { Button, Modal } from '@/components/common/ui';
import { Lock, Check, Gift } from 'lucide-react';
import { Api } from '@/services/api';

interface RewardLevelListProps {
    user: User;
    onRedeemSuccess?: () => void;
}

export const RewardLevelList: React.FC<RewardLevelListProps> = ({ user, onRedeemSuccess }) => {
    const [levels, setLevels] = useState<RewardLevel[]>([]);
    const [selectedReward, setSelectedReward] = useState<RewardLevel | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        LevelService.getLevels().then(setLevels);
    }, []);

    const handleRedeemClick = (level: RewardLevel) => {
        setSelectedReward(level);
        setError('');
    };

    const confirmRedeem = async () => {
        if (!selectedReward) return;
        setLoading(true);
        try {
            await Api.createTransaction({
                id: crypto.randomUUID(),
                type: 'REDEEM' as any, // Should update types if needed or cast
                amount: selectedReward.costPoints,
                fromUserId: undefined,
                toUserId: user.id,
                description: `Redeemed ${selectedReward.name}`,
                rewardId: selectedReward.id,
                date: new Date().toISOString()
            } as any);

            // Mock success
            if (onRedeemSuccess) onRedeemSuccess();
            setSelectedReward(null);
        } catch (e: any) {
            setError(e.message || 'Redemption failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900 px-1">Rewards Path</h3>

            <div className="space-y-3">
                {levels.map((level, index) => {
                    const isUnlocked = user.pointsBalance >= level.minPoint;
                    const isCompleted = index < levels.length - 1 && user.pointsBalance >= levels[index + 1].minPoint; // simplified logic for visual
                    // Actually, "Completed" usually refers to previous levels. 
                    // Let's stick to Locked vs Available. 
                    // But if costPoints > 0, we treat it as "Redeemable". 
                    // If costPoints == 0, it's just a badge/milestone.

                    const isRedeemable = isUnlocked && level.costPoints > 0;

                    return (
                        <div
                            key={level.id}
                            className={`relative bg-white border rounded-xl overflow-hidden transition-all ${isUnlocked ? 'border-gray-200 shadow-sm' : 'border-gray-100 bg-gray-50 opacity-80'
                                }`}
                        >
                            <div className="p-4 flex items-center gap-4">
                                <div className="flex-shrink-0 relative">
                                    <img
                                        src={level.imageUrl}
                                        className={`w-16 h-16 rounded-lg object-cover ${!isUnlocked && 'grayscale opacity-50'}`}
                                        alt={level.name}
                                    />
                                    {!isUnlocked && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-gray-900/50 p-1.5 rounded-full text-white">
                                                <Lock size={16} />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>{level.name}</h4>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{level.title} • {level.minPoint} pts</p>
                                        </div>
                                        {isUnlocked && <Check className="text-green-500" size={16} />}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{level.description}</p>
                                </div>

                                <div>
                                    {isRedeemable ? (
                                        <Button
                                            size="sm"
                                            onClick={() => handleRedeemClick(level)}
                                            className="bg-brand-red hover:bg-red-700 text-white shadow-sm"
                                        >
                                            Redeem
                                        </Button>
                                    ) : (
                                        <div className="w-20 text-center">
                                            {isUnlocked ? (
                                                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Unlocked</span>
                                            ) : (
                                                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Locked</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Unlocked Progress Line (visual connector if we wanted a timeline look) */}
                        </div>
                    );
                })}
            </div>

            {/* Redeem Modal */}
            <Modal
                isOpen={!!selectedReward}
                onClose={() => setSelectedReward(null)}
                title="Confirm Redemption"
            >
                <div className="text-center space-y-4 py-4">
                    {selectedReward && (
                        <>
                            <div className="w-20 h-20 mx-auto rounded-xl overflow-hidden shadow-md">
                                <img src={selectedReward.imageUrl} className="w-full h-full object-cover" alt="" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedReward.name}</h3>
                                <p className="text-gray-500">{selectedReward.description}</p>
                            </div>
                            <div className="bg-yellow-50 p-3 rounded-lg text-yellow-800 text-sm">
                                Cost: <strong>{selectedReward.costPoints} points</strong>
                                <br />
                                Remaining: <strong>{(user.pointsBalance - selectedReward.costPoints).toLocaleString()} points</strong>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setSelectedReward(null)}>Cancel</Button>
                                <Button className="flex-1" onClick={confirmRedeem} disabled={loading}>
                                    {loading ? 'Redeeming...' : 'Confirm Redeem'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
};
