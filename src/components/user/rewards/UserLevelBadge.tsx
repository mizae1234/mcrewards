'use client';

import React from 'react';
import { EmployeeLevel, EmployeeLevelService, LevelDefinition } from '@/services/employeeLevels';

interface UserLevelBadgeProps {
    level: EmployeeLevel;
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
    className?: string;
}

export const UserLevelBadge: React.FC<UserLevelBadgeProps> = ({
    level,
    size = 'md',
    showName = true,
    className = ''
}) => {
    const levelDef = EmployeeLevelService.getLevelDefinition(level);

    const sizeClasses = {
        sm: {
            container: 'px-2 py-1',
            icon: 'text-sm',
            text: 'text-xs',
            glow: 'blur-[2px]'
        },
        md: {
            container: 'px-3 py-1.5',
            icon: 'text-lg',
            text: 'text-sm',
            glow: 'blur-[4px]'
        },
        lg: {
            container: 'px-4 py-2',
            icon: 'text-2xl',
            text: 'text-base',
            glow: 'blur-[6px]'
        }
    };

    const s = sizeClasses[size];

    // Higher levels get more prominent glow
    const showGlow = levelDef.order >= 4;

    return (
        <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
            {/* Glow effect for higher levels */}
            {showGlow && (
                <div
                    className={`absolute inset-0 bg-gradient-to-r ${levelDef.gradient} rounded-full opacity-40 ${s.glow} animate-pulse`}
                    style={{ transform: 'scale(1.1)' }}
                />
            )}

            <div
                className={`relative inline-flex items-center gap-1.5 ${s.container} rounded-full bg-gradient-to-r ${levelDef.gradient} text-white font-bold shadow-lg`}
            >
                <span className={s.icon}>{levelDef.icon}</span>
                {showName && (
                    <span className={`${s.text} font-semibold whitespace-nowrap`}>
                        {levelDef.name}
                    </span>
                )}
            </div>
        </div>
    );
};

interface UserLevelBadgeThProps {
    level: EmployeeLevel;
    size?: 'sm' | 'md' | 'lg';
    showName?: boolean;
    className?: string;
}

export const UserLevelBadgeTh: React.FC<UserLevelBadgeThProps> = ({
    level,
    size = 'md',
    showName = true,
    className = ''
}) => {
    const levelDef = EmployeeLevelService.getLevelDefinition(level);

    const sizeClasses = {
        sm: {
            container: 'px-2 py-1',
            icon: 'text-sm',
            text: 'text-xs',
            glow: 'blur-[2px]'
        },
        md: {
            container: 'px-3 py-1.5',
            icon: 'text-lg',
            text: 'text-sm',
            glow: 'blur-[4px]'
        },
        lg: {
            container: 'px-4 py-2',
            icon: 'text-2xl',
            text: 'text-base',
            glow: 'blur-[6px]'
        }
    };

    const s = sizeClasses[size];
    const showGlow = levelDef.order >= 4;

    return (
        <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
            {showGlow && (
                <div
                    className={`absolute inset-0 bg-gradient-to-r ${levelDef.gradient} rounded-full opacity-40 ${s.glow} animate-pulse`}
                    style={{ transform: 'scale(1.1)' }}
                />
            )}

            <div
                className={`relative inline-flex items-center gap-1.5 ${s.container} rounded-full bg-gradient-to-r ${levelDef.gradient} text-white font-bold shadow-lg`}
            >
                <span className={s.icon}>{levelDef.icon}</span>
                {showName && (
                    <span className={`${s.text} font-semibold whitespace-nowrap`}>
                        Lv.{levelDef.order} {levelDef.nameTh}
                    </span>
                )}
            </div>
        </div>
    );
};
