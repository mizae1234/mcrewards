'use client';

import React, { useEffect, useState } from 'react';
import { RedemptionRequest, RedemptionStatus, ShippingStatus, TrackingInfo } from '@/types/rewards';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import { Button, Input, Modal, Textarea } from '@/components/common/ui';
import { Truck, MapPin, CheckCircle, Building2, Package, RotateCcw } from 'lucide-react';
import { useConfirm } from '@/components/common/ConfirmModal';

const FulfillmentTable: React.FC = () => {
    const [items, setItems] = useState<RedemptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingModal, setTrackingModal] = useState<{ isOpen: boolean, itemId?: string, current?: TrackingInfo, isPickup?: boolean }>({ isOpen: false });
    const [trackingInput, setTrackingInput] = useState<TrackingInfo>({ carrier: '', trackingNumber: '' });
    const [returnModal, setReturnModal] = useState<{ isOpen: boolean, itemId?: string, itemName?: string }>({ isOpen: false });
    const [returnReason, setReturnReason] = useState('');
    const [returnLoading, setReturnLoading] = useState(false);
    const { confirm } = useConfirm();

    const loadData = async () => {
        setLoading(true);
        const data = await RewardsCatalogApi.getRedemptions();
        // Filter: Approved and Requires Fulfillment (Not digital, Not rejected/cancelled)
        const toFulfill = data.filter(r =>
            r.status === RedemptionStatus.APPROVED &&
            r.shippingType !== 'digital' &&
            r.shippingStatus !== ShippingStatus.RETURNED
        );
        setItems(toFulfill.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    const openTracking = (item: RedemptionRequest) => {
        const isPickup = item.shippingType === 'pickup';
        setTrackingInput(item.tracking || { carrier: isPickup ? 'มารับเอง' : '', trackingNumber: '' });
        setTrackingModal({ isOpen: true, itemId: item.id, current: item.tracking, isPickup });
    };

    const saveTracking = async () => {
        if (!trackingModal.itemId) return;

        await RewardsCatalogApi.updateShippingStatus(
            trackingModal.itemId,
            ShippingStatus.SHIPPED,
            { ...trackingInput, shippedAt: new Date().toISOString() },
            'Admin'
        );
        setTrackingModal({ isOpen: false });
        loadData();
    };

    // For PICKUP: Mark as ready for pickup (shipped = ready)
    const markReadyForPickup = async (id: string) => {
        const confirmed = await confirm({
            title: 'พร้อมให้มารับ',
            message: 'ยืนยันว่าของรางวัลพร้อมให้พนักงานมารับ?',
            variant: 'success',
            confirmText: 'พร้อมรับ',
            cancelText: 'ยกเลิก'
        });
        if (!confirmed) return;
        await RewardsCatalogApi.updateShippingStatus(id, ShippingStatus.SHIPPED, { carrier: 'มารับเอง', trackingNumber: '-' }, 'Admin');
        loadData();
    };

    const markDelivered = async (id: string, isPickup: boolean) => {
        const confirmed = await confirm({
            title: isPickup ? 'ยืนยันการรับของ' : 'Confirm Delivery',
            message: isPickup ? 'ยืนยันว่าพนักงานมารับของรางวัลแล้ว?' : 'Are you sure you want to mark this item as delivered?',
            variant: 'success',
            confirmText: isPickup ? 'รับของแล้ว' : 'Mark Delivered',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;
        await RewardsCatalogApi.updateShippingStatus(id, ShippingStatus.DELIVERED, undefined, 'Admin');
        loadData();
    };

    const openReturnModal = (item: RedemptionRequest) => {
        setReturnReason('');
        setReturnModal({ isOpen: true, itemId: item.id, itemName: item.rewardName });
    };

    const confirmReturn = async () => {
        if (!returnModal.itemId || !returnReason.trim()) {
            alert('กรุณาระบุสาเหตุการตีกลับ');
            return;
        }

        setReturnLoading(true);
        try {
            await RewardsCatalogApi.updateShippingStatus(
                returnModal.itemId,
                ShippingStatus.RETURNED,
                undefined,
                'Admin',
                returnReason.trim()
            );
            setReturnModal({ isOpen: false });
            loadData();
        } catch (error) {
            console.error('Failed to mark as returned:', error);
            alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกการตีกลับได้');
        } finally {
            setReturnLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Truck className="text-brand-red" size={20} /> Fulfillment & Shipping
            </h3>

            {loading ? <div className="text-center">Loading...</div> : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                            <tr>
                                <th className="px-4 py-3">Item</th>
                                <th className="px-4 py-3">Recipient</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Address/Contact</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => {
                                const isPickup = item.shippingType === 'pickup';
                                return (
                                    <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{item.rewardName}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-gray-900">{item.employeeName}</div>
                                            <div className="text-xs text-gray-600">{item.employeeCode}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isPickup ? (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                                                    <Building2 size={12} /> Pickup
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 flex items-center gap-1 w-fit">
                                                    <Truck size={12} /> Delivery
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px]">
                                            {isPickup ? (
                                                <div>
                                                    <div className="text-gray-600">📞 {item.contactPhone || '-'}</div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="truncate"><MapPin size={10} className="inline mr-1 text-gray-500" />{item.shippingAddress || '-'}</div>
                                                    <div className="text-xs text-gray-500">📞 {item.contactPhone || '-'}</div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.shippingStatus === ShippingStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                                                item.shippingStatus === ShippingStatus.SHIPPED ? 'bg-blue-100 text-blue-700' :
                                                    item.shippingStatus === ShippingStatus.RETURNED ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {isPickup ? (
                                                    item.shippingStatus === ShippingStatus.DELIVERED ? 'DELIVERED' :
                                                        item.shippingStatus === ShippingStatus.SHIPPED ? 'READY' :
                                                            item.shippingStatus === ShippingStatus.RETURNED ? 'RETURNED' :
                                                                'PROCESSING'
                                                ) : (
                                                    item.shippingStatus === ShippingStatus.RETURNED ? 'RETURNED' : item.shippingStatus
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {isPickup ? (
                                                // PICKUP flow: Ready -> Picked Up
                                                item.shippingStatus === ShippingStatus.PENDING || item.shippingStatus === ShippingStatus.PROCESSING ? (
                                                    <Button size="sm" onClick={() => markReadyForPickup(item.id)}>
                                                        <Package size={14} className="mr-1" /> พร้อมรับ
                                                    </Button>
                                                ) : item.shippingStatus === ShippingStatus.SHIPPED ? (
                                                    <div className="flex gap-2">
                                                        <Button size="sm" variant="secondary" onClick={() => markDelivered(item.id, true)}>
                                                            <CheckCircle size={14} className="mr-1" /> รับของแล้ว
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openReturnModal(item)}>
                                                            <RotateCcw size={14} className="mr-1" /> ตีกลับ
                                                        </Button>
                                                    </div>
                                                ) : item.shippingStatus === ShippingStatus.DELIVERED ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 text-xs">Completed</span>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openReturnModal(item)}>
                                                            <RotateCcw size={14} className="mr-1" /> ตีกลับ
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Completed</span>
                                                )
                                            ) : (
                                                // DELIVERY flow: Add Tracking -> Delivered
                                                item.shippingStatus === ShippingStatus.PENDING || item.shippingStatus === ShippingStatus.PROCESSING ? (
                                                    <Button size="sm" onClick={() => openTracking(item)}>Add Tracking</Button>
                                                ) : item.shippingStatus === ShippingStatus.SHIPPED ? (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <Button size="sm" variant="outline" onClick={() => openTracking(item)}>Edit</Button>
                                                        <Button size="sm" variant="secondary" onClick={() => markDelivered(item.id, false)}>
                                                            <CheckCircle size={14} className="mr-1" /> Delivered
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openReturnModal(item)}>
                                                            <RotateCcw size={14} className="mr-1" /> Return
                                                        </Button>
                                                    </div>
                                                ) : item.shippingStatus === ShippingStatus.DELIVERED ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 text-xs">Completed</span>
                                                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => openReturnModal(item)}>
                                                            <RotateCcw size={14} className="mr-1" /> Return
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Completed</span>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">No items waiting for fulfillment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tracking Modal - Only for DELIVERY */}
            <Modal isOpen={trackingModal.isOpen && !trackingModal.isPickup} onClose={() => setTrackingModal({ ...trackingModal, isOpen: false })} title="Update Tracking">
                <div className="space-y-4">
                    <div>
                        <Input
                            placeholder="Carrier (e.g. Kerry, Flash)"
                            value={trackingInput.carrier}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingInput({ ...trackingInput, carrier: e.target.value })}
                        />
                    </div>
                    <div>
                        <Input
                            placeholder="Tracking Number"
                            value={trackingInput.trackingNumber}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTrackingInput({ ...trackingInput, trackingNumber: e.target.value })}
                        />
                    </div>
                    <Button className="w-full" onClick={saveTracking}>Update Status to SHIPPED</Button>
                </div>
            </Modal>

            {/* Return Reason Modal */}
            <Modal isOpen={returnModal.isOpen} onClose={() => setReturnModal({ isOpen: false })} title="ระบุสาเหตุการตีกลับ/ส่งคืน">
                <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                        <strong>รายการ:</strong> {returnModal.itemName}
                        <p className="mt-1 text-red-600 text-xs">
                            * คะแนนจะถูกคืนให้พนักงานอัตโนมัติ และ Stock จะถูกคืน
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            สาเหตุการตีกลับ <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                            placeholder="เช่น ที่อยู่ไม่ถูกต้อง, พนักงานไม่มารับ, สินค้าเสียหาย..."
                            value={returnReason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReturnReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setReturnModal({ isOpen: false })}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={confirmReturn}
                            disabled={returnLoading || !returnReason.trim()}
                        >
                            {returnLoading ? 'กำลังบันทึก...' : 'ยืนยันตีกลับ'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FulfillmentTable;
