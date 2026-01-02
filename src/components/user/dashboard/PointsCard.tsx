'use client';

import React, { useEffect, useState } from 'react';
import { User } from '@/types';
import { LevelService, ProgressData } from '@/services/rewardLevels';
import { Star, Trophy, ChevronRight } from 'lucide-react';

interface PointsCardProps {
    user: User;
}

export const PointsCard: React.FC<PointsCardProps> = ({ user }) => {
    const [data, setData] = useState<ProgressData | null>(null);

    useEffect(() => {
        if (user) {
            LevelService.calculateProgress(user.pointsBalance).then(setData);
        }
    }, [user, user.pointsBalance]);

    if (!data) return <div className="animate-pulse h-40 bg-gray-100 rounded-xl"></div>;

    const { currentLevel, nextLevel, progressPercent, pointsToNext, isMaxLevel, nextThreshold } = data;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-yellow/10 to-transparent rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Current Level</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Trophy className="text-brand-yellow" size={24} />
                            <h1 className="text-2xl font-black text-gray-900">{currentLevel.title}</h1>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Points</h2>
                        <div className="text-3xl font-black text-brand-red">{user.pointsBalance.toLocaleString()}</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-gray-500">
                        <span>{isMaxLevel ? 'All Levels Unlocked!' : `${pointsToNext} points to ${nextLevel?.title}`}</span>
                        <span>{user.pointsBalance} / {isMaxLevel ? '∞' : nextThreshold}</span>
                    </div>

                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-brand-yellow to-yellow-500 shadow-lg transition-all duration-1000 ease-out relative"
                            style={{ width: `${progressPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>

                    {!isMaxLevel && (
                        <div className="flex justify-end">
                            <span className="text-xs text-brand-red font-bold flex items-center gap-1">
                                Next: {nextLevel?.name} <ChevronRight size={12} />
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
