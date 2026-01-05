'use client';

import React, { useEffect, useState } from 'react';
import { EmployeeLevel, EmployeeLevelService, LevelProgress } from '@/services/employeeLevels';
import { UserLevelBadge } from './UserLevelBadge';
import { ChevronRight, Sparkles } from 'lucide-react';

interface UserLevelProgressProps {
    points: number;
    level?: EmployeeLevel; // Optional: pass stored level directly
    className?: string;
}

export const UserLevelProgress: React.FC<UserLevelProgressProps> = ({
    points,
    level,
    className = ''
}) => {
    const [progress, setProgress] = useState<LevelProgress | null>(null);

    useEffect(() => {
        const progressData = EmployeeLevelService.getLevelProgress(points);
        setProgress(progressData);
    }, [points]);

    if (!progress) {
        return <div className="animate-pulse h-40 bg-gray-100 rounded-xl"></div>;
    }

    const { currentLevel, nextLevel, progressPercent, pointsToNext, isMaxLevel, motivationMessageTh } = progress;

    return (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden ${className}`}>
            {/* Background Decoration */}
            <div
                className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${currentLevel.gradient} opacity-10 rounded-bl-full -mr-16 -mt-16 pointer-events-none`}
            />

            <div className="relative z-10">
                {/* Header: Level & Points */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Current Level
                        </h2>
                        <UserLevelBadge level={currentLevel.level} size="lg" />
                    </div>
                    <div className="text-right">
                        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Total Points
                        </h2>
                        <div
                            className="text-3xl font-black"
                            style={{ color: currentLevel.color }}
                        >
                            {points.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Progress Bar Section */}
                <div className="space-y-3">
                    {/* Progress Info */}
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 font-medium">
                            {isMaxLevel ? (
                                <span className="flex items-center gap-1 text-amber-600">
                                    <Sparkles size={14} />
                                    All Levels Unlocked!
                                </span>
                            ) : (
                                motivationMessageTh
                            )}
                        </span>
                        <span className="text-gray-400 text-xs">
                            {points.toLocaleString()} / {isMaxLevel ? '∞' : nextLevel?.minPoints.toLocaleString()}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={`h-full bg-gradient-to-r ${currentLevel.gradient} shadow-lg transition-all duration-1000 ease-out relative`}
                            style={{ width: `${progressPercent}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            {/* Shimmer effect */}
                            <div
                                className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                                style={{
                                    animation: 'shimmer 2s infinite'
                                }}
                            />
                        </div>
                    </div>

                    {/* Next Level Preview */}
                    {!isMaxLevel && nextLevel && (
                        <div className="flex justify-end">
                            <span
                                className="text-xs font-bold flex items-center gap-1"
                                style={{ color: nextLevel.color }}
                            >
                                Next: {nextLevel.icon} {nextLevel.nameTh}
                                <ChevronRight size={14} />
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* CSS for shimmer animation */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(400%); }
                }
            `}</style>
        </div>
    );
};
