'use client';

import React from 'react';
import { EmployeeLevel, EmployeeLevelService } from '@/services/employeeLevels';
import { Card, Button, Badge } from '@/components/common/ui';
import { Package, Zap, Lock, AlertCircle } from 'lucide-react';

export interface RewardCardData {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    pointsCost: number;
    stock: number;
    isPhysical: boolean;
    minLevelRequired: EmployeeLevel | null;
    category: string;
}

interface RewardCardProps {
    reward: RewardCardData;
    userPoints: number;
    userLevel: EmployeeLevel;
    onRedeem: (reward: RewardCardData) => void;
}

export const RewardCard: React.FC<RewardCardProps> = ({
    reward,
    userPoints,
    userLevel,
    onRedeem
}) => {
    const canAfford = userPoints >= reward.pointsCost;
    const outOfStock = reward.stock <= 0;
    const hasLevelAccess = EmployeeLevelService.canAccessReward(userLevel, reward.minLevelRequired);
    const canRedeem = canAfford && !outOfStock && hasLevelAccess;

    // Get level requirement info if locked
    const unlockMessage = reward.minLevelRequired
        ? EmployeeLevelService.getUnlockMessage(reward.minLevelRequired)
        : null;

    const getButtonState = () => {
        if (outOfStock) {
            return { label: 'หมดสต็อก', disabled: true, variant: 'danger' as const };
        }
        if (!hasLevelAccess) {
            return { label: 'ระดับไม่ถึง', disabled: true, variant: 'secondary' as const };
        }
        if (!canAfford) {
            return { label: 'คะแนนไม่พอ', disabled: true, variant: 'secondary' as const };
        }
        return { label: 'แลกของรางวัล', disabled: false, variant: 'primary' as const };
    };

    const buttonState = getButtonState();

    return (
        <Card className="flex flex-col h-full group hover:shadow-lg transition-all duration-300 overflow-hidden">
            {/* Image Section */}
            <div className="h-48 overflow-hidden bg-gray-100 relative">
                <img
                    src={reward.imageUrl || '/images/placeholder-reward.png'}
                    alt={reward.name}
                    className={`w-full h-full object-cover transition-transform duration-300 ${hasLevelAccess ? 'group-hover:scale-105' : 'grayscale opacity-50'
                        }`}
                />

                {/* Physical/Digital Badge */}
                <div className="absolute top-2 left-2 flex gap-1">
                    {reward.isPhysical ? (
                        <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 backdrop-blur-sm">
                            <Package size={10} /> PHYSICAL
                        </span>
                    ) : (
                        <span className="bg-purple-600/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 backdrop-blur-sm">
                            <Zap size={10} /> DIGITAL
                        </span>
                    )}
                </div>

                {/* Out of Stock Overlay */}
                {outOfStock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 font-bold transform -rotate-12 text-lg shadow-lg">
                            หมดแล้ว
                        </span>
                    </div>
                )}

                {/* Level Lock Overlay */}
                {!hasLevelAccess && !outOfStock && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-4">
                        <div className="bg-gray-900/80 p-3 rounded-full">
                            <Lock size={24} className="text-white" />
                        </div>
                        <span className="text-white text-center text-sm font-medium">
                            {unlockMessage?.th}
                        </span>
                    </div>
                )}

                {/* Low Stock Warning */}
                {!outOfStock && reward.stock <= 5 && hasLevelAccess && (
                    <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle size={12} />
                            เหลือ {reward.stock} ชิ้น!
                        </span>
                    </div>
                )}

                {/* Level Required Badge */}
                {reward.minLevelRequired && hasLevelAccess && (
                    <div className="absolute bottom-2 left-2">
                        <span className="bg-amber-500/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm">
                            {EmployeeLevelService.getLevelDefinition(reward.minLevelRequired).icon} {EmployeeLevelService.getLevelDefinition(reward.minLevelRequired).nameTh}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-1 text-gray-900 line-clamp-1">
                    {reward.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">
                    {reward.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex flex-col">
                        <span
                            className="text-xl font-bold text-[#FFBC0D]"
                            style={{ textShadow: '0px 1px 1px rgba(0,0,0,0.1)' }}
                        >
                            {reward.pointsCost.toLocaleString()}
                        </span>
                        <span className="text-xs text-gray-400 -mt-1">
                            PTS
                        </span>
                    </div>
                    <Button
                        size="sm"
                        disabled={buttonState.disabled}
                        onClick={() => onRedeem(reward)}
                        variant={buttonState.variant}
                        className={buttonState.disabled ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        {buttonState.label}
                    </Button>
                </div>
            </div>
        </Card>
    );
};
