'use client';

import React, { useEffect, useState } from 'react';
import { RedemptionRequest, RedemptionStatus, ShippingStatus, TrackingInfo } from '@/types/rewards';
import { RewardsCatalogApi } from '@/services/rewardsCatalog';
import { Button, Input, Modal } from '@/components/common/ui';
import { Truck, MapPin, CheckCircle } from 'lucide-react';
import { useConfirm } from '@/components/common/ConfirmModal';

const FulfillmentTable: React.FC = () => {
    const [items, setItems] = useState<RedemptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [trackingModal, setTrackingModal] = useState<{ isOpen: boolean, itemId?: string, current?: TrackingInfo }>({ isOpen: false });
    const [trackingInput, setTrackingInput] = useState<TrackingInfo>({ carrier: '', trackingNumber: '' });
    const { confirm } = useConfirm();

    const loadData = async () => {
        setLoading(true);
        const data = await RewardsCatalogApi.getRedemptions();
        // Filter: Approved and Requires Shipping (Not digital, Not rejected/cancelled)
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
        setTrackingInput(item.tracking || { carrier: '', trackingNumber: '' });
        setTrackingModal({ isOpen: true, itemId: item.id, current: item.tracking });
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

    const markDelivered = async (id: string) => {
        const confirmed = await confirm({
            title: 'Confirm Delivery',
            message: 'Are you sure you want to mark this item as delivered?',
            variant: 'success',
            confirmText: 'Mark Delivered',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;
        await RewardsCatalogApi.updateShippingStatus(id, ShippingStatus.DELIVERED, undefined, 'Admin');
        loadData();
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
                                <th className="px-4 py-3">Address</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Tracking</th>
                                <th className="px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-gray-900">{item.rewardName}</td>
                                    <td className="px-4 py-3">
                                        <div>{item.employeeName}</div>
                                        <div className="text-xs text-gray-500">{item.employeeCode}</div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">
                                        <MapPin size={10} className="inline mr-1" />{item.shippingAddress}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${item.shippingStatus === ShippingStatus.DELIVERED ? 'bg-green-100 text-green-700' :
                                            item.shippingStatus === ShippingStatus.SHIPPED ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {item.shippingStatus}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs">
                                        {item.tracking ? (
                                            <div>
                                                <div className="font-bold">{item.tracking.carrier}</div>
                                                <div>{item.tracking.trackingNumber}</div>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {item.shippingStatus === ShippingStatus.PENDING || item.shippingStatus === ShippingStatus.PROCESSING ? (
                                            <Button size="sm" onClick={() => openTracking(item)}>Add Tracking</Button>
                                        ) : item.shippingStatus === ShippingStatus.SHIPPED ? (
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openTracking(item)}>Edit</Button>
                                                <Button size="sm" variant="secondary" onClick={() => markDelivered(item.id)}>
                                                    <CheckCircle size={14} className="mr-1" /> Delivered
                                                </Button>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 text-xs">Completed</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">No items waiting for fulfillment.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={trackingModal.isOpen} onClose={() => setTrackingModal({ ...trackingModal, isOpen: false })} title="Update Tracking">
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
        </div>
    );
};

export default FulfillmentTable;
