'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EmployeeLevel } from '@/services/employeeLevels';
import {
    UserLevelProgress,
    RewardCard,
    RewardCardData,
    RedeemConfirmModal,
    RedeemSuccessModal
} from '@/components/user/rewards';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import { EmployeeLevelService } from '@/services/employeeLevels';
import { ShippingType } from '@/types/rewards';
import { Button } from '@/components/common/ui';
import { Filter, Grid3X3, List, RefreshCw, Search, Package, Zap } from 'lucide-react';

type FilterType = 'all' | 'physical' | 'digital' | 'accessible';

export default function UserRewardsPage() {
    const { user: currentUser, refreshUser } = useAuth();

    // State
    const [rewards, setRewards] = useState<RewardCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modal state
    const [selectedReward, setSelectedReward] = useState<RewardCardData | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastRedeemed, setLastRedeemed] = useState<{
        name: string;
        points: number;
        newBalance: number;
    } | null>(null);

    // Load rewards
    const loadRewards = useCallback(async () => {
        setLoading(true);
        try {
            const data = await RewardsCatalogApi.getRewards();
            // Transform to RewardCardData format
            const transformed: RewardCardData[] = data
                .filter(r => r.status === 'active')
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    description: r.description,
                    imageUrl: r.imageUrl,
                    pointsCost: r.pointsCost,
                    stock: r.stock,
                    isPhysical: r.isPhysical,
                    minLevelRequired: (r as any).minLevelRequired || null,
                    category: r.category
                }));
            setRewards(transformed);
        } catch (error) {
            console.error('Failed to load rewards:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRewards();
    }, [loadRewards]);

    // Get user level - calculate from points or use stored value
    const getUserLevel = (): EmployeeLevel => {
        if (!currentUser) return EmployeeLevel.RISING_STAR;
        // If user has a stored level, use it; otherwise calculate from points
        if ((currentUser as any).level) {
            return (currentUser as any).level as EmployeeLevel;
        }
        return EmployeeLevelService.getLevelByPoints(currentUser.pointsBalance).level;
    };

    // Filter rewards
    const filteredRewards = rewards.filter(reward => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!reward.name.toLowerCase().includes(query) &&
                !reward.description.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Type filter
        switch (filter) {
            case 'physical':
                return reward.isPhysical;
            case 'digital':
                return !reward.isPhysical;
            case 'accessible':
                return EmployeeLevelService.canAccessReward(getUserLevel(), reward.minLevelRequired);
            default:
                return true;
        }
    });

    // Handle redeem
    const handleRedeem = (reward: RewardCardData) => {
        setSelectedReward(reward);
    };

    const handleConfirmRedeem = async (data: {
        rewardId: string;
        shippingAddress?: string;
        contactPhone?: string;
    }) => {
        if (!currentUser || !selectedReward) return;

        await RewardsCatalogApi.createRedemptionRequest({
            rewardId: data.rewardId,
            rewardName: selectedReward.name,
            employeeCode: currentUser.employeeCode || 'UNKNOWN',
            employeeName: currentUser.name,
            businessUnit: currentUser.businessUnit || 'N/A',
            department: currentUser.department || 'N/A',
            branch: currentUser.branch || 'N/A',
            pointsUsed: selectedReward.pointsCost,
            shippingType: selectedReward.isPhysical ? ShippingType.DELIVERY : ShippingType.DIGITAL,
            shippingAddress: data.shippingAddress,
            contactPhone: data.contactPhone,
            transactionId: crypto.randomUUID()
        });

        // Set success data
        setLastRedeemed({
            name: selectedReward.name,
            points: selectedReward.pointsCost,
            newBalance: currentUser.pointsBalance - selectedReward.pointsCost
        });

        setSelectedReward(null);
        setShowSuccess(true);

        // Refresh data
        loadRewards();
        if (refreshUser) refreshUser();
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        setLastRedeemed(null);
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* User Level Progress Section */}
            <UserLevelProgress
                points={currentUser.pointsBalance}
                level={getUserLevel()}
            />

            {/* Catalog Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        🎁 แลกของรางวัล
                    </h2>
                    <p className="text-gray-500 text-sm">
                        ใช้คะแนนสะสมแลกของรางวัลมากมาย
                    </p>
                </div>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => loadRewards()}
                    disabled={loading}
                    className="flex items-center gap-2"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    รีเฟรช
                </Button>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาของรางวัล..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                    />
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'all'
                            ? 'bg-amber-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Filter size={14} className="inline mr-1" />
                        ทั้งหมด
                    </button>
                    <button
                        onClick={() => setFilter('physical')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'physical'
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Package size={14} className="inline mr-1" />
                        สินค้าจัดส่ง
                    </button>
                    <button
                        onClick={() => setFilter('digital')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'digital'
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <Zap size={14} className="inline mr-1" />
                        ดิจิทัล
                    </button>
                    <button
                        onClick={() => setFilter('accessible')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === 'accessible'
                            ? 'bg-green-500 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        ✓ แลกได้
                    </button>
                </div>

                {/* View Toggle (Desktop only) */}
                <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                    >
                        <Grid3X3 size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                    >
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Rewards Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-80"></div>
                    ))}
                </div>
            ) : filteredRewards.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">ไม่พบของรางวัล</h3>
                    <p className="text-gray-500 text-sm">
                        {searchQuery ? 'ลองค้นหาด้วยคำอื่น' : 'ยังไม่มีของรางวัลในหมวดนี้'}
                    </p>
                </div>
            ) : (
                <div className={`grid gap-6 ${viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                    }`}>
                    {filteredRewards.map(reward => (
                        <RewardCard
                            key={reward.id}
                            reward={reward}
                            userPoints={currentUser.pointsBalance}
                            userLevel={getUserLevel()}
                            onRedeem={handleRedeem}
                        />
                    ))}
                </div>
            )}

            {/* Results Count */}
            {!loading && filteredRewards.length > 0 && (
                <div className="text-center text-sm text-gray-400">
                    แสดง {filteredRewards.length} รายการ จากทั้งหมด {rewards.length} รายการ
                </div>
            )}

            {/* Modals */}
            <RedeemConfirmModal
                isOpen={!!selectedReward}
                onClose={() => setSelectedReward(null)}
                reward={selectedReward}
                userPoints={currentUser.pointsBalance}
                onConfirm={handleConfirmRedeem}
            />

            {showSuccess && lastRedeemed && (
                <RedeemSuccessModal
                    isOpen={showSuccess}
                    onClose={handleSuccessClose}
                    rewardName={lastRedeemed.name}
                    pointsUsed={lastRedeemed.points}
                    newBalance={lastRedeemed.newBalance}
                />
            )}
        </div>
    );
}
