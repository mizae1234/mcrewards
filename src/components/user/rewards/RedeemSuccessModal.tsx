'use client';

import React, { useEffect, useState } from 'react';
import { Modal, Button } from '@/components/common/ui';
import { CheckCircle, Gift, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RedeemSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    rewardName: string;
    pointsUsed: number;
    newBalance: number;
}

export const RedeemSuccessModal: React.FC<RedeemSuccessModalProps> = ({
    isOpen,
    onClose,
    rewardName,
    pointsUsed,
    newBalance
}) => {
    const [showConfetti, setShowConfetti] = useState(false);

    useEffect(() => {
        if (isOpen && !showConfetti) {
            setShowConfetti(true);
            // Trigger confetti animation
            const duration = 2000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 3,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.6 },
                    colors: ['#FFBC0D', '#DA291C', '#10B981', '#8B5CF6']
                });
                confetti({
                    particleCount: 3,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.6 },
                    colors: ['#FFBC0D', '#DA291C', '#10B981', '#8B5CF6']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [isOpen, showConfetti]);

    const handleClose = () => {
        setShowConfetti(false);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title=""
        >
            <div className="text-center py-4">
                {/* Success Icon */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-ping opacity-20"></div>
                    <div className="relative w-full h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="text-white" size={48} />
                    </div>
                    <div className="absolute -top-2 -right-2 animate-bounce">
                        <Sparkles className="text-amber-400" size={24} />
                    </div>
                </div>

                {/* Success Message */}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    🎉 แลกของรางวัลสำเร็จ!
                </h2>
                <p className="text-gray-500 mb-6">
                    คำขอแลกของรางวัลของคุณได้รับการบันทึกแล้ว
                </p>

                {/* Reward Info Card */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200 mb-6">
                    <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                        <Gift size={20} />
                        <span className="font-bold">{rewardName}</span>
                    </div>
                    <div className="text-sm text-amber-600">
                        หักคะแนน: <span className="font-bold">{pointsUsed.toLocaleString()}</span> คะแนน
                    </div>
                </div>

                {/* New Balance */}
                <div className="bg-gray-100 p-4 rounded-xl mb-6">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        คะแนนคงเหลือ
                    </div>
                    <div className="text-3xl font-black text-gray-900">
                        {newBalance.toLocaleString()}
                        <span className="text-sm text-gray-500 font-normal ml-1">คะแนน</span>
                    </div>
                </div>

                {/* Info */}
                <p className="text-xs text-gray-400 mb-6">
                    Points have been deducted. If rejected, points will be refunded.
                    <br />
                    You can track the status in "History" page.
                </p>

                {/* Action Button */}
                <Button onClick={handleClose} className="w-full">
                    ดำเนินการต่อ
                </Button>
            </div>
        </Modal>
    );
};
