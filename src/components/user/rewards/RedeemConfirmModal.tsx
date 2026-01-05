'use client';

import React, { useState } from 'react';
import { Modal, Button, Input } from '@/components/common/ui';
import { RewardCardData } from './RewardCard';
import { Package, Zap, MapPin, Phone, CheckCircle } from 'lucide-react';

interface RedeemConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    reward: RewardCardData | null;
    userPoints: number;
    onConfirm: (data: {
        rewardId: string;
        shippingAddress?: string;
        contactPhone?: string;
    }) => Promise<void>;
}

export const RedeemConfirmModal: React.FC<RedeemConfirmModalProps> = ({
    isOpen,
    onClose,
    reward,
    userPoints,
    onConfirm
}) => {
    const [shippingAddress, setShippingAddress] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleConfirm = async () => {
        if (!reward) return;

        // Validation for physical items
        if (reward.isPhysical && (!shippingAddress.trim() || !contactPhone.trim())) {
            setError('กรุณากรอกที่อยู่จัดส่งและเบอร์โทรศัพท์');
            return;
        }

        setError('');
        setIsSubmitting(true);

        try {
            await onConfirm({
                rewardId: reward.id,
                shippingAddress: reward.isPhysical ? shippingAddress : undefined,
                contactPhone: reward.isPhysical ? contactPhone : undefined
            });
            // Reset form
            setShippingAddress('');
            setContactPhone('');
        } catch (e: any) {
            setError(e.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setShippingAddress('');
            setContactPhone('');
            setError('');
            onClose();
        }
    };

    if (!reward) return null;

    const pointsAfter = userPoints - reward.pointsCost;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="ยืนยันการแลกของรางวัล"
        >
            <div className="text-center">
                {/* Reward Image */}
                <div className="relative w-32 h-32 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
                    <img
                        src={reward.imageUrl || '/images/placeholder-reward.png'}
                        alt={reward.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        {reward.isPhysical ? (
                            <span className="text-white text-xs flex items-center justify-center gap-1">
                                <Package size={12} /> สินค้าจัดส่ง
                            </span>
                        ) : (
                            <span className="text-white text-xs flex items-center justify-center gap-1">
                                <Zap size={12} /> สินค้าดิจิทัล
                            </span>
                        )}
                    </div>
                </div>

                {/* Reward Info */}
                <h4 className="text-xl font-bold text-gray-900 mb-1">{reward.name}</h4>
                <p className="text-gray-500 text-sm mb-6">{reward.description}</p>

                {/* Points Summary */}
                <div className="flex justify-center items-center gap-4 mb-6 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200">
                    <div className="text-right">
                        <div className="text-xs text-gray-400 font-bold uppercase">คะแนนที่ใช้</div>
                        <div className="font-bold text-red-600 text-xl">
                            -{reward.pointsCost.toLocaleString()}
                        </div>
                    </div>
                    <div className="h-10 w-px bg-gray-300"></div>
                    <div className="text-left">
                        <div className="text-xs text-gray-400 font-bold uppercase">คะแนนคงเหลือ</div>
                        <div className="font-bold text-green-600 text-xl">
                            {pointsAfter.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Shipping Form for Physical Items */}
                {reward.isPhysical && (
                    <div className="text-left mb-6 space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
                        <h5 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                            <MapPin size={16} />
                            กรอกข้อมูลการจัดส่ง
                        </h5>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ที่อยู่จัดส่ง <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                                value={shippingAddress}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingAddress(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="08x-xxx-xxxx"
                                    value={contactPhone}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setContactPhone(e.target.value)}
                                    className="pl-10"
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Digital Reward Notice */}
                {!reward.isPhysical && (
                    <div className="text-left mb-6 bg-purple-50 p-4 rounded-xl border border-purple-200">
                        <div className="flex items-start gap-3">
                            <CheckCircle className="text-purple-600 mt-0.5" size={20} />
                            <div>
                                <h5 className="text-sm font-bold text-purple-800">สินค้าดิจิทัล</h5>
                                <p className="text-sm text-purple-600">
                                    รหัสหรือลิงก์จะถูกส่งไปยังอีเมลของคุณหลังจากได้รับการอนุมัติ
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center pt-2">
                    <Button
                        variant="secondary"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="flex-1"
                    >
                        {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการแลก'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
