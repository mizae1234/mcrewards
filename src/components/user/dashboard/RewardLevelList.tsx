'use client';

import React, { useEffect, useState } from 'react';
import { RewardLevel } from '@/types';
import { LevelService } from '@/services/rewardLevels';
import { Button, Modal, Input } from '@/components/common/ui';
import { Lock, Check, Loader2, CheckCircle, Gift, Package, Zap, MapPin, Phone, Eye, ChevronDown, ChevronUp } from 'lucide-react';

interface RewardLevelListProps {
    user: { id: string; name: string; pointsBalance: number; level?: string };
    onRedeemSuccess?: () => void;
}

export const RewardLevelList: React.FC<RewardLevelListProps> = ({ user, onRedeemSuccess }) => {
    const [levels, setLevels] = useState<RewardLevel[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReward, setSelectedReward] = useState<RewardLevel | null>(null);
    const [redeeming, setRedeeming] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastRedeemed, setLastRedeemed] = useState<{ name: string; points: number } | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [detailReward, setDetailReward] = useState<RewardLevel | null>(null);

    // Shipping details state
    const [shippingType, setShippingType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
    const [shippingAddress, setShippingAddress] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    useEffect(() => {
        loadLevels();
    }, []);

    const loadLevels = async () => {
        setLoading(true);
        try {
            const data = await LevelService.getLevels();
            setLevels(data);
        } catch (err) {
            console.error('Failed to load levels:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemClick = (level: RewardLevel) => {
        setSelectedReward(level);
        setError('');
        setShippingAddress('');
        setContactPhone('');
    };

    const confirmRedeem = async () => {
        if (!selectedReward) return;

        // Validate points
        if (user.pointsBalance < selectedReward.costPoints) {
            setError('คะแนนไม่เพียงพอ');
            return;
        }

        const isPhysical = (selectedReward as any).isPhysical;

        // Validate shipping details for DELIVERY only
        if (isPhysical && shippingType === 'DELIVERY' && (!shippingAddress.trim() || !contactPhone.trim())) {
            setError('กรุณากรอกที่อยู่จัดส่งและเบอร์โทรศัพท์');
            return;
        }

        // Validate phone for PICKUP
        if (isPhysical && shippingType === 'PICKUP' && !contactPhone.trim()) {
            setError('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ');
            return;
        }

        setRedeeming(true);
        setError('');

        try {
            // Call the real API to create a redeem request
            const response = await fetch('/api/rewards/redeem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId: user.id,
                    rewardId: selectedReward.id,
                    shippingType: isPhysical ? shippingType : 'DIGITAL',
                    shippingAddress: (isPhysical && shippingType === 'DELIVERY') ? shippingAddress : undefined,
                    contactPhone: isPhysical ? contactPhone : undefined
                })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'การแลกรางวัลล้มเหลว');
            }

            // Success! Show success modal
            setLastRedeemed({
                name: selectedReward.name,
                points: selectedReward.costPoints
            });
            setSelectedReward(null);
            setShippingType('DELIVERY');
            setShippingAddress('');
            setContactPhone('');
            setShowSuccess(true);

            // Notify parent and reload data
            if (onRedeemSuccess) onRedeemSuccess();
            loadLevels();
        } catch (e: any) {
            setError(e.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setRedeeming(false);
        }
    };

    const handleCloseModal = () => {
        if (!redeeming) {
            setSelectedReward(null);
            setShippingAddress('');
            setContactPhone('');
            setError('');
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 px-1">Rewards Path</h3>
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                    <span className="ml-2 text-gray-500">กำลังโหลด...</span>
                </div>
            </div>
        );
    }

    if (levels.length === 0) {
        return (
            <div className="space-y-4">
                <h3 className="font-bold text-lg text-gray-900 px-1">Rewards Path</h3>
                <div className="text-center py-8 text-gray-500">
                    ยังไม่มีของรางวัลในระบบ
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900 px-1">Rewards Path</h3>

            <div className="space-y-3">
                {(showAll ? levels : levels.slice(0, 5)).map((level, index) => {
                    const isUnlocked = user.pointsBalance >= level.minPoint;
                    const canAfford = user.pointsBalance >= level.costPoints;
                    const outOfStock = (level as any).stock <= 0;
                    const isRedeemable = isUnlocked && canAfford && level.costPoints > 0 && !outOfStock;

                    return (
                        <div
                            key={level.id}
                            className={`relative bg-white border rounded-xl overflow-hidden transition-all hover:shadow-md cursor-pointer ${isUnlocked ? 'border-gray-200 shadow-sm' : 'border-gray-100 bg-gray-50 opacity-80'
                                }`}
                            onClick={() => setDetailReward(level)}
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

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className={`font-bold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>{level.name}</h4>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{level.title} • {level.minPoint} PTS</p>
                                        </div>
                                        {isUnlocked && <Check className="text-green-500 flex-shrink-0" size={16} />}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{level.description}</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setDetailReward(level); }}
                                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1 flex items-center gap-1"
                                    >
                                        <Eye size={12} /> ดูรายละเอียด
                                    </button>
                                </div>

                                <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {outOfStock ? (
                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">หมดแล้ว</span>
                                    ) : isRedeemable ? (
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
                        </div>
                    );
                })}
            </div>

            {/* View All Button */}
            {levels.length > 5 && !showAll && (
                <div className="text-center pt-3">
                    <button
                        onClick={() => setShowAll(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                        <ChevronDown size={16} />
                        View All ({levels.length} รายการ)
                    </button>
                </div>
            )}

            {/* Show Less Button */}
            {levels.length > 5 && showAll && (
                <div className="text-center pt-3">
                    <button
                        onClick={() => setShowAll(false)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                        <ChevronUp size={16} />
                        แสดงน้อยลง
                    </button>
                </div>
            )}

            {/* Reward Detail Modal */}
            <Modal
                isOpen={!!detailReward}
                onClose={() => setDetailReward(null)}
                title="รายละเอียดของรางวัล"
            >
                {detailReward && (
                    <div className="space-y-4 py-2">
                        {/* Image */}
                        <div className="relative w-full h-48 rounded-xl overflow-hidden bg-gray-100">
                            <img
                                src={detailReward.imageUrl}
                                className="w-full h-full object-cover"
                                alt={detailReward.name}
                            />
                            <div className="absolute top-3 right-3">
                                {(detailReward as any).isPhysical ? (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Package size={12} /> จัดส่ง
                                    </span>
                                ) : (
                                    <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        <Zap size={12} /> ดิจิทัล
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                                    {detailReward.title}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{detailReward.name}</h3>
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 p-4 rounded-xl">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">รายละเอียด</h5>
                            <p className="text-gray-600 text-sm leading-relaxed">{detailReward.description}</p>
                        </div>

                        {/* Points & Stock */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                                <p className="text-xs text-amber-600 font-medium">คะแนนที่ต้องใช้</p>
                                <p className="text-xl font-bold text-amber-700">{detailReward.costPoints.toLocaleString()}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
                                <p className="text-xs text-blue-600 font-medium">ระดับขั้นต่ำ</p>
                                <p className="text-xl font-bold text-blue-700">{detailReward.minPoint.toLocaleString()} PTS</p>
                            </div>
                        </div>

                        {/* Status & Action */}
                        {(() => {
                            const isUnlocked = user.pointsBalance >= detailReward.minPoint;
                            const canAfford = user.pointsBalance >= detailReward.costPoints;
                            const outOfStock = (detailReward as any).stock <= 0;
                            const isRedeemable = isUnlocked && canAfford && detailReward.costPoints > 0 && !outOfStock;

                            return (
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        variant="secondary"
                                        className="flex-1"
                                        onClick={() => setDetailReward(null)}
                                    >
                                        ปิด
                                    </Button>
                                    {outOfStock ? (
                                        <Button className="flex-1 bg-gray-400" disabled>
                                            หมดแล้ว
                                        </Button>
                                    ) : !isUnlocked ? (
                                        <Button className="flex-1 bg-gray-400" disabled>
                                            <Lock size={14} className="mr-1" /> ต้องมี {detailReward.minPoint} PTS
                                        </Button>
                                    ) : !canAfford ? (
                                        <Button className="flex-1 bg-gray-400" disabled>
                                            คะแนนไม่พอ
                                        </Button>
                                    ) : (
                                        <Button
                                            className="flex-1 bg-brand-red hover:bg-red-700"
                                            onClick={() => {
                                                setDetailReward(null);
                                                handleRedeemClick(detailReward);
                                            }}
                                        >
                                            <Gift size={14} className="mr-1" /> แลกของรางวัล
                                        </Button>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
            </Modal>

            {/* Redeem Confirmation Modal with Shipping Details */}
            <Modal
                isOpen={!!selectedReward}
                onClose={handleCloseModal}
                title="ยืนยันการแลกของรางวัล"
            >
                <div className="text-center space-y-4 py-4">
                    {selectedReward && (
                        <>
                            {/* Reward Image */}
                            <div className="relative w-24 h-24 mx-auto rounded-xl overflow-hidden shadow-lg">
                                <img
                                    src={selectedReward.imageUrl}
                                    className="w-full h-full object-cover"
                                    alt={selectedReward.name}
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                                    {(selectedReward as any).isPhysical ? (
                                        <span className="text-white text-xs flex items-center justify-center gap-1">
                                            <Package size={10} /> จัดส่ง
                                        </span>
                                    ) : (
                                        <span className="text-white text-xs flex items-center justify-center gap-1">
                                            <Zap size={10} /> ดิจิทัล
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Reward Info */}
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{selectedReward.name}</h3>
                                <p className="text-gray-500 text-sm">{selectedReward.description}</p>
                            </div>

                            {/* Points Summary */}
                            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-4 rounded-xl border border-amber-200">
                                <div className="flex justify-center items-center gap-4">
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500 font-medium">คะแนนที่ใช้</div>
                                        <div className="text-lg font-bold text-red-600">-{selectedReward.costPoints.toLocaleString()}</div>
                                    </div>
                                    <div className="h-8 w-px bg-amber-300"></div>
                                    <div className="text-left">
                                        <div className="text-xs text-gray-500 font-medium">คะแนนคงเหลือ</div>
                                        <div className="text-lg font-bold text-green-600">
                                            {(user.pointsBalance - selectedReward.costPoints).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Form for Physical Items */}
                            {(selectedReward as any).isPhysical && (
                                <div className="text-left space-y-4 bg-blue-50 p-4 rounded-xl border border-blue-200">
                                    <h5 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                                        <MapPin size={16} />
                                        วิธีรับของรางวัล
                                    </h5>

                                    {/* DELIVERY / PICKUP Toggle */}
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShippingType('DELIVERY')}
                                            disabled={redeeming}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${shippingType === 'DELIVERY'
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                                                }`}
                                        >
                                            🚚 จัดส่งถึงบ้าน
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShippingType('PICKUP')}
                                            disabled={redeeming}
                                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${shippingType === 'PICKUP'
                                                ? 'bg-green-600 text-white border-green-600'
                                                : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                                                }`}
                                        >
                                            🏢 มารับเองที่สำนักงาน
                                        </button>
                                    </div>

                                    {/* Address - Only for DELIVERY */}
                                    {shippingType === 'DELIVERY' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                ที่อยู่จัดส่ง <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                placeholder="เลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์"
                                                value={shippingAddress}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setShippingAddress(e.target.value)}
                                                disabled={redeeming}
                                            />
                                        </div>
                                    )}

                                    {/* Pickup Notice */}
                                    {shippingType === 'PICKUP' && (
                                        <div className="bg-green-100 p-3 rounded-lg text-sm text-green-700">
                                            📍 รับของรางวัลได้ที่: <strong>สำนักงานใหญ่</strong><br />
                                            <span className="text-xs text-green-600">กรุณานำบัตรพนักงานมาแสดงเมื่อมารับ</span>
                                        </div>
                                    )}

                                    {/* Phone - Always required */}
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
                                                disabled={redeeming}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Digital Reward Notice */}
                            {!(selectedReward as any).isPhysical && (
                                <div className="text-left bg-purple-50 p-4 rounded-xl border border-purple-200">
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

                            {error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={handleCloseModal}
                                    disabled={redeeming}
                                >
                                    ยกเลิก
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={confirmRedeem}
                                    disabled={redeeming}
                                >
                                    {redeeming ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="animate-spin" size={16} />
                                            กำลังดำเนินการ...
                                        </span>
                                    ) : (
                                        'ยืนยันการแลก'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            {/* Success Modal */}
            <Modal
                isOpen={showSuccess}
                onClose={() => setShowSuccess(false)}
                title=""
            >
                <div className="text-center py-6 space-y-4">
                    <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-500" size={48} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">ส่งคำขอเรียบร้อยแล้ว!</h3>
                        <p className="text-gray-500 mt-1">
                            รายการแลกของรางวัลถูกส่งไปยังผู้ดูแลระบบ
                        </p>
                    </div>
                    {lastRedeemed && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                            <div className="flex items-center justify-center gap-2 text-green-700">
                                <Gift size={20} />
                                <span className="font-bold">{lastRedeemed.name}</span>
                            </div>
                            <p className="text-sm text-green-600 mt-1">
                                ใช้ {lastRedeemed.points.toLocaleString()} คะแนน
                            </p>
                        </div>
                    )}
                    <p className="text-sm text-gray-400">
                        Points have been deducted. If rejected, points will be refunded.
                    </p>
                    <Button
                        className="w-full"
                        onClick={() => setShowSuccess(false)}
                    >
                        เข้าใจแล้ว
                    </Button>
                </div>
            </Modal>
        </div>
    );
};
