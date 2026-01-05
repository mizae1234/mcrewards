'use client';

import React, { useEffect, useState } from 'react';
import { RedemptionRequest, RedemptionStatus } from '@/types/rewards';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import { Button, Modal, Input } from '@/components/common/ui';
import { Check, X, Clock, Loader, Zap, Package, Truck, Building2 } from 'lucide-react';
import { useConfirm } from '@/components/common/ConfirmModal';

const RedeemRequests: React.FC = () => {
    const [requests, setRequests] = useState<RedemptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { confirm } = useConfirm();

    // Digital code modal state
    const [digitalCodeModal, setDigitalCodeModal] = useState<{ isOpen: boolean; requestId: string; rewardName: string } | null>(null);
    const [digitalCode, setDigitalCode] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const data = await RewardsCatalogApi.getRedemptions();
        setRequests(data.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const handleApprove = async (req: RedemptionRequest) => {
        // For digital rewards, open modal to input code
        if (req.shippingType === 'digital') {
            setDigitalCodeModal({ isOpen: true, requestId: req.id, rewardName: req.rewardName });
            setDigitalCode('');
            return;
        }

        // For physical rewards, just confirm
        const confirmed = await confirm({
            title: 'Approve Request',
            message: `Approve redemption of "${req.rewardName}" for ${req.employeeName}?`,
            variant: 'success',
            confirmText: 'Approve',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;

        await RewardsCatalogApi.updateRedemptionStatus(req.id, RedemptionStatus.APPROVED, 'Admin');
        loadData();
    };

    const handleDigitalApprove = async () => {
        if (!digitalCodeModal || !digitalCode.trim()) return;

        setIsSubmitting(true);
        try {
            // Call API with digital code
            const res = await fetch(`/api/admin/redeem-requests/${digitalCodeModal.requestId}/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    approvedBy: 'Admin',
                    digitalCode: digitalCode.trim()
                })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to approve');
            }

            setDigitalCodeModal(null);
            setDigitalCode('');
            loadData();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async (req: RedemptionRequest) => {
        const confirmed = await confirm({
            title: 'Reject Request',
            message: `Reject redemption of "${req.rewardName}" for ${req.employeeName}? Points will be refunded.`,
            variant: 'danger',
            confirmText: 'Reject',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;
        await RewardsCatalogApi.updateRedemptionStatus(req.id, RedemptionStatus.REJECTED, 'Admin');
        loadData();
    };

    const pendingRequests = requests.filter(r => r.status === RedemptionStatus.PENDING);
    const historyRequests = requests.filter(r => r.status !== RedemptionStatus.PENDING);

    const RequestCard = ({ req }: { req: RedemptionRequest }) => {
        const isDigital = req.shippingType === 'digital';
        const isPickup = req.shippingType === 'pickup';

        return (
            <div className="bg-white border rounded-lg p-4 mb-3">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${req.status === RedemptionStatus.PENDING ? 'bg-yellow-100 text-yellow-700' :
                                    req.status === RedemptionStatus.APPROVED ? 'bg-green-100 text-green-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                {req.status}
                            </span>

                            {/* Reward Type Badge */}
                            {isDigital ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 flex items-center gap-1">
                                    <Zap size={10} /> Digital
                                </span>
                            ) : isPickup ? (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1">
                                    <Building2 size={10} /> Pickup
                                </span>
                            ) : (
                                <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1">
                                    <Truck size={10} /> Delivery
                                </span>
                            )}

                            <span className="text-gray-500 text-xs">{new Date(req.requestedAt).toLocaleDateString()}</span>
                        </div>

                        <h4 className="font-bold text-gray-900">{req.rewardName} <span className="text-gray-500 font-normal">({req.pointsUsed} pts)</span></h4>
                        <p className="text-sm text-gray-700">
                            Requested by <span className="font-semibold">{req.employeeName}</span> ({req.employeeCode})
                        </p>
                        <p className="text-xs text-gray-500">{req.businessUnit} • {req.department}</p>

                        {/* Shipping/Pickup Info */}
                        {!isDigital && (
                            <div className="mt-2 text-xs text-gray-600">
                                {isPickup ? (
                                    <p className="flex items-center gap-1">
                                        🏢 <strong>มารับเอง</strong> - Tel: {req.contactPhone}
                                    </p>
                                ) : req.shippingAddress && (
                                    <p className="flex items-center gap-1">
                                        🚚 Ship to: {req.shippingAddress} (Tel: {req.contactPhone})
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {req.status === RedemptionStatus.PENDING && (
                        <div className="flex gap-2 mt-2 md:mt-0">
                            <button
                                onClick={() => handleReject(req)}
                                className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 text-sm hover:bg-red-50 flex items-center gap-1"
                            >
                                <X size={14} /> Reject
                            </button>
                            <button
                                onClick={() => handleApprove(req)}
                                className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center gap-1 shadow-sm"
                            >
                                <Check size={14} /> Approve
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Clock className="text-brand-yellow" size={20} />
                    Pending Approvals ({pendingRequests.length})
                </h3>
                {loading ? <Loader className="animate-spin text-gray-400" /> : (
                    <div>
                        {pendingRequests.length > 0 ? (
                            pendingRequests.map(r => <RequestCard key={r.id} req={r} />)
                        ) : (
                            <p className="text-gray-500 text-sm italic">No pending requests.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="pt-6 border-t">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Request History</h3>
                {loading ? <div /> : (
                    <div>
                        {historyRequests.length > 0 ? (
                            historyRequests.map(r => <RequestCard key={r.id} req={r} />)
                        ) : (
                            <p className="text-gray-500 text-sm italic">No history yet.</p>
                        )}
                    </div>
                )}
            </div>

            {/* Digital Code Modal */}
            <Modal
                isOpen={!!digitalCodeModal?.isOpen}
                onClose={() => setDigitalCodeModal(null)}
                title="Enter Digital Code/Link"
            >
                <div className="space-y-4">
                    <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-700">
                        <p className="font-bold">รางวัลดิจิทัล: {digitalCodeModal?.rewardName}</p>
                        <p className="text-xs mt-1">กรุณาใส่โค้ดหรือลิงก์ที่จะส่งให้พนักงาน</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Digital Code / Link <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g., GIFT-XXX-YYYY or https://..."
                            value={digitalCode}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDigitalCode(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={() => setDigitalCodeModal(null)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleDigitalApprove}
                            disabled={isSubmitting || !digitalCode.trim()}
                        >
                            {isSubmitting ? 'Approving...' : 'Approve & Send Code'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RedeemRequests;
