'use client';

import React, { useEffect, useState } from 'react';
import { EmployeeLevelService, LevelProgress, LevelDefinition } from '@/services/employeeLevels';
import { UserLevelBadge } from '../rewards/UserLevelBadge';
import { Modal } from '@/components/common/ui';
import { ChevronRight, Sparkles, Lock, Check, Star } from 'lucide-react';

interface PointsCardProps {
    user: { id: string; name: string; pointsBalance: number; avatar?: string | null; level?: string };
}

export const PointsCard: React.FC<PointsCardProps> = ({ user }) => {
    const [progress, setProgress] = useState<LevelProgress | null>(null);
    const [showLevelsModal, setShowLevelsModal] = useState(false);
    const [allLevels, setAllLevels] = useState<LevelDefinition[]>([]);

    useEffect(() => {
        if (user) {
            const progressData = EmployeeLevelService.getLevelProgress(user.pointsBalance);
            setProgress(progressData);
            setAllLevels(EmployeeLevelService.getAllLevels());
        }
    }, [user, user.pointsBalance]);

    if (!progress) {
        return <div className="animate-pulse h-40 bg-gray-100 rounded-xl"></div>;
    }

    const { currentLevel, nextLevel, progressPercent, pointsToNext, isMaxLevel, motivationMessage } = progress;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
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
                            {user.pointsBalance.toLocaleString()}
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
                                motivationMessage
                            )}
                        </span>
                        <span className="text-gray-400 text-xs">
                            {user.pointsBalance.toLocaleString()} / {isMaxLevel ? '∞' : nextLevel?.minPoints.toLocaleString()}
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

                    {/* Next Level Preview - Clickable */}
                    {!isMaxLevel && nextLevel && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowLevelsModal(true)}
                                className="text-xs font-bold flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer"
                                style={{ color: nextLevel.color }}
                            >
                                Next: {nextLevel.icon} {nextLevel.name}
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* Max Level - Also clickable to see all levels */}
                    {isMaxLevel && (
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowLevelsModal(true)}
                                className="text-xs font-bold flex items-center gap-1 text-amber-600 hover:opacity-80 transition-opacity cursor-pointer"
                            >
                                <Star size={14} />
                                View All Levels
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Levels Modal */}
            <Modal
                isOpen={showLevelsModal}
                onClose={() => setShowLevelsModal(false)}
                title="ระดับพนักงานทั้งหมด"
            >
                <div className="space-y-3 py-2">
                    {allLevels.map((level, index) => {
                        const isUnlocked = user.pointsBalance >= level.minPoints;
                        const isCurrent = level.level === currentLevel.level;

                        return (
                            <div
                                key={level.level}
                                className={`relative p-4 rounded-xl border-2 transition-all ${isCurrent
                                    ? 'border-2 shadow-lg'
                                    : isUnlocked
                                        ? 'border-gray-200 bg-white'
                                        : 'border-gray-100 bg-gray-50 opacity-70'
                                    }`}
                                style={{
                                    borderColor: isCurrent ? level.color : undefined,
                                    backgroundColor: isCurrent ? `${level.color}10` : undefined
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Icon */}
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isUnlocked ? '' : 'grayscale'
                                            }`}
                                        style={{
                                            background: isUnlocked
                                                ? `linear-gradient(135deg, ${level.color}20, ${level.color}40)`
                                                : '#f3f4f6'
                                        }}
                                    >
                                        {isUnlocked ? level.icon : <Lock size={20} className="text-gray-400" />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4
                                                className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-400'}`}
                                            >
                                                {level.name}
                                            </h4>
                                            {isCurrent && (
                                                <span
                                                    className="text-xs px-2 py-0.5 rounded-full text-white font-bold"
                                                    style={{ backgroundColor: level.color }}
                                                >
                                                    ปัจจุบัน
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm ${isUnlocked ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {level.nameTh}
                                        </p>
                                    </div>

                                    {/* Points & Status */}
                                    <div className="text-right">
                                        <div
                                            className={`font-bold ${isUnlocked ? '' : 'text-gray-400'}`}
                                            style={{ color: isUnlocked ? level.color : undefined }}
                                        >
                                            {level.minPoints.toLocaleString()} PTS
                                        </div>
                                        {isUnlocked ? (
                                            <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                                                <Check size={12} /> Unlocked
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                อีก {(level.minPoints - user.pointsBalance).toLocaleString()} PTS
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Progress indicator for next level */}
                                {!isUnlocked && index === allLevels.findIndex(l => l.minPoints > user.pointsBalance) && (
                                    <div className="mt-3">
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full bg-gradient-to-r ${level.gradient}`}
                                                style={{
                                                    width: `${Math.min(100, (user.pointsBalance / level.minPoints) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Modal>

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

